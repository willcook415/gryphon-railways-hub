"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  Home,
  LifeBuoy,
  Settings,
  ShieldAlert,
  TestTube2,
  Users,
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { getSubteamLabel } from "@/lib/team-options";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "email" | "full_name" | "preferred_name" | "role" | "subteam" | "is_active"
>;

type ShellProfile = Profile | null;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/faults", label: "Faults", icon: ShieldAlert },
  { href: "/testing", label: "Testing", icon: TestTube2 },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/onboarding", label: "Onboarding", icon: LifeBuoy },
  { href: "/telemetry", label: "Telemetry", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: Settings },
] as const;

const adminItem = { href: "/admin/members", label: "Admin", icon: Users };

function formatValue(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function NavLink({
  href,
  label,
  icon: Icon,
  compact = false,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-300 hover:bg-slate-800 hover:text-white",
        compact && "min-w-24 flex-col justify-center gap-1 px-2 text-xs"
      )}
      href={href}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  profile,
  email,
}: {
  children: ReactNode;
  profile: ShellProfile;
  email: string | null;
}) {
  const isAdmin = profile?.role === "admin" || profile?.role === "exec";
  const displayName =
    profile?.preferred_name ?? profile?.full_name ?? email ?? "Team member";
  const visibleNavItems = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] bg-slate-100 lg:bg-white">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800 bg-[linear-gradient(180deg,#06142f_0%,#08111f_55%,#020617_100%)] px-4 py-5 text-white lg:flex">
          <Link className="mb-7 flex items-center gap-3 px-2" href="/dashboard">
            <span className="flex size-12 items-center justify-center rounded-lg border border-white/10 bg-white p-1.5 shadow-sm">
              <Image
                alt="Gryphon Railways logo"
                className="h-full w-full object-contain"
                height={40}
                priority
                src="/gr-logo.png"
                width={40}
              />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-wide">
                Gryphon Hub
              </span>
              <span className="block text-xs text-slate-400">
                Railways operations
              </span>
            </span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {visibleNavItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/80 p-3 shadow-sm">
            <p className="truncate text-sm font-medium text-white">
              {displayName}
            </p>
            <p className="mt-1 truncate text-xs text-slate-400">
              {email ?? "No email"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
                {formatValue(profile?.role)}
              </span>
              <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
                {getSubteamLabel(profile?.subteam)}
              </span>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex min-h-12 items-center justify-between gap-3">
              <Link
                className="flex items-center gap-3 text-slate-950 lg:hidden"
                href="/dashboard"
              >
                <span className="flex size-11 items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm">
                  <Image
                    alt="Gryphon Railways logo"
                    className="h-full w-full object-contain"
                    height={36}
                    priority
                    src="/gr-logo.png"
                    width={36}
                  />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    Gryphon Hub
                  </span>
                  <span className="block text-xs text-slate-500">
                    {formatValue(profile?.role)}
                  </span>
                </span>
              </Link>

              <div className="hidden min-w-0 lg:block">
                <p className="text-sm font-medium text-slate-950">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500">
                  {formatValue(profile?.role)} ·{" "}
                  {getSubteamLabel(profile?.subteam)}
                </p>
              </div>

              <LogoutButton />
            </div>
          </header>

          <main className="flex-1 px-4 py-5 pb-28 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950 px-2 py-2 lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {visibleNavItems.map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}

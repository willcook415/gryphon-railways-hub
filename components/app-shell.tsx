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
import {
  getMemberDisplayName,
  getMemberDisplayTitle,
} from "@/lib/member-display";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "email"
  | "full_name"
  | "preferred_name"
  | "role"
  | "subteam"
  | "team_title"
  | "is_active"
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
        "flex min-h-12 items-center gap-3 rounded-md border border-transparent px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "border-ring/15 bg-accent text-primary shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
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
  const displayName = getMemberDisplayName(profile, email);
  const displayTitle = getMemberDisplayTitle(profile);
  const visibleNavItems = isAdmin ? [...navItems, adminItem] : navItems;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] bg-background">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card px-4 py-5 lg:flex">
          <Link className="mb-7 flex items-center gap-3 px-2" href="/dashboard">
            <Image
              alt="Gryphon Railways logo"
              className="h-14 w-auto object-contain"
              height={56}
              priority
              src="/gr-logo.png"
              width={74}
            />
            <span>
              <span className="block text-base font-semibold tracking-wide text-foreground">
                Gryphon Railways Hub
              </span>
              
            </span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {visibleNavItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-border bg-muted/40 p-3">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {displayTitle}
            </p>
            {email ? (
              <p className="mt-3 truncate text-xs text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:px-8">
            <div className="flex min-h-12 items-center justify-between gap-3">
              <Link
                className="flex items-center gap-3 text-foreground lg:hidden"
                href="/dashboard"
              >
                <Image
                  alt="Gryphon Railways logo"
                  className="h-12 w-auto object-contain"
                  height={48}
                  priority
                  src="/gr-logo.png"
                  width={64}
                />
                <span>
                  <span className="block text-sm font-semibold">
                    Gryphon Railways Hub
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {displayTitle}
                  </span>
                </span>
              </Link>

              <div className="hidden min-w-0 lg:block">
                <p className="text-sm font-medium text-foreground">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {displayTitle}
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

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-2 py-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {visibleNavItems.map((item) => (
            <NavLink key={item.href} {...item} compact />
          ))}
        </div>
      </nav>
    </div>
  );
}

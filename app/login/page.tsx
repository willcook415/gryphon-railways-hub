import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { MobileInstallPrompt } from "@/components/mobile-install-prompt";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-950 text-white">
      <div
        className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-5"
        style={{
          paddingBottom:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-bottom))",
          paddingTop:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-top))",
        }}
      >
        <section className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-7 shadow-2xl shadow-black/20 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-14 items-center justify-center rounded-md border border-slate-800 bg-slate-950 p-2">
              <Image
                alt="Gryphon Railways logo"
                className="h-full w-full object-contain"
                height={56}
                priority
                src="/gr-logo.png"
                width={56}
              />
            </div>
            <p className="mt-4 text-xl font-semibold tracking-tight">
              Gryphon Hub
            </p>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">
              Enter your team email and password to continue.
            </p>
          </div>

          {params.error ? (
            <div className="mt-5 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm leading-6 text-red-200">
              {params.error}
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-5 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm leading-6 text-slate-200">
              {params.message}
            </div>
          ) : null}

          <div className="mt-6">
            <LoginForm />
          </div>
        </section>

        <MobileInstallPrompt />
      </div>
    </main>
  );
}

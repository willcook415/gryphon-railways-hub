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
    <main className="min-h-dvh overflow-x-hidden bg-background text-foreground">
      <div
        className="flex min-h-dvh w-full flex-col items-center justify-center gap-5 px-5"
        style={{
          paddingBottom:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-bottom))",
          paddingTop:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-top))",
        }}
      >
        <section className="w-full max-w-md rounded-xl border border-border bg-card p-7 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <Image
              alt="Gryphon Railways logo"
              className="h-24 w-auto object-contain"
              height={96}
              priority
              src="/gr-logo.png"
              width={128}
            />
            <p className="mt-5 text-xl font-semibold tracking-tight text-foreground">
              Gryphon Railways Hub
            </p>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Enter your University of Leeds email and password to continue.
            </p>
          </div>

          {params.error ? (
            <div className="mt-5 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
              {params.error}
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-5 rounded-md border border-border bg-muted px-3 py-2 text-sm leading-6 text-foreground">
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

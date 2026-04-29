import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
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
    <main
      className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#071625] bg-[linear-gradient(180deg,#081827_0%,#071625_56%,#061321_100%)] text-[#f4f7fa] [font-family:-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text','Inter','Segoe_UI',sans-serif]"
    >
      <div
        className="flex min-h-full w-full items-center justify-center"
        style={{
          paddingBottom:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-bottom))",
          paddingTop:
            "calc(clamp(20px, 4vw, 48px) + env(safe-area-inset-top))",
        }}
      >
        <section
          className="min-w-0 rounded-[26px] border border-white/10 bg-[#0d2034] p-[clamp(24px,4vw,48px)] shadow-[0_22px_56px_rgba(0,0,0,0.22)]"
          style={{ width: "min(640px, calc(100vw - 80px))" }}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#091a2c] p-2 sm:size-20 sm:p-2.5">
              <Image
                alt="Gryphon Railways logo"
                className="h-full w-full object-contain"
                height={96}
                priority
                src="/gr-logo.png"
                width={96}
              />
            </div>
            <p className="text-3xl font-semibold tracking-tight text-[#e2c477] sm:text-[2.5rem]">
              Gryphon Hub
            </p>
          </div>

          <div className="mt-8 space-y-3 sm:mt-9">
            <h1 className="text-[2rem] font-semibold leading-tight tracking-tight text-[#f4f7fa] sm:text-[2.45rem]">
              Welcome to Gryphon Hub
            </h1>
            <p className="max-w-[34rem] text-base leading-7 text-[#aebbcc] sm:text-lg sm:leading-8">
              Internal operations, safety, testing, and team coordination for
              Gryphon Railways.
            </p>
          </div>

          {params.error ? (
            <div className="mt-6 rounded-xl border border-red-200/20 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
              {params.error}
            </div>
          ) : null}

          {params.message ? (
            <div className="mt-6 rounded-xl border border-[#d8b76a]/25 bg-[#d8b76a]/10 px-4 py-3 text-sm leading-6 text-[#e2c477]">
              {params.message}
            </div>
          ) : null}

          <div className="mt-7 sm:mt-8">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

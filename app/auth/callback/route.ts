import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "This authentication callback could not be verified. Please log in with email and password."
        )}`,
        requestUrl.origin
      )
    );
  }

  const callbackError =
    requestUrl.searchParams.get("error_description") ??
    "This authentication callback is incomplete. Please log in with email and password.";

  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(callbackError)}`, requestUrl.origin)
  );
}

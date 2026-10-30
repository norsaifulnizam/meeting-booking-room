import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function sessionCookieOptions(options: CookieOptions) {
  if (options.maxAge === 0) return options;
  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));

  const nextPath = url.searchParams.get("next") === "/reset-password" ? "/reset-password" : "/";
  const response = NextResponse.redirect(new URL(nextPath, url.origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.headers.get("cookie")?.split(";").map((entry) => {
          const [name, ...parts] = entry.trim().split("=");
          return { name, value: parts.join("=") };
        }) ?? [],
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookieOptions(options)));
        },
      },
    },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=confirmation", url.origin));
  return response;
}

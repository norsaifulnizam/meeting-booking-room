import { createBrowserClient } from "@supabase/ssr";

function browserCookies() {
  return {
    getAll() {
      if (typeof document === "undefined") return [];
      return document.cookie
        .split("; ")
        .filter(Boolean)
        .map((entry) => {
          const index = entry.indexOf("=");
          return { name: entry.slice(0, index), value: entry.slice(index + 1) };
        });
    },
    setAll(cookies: { name: string; value: string; options: { maxAge?: number } }[]) {
      cookies.forEach(({ name, value, options }) => {
        const parts = [`${name}=${value}`, "Path=/", "SameSite=Lax"];
        if (window.location.protocol === "https:") parts.push("Secure");
        if (options.maxAge === 0) parts.push("Max-Age=0");
        document.cookie = parts.join("; ");
      });
    },
  };
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: browserCookies() },
  );
}

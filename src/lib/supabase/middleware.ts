import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isEmailConfirmed } from "@/lib/auth/email-confirmed";
import type { Database } from "@/lib/supabase/types";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/projects",
  "/validations",
  "/reputation",
  "/discover",
  "/admin",
];

const CONTRIBUTE_PATHS = [
  /^\/projects\/new$/,
  /^\/projects\/[^/]+\/edit$/,
  /^\/validations\/new$/,
  /^\/validations\/[^/]+\/review$/,
];

function isContributePath(pathname: string) {
  return CONTRIBUTE_PATHS.some((pattern) => pattern.test(pathname));
}

function forwardRequest(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-alvora-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = forwardRequest(request);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
            supabaseResponse = forwardRequest(request);
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (user && !isEmailConfirmed(user)) {
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "unconfirmed");
    url.searchParams.delete("next");
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("account_status")
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();
    const status =
      typeof profileRow?.account_status === "string"
        ? profileRow.account_status
        : "active";

    if (status === "banned") {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "banned");
      url.searchParams.delete("next");
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }

    if (status === "suspended" && isContributePath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/support";
      url.searchParams.set("restricted", "1");
      return NextResponse.redirect(url);
    }
  }

  const authOnlyRoutes = ["/login", "/register", "/forgot-password"];
  if (user && authOnlyRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

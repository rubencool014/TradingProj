import { NextResponse } from "next/server";

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ["/", "/explore", "/sign-in", "/sign-up"];

  // Protected routes that require authentication
  const protectedPaths = ["/trade", "/portfolio", "/account"];
  const adminPaths = [
    "/admin",
    "/admin/trades",
    "/admin/users",
    "/admin/manage",
  ];

  // Skip middleware for api routes and static files
  if (
    path.includes(".") || // static files
    path.startsWith("/_next") || // next.js files
    path.startsWith("/api") // api routes
  ) {
    return NextResponse.next();
  }

  // Get the token from the cookies
  const token = request.cookies.get("session");
  const isAdmin = request.cookies.get("isAdmin");

  // If user is an admin, only allow access to admin routes and public paths
  if (isAdmin?.value === "true") {
    // Allow access to admin routes and public paths (except sign-in/sign-up)
    if (
      adminPaths.some((prefix) => path.startsWith(prefix)) ||
      (publicPaths.includes(path) && !path.includes("sign-"))
    ) {
      return NextResponse.next();
    }
    // Redirect to admin dashboard for all other routes
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // If accessing an admin route without admin privileges, redirect to sign-in
  const isAdminPath = adminPaths.some((prefix) => path.startsWith(prefix));
  if (isAdminPath) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Allow access to public paths without authentication
  if (publicPaths.includes(path)) {
    // If user is already logged in and tries to access sign-in/sign-up pages
    if ((path === "/sign-in" || path === "/sign-up") && token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // If accessing a protected route without a token, redirect to sign-in
  const isProtectedPath = protectedPaths.some((prefix) =>
    path.startsWith(prefix)
  );
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

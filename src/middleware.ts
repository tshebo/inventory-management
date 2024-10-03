import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const authCookie = req.cookies.get("authStatus")?.value;
  const roleCookie = req.cookies.get("userRole")?.value;

  const protectedRoutes = ["/admin", "/dashboard"];
  const adminOnlyRoutes = ["/admin"];
  const currentPath = req.nextUrl.pathname;

  // If it's a protected route and there's no auth cookie, redirect to sign in
  if (protectedRoutes.includes(currentPath) && !authCookie) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // If it's an admin-only route and the user isn't an admin, redirect to unauthorized
  if (adminOnlyRoutes.includes(currentPath) && roleCookie !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/dashboard", "/protected-route"],
};

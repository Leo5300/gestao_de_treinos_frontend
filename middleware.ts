import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host");

  // força todo acesso ao apex ir para www
  if (host === "leomarchi.com.br") {
    const url = request.nextUrl.clone();

    url.host = "www.leomarchi.com.br";
    url.protocol = "https";

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\..*).*)"],
};
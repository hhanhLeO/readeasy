import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthorizationUrl,
  deriveCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "@/app/lib/auth/google";

const OAUTH_COOKIE_MAX_AGE = 60 * 10; // 10 minutes

export async function GET(request: NextRequest) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await deriveCodeChallenge(codeVerifier);
  const redirectUri = new URL(
    "/api/auth/google/callback",
    request.nextUrl.origin,
  ).toString();

  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };
  cookieStore.set("google_oauth_state", state, cookieOptions);
  cookieStore.set("google_oauth_verifier", codeVerifier, cookieOptions);

  const authorizationUrl = await buildGoogleAuthorizationUrl(
    redirectUri,
    state,
    codeChallenge,
  );

  return NextResponse.redirect(authorizationUrl);
}

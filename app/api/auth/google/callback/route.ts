import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/app/lib/db";
import { users } from "@/app/lib/db/schema";
import { createSession } from "@/app/lib/auth/session";
import { exchangeCodeForToken, verifyGoogleIdToken } from "@/app/lib/auth/google";

function logInFailure(origin: string) {
  return NextResponse.redirect(
    new URL("/login?error=google_auth_failed", origin),
  );
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const cookieStore = await cookies();

  const storedState = cookieStore.get("google_oauth_state")?.value;
  const codeVerifier = cookieStore.get("google_oauth_verifier")?.value;
  cookieStore.delete("google_oauth_state");
  cookieStore.delete("google_oauth_verifier");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");

  if (
    oauthError ||
    !code ||
    !state ||
    !storedState ||
    !codeVerifier ||
    state !== storedState
  ) {
    return logInFailure(origin);
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", origin).toString();

    const tokens = await exchangeCodeForToken(code, codeVerifier, redirectUri);
    const identity = await verifyGoogleIdToken(tokens.id_token);

    if (!identity.emailVerified) {
      return logInFailure(origin);
    }

    const [byGoogleId] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.googleId, identity.sub))
      .limit(1);

    if (byGoogleId) {
      await createSession(byGoogleId.id);
      return NextResponse.redirect(new URL("/home", origin));
    }

    const [byEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, identity.email))
      .limit(1);

    if (byEmail) {
      await db
        .update(users)
        .set({ googleId: identity.sub })
        .where(eq(users.id, byEmail.id));
      await createSession(byEmail.id);
      return NextResponse.redirect(new URL("/home", origin));
    }

    const username = identity.name?.trim() || identity.email.split("@")[0];
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email: identity.email,
        googleId: identity.sub,
      })
      .returning({ id: users.id });

    await createSession(newUser.id);
    return NextResponse.redirect(new URL("/home", origin));
  } catch {
    return logInFailure(origin);
  }
}

import { createRemoteJWKSet, jwtVerify } from "jose";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const ISSUER = "https://accounts.google.com";
const JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not set");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not set");
}

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const jwks = createRemoteJWKSet(new URL(JWKS_URI));

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generateState(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export function generateCodeVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function deriveCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  return base64url(new Uint8Array(digest));
}

export async function buildGoogleAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string,
): Promise<string> {
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

type GoogleTokenResponse = {
  id_token: string;
  access_token: string;
  expires_in: number;
  token_type: string;
};

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  return response.json();
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
};

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: ISSUER,
    audience: CLIENT_ID,
  });

  if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
    throw new Error("Google id_token missing required claims");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
  };
}

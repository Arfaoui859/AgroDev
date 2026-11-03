import { supabase } from "./supabase";

/**
 * fetch() that attaches the caller's Supabase access token when a session
 * exists.
 *
 * Per-user API endpoints resolve identity from the verified JWT, so without
 * this header the server would reject the request (or, in demo mode, fall back
 * to a shared demo identity). Callers must not pass a userId to identify
 * themselves; the token is the only identity the server trusts.
 */
export async function apiFetch(
  input: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  } catch {
    // No session (or Supabase unavailable): send the request unauthenticated
    // and let the server decide. Never invent an identity here.
  }

  return fetch(input, { ...init, headers });
}

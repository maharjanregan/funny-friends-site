export async function usernameToEmail(username: string) {
  const u = username.trim().toLowerCase();
  if (!u) return null;

  // Supabase edge function (you'll deploy this in Supabase)
  const url = "https://ezfjduymvofycegmhmiz.supabase.co/functions/v1/username_to_email";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: u }),
    });

    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string | null };
    return json.email ?? null;
  } catch {
    return null;
  }
}

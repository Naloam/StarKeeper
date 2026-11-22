import type { IncomingMessage, ServerResponse } from "node:http";

type Request = IncomingMessage & { body?: { code?: unknown; codeVerifier?: unknown } };
type Response = ServerResponse & {
  status: (code: number) => Response;
  json: (body: Record<string, string>) => void;
};

export default async function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { code, codeVerifier } = req.body ?? {};
  if (
    typeof code !== "string" ||
    !/^[a-z0-9_]{1,256}$/i.test(code) ||
    typeof codeVerifier !== "string" ||
    !/^[a-f0-9]{64}$/.test(codeVerifier)
  ) {
    return res.status(400).json({ error: "Invalid OAuth callback" });
  }

  const clientId = process.env.VITE_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    return res.status(503).json({ error: "OAuth configuration missing" });

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: process.env.VITE_GITHUB_REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.access_token !== "string") {
      return res.status(400).json({ error: "GitHub rejected the authorization code" });
    }
    return res.status(200).json({ access_token: data.access_token });
  } catch {
    return res.status(502).json({ error: "Token exchange failed" });
  }
}

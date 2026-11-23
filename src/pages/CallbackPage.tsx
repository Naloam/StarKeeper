import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store";
import { consumeOAuthState } from "../utils/auth";
import { getCurrentUser } from "../services/github.service";

export default function CallbackPage() {
  const [error, setError] = useState("");
  const started = useRef(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const exchange = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const verifier = consumeOAuthState(params.get("state"));
      history.replaceState(history.state, "", location.pathname);
      if (!code || !verifier) throw new Error("GitHub 授权已取消或会话过期，请重新登录");
      const response = await fetch("/api/auth/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier: verifier }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.access_token !== "string")
        throw new Error("GitHub 授权交换失败，请检查部署配置");
      login(await getCurrentUser(data.access_token), data.access_token);
      navigate("/dashboard", { replace: true });
    };
    void exchange().catch((failure) =>
      setError(failure instanceof Error ? failure.message : "登录失败"),
    );
  }, [login, navigate]);

  return (
    <main className="min-h-screen bg-surface px-4 py-16 text-center text-text-primary">
      {error ? (
        <>
          <p role="alert">{error}</p>
          <Link to="/" className="mt-4 inline-block text-info-text underline">
            返回登录
          </Link>
        </>
      ) : (
        <p role="status">正在验证 GitHub 授权…</p>
      )}
    </main>
  );
}

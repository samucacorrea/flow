"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiError, useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { trackLogin, trackPageView, trackSignUp } from "@/lib/analytics";

export default function LoginPage() {
  const { login, register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackPageView("/login");
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(email, password);
        trackLogin("password");
      } else {
        await register(name, email, password);
        trackSignUp("password");
      }
      router.push("/boards");
    } catch (err) {
      const apiError = getApiError(err);
      setError(apiError?.message || "Não foi possível concluir. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <main className="auth-shell">
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />
      <div className="auth-orb auth-orb-c" />

      <section className="auth-layout" aria-label="Flowio account access">
        <div className="auth-story">
          <Link href="/" className="auth-brand" aria-label="Flowio home">
            <span className="auth-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>flowio</span>
          </Link>
          <div className="auth-story-copy">
            <p className="auth-eyebrow">IDEIAS EM MOVIMENTO</p>
            <h1>Seu pensamento<br />ganha <em>forma.</em></h1>
            <p className="auth-lede">Organize ideias, conecte possibilidades e transforme planos em algo real.</p>
          </div>
          <div className="liquid-scene" aria-hidden="true">
            <div className="liquid-ring ring-one" />
            <div className="liquid-ring ring-two" />
            <div className="liquid-drop"><span /></div>
            <div className="liquid-glint" />
            <div className="liquid-caption">clareza para criar</div>
          </div>
          <p className="auth-footnote">Um espaço tranquilo para suas melhores ideias.</p>
        </div>

        <div className="auth-form-wrap">
          <div className="auth-card">
            <div className="auth-card-top">
              <span className="auth-kicker">BEM-VINDO AO FLOWIO</span>
              <span className="auth-status"><span /> SEU ESPAÇO CRIATIVO</span>
            </div>
            <h2>{isLogin ? t("auth.title") : "Comece por aqui"}</h2>
            <p className="auth-intro">{isLogin ? "Entre para continuar de onde sua próxima ideia começa." : "Crie sua conta e tire suas ideias do papel."}</p>

            <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
              <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? "active" : ""} onClick={() => { setMode("login"); setError(null); }}>{t("auth.login")}</button>
              <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? "active" : ""} onClick={() => { setMode("register"); setError(null); }}>{t("auth.register")}</button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {!isLogin && (
                <label>
                  <span>{t("auth.name")}</span>
                  <input autoComplete="name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Como podemos chamar você?" />
                </label>
              )}
              <label>
                <span>{t("auth.email")}</span>
                <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
              </label>
              <label>
                <span>{t("auth.password")}</span>
                <input type="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isLogin ? "Sua senha" : "Pelo menos 8 caracteres"} />
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-submit" type="submit" disabled={loading}>
                <span>{loading ? "Aguarde..." : isLogin ? t("auth.login") : t("auth.register")}</span>
                <span className="auth-arrow" aria-hidden="true">↗</span>
              </button>
            </form>
            <p className="auth-legal">Ao continuar, você acessa seu espaço pessoal de criação.</p>
          </div>
          <p className="auth-copyright">FLOWIO <span>·</span> IDEIAS QUE ENCONTRAM CAMINHO</p>
        </div>
      </section>
    </main>
  );
}

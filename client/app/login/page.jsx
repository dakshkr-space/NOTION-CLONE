"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  saveAuth,
  getToken,
} from "../../lib/api";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (tab === "register" && !name) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    try {
     const data = tab === "login"
     ? await loginWithEmail(email, password)
     : await registerWithEmail(name, email, password);
     console.log("data from login:", data);
     localStorage.setItem("token", data.token);
     localStorage.setItem("user", JSON.stringify(data.user));
    router.replace("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="aurora-bg" />
      <div className="login-page">
        <div className="auth-card-outer">
          <div className="auth-card-blob" />
          <div className="auth-card">
            <div className="auth-header">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                alt="Notion"
              />
              <h2>Welcome back</h2>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${tab === "login" ? "active" : ""}`}
                onClick={() => { setTab("login"); setError(""); }}
              >
                Log in
              </button>
              <button
                type="button"
                className={`auth-tab ${tab === "register" ? "active" : ""}`}
                onClick={() => { setTab("register"); setError(""); }}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {tab === "register" && (
                <div className="field-group">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div className="field-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {error && <p className="error-text">{error}</p>}

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Please wait..." : tab === "login" ? "Log in" : "Create account"}
              </button>

              <div className="auth-divider"><span>or</span></div>

              <button className="btn-google" type="button" onClick={loginWithGoogle}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                Continue with Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

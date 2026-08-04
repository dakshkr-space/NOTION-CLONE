"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  getCurrentUser,
} from "../../lib/api";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // STEP 8 equivalent for this file — no more getToken() check.
  // Ask the backend (via the HttpOnly cookie) whether someone's already logged in.
  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        router.replace("/dashboard");
      }
    }
    checkAuth();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (tab === "register" && !name) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    try {
      // saveAuth() is gone — the backend sets the HttpOnly cookie itself
      // on a successful response, nothing for the frontend to store.
      if (tab === "login") {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(name, email, password);
      }
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
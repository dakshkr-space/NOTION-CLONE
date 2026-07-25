"use client";

import Link from "next/link";

const NOTION_LOGO = "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png";
const center = { position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center" };
const action = { flex: 1, borderRadius: 9, padding: "11px 12px", fontSize: ".9rem", fontWeight: 650, textDecoration: "none" };

export default function LandingPage() {
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <div className="aurora-bg" />
      <section style={center} aria-labelledby="landing-title">
        <div style={{ maxWidth: 580 }}>
          <div style={{ display: "grid", placeItems: "center", width: 112, height: 112, margin: "0 auto 22px", border: "1px solid rgba(255,255,255,.48)", borderRadius: 26, background: "rgba(10,13,18,.64)", boxShadow: "0 20px 55px rgba(0,0,0,.4), inset 0 1px rgba(255,255,255,.18)", backdropFilter: "blur(14px)" }}>
            <img src={NOTION_LOGO} alt="Notion" style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 9 }} />
          </div>
          <p style={{ color: "#7eeeff", fontSize: ".7rem", fontWeight: 700, letterSpacing: ".18em" }}>YOUR TEAMSPACE</p>
          <h1 id="landing-title" style={{ margin: "12px 0", fontSize: "clamp(2.6rem, 7vw, 4.7rem)", letterSpacing: "-.06em", lineHeight: 1 }}>Ideas, organized.</h1>
          <p style={{ color: "#c5cbd1", fontSize: "1.08rem" }}>Write, plan, and collaborate in one calm place.</p>
        </div>
        <div style={{ width: "min(100%, 410px)", marginTop: 42, padding: 25, border: "1px solid rgba(255,255,255,.2)", borderRadius: 18, background: "rgba(12,15,19,.76)", boxShadow: "0 18px 50px rgba(0,0,0,.35)", backdropFilter: "blur(18px)" }}>
          <p style={{ fontSize: "1.05rem", fontWeight: 650 }}>Welcome to your workspace</p>
          <p style={{ margin: "8px auto 20px", color: "#a7afb7", fontSize: ".88rem", lineHeight: 1.5 }}>Sign in to continue, or create a free account to get started.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={{ ...action, border: "1px solid #3d444c", color: "white", background: "rgba(255,255,255,.05)" }}>Log in</Link>
            <Link href="/login" style={{ ...action, color: "#061014", background: "linear-gradient(135deg,#3fe9ff,#8a8dff)" }}>Sign up for free</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

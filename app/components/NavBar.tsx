import { Link } from "react-router";

// Shared nav chrome used by BOTH the public marketing header (Header.tsx) and the authed app nav
// (routes/app.tsx), so they look identical — sticky translucent bar, narration.me wordmark on the
// left, links on the right. Only the link set differs.
export const navLink: React.CSSProperties = {
  color: "#333", textDecoration: "none", fontSize: ".92rem", fontWeight: 500,
};
export const navCta: React.CSSProperties = {
  color: "#fff", background: "#1a1a1a", textDecoration: "none", fontSize: ".9rem", fontWeight: 600,
  padding: "0.4rem 0.9rem", borderRadius: 7, border: "none", cursor: "pointer",
};
export const navLinkBtn: React.CSSProperties = {
  ...navLink, background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit",
};

// Sticky translucent bar + centered container + wordmark. `children` are the right-side nav items.
export function NavShell({ children }: { children: React.ReactNode }) {
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.88)",
                     backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                     borderBottom: "1px solid #ececec" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "0.7rem 1.25rem", display: "flex",
                    alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <Link to="/" style={{ fontWeight: 700, fontSize: "1.08rem", textDecoration: "none", color: "#111",
                              letterSpacing: "-0.01em", marginRight: "auto" }}>
          narration<span style={{ color: "#1858c7" }}>.me</span>
        </Link>
        <nav style={{ display: "flex", gap: "1.1rem", alignItems: "center", flexWrap: "wrap" }}>
          {children}
        </nav>
      </div>
    </header>
  );
}

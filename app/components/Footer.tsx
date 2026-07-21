import { Link } from "react-router";

// Global footer — legal links reachable from every page (also what payment providers require to
// approve the site). Rendered once in root.tsx.
const LINK: React.CSSProperties = { color: "#555", textDecoration: "none", fontSize: ".85rem" };

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #eaeaea", marginTop: "3rem", padding: "1.6rem 1.25rem",
                     display: "flex", flexWrap: "wrap", gap: ".4rem 1.1rem", alignItems: "center",
                     justifyContent: "center", color: "#777", fontSize: ".85rem" }}>
      <Link to="/pricing" style={LINK}>Pricing</Link>
      <Link to="/docs" style={LINK}>Docs</Link>
      <Link to="/terms" style={LINK}>Terms of Service</Link>
      <Link to="/privacy" style={LINK}>Privacy Notice</Link>
      <Link to="/refunds" style={LINK}>Refund Policy</Link>
      <span style={{ flexBasis: "100%", textAlign: "center", marginTop: ".5rem", color: "#999" }}>
        © 2026 Narration (narration.me). AI-generated audio, watermarked &amp; disclosed. Payments processed by Paddle.com.
      </span>
    </footer>
  );
}

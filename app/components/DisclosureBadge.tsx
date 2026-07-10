// Persistent, non-dismissible AI-disclosure label on every generated clip (EU AI Act Art. 50, §H).
export function DisclosureBadge() {
  return (
    <span
      title="AI-generated synthetic speech, watermarked (Perth) and provenance-signed (C2PA)."
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.72rem",
               fontWeight: 600, color: "#4a4a4a", background: "#f0f0f0", borderRadius: 999,
               padding: "2px 8px" }}
    >
      🔊 AI-generated voice
    </span>
  );
}

export function RetentionNotice() {
  return (
    <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem" }}>
      Your source text and reference audio are auto-deleted after your plan's retention window unless
      you save the voice. We don't train on your uploaded audio; it is encrypted at rest and never runs
      on anonymous nodes.
    </p>
  );
}

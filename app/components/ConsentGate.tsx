// The §H consent gate. The statement version MUST match the server's CONSENT_VERSION ("h-v3");
// the server records the authoritative log (IP/UA/timestamp) — the client only attests the checkbox.
import { useState } from "react";

export const CONSENT_STATEMENT_VERSION = "h-v3";

export const CONSENT_TEXT =
  "I confirm this recording is my own voice, or I have explicit written permission from the person " +
  "it belongs to. I will not upload the voice of any celebrity, public figure, or other person " +
  "without their consent. Generated audio is AI-synthesized and watermarked. Misuse may violate " +
  "right-of-publicity, impersonation, and AI-disclosure laws and will result in account termination.";

export function ConsentGate({ onChange }: { onChange: (agreed: boolean) => void }) {
  const [checked, setChecked] = useState(false);
  return (
    <label style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start", fontSize: "0.9rem",
                    border: "1px solid #d0d0d0", borderRadius: 8, padding: "0.9rem" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { setChecked(e.target.checked); onChange(e.target.checked); }}
        aria-label="consent to voice cloning terms"
      />
      <span>{CONSENT_TEXT}</span>
    </label>
  );
}

import { LegalPage } from "~/components/Legal";

export function meta() {
  return [
    { title: "Privacy Notice — Narration" },
    { name: "description", content: "How Narration (narration.me) collects, uses, and protects your data." },
  ];
}

export default function Privacy() {
  return (
    <LegalPage title="Privacy Notice" updated="21 July 2026">
      <p>
        This Privacy Notice explains how Narration ("we", "us"), operator of <strong>narration.me</strong>,
        collects, uses, shares, and protects information when you use our service. We aim to collect only
        what we need to run the service and to keep it secure.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li><strong>Account data:</strong> your email address, used for passwordless sign-in.</li>
        <li><strong>Content you submit:</strong> the text you send for narration and any job settings.</li>
        <li><strong>Reference audio (voice biometric data):</strong> if you clone a voice, the audio sample you upload. We treat this as sensitive biometric data.</li>
        <li><strong>Consent records:</strong> when you attest that you have rights to a voice, we log the attestation with a server timestamp, IP address, and user agent, as a compliance record.</li>
        <li><strong>Usage &amp; technical data:</strong> job history, quotas, minutes produced, and standard request logs (IP, timestamps) for security and abuse prevention.</li>
        <li><strong>Payment data:</strong> processed by Paddle. We do <em>not</em> receive or store your full card details — only a subscription status and billing identifiers.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To provide the service — synthesize audio, deliver files, and maintain your account.</li>
        <li>To enforce plan limits, prevent abuse, and secure the platform.</li>
        <li>To process subscriptions (via Paddle) and provide support.</li>
        <li>To comply with legal obligations, including AI-disclosure and consent record-keeping.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information.</p>

      <h2>3. Voice biometric data</h2>
      <p>
        Reference audio you upload for voice cloning is handled with heightened care: it is stored in an
        access-controlled, encrypted bucket; used only to build <em>your</em> voice; never used to train
        shared or third-party models; and never processed on anonymous or untrusted compute. It is deleted
        after your voice is built or after a limited retention window, whichever applies. You can delete a
        cloned voice (and its reference audio) at any time from the app.
      </p>

      <h2>4. Service providers we share with</h2>
      <p>We use a small set of processors to run the service:</p>
      <ul>
        <li><strong>Supabase</strong> — authentication, database, and file storage.</li>
        <li><strong>Paddle</strong> — payments and subscription management (Merchant of Record).</li>
        <li><strong>Cloudflare</strong> — bot protection (Turnstile) and network security.</li>
        <li><strong>GitHub Pages</strong> — hosting of the website front end.</li>
      </ul>
      <p>These providers process data on our behalf under their own security and privacy commitments.</p>

      <h2>5. Data retention</h2>
      <p>
        Generated audio and source files are retained according to your plan and then automatically
        deleted; reference audio is deleted as described above. Consent records are retained as a legal
        compliance record. You may request deletion of your account and associated data.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or export your
        personal information, and to object to or restrict certain processing. Residents of U.S. states
        with privacy laws (such as California) have the right to know what we collect, to request
        deletion, and to opt out of the "sale" or "sharing" of personal information — which we do not do.
        To exercise any right, contact us using the details below.
      </p>

      <h2>7. Cookies &amp; local storage</h2>
      <p>
        We use only essential storage needed to keep you signed in and to operate the app. We do not use
        advertising or cross-site tracking cookies.
      </p>

      <h2>8. Security</h2>
      <p>
        We protect data with encryption in transit and at rest, row-level access controls, scoped access
        tokens, and watermarking/provenance on all output. No system is perfectly secure, but we work to
        safeguard your information and to isolate sensitive biometric data.
      </p>

      <h2>9. Children</h2>
      <p>The Service is not directed to children and is intended for users 18 and older.</p>

      <h2>10. International transfers</h2>
      <p>
        Our providers may process data in the United States and other countries. Where required, we rely
        on appropriate safeguards for such transfers.
      </p>

      <h2>11. Changes</h2>
      <p>We may update this Notice; material changes are reflected by the "Last updated" date above.</p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions or requests: <a href="mailto:narrationai@googlegroups.com">narrationai@googlegroups.com</a>.
      </p>
    </LegalPage>
  );
}

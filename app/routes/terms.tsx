import { Link } from "react-router";
import { LegalPage } from "~/components/Legal";

export function meta() {
  return [
    { title: "Terms of Service — Narration" },
    { name: "description", content: "The terms that govern your use of Narration (narration.me)." },
  ];
}

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="21 July 2026">
      <p>
        These Terms of Service ("Terms") are a binding agreement between you and Narration ("Narration",
        "we", "us"), operator of the website and services at <strong>narration.me</strong> (the "Service").
        By creating an account or using the Service, you agree to these Terms. If you do not agree, do not
        use the Service.
      </p>

      <h2>1. The Service</h2>
      <p>
        Narration is an AI text-to-speech platform that turns text into long-form, distribution-ready
        audio narration (including Bangla and South-Asian-English voices), with optional custom voice
        cloning. All audio produced by the Service is <strong>AI-generated</strong>.
      </p>

      <h2>2. Eligibility &amp; accounts</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your jurisdiction) to use the Service.
        You are responsible for activity under your account and for keeping your sign-in access secure.
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to use the Service to:</p>
      <ul>
        <li>Clone, imitate, or synthesize the voice of any person without their explicit, verifiable consent, or the voice of any celebrity, public figure, or third party you are not authorized to use.</li>
        <li>Create content that is unlawful, deceptive, defamatory, harassing, hateful, or that infringes another party's intellectual-property, publicity, or privacy rights.</li>
        <li>Impersonate any person or entity, or misrepresent AI-generated audio as a genuine human recording.</li>
        <li>Generate fraud, scams, disinformation, or content intended to deceive (including for financial or political manipulation).</li>
        <li>Remove, obscure, or tamper with any watermark, provenance manifest, or AI-generated disclosure attached to output.</li>
        <li>Reverse-engineer, resell, or abuse the Service, or exceed the limits of your plan.</li>
      </ul>

      <h2>4. Voice cloning &amp; consent</h2>
      <p>
        To create a custom voice, you must upload a recording of a voice you own or for which you hold
        explicit written permission. You represent and warrant that you have all necessary rights and
        consents. When you clone a voice, you attest to this, and we record a consent log (including a
        timestamp and technical details) as a compliance record. We may refuse, suspend, or remove any
        voice or content that we reasonably believe violates these Terms or applicable law.
      </p>

      <h2>5. AI disclosure, watermarking &amp; provenance</h2>
      <p>
        Every output is AI-synthesized and carries a durable audio watermark, a C2PA content-credentials
        manifest, and a human-readable disclosure in its metadata. You must not present output as a
        human recording where doing so would be misleading or unlawful, and you must comply with any
        AI-disclosure laws that apply to your use.
      </p>

      <h2>6. Your content &amp; intellectual property</h2>
      <p>
        You retain ownership of the text you submit and, subject to your plan and your compliance with
        these Terms, of the audio you generate. You grant us the limited rights needed to operate the
        Service (for example, to process your text and store and deliver your audio). We own the Service,
        our software, models, and platform. We do not use your uploaded reference audio to train shared
        or third-party models.
      </p>

      <h2>7. Plans, billing &amp; taxes</h2>
      <p>
        Paid plans are sold through <strong>Paddle.com</strong>, our authorized reseller and Merchant of
        Record, who handles payment processing, billing, invoicing, and applicable taxes. By subscribing
        you also agree to Paddle's buyer terms. Subscriptions renew automatically each billing period
        until cancelled. You can manage or cancel your subscription from your billing page. Refunds are
        governed by our <Link to="/refunds">Refund Policy</Link>.
      </p>

      <h2>8. Service availability</h2>
      <p>
        The Service is provided on an "as is" and "as available" basis. We do not guarantee uninterrupted
        or error-free operation, and we may modify, suspend, or discontinue features at any time.
      </p>

      <h2>9. Disclaimers &amp; limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we disclaim all warranties, express or implied. We are
        not liable for any indirect, incidental, special, or consequential damages, and our total
        liability arising out of or relating to the Service will not exceed the amount you paid to us (via
        Paddle) in the twelve months preceding the claim.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate your access if you violate
        these Terms or use the Service unlawfully. Sections that by their nature should survive termination
        (including ownership, disclaimers, and limitation of liability) will survive.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be reflected by an updated
        "Last updated" date, and continued use of the Service constitutes acceptance.
      </p>

      <h2>12. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Delaware and the United States, without
        regard to conflict-of-laws rules.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these Terms: <a href="mailto:narrationai@googlegroups.com">narrationai@googlegroups.com</a>.
      </p>
    </LegalPage>
  );
}

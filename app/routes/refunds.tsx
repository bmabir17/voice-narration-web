import { Link } from "react-router";
import { LegalPage } from "~/components/Legal";

export function meta() {
  return [
    { title: "Refund Policy — Narration" },
    { name: "description", content: "Refund and cancellation terms for Narration (narration.me) subscriptions." },
  ];
}

export default function Refunds() {
  return (
    <LegalPage title="Refund Policy" updated="21 July 2026">
      <p>
        Narration (<strong>narration.me</strong>) offers subscription access to an AI text-to-speech
        service. This policy explains how refunds and cancellations work. Payments and refunds are handled
        by our Merchant of Record, <strong>Paddle.com</strong>.
      </p>

      <h2>1. Merchant of Record</h2>
      <p>
        All purchases are processed by Paddle, who acts as the seller of record. Refunds are issued through
        Paddle back to your original payment method. Paddle's own <a href="https://www.paddle.com/legal/checkout-buyer-terms" rel="noopener noreferrer" target="_blank">Buyer Terms</a> also apply to your purchase.
      </p>

      <h2>2. 7-day refund window</h2>
      <p>
        If you are not satisfied, you may request a full refund within <strong>7 days</strong> of your
        initial purchase, provided you have not substantially used the Service (for example, generated a
        large volume of audio) during that period. Because narration is a digital service delivered
        immediately, requests outside this window or after significant usage may not be eligible, except
        where required by law.
      </p>

      <h2>3. Duplicate or accidental charges</h2>
      <p>
        Duplicate charges, charges resulting from a clear technical error, or unauthorized charges will be
        refunded in full once verified.
      </p>

      <h2>4. Renewals &amp; cancellation</h2>
      <p>
        Subscriptions renew automatically each billing period. You can cancel at any time from your
        <Link to="/app/billing"> billing page</Link> (or via the Paddle receipt link in your email).
        When you cancel, your plan remains active until the end of the current billing period, and you are
        not charged again. Renewal charges are generally non-refundable for the period already started,
        except where required by law — so please cancel before your renewal date if you do not wish to
        continue.
      </p>

      <h2>5. How to request a refund</h2>
      <p>
        Email <a href="mailto:narrationai@googlegroups.com">narrationai@googlegroups.com</a> with the email
        address used to purchase and, if possible, your Paddle order or receipt number. You can also
        request a refund directly through the receipt Paddle sent you. We aim to respond within a few
        business days.
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about billing or refunds: <a href="mailto:narrationai@googlegroups.com">narrationai@googlegroups.com</a>.
      </p>
    </LegalPage>
  );
}

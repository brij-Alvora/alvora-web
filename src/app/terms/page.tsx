import { LegalDocument } from "@/components/legal/legal-document";
import {
  ADMIN_EMAIL,
  ADMIN_MAILTO,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from "@/lib/legal/contact";

export const metadata = {
  title: "Terms of Service · Alvora",
};

export default function TermsPage() {
  return (
    <LegalDocument title="Terms of Service" updated="23/11/2026 00:00:00">
      <p>
        These terms govern your use of Alvora. By creating an account you agree
        to them, and to the Privacy Policy and Acceptable Use Policy.
      </p>
      <h2>The service</h2>
      <p>
        Alvora is a beta platform for builder identity, project publishing,
        peer validation, reputation, and related community tools. Features may
        change as we learn from the beta.
      </p>
      <h2>Your account</h2>
      <ul>
        <li>You must provide accurate registration details and keep them current.</li>
        <li>You are responsible for activity on your account.</li>
        <li>We may warn, suspend, or ban accounts that violate these terms or the Acceptable Use Policy.</li>
      </ul>
      <h2>Your content</h2>
      <p>
        You retain rights to content you post. You grant Alvora a licence to
        host, display, and distribute that content as needed to operate the
        product (including public profiles and published projects). You must
        have the rights to post it.
      </p>
      <h2>No professional advice</h2>
      <p>
        Reviews, reputation scores, and validation outcomes are community
        signals, not certifications, investment advice, or guarantees of
        quality.
      </p>
      <h2>Availability</h2>
      <p>
        We provide Alvora as-is during beta. We may interrupt, limit, or
        discontinue features. We are not liable for lost content, reputation
        points, or indirect damages to the extent permitted by law.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
      </p>
      <p>
        Administrative or escalation matters:{" "}
        <a href={ADMIN_MAILTO}>{ADMIN_EMAIL}</a>.
      </p>
    </LegalDocument>
  );
}

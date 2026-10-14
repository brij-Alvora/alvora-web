import { LegalDocument } from "@/components/legal/legal-document";

export const metadata = {
  title: "Acceptable Use Policy · Alvora",
};

export default function AcceptableUsePage() {
  return (
    <LegalDocument title="Acceptable Use Policy" updated="14/10/2026 00:00:00">
      <p>
        Alvora is for genuine builder identity and peer validation. Do not use
        the platform to harm others or manipulate trust.
      </p>
      <h2>Not allowed</h2>
      <ul>
        <li>Harassment, hate, threats, or sexual exploitation.</li>
        <li>Spam, scams, impersonation, or fake projects.</li>
        <li>Manipulated, paid, or coordinated fake reviews.</li>
        <li>Malware, unauthorized access, or attempts to bypass security or rate limits.</li>
        <li>Content you do not have the right to publish.</li>
        <li>Using multiple accounts to evade a warning, suspension, or ban.</li>
      </ul>
      <h2>Enforcement</h2>
      <p>
        We may hide or remove content, warn, suspend, or ban accounts, and
        retain records needed for safety. Repeated or severe abuse can lead to
        a permanent ban.
      </p>
      <h2>Reporting</h2>
      <p>
        Use Report on a profile, project, validation, or review. Abuse of the
        reporting tools is itself a violation.
      </p>
    </LegalDocument>
  );
}

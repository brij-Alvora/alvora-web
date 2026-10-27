import { LegalDocument } from "@/components/legal/legal-document";

export const metadata = {
  title: "Privacy Policy · Alvora",
};

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy Policy" updated="27/10/2026 00:00:00">
      <p>
        Alvora (“we”) provides a builder identity and validation platform. This
        policy explains what we collect, why we collect it, and how you can
        control it during the beta.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account data: email, username, display name, and authentication identifiers.</li>
        <li>Profile and content: bio, links, projects, validation requests, reviews, and support tickets you submit.</li>
        <li>Trust and operations data: reports, moderation actions, and account status.</li>
        <li>Technical data: session cookies required to keep you signed in.</li>
        <li>
          Acquisition data: first-touch campaign parameters (UTM) and onboarding
          funnel events for invited mentors, stored in a first-party cookie and
          in our database.
        </li>
        <li>
          Product analytics: Microsoft Clarity session recordings/heatmaps and
          Google Analytics 4 page and event data when those tools are enabled.
        </li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use this information to operate Alvora: authenticate you, publish
        profiles and projects you choose to share, run validation and
        reputation, handle support, and keep the community safe.
      </p>
      <h2>Sharing</h2>
      <p>
        Public profiles, published projects, and open validation requests are
        visible to other signed-in builders. We do not sell personal data.
        Infrastructure providers (including our authentication and database
        host, and analytics providers Microsoft Clarity and Google Analytics
        when configured) process data on our behalf to run and improve the
        service.
      </p>
      <h2>Retention</h2>
      <p>
        We keep account and content data while your account is active. If you
        ask us to close an account, we delete or anonymize personal data except
        where we must retain records for safety, abuse prevention, or legal
        duty.
      </p>
      <h2>Your choices</h2>
      <p>
        You can edit your profile, unpublish or delete projects you own, and
        contact Support to request access, correction, or deletion. For privacy
        requests, open a Support ticket from your account.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about this policy can be sent through Alvora Support after
        you sign in.
      </p>
    </LegalDocument>
  );
}

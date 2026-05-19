import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TheraVerse',
};

export default function PrivacyPolicyPage() {
  return (
    <article>
      <h1>Privacy Policy</h1>
      <p>
        <strong>Effective date:</strong> 25 February 2026
      </p>
      <p>
        TheraVerse (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your
        personal data in compliance with the Malaysian Personal Data Protection Act 2010 (PDPA). This
        policy explains what data we collect, how we use it, and your rights.
      </p>

      <h2>Data We Collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> &mdash; your name and email address, provided during
          registration.
        </li>
        <li>
          <strong>Conversation transcripts</strong> &mdash; text records of your interactions with the
          AI mental health support assistant.
        </li>
        <li>
          <strong>Voice &amp; video interaction metadata</strong> &mdash; session duration, connection
          quality metrics, and facial expression labels used for session quality assessment.
        </li>
      </ul>

      <h2>How We Use Your Data</h2>
      <ul>
        <li>To provide AI-powered mental health support through real-time conversations.</li>
        <li>To improve the quality and accuracy of our service.</li>
        <li>To communicate important service updates to you.</li>
      </ul>

      <h2>Video &amp; Biometric Data</h2>
      <p>
        No raw video is stored. Only biometric metadata (e.g., facial expression labels) is retained
        for session quality assessment. Raw audio and video streams are processed in real time and
        discarded after each session.
      </p>

      <h2>Data Storage</h2>
      <p>
        All data is hosted on Malaysian cloud infrastructure in compliance with the PDPA. We implement
        industry-standard encryption in transit and at rest to safeguard your information.
      </p>

      <h2>Your Rights</h2>
      <p>Under the PDPA, you have the right to:</p>
      <ul>
        <li>
          <strong>Access</strong> your personal data held by us.
        </li>
        <li>
          <strong>Correct</strong> any inaccurate or incomplete data.
        </li>
        <li>
          <strong>Withdraw consent</strong> at any time. Withdrawal of consent may affect our ability to
          provide the service.
        </li>
      </ul>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this policy or wish to exercise your rights, please contact us at{' '}
        <a href="mailto:support@theraverse.app">support@theraverse.app</a>.
      </p>
    </article>
  );
}

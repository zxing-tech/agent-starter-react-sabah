import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Healthier Sabah',
};

export default function TermsOfServicePage() {
  return (
    <article>
      <h1>Terms of Service</h1>
      <p>
        <strong>Effective date:</strong> 25 February 2026
      </p>
      <p>
        Welcome to Healthier Sabah. By creating an account or using our service, you agree to the following
        terms. If you do not agree, please do not use Healthier Sabah.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using Healthier Sabah, you confirm that you have read, understood, and agree to be
        bound by these Terms of Service and our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Healthier Sabah provides AI-powered mental health support through real-time text, voice, and video
        conversations. The service is designed to supplement, not replace, professional mental health
        care. If you are in crisis, please contact local emergency services.
      </p>

      <h2>3. User Responsibilities</h2>
      <ul>
        <li>You must provide accurate information during registration.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You agree not to misuse the service or attempt to access it through unauthorized means.</li>
        <li>You must be at least 18 years of age to use Healthier Sabah.</li>
      </ul>

      <h2>4. Limitations of Liability</h2>
      <p>
        Healthier Sabah is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
        that the AI assistant will provide medically accurate or therapeutically appropriate advice. In
        no event shall Healthier Sabah be liable for any indirect, incidental, or consequential damages
        arising from your use of the service.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        All content, design, and technology underlying Healthier Sabah are owned by us or our licensors. You
        may not copy, modify, or distribute any part of the service without prior written consent.
      </p>

      <h2>6. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your account at any time if we reasonably believe
        you have violated these terms. You may also delete your account at any time by contacting us.
      </p>

      <h2>7. Governing Law</h2>
      <p>
        These terms are governed by the laws of Malaysia. Any disputes arising from these terms shall be
        subject to the exclusive jurisdiction of the courts of Malaysia.
      </p>

      <h2>Contact Us</h2>
      <p>
        For questions about these terms, please contact us at{' '}
        <a href="mailto:support@theraverse.app">support@theraverse.app</a>.
      </p>
    </article>
  );
}

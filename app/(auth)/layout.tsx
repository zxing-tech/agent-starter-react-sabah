import { OfflineBanner } from '@/components/auth/offline-banner';
import { LanguageSwitcher } from '@/components/auth/language-switcher';
import { TranslationsProvider } from '@/lib/i18n/client';
import { getLocale } from '@/lib/i18n/get-locale';
import { getMessages } from '@/lib/i18n/get-messages';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <TranslationsProvider locale={locale} messages={messages}>
      <OfflineBanner />
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      {children}
    </TranslationsProvider>
  );
}

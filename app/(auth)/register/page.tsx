import Link from 'next/link';
import { ShieldCheck, LockSimple, EyeSlash } from '@phosphor-icons/react/dist/ssr';
import { RegisterForm } from './register-form';
import { getLocale } from '@/lib/i18n/get-locale';
import { getMessages, t } from '@/lib/i18n/get-messages';

function TrustBadge({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-tv-muted">{description}</p>}
      </div>
    </div>
  );
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  const locale = await getLocale();
  const m = await getMessages(locale);

  return (
    <div className="fixed inset-0 z-10 flex min-h-svh bg-tv-bg">
      {/* Left: Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img src="/Flag_of_Sabah.svg.png" alt="Sabah" className="mx-auto mb-6 h-12 w-auto object-contain" />
            <h1 className="mb-2 text-2xl font-semibold text-white">{t(m, 'register.heading')}</h1>
            <p className="text-tv-muted">{t(m, 'register.subtitle')}</p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div role="alert" className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {message}
            </div>
          )}

          <RegisterForm />

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-tv-muted">
            {t(m, 'register.hasAccount')}{' '}
            <Link href="/login" className="text-tv-link hover:text-tv-link-hover">
              {t(m, 'register.loginLink')}
            </Link>
          </p>

          {/* Mobile trust badges */}
          <div className="mt-8 space-y-3 lg:hidden">
            <TrustBadge
              icon={<ShieldCheck size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.pdpa')}
            />
            <TrustBadge
              icon={<LockSimple size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.encrypted')}
            />
            <TrustBadge
              icon={<EyeSlash size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.confidential')}
            />
          </div>
        </div>
      </div>

      {/* Right: Calming visual panel (desktop only) */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-tv-bg to-cyan-900/40" />

        {/* Decorative blurred circles */}
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-tv-accent/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-tv-link/15 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-12 text-center">
          {/* Large heart icon */}
          <img src="/Flag_of_Sabah.svg.png" alt="Sabah" className="mx-auto mb-8 h-16 w-auto object-contain" />

          <h2 className="mb-4 text-3xl font-semibold text-white">{t(m, 'register.desktopHeading')}</h2>
          <p className="mb-10 text-tv-muted">
            {t(m, 'register.desktopSubtitle')}
          </p>

          {/* Trust badges with descriptions */}
          <div className="space-y-4 text-left">
            <TrustBadge
              icon={<ShieldCheck size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.pdpa')}
              description={t(m, 'trustBadges.pdpaDesc')}
            />
            <TrustBadge
              icon={<LockSimple size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.encrypted')}
              description={t(m, 'trustBadges.encryptedDesc')}
            />
            <TrustBadge
              icon={<EyeSlash size={18} className="text-tv-accent" />}
              label={t(m, 'trustBadges.confidential')}
              description={t(m, 'trustBadges.confidentialDesc')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

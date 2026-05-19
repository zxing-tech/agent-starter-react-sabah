'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, CircleNotch } from '@phosphor-icons/react';
import { updatePassword } from './actions';
import { categorizeAuthError, getErrorKey } from '@/lib/auth-errors';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { useTranslations } from '@/lib/i18n/client';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, key: 'register.rule1' },
  { test: (p: string) => /[A-Z]/.test(p), key: 'register.rule2' },
  { test: (p: string) => /[a-z]/.test(p), key: 'register.rule3' },
  { test: (p: string) => /[0-9]/.test(p), key: 'register.rule4' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), key: 'register.rule5' },
];

function getStrength(password: string): { level: 'weak' | 'medium' | 'strong'; passed: number } {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 2) return { level: 'weak', passed };
  if (passed <= 4) return { level: 'medium', passed };
  return { level: 'strong', passed };
}

const STRENGTH_KEYS = {
  weak: 'register.strengthWeak',
  medium: 'register.strengthMedium',
  strong: 'register.strengthStrong',
} as const;

const STRENGTH_COLORS = {
  weak: { color: 'bg-orange-400', text: 'text-orange-400' },
  medium: { color: 'bg-yellow-400', text: 'text-yellow-400' },
  strong: { color: 'bg-green-400', text: 'text-green-400' },
} as const;

export function ResetPasswordForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [isTransientError, setIsTransientError] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const strength = password ? getStrength(password) : null;
  const allRulesPassed = strength?.passed === PASSWORD_RULES.length;
  const passwordsMatch = confirmPassword ? password === confirmPassword : null;

  function handleRetry() {
    handleSubmit();
  }

  function handleSubmit() {
    if (!allRulesPassed) {
      setError(t('errors.WEAK_PASSWORD'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('errors.PASSWORDS_DONT_MATCH'));
      return;
    }

    setError('');
    setIsTransientError(false);

    startTransition(async () => {
      try {
        const result = await updatePassword(password);

        if (!result.success) {
          const key = result.error || 'GENERIC';
          const translated = t(`errors.${key}`);
          setError(translated !== `errors.${key}` ? translated : (result.error || t('errors.GENERIC')));
          return;
        }

        // All sessions invalidated globally — redirect to login with flash message
        router.push('/login?message=PASSWORD_RESET_SUCCESS');
      } catch (err) {
        const errorKind = categorizeAuthError(err);
        const key = getErrorKey(errorKind);
        const translated = t(`errors.${key}`);
        setError(translated !== `errors.${key}` ? translated : key);
        if (errorKind.kind === 'network' || errorKind.kind === 'server') {
          setIsTransientError(true);
        }
      }
    });
  }

  return (
    <>
      {error && (
        <AuthErrorBanner message={error} onRetry={isTransientError ? handleRetry : undefined} />
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-tv-text">
            {t('resetPassword.newPassword')}
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-tv-border bg-tv-surface px-4 pr-11 text-white placeholder-tv-muted outline-none focus:border-tv-accent focus:ring-1 focus:ring-tv-accent disabled:opacity-50"
              placeholder={t('common.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-tv-muted hover:text-tv-text focus-visible:ring-2 focus-visible:ring-tv-accent"
              aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Strength indicator */}
          {strength && (
            <div className="mt-2.5">
              <div className="mb-1.5 flex gap-1.5">
                {Array.from({ length: 3 }, (_, i) => {
                  const filled =
                    (strength.level === 'weak' && i === 0) ||
                    (strength.level === 'medium' && i <= 1) ||
                    strength.level === 'strong';
                  return (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${filled ? STRENGTH_COLORS[strength.level].color : 'bg-tv-border'}`}
                    />
                  );
                })}
              </div>
              <p className={`text-xs ${STRENGTH_COLORS[strength.level].text}`}>
                {t(STRENGTH_KEYS[strength.level])}
              </p>
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.key} className={`text-xs ${met ? 'text-green-400' : 'text-tv-muted'}`}>
                      {met ? '\u2713' : '\u2022'} {t(rule.key)}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-tv-text"
          >
            {t('resetPassword.confirmPassword')}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              disabled={isPending}
              aria-invalid={passwordsMatch === false ? true : undefined}
              aria-describedby={passwordsMatch !== null ? 'reset-confirm-hint' : undefined}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`h-11 w-full rounded-xl border bg-tv-surface px-4 pr-11 text-white placeholder-tv-muted outline-none focus:ring-1 disabled:opacity-50 ${
                passwordsMatch === false
                  ? 'border-orange-400 focus:border-orange-400 focus:ring-orange-400'
                  : passwordsMatch === true
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-tv-border focus:border-tv-accent focus:ring-tv-accent'
              }`}
              placeholder={t('common.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-tv-muted hover:text-tv-text focus-visible:ring-2 focus-visible:ring-tv-accent"
              aria-label={showConfirmPassword ? t('common.hidePassword') : t('common.showPassword')}
            >
              {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div id="reset-confirm-hint" aria-live="polite">
            {passwordsMatch === false && (
              <p className="mt-1.5 text-xs text-orange-400">{t('register.passwordsMismatch')}</p>
            )}
            {passwordsMatch === true && (
              <p className="mt-1.5 text-xs text-green-400">{t('register.passwordsMatch')}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <CircleNotch size={20} className="animate-spin" />
              {t('resetPassword.submitting')}
            </>
          ) : (
            t('resetPassword.submit')
          )}
        </button>
      </form>
    </>
  );
}

'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { resetPassword } from './actions';
import { categorizeAuthError, getErrorKey } from '@/lib/auth-errors';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { useTranslations } from '@/lib/i18n/client';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm({
  serverError,
  serverSuccess,
}: {
  serverError?: string;
  serverSuccess?: string;
}) {
  const { t } = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState(serverError || '');
  const [isTransientError, setIsTransientError] = useState(false);
  const lastFormDataRef = useRef<FormData | null>(null);
  const [success, setSuccess] = useState(serverSuccess || '');
  const [cooldown, setCooldown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function validateEmail(value: string) {
    if (value && !EMAIL_REGEX.test(value)) {
      setEmailError(t('errors.INVALID_EMAIL'));
    } else {
      setEmailError('');
    }
  }

  function handleRetry() {
    if (lastFormDataRef.current) {
      handleSubmit(lastFormDataRef.current);
    }
  }

  function handleSubmit(formData: FormData) {
    const emailValue = formData.get('email') as string;

    if (!emailValue.trim()) {
      setError(t('errors.EMPTY_EMAIL'));
      return;
    }

    if (!EMAIL_REGEX.test(emailValue)) {
      setEmailError(t('errors.INVALID_EMAIL'));
      return;
    }

    setError('');
    setEmailError('');
    setSuccess('');
    setIsTransientError(false);

    startTransition(async () => {
      try {
        await resetPassword(formData);

        // Always show the same message regardless of whether the email exists
        setSuccess(t('forgotPassword.success'));
        setCooldown(60);
      } catch (err) {
        const errorKind = categorizeAuthError(err);
        const key = getErrorKey(errorKind);
        const translated = t(`errors.${key}`);
        setError(translated !== `errors.${key}` ? translated : key);
        if (errorKind.kind === 'network' || errorKind.kind === 'server') {
          setIsTransientError(true);
          lastFormDataRef.current = formData;
        }
        // Do NOT start cooldown — request didn't go through
      }
    });
  }

  const disabled = isPending || cooldown > 0;

  return (
    <>
      {error && (
        <AuthErrorBanner message={error} onRetry={isTransientError ? handleRetry : undefined} />
      )}
      {success && !error && (
        <div role="status" className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-tv-text">
            {t('common.email')}
          </label>
          <input
            ref={emailRef}
            id="email"
            name="email"
            type="email"
            required
            disabled={disabled}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? 'forgot-email-error' : undefined}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            onBlur={(e) => validateEmail(e.target.value)}
            className={`h-11 w-full rounded-xl border bg-tv-surface px-4 text-white placeholder-tv-muted outline-none focus:ring-1 disabled:opacity-50 ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-tv-border focus:border-tv-accent focus:ring-tv-accent'}`}
            placeholder={t('common.emailPlaceholder')}
          />
          {emailError && (
            <p id="forgot-email-error" role="alert" className="mt-1.5 text-sm text-red-400">{emailError}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <CircleNotch size={20} className="animate-spin" />
              {t('forgotPassword.submitting')}
            </>
          ) : cooldown > 0 ? (
            t('forgotPassword.cooldown', { seconds: String(cooldown) })
          ) : (
            t('forgotPassword.submit')
          )}
        </button>
      </form>
    </>
  );
}

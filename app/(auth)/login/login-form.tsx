'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleNotch, Eye, EyeSlash } from '@phosphor-icons/react';
import { signIn } from './actions';
import { SSOButton } from '@/app/(auth)/register/sso-button';
import { categorizeAuthError, getErrorKey } from '@/lib/auth-errors';
import { AuthErrorBanner } from '@/components/auth/auth-error-banner';
import { useTranslations } from '@/lib/i18n/client';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function LoginForm({ serverError, serverMessage }: { serverError?: string; serverMessage?: string }) {
  const { t } = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(serverError || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [isTransientError, setIsTransientError] = useState(false);
  const attemptsRef = useRef<number[]>([]);
  const emailRef = useRef<HTMLInputElement>(null);
  const lastFormDataRef = useRef<FormData | null>(null);

  // Auto-focus email on mount
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  function isClientRateLimited(): boolean {
    const now = Date.now();
    // Keep only attempts within the window
    attemptsRef.current = attemptsRef.current.filter((ts) => now - ts < LOCKOUT_MS);
    return attemptsRef.current.length >= MAX_ATTEMPTS;
  }

  function handleRetry() {
    if (lastFormDataRef.current) {
      handleSubmit(lastFormDataRef.current);
    }
  }

  function handleSubmit(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Client-side: both fields non-empty
    if (!email.trim() || !password.trim()) {
      setError(t('errors.EMPTY_FIELDS'));
      return;
    }

    // Client-side rate limiting
    if (isClientRateLimited()) {
      setError(t('errors.RATE_LIMITED'));
      setRateLimited(true);
      return;
    }

    setError('');
    setRateLimited(false);
    setIsTransientError(false);

    startTransition(async () => {
      try {
        const result = await signIn(formData);

        if (!result.success) {
          // Track failed attempt
          attemptsRef.current.push(Date.now());

          if (result.rateLimited || isClientRateLimited()) {
            setRateLimited(true);
            setError(t('errors.RATE_LIMITED'));
          } else {
            const key = result.error || 'GENERIC';
            const translated = t(`errors.${key}`);
            setError(translated !== `errors.${key}` ? translated : (result.error || t('errors.GENERIC')));
          }
          return;
        }

        router.push('/');
        router.refresh();
      } catch (err) {
        const errorKind = categorizeAuthError(err);
        const key = getErrorKey(errorKind);
        const translated = t(`errors.${key}`);
        setError(translated !== `errors.${key}` ? translated : key);
        if (errorKind.kind === 'network' || errorKind.kind === 'server') {
          setIsTransientError(true);
          lastFormDataRef.current = formData;
        }
      }
    });
  }

  // Translate flash messages from server (e.g. password-reset-success, SESSION_EXPIRED)
  const flashText = serverMessage
    ? (() => {
        const translated = t(`flash.${serverMessage}`);
        return translated !== `flash.${serverMessage}` ? translated : serverMessage;
      })()
    : null;

  return (
    <>
      {error && (
        <AuthErrorBanner message={error} onRetry={isTransientError ? handleRetry : undefined}>
          {rateLimited && (
            <Link href="/forgot-password" className="mt-1 block text-tv-link hover:text-tv-link-hover">
              {t('login.resetPasswordLink')}
            </Link>
          )}
        </AuthErrorBanner>
      )}
      {flashText && !error && (
        <div role="status" className="mb-4 rounded-xl bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {flashText}
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
            disabled={isPending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-xl border border-tv-border bg-tv-surface px-4 text-white placeholder-tv-muted outline-none focus:border-tv-accent focus:ring-1 focus:ring-tv-accent disabled:opacity-50"
            placeholder={t('common.emailPlaceholder')}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-tv-text">
              {t('common.password')}
            </label>
            <Link href="/forgot-password" className="text-sm text-tv-link hover:text-tv-link-hover">
              {t('login.forgotPassword')}
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
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
        </div>
        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-tv-border bg-tv-surface text-tv-accent focus:ring-tv-accent focus:ring-offset-0"
          />
          <span className="text-sm text-tv-muted">{t('login.rememberMe')}</span>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-tv-accent text-lg font-medium text-white transition-colors hover:bg-tv-accent-hover focus-visible:ring-2 focus-visible:ring-tv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-tv-bg disabled:opacity-50"
        >
          {isPending ? (
            <>
              <CircleNotch size={20} className="animate-spin" />
              {t('login.submitting')}
            </>
          ) : (
            t('login.submit')
          )}
        </button>
      </form>
    </>
  );
}

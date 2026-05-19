'use client';

import { useState, useEffect, useTransition } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { resendVerification } from '@/app/(auth)/register/actions';
import { useTranslations } from '@/lib/i18n/client';

export function ResendButton({ email }: { email: string }) {
  const { t } = useTranslations();
  const [cooldown, setCooldown] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function handleResend() {
    setMessage(null);

    startTransition(async () => {
      const result = await resendVerification(email);

      if (result.success) {
        setMessage({ type: 'success', text: t('verifyEmail.resendSuccess') });
        setCooldown(60);
      } else {
        setMessage({ type: 'error', text: result.error || t('verifyEmail.resendError') });
      }
    });
  }

  const disabled = isPending || cooldown > 0;

  return (
    <div>
      <button
        onClick={handleResend}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded text-sm text-tv-link hover:text-tv-link-hover focus-visible:ring-2 focus-visible:ring-tv-accent disabled:text-tv-muted disabled:hover:text-tv-muted"
      >
        {isPending && <CircleNotch size={14} className="animate-spin" />}
        {cooldown > 0
          ? t('verifyEmail.resendCooldown', { seconds: String(cooldown) })
          : isPending
            ? t('verifyEmail.resendSending')
            : t('verifyEmail.resend')}
      </button>
      {message && (
        <p role={message.type === 'error' ? 'alert' : 'status'} className={`mt-2 text-xs ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

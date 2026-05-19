'use client';

import { ArrowClockwise } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from '@/lib/i18n/client';

interface AuthErrorBannerProps {
  message: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}

export function AuthErrorBanner({ message, onRetry, children }: AuthErrorBannerProps) {
  const { t } = useTranslations();

  return (
    <div role="alert" className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center gap-1.5 rounded text-sm font-medium text-red-300 hover:text-red-200 focus-visible:ring-2 focus-visible:ring-tv-accent"
        >
          <ArrowClockwise size={16} />
          {t('common.tryAgain')}
        </button>
      )}
      {children}
    </div>
  );
}

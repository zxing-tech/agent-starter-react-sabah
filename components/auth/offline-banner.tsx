'use client';

import { WifiSlash } from '@phosphor-icons/react/dist/ssr';
import { useOffline } from '@/hooks/useOffline';
import { useTranslations } from '@/lib/i18n/client';

export function OfflineBanner() {
  const isOffline = useOffline();
  const { t } = useTranslations();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-tv-surface/95 px-4 py-2.5 backdrop-blur-sm"
    >
      <WifiSlash size={18} className="text-amber-400" weight="bold" />
      <span className="text-sm text-amber-200">
        {t('common.offline')}
      </span>
    </div>
  );
}

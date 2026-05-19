'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobeSimple, CaretDown } from '@phosphor-icons/react';
import { locales, localeNames, type Locale } from '@/lib/i18n/config';
import { useLocale } from '@/lib/i18n/client';
import { setLocale } from '@/lib/i18n/actions';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSelect(newLocale: Locale) {
    setOpen(false);
    if (newLocale === locale) return;
    await setLocale(newLocale);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-tv-border bg-tv-surface/80 px-3 py-1.5 text-sm text-tv-text backdrop-blur-sm transition-colors hover:bg-tv-border hover:text-white"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <GlobeSimple size={16} />
        <span>{localeNames[locale]}</span>
        <CaretDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-tv-border bg-tv-surface py-1 shadow-xl"
        >
          {locales.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <button
                type="button"
                onClick={() => handleSelect(l)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-tv-border ${
                  l === locale ? 'text-tv-link' : 'text-tv-text'
                }`}
              >
                {localeNames[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

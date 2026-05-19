'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ActivationGateProps {
  onActivated: () => void;
  onCancel: () => void;
}

const REASON_MESSAGES: Record<string, string> = {
  missing_code: 'Please enter your activation code.',
  not_authenticated: 'You need to be signed in to use an activation code.',
  code_not_found: 'That code does not exist. Check the characters and try again.',
  code_unavailable: 'That code has already been used, expired, or been revoked.',
  rpc_error: 'Something went wrong on our side. Please try again.',
};

export function ActivationGate({ onActivated, onCancel }: ActivationGateProps) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/redeem-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok: boolean; reason?: string };
      if (data.ok) {
        onActivated();
      } else {
        setError(REASON_MESSAGES[data.reason ?? ''] ?? 'Could not validate that code.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
      <h2 className="text-xl font-semibold text-white">Enter activation code</h2>
      <p className="mt-2 text-sm text-slate-300">
        You need a one-time activation code to start a therapy session.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="text-sm font-medium text-slate-200">
            Activation code
          </label>
          <input
            id="code"
            autoFocus
            autoComplete="off"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="XXXXXXXXXXXX"
            maxLength={16}
            className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 font-mono tracking-wider text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={submitting || code.length < 6}
            className="flex-1 border-0 text-white"
            style={{ background: 'linear-gradient(135deg, #1A8A8A, #47C4CF)' }}
          >
            {submitting ? 'Activating…' : 'Activate'}
          </Button>
        </div>
      </form>
    </div>
  );
}

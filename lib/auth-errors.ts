export type AuthErrorKind =
  | { kind: 'network' }
  | { kind: 'server' }
  | { kind: 'unknown'; message: string };

export function categorizeAuthError(error: unknown): AuthErrorKind {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('fetch failed') ||
      msg.includes('networkerror') ||
      msg.includes('failed to fetch') ||
      msg.includes('network request failed') ||
      msg.includes('load failed')
    ) {
      return { kind: 'network' };
    }
  }

  if (
    error instanceof Error &&
    error.message.toLowerCase().includes('network')
  ) {
    return { kind: 'network' };
  }

  if (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    (error as { status: number }).status >= 500
  ) {
    return { kind: 'server' };
  }

  const message =
    error instanceof Error
      ? error.message
      : 'GENERIC';

  return { kind: 'unknown', message };
}

/** Returns an error CODE suitable for translation via t(`errors.${key}`). */
export function getErrorKey(errorKind: AuthErrorKind): string {
  if (errorKind.kind === 'network') return 'NETWORK';
  if (errorKind.kind === 'server') return 'SERVER';
  return errorKind.message;
}

/**
 * OPSLY theme constants.
 * Central place for shared color / status mappings so components change here.
 */
export const brandPalette = {
  primary: {
    bg: 'bg-brand-600',
    text: 'text-brand-600',
    ring: 'focus:ring-brand-500',
  },
} as const;

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

/** Tailwind class pairs for a Badge element. */
export const badgeStyles: Record<Tone, { container: string; label: string; dot: string }> = {
  neutral: {
    container: 'bg-surface-100 text-surface-700 ring-surface-200',
    label: 'text-surface-700',
    dot: 'bg-surface-400',
  },
  success: {
    container: 'bg-success-50 text-success-700 ring-success-100',
    label: 'text-success-700',
    dot: 'bg-success-500',
  },
  warning: {
    container: 'bg-warning-50 text-warning-700 ring-warning-100',
    label: 'text-warning-700',
    dot: 'bg-warning-500',
  },
  danger: {
    container: 'bg-danger-50 text-danger-700 ring-danger-100',
    label: 'text-danger-700',
    dot: 'bg-danger-500',
  },
  info: {
    container: 'bg-info-50 text-info-700 ring-info-100',
    label: 'text-info-700',
    dot: 'bg-info-500',
  },
  brand: {
    container: 'bg-brand-50 text-brand-700 ring-brand-100',
    label: 'text-brand-700',
    dot: 'bg-brand-500',
  },
};

/** Map a raw domain value to a display tone. Edit here to restyle the app. */
export function toneFor(value: string | null | undefined): Tone {
  if (!value) return 'neutral';
  const v = value.toLowerCase();

  if (['healthy', 'active', 'live', 'valid', 'completed', 'ok', 'resolved', 'success', 'closed', 'running'].includes(v)) {
    return 'success';
  }
  if (['degraded', 'building', 'deploying', 'acknowledged', 'queued'].includes(v)) {
    return 'warning';
  }
  if (['down', 'failed', 'inactive', 'critical', 'error', 'invalid', 'triggered', 'rolling_back'].includes(v)) {
    return 'danger';
  }
  if (['investigating', 'detected', 'pending', 'validating', 'unknown'].includes(v)) {
    return 'info';
  }
  return 'neutral';
}

/** Map role name to a tone. */
export function roleTone(role: string | null | undefined): Tone {
  switch (role) {
    case 'owner':
    case 'admin':
      return 'danger';
    case 'operator':
      return 'info';
    case 'viewer':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export const providerLogos: Record<string, string> = {
  render: '⚙️',
  cloudflare: '☁️',
  neon: '⚡',
  upstash: '🔥',
  'mongodb-atlas': '🍃',
};
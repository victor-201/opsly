import { providerLogos } from '../../lib/theme';

export function ProviderLogo({ providerType, className = 'h-5 w-5' }: { providerType: string; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-hidden="true">
      {providerLogos[providerType] ?? providerLogos.cloudflare}
    </span>
  );
}

export function projectLogo(providerType?: string): string {
  return (providerType && providerLogos[providerType]) || '☁️';
}
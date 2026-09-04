export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code: string = 'PROVIDER_ERROR',
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: string, message = 'Authentication failed') {
    super(message, provider, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(
    provider: string,
    public readonly retryAfter?: number,
  ) {
    super('Rate limit exceeded', provider, 'RATE_LIMITED');
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends ProviderError {
  constructor(provider: string) {
    super('Request timed out', provider, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

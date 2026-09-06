import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@opsly/provider-core': fileURLToPath(
        new URL('../../packages/provider-core/src', import.meta.url),
      ),
      '@opsly/shared': fileURLToPath(
        new URL('../../packages/shared/src', import.meta.url),
      ),
      '@opsly/database': fileURLToPath(
        new URL('../../packages/database/src', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
  },
});
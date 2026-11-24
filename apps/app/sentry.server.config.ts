// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  // Sentry is disabled by default in self-hosted mode unless an explicit SENTRY_DSN is configured.
  // Never falls back to upstream Sentry cloud.
  enabled: Boolean(process.env.SENTRY_DSN),

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // Off in production: local variables in stack frames can expose request-scoped
  // data (DB rows, auth tokens, request bodies) to Sentry payloads.
  includeLocalVariables: process.env.NODE_ENV !== 'production',

  enableLogs: Boolean(process.env.SENTRY_DSN),
});

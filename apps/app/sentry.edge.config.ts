// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',

  // Sentry is disabled by default in self-hosted mode unless an explicit SENTRY_DSN is configured.
  // Never falls back to upstream Sentry cloud.
  enabled: Boolean(process.env.SENTRY_DSN),

  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  enableLogs: Boolean(process.env.SENTRY_DSN),
});

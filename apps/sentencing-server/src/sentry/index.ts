import { init } from "@sentry/node";

init({
  dsn: import.meta.env["VITE_SENTRY_DSN"],
  environment: import.meta.env["VITE_SENTRY_ENV"],
  tracesSampleRate: 1.0,
  // Prisma disabled until https://github.com/getsentry/sentry-javascript/issues/11216 is fixed
  // integrations: [prismaIntegration()],
});

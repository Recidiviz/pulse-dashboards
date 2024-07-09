import { init, prismaIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

init({
  dsn: import.meta.env["VITE_SENTRY_DSN"],
  environment: import.meta.env["VITE_SENTRY_ENV"],
  tracesSampleRate: 0.25,
  profilesSampleRate: 0.25,
  integrations: [nodeProfilingIntegration(), prismaIntegration()],
});

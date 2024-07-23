import { init, prismaIntegration } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

init({
  dsn: process.env["SENTRY_DSN"],
  environment: process.env["SENTRY_ENV"],
  tracesSampleRate: 0.25,
  profilesSampleRate: 0.1,
  integrations: [nodeProfilingIntegration(), prismaIntegration()],
});

import { expect, vi } from "vitest";

import { testkit } from "~sentencing-server/test/setup";

export async function testAndGetSentryReport() {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(1);

    return reports;
  });

  return sentryReports[0];
}

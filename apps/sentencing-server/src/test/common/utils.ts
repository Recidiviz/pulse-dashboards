import { expect, vi } from "vitest";

import { testkit } from "~sentencing-server/test/setup";

export async function testAndGetSentryReports(expectedLength = 1) {
  // Use waitFor because sentry-testkit can be async
  const sentryReports = await vi.waitFor(async () => {
    const reports = testkit.reports();
    expect(reports).toHaveLength(expectedLength);

    return reports;
  });

  return sentryReports;
}

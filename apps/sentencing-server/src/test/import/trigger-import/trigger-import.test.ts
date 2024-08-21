import { describe, expect, test } from "vitest";

import { testAndGetSentryReports } from "~sentencing-server/test/common/utils";
import { samplePayloadMessage } from "~sentencing-server/test/import/trigger-import/constants";
import { testServer } from "~sentencing-server/test/setup";

describe("trigger_import", () => {
  test("should log exception and return 200 if bucket is invalid", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: {
        message: {
          attributes: {
            bucketId: "not-the-right-bucket",
            objectId: "US_ID/sentencing_case_record.json",
          },
        },
      },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReports = await testAndGetSentryReports();
    expect(sentryReports[0].error?.message).toBe(
      "Unsupported bucket + object pair: not-the-right-bucket/US_ID/sentencing_case_record.json",
    );
  });

  test("should log exception and return 200 if state is invalid", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: {
        message: {
          attributes: {
            bucketId: "test-bucket",
            objectId: "US_MO/sentencing_case_record.json",
          },
        },
      },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReports = await testAndGetSentryReports();
    expect(sentryReports[0].error?.message).toBe(
      "Unsupported bucket + object pair: test-bucket/US_MO/sentencing_case_record.json",
    );
  });

  test("should log exception and return 200 if file name is invalid", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: {
        message: {
          attributes: {
            bucketId: "test-bucket",
            objectId: "US_ID/random_file.json",
          },
        },
      },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    const sentryReports = await testAndGetSentryReports();
    expect(sentryReports[0].error?.message).toBe(
      "Unsupported bucket + object pair: test-bucket/US_ID/random_file.json",
    );
  });

  test("should work if everything is correct", async () => {
    const response = await testServer.inject({
      method: "POST",
      url: "/trigger_import",
      payload: { message: samplePayloadMessage },
      headers: { authorization: `Bearer token` },
    });

    expect(response).toMatchObject({
      statusCode: 200,
    });

    // No errors should have been reported
    await testAndGetSentryReports(0);
  });
});

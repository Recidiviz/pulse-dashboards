// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.
// =============================================================================

import { isOfflineMode } from "../../utils/isOfflineMode";
import {
  createTypesenseBackfillClient,
  createTypesenseInspectClient,
} from "../client";
import {
  typesenseAllCollectionsSchemas,
  typesenseBackfill,
  typesenseCollectionsSummary,
  typesenseHealth,
} from "../typesenseManagement";

vi.mock("../client");
vi.mock("../../utils/isOfflineMode");

const recidivizReq = {
  user: { undefinedapp_metadata: { state_code: "recidiviz" } },
};

function buildRes() {
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  return {
    res: { send, set: vi.fn(), status },
    send,
    status,
  };
}

beforeEach(() => {
  isOfflineMode.mockReturnValue(false);
});

describe("typesenseHealth", () => {
  test("returns ok when the cluster is healthy", async () => {
    createTypesenseInspectClient.mockReturnValue({
      health: { retrieve: vi.fn().mockResolvedValue({ ok: true }) },
    });

    const { res, send } = buildRes();
    await typesenseHealth(recidivizReq, res);

    expect(send).toHaveBeenCalledWith({ ok: true, host: null });
  });

  test("responds 503 when the cluster reports unhealthy", async () => {
    createTypesenseInspectClient.mockReturnValue({
      health: { retrieve: vi.fn().mockResolvedValue({ ok: false }) },
    });

    const { res, send, status } = buildRes();
    await typesenseHealth(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(send).toHaveBeenCalledWith({
      status: 503,
      errors: ["Typesense reported unhealthy"],
      host: null,
    });
  });

  test("responds 503 when the cluster is unreachable", async () => {
    createTypesenseInspectClient.mockReturnValue({
      health: {
        retrieve: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
      },
    });

    const { res, send, status } = buildRes();
    await typesenseHealth(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(503);
    expect(send).toHaveBeenCalledWith({
      status: 503,
      errors: ["ECONNREFUSED"],
      host: null,
    });
  });

  test("responds 500 with the specific message when config is missing", async () => {
    createTypesenseInspectClient.mockImplementation(() => {
      throw new Error("TYPESENSE_HOST is not configured for this environment");
    });

    const { res, send, status } = buildRes();
    await typesenseHealth(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      status: 500,
      errors: ["TYPESENSE_HOST is not configured for this environment"],
    });
  });

  test("responds 403 for non-recidiviz users", async () => {
    const { res, status } = buildRes();
    await typesenseHealth(
      { user: { undefinedapp_metadata: { state_code: "us_xx" } } },
      res,
    );

    expect(createTypesenseInspectClient).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });
});

describe("typesenseCollectionsSummary", () => {
  test("returns a trimmed summary of all collections for recidiviz users", async () => {
    const collectionsRetrieve = vi.fn().mockResolvedValue([
      {
        name: "clients",
        num_documents: 42,
        fields: [{ name: "stateCode" }, { name: "personName" }],
        default_sorting_field: "",
        created_at: 1700000000,
      },
    ]);
    createTypesenseInspectClient.mockReturnValue({
      collections: () => ({ retrieve: collectionsRetrieve }),
    });

    const { res, send } = buildRes();
    await typesenseCollectionsSummary(recidivizReq, res);

    expect(send).toHaveBeenCalledWith([
      {
        name: "clients",
        numDocuments: 42,
        numFields: 2,
        defaultSortingField: null,
        createdAt: 1700000000,
      },
    ]);
  });

  test("responds 403 for non-recidiviz users without hitting Typesense", async () => {
    const { res, send, status } = buildRes();
    await typesenseCollectionsSummary(
      { user: { undefinedapp_metadata: { state_code: "us_xx" } } },
      res,
    );

    expect(createTypesenseInspectClient).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(send).toHaveBeenCalledWith({
      status: 403,
      errors: ["User does not have permission to access this resource"],
    });
  });

  test("allows access in offline mode", async () => {
    isOfflineMode.mockReturnValue(true);
    const collectionsRetrieve = vi.fn().mockResolvedValue([]);
    createTypesenseInspectClient.mockReturnValue({
      collections: () => ({ retrieve: collectionsRetrieve }),
    });

    const { res, send } = buildRes();
    await typesenseCollectionsSummary({ user: {} }, res);

    expect(send).toHaveBeenCalledWith([]);
  });

  test("surfaces Typesense errors via the responder", async () => {
    createTypesenseInspectClient.mockImplementation(() => {
      throw new Error("TYPESENSE_API_INSPECT_KEY is not configured");
    });

    const { res, send, status } = buildRes();
    await typesenseCollectionsSummary(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      status: 500,
      errors: ["TYPESENSE_API_INSPECT_KEY is not configured"],
    });
  });
});

describe("typesenseAllCollectionsSchemas", () => {
  test("returns all collection schemas keyed by name", async () => {
    const collections = [
      {
        name: "clients",
        num_documents: 42,
        fields: [{ name: "stateCode", type: "string" }],
        default_sorting_field: "",
      },
      {
        name: "residents",
        num_documents: 10,
        fields: [{ name: "stateCode", type: "string" }],
        default_sorting_field: "",
      },
    ];
    createTypesenseInspectClient.mockReturnValue({
      collections: () => ({ retrieve: vi.fn().mockResolvedValue(collections) }),
    });

    const { res, send } = buildRes();
    await typesenseAllCollectionsSchemas(recidivizReq, res);

    expect(send).toHaveBeenCalledWith({
      clients: collections[0],
      residents: collections[1],
    });
  });

  test("responds 403 for non-recidiviz users without hitting Typesense", async () => {
    const { res, status } = buildRes();
    await typesenseAllCollectionsSchemas(
      { user: { undefinedapp_metadata: { state_code: "us_xx" } } },
      res,
    );

    expect(createTypesenseInspectClient).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  test("surfaces Typesense errors via the responder", async () => {
    createTypesenseInspectClient.mockReturnValue({
      collections: () => ({
        retrieve: vi.fn().mockRejectedValue(new Error("connection failed")),
      }),
    });

    const { res, send, status } = buildRes();
    await typesenseAllCollectionsSchemas(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      status: 500,
      errors: ["connection failed"],
    });
  });
});

describe("typesenseBackfill", () => {
  test("triggers the backfill function and returns its response", async () => {
    const request = vi.fn().mockResolvedValue({ data: { ok: true } });
    createTypesenseBackfillClient.mockResolvedValue({
      url: "https://typesense-backfill-abc123-us-east1.a.run.app",
      idTokenClient: { request },
    });

    const { res, send } = buildRes();
    await typesenseBackfill(recidivizReq, res);

    expect(request).toHaveBeenCalledWith({
      url: "https://typesense-backfill-abc123-us-east1.a.run.app",
      method: "POST",
      data: {},
    });
    expect(send).toHaveBeenCalledWith({ ok: true });
  });

  test("responds 403 for non-recidiviz users without triggering the function", async () => {
    const { res, status } = buildRes();
    await typesenseBackfill(
      { user: { undefinedapp_metadata: { state_code: "us_xx" } } },
      res,
    );

    expect(createTypesenseBackfillClient).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  test("surfaces errors when the function URL is not configured", async () => {
    createTypesenseBackfillClient.mockRejectedValue(
      new Error(
        "TYPESENSE_BACKFILL_FUNCTION_URL is not configured for this environment",
      ),
    );

    const { res, send, status } = buildRes();
    await typesenseBackfill(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      status: 500,
      errors: [
        "TYPESENSE_BACKFILL_FUNCTION_URL is not configured for this environment",
      ],
    });
  });

  test("surfaces errors from the function call", async () => {
    const request = vi.fn().mockRejectedValue(new Error("backfill failed"));
    createTypesenseBackfillClient.mockResolvedValue({
      url: "https://typesense-backfill-abc123-us-east1.a.run.app",
      idTokenClient: { request },
    });

    const { res, send, status } = buildRes();
    await typesenseBackfill(recidivizReq, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({
      status: 500,
      errors: ["backfill failed"],
    });
  });
});

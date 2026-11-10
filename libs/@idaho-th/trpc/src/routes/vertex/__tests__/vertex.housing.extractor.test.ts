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

import { TRPCError } from "@trpc/server";

import { HousingApplicationDocumentScanStatus } from "~@idaho-th/prisma/client";
import {
  DEFAULT_TOTAL_PAGES,
  PDF_OUTPUT_MODE,
} from "~@idaho-th/trpc/pdfSorter/constants";
import { PdfProcessingError } from "~@idaho-th/trpc/pdfSorter/errors";
import { VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS } from "~@idaho-th/trpc/routes/vertex/constants";
import {
  VertexExtractionError,
  VertexExtractionTimeoutError,
  VertexQuotaExceededError,
  VertexResponseValidationError,
  VertexSafetyBlockedError,
} from "~@idaho-th/trpc/routes/vertex/vertex.errors";
import { buildVertexExtractionSchemas } from "~@idaho-th/trpc/routes/vertex/vertex.schema";
import type {
  HousingVertexProcedureDeps,
  HousingVertexProcedureMeta,
  PreparedPdf,
  PreparedPdfGcsUploadResult,
} from "~@idaho-th/trpc/routes/vertex/vertex.types";
import { createHousingProvider } from "~@idaho-th/trpc/test/factories";
import { testPrismaClient } from "~@idaho-th/trpc/test/setup";
import { classifyTrpcError, ERROR_KIND } from "~observability";

import { buildExtracted } from "./vertex.fixtures";

const prepareMocks = vi.hoisted(() => ({ preparePdfSafely: vi.fn() }));
const draftIntakeMocks = vi.hoisted(() => ({
  createDraftIntakeApplication: vi.fn(),
  createDraftIntakeApplicationShell: vi.fn(),
  finalizeDraftIntakeApplicationData: vi.fn(),
  getDocumentScanState: vi.fn(),
  tryCleanupIntakeShell: vi.fn(),
}));
const gcsMocks = vi.hoisted(() => ({
  deleteGcsObject: vi.fn(),
  generateSignedReadUrl: vi.fn(),
  signingFailureTrpcError: vi.fn((error: unknown) => error),
}));
const uploadMocks = vi.hoisted(() => ({
  uploadPreparedCombinedPdfToGcs: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/pdfSorter/prepare/preparePdfSafely", () => ({
  preparePdfSafely: prepareMocks.preparePdfSafely,
}));

vi.mock("~@idaho-th/trpc/routes/draftIntake/draftIntake.service", () => ({
  ...draftIntakeMocks,
}));

vi.mock("~@idaho-th/trpc/storage/gcs", () => ({ ...gcsMocks }));

vi.mock("~@idaho-th/trpc/routes/vertex/vertex.preparedPdf.upload", () => ({
  ...uploadMocks,
}));

const {
  extractWithVertexAIService,
  loadProviderCatalog,
  mapVertexProcedureError,
  resolveExtractedPreferredProviders,
  resolveExtractionConfig,
  runExtraction,
} = await import("~@idaho-th/trpc/routes/vertex/vertex.housing.extractor");

const PROVIDER_NAMES = ["Sunrise House", "Lakeside Home"];
const PDF_BASE64 = Buffer.from("%PDF-1.7 fake").toString("base64");

const META: HousingVertexProcedureMeta = {
  traceId: "trace-1",
  procedureName: "vertex.extractWithVertexAI",
  staffPseudonymizedId: "staff-1",
};

/**
 * A complete extraction payload. Every page returns the same one: the merge
 * across pages has to produce something the mapper accepts, and which page
 * contributed which field is the mapper suite's concern, not this one's.
 */
const PAGE_DATA = buildExtracted();

function buildDeps(
  analyzeApplicationPdf = vi.fn().mockResolvedValue({ data: PAGE_DATA }),
): {
  deps: HousingVertexProcedureDeps;
  analyzeApplicationPdf: typeof analyzeApplicationPdf;
} {
  return {
    analyzeApplicationPdf,
    deps: {
      extractor: { analyzeApplicationPdf } as never,
      prisma: testPrismaClient,
      log: { info: vi.fn(), error: vi.fn() },
    },
  };
}

function buildPrepared(overrides: Partial<PreparedPdf> = {}): PreparedPdf {
  return {
    perPageBase64: Array.from(
      { length: DEFAULT_TOTAL_PAGES },
      () => PDF_BASE64,
    ),
    combinedBase64: PDF_BASE64,
    missingPageNumbers: [],
    ...overrides,
  };
}

const UPLOAD_RESULT: PreparedPdfGcsUploadResult = {
  objectKey:
    "applications/staff/staff-1/HANDWRITTEN_SOURCE/obj_handwritten-application.pdf",
  bucketName: "quarantine-bucket",
  contentType: "application/pdf",
  fileName: "obj_handwritten-application.pdf",
  sizeInBytes: 2048,
  updatedAt: "2026-07-08T00:00:00.000Z",
  signedUrl: "https://quarantine-signed-url",
};

beforeEach(() => {
  prepareMocks.preparePdfSafely.mockResolvedValue(buildPrepared());
  uploadMocks.uploadPreparedCombinedPdfToGcs.mockResolvedValue(UPLOAD_RESULT);
  draftIntakeMocks.getDocumentScanState.mockResolvedValue({
    scanStatus: HousingApplicationDocumentScanStatus.CLEAN,
    bucketName: "clean-bucket",
  });
  gcsMocks.generateSignedReadUrl.mockResolvedValue("https://signed-url");
});

describe("mapVertexProcedureError", () => {
  it.each([
    [
      new VertexExtractionTimeoutError("timed out"),
      "TIMEOUT",
      ERROR_KIND.UNEXPECTED,
    ],
    [
      new VertexResponseValidationError("bad shape"),
      "BAD_REQUEST",
      ERROR_KIND.UNEXPECTED,
    ],
    [
      new VertexQuotaExceededError(),
      "TOO_MANY_REQUESTS",
      ERROR_KIND.UNEXPECTED,
    ],
    [new VertexSafetyBlockedError(), "BAD_REQUEST", ERROR_KIND.EXPECTED],
    [
      new VertexExtractionError("extraction failed"),
      "BAD_REQUEST",
      ERROR_KIND.UNEXPECTED,
    ],
    [
      new PdfProcessingError("pdf broken"),
      "BAD_REQUEST",
      ERROR_KIND.UNEXPECTED,
    ],
  ])("maps %s to %s, classified %s", (error, code, kind) => {
    const mapped = mapVertexProcedureError(error);

    expect(mapped).toBeInstanceOf(TRPCError);
    expect(mapped.code).toBe(code);
    expect(mapped.message).toBe(error.message);
    expect(mapped.cause).toBe(error);
    expect(classifyTrpcError(mapped).kind).toBe(kind);
  });

  it.each([
    [
      "a VertexExtractionError",
      new VertexExtractionError("missing form pages", { userCaused: true }),
    ],
    [
      "a PdfProcessingError",
      new PdfProcessingError("too many pages", { userCaused: true }),
    ],
  ])("keeps %s flagged userCaused out of Sentry", (_label, error) => {
    const mapped = mapVertexProcedureError(error);

    expect(mapped.code).toBe("BAD_REQUEST");
    expect(mapped.message).toBe(error.message);
    expect(mapped.cause).toBe(error);
    expect(classifyTrpcError(mapped).kind).toBe(ERROR_KIND.EXPECTED);
  });

  it("maps an unrecognised error to INTERNAL_SERVER_ERROR", () => {
    const error = new Error("postgres connection refused");

    const mapped = mapVertexProcedureError(error);

    // The code is what the client sees; init.ts's errorFormatter masks the
    // message of every INTERNAL_SERVER_ERROR before it leaves the server.
    expect(mapped.code).toBe("INTERNAL_SERVER_ERROR");
    expect(mapped.cause).toBe(error);
  });

  it("maps a non-Error throw to a generic 500", () => {
    expect(mapVertexProcedureError("something went wrong").code).toBe(
      "INTERNAL_SERVER_ERROR",
    );
  });
});

describe("resolveExtractionConfig", () => {
  it("defaults to per-page extraction with an uploaded prepared PDF", () => {
    expect(resolveExtractionConfig()).toEqual({
      usePerPage: true,
      includePerPagePartials: false,
      includeConfidence: false,
      uploadPreparedPdf: true,
      pdfOutputMode: PDF_OUTPUT_MODE.PER_PAGE,
      // Uploading needs a combined PDF as well as the split pages.
      preparationOutputMode: PDF_OUTPUT_MODE.BOTH,
    });
  });

  it.each([
    [PDF_OUTPUT_MODE.PER_PAGE, PDF_OUTPUT_MODE.PER_PAGE],
    [PDF_OUTPUT_MODE.COMBINED, PDF_OUTPUT_MODE.COMBINED],
    [PDF_OUTPUT_MODE.BOTH, PDF_OUTPUT_MODE.BOTH],
  ])("honours an explicit %s output mode", (pdfOutputMode, expected) => {
    expect(resolveExtractionConfig({ pdfOutputMode })).toMatchObject({
      pdfOutputMode: expected,
    });
  });

  it("prepares only a combined PDF when per-page extraction is off", () => {
    expect(resolveExtractionConfig({ perPageExtraction: false })).toMatchObject(
      {
        usePerPage: false,
        pdfOutputMode: PDF_OUTPUT_MODE.COMBINED,
        preparationOutputMode: PDF_OUTPUT_MODE.COMBINED,
      },
    );
  });

  it.each([
    // [usePerPage, requested mode, expected preparation mode] with no upload.
    [true, PDF_OUTPUT_MODE.COMBINED, PDF_OUTPUT_MODE.BOTH],
    [true, PDF_OUTPUT_MODE.PER_PAGE, PDF_OUTPUT_MODE.PER_PAGE],
    [true, PDF_OUTPUT_MODE.BOTH, PDF_OUTPUT_MODE.BOTH],
    [false, PDF_OUTPUT_MODE.PER_PAGE, PDF_OUTPUT_MODE.COMBINED],
    [false, PDF_OUTPUT_MODE.COMBINED, PDF_OUTPUT_MODE.COMBINED],
    [false, PDF_OUTPUT_MODE.BOTH, PDF_OUTPUT_MODE.BOTH],
  ])(
    "with usePerPage=%s and mode %s prepares %s when nothing is uploaded",
    (perPageExtraction, pdfOutputMode, expected) => {
      expect(
        resolveExtractionConfig({
          perPageExtraction,
          pdfOutputMode,
          uploadPreparedPdf: false,
        }),
      ).toMatchObject({ preparationOutputMode: expected });
    },
  );

  it("passes the partials and confidence flags straight through", () => {
    expect(
      resolveExtractionConfig({
        includePerPagePartials: true,
        includeConfidence: true,
      }),
    ).toMatchObject({ includePerPagePartials: true, includeConfidence: true });
  });
});

describe("loadProviderCatalog", () => {
  it("returns the seeded provider names", async () => {
    for (const name of PROVIDER_NAMES) {
      // eslint-disable-next-line no-await-in-loop -- seeded one at a time
      await createHousingProvider(testPrismaClient, { name });
    }

    await expect(loadProviderCatalog(testPrismaClient)).resolves.toEqual([
      "Lakeside Home",
      "Sunrise House",
    ]);
  });

  it("refuses to extract against an empty catalog", async () => {
    // Extracting with no provider names would let the model invent one.
    await expect(loadProviderCatalog(testPrismaClient)).rejects.toThrow(
      "Housing provider catalog is empty",
    );
  });
});

// The model's response is names (an exact match against the canonical list
// built moments earlier is the whole point), so this asserts the
// post-processing step converts those names to IDs before anything
// downstream ever sees them, and drops a name that no longer resolves
// (e.g. a rename race) instead of persisting it as a name.
describe("resolveExtractedPreferredProviders", () => {
  it("resolves canonical names to provider IDs and drops an unresolvable name", async () => {
    const sunrise = await createHousingProvider(testPrismaClient, {
      name: "Sunrise House",
    });
    const lakeside = await createHousingProvider(testPrismaClient, {
      name: "Lakeside Home",
    });

    const data = {
      preferredProviders: [
        "Sunrise House",
        "Lakeside Home",
        "Renamed Away Co", // no live provider has this name
      ],
    } as never;

    const resolved = await resolveExtractedPreferredProviders(
      testPrismaClient,
      data,
    );

    expect(resolved.preferredProviders).toEqual([sunrise.id, lakeside.id]);
  });

  it("returns an empty array when nothing in the model's response resolves", async () => {
    const data = { preferredProviders: ["Nobody Home"] } as never;

    const resolved = await resolveExtractedPreferredProviders(
      testPrismaClient,
      data,
    );

    expect(resolved.preferredProviders).toEqual([]);
  });

  it("leaves every other field untouched", async () => {
    const data = {
      preferredProviders: [],
      clientFullName: "Jane Doe",
    } as never;

    const resolved = await resolveExtractedPreferredProviders(
      testPrismaClient,
      data,
    );

    expect(resolved).toMatchObject({ clientFullName: "Jane Doe" });
  });
});

describe("runExtraction", () => {
  const schemas = buildVertexExtractionSchemas(PROVIDER_NAMES);
  const baseOptions = {
    systemPrompt: "system",
    userPrompt: "user",
    responseSchema: schemas.responseSchema,
  };

  function run(
    prepared: PreparedPdf,
    options: Parameters<typeof resolveExtractionConfig>[0],
    analyze?: ReturnType<typeof vi.fn>,
  ) {
    const { deps, analyzeApplicationPdf } = buildDeps(analyze);
    return {
      analyzeApplicationPdf,
      deps,
      result: runExtraction(
        prepared,
        resolveExtractionConfig(options),
        schemas,
        PROVIDER_NAMES,
        baseOptions,
        META,
        deps,
      ),
    };
  }

  it("extracts the combined PDF once when per-page extraction is off", async () => {
    const { analyzeApplicationPdf, result } = run(buildPrepared(), {
      perPageExtraction: false,
    });

    await result;
    expect(analyzeApplicationPdf).toHaveBeenCalledTimes(1);
    expect(analyzeApplicationPdf).toHaveBeenCalledWith(PDF_BASE64, baseOptions);
  });

  it("refuses to extract combined when no combined PDF was prepared", async () => {
    const { result } = run(buildPrepared({ combinedBase64: undefined }), {
      perPageExtraction: false,
    });

    await expect(result).rejects.toThrow("Combined PDF was not prepared");
    await expect(result).rejects.toMatchObject({ userCaused: false });
  });

  it("extracts once per present page", async () => {
    const { analyzeApplicationPdf, result } = run(buildPrepared(), {});

    await result;
    expect(analyzeApplicationPdf).toHaveBeenCalledTimes(DEFAULT_TOTAL_PAGES);
  });

  it("skips absent pages instead of failing the run", async () => {
    const perPageBase64 = [PDF_BASE64, undefined, PDF_BASE64, undefined];
    const { analyzeApplicationPdf, result } = run(
      buildPrepared({ perPageBase64, missingPageNumbers: [2, 4] }),
      {},
    );

    await result;
    expect(analyzeApplicationPdf).toHaveBeenCalledTimes(2);
  });

  it("includes the per-page partials only when asked", async () => {
    const withPartials = await run(buildPrepared(), {
      includePerPagePartials: true,
    }).result;
    expect(withPartials).toHaveProperty("perPagePartials");

    const without = await run(buildPrepared(), {}).result;
    expect(without).not.toHaveProperty("perPagePartials");
  });

  it("rejects a prepared PDF with the wrong number of page slots", async () => {
    const { result } = run(buildPrepared({ perPageBase64: [PDF_BASE64] }), {});

    await expect(result).rejects.toThrow("prepared page slots");
    await expect(result).rejects.toMatchObject({ userCaused: false });
  });

  it("rejects a PDF missing every form page", async () => {
    const { result } = run(
      buildPrepared({
        perPageBase64: Array.from(
          { length: DEFAULT_TOTAL_PAGES },
          () => undefined,
        ),
        missingPageNumbers: [1, 2, 3, 4],
      }),
      {},
    );

    await expect(result).rejects.toThrow("missing all required form pages");
    await expect(result).rejects.toMatchObject({ userCaused: true });
  });

  it("surfaces a non-retryable page failure once, without retrying it", async () => {
    const analyze = vi.fn(async (pdf: string) => {
      void pdf;
      if (analyze.mock.calls.length === 2) {
        throw new VertexResponseValidationError("page 2 shape is wrong");
      }
      return { data: PAGE_DATA };
    });

    const { result } = run(buildPrepared(), {}, analyze);

    await expect(result).rejects.toThrow(VertexResponseValidationError);
    // The wave still settles all four pages, but nothing is retried.
    expect(analyze).toHaveBeenCalledTimes(DEFAULT_TOTAL_PAGES);
  });

  it("retries a retryable page failure up to the attempt ceiling, then reports it", async () => {
    const failingPageBase64 = "failing-page";
    const perPageBase64 = [
      PDF_BASE64,
      failingPageBase64,
      PDF_BASE64,
      PDF_BASE64,
    ];
    const analyze = vi.fn(async (pdf: string) => {
      if (pdf === failingPageBase64) {
        throw new VertexExtractionError("transient page failure");
      }
      return { data: PAGE_DATA };
    });

    const { result } = run(buildPrepared({ perPageBase64 }), {}, analyze);

    await expect(result).rejects.toThrow(
      `after ${VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS} attempts`,
    );
    // Three pages succeed on the first wave; only the failing one is retried.
    const failingAttempts = analyze.mock.calls.filter(
      ([pdf]) => pdf === failingPageBase64,
    );
    expect(failingAttempts).toHaveLength(
      VERTEX_HOUSING_PAGE_MAX_EXTRACTION_ATTEMPTS,
    );
  });

  it("keeps the pages that succeeded while a sibling page is retrying", async () => {
    const failingPageBase64 = "failing-page";
    const perPageBase64 = [
      PDF_BASE64,
      failingPageBase64,
      PDF_BASE64,
      PDF_BASE64,
    ];
    const analyze = vi.fn(async (pdf: string) => {
      if (pdf === failingPageBase64 && analyze.mock.calls.length <= 4) {
        throw new VertexExtractionError("transient page failure");
      }
      return { data: PAGE_DATA };
    });

    await expect(
      run(buildPrepared({ perPageBase64 }), {}, analyze).result,
    ).resolves.toBeDefined();

    // The three healthy pages were each called exactly once.
    expect(
      analyze.mock.calls.filter(([pdf]) => pdf === PDF_BASE64),
    ).toHaveLength(3);
  });
});

describe("extractWithVertexAIService", () => {
  beforeEach(async () => {
    for (const name of PROVIDER_NAMES) {
      // eslint-disable-next-line no-await-in-loop -- seeded one at a time
      await createHousingProvider(testPrismaClient, { name });
    }
  });

  it("persists and returns preferred providers as IDs, dropping a name that no longer resolves", async () => {
    const stubbedPageData = {
      ...PAGE_DATA,
      housingPreferences: {
        ...PAGE_DATA.housingPreferences,
        preferredProviders: [
          "Sunrise House",
          "Lakeside Home",
          "Renamed Away Co", // simulates a rename race: no live provider matches
        ],
      },
    };
    const { deps } = buildDeps(
      vi.fn().mockResolvedValue({ data: stubbedPageData }),
    );

    const result = await extractWithVertexAIService(PDF_BASE64, META, deps);

    const seededProviders = await testPrismaClient.housingProvider.findMany({
      where: { name: { in: PROVIDER_NAMES } },
    });
    const idByName = new Map(seededProviders.map((p) => [p.name, p.id]));
    const expectedIds = [
      idByName.get("Sunrise House"),
      idByName.get("Lakeside Home"),
    ];

    // The API response carries IDs...
    expect(result.application.preferredProviders).toEqual(expectedIds);
    // ...and so does what's handed to persistence, which writes the same
    // value to both formData and rawAiResponse (see draftIntake.service.ts's
    // finalizeDraftIntakeApplicationData) — so asserting this one argument
    // covers both persisted columns.
    expect(
      draftIntakeMocks.finalizeDraftIntakeApplicationData,
    ).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        formData: expect.objectContaining({
          preferredProviders: expectedIds,
        }),
      }),
    );
  });

  it("uploads the prepared PDF, creates one shell and returns the signed URL", async () => {
    const { deps } = buildDeps();

    const result = await extractWithVertexAIService(PDF_BASE64, META, deps);

    expect(result.applicationId).toBeTruthy();
    expect(result.preparedPdf).toEqual({
      signedUrl: "https://signed-url",
      sizeInBytes: UPLOAD_RESULT.sizeInBytes,
      updatedAt: UPLOAD_RESULT.updatedAt,
    });

    expect(
      draftIntakeMocks.createDraftIntakeApplicationShell,
    ).toHaveBeenCalledTimes(1);
    expect(
      draftIntakeMocks.createDraftIntakeApplicationShell,
    ).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        applicationId: result.applicationId,
        staffPseudonymizedId: META.staffPseudonymizedId,
        document: expect.objectContaining({
          objectKey: UPLOAD_RESULT.objectKey,
          // Derived from the object key's last segment, not from client input.
          fileName: "obj_handwritten-application.pdf",
        }),
      }),
    );
    expect(
      draftIntakeMocks.finalizeDraftIntakeApplicationData,
    ).toHaveBeenCalledTimes(1);
    expect(
      draftIntakeMocks.createDraftIntakeApplication,
    ).not.toHaveBeenCalled();
  });

  it("creates no shell and writes the application directly when upload is off", async () => {
    const { deps } = buildDeps();

    const result = await extractWithVertexAIService(PDF_BASE64, META, deps, {
      uploadPreparedPdf: false,
    });

    expect(uploadMocks.uploadPreparedCombinedPdfToGcs).not.toHaveBeenCalled();
    expect(
      draftIntakeMocks.createDraftIntakeApplicationShell,
    ).not.toHaveBeenCalled();
    expect(draftIntakeMocks.createDraftIntakeApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ applicationId: result.applicationId }),
    );
    expect(result.preparedPdf).toBeUndefined();
  });

  it("reports the missing pages it extracted around", async () => {
    prepareMocks.preparePdfSafely.mockResolvedValue(
      buildPrepared({
        perPageBase64: [PDF_BASE64, undefined, PDF_BASE64, PDF_BASE64],
        missingPageNumbers: [2],
      }),
    );
    const { deps } = buildDeps();

    await expect(
      extractWithVertexAIService(PDF_BASE64, META, deps),
    ).resolves.toMatchObject({ missingPages: [2] });
  });

  it("flags the prepared PDF as pending while the scan is in flight", async () => {
    draftIntakeMocks.getDocumentScanState.mockResolvedValue({
      scanStatus: HousingApplicationDocumentScanStatus.PENDING,
      bucketName: "quarantine-bucket",
    });
    const { deps } = buildDeps();

    const result = await extractWithVertexAIService(PDF_BASE64, META, deps);

    expect(result).toMatchObject({ preparedPdfPending: true });
    expect(result.preparedPdf).toBeUndefined();
    expect(gcsMocks.generateSignedReadUrl).not.toHaveBeenCalled();
  });

  it("deletes the uploaded object and the shell when extraction fails", async () => {
    const analyze = vi
      .fn()
      .mockRejectedValue(new VertexResponseValidationError("bad shape"));
    const { deps } = buildDeps(analyze);

    await expect(
      extractWithVertexAIService(PDF_BASE64, META, deps),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(gcsMocks.deleteGcsObject).toHaveBeenCalledWith({
      bucketName: UPLOAD_RESULT.bucketName,
      objectKey: UPLOAD_RESULT.objectKey,
    });
    expect(draftIntakeMocks.tryCleanupIntakeShell).toHaveBeenCalledTimes(1);
  });

  it("still surfaces the extraction error when the GCS cleanup itself fails", async () => {
    gcsMocks.deleteGcsObject.mockRejectedValue(new Error("delete failed"));
    const analyze = vi
      .fn()
      .mockRejectedValue(new VertexResponseValidationError("bad shape"));
    const { deps } = buildDeps(analyze);

    await expect(
      extractWithVertexAIService(PDF_BASE64, META, deps),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(deps.log.error).toHaveBeenCalledWith(
      "Failed to clean up orphaned prepared PDF after extraction error",
      expect.objectContaining({ objectKey: UPLOAD_RESULT.objectKey }),
    );
  });

  it("attempts no cleanup when the upload itself never produced an object", async () => {
    uploadMocks.uploadPreparedCombinedPdfToGcs.mockRejectedValue(
      new Error("upload failed"),
    );
    const analyze = vi
      .fn()
      .mockRejectedValue(new VertexResponseValidationError("bad shape"));
    const { deps } = buildDeps(analyze);

    await expect(
      extractWithVertexAIService(PDF_BASE64, META, deps),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    // The upload helpers delete their own object on a post-write failure.
    expect(gcsMocks.deleteGcsObject).not.toHaveBeenCalled();
    expect(draftIntakeMocks.tryCleanupIntakeShell).not.toHaveBeenCalled();
  });

  it("maps a PDF preparation failure to a client error that is still reported", async () => {
    prepareMocks.preparePdfSafely.mockRejectedValue(
      new PdfProcessingError("could not read page 3"),
    );
    const { deps } = buildDeps();

    const error = await extractWithVertexAIService(
      PDF_BASE64,
      META,
      deps,
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({ code: "BAD_REQUEST" });
    expect(classifyTrpcError(error).kind).toBe(ERROR_KIND.UNEXPECTED);
  });

  it("keeps a preparation failure caused by the document out of Sentry", async () => {
    prepareMocks.preparePdfSafely.mockRejectedValue(
      new PdfProcessingError("PDF has 80 pages", { userCaused: true }),
    );
    const { deps } = buildDeps();

    const error = await extractWithVertexAIService(
      PDF_BASE64,
      META,
      deps,
    ).catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      code: "BAD_REQUEST",
      message: "PDF has 80 pages",
    });
    expect(classifyTrpcError(error).kind).toBe(ERROR_KIND.EXPECTED);
  });

  it("maps an unexpected failure to a 500 and logs it", async () => {
    prepareMocks.preparePdfSafely.mockRejectedValue(
      new Error("connection to pdf_worker refused"),
    );
    const { deps } = buildDeps();

    await expect(
      extractWithVertexAIService(PDF_BASE64, META, deps),
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(deps.log.error).toHaveBeenCalledWith(
      "extractWithVertexAI failed",
      expect.objectContaining({ traceId: META.traceId }),
    );
  });
});

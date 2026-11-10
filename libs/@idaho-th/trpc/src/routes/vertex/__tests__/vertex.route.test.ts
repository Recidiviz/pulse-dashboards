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

import { PDF_BASE64_HEADER_PREFIX } from "~@idaho-th/trpc/routes/vertex/constants";
import {
  createProviderContext,
  staffCaller,
  TEST_STAFF_PSEUDONYMIZED_ID,
} from "~@idaho-th/trpc/test/caller";

const serviceMocks = vi.hoisted(() => ({
  extractWithVertexAIService: vi.fn(),
  extractWithVertexAIFromDocumentService: vi.fn(),
}));

vi.mock("~@idaho-th/trpc/routes/vertex/vertex.housing.extractor", () => ({
  extractWithVertexAIService: serviceMocks.extractWithVertexAIService,
}));

vi.mock("~@idaho-th/trpc/routes/vertex/vertex.fromDocument.extractor", () => ({
  extractWithVertexAIFromDocumentService:
    serviceMocks.extractWithVertexAIFromDocumentService,
}));

const { appRouter } = await import("~@idaho-th/trpc/router");

/** A minimal payload the pdfBase64 validator accepts. */
const PDF_BASE64 = `${PDF_BASE64_HEADER_PREFIX}${Buffer.from(
  "%PDF-1.7\nfake pdf body",
)
  .toString("base64")
  .slice(PDF_BASE64_HEADER_PREFIX.length)}`;

const DOCUMENT_ID = "11111111-1111-4111-8111-111111111111";

const EXTRACT_RESULT = { applicationId: "app-1", application: {} };

beforeEach(() => {
  serviceMocks.extractWithVertexAIService.mockResolvedValue(EXTRACT_RESULT);
  serviceMocks.extractWithVertexAIFromDocumentService.mockResolvedValue(
    EXTRACT_RESULT,
  );
});

describe("vertex.extractWithVertexAI authorization", () => {
  it("rejects a provider caller", async () => {
    const caller = appRouter.createCaller(createProviderContext());

    await expect(
      caller.vertex.extractWithVertexAI({ pdfBase64: PDF_BASE64 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(serviceMocks.extractWithVertexAIService).not.toHaveBeenCalled();
  });

  it("rejects a provider caller on the from-document procedure", async () => {
    const caller = appRouter.createCaller(createProviderContext());

    await expect(
      caller.vertex.extractWithVertexAIFromDocument({
        documentId: DOCUMENT_ID,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      serviceMocks.extractWithVertexAIFromDocumentService,
    ).not.toHaveBeenCalled();
  });
});

describe("vertex.extractWithVertexAI input validation", () => {
  it.each([
    ["a missing pdfBase64", {}],
    ["an empty pdfBase64", { pdfBase64: "" }],
    [
      "a non-PDF payload",
      { pdfBase64: Buffer.from("hello").toString("base64") },
    ],
    [
      "a non-boolean perPageExtraction",
      { pdfBase64: PDF_BASE64, perPageExtraction: "yes" },
    ],
    [
      "an unknown pdfOutputMode",
      { pdfBase64: PDF_BASE64, pdfOutputMode: "sideways" },
    ],
  ])("rejects %s before reaching the service", async (_label, input) => {
    await expect(
      staffCaller().vertex.extractWithVertexAI(input as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(serviceMocks.extractWithVertexAIService).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing documentId", {}],
    ["a non-uuid documentId", { documentId: "not-a-uuid" }],
    [
      "a non-boolean includeConfidence",
      { documentId: DOCUMENT_ID, includeConfidence: 1 },
    ],
  ])("rejects %s on the from-document procedure", async (_label, input) => {
    await expect(
      staffCaller().vertex.extractWithVertexAIFromDocument(input as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(
      serviceMocks.extractWithVertexAIFromDocumentService,
    ).not.toHaveBeenCalled();
  });
});

describe("vertex.extractWithVertexAI procedure meta", () => {
  it("forwards the trace id, procedure name and staff id", async () => {
    await expect(
      staffCaller().vertex.extractWithVertexAI({ pdfBase64: PDF_BASE64 }),
    ).resolves.toEqual(EXTRACT_RESULT);

    expect(serviceMocks.extractWithVertexAIService).toHaveBeenCalledTimes(1);
    const [, procedureMeta] =
      serviceMocks.extractWithVertexAIService.mock.calls[0] ?? [];
    expect(procedureMeta).toEqual({
      traceId: "test-request-id",
      procedureName: "vertex.extractWithVertexAI",
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
  });

  it("falls back to an unknown trace id when the request has none", async () => {
    const caller = staffCaller({
      req: {
        log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
      },
    } as never);

    await caller.vertex.extractWithVertexAI({ pdfBase64: PDF_BASE64 });

    expect(
      serviceMocks.extractWithVertexAIService.mock.calls[0]?.[1],
    ).toMatchObject({ traceId: "unknown" });
  });

  it("applies the schema defaults to the options it forwards", async () => {
    await staffCaller().vertex.extractWithVertexAI({ pdfBase64: PDF_BASE64 });

    const [, , deps, options] =
      serviceMocks.extractWithVertexAIService.mock.calls[0] ?? [];
    expect(deps).toMatchObject({ prisma: expect.anything() });
    expect(options).toEqual({
      perPageExtraction: true,
      includePerPagePartials: false,
      includeConfidence: false,
      uploadPreparedPdf: true,
      fileName: undefined,
      pdfOutputMode: undefined,
    });
  });

  it("forwards the from-document input and meta unchanged", async () => {
    await staffCaller().vertex.extractWithVertexAIFromDocument({
      documentId: DOCUMENT_ID,
      includeConfidence: true,
    });

    const [input, procedureMeta] =
      serviceMocks.extractWithVertexAIFromDocumentService.mock.calls[0] ?? [];
    expect(input).toEqual({ documentId: DOCUMENT_ID, includeConfidence: true });
    expect(procedureMeta).toEqual({
      traceId: "test-request-id",
      procedureName: "vertex.extractWithVertexAIFromDocument",
      staffPseudonymizedId: TEST_STAFF_PSEUDONYMIZED_ID,
    });
  });
});

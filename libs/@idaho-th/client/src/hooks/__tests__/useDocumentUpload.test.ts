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

import { renderHook } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DOCUMENT_UPLOAD_ERROR } from "~@idaho-th/shared";

import { HousingApplicationsStore } from "../../datastores/HousingApplicationsStore";
import type { IdahoTHStore } from "../../datastores/IdahoTHStore";
import { MAX_DOCUMENT_BYTES } from "../../utils/documents";
import {
  DocumentScanError,
  initiateResumableUpload,
  pollDocumentScanStatus,
  SCAN_STATUS_POLL_TIMEOUT_MS,
  uploadToGcsWithProgress,
  useDocumentUpload,
} from "../useDocumentUpload";

const storeRef: { current: HousingApplicationsStore | undefined } = vi.hoisted(
  () => ({ current: undefined }),
);
const utilsRef: { current: TrpcUtilsDouble | undefined } = vi.hoisted(() => ({
  current: undefined,
}));

vi.mock("../../datastores/IdahoTHStoreContext", () => ({
  useHousingApplicationsStore: () => storeRef.current,
}));

vi.mock("../../trpc/client", () => ({
  trpc: { useUtils: () => utilsRef.current },
}));

// ---------------------------------------------------------------------------
// Doubles
// ---------------------------------------------------------------------------

// Spelled out rather than generated from a variant name: computed keys would
// widen the object to an index signature, and every access below would then be
// possibly-undefined.
function buildUtils() {
  return {
    client: {
      documents: {
        requestUploadForStaff: { mutate: vi.fn() },
        confirmUploadForStaff: { mutate: vi.fn() },
        getScanStatusForStaff: { query: vi.fn() },
        deleteForStaff: { mutate: vi.fn() },
        requestUploadForProvider: { mutate: vi.fn() },
        confirmUploadForProvider: { mutate: vi.fn() },
        getScanStatusForProvider: { query: vi.fn() },
        deleteForProvider: { mutate: vi.fn() },
      },
    },
    documents: {
      listForStaff: { invalidate: vi.fn() },
      listForProvider: { invalidate: vi.fn() },
    },
    timeline: {
      getForStaff: { invalidate: vi.fn() },
      getForProvider: { invalidate: vi.fn() },
    },
  };
}

type TrpcUtilsDouble = ReturnType<typeof buildUtils>;

/** A minimal XHR stand-in the test drives event by event. */
class FakeXhr {
  static instances: FakeXhr[] = [];

  status = 200;

  readonly upload = new EventTarget();

  private readonly listeners = new Map<string, (() => void)[]>();

  method?: string;

  url?: string;

  requestHeaders: Record<string, string> = {};

  sent?: unknown;

  aborted = false;

  constructor() {
    FakeXhr.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }

  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.set(
      type,
      (this.listeners.get(type) ?? []).filter((it) => it !== listener),
    );
  }

  send(body: unknown) {
    this.sent = body;
  }

  abort() {
    this.aborted = true;
    this.emit("abort");
  }

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }

  emitProgress(loaded: number, total: number, lengthComputable = true) {
    this.upload.dispatchEvent(
      Object.assign(new Event("progress"), {
        loaded,
        total,
        lengthComputable,
      }),
    );
  }

  static latest(): FakeXhr {
    const instance = FakeXhr.instances.at(-1);
    if (!instance) throw new Error("no XHR was created");
    return instance;
  }
}

function fakeFile(name = "scan.pdf", size = 1024, type = "application/pdf") {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function trpcClientError(message: string) {
  return new TRPCClientError(message);
}

// ---------------------------------------------------------------------------
// Exported helpers
// ---------------------------------------------------------------------------

describe("pollDocumentScanStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves once the scan reports CLEAN", async () => {
    const getScanStatus = vi.fn().mockResolvedValue({ scanStatus: "CLEAN" });

    const settled = pollDocumentScanStatus(getScanStatus, "doc-1", () => false);
    await vi.advanceTimersByTimeAsync(4000);

    await expect(settled).resolves.toBeUndefined();
    expect(getScanStatus).toHaveBeenCalledWith({ documentId: "doc-1" });
  });

  it("waits before the first check rather than polling immediately", async () => {
    const getScanStatus = vi.fn().mockResolvedValue({ scanStatus: "CLEAN" });

    const settled = pollDocumentScanStatus(getScanStatus, "doc-1", () => false);

    await vi.advanceTimersByTimeAsync(3999);
    expect(getScanStatus).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await settled;
    expect(getScanStatus).toHaveBeenCalledTimes(1);
  });

  it("keeps polling while the scan is PENDING", async () => {
    const getScanStatus = vi
      .fn()
      .mockResolvedValueOnce({ scanStatus: "PENDING" })
      .mockResolvedValueOnce({ scanStatus: "PENDING" })
      .mockResolvedValue({ scanStatus: "CLEAN" });

    const settled = pollDocumentScanStatus(getScanStatus, "doc-1", () => false);
    await vi.advanceTimersByTimeAsync(4000 + 1500 * 2);

    await expect(settled).resolves.toBeUndefined();
    expect(getScanStatus).toHaveBeenCalledTimes(3);
  });

  it.each([
    ["INFECTED", "File failed a security scan"],
    ["FAILED", "File scan failed"],
  ])("rejects on %s", async (scanStatus, message) => {
    const getScanStatus = vi.fn().mockResolvedValue({ scanStatus });

    // Attach a catch before advancing the clock, so the rejection is never
    // unhandled, then assert on the captured error.
    const settled = pollDocumentScanStatus(
      getScanStatus,
      "doc-1",
      () => false,
    ).then(
      () => undefined,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(4000);

    const error = await settled;
    expect(error).toBeInstanceOf(DocumentScanError);
    expect((error as Error).message).toBe(message);
  });

  it("rejects with a timeout once the deadline passes", async () => {
    const getScanStatus = vi.fn().mockResolvedValue({ scanStatus: "PENDING" });

    const settled = pollDocumentScanStatus(
      getScanStatus,
      "doc-1",
      () => false,
    ).then(
      () => undefined,
      (error: unknown) => error,
    );
    // Past the deadline, not exactly on it — landing exactly on the deadline
    // depends on which poll tick the fake-timer advance settles on.
    await vi.advanceTimersByTimeAsync(SCAN_STATUS_POLL_TIMEOUT_MS + 5000);

    const error = await settled;
    expect(error).toBeInstanceOf(DocumentScanError);
    expect((error as Error).message).toBe("File scan timed out");
  });

  it("stops quietly once the upload is aborted", async () => {
    let aborted = false;
    const getScanStatus = vi.fn().mockImplementation(() => {
      aborted = true;
      return Promise.resolve({ scanStatus: "PENDING" });
    });

    const settled = pollDocumentScanStatus(
      getScanStatus,
      "doc-1",
      () => aborted,
    );
    await vi.advanceTimersByTimeAsync(4000 + 1500);

    await expect(settled).resolves.toBeUndefined();
    expect(getScanStatus).toHaveBeenCalledTimes(1);
  });

  it("never calls the scan endpoint when already aborted", async () => {
    const getScanStatus = vi.fn();

    const settled = pollDocumentScanStatus(getScanStatus, "doc-1", () => true);
    await vi.advanceTimersByTimeAsync(4000);

    await expect(settled).resolves.toBeUndefined();
    expect(getScanStatus).not.toHaveBeenCalled();
  });
});

describe("initiateResumableUpload", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(response: Partial<Response> & { ok: boolean }) {
    const fetchMock = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("returns the GCS session URL from the Location header", async () => {
    const fetchMock = stubFetch({
      ok: true,
      headers: new Headers({ Location: "https://gcs.example.com/session/1" }),
    });

    await expect(
      initiateResumableUpload(
        "https://gcs.example.com/signed",
        "application/pdf",
      ),
    ).resolves.toBe("https://gcs.example.com/session/1");

    expect(fetchMock).toHaveBeenCalledWith("https://gcs.example.com/signed", {
      method: "POST",
      headers: {
        "x-goog-resumable": "start",
        "Content-Type": "application/pdf",
      },
      signal: undefined,
    });
  });

  it("forwards the abort signal so a cancel reaches the request", async () => {
    const fetchMock = stubFetch({
      ok: true,
      headers: new Headers({ Location: "https://gcs.example.com/session/1" }),
    });
    const controller = new AbortController();

    await initiateResumableUpload(
      "https://gcs.example.com/signed",
      "application/pdf",
      controller.signal,
    );

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal);
  });

  it("throws with the status when GCS rejects the initiation", async () => {
    stubFetch({ ok: false, status: 403, headers: new Headers() });

    await expect(
      initiateResumableUpload("https://gcs.example.com/signed", "text/plain"),
    ).rejects.toThrow("Failed to initiate upload: 403");
  });

  it("throws when GCS answers without a Location header", async () => {
    stubFetch({ ok: true, headers: new Headers() });

    await expect(
      initiateResumableUpload("https://gcs.example.com/signed", "text/plain"),
    ).rejects.toThrow("No Location header from GCS upload initiation");
  });
});

describe("uploadToGcsWithProgress", () => {
  beforeEach(() => {
    FakeXhr.instances = [];
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function startUpload(signal?: AbortSignal) {
    const onProgress = vi.fn();
    const settled = uploadToGcsWithProgress(
      "https://gcs.example.com/session/1",
      fakeFile(),
      "application/pdf",
      onProgress,
      signal,
    );
    return { settled, onProgress, xhr: FakeXhr.latest() };
  }

  it("PUTs the file with the resolved content type", () => {
    const file = fakeFile();

    void uploadToGcsWithProgress(
      "https://gcs.example.com/session/1",
      file,
      "application/pdf",
      vi.fn(),
    );

    const xhr = FakeXhr.latest();
    expect(xhr.method).toBe("PUT");
    expect(xhr.url).toBe("https://gcs.example.com/session/1");
    expect(xhr.requestHeaders["Content-Type"]).toBe("application/pdf");
    expect(xhr.sent).toBe(file);
  });

  it("resolves on a 2xx response", async () => {
    const { settled, xhr } = startUpload();

    xhr.status = 204;
    xhr.emit("load");

    await expect(settled).resolves.toBeUndefined();
  });

  it("rejects on a non-2xx response", async () => {
    const { settled, xhr } = startUpload();

    xhr.status = 500;
    xhr.emit("load");

    await expect(settled).rejects.toThrow("GCS upload failed with status 500");
  });

  it("rejects on a network error", async () => {
    const { settled, xhr } = startUpload();

    xhr.emit("error");

    await expect(settled).rejects.toThrow("Network error during upload");
  });

  it("rejects when the request is aborted", async () => {
    const { settled, xhr } = startUpload();

    xhr.emit("abort");

    await expect(settled).rejects.toThrow("Upload aborted");
  });

  it("aborts the request when the outer signal fires", async () => {
    const controller = new AbortController();
    const { settled, xhr } = startUpload(controller.signal);

    controller.abort();

    expect(xhr.aborted).toBe(true);
    await expect(settled).rejects.toThrow("Upload aborted");
  });

  it("reports progress only for length-computable events", () => {
    const { onProgress, xhr } = startUpload();

    xhr.emitProgress(50, 100, false);
    expect(onProgress).not.toHaveBeenCalled();

    xhr.emitProgress(50, 100);
    expect(onProgress).toHaveBeenCalledWith(50, 100);
  });

  it("detaches the abort listener once the request settles", async () => {
    // The outer controller stays alive through confirm + scan polling; a
    // listener left attached pins the XHR and the File it holds.
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");
    const { settled, xhr } = startUpload(controller.signal);

    xhr.status = 200;
    xhr.emit("load");
    await settled;

    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));

    // A later abort must not re-enter the settled request.
    controller.abort();
    expect(xhr.aborted).toBe(false);
  });

  it("detaches the abort listener when the request errors", async () => {
    const controller = new AbortController();
    const removeSpy = vi.spyOn(controller.signal, "removeEventListener");
    const { settled, xhr } = startUpload(controller.signal);

    xhr.emit("error");
    await expect(settled).rejects.toThrow();

    expect(removeSpy).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

describe("useDocumentUpload", () => {
  let store: HousingApplicationsStore;
  let utils: TrpcUtilsDouble;

  beforeEach(() => {
    FakeXhr.instances = [];
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ Location: "https://gcs.example.com/session/1" }),
      }),
    );
    vi.useFakeTimers();

    store = new HousingApplicationsStore({} as IdahoTHStore);
    storeRef.current = store;
    utils = buildUtils();
    utilsRef.current = utils;

    utils.client.documents.requestUploadForStaff.mutate.mockResolvedValue({
      documentId: "doc-1",
      uploadUrl: "https://gcs.example.com/signed",
    });
    utils.client.documents[
      "requestUploadForProvider"
    ]?.mutate.mockResolvedValue({
      documentId: "doc-1",
      uploadUrl: "https://gcs.example.com/signed",
    });
    utils.client.documents.confirmUploadForStaff.mutate.mockResolvedValue(
      undefined,
    );
    utils.client.documents[
      "confirmUploadForProvider"
    ]?.mutate.mockResolvedValue(undefined);
    utils.client.documents.getScanStatusForStaff.query.mockResolvedValue({
      scanStatus: "CLEAN",
    });
    utils.client.documents.getScanStatusForProvider.query.mockResolvedValue({
      scanStatus: "CLEAN",
    });
    utils.client.documents.deleteForStaff.mutate.mockResolvedValue(undefined);
    utils.client.documents.deleteForProvider.mutate.mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Runs an upload to completion, driving the fake XHR and the scan poll. */
  async function runUpload(
    variant: "staff" | "provider",
    file = fakeFile(),
  ): Promise<string> {
    const { result } = renderHook(() => useDocumentUpload());
    const pendingId = result.current.startUpload(file, "app-1", variant);

    // requestUpload + initiateResumableUpload
    await vi.advanceTimersByTimeAsync(0);
    const xhr = FakeXhr.latest();
    xhr.emitProgress(file.size, file.size);
    xhr.status = 200;
    xhr.emit("load");

    // confirmUpload, then the scan poll's initial delay
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(4000);

    return pendingId;
  }

  it("registers the upload in the store before any request is made", () => {
    const { result } = renderHook(() => useDocumentUpload());

    const pendingId = result.current.startUpload(
      fakeFile("scan.pdf", 2048),
      "app-1",
      "staff",
    );

    expect(store.pendingUploads.get(pendingId)).toMatchObject({
      applicationId: "app-1",
      fileName: "scan.pdf",
      status: "uploading",
      progress: 0,
      totalBytes: 2048,
    });
  });

  it("walks a staff upload through to success and clears it after the grace period", async () => {
    const pendingId = await runUpload("staff");

    expect(store.pendingUploads.get(pendingId)).toMatchObject({
      documentId: "doc-1",
      status: "success",
      progress: 100,
    });

    await vi.advanceTimersByTimeAsync(2000);
    expect(store.pendingUploads.has(pendingId)).toBe(false);
  });

  it("marks the upload as scanning between confirm and verdict", async () => {
    utils.client.documents.getScanStatusForStaff.query.mockResolvedValue({
      scanStatus: "PENDING",
    });
    const { result } = renderHook(() => useDocumentUpload());
    const pendingId = result.current.startUpload(fakeFile(), "app-1", "staff");

    await vi.advanceTimersByTimeAsync(0);
    const xhr = FakeXhr.latest();
    xhr.status = 200;
    xhr.emit("load");
    await vi.advanceTimersByTimeAsync(0);

    expect(store.pendingUploads.get(pendingId)?.status).toBe("scanning");
  });

  it("reports byte progress as it arrives", async () => {
    const file = fakeFile("scan.pdf", 1000);
    const { result } = renderHook(() => useDocumentUpload());
    const pendingId = result.current.startUpload(file, "app-1", "staff");

    await vi.advanceTimersByTimeAsync(0);
    FakeXhr.latest().emitProgress(250, 1000);

    expect(store.pendingUploads.get(pendingId)).toMatchObject({
      loadedBytes: 250,
      totalBytes: 1000,
      progress: 25,
    });
  });

  describe("role routing", () => {
    it("uses only the staff procedures for a staff upload", async () => {
      await runUpload("staff");

      expect(
        utils.client.documents.requestUploadForStaff.mutate,
      ).toHaveBeenCalledTimes(1);
      expect(
        utils.client.documents.requestUploadForProvider.mutate,
      ).not.toHaveBeenCalled();
      expect(
        utils.client.documents.getScanStatusForProvider.query,
      ).not.toHaveBeenCalled();
      expect(utils.documents.listForStaff.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
      expect(utils.documents.listForProvider.invalidate).not.toHaveBeenCalled();
      expect(utils.timeline.getForStaff.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
    });

    it("uses only the provider procedures for a provider upload", async () => {
      await runUpload("provider");

      expect(
        utils.client.documents.requestUploadForProvider.mutate,
      ).toHaveBeenCalledTimes(1);
      expect(
        utils.client.documents.requestUploadForStaff.mutate,
      ).not.toHaveBeenCalled();
      expect(
        utils.client.documents.getScanStatusForStaff.query,
      ).not.toHaveBeenCalled();
      expect(utils.documents.listForProvider.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
      expect(utils.documents.listForStaff.invalidate).not.toHaveBeenCalled();
      expect(utils.timeline.getForProvider.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
    });

    it("sends the resolved mime type and size, not the browser's raw type", async () => {
      // A .heic picked from a file dialog often arrives with an empty type.
      const file = fakeFile("photo.heic", 4096, "");

      await runUpload("staff", file);

      expect(
        utils.client.documents.requestUploadForStaff.mutate,
      ).toHaveBeenCalledWith(
        {
          applicationId: "app-1",
          fileName: "photo.heic",
          mimeType: "image/heic",
          sizeBytes: 4096,
        },
        expect.objectContaining({ signal: expect.anything() }),
      );
    });
  });

  describe("failure messages", () => {
    it.each([
      [
        DOCUMENT_UPLOAD_ERROR.FILE_TOO_LARGE,
        `File is too large (max ${(MAX_DOCUMENT_BYTES / (1024 * 1024)).toFixed(
          2,
        )} MB)`,
      ],
      [DOCUMENT_UPLOAD_ERROR.UNSUPPORTED_FILE_TYPE, "Unsupported file type"],
      [DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH, "File content does not match type"],
    ])("maps the %s rejection to a readable message", async (code, message) => {
      utils.client.documents.requestUploadForStaff.mutate.mockRejectedValue(
        trpcClientError(code),
      );
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      await vi.advanceTimersByTimeAsync(0);

      expect(store.pendingUploads.get(pendingId)).toMatchObject({
        status: "failed",
        errorMessage: message,
      });
    });

    it("falls back to a generic message for an unrecognised failure", async () => {
      utils.client.documents.requestUploadForStaff.mutate.mockRejectedValue(
        new Error('relation "housing_application_document" does not exist'),
      );
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      await vi.advanceTimersByTimeAsync(0);

      const pending = store.pendingUploads.get(pendingId);
      expect(pending?.errorMessage).toBe("Upload failed");
      expect(pending?.errorMessage).not.toContain("housing_application");
    });

    it("surfaces the scan verdict verbatim when a file fails the scan", async () => {
      utils.client.documents.getScanStatusForStaff.query.mockResolvedValue({
        scanStatus: "INFECTED",
      });
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      await vi.advanceTimersByTimeAsync(0);
      FakeXhr.latest().status = 200;
      FakeXhr.latest().emit("load");
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(4000);

      expect(store.pendingUploads.get(pendingId)).toMatchObject({
        status: "failed",
        errorMessage: "File failed a security scan",
      });
      // A file that failed the scan must never be listed as available.
      expect(utils.documents.listForStaff.invalidate).not.toHaveBeenCalled();
    });

    it("leaves the document list untouched when the upload fails", async () => {
      utils.client.documents.confirmUploadForStaff.mutate.mockRejectedValue(
        trpcClientError(DOCUMENT_UPLOAD_ERROR.TYPE_MISMATCH),
      );
      const { result } = renderHook(() => useDocumentUpload());
      result.current.startUpload(fakeFile(), "app-1", "staff");

      await vi.advanceTimersByTimeAsync(0);
      FakeXhr.latest().status = 200;
      FakeXhr.latest().emit("load");
      await vi.advanceTimersByTimeAsync(0);

      expect(utils.documents.listForStaff.invalidate).not.toHaveBeenCalled();
      expect(utils.timeline.getForStaff.invalidate).not.toHaveBeenCalled();
    });
  });

  describe("cancellation", () => {
    it("removes the pending upload and stops the flow", async () => {
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      expect(result.current.canCancelUpload(pendingId)).toBe(true);
      result.current.cancelUpload(pendingId);

      expect(store.pendingUploads.has(pendingId)).toBe(false);
      expect(result.current.canCancelUpload(pendingId)).toBe(false);

      await vi.advanceTimersByTimeAsync(5000);
      expect(
        utils.client.documents.confirmUploadForStaff.mutate,
      ).not.toHaveBeenCalled();
    });

    it("refuses to cancel once the file is being scanned", async () => {
      utils.client.documents.getScanStatusForStaff.query.mockResolvedValue({
        scanStatus: "PENDING",
      });
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      await vi.advanceTimersByTimeAsync(0);
      FakeXhr.latest().status = 200;
      FakeXhr.latest().emit("load");
      await vi.advanceTimersByTimeAsync(0);
      expect(store.pendingUploads.get(pendingId)?.status).toBe("scanning");

      result.current.cancelUpload(pendingId);

      expect(store.pendingUploads.has(pendingId)).toBe(true);
    });

    it("reports no cancel handle for an unknown id", () => {
      const { result } = renderHook(() => useDocumentUpload());

      expect(result.current.canCancelUpload("never-started")).toBe(false);
      expect(() => result.current.cancelUpload("never-started")).not.toThrow();
    });

    it("releases the cancel handle once the upload succeeds", async () => {
      const { result } = renderHook(() => useDocumentUpload());
      const pendingId = result.current.startUpload(
        fakeFile(),
        "app-1",
        "staff",
      );

      await vi.advanceTimersByTimeAsync(0);
      FakeXhr.latest().status = 200;
      FakeXhr.latest().emit("load");
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(4000);

      expect(result.current.canCancelUpload(pendingId)).toBe(false);
    });
  });

  describe("startDelete", () => {
    it("deletes through the staff procedure and refreshes the staff list", async () => {
      const { result } = renderHook(() => useDocumentUpload());

      await result.current.startDelete("doc-1", "app-1", "staff");

      expect(utils.client.documents.deleteForStaff.mutate).toHaveBeenCalledWith(
        { documentId: "doc-1" },
      );
      expect(
        utils.client.documents.deleteForProvider.mutate,
      ).not.toHaveBeenCalled();
      expect(utils.documents.listForStaff.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
      expect(utils.documents.listForProvider.invalidate).not.toHaveBeenCalled();
    });

    it("deletes through the provider procedure and refreshes the provider list", async () => {
      const { result } = renderHook(() => useDocumentUpload());

      await result.current.startDelete("doc-1", "app-1", "provider");

      expect(
        utils.client.documents.deleteForProvider.mutate,
      ).toHaveBeenCalledWith({ documentId: "doc-1" });
      expect(
        utils.client.documents.deleteForStaff.mutate,
      ).not.toHaveBeenCalled();
      expect(utils.documents.listForProvider.invalidate).toHaveBeenCalledWith({
        applicationId: "app-1",
      });
    });

    it("propagates a delete failure instead of swallowing it", async () => {
      utils.client.documents.deleteForStaff.mutate.mockRejectedValue(
        trpcClientError("FORBIDDEN"),
      );
      const { result } = renderHook(() => useDocumentUpload());

      await expect(
        result.current.startDelete("doc-1", "app-1", "staff"),
      ).rejects.toThrow();
      expect(utils.documents.listForStaff.invalidate).not.toHaveBeenCalled();
    });
  });
});

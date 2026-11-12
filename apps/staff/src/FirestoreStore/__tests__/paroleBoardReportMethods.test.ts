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

import {
  collection,
  deleteField,
  doc,
  FieldPath,
  runTransaction,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { RootStore } from "../../RootStore";
import FirestoreStore from "../FirestoreStore";

vi.mock("firebase/firestore");
vi.mock("~client-env-utils");

const PHI_EMAIL = "phi@example.com";
const RECORD_ID = "us_id_123";
const REPORT = { recordId: RECORD_ID, reportId: "report1" };
const REPORT_PATH = "paroleBoardReports/us_id_123/reports/report1";
const HEARING = { hearingDate: "2026-12-01", hearingType: "Regular Hearing" };
const PHI_EDIT = {
  updatedBy: PHI_EMAIL,
  updatedAt: "server-timestamp",
};

type MockRef = { id: string; path: string };
type MockFieldPath = { segments: string[] };

/** The document and fields, keyed by dotted path, that updateDoc wrote. */
function updatedFields() {
  const [ref, ...pairs] = vi.mocked(updateDoc).mock.calls[0] as unknown[];
  const fields: Record<string, unknown> = {};
  for (let i = 0; i < pairs.length; i += 2) {
    fields[(pairs[i] as MockFieldPath).segments.join(".")] = pairs[i + 1];
  }
  return { path: (ref as MockRef).path, fields };
}

describe("FirestoreStore PHI report methods", () => {
  let store: FirestoreStore;
  let rootStore: RootStore;
  let transaction: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    rootStore = {
      userStore: { isRecidivizUser: false },
      // The staff token endpoint sets the Firebase uid to the user's email.
      firebaseAuthClient: {
        authenticate: vi.fn(),
        projectId: "real-project",
        auth: { currentUser: { uid: PHI_EMAIL } },
      },
      isImpersonating: false,
    } as unknown as RootStore;
    store = new FirestoreStore({ rootStore });

    vi.mocked(collection).mockImplementation(((
      _db: unknown,
      ...segments: string[]
    ) => ({
      path: segments.join("/"),
    })) as unknown as typeof collection);
    // doc(collectionRef) with no path generates an id, as Firestore does. A
    // segment can hold slashes, so the id is the last part of the joined path.
    vi.mocked(doc).mockImplementation(((
      parent: MockRef | undefined,
      ...segments: string[]
    ): MockRef => {
      if (segments.length === 0 && parent) {
        return { id: "new_report", path: `${parent.path}/new_report` };
      }
      const path = segments.join("/");
      return { id: path.split("/").pop() as string, path };
    }) as unknown as typeof doc);
    vi.mocked(
      FieldPath as unknown as (...segments: string[]) => MockFieldPath,
    ).mockImplementation(function (...segments) {
      return { segments };
    });
    vi.mocked(serverTimestamp).mockReturnValue(
      "server-timestamp" as unknown as ReturnType<typeof serverTimestamp>,
    );
    vi.mocked(deleteField).mockReturnValue(
      "delete-field" as unknown as ReturnType<typeof deleteField>,
    );

    transaction = {
      get: vi.fn().mockResolvedValue({ data: () => undefined }),
      set: vi.fn(),
    };
    vi.mocked(runTransaction).mockImplementation((async (
      _db: unknown,
      update: (t: typeof transaction) => Promise<unknown>,
    ) => update(transaction)) as unknown as typeof runTransaction);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getOrCreateActiveParoleBoardReport", () => {
    test("creates a report in progress for the hearing and points the parent document at it", async () => {
      const reportId = await store.getOrCreateActiveParoleBoardReport(
        RECORD_ID,
        "pid123",
        HEARING,
      );

      expect(reportId).toBe("new_report");
      expect(transaction.set.mock.calls).toEqual([
        [
          {
            id: "new_report",
            path: "paroleBoardReports/us_id_123/reports/new_report",
          },
          {
            stateCode: "US_ID",
            pseudonymizedId: "pid123",
            hearing: HEARING,
            status: "IN_PROGRESS",
            createdBy: PHI_EMAIL,
            createdAt: "server-timestamp",
            updatedBy: PHI_EMAIL,
            updatedAt: "server-timestamp",
            sections: {},
          },
        ],
        [
          { id: RECORD_ID, path: `paroleBoardReports/${RECORD_ID}` },
          {
            stateCode: "US_ID",
            activeReportId: "new_report",
            latestReport: {
              reportId: "new_report",
              status: "IN_PROGRESS",
              hearingDate: "2026-12-01",
            },
          },
          { merge: true },
        ],
      ]);
    });

    test("returns the report already in progress instead of starting a second one", async () => {
      transaction.get.mockResolvedValue({
        data: () => ({ activeReportId: "existing_report" }),
      });

      expect(
        await store.getOrCreateActiveParoleBoardReport(
          RECORD_ID,
          "pid123",
          HEARING,
        ),
      ).toBe("existing_report");
      expect(transaction.get).toHaveBeenCalledWith({
        id: RECORD_ID,
        path: `paroleBoardReports/${RECORD_ID}`,
      });
      expect(transaction.set).not.toHaveBeenCalled();
    });

    test("leaves out undefined hearing fields, which Firestore rejects", async () => {
      await store.getOrCreateActiveParoleBoardReport(RECORD_ID, "pid123", {
        hearingDate: "2026-12-01",
        atlasHearingId: undefined,
        hearingType: undefined,
      });

      expect(transaction.set.mock.calls[0][1].hearing).toEqual({
        hearingDate: "2026-12-01",
      });
    });

    test("rejects a hearing date that isn't YYYY-MM-DD before writing anything", async () => {
      await expect(
        store.getOrCreateActiveParoleBoardReport(RECORD_ID, "pid123", {
          hearingDate: "12/01/2026",
        }),
      ).rejects.toThrow();
      expect(runTransaction).not.toHaveBeenCalled();
    });

    test.each<
      [
        string,
        { isImpersonating?: boolean; userStore?: { isRecidivizUser: boolean } },
      ]
    >([
      ["an impersonator", { isImpersonating: true }],
      ["a Recidiviz user", { userStore: { isRecidivizUser: true } }],
    ])("skips the write for %s in production", async (_label, overrides) => {
      vi.stubEnv("VITE_DEPLOY_ENV", "production");
      store = new FirestoreStore({
        rootStore: {
          ...rootStore,
          ...overrides,
          userStore: { ...rootStore.userStore, ...overrides.userStore },
        } as unknown as RootStore,
      });

      expect(
        await store.getOrCreateActiveParoleBoardReport(
          RECORD_ID,
          "pid123",
          HEARING,
        ),
      ).toBeUndefined();
      expect(runTransaction).not.toHaveBeenCalled();
    });

    test("writes for a PHI in production", async () => {
      vi.stubEnv("VITE_DEPLOY_ENV", "production");

      expect(
        await store.getOrCreateActiveParoleBoardReport(
          RECORD_ID,
          "pid123",
          HEARING,
        ),
      ).toBe("new_report");
      expect(transaction.set).toHaveBeenCalledTimes(2);
    });

    test("refuses to write while signed out, since the rules check the writer's uid", async () => {
      store = new FirestoreStore({
        rootStore: {
          ...rootStore,
          firebaseAuthClient: { ...rootStore.firebaseAuthClient, auth: {} },
        } as unknown as RootStore,
      });

      await expect(
        store.getOrCreateActiveParoleBoardReport(RECORD_ID, "pid123", HEARING),
      ).rejects.toThrow("signed out");
      expect(runTransaction).not.toHaveBeenCalled();
    });
  });

  describe("field writes", () => {
    test("saves a section field's value with its editor, and stamps the report", async () => {
      await store.setParoleBoardReportFieldValue(
        REPORT,
        "offenseInformation",
        "victim",
        "YES",
      );

      expect(updatedFields()).toEqual({
        path: REPORT_PATH,
        fields: {
          "sections.offenseInformation.fields.victim": {
            value: "YES",
            ...PHI_EDIT,
          },
          ...PHI_EDIT,
        },
      });
    });

    test("saves a cleared field as a null value", async () => {
      await store.setParoleBoardReportFieldValue(
        REPORT,
        "offenseInformation",
        "psychologicalEvaluation",
        null,
      );

      expect(
        updatedFields().fields[
          "sections.offenseInformation.fields.psychologicalEvaluation"
        ],
      ).toEqual({ value: null, ...PHI_EDIT });
    });

    test("saves a row field's value along with the row's source and label", async () => {
      await store.setParoleBoardReportRowValue(
        REPORT,
        "offenseInformation",
        { id: "1001", source: "ATLAS", atlasLabel: "Robbery" },
        "sentencingDate",
        "2025-08-15",
      );

      expect(updatedFields().fields).toEqual({
        "sections.offenseInformation.rows.1001.source": "ATLAS",
        "sections.offenseInformation.rows.1001.atlasLabel": "Robbery",
        "sections.offenseInformation.rows.1001.fields.sentencingDate": {
          value: "2025-08-15",
          ...PHI_EDIT,
        },
        ...PHI_EDIT,
      });
    });

    test("reverts a section field to Atlas by deleting the PHI's value", async () => {
      await store.revertParoleBoardReportFieldValue(
        REPORT,
        "offenseInformation",
        "victim",
      );

      expect(
        updatedFields().fields["sections.offenseInformation.fields.victim"],
      ).toBe("delete-field");
    });

    test("reverts a row field to Atlas by deleting the PHI's value", async () => {
      await store.revertParoleBoardReportRowValue(
        REPORT,
        "offenseInformation",
        "1001",
        "sentencingDate",
      );

      expect(
        updatedFields().fields[
          "sections.offenseInformation.rows.1001.fields.sentencingDate"
        ],
      ).toBe("delete-field");
    });

    test("deletes all of the PHI's input for a row", async () => {
      await store.deleteParoleBoardReportRow(
        REPORT,
        "offenseInformation",
        "1001",
      );

      expect(
        updatedFields().fields["sections.offenseInformation.rows.1001"],
      ).toBe("delete-field");
    });

    test("writes a deleted row's input back as it was, keeping each field's editor", async () => {
      const editedAt = new Date("2026-11-02T15:00:00Z");
      const entry = {
        source: "PHI" as const,
        fields: {
          notes: {
            value: "Sentenced, entered custody",
            updatedBy: "other-phi@example.com",
            updatedAt: editedAt,
          },
        },
      };

      await store.restoreParoleBoardReportRow(
        REPORT,
        "pastActions",
        "phi_1",
        entry,
      );

      expect(updatedFields().fields).toEqual({
        "sections.pastActions.rows.phi_1": entry,
        ...PHI_EDIT,
      });
    });

    test("marks a row still in Atlas as removed, with its source and label", async () => {
      await store.setParoleBoardReportRowRemoved(
        REPORT,
        "offenseInformation",
        { id: "1001", source: "ATLAS", atlasLabel: "Robbery" },
        true,
      );

      expect(updatedFields().fields).toEqual({
        "sections.offenseInformation.rows.1001.source": "ATLAS",
        "sections.offenseInformation.rows.1001.atlasLabel": "Robbery",
        "sections.offenseInformation.rows.1001.removed": {
          by: PHI_EMAIL,
          at: "server-timestamp",
        },
        ...PHI_EDIT,
      });
    });

    test("clears a row's removed mark and leaves the rest of its input", async () => {
      await store.setParoleBoardReportRowRemoved(
        REPORT,
        "offenseInformation",
        { id: "1001", source: "ATLAS", atlasLabel: "Robbery" },
        false,
      );

      expect(updatedFields().fields).toEqual({
        "sections.offenseInformation.rows.1001.removed": "delete-field",
        ...PHI_EDIT,
      });
    });

    test("skips the write for a Recidiviz user in production", async () => {
      vi.stubEnv("VITE_DEPLOY_ENV", "production");
      store = new FirestoreStore({
        rootStore: {
          ...rootStore,
          userStore: { isRecidivizUser: true },
        } as unknown as RootStore,
      });

      await store.setParoleBoardReportFieldValue(
        REPORT,
        "offenseInformation",
        "victim",
        "YES",
      );

      expect(updateDoc).not.toHaveBeenCalled();
    });
  });

  describe("updateParoleBoardReportHearing", () => {
    test("moves the report to the hearing's new date and keeps the parent's latestReport in step", async () => {
      const batch = { update: vi.fn(), commit: vi.fn() };
      vi.mocked(writeBatch).mockReturnValue(
        batch as unknown as ReturnType<typeof writeBatch>,
      );

      await store.updateParoleBoardReportHearing(REPORT, {
        hearingDate: "2027-01-15",
        atlasHearingId: "5001",
      });

      expect(batch.update.mock.calls).toEqual([
        [
          { id: "report1", path: REPORT_PATH },
          { segments: ["hearing"] },
          { hearingDate: "2027-01-15", atlasHearingId: "5001" },
          { segments: ["updatedBy"] },
          PHI_EMAIL,
          { segments: ["updatedAt"] },
          "server-timestamp",
        ],
        [
          { id: RECORD_ID, path: `paroleBoardReports/${RECORD_ID}` },
          { segments: ["latestReport", "hearingDate"] },
          "2027-01-15",
        ],
      ]);
      expect(batch.commit).toHaveBeenCalled();
    });
  });

  describe("subscriptions", () => {
    const transform = (subscription: unknown) =>
      (subscription as { transformRecord: (record: unknown) => unknown })
        .transformRecord;

    test("listens to the resident's parent document and to the report under it", () => {
      expect(
        store.buildParoleBoardReportsForResidentSubscription(RECORD_ID)
          .dataSource,
      ).toEqual({ id: RECORD_ID, path: `paroleBoardReports/${RECORD_ID}` });
      expect(
        store.buildParoleBoardReportSubscription(REPORT).dataSource,
      ).toEqual({ id: "report1", path: REPORT_PATH });
    });

    test("parses a PHI report", () => {
      const parse = transform(store.buildParoleBoardReportSubscription(REPORT));

      expect(
        parse({
          stateCode: "US_ID",
          pseudonymizedId: "pid123",
          hearing: HEARING,
          status: "IN_PROGRESS",
          createdBy: PHI_EMAIL,
          createdAt: new Date(),
          updatedBy: PHI_EMAIL,
          updatedAt: new Date(),
        }),
      ).toMatchObject({ status: "IN_PROGRESS", sections: {} });
    });

    test("names only the failing fields, never their values, when a report fails to parse", () => {
      const parse = transform(store.buildParoleBoardReportSubscription(REPORT));

      expect(() =>
        parse({ pseudonymizedId: "pid123", status: "NOT_A_STATUS" }),
      ).toThrow(/status/);
      expect(() =>
        parse({ pseudonymizedId: "pid123", status: "NOT_A_STATUS" }),
      ).not.toThrow(/NOT_A_STATUS|pid123/);
    });

    test("parses the resident's parent PHI reports document", () => {
      const parse = transform(
        store.buildParoleBoardReportsForResidentSubscription(RECORD_ID),
      );

      expect(
        parse({ stateCode: "US_ID", activeReportId: null, latestReport: null }),
      ).toEqual({
        stateCode: "US_ID",
        activeReportId: null,
        latestReport: null,
      });
    });
  });
});

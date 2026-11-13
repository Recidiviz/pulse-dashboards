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

import { autorun, runInAction } from "mobx";

import {
  PAROLE_UNKNOWN_TEXT,
  ParoleBoardReport,
  ParoleBoardReportsForResident,
  ParoleCase,
  paroleCasesFixtureByState,
} from "~datatypes";

import type FirestoreStore from "../../../FirestoreStore";
import type { ParoleBoardReportRef } from "../../../FirestoreStore";
import type UserStore from "../../../RootStore/UserStore";
import { FirestoreSubscription } from "../../../WorkflowsStore/subscriptions/FirestoreSubscription";
import { ParoleBoardReportPresenter } from "../ParoleBoardReportPresenter";

const RECORD_ID = "us_id_000001";
const HEARING_DATE = "2026-11-11";

const CASE: ParoleCase = {
  ...paroleCasesFixtureByState.US_ID["45821"],
  recordId: RECORD_ID,
  hearingDate: HEARING_DATE,
  hearingType: "Parole Grant Hearing",
};

/**
 * Stands in for a CollectionDocumentSubscription. It keeps the real base
 * class, which starts and stops listening as MobX observes its data, and
 * delivers the document it was given, or its error, a moment after it starts
 * listening, as Firestore does.
 */
class FakeSubscription<Data> extends FirestoreSubscription<Data | undefined> {
  startListener = vi.fn();

  stopListener = vi.fn();

  constructor(
    private document: Data | undefined,
    private error?: Error,
  ) {
    super(undefined);
  }

  protected startSnapshotListener() {
    this.startListener();
    const timer = setTimeout(
      () =>
        runInAction(() => {
          if (this.error) {
            this.hydrationState = { status: "failed", error: this.error };
            return;
          }
          this.data = this.document;
          this.hydrationState = { status: "hydrated" };
        }),
      5,
    );
    return () => {
      clearTimeout(timer);
      this.stopListener();
    };
  }
}

function makeReport(status: ParoleBoardReport["status"]): ParoleBoardReport {
  const editedAt = new Date("2026-11-01T12:00:00Z");
  return {
    stateCode: "US_ID",
    pseudonymizedId: CASE.pseudonymizedId,
    hearing: { hearingDate: HEARING_DATE },
    status,
    createdBy: "phi@example.com",
    createdAt: editedAt,
    updatedBy: "phi@example.com",
    updatedAt: editedAt,
    sections: {},
  };
}

let reportsForResident: FakeSubscription<ParoleBoardReportsForResident>;
let reportsById: Record<string, FakeSubscription<ParoleBoardReport>>;
let firestoreStore: {
  buildParoleBoardReportsForResidentSubscription: ReturnType<typeof vi.fn>;
  buildParoleBoardReportSubscription: ReturnType<typeof vi.fn>;
  getOrCreateActiveParoleBoardReport: ReturnType<typeof vi.fn>;
  deleteParoleBoardReportRow: ReturnType<typeof vi.fn>;
  restoreParoleBoardReportRow: ReturnType<typeof vi.fn>;
  setParoleBoardReportRowRemoved: ReturnType<typeof vi.fn>;
  setParoleBoardReportFieldValue: ReturnType<typeof vi.fn>;
  setParoleBoardReportRowValues: ReturnType<typeof vi.fn>;
};
let userStore: {
  activeFeatureVariants: Record<string, unknown>;
  canEditParoleBoardReports: boolean;
};

/**
 * Sets what the resident's parent document holds when it loads. Undefined
 * means the resident has no document yet.
 */
function givenReportsForResident(
  document: ParoleBoardReportsForResident | undefined,
): void {
  reportsForResident = new FakeSubscription(document);
}

function givenReport(reportId: string, report: ParoleBoardReport): void {
  reportsById[reportId] = new FakeSubscription(report);
}

function makePresenter(caseDetail: ParoleCase = CASE) {
  return new ParoleBoardReportPresenter(
    firestoreStore as unknown as FirestoreStore,
    userStore as unknown as UserStore,
    caseDetail,
  );
}

beforeEach(() => {
  givenReportsForResident(undefined);
  reportsById = {};
  firestoreStore = {
    buildParoleBoardReportsForResidentSubscription: vi.fn(
      () => reportsForResident,
    ),
    buildParoleBoardReportSubscription: vi.fn(
      ({ reportId }: ParoleBoardReportRef) => reportsById[reportId],
    ),
    getOrCreateActiveParoleBoardReport: vi.fn().mockResolvedValue("new_report"),
    deleteParoleBoardReportRow: vi.fn().mockResolvedValue(undefined),
    restoreParoleBoardReportRow: vi.fn().mockResolvedValue(undefined),
    setParoleBoardReportRowRemoved: vi.fn().mockResolvedValue(undefined),
    setParoleBoardReportFieldValue: vi.fn().mockResolvedValue(undefined),
    setParoleBoardReportRowValues: vi.fn().mockResolvedValue(undefined),
  };
  // A PHI with the report's feature variant on.
  userStore = {
    activeFeatureVariants: { usIdParoleBoardReports: {} },
    canEditParoleBoardReports: true,
  };
});

describe("who reads reports", () => {
  test("nothing reads reports with the feature variant off", async () => {
    userStore.activeFeatureVariants = {};
    const presenter = makePresenter();

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    await presenter.hydrate();

    expect(reportsForResident.startListener).not.toHaveBeenCalled();
    expect(presenter.mode).toBeUndefined();
  });

  test("nothing reads reports for a commissioner", async () => {
    userStore.canEditParoleBoardReports = false;
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(reportsForResident.startListener).not.toHaveBeenCalled();
    expect(
      firestoreStore.buildParoleBoardReportSubscription,
    ).not.toHaveBeenCalled();
    expect(presenter.mode).toBeUndefined();
  });

  test("nothing reads reports for a case with no record id", async () => {
    const presenter = makePresenter({ ...CASE, recordId: undefined });

    await presenter.hydrate();

    expect(
      firestoreStore.buildParoleBoardReportsForResidentSubscription,
    ).not.toHaveBeenCalled();
    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(presenter.mode).toBeUndefined();
  });
});

describe("loading", () => {
  test("loads the parent document, then the report in progress", async () => {
    const report = makeReport("IN_PROGRESS");
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", report);
    const presenter = makePresenter();

    expect(presenter.hydrationState).toEqual({ status: "needs hydration" });
    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(presenter.reportFailedToLoad).toBe(false);
    expect(
      firestoreStore.buildParoleBoardReportsForResidentSubscription,
    ).toHaveBeenCalledWith(RECORD_ID);
    expect(
      firestoreStore.buildParoleBoardReportSubscription,
    ).toHaveBeenCalledWith({ recordId: RECORD_ID, reportId: "report_1" });
    expect(presenter.report).toEqual(report);
  });

  test("keeps listening while it loads for a page watching it", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", makeReport("IN_PROGRESS"));
    const presenter = makePresenter();
    const stopWatching = autorun(() => presenter.hydrationState);

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "hydrated" });
    expect(reportsForResident.stopListener).not.toHaveBeenCalled();
    expect(reportsById.report_1.stopListener).not.toHaveBeenCalled();
    stopWatching();
  });

  test("fails when the report fails to load", async () => {
    const error = new Error("permission denied");
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    reportsById.report_1 = new FakeSubscription<ParoleBoardReport>(
      undefined,
      error,
    );
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.hydrationState).toEqual({ status: "failed", error });
    expect(presenter.reportFailedToLoad).toBe(true);
  });

  test("stops listening once the page stops watching it", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", makeReport("IN_PROGRESS"));
    const presenter = makePresenter();
    const stopWatching = autorun(() => presenter.hydrationState);
    await presenter.hydrate();

    stopWatching();

    expect(reportsForResident.stopListener).toHaveBeenCalled();
    expect(reportsById.report_1.stopListener).toHaveBeenCalled();
  });
});

describe("mode", () => {
  test("shows today's profile when the reports fail to load", async () => {
    reportsForResident = new FakeSubscription<ParoleBoardReportsForResident>(
      undefined,
      new Error("permission denied"),
    );
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBeUndefined();
    expect(presenter.report).toBeUndefined();
  });

  test("edits a report in progress", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: {
        reportId: "report_1",
        status: "IN_PROGRESS",
        hearingDate: HEARING_DATE,
      },
    });
    givenReport("report_1", makeReport("IN_PROGRESS"));
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBe("EDIT");
  });

  test("edits an empty report when the resident has none yet", async () => {
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBe("EDIT");
    expect(presenter.report).toBeUndefined();
  });

  test("shows a submitted report for the docket hearing read-only", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: null,
      latestReport: {
        reportId: "report_1",
        status: "SUBMITTED",
        hearingDate: HEARING_DATE,
      },
    });
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBe("READ");
    expect(presenter.report).toBeUndefined();
  });

  test("shows the report read-only once it's submitted, before its parent document catches up", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", makeReport("SUBMITTED"));
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBe("READ");
  });

  test("starts a new report when the docket shows a later hearing than the submitted one", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: null,
      latestReport: {
        reportId: "report_1",
        status: "SUBMITTED",
        hearingDate: "2025-10-01",
      },
    });
    const presenter = makePresenter();

    await presenter.hydrate();

    expect(presenter.mode).toBe("EDIT");
  });

  test("shows the last submitted report read-only when the resident has no docket hearing", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: null,
      latestReport: {
        reportId: "report_1",
        status: "SUBMITTED",
        hearingDate: "2025-10-01",
      },
    });
    const presenter = makePresenter({ ...CASE, hearingDate: undefined });

    await presenter.hydrate();

    expect(presenter.mode).toBe("READ");
  });

  test("shows no report when the resident has none and no docket hearing", async () => {
    const presenter = makePresenter({ ...CASE, hearingDate: undefined });

    await presenter.hydrate();

    expect(presenter.mode).toBeUndefined();
  });
});

describe("editReport", () => {
  test("the first edit creates the report for the docket hearing", async () => {
    const presenter = makePresenter();
    await presenter.hydrate();
    const write = vi.fn().mockResolvedValue(undefined);

    await presenter.editReport(write);

    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).toHaveBeenCalledWith(RECORD_ID, CASE.pseudonymizedId, {
      hearingDate: HEARING_DATE,
      hearingType: "Parole Grant Hearing",
    });
    expect(write).toHaveBeenCalledWith({
      recordId: RECORD_ID,
      reportId: "new_report",
    });
  });

  test("leaves the hearing type out when the profile has none", async () => {
    const presenter = makePresenter({
      ...CASE,
      hearingType: PAROLE_UNKNOWN_TEXT,
    });
    await presenter.hydrate();

    await presenter.editReport(vi.fn().mockResolvedValue(undefined));

    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).toHaveBeenCalledWith(RECORD_ID, CASE.pseudonymizedId, {
      hearingDate: HEARING_DATE,
    });
  });

  test("later edits write to the report in progress", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", makeReport("IN_PROGRESS"));
    const presenter = makePresenter();
    await presenter.hydrate();
    const write = vi.fn().mockResolvedValue(undefined);

    await presenter.editReport(write);

    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalledWith({
      recordId: RECORD_ID,
      reportId: "report_1",
    });
  });

  test("writes nothing when FirestoreStore skips creating the report", async () => {
    firestoreStore.getOrCreateActiveParoleBoardReport.mockResolvedValue(
      undefined,
    );
    const presenter = makePresenter();
    await presenter.hydrate();
    const write = vi.fn();

    await presenter.editReport(write);

    expect(write).not.toHaveBeenCalled();
  });

  test("refuses to edit a submitted report", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: null,
      latestReport: {
        reportId: "report_1",
        status: "SUBMITTED",
        hearingDate: HEARING_DATE,
      },
    });
    const presenter = makePresenter();
    await presenter.hydrate();
    const write = vi.fn();

    await expect(presenter.editReport(write)).rejects.toThrow(
      "Trying to edit a PHI report the profile shows read-only",
    );
    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  test("refuses to edit a report that failed to load", async () => {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    reportsById.report_1 = new FakeSubscription<ParoleBoardReport>(
      undefined,
      new Error("permission denied"),
    );
    const presenter = makePresenter();
    await presenter.hydrate();
    const write = vi.fn();

    await expect(presenter.editReport(write)).rejects.toThrow(
      "Trying to edit a PHI report the profile shows read-only",
    );
    expect(write).not.toHaveBeenCalled();
  });

  test("setFieldValue saves a section field, creating the report on the first edit", async () => {
    const presenter = makePresenter();
    await presenter.hydrate();

    await presenter.setFieldValue("summary", "fourthAmendmentWaiver", "YES");

    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).toHaveBeenCalled();
    expect(firestoreStore.setParoleBoardReportFieldValue).toHaveBeenCalledWith(
      { recordId: RECORD_ID, reportId: "new_report" },
      "summary",
      "fourthAmendmentWaiver",
      "YES",
    );
  });

  test("setRowValues saves a row's values in one write, creating the report on the first edit", async () => {
    const presenter = makePresenter();
    await presenter.hydrate();
    const row = { id: "phi_1793800000000_a1b2c3d4", source: "PHI" as const };

    await presenter.setRowValues("personalHistory", row, {
      substance: "Alcohol",
      ageOfFirstUse: 16,
    });

    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).toHaveBeenCalled();
    expect(firestoreStore.setParoleBoardReportRowValues).toHaveBeenCalledWith(
      { recordId: RECORD_ID, reportId: "new_report" },
      "personalHistory",
      row,
      { substance: "Alcohol", ageOfFirstUse: 16 },
    );
  });

  test("refuses to edit for a commissioner", async () => {
    userStore.canEditParoleBoardReports = false;
    const presenter = makePresenter();
    await presenter.hydrate();

    await expect(presenter.editReport(vi.fn())).rejects.toThrow(
      "Trying to edit a PHI report the profile shows read-only",
    );
    expect(
      firestoreStore.getOrCreateActiveParoleBoardReport,
    ).not.toHaveBeenCalled();
  });
});

describe("removeRow", () => {
  const REPORT_REF = { recordId: RECORD_ID, reportId: "report_1" };
  const ADDED_ROW_ID = "phi_1793800000000_a1b2c3d4";
  const addedRowEntry = {
    source: "PHI" as const,
    fields: {
      notes: {
        value: "Sentenced, entered custody",
        updatedBy: "phi@example.com",
        updatedAt: new Date("2026-11-01T12:00:00Z"),
      },
    },
  };

  async function presenterWithReport() {
    givenReportsForResident({
      stateCode: "US_ID",
      activeReportId: "report_1",
      latestReport: null,
    });
    givenReport("report_1", {
      ...makeReport("IN_PROGRESS"),
      sections: { pastActions: { rows: { [ADDED_ROW_ID]: addedRowEntry } } },
    });
    const presenter = makePresenter();
    await presenter.hydrate();
    return presenter;
  }

  test("deletes a row the PHI added right away, and undo writes it back as it was", async () => {
    const presenter = await presenterWithReport();

    const { done, undo } = presenter.removeRow("pastActions", {
      id: ADDED_ROW_ID,
      status: "ADDED_BY_PHI",
      label: null,
    });
    await done;

    expect(firestoreStore.deleteParoleBoardReportRow).toHaveBeenCalledWith(
      REPORT_REF,
      "pastActions",
      ADDED_ROW_ID,
    );
    expect(firestoreStore.restoreParoleBoardReportRow).not.toHaveBeenCalled();

    await undo();

    expect(firestoreStore.restoreParoleBoardReportRow).toHaveBeenCalledWith(
      REPORT_REF,
      "pastActions",
      ADDED_ROW_ID,
      addedRowEntry,
    );
  });

  test("marks a row still in Atlas as removed, and undo clears the mark", async () => {
    const presenter = await presenterWithReport();
    const atlasRow = { id: "1001", source: "ATLAS", atlasLabel: "Robbery" };

    const { done, undo } = presenter.removeRow("offenseInformation", {
      id: "1001",
      status: "IN_ATLAS",
      label: "Robbery",
    });
    await done;

    expect(firestoreStore.setParoleBoardReportRowRemoved).toHaveBeenCalledWith(
      REPORT_REF,
      "offenseInformation",
      atlasRow,
      true,
    );
    expect(firestoreStore.deleteParoleBoardReportRow).not.toHaveBeenCalled();

    await undo();

    expect(
      firestoreStore.setParoleBoardReportRowRemoved,
    ).toHaveBeenLastCalledWith(
      REPORT_REF,
      "offenseInformation",
      atlasRow,
      false,
    );
  });

  test("writes nothing for a row that has no input left to remove", async () => {
    const presenter = await presenterWithReport();

    const { done, undo } = presenter.removeRow("pastActions", {
      id: "phi_already_removed",
      status: "ADDED_BY_PHI",
      label: null,
    });
    await done;
    await undo();

    expect(firestoreStore.deleteParoleBoardReportRow).not.toHaveBeenCalled();
    expect(firestoreStore.restoreParoleBoardReportRow).not.toHaveBeenCalled();
  });
});

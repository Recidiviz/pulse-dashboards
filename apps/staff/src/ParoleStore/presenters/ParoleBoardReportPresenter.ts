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

import { makeAutoObservable, onBecomeUnobserved, runInAction } from "mobx";

import {
  PAROLE_UNKNOWN_TEXT,
  ParoleBoardReport,
  ParoleBoardReportSectionKey,
  ParoleBoardReportsForResident,
  ParoleCase,
} from "~datatypes";
import {
  awaitHydration,
  castToError,
  Hydratable,
  hydrationFailure,
  HydrationState,
  isHydrated,
  isHydrationInProgress,
} from "~hydration-utils";

import FirestoreStore, {
  ParoleBoardReportRef,
  ParoleBoardReportRowEntry,
} from "../../FirestoreStore";
import UserStore from "../../RootStore/UserStore";
import { CollectionDocumentSubscription } from "../../WorkflowsStore/subscriptions";
import { ResolvedRow } from "../report/resolveSection";

/**
 * How the case profile shows the resident's PHI report. EDIT shows the report
 * in progress, or an empty one that the PHI's first edit creates. READ shows
 * the submitted report, read-only, rendered from its snapshots.
 */
export type ParoleBoardReportMode = "EDIT" | "READ";

/**
 * Starts the subscription if it hasn't started, and throws its error if it
 * fails to load.
 */
async function loadSubscription(subscription: Hydratable): Promise<void> {
  await awaitHydration(subscription);
  const error = hydrationFailure(subscription);
  if (error) throw error;
}

/**
 * Connects Idaho's case profile to the resident's PHI report. It decides
 * whether the profile shows the report and in which mode, reads the report in
 * progress, and gives sections one way to write to it. Sections take their
 * mode and data from here and never check permissions or report status
 * themselves.
 *
 * Only a PHI with usIdParoleBoardReports on reads reports. Everyone else,
 * commissioners and Recidiviz users included, sees today's read-only profile,
 * and nothing reads or writes paroleBoardReports for them.
 */
export class ParoleBoardReportPresenter implements Hydratable {
  // Covers only the report the profile opens on. A report that the PHI's
  // first edit creates loads later, without putting the page back into its
  // loading state.
  private loadState: HydrationState = { status: "needs hydration" };

  private readonly reportsForResidentSubscription?: CollectionDocumentSubscription<ParoleBoardReportsForResident>;

  // Keeps one subscription per report, so reading the active report doesn't
  // start a new listener each time.
  private reportSubscriptionsById = new Map<
    string,
    CollectionDocumentSubscription<ParoleBoardReport>
  >();

  constructor(
    private firestoreStore: FirestoreStore,
    private userStore: UserStore,
    private caseDetail: ParoleCase,
  ) {
    // Building a subscription reads nothing. It starts listening once the
    // presenter hydrates or a section reads the report.
    if (caseDetail.recordId) {
      this.reportsForResidentSubscription =
        firestoreStore.buildParoleBoardReportsForResidentSubscription(
          caseDetail.recordId,
        );
    }

    makeAutoObservable<
      this,
      | "firestoreStore"
      | "userStore"
      | "caseDetail"
      | "reportsForResidentSubscription"
      | "reportSubscriptionsById"
    >(this, {
      firestoreStore: false,
      userStore: false,
      caseDetail: false,
      reportsForResidentSubscription: false,
      reportSubscriptionsById: false,
    });

    // Hydrating starts the listeners directly, so they stop when the page
    // stops watching this presenter, not only when a section stops reading
    // the report.
    onBecomeUnobserved(this, "hydrationState", () => this.stopListening());
  }

  get hydrationState(): HydrationState {
    return this.readsReports ? this.loadState : { status: "hydrated" };
  }

  /**
   * Loads the resident's parent report document, then the report in progress
   * if there is one. It never reads report data inside a MobX reaction, so
   * the listeners don't stop while they load.
   */
  async hydrate(): Promise<void> {
    if (!this.readsReports || !this.reportsForResidentSubscription) return;
    if (isHydrated(this) || isHydrationInProgress(this)) return;

    this.loadState = { status: "loading" };
    try {
      await loadSubscription(this.reportsForResidentSubscription);
      const report = this.activeReportSubscription;
      if (report) await loadSubscription(report);
      runInAction(() => {
        this.loadState = { status: "hydrated" };
      });
    } catch (e) {
      runInAction(() => {
        this.loadState = { status: "failed", error: castToError(e) };
      });
    }
  }

  /**
   * How the profile shows the report, or undefined when it shows no report,
   * only today's read-only profile. See "Who sees what" in the design doc.
   * A PHI whose report fails to load also gets today's profile, so nothing
   * edits a report the page couldn't read.
   */
  get mode(): ParoleBoardReportMode | undefined {
    if (!this.readsReports || this.reportFailedToLoad) return undefined;

    // Submitting a report clears activeReportId in the same batch, but the
    // report and its parent document can load a moment apart.
    const activeStatus = this.activeReportSubscription?.data?.status;
    if (activeStatus !== undefined && activeStatus !== "IN_PROGRESS") {
      return "READ";
    }
    if (this.activeReportId) return "EDIT";
    if (this.hasSubmittedReportForHearing) return "READ";
    // Nothing creates a report until the PHI's first edit, and a report
    // needs a docket hearing to belong to.
    return this.hearing ? "EDIT" : undefined;
  }

  /**
   * The report in progress, in edit mode. Undefined before the PHI's first
   * edit creates it, and in every other mode.
   */
  get report(): ParoleBoardReport | undefined {
    return this.mode === "EDIT"
      ? this.activeReportSubscription?.data
      : undefined;
  }

  /**
   * Whether the resident's PHI report failed to load. The profile then shows
   * today's read-only sections under a banner saying so.
   */
  get reportFailedToLoad(): boolean {
    return hydrationFailure(this) !== undefined;
  }

  /**
   * Writes one section edit to the report in progress. The PHI's first edit
   * creates the report for the docket hearing, so every section writes
   * through here rather than calling FirestoreStore directly.
   *
   * @param write - Writes the edit to the report through a FirestoreStore
   *   writer, such as setParoleBoardReportFieldValue.
   */
  async editReport(
    write: (report: ParoleBoardReportRef) => Promise<void>,
  ): Promise<void> {
    const { recordId } = this.caseDetail;
    if (this.mode !== "EDIT" || !recordId) {
      throw new Error(
        "Trying to edit a PHI report the profile shows read-only",
      );
    }

    const reportId = this.activeReportId ?? (await this.createReport(recordId));
    // FirestoreStore skips report writes from impersonators and Recidiviz
    // users in production, and then creates no report.
    if (reportId === undefined) return;
    await write({ recordId, reportId });
  }

  /**
   * Removes a row from the report in progress. It starts the write right
   * away, so the removal holds even if the PHI reloads before the undo toast
   * closes, and returns at once with the write and a function that undoes it.
   *
   * - A row the PHI added, or one no longer in Atlas, loses its input, and
   *   undoing writes the input back as it was.
   * - A row still in Atlas gets the removed marker, which keeps any input the
   *   PHI entered on it, and undoing clears the marker.
   *
   * Firestore applies one client's writes in order, so an undo started
   * before the removal finishes still lands after it.
   *
   * @param section - The section's key in the report, such as "pastActions".
   * @param row - The resolved row to remove.
   * @returns done, which settles when the removal is saved, and undo.
   */
  removeRow<Section extends ParoleBoardReportSectionKey>(
    section: Section,
    row: Pick<ResolvedRow<unknown>, "id" | "status" | "label">,
  ): { done: Promise<void>; undo: () => Promise<void> } {
    if (row.status === "IN_ATLAS") {
      const reportRow = {
        id: row.id,
        source: "ATLAS" as const,
        ...(row.label !== null && { atlasLabel: row.label }),
      };
      const setRemoved = (removed: boolean) =>
        this.editReport((report) =>
          this.firestoreStore.setParoleBoardReportRowRemoved(
            report,
            section,
            reportRow,
            removed,
          ),
        );
      return { done: setRemoved(true), undo: () => setRemoved(false) };
    }

    const entry = this.report?.sections[section]?.rows?.[row.id] as
      | ParoleBoardReportRowEntry<Section>
      | undefined;
    // Another tab already removed the row, so there is nothing to remove or
    // to bring back.
    if (!entry) {
      return { done: Promise.resolve(), undo: () => Promise.resolve() };
    }
    return {
      done: this.editReport((report) =>
        this.firestoreStore.deleteParoleBoardReportRow(report, section, row.id),
      ),
      undo: () =>
        this.editReport((report) =>
          this.firestoreStore.restoreParoleBoardReportRow(
            report,
            section,
            row.id,
            entry,
          ),
        ),
    };
  }

  /**
   * Whether this user reads the resident's reports: a PHI with the feature
   * variant on, for a case with a record id. Commissioners can't read a report
   * until it's submitted, so they read nothing until submitting exists.
   */
  private get readsReports(): boolean {
    return (
      this.reportsForResidentSubscription !== undefined &&
      !!this.userStore.activeFeatureVariants.usIdParoleBoardReports &&
      this.userStore.canEditParoleBoardReports
    );
  }

  private get reportsForResident(): ParoleBoardReportsForResident | undefined {
    return this.readsReports
      ? this.reportsForResidentSubscription?.data
      : undefined;
  }

  private get activeReportId(): string | undefined {
    return this.reportsForResident?.activeReportId ?? undefined;
  }

  private get activeReportSubscription():
    | CollectionDocumentSubscription<ParoleBoardReport>
    | undefined {
    const { recordId } = this.caseDetail;
    const reportId = this.activeReportId;
    if (!recordId || !reportId) return undefined;

    let subscription = this.reportSubscriptionsById.get(reportId);
    if (!subscription) {
      subscription = this.firestoreStore.buildParoleBoardReportSubscription({
        recordId,
        reportId,
      });
      this.reportSubscriptionsById.set(reportId, subscription);
    }
    return subscription;
  }

  /**
   * Whether the resident's latest report is submitted and the docket shows no
   * later hearing. The profile then shows that report, rather than an empty
   * one for the next hearing.
   */
  private get hasSubmittedReportForHearing(): boolean {
    const latestReport = this.reportsForResident?.latestReport;
    if (!latestReport || latestReport.status === "IN_PROGRESS") return false;
    const hearingDate = this.hearing?.hearingDate;
    return hearingDate === undefined || hearingDate <= latestReport.hearingDate;
  }

  /**
   * The docket hearing that a new report belongs to, or undefined when the
   * resident has none. The type is left out when the profile has none to
   * show, which happens when the docket date is a hearing due date.
   */
  private get hearing(): ParoleBoardReport["hearing"] | undefined {
    const { hearingDate, hearingType } = this.caseDetail;
    if (!hearingDate) return undefined;
    return {
      hearingDate,
      ...(hearingType !== PAROLE_UNKNOWN_TEXT && { hearingType }),
    };
  }

  private stopListening(): void {
    this.reportsForResidentSubscription?.unsubscribe();
    this.reportSubscriptionsById.forEach((subscription) =>
      subscription.unsubscribe(),
    );
  }

  private createReport(recordId: string): Promise<string | undefined> {
    const { hearing } = this;
    if (!hearing) {
      throw new Error(
        "Trying to start a PHI report for a resident with no docket hearing",
      );
    }
    return this.firestoreStore.getOrCreateActiveParoleBoardReport(
      recordId,
      this.caseDetail.pseudonymizedId,
      hearing,
    );
  }
}

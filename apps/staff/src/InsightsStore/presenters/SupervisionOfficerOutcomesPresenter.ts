// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { flowResult, makeObservable, override } from "mobx";

import { ActionStrategyCopy } from "~datatypes";
import { castToError, FlowMethod, HydratesFromSource } from "~hydration-utils";

import { InsightsAPI } from "../api/interface";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenterBase } from "./SupervisionOfficerPresenterBase";
import { HighlightedOfficersDetail, OfficerOutcomesData } from "./types";
import {
  getHighlightedOfficersByMetric,
  getOfficerOutcomesData,
  isExcludedSupervisionOfficer,
} from "./utils";

export class SupervisionOfficerOutcomesPresenter extends SupervisionOfficerPresenterBase {
  constructor(
    protected supervisionStore: InsightsSupervisionStore,
    public officerPseudoId: string,
  ) {
    super(supervisionStore, officerPseudoId);

    makeObservable<
      SupervisionOfficerOutcomesPresenter,
      // officer
      | "populateSupervisionOfficer"
      // outcomes
      | "expectOfficerOutcomesPopulated"
      | "populateSupervisionOfficerOutcomes"
      | "expectOfficerOutcomesDataPopulated"
      | "officerOutcomesDataOrError"
    >(this, {
      // hydration
      populateSupervisionOfficer: override,
      hydrate: override,
      hydrationState: override,
      // action strategies
      actionStrategyCopy: true,
      disableSurfaceActionStrategies: true,
      setUserHasSeenActionStrategy: true,
      // outcomes data
      officerOutcomesData: override,
      officerOutcomesDataOrError: override,
      expectOfficerOutcomesPopulated: override,
      expectOfficerOutcomesDataPopulated: override,
      populateSupervisionOfficerOutcomes: override,
    });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        ...this.expectPopulated(),
        ...this.expectOutcomesDependenciesPopulated(),
      ],
      populate: async () => {
        await Promise.all(super.populateMethods());
        // These need to happen after the above calls so that the officer record is hydrated
        await flowResult(this.populateSupervisionOfficerOutcomes());
      },
    });
  }

  // ==============================
  // Officer Highlights
  // ==============================

  /**
   * Returns metrics where this officer meets the top X percent criteria.
   * @returns An array of objects containing the metric, top X percent criteria, and info about
   * officers meeting the top X percent criteria. Returns empty array for officers
   * excluded from outcomes.
   */
  get highlightedOfficers(): HighlightedOfficersDetail[] {
    if (isExcludedSupervisionOfficer(this.officerRecord)) return [];

    // Not expected in practice, but needed for type safety
    if (!this.officerOutcomes || !this.officerRecord) {
      throw new Error("Missing necessary officer data");
    }
    return getHighlightedOfficersByMetric(
      this.metricConfigsById,
      [this.officerRecord],
      [this.officerOutcomes],
    );
  }

  // ==============================
  // Action Strategies
  // ==============================

  /**
   * Passthrough to supervisionStore.
   * Provides the Action Strategy copy with prompt and body text
   * @returns an ActionStrategyCopy object
   */
  get actionStrategyCopy(): ActionStrategyCopy[string] | undefined {
    return this.supervisionStore.getActionStrategyCopy(this.officerPseudoId);
  }

  /**
   * Passthrough to supervisionStore.
   * Disables Action Strategies so that the banner is not seen
   * again in the current session
   */
  disableSurfaceActionStrategies(): void {
    this.supervisionStore.disableSurfaceActionStrategies();
  }

  /**
   * Passthrough to supervisionStore.
   * When the user has seen an Action Strategy banner,
   * use this to notify the BE of the new surfaced event
   */
  setUserHasSeenActionStrategy(): void {
    this.supervisionStore.setUserHasSeenActionStrategy(this.officerPseudoId);
  }

  // ==============================
  // Outcomes Data
  // ==============================

  protected get officerOutcomes() {
    return this.supervisionStore.officerOutcomes ?? this.fetchedOfficerOutcomes;
  }

  /**
   * Augments officer data with all necessary relationships fully hydrated.
   * If this fails for any reason, the value will instead reflect the error that was encountered.
   */
  protected get officerOutcomesDataOrError(): OfficerOutcomesData | Error {
    try {
      if (!this.officerRecord) throw new Error("Missing officer record");
      if (isExcludedSupervisionOfficer(this.officerRecord))
        throw new Error("Outcomes data is not expected for excluded officers");
      if (!this.officerOutcomes) throw new Error("Missing officer outcomes");

      return getOfficerOutcomesData(
        this.officerRecord,
        this.supervisionStore,
        this.officerOutcomes,
      );
    } catch (e) {
      return castToError(e);
    }
  }

  /**
   * Augments officer and corresponding outcomes data with all necessary relationships
   * fully hydrated. Returns undefined for excluded officers.
   */
  get officerOutcomesData(): OfficerOutcomesData | undefined {
    if (
      isExcludedSupervisionOfficer(this.officerRecord) ||
      this.officerOutcomesDataOrError instanceof Error
    )
      return;
    return this.officerOutcomesDataOrError;
  }

  protected get isOfficerOutcomesDataPopulated() {
    return !(this.officerOutcomesDataOrError instanceof Error);
  }

  /**
   * Fetch record for current officer.
   */
  protected *populateSupervisionOfficer(): FlowMethod<
    InsightsAPI["supervisionOfficer"],
    void
  > {
    if (this.isOfficerPopulated) return;

    this.fetchedOfficerRecord =
      yield this.supervisionStore.insightsStore.apiClient.supervisionOfficer(
        this.officerPseudoId,
      );
  }

  /**
   * Fetch outcomes for current officer.
   */
  protected *populateSupervisionOfficerOutcomes(): FlowMethod<
    InsightsAPI["outcomesForOfficer"],
    void
  > {
    if (isExcludedSupervisionOfficer(this.officerRecord)) return;
    this.fetchedOfficerOutcomes =
      yield this.supervisionStore.insightsStore.apiClient.outcomesForOfficer(
        this.officerPseudoId,
      );
  }
}

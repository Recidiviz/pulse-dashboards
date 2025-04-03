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

import { flowResult, makeAutoObservable } from "mobx";

import { RosterChangeRequest } from "~datatypes";
import { Hydratable, HydratesFromSource } from "~hydration-utils";

import { RosterChangeRequestParams } from "../../core/InsightsSupervisorRosterModal/types";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";

export class SupervisionSupervisorRosterModalPresenter implements Hydratable {
  // ==============================
  // Properties and Constructor
  // ==============================

  private _view: "ROSTER" | "FORM" = "ROSTER";
  private _isOpen = false;

  hydrator: HydratesFromSource;

  constructor(
    public supervisionStore: InsightsSupervisionStore,
    public supervisorPseudoId: string,
  ) {
    makeAutoObservable(this, undefined, { autoBind: true });

    this.hydrator = new HydratesFromSource({
      expectPopulated: [
        this.expectOfficersPopulated,
        this.expectSupervisorPopulated,
        this.expectOfficersOnSupervisorTeam,
      ],
      populate: async () => {
        await Promise.all([
          flowResult(
            this.supervisionStore.populateOfficersForSupervisor(
              supervisorPseudoId,
            ),
          ),
          flowResult(this.supervisionStore.populateAllSupervisionOfficers()),
          flowResult(
            this.supervisionStore.populateSupervisionOfficerSupervisors,
          ),
        ]);
      },
    });
  }

  // ==============================
  // Hydration
  // ==============================

  async hydrate(): Promise<void> {
    return this.hydrator.hydrate();
  }

  get hydrationState() {
    return this.hydrator.hydrationState;
  }

  private expectOfficersPopulated() {
    if (
      this.userCanSubmitRosterChangeRequest &&
      this.supervisionStore.supervisionOfficers === undefined
    )
      throw new Error("failed to populate all officers");
  }

  private expectSupervisorPopulated() {
    if (!this.supervisorInfo) throw new Error("failed to populate supervisor");
  }

  private expectOfficersOnSupervisorTeam() {
    if (
      this.supervisionStore.officersBySupervisorPseudoId.get(
        this.supervisorPseudoId,
      ) === undefined
    )
      throw new Error("failed to populate officers on supervisor's team");
  }

  // ==============================
  // Server Data
  // ==============================

  get supervisorInfo() {
    return this.supervisionStore.supervisorInfo(this.supervisorPseudoId);
  }
  /**
   * Helpful to toggle the ability to make a request from the view.
   */
  get userCanSubmitRosterChangeRequest(): boolean {
    return this.supervisionStore.userCanSubmitRosterChangeRequest;
  }

  /**
   * Gets the list of supervision officers from the store.
   */
  get allOfficers() {
    return this.userCanSubmitRosterChangeRequest
      ? this.supervisionStore.supervisionOfficers
      : [];
  }

  get officersOnSupervisorTeam() {
    return this.supervisionStore.officersBySupervisorPseudoId.get(
      this.supervisorPseudoId,
    );
  }

  get labels() {
    return this.supervisionStore.labels;
  }

  // ==============================
  // Analytics
  // ==============================

  async submitRosterChangeRequestIntercomTicket(
    ...args: RosterChangeRequestParams
  ) {
    return await flowResult(
      this.supervisionStore.submitRosterChangeRequestIntercomTicket(...args),
    );
  }

  trackViewed(): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsRosterModalViewed(
      {
        supervisorPseudonymizedId: this.supervisorPseudoId,
        viewedBy: userPseudoId,
      },
    );
  }

  trackSubmitted({
    supervisorPseudonymizedId,
    affectedOfficersExternalIds,
    requestChangeType,
    intercomTicketId,
    error,
  }: {
    supervisorPseudonymizedId: string;
    affectedOfficersExternalIds: RosterChangeRequest["affectedOfficersExternalIds"];
    requestChangeType: RosterChangeRequest["requestChangeType"];
    intercomTicketId?: string;
    error?: string;
  }): void {
    const { userPseudoId } =
      this.supervisionStore.insightsStore.rootStore.userStore;
    this.supervisionStore.insightsStore.rootStore.analyticsStore.trackInsightsRosterChangeRequestFormSubmitted(
      {
        submittedBy: userPseudoId,
        supervisorPseudonymizedId,
        affectedOfficersExternalIds,
        requestChangeType,
        ...(error ? { error } : { intercomTicketId }),
      },
    );
  }

  // ==============================
  // Navigation and View Managment
  // ==============================

  openModal() {
    this._isOpen = true;
  }

  closeModal() {
    this._isOpen = false;
  }

  get isModalOpen() {
    return this._isOpen;
  }

  get view() {
    return this._view;
  }

  set view(view) {
    this._view = view;
  }
}

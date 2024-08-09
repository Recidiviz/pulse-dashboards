// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { makeObservable } from "mobx";

import UserStore from "../../RootStore/UserStore";
import { Opportunity, OpportunityType } from "../../WorkflowsStore";
import { JusticeInvolvedPersonsStore } from "../../WorkflowsStore/JusticeInvolvedPersonsStore";
import { InsightsSupervisionStore } from "../stores/InsightsSupervisionStore";
import { SupervisionOfficerPresenter } from "./SupervisionOfficerPresenter";

/**
 * A presenter for data relevant to opportunity-specific views, specifically the
 * supervisor homepage opportunity drill-down view. At this time, there's not a need
 * to override the parent hydrator/hydration methods.
 */
export class SupervisionOpportunityPresenter extends SupervisionOfficerPresenter {
  constructor(
    supervisionStore: InsightsSupervisionStore,
    justiceInvolvedPersonsStore: JusticeInvolvedPersonsStore,
    userStore: UserStore,
    officerPseudoId: string,
    public opportunityType: OpportunityType,
  ) {
    super(
      supervisionStore,
      justiceInvolvedPersonsStore,
      userStore,
      officerPseudoId,
    );

    makeObservable<SupervisionOpportunityPresenter>(this, {
      opportunityType: true,
      opportunities: true,
    });
  }

  get opportunities(): Opportunity[] | undefined {
    return this.opportunitiesByType?.[this.opportunityType];
  }

  get opportunityLabel(): string {
    return this.opportunities?.[0].config.label ?? "";
  }
}

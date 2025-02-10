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

import {
  FieldPath,
  QueryFieldFilterConstraint,
  where,
} from "firebase/firestore";
import { some } from "lodash";
import { values } from "mobx";

import { AnyWorkflowsSystemConfig } from "../core/models/types";
import { JusticeInvolvedPerson, PersonType } from "./types";
import { WorkflowsStore } from "./WorkflowsStore";

export class SearchManager {
  workflowsStore: WorkflowsStore;

  personType: PersonType;

  constructor(workflowsStore: WorkflowsStore, personType: PersonType) {
    this.workflowsStore = workflowsStore;
    this.personType = personType;
  }

  get queryConstraints(): QueryFieldFilterConstraint[] | undefined {
    const {
      selectedSearchIds,
      rootStore: { currentTenantId },
    } = this.workflowsStore;
    const { systemConfig } = this;

    if (!currentTenantId || !selectedSearchIds.length) {
      return undefined;
    }

    const constraints = [
      where("stateCode", "==", currentTenantId),
      where(
        // TODO (#7054) Handle multiple search configs once second US_ID config is added.
        new FieldPath(...systemConfig.search[0].searchField),
        systemConfig.search[0].searchOp ?? "in",
        selectedSearchIds,
      ),
    ];

    if (systemConfig.onlySurfaceEligible) {
      constraints.push(where("allEligibleOpportunities", "!=", []));
    }

    return constraints;
  }

  get systemConfig(): AnyWorkflowsSystemConfig {
    return this.workflowsStore.systemConfigFor(
      this.personType === "RESIDENT" ? "INCARCERATION" : "SUPERVISION",
    );
  }

  personMatchesSearch(person: JusticeInvolvedPerson): boolean {
    return (
      person.personType === this.personType &&
      some(this.workflowsStore.selectedSearchIds, (id) =>
        person.searchIdValues?.includes(id),
      )
    );
  }

  get matchingPersons(): JusticeInvolvedPerson[] {
    return this.isEnabled
      ? values(this.workflowsStore.justiceInvolvedPersons).filter((p) => {
          return this.personMatchesSearch(p);
        })
      : [];
  }

  get isEnabled(): boolean {
    return (
      this.workflowsStore.activeSystem === "ALL" ||
      (this.workflowsStore.activeSystem === "INCARCERATION" &&
        this.personType === "RESIDENT") ||
      (this.workflowsStore.activeSystem === "SUPERVISION" &&
        this.personType === "CLIENT")
    );
  }
}

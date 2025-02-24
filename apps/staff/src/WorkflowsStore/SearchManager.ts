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

import { ascending } from "d3-array";
import {
  and,
  FieldPath,
  or,
  QueryCompositeFilterConstraint,
  where,
} from "firebase/firestore";
import { groupBy, some } from "lodash";
import { values } from "mobx";

import { AnyWorkflowsSystemConfig } from "../core/models/types";
import { SearchStore } from "./SearchStore";
import { JusticeInvolvedPerson, PersonType } from "./types";

export class SearchManager {
  searchStore: SearchStore;

  personType: PersonType;

  constructor(searchStore: SearchStore, personType: PersonType) {
    this.searchStore = searchStore;
    this.personType = personType;
  }

  get queryConstraints(): QueryCompositeFilterConstraint | undefined {
    const {
      workflowsStore: {
        selectedSearchIds,
        rootStore: { currentTenantId },
      },
    } = this.searchStore;
    const { systemConfig } = this;

    if (!currentTenantId || !selectedSearchIds.length) {
      return undefined;
    }

    // The conditions that are applied with a logical OR
    // A person should match if they match searchId1 OR searchId2
    const orConditions = systemConfig.search.map((c) => {
      return where(
        new FieldPath(...c.searchField),
        c.searchOp ?? "in",
        selectedSearchIds,
      );
    });

    // The conditions that are applied with a logical AND
    // A person should match if they have a specific stateCode AND they match any of the searchIds
    const andConditions = [
      where("stateCode", "==", currentTenantId),
      or(...orConditions),
    ];

    if (systemConfig.onlySurfaceEligible) {
      andConditions.push(where("allEligibleOpportunities", "!=", []));
    }

    const constraints = and(...andConditions);

    return constraints;
  }

  get systemConfig(): AnyWorkflowsSystemConfig {
    return this.searchStore.workflowsStore.systemConfigFor(
      this.personType === "RESIDENT" ? "INCARCERATION" : "SUPERVISION",
    );
  }

  personMatchesSearch(person: JusticeInvolvedPerson): boolean {
    return (
      person.personType === this.personType &&
      some(this.searchStore.workflowsStore.selectedSearchIds, (id) =>
        person.searchIdValues?.includes(id),
      )
    );
  }

  get matchingPersons(): JusticeInvolvedPerson[] {
    return this.isEnabled
      ? values(this.searchStore.workflowsStore.justiceInvolvedPersons).filter(
          (p) => {
            return this.personMatchesSearch(p);
          },
        )
      : [];
  }

  get matchingPersonsSorted(): JusticeInvolvedPerson[] {
    return this.matchingPersons.sort((a, b) => {
      return (
        ascending(a.fullName.surname, b.fullName.surname) ||
        ascending(a.fullName.givenNames, b.fullName.givenNames)
      );
    });
  }

  /**
   * Returns an object with matching persons grouped by the seletedSearchId that they matched:
   * {
   *   officerId1: [CLIENT1, CLIENT3],
   *   locationId1: [CLIENT1]
   * }
   */
  get matchingPersonsGrouped(): Record<string, JusticeInvolvedPerson[]> {
    const matchingPersons = [ ...this.matchingPersonsSorted ];
    let caseloads: Record<string, JusticeInvolvedPerson[]> = {};
    // Create a group for each searchField id
    this.systemConfig.search.forEach(({ searchField }) => {
      caseloads = {
        ...caseloads,
        ...groupBy(
          matchingPersons,
          `record.${searchField.join(".")}`,
        ),
      };
    });
    // Delete extraneous groups that are not in selectedSearchIds
    // The extra groups exist because we are pulling all of the ids from every searchField
    // in the logic above, but some of them won't be in the selectedSearchIds even though the JIP matches.
    // So given:
    //   selectedSearchIds: ["officer1, location1"]
    //   client1: { oficerId: "officer1", "location1" }
    //   client2: { oficerId: "officer1", "location2" }
    // caseloads at this point would be:
    //   caseloads: { officer1: [client1, client2], location1: [client1], location2: [client2] }
    // the "location2" id is not in selectedSearchIds so it should be removed as a group
    Object.keys(caseloads).forEach((key) => {
      if (!this.searchStore.workflowsStore.selectedSearchIds.includes(key))
        delete caseloads[key];
    });
    return caseloads;
  }

  get isEnabled(): boolean {
    return (
      this.searchStore.workflowsStore.activeSystem === "ALL" ||
      (this.searchStore.workflowsStore.activeSystem === "INCARCERATION" &&
        this.personType === "RESIDENT") ||
      (this.searchStore.workflowsStore.activeSystem === "SUPERVISION" &&
        this.personType === "CLIENT")
    );
  }
}

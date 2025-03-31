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
        rootStore: { currentTenantId },
      },
      selectedSearchIds,
    } = this.searchStore;
    const { systemConfig } = this;

    if (!currentTenantId || !selectedSearchIds.length) {
      return undefined;
    }

    // The conditions that are applied with a logical OR
    // A person should match if they match searchId1 OR searchId2
    const orConditions = systemConfig.search.map((c) => {
      const whereClause = where(
        new FieldPath(...c.searchField),
        c.searchOp ?? "in",
        selectedSearchIds,
      );
      if (c.onlySurfaceEligible) {
        return and(whereClause, where("allEligibleOpportunities", "!=", []));
      }
      return whereClause;
    });

    // The conditions that are applied with a logical AND
    // A person should match if they have a specific stateCode AND they match any of the searchIds
    const andConditions = [
      where("stateCode", "==", currentTenantId),
      or(...orConditions),
    ];

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
      some(this.searchStore.selectedSearchIds, (id) =>
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
    const matchingPersons = [...this.matchingPersonsSorted];
    const caseloads: Record<string, JusticeInvolvedPerson[]> = {};
    // Create a group for each searchField id
    this.systemConfig.search.forEach(({ searchField }) => {
      // If the searchField is an array, groupBy converts it to a comma separated string as the key
      const groupedPersons = groupBy(
        matchingPersons,
        `record.${searchField.join(".")}`,
      );

      Object.entries(groupedPersons).forEach(([caseloadId, caseload]) => {
        // The caseloadId at this point is either a string: "OFFICER_ID1"
        // or a string representation of an array in the case of US_ID facility: "'CRC PWCC', 'PWCC', 'CRC EBCRC', 'EBCRC'"
        // We need to split the string with multiple facilities and create a group for each caseloadId/facility if it is in selectedSearchIds
        // TODO #7802 Handle case when IDs contain a comma
        caseloadId.split(",").forEach((key) => {
          if (this.searchStore.selectedSearchIds.includes(key)) {
            caseloads[key] = (caseloads[key] ?? []).concat(caseload);
          }
        });
      });
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

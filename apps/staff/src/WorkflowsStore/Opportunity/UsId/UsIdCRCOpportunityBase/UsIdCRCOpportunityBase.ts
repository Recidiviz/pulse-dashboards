// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
import { DocumentData } from "firebase/firestore";

import { Resident } from "../../../Resident";
import { JusticeInvolvedPerson } from "../../../types";
import { OpportunityBase } from "../../OpportunityBase";
import { Opportunity, OpportunityTab, OpportunityTabGroup } from "../../types";

export abstract class UsIdCRCOpportunityBase<
  ReferralRecord extends DocumentData,
> extends OpportunityBase<Resident, ReferralRecord> {
  compare(other: Opportunity<JusticeInvolvedPerson>): number {
    const { releaseDate } = this.person;
    const { releaseDate: otherReleaseDate } = (other as Opportunity<Resident>)
      .person;
    return ascending(releaseDate, otherReleaseDate);
  }

  // Male Residents - MALE
  // Female Residents - FEMALE
  // Non-binary Residents - NON_BINARY
  // Trans Male Residents - TRANS MALE
  // Trans Female Residents - TRANS FEMALE
  // Trans Residents - TRANS
  // Unknown - PRESENT_WITHOUT_INFO, EXTERNAL UNKNOWN, INTERNAL_UNKNOWN

  /**
   *
   * @param category
   * @returns
   */
  tabTitle(category?: OpportunityTabGroup | undefined): OpportunityTab {
    if (category?.startsWith("GENDER")) {
      const { gender } = this.person;
      const genderMapping = {
        MALE: "Cisgender Male",
        FEMALE: "Cisgender Female",
        NON_BINARY: "Non-binary",
        TRANS_MALE: "Transgender Male",
        TRANS_FEMALE: "Transgender Female",
        TRANS: "Transgender - Unavailable",
      };

      if (gender && gender in genderMapping)
        return genderMapping[
          gender as keyof typeof genderMapping
        ] as OpportunityTab;
      else return "Gender Unavailable" as OpportunityTab;
    }

    return super.tabTitle();
  }
}

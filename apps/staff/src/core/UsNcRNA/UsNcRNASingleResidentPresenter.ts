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

import { makeAutoObservable } from "mobx";

import {
  RNACheckboxAnswers,
  RNALifeAreaAnswers,
  RNATextAnswers,
} from "~@jii/configs";
import { Hydratable, HydrationState } from "~hydration-utils";

import { Resident } from "../../WorkflowsStore/Resident";

export class UsNcRNASingleResidentPresenter implements Hydratable {
  constructor(public selectedPerson: Resident) {
    makeAutoObservable(this);
  }

  hydrate() {
    // TODO: currently does nothing, replace with results from JII backend
  }

  get hydrationState(): HydrationState {
    return { status: "hydrated" };
  }

  get textAnswers(): RNATextAnswers {
    // TODO: placeholder answers, replace with results from JII backend
    return {
      needsWorkSchoolSatisfied: "NEVER",
      needsHasJobSkills: "RARELY",
      needsImproveJobSchool: "SOMETIMES",
      needsRanOutOfMoney: "USUALLY",
      needsStruggledWithBills: "ALWAYS",
      childhoodSkippingSchool: "YES",
      childhoodRunningAway: "NO",
      alcoholDrugsDaysOfUse: "ONE_TO_TWO",
      alcoholDrugsMoreThan5Drinks: "1",
      friendsJusticeInvolved: "NONE",
      friendsGangMembers: "SOME",
      friendsCommittedCrime: "MOST",
      friendsDrugs: "ALL",
    };
  }

  get checkboxAnswers(): RNACheckboxAnswers {
    // TODO: placeholder answers, replace with results from JII backend
    return {
      alcoholDrugsTimeOfOffense: {
        JUST_ALCOHOL: true,
        JUST_DRUGS: false,
        BOTH: true,
      },
    };
  }

  get lifeAreaAnswers(): RNALifeAreaAnswers {
    // TODO: placeholder answers, replace with results from JII backend
    return {
      lifeAreaBehavior: {
        interest: true,
        interestRating: "5",
        improvementText:
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, etc. etc. Another sentence here.",
      },
      lifeAreaEmployability: {
        interest: true,
        interestRating: "1",
      },
      lifeAreaCustom: {
        customLifeArea: "Some custom text",
        interestRating: "10",
        improvementText: "Additional text here",
      },
    };
  }
}

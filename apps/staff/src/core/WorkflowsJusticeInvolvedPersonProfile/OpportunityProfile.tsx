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

import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { Client } from "../../WorkflowsStore";
import {
  ActiveSentences,
  ClientEmployer,
  ClientHousing,
  ClientProfileDetails,
  Contact,
  FinesAndFees,
  Milestones,
  SpecialConditions,
  Supervision,
  UsNeORASScores,
  UsNeSpecialConditions,
} from "./ClientDetailSidebarComponents";
import { UsUtDates } from "./ClientDetailSidebarComponents/UsUtDates";
import {
  CaseNotes,
  EligibilityDate,
  SentenceDates,
  UsIaActionPlansAndNotes,
  UsIaVictimContactInfo,
  UsMiEarlyDischargeIcDetails,
  UsMiRecommendedSupervisionLevel,
  UsMoIncarceration,
} from "./OpportunityDetailSidebarComponents";
import { OpportunityOverview } from "./OpportunityOverview";
import {
  Incarceration,
  ResidentHousing,
  UsMoRestrictiveHousing,
  UsTnCommonlyUsedOverrideCodes,
} from "./ResidentDetailSidebarComponents";
import { UsAzAcisInformation } from "./ResidentDetailSidebarComponents/US_AZ/UsAzAcisInformation";
import { UsAzDates } from "./ResidentDetailSidebarComponents/US_AZ/UsAzDates";
import { UsIdParoleDates } from "./ResidentDetailSidebarComponents/US_ID/UsIdParoleDates";
import { UsIdPastTwoYearsAlert } from "./ResidentDetailSidebarComponents/US_ID/UsIdPastTwoYearsAlert";
import { UsMiRestrictiveHousing } from "./ResidentDetailSidebarComponents/US_MI/UsMiRestrictiveHousingDetails";
import { Divider } from "./styles";
import { OpportunitySidebarProfileProps } from "./types";

export const ClientDetailSidebarComponents = {
  Supervision,
  Contact,
  ClientHousing,
  FinesAndFees,
  SpecialConditions,
  ClientEmployer,
  Milestones,
  ClientProfileDetails,
  UsUtDates,
  ActiveSentences,
  UsNeORASScores,
  UsNeSpecialConditions,
};

type ClientDetailComponentName = keyof typeof ClientDetailSidebarComponents;

export const OpportunityDetailSidebarComponents = {
  CaseNotes,
  EligibilityDate,
  SentenceDates,
  UsMiEarlyDischargeIcDetails,
  UsMiRecommendedSupervisionLevel,
  UsMoRestrictiveHousing,
  UsTnCommonlyUsedOverrideCodes,
  UsMiRestrictiveHousing,
  UsAzAcisInformation,
  UsIaActionPlansAndNotes,
  UsIaVictimContactInfo,
};

export const ResidentDetailSidebarComponents = {
  Incarceration,
  ResidentHousing,
  UsMoIncarceration,
  UsIdPastTwoYearsAlert,
  UsIdParoleDates,
  UsAzDates,
};

type ResidentDetailComponentName = keyof typeof ResidentDetailSidebarComponents;

export function DetailsSection({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Divider />
    </>
  );
}

const FormViewOnlyComponent = {
  UsTnCommonlyUsedOverrideCodes,
};

type OpportunityDetailComponentName =
  keyof typeof OpportunityDetailSidebarComponents;

export type OpportunityProfileModuleName =
  | ClientDetailComponentName
  | ResidentDetailComponentName
  | OpportunityDetailComponentName;

export const OpportunityProfile: React.FC<OpportunitySidebarProfileProps> =
  observer(function OpportunitySidebarProfile({
    opportunity,
    formLinkButton = false,
    formView = false,
    shouldTrackOpportunityPreviewed = true,
    onDenialButtonClick = () => null,
  }) {
    const {
      workflowsStore: { selectedResident, justiceInvolvedPersonTitle },
    } = useRootStore();

    const selectedPerson = opportunity?.person;

    if (!opportunity || !selectedPerson) {
      return null;
    }

    return (
      <article>
        <OpportunityOverview
          opportunity={opportunity}
          formLinkButton={formLinkButton}
          onDenialButtonClick={onDenialButtonClick}
          justiceInvolvedPersonTitle={justiceInvolvedPersonTitle}
          shouldTrackOpportunityPreviewed={shouldTrackOpportunityPreviewed}
        />

        {opportunity.config.sidebarComponents.map((componentName) => {
          if (componentName in FormViewOnlyComponent && !formView) return null;
          if (
            componentName in ClientDetailSidebarComponents &&
            selectedPerson instanceof Client
          ) {
            const Component =
              ClientDetailSidebarComponents[
                componentName as ClientDetailComponentName
              ];
            return (
              <DetailsSection key={componentName}>
                <Component client={selectedPerson} />
              </DetailsSection>
            );
          }

          if (componentName in ResidentDetailSidebarComponents) {
            if (!selectedResident) return null;
            const Component =
              ResidentDetailSidebarComponents[
                componentName as ResidentDetailComponentName
              ];
            return (
              <DetailsSection key={componentName}>
                <Component
                  resident={selectedResident}
                  opportunity={opportunity}
                />
              </DetailsSection>
            );
          }

          if (componentName in OpportunityDetailSidebarComponents) {
            const Component =
              OpportunityDetailSidebarComponents[
                componentName as OpportunityDetailComponentName
              ];
            return (
              <DetailsSection key={componentName}>
                <Component opportunity={opportunity} />
              </DetailsSection>
            );
          }

          return null;
        })}
      </article>
    );
  });

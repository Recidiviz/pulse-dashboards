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

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import {
  Client,
  JusticeInvolvedPerson,
  Opportunity,
} from "../../WorkflowsStore";
import {
  ClientEmployer,
  ClientHousing,
  ClientProfileDetails,
  Contact,
  FinesAndFees,
  Milestones,
  SpecialConditions,
  Supervision,
} from "./ClientDetailSidebarComponents";
import { Heading } from "./Heading";
import { AccordionSection, AccordionWrapper } from "./OpportunitiesAccordion";
import { OpportunityBanner } from "./OpportunityBanner";
import {
  CaseNotes,
  EligibilityDate,
  UsMiEarlyDischargeIcDetails,
  UsMiRecommendedSupervisionLevel,
  UsMoIncarceration,
} from "./OpportunityDetailSidebarComponents";
import {
  Incarceration,
  ResidentHousing,
  UsMoRestrictiveHousing,
  UsTnCommonlyUsedOverrideCodes,
} from "./ResidentDetailSidebarComponents";
import { UsIdParoleDates } from "./ResidentDetailSidebarComponents/US_ID/UsIdParoleDates";
import { UsIdPastTwoYearsAlert } from "./ResidentDetailSidebarComponents/US_ID/UsIdPastTwoYearsAlert";
import { UsMiRestrictiveHousing } from "./ResidentDetailSidebarComponents/US_MI/UsMiRestrictiveHousingDetails";
import { Divider } from "./styles";

type OpportunitySidebarProfileProps = {
  opportunity?: Opportunity;
  formLinkButton?: boolean;
  formView?: boolean;
  onDenialButtonClick?: () => void;
  selectedPerson: JusticeInvolvedPerson | undefined;
};

export const ClientDetailSidebarComponents = {
  Supervision,
  Contact,
  ClientHousing,
  FinesAndFees,
  SpecialConditions,
  ClientEmployer,
  Milestones,
  ClientProfileDetails,
};

type ClientDetailComponentName = keyof typeof ClientDetailSidebarComponents;

export const OpportunityDetailSidebarComponents = {
  CaseNotes,
  EligibilityDate,
  UsMiEarlyDischargeIcDetails,
  UsMiRecommendedSupervisionLevel,
  UsMoRestrictiveHousing,
  UsTnCommonlyUsedOverrideCodes,
  UsMiRestrictiveHousing,
};

export const ResidentDetailSidebarComponents = {
  Incarceration,
  ResidentHousing,
  UsMoIncarceration,
  UsIdPastTwoYearsAlert,
  UsIdParoleDates,
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
    formLinkButton = false,
    formView = false,
    onDenialButtonClick = () => null,
    opportunity,
    selectedPerson,
  }) {
    const {
      workflowsStore: { selectedResident, justiceInvolvedPersonTitle },
    } = useRootStore();
    const { personSpecificOppBanners } = useFeatureVariants();

    if (!opportunity || !selectedPerson) {
      return null;
    }

    return (
      <article>
        <Heading person={selectedPerson} />
        {personSpecificOppBanners && opportunity.previewBannerText && (
          <OpportunityBanner
            opportunity={opportunity}
            title={justiceInvolvedPersonTitle}
          />
        )}
        <AccordionWrapper allowZeroExpanded preExpanded={[opportunity.type]}>
          <AccordionSection
            opportunity={opportunity}
            formLinkButton={formLinkButton}
            onDenialButtonClick={onDenialButtonClick}
          />
        </AccordionWrapper>
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

/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2023 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { Opportunity } from "../../WorkflowsStore";
import { Divider } from "./common";
import {
  CaseNotes,
  ClientEmployer,
  ClientHousing,
  ClientProfileDetails,
  Contact,
  FinesAndFees,
  Incarceration,
  Milestones,
  ResidentHousing,
  SpecialConditions,
  Supervision,
  UsMiEarlyDischargeIcDetails,
  UsMoIncarceration,
  UsMoRestrictiveHousing,
} from "./Details";
import { Heading } from "./Heading";
import { AccordionSection, AccordionWrapper } from "./OpportunitiesAccordion";
import { OpportunityModule } from "./OpportunityModule";

type OpportunitySidebarProfileProps = {
  opportunity?: Opportunity;
  formLinkButton?: boolean;
  formPrintButton?: boolean;
  onDenialButtonClick?: () => void;
};

const ClientDetailSidebarComponents = {
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

const ResidentDetailSidebarComponents = {
  Incarceration,
  ResidentHousing,
  UsMoIncarceration,
};

type ResidentDetailComponentName = keyof typeof ResidentDetailSidebarComponents;

const OpportunityDetailSidebarComponents = {
  UsMiEarlyDischargeIcDetails,
  CaseNotes,
  UsMoRestrictiveHousing,
};

export function DetailsSection({
  hasDivider,
  children,
}: {
  hasDivider: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {hasDivider && <Divider />}
    </>
  );
}

type OpportunityDetailComponentName =
  keyof typeof OpportunityDetailSidebarComponents;

export type OpportunityProfileModuleName =
  | ClientDetailComponentName
  | ResidentDetailComponentName
  | OpportunityDetailComponentName;

export const OpportunityProfile: React.FC<OpportunitySidebarProfileProps> =
  observer(function OpportunitySidebarProfile({
    formLinkButton = false,
    formPrintButton = false,
    onDenialButtonClick = () => null,
    opportunity,
  }) {
    const {
      workflowsStore: {
        selectedPerson,
        selectedClient,
        selectedResident,
        featureVariants,
      },
    } = useRootStore();

    if (!opportunity || !selectedPerson) {
      return null;
    }
    return (
      <article>
        <Heading person={selectedPerson} />
        {featureVariants.responsiveRevamp ? (
          <AccordionWrapper
            $responsiveRevamp={!!featureVariants.responsiveRevamp}
            allowZeroExpanded
            preExpanded={[opportunity.type]}
          >
            <AccordionSection
              opportunity={opportunity}
              formLinkButton={formLinkButton}
              onDenialButtonClick={onDenialButtonClick}
            />
          </AccordionWrapper>
        ) : (
          <OpportunityModule
            opportunity={opportunity}
            formLinkButton={formLinkButton}
            formDownloadButton={formPrintButton}
          />
        )}
        {opportunity.opportunityProfileModules.map((componentName) => {
          if (componentName in ClientDetailSidebarComponents) {
            if (!selectedClient) return null;
            const Component =
              ClientDetailSidebarComponents[
                componentName as ClientDetailComponentName
              ];
            return (
              <DetailsSection
                key={componentName}
                hasDivider={!!featureVariants.responsiveRevamp}
              >
                <Component client={selectedClient} />
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
              <DetailsSection
                key={componentName}
                hasDivider={!!featureVariants.responsiveRevamp}
              >
                <Component resident={selectedResident} />
              </DetailsSection>
            );
          }

          if (componentName in OpportunityDetailSidebarComponents) {
            const Component =
              OpportunityDetailSidebarComponents[
                componentName as OpportunityDetailComponentName
              ];
            return (
              <DetailsSection
                key={componentName}
                hasDivider={!!featureVariants.responsiveRevamp}
              >
                <Component opportunity={opportunity} />
              </DetailsSection>
            );
          }

          return null;
        })}
      </article>
    );
  });

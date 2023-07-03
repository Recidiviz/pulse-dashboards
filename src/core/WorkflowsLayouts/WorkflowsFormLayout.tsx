// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import { palette, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { FormVariant, OpportunityType } from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { NavigationLayout } from "../NavigationLayout";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { FormEarnedDischarge } from "../Paperwork/US_ID/EarnedDischarge/FormEarnedDischarge";
import { FormSCCP } from "../Paperwork/US_ME/SCCP/FormSCCP";
import RecidivizLogo from "../RecidivizLogo";
import { DASHBOARD_VIEWS } from "../views";
import { OpportunityProfile } from "../WorkflowsClientProfile/OpportunityProfile";
import WorkflowsCompliantReportingForm from "../WorkflowsCompliantReportingForm/WorkflowsCompliantReportingForm";
import WorkflowsEarlyTerminationDeferredForm from "../WorkflowsEarlyTerminationDeferredForm/WorkflowsEarlyTerminationDeferredForm";
import WorkflowsEarlyTerminationForm from "../WorkflowsEarlyTerminationForm/WorkflowsEarlyTerminationForm";
import WorkflowsLSUForm from "../WorkflowsLSUForm";
import WorkflowsUsTnCustodyLevelDowngradeForm from "../WorkflowsUsTnCustodyLevelDowngradeForm";
import WorkflowsUsTnExpirationForm from "../WorkflowsUsTnExpirationForm";

export const FORM_SIDEBAR_WIDTH = 400;

type FormContentsType = `${FormVariant}FormContents` | "formContents";
const PAGE_CONTENT: Record<
  OpportunityType,
  Partial<Record<FormContentsType, any>>
> = {
  compliantReporting: {
    formContents: <WorkflowsCompliantReportingForm />,
  },
  earlyTermination: {
    formContents: <WorkflowsEarlyTerminationForm />,
    deferredFormContents: <WorkflowsEarlyTerminationDeferredForm />,
  },
  earnedDischarge: {
    formContents: <FormEarnedDischarge />,
  },
  LSU: {
    formContents: <WorkflowsLSUForm />,
  },
  pastFTRD: {
    formContents: <div />,
  },
  supervisionLevelDowngrade: {},
  usIdSupervisionLevelDowngrade: {},
  usMiSupervisionLevelDowngrade: {},
  usMiClassificationReview: {},
  usMiEarlyDischarge: {},
  usMeSCCP: {
    formContents: <FormSCCP />,
  },
  usTnExpiration: {
    formContents: <WorkflowsUsTnExpirationForm />,
  },
  usTnCustodyLevelDowngrade: {
    formContents: <WorkflowsUsTnCustodyLevelDowngradeForm />,
  },
  usMoRestrictiveHousingStatusHearing: {
    formContents: <div />,
  },
  usMeEarlyTermination: {},
  usMiMinimumTelephoneReporting: {},
  usMiPastFTRD: {},
};

const Wrapper = styled.div`
  ${typography.Sans16}
  align-items: stretch;
  display: grid;
  grid-template-columns: ${rem(FORM_SIDEBAR_WIDTH)} 1fr;
  position: relative;
  min-height: 100vh;
  width: 100%;

  @media screen and (min-width: ${cssVars.breakpointSm}) {
    padding-right: 0;
  }
`;

const Sidebar = styled.div`
  background: ${palette.marble1};
`;

const SidebarSection = styled.section<{
  responsiveRevamp: boolean;
}>`
  padding: ${({ responsiveRevamp }) =>
    responsiveRevamp
      ? `${rem(spacing.lg)} ${rem(spacing.md)}`
      : rem(spacing.lg)};

  &:first-child {
    border-bottom: 1px solid ${palette.slate20};
  }
`;

const FormWrapper = styled.div``;

export const WorkflowsFormLayout = observer(function WorkflowsFormLayout() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedPerson,
      featureVariants,
    },
  } = useRootStore();

  if (!opportunityType || !selectedPerson) return null;

  const opportunity = selectedPerson.verifiedOpportunities[opportunityType];

  const formVariant = opportunity?.formVariant;
  const formContents: FormContentsType = formVariant
    ? `${formVariant}FormContents`
    : "formContents";

  const hydrated = (
    <Wrapper>
      <Sidebar>
        {featureVariants.responsiveRevamp ? (
          <NavigationLayout isMethodologyExternal isFixed={false} />
        ) : (
          <SidebarSection responsiveRevamp={!!featureVariants.responsiveRevamp}>
            <Link to={`/${DASHBOARD_VIEWS.workflows}`}>
              <RecidivizLogo />
            </Link>
          </SidebarSection>
        )}
        <SidebarSection responsiveRevamp={!!featureVariants.responsiveRevamp}>
          <OpportunityProfile
            opportunity={opportunity}
            formLinkButton={false}
          />
        </SidebarSection>
      </Sidebar>

      <FormWrapper>{PAGE_CONTENT[opportunityType][formContents]}</FormWrapper>
    </Wrapper>
  );

  // TODO(#2684): Replace this with a graceful fallback page
  const empty = <div />;

  return (
    <SelectedPersonOpportunitiesHydrator
      {...{ hydrated, empty, opportunityTypes: [opportunityType] }}
    />
  );
});

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
import { OpportunityType } from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { FormEarnedDischarge } from "../Paperwork/US_ID/EarnedDischarge/FormEarnedDischarge";
import { FormSCCP } from "../Paperwork/US_ME/SCCP/FormSCCP";
import RecidivizLogo from "../RecidivizLogo";
import { PATHWAYS_VIEWS } from "../views";
import { OpportunityProfile } from "../WorkflowsClientProfile/OpportunityProfile";
import WorkflowsCompliantReportingForm from "../WorkflowsCompliantReportingForm/WorkflowsCompliantReportingForm";
import WorkflowsEarlyTerminationForm from "../WorkflowsEarlyTerminationForm/WorkflowsEarlyTerminationForm";
import WorkflowsLSUForm from "../WorkflowsLSUForm";
import WorkflowsUsTnExpirationForm from "../WorkflowsUsTnExpirationForm";

export const FORM_SIDEBAR_WIDTH = 400;

const PAGE_CONTENT: Record<OpportunityType, any> = {
  compliantReporting: {
    formContents: <WorkflowsCompliantReportingForm />,
  },
  earlyTermination: {
    formContents: <WorkflowsEarlyTerminationForm />,
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
  usMoRestrictiveHousingStatusHearing: {
    formContents: <div />,
  },
  usMeEarlyTermination: {},
  usMiMinimumTelephoneReporting: {},
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

const SidebarSection = styled.section`
  padding: ${rem(spacing.lg)};

  &:first-child {
    border-bottom: 1px solid ${palette.slate20};
  }
`;

const SidebarWrapper: React.FC = ({ children }) => {
  return (
    <Sidebar>
      <SidebarSection>
        <Link to={`/${PATHWAYS_VIEWS.workflows}`}>
          <RecidivizLogo />
        </Link>
      </SidebarSection>
      <SidebarSection>{children}</SidebarSection>
    </Sidebar>
  );
};

const FormWrapper = styled.div``;

export const WorkflowsFormLayout = observer(function WorkflowsFormLayout() {
  const {
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedPerson,
    },
  } = useRootStore();

  if (!opportunityType || !selectedPerson) return null;

  const opportunity = selectedPerson.verifiedOpportunities[opportunityType];

  const hydrated = (
    <Wrapper>
      <SidebarWrapper>
        <OpportunityProfile opportunity={opportunity} />
      </SidebarWrapper>
      <FormWrapper>{PAGE_CONTENT[opportunityType].formContents}</FormWrapper>
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

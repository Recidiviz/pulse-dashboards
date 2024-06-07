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

import { palette, spacing, typography } from "@recidiviz/design-system";
import assertNever from "assert-never";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import cssVars from "../CoreConstants.module.scss";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { NavigationBackButton } from "../NavigationBackButton";
import { NavigationLayout } from "../NavigationLayout";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { OpportunityDenialView } from "../OpportunityDenial";
import { OpportunityFormProvider } from "../Paperwork/OpportunityFormContext";
import { FormEarnedDischarge } from "../Paperwork/US_ID/EarnedDischarge/FormEarnedDischarge";
import AnnualClassificationReview from "../Paperwork/US_ME/AnnualReclassificationReview/AnnualReclassificationReview";
import { FormFurloughRelease } from "../Paperwork/US_ME/Furlough/FormFurloughRelease";
import { FormSCCP } from "../Paperwork/US_ME/SCCP/FormSCCP";
import { FormWorkRelease } from "../Paperwork/US_ME/WorkRelease/FormWorkRelease";
import { FormUsMiSCCReview } from "../Paperwork/US_MI/SCCReview/FormUsMiSCCReview";
import { FormUsOrEarnedDischarge } from "../Paperwork/US_OR/EarnedDischarge/FormUsOrEarnedDischarge";
import { FormUsPaAdminSupervision } from "../Paperwork/US_PA/AdminSupervision/FormUsPaAdminSupervision";
import { WORKFLOWS_METHODOLOGY_URL } from "../utils/constants";
import WorkflowsCompliantReportingForm from "../WorkflowsCompliantReportingForm/WorkflowsCompliantReportingForm";
import WorkflowsEarlyTerminationDeferredForm from "../WorkflowsEarlyTerminationDeferredForm/WorkflowsEarlyTerminationDeferredForm";
import WorkflowsEarlyTerminationForm from "../WorkflowsEarlyTerminationForm/WorkflowsEarlyTerminationForm";
import { OpportunityProfile } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunityProfile";
import WorkflowsLSUForm from "../WorkflowsLSUForm";
import WorkflowsUsCaSupervisionLevelDowngradeForm from "../WorkflowsUsCaSupervisionLevelDowngradeForm";
import WorkflowsUsTnCustodyLevelDowngradeForm from "../WorkflowsUsTnCustodyLevelDowngradeForm";
import WorkflowsUsTnExpirationForm from "../WorkflowsUsTnExpirationForm";
import WorkflowsUsTnReclassForm from "../WorkflowsUsTnReclassForm";

export const FORM_SIDEBAR_WIDTH = 400;

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
  padding: ${rem(spacing.lg)} ${rem(spacing.md)};

  &:first-child {
    border-bottom: 1px solid ${palette.slate20};
  }
`;

const BackButtonWrapper = styled.div`
  padding-bottom: ${rem(spacing.lg)};
`;

const FormWrapper = styled.div``;

const FormComponents = {
  WorkflowsCompliantReportingForm,
  WorkflowsEarlyTerminationForm,
  WorkflowsEarlyTerminationDeferredForm,
  FormEarnedDischarge,
  WorkflowsLSUForm,
  FormSCCP,
  FormWorkRelease,
  WorkflowsUsTnExpirationForm,
  WorkflowsUsTnCustodyLevelDowngradeForm,
  WorkflowsUsTnReclassForm,
  WorkflowsUsCaSupervisionLevelDowngradeForm,
  FormFurloughRelease,
  FormUsOrEarnedDischarge,
  FormUsPaAdminSupervision,
  AnnualClassificationReview,
  FormUsMiSCCReview,
};

export type OpportunityFormComponentName = keyof typeof FormComponents;

type FormSidebarView = "OPPORTUNITY" | "DENIAL";

export const WorkflowsFormLayout = observer(function WorkflowsFormLayout() {
  const {
    currentTenantId,
    workflowsStore: {
      selectedOpportunityType: opportunityType,
      selectedPerson,
    },
  } = useRootStore();
  const [currentView, setCurrentView] =
    useState<FormSidebarView>("OPPORTUNITY");
  const navigate = useNavigate();

  const opportunity =
    opportunityType && selectedPerson?.verifiedOpportunities[opportunityType];

  usePersonTracking(selectedPerson, () => {
    opportunity?.form?.trackViewed();
  });

  if (!opportunityType || !selectedPerson) return null;

  const formContents = opportunity?.form?.formContents;

  const FormComponent = formContents && FormComponents[formContents];

  const sidebarContents =
    currentView === "DENIAL" ? (
      <OpportunityDenialView
        opportunity={opportunity}
        onSubmit={() => setCurrentView("OPPORTUNITY")}
      />
    ) : (
      <OpportunityProfile
        opportunity={opportunity}
        formLinkButton={false}
        onDenialButtonClick={() => setCurrentView("DENIAL")}
        formView
      />
    );

  const handleBack = () => {
    if (currentView === "DENIAL") {
      setCurrentView("OPPORTUNITY");
    } else if (currentView === "OPPORTUNITY") {
      navigate(-1);
    } else {
      assertNever(currentView);
    }
  };

  const hydrated = (
    <Wrapper>
      <Sidebar>
        <NavigationLayout
          externalMethodologyUrl={WORKFLOWS_METHODOLOGY_URL[currentTenantId]}
          isFixed={false}
        />
        <SidebarSection>
          <BackButtonWrapper>
            <NavigationBackButton action={{ onClick: handleBack }}>
              Back
            </NavigationBackButton>
          </BackButtonWrapper>
          {sidebarContents}
        </SidebarSection>
      </Sidebar>

      <FormWrapper>
        {FormComponent && (
          <OpportunityFormProvider value={opportunity.form}>
            <FormComponent />
          </OpportunityFormProvider>
        )}
      </FormWrapper>
    </Wrapper>
  );

  const empty = <div />;

  return (
    <SelectedPersonOpportunitiesHydrator
      {...{ hydrated, empty, opportunityTypes: [opportunityType] }}
    />
  );
});

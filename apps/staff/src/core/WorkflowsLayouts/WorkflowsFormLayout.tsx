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

import { spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useNavigate } from "react-router-dom";
import styled from "styled-components/macro";

import { OpportunityType } from "~datatypes";
import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import cssVars from "../CoreConstants.module.scss";
import { usePersonTracking } from "../hooks/usePersonTracking";
import { NavigationBackButton } from "../NavigationBackButton";
import { NavigationLayout } from "../NavigationLayout";
import { SelectedPersonOpportunitiesHydrator } from "../OpportunitiesHydrator";
import { OpportunityPreviewPanel } from "../OpportunityCaseloadView/OpportunityPreviewPanel";
import { OpportunityFormProvider } from "../Paperwork/OpportunityFormContext";
import { FormUsIaEarlyDischargeParole } from "../Paperwork/US_IA/EarlyDischarge/FormUsIaEarlyDischargeParole";
import { FormUsIaEarlyDischargeProbation } from "../Paperwork/US_IA/EarlyDischarge/FormUsIaEarlyDischargeProbation";
import { FormEarnedDischarge } from "../Paperwork/US_ID/EarnedDischarge/FormEarnedDischarge";
import AnnualClassificationReview from "../Paperwork/US_ME/AnnualReclassificationReview/AnnualReclassificationReview";
import { FormFurloughRelease } from "../Paperwork/US_ME/Furlough/FormFurloughRelease";
import MediumTrustee from "../Paperwork/US_ME/MediumTrustee/MediumTrustee";
import { FormSCCP } from "../Paperwork/US_ME/SCCP/FormSCCP";
import { FormWorkRelease } from "../Paperwork/US_ME/WorkRelease/FormWorkRelease";
import { FormUsMiSCCReview } from "../Paperwork/US_MI/SCCReview/FormUsMiSCCReview";
import { FormUsPaAdminSupervision } from "../Paperwork/US_PA/AdminSupervision/FormUsPaAdminSupervision";
import { WorkflowsFormUsTnSuspensionOfDirectSupervision } from "../Paperwork/US_TN/SuspensionOfDirectSupervision/WorkflowsFormUsTnSuspensionOfDirectSupervision";
import WorkflowsCompliantReportingForm from "../WorkflowsCompliantReportingForm/WorkflowsCompliantReportingForm";
import WorkflowsEarlyTerminationDeferredForm from "../WorkflowsEarlyTerminationDeferredForm/WorkflowsEarlyTerminationDeferredForm";
import WorkflowsEarlyTerminationForm from "../WorkflowsEarlyTerminationForm/WorkflowsEarlyTerminationForm";
import { useOpportunitySidePanel } from "../WorkflowsJusticeInvolvedPersonProfile/OpportunitySidePanelContext";
import WorkflowsLSUForm from "../WorkflowsLSUForm";
import WorkflowsUsAzReleaseToTransitionProgramForm from "../WorkflowsUsAzReleaseToTransitionProgramForm";
import WorkflowsUsCaSupervisionLevelDowngradeForm from "../WorkflowsUsCaSupervisionLevelDowngradeForm";
import WorkflowsUsCaSupervisionLevelDowngradeForm3043 from "../WorkflowsUsCaSupervisionLevelDowngradeForm3043";
import WorkflowsUsNeSupervisionDowngradeForm from "../WorkflowsUsNeSupervisionDowngradeForm";
import WorkflowsUsTnExpirationForm from "../WorkflowsUsTnExpirationForm";
import WorkflowsUsTnReclassForm from "../WorkflowsUsTnReclassForm";
import WorkflowsUsTxAnnualReportStatusForm from "../WorkflowsUsTxAnnualReportStatusForm";
import WorkflowsUsTxEarlyReleaseFromSupervisionForm from "../WorkflowsUsTxEarlyReleaseFromSupervisionForm";

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

// TODO(#6017): In order for the FormLayout to integrate with insights and the
// supervisor homepage, we'll need to update the form components themselves to
// take a JusticeInvolvedPerson parameter. This has already been done for US_ID forms.
const FormComponents = {
  WorkflowsCompliantReportingForm,
  WorkflowsEarlyTerminationForm,
  WorkflowsEarlyTerminationDeferredForm,
  FormEarnedDischarge,
  WorkflowsLSUForm,
  FormSCCP,
  FormWorkRelease,
  WorkflowsUsTnExpirationForm,
  WorkflowsUsTnReclassForm,
  WorkflowsUsCaSupervisionLevelDowngradeForm,
  WorkflowsUsCaSupervisionLevelDowngradeForm3043,
  FormFurloughRelease,
  FormUsPaAdminSupervision,
  FormUsIaEarlyDischargeParole,
  FormUsIaEarlyDischargeProbation,
  AnnualClassificationReview,
  FormUsMiSCCReview,
  MediumTrustee,
  WorkflowsUsAzReleaseToTransitionProgramForm,
  WorkflowsFormUsTnSuspensionOfDirectSupervision,
  WorkflowsUsNeSupervisionDowngradeForm,
  WorkflowsUsTxAnnualReportStatusForm,
  WorkflowsUsTxEarlyReleaseFromSupervisionForm,
};

export type OpportunityFormComponentName = keyof typeof FormComponents;

/**
 * A wrapper for the FormLayout that's used from workflows views - access to
 * state fields in the store is consolidated here and passed into the layout component.
 */
export const WorkflowsFormLayoutWrapper = observer(
  function WorkflowsFormLayoutWrapper() {
    const {
      workflowsStore: {
        selectedOpportunity,
        selectedPerson,
        selectedOpportunityType,
      },
    } = useRootStore();
    if (!selectedPerson || !selectedOpportunityType) return null;
    return (
      <WorkflowsFormLayout
        opportunity={selectedOpportunity}
        selectedPerson={selectedPerson}
        opportunityType={selectedOpportunityType}
      />
    );
  },
);

/**
 * Interactive form layout UI for a given person and opportunity; this UI is shared
 * between workflows and the supervisor homepage.
 *
 * ***Note*** Because of the shared nature of this layout, it's best to keep necessary
 * data or state as parameters that are passed in, rather than pulling stateful info
 * from a store within the component itself.
 */
const HydratedWorkflowsFormLayout = observer(
  function HydratedWorkflowsFormLayout({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    const { currentView, setCurrentView } = useOpportunitySidePanel();
    const navigate = useNavigate();
    const selectedPerson = opportunity.person;

    usePersonTracking(selectedPerson, () => {
      opportunity.form?.trackViewed();
    });

    const {
      tenantStore: { workflowsMethodologyUrl },
    } = useRootStore();

    const formContents = opportunity.form?.formContents;

    const FormComponent = formContents && FormComponents[formContents];

    const handleBack = () => {
      if (currentView === "OPPORTUNITY_PREVIEW") {
        navigate(-1);
      } else {
        setCurrentView("OPPORTUNITY_PREVIEW");
      }
    };

    return (
      <Wrapper>
        <Sidebar>
          <NavigationLayout
            externalMethodologyUrl={workflowsMethodologyUrl}
            isFixed={false}
          />
          <SidebarSection>
            <BackButtonWrapper>
              <NavigationBackButton action={{ onClick: handleBack }}>
                Back
              </NavigationBackButton>
            </BackButtonWrapper>
            <OpportunityPreviewPanel
              opportunity={opportunity}
              selectedPerson={selectedPerson}
              isFormView
            />
          </SidebarSection>
        </Sidebar>

        <FormWrapper>
          {FormComponent && (
            <OpportunityFormProvider value={opportunity.form}>
              <FormComponent opportunity={opportunity} />
            </OpportunityFormProvider>
          )}
        </FormWrapper>
      </Wrapper>
    );
  },
);

/*
 * opportunityType and selectedPerson can both be derived from the opportunity, but
 * need to be passed separately so that the Hydrator can work if the opportunity isn't
 * loaded yet.
 */
export const WorkflowsFormLayout = observer(function WorkflowsFormLayout({
  opportunity,
  selectedPerson,
  opportunityType,
}: {
  opportunity: Opportunity | undefined;
  selectedPerson: JusticeInvolvedPerson;
  opportunityType: OpportunityType;
}) {
  if (opportunity) {
    if (opportunity.type !== opportunityType)
      throw new Error("WorkflowsFormLayout: opportunity types don't match");
    if (opportunity.person !== selectedPerson)
      throw new Error("WorkflowsFormLayout: people don't match");
  }

  const empty = <div />;

  return (
    <SelectedPersonOpportunitiesHydrator
      {...{
        hydrated: opportunity && (
          <HydratedWorkflowsFormLayout opportunity={opportunity} />
        ),
        empty,
        opportunityTypes: [opportunityType],
        person: selectedPerson,
      }}
    />
  );
});

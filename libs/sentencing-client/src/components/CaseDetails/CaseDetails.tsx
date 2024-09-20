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
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { Hydrator } from "~hydration-utils";

import { PSIStore } from "../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../presenters/CaseDetailsPresenter";
import { psiUrl } from "../../utils/routing";
import { ErrorMessage } from "../Error";
import { CaseAttributes } from "./CaseAttributes";
import * as Styled from "./CaseDetails.styles";
import { CaseOnboarding } from "./CaseOnboarding/CaseOnboarding";
import { OnboardingTopic } from "./CaseOnboarding/types";
import EditCaseDetailsModal from "./EditCaseDetailsModal";
import { Insights } from "./Insights/Insights";
import { Opportunities } from "./Opportunities/Opportunities";
import { Recommendations } from "./Recommendations/Recommendations";
import { MutableCaseAttributes, RecommendationType } from "./types";

const CaseDetailsWithPresenter = observer(function CaseDetailsWithPresenter({
  presenter,
}: {
  presenter: CaseDetailsPresenter;
}) {
  const navigate = useNavigate();
  const {
    staffPseudoId,
    caseId,
    caseAttributes,
    form,
    communityOpportunities,
    recommendedOpportunities,
    updateAttributes,
    updateRecommendation,
    updateCaseStatusToCompleted,
    updateRecommendedOpportunities,
    trackCaseDetailsPageViewed,
    trackOnboardingPageViewed,
    trackEditCaseDetailsClicked,
    trackOpportunityModalOpened,
    trackAddOpportunityToRecommendationClicked,
    trackRemoveOpportunityFromRecommendationClicked,
    trackRecommendedDispositionChanged,
    trackCreateOrUpdateRecommendationClicked,
    trackCopySummaryToClipboardClicked,
    trackDownloadReportClicked,
    trackCaseStatusCompleteClicked,
  } = presenter;

  const firstName = caseAttributes.client?.fullName?.split(" ")[0];

  const [selectedRecommendation, setSelectedRecommendation] = useState(
    caseAttributes.selectedRecommendation ?? RecommendationType.Probation,
  );
  const [showEditCaseDetailsModal, setShowEditCaseDetailsModal] =
    useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const openEditCaseDetailsModal = () => setShowEditCaseDetailsModal(true);
  const hideEditCaseDetailsModal = () => setShowEditCaseDetailsModal(false);

  const handleRecommendationUpdate = (recommendation: RecommendationType) => {
    trackRecommendedDispositionChanged(recommendation);
    setSelectedRecommendation(recommendation);
  };

  const saveRecommendation = () => {
    if (selectedRecommendation) {
      updateRecommendation(selectedRecommendation);
    }
  };

  const saveAttributes = (
    options?: { showToast?: boolean },
    attributes?: MutableCaseAttributes,
    mergeUpdates?: boolean,
  ) => {
    updateAttributes(caseId, attributes, mergeUpdates);
    if (options?.showToast) {
      toast(() => <span>Case details updated</span>, {
        duration: 3000,
      });
    }
  };

  const navigateToDashboard = () =>
    staffPseudoId &&
    navigate(
      psiUrl("dashboard", {
        staffPseudoId,
      }),
    );

  if (initialPageLoad) {
    trackCaseDetailsPageViewed();
    setInitialPageLoad(false);
  }

  if (!staffPseudoId) {
    return <Styled.PageContainer>No staff ID found.</Styled.PageContainer>;
  }

  return (
    <Styled.PageContainer>
      {/* Case Onboarding */}
      {caseAttributes.currentOnboardingTopic !== OnboardingTopic.Done ? (
        <CaseOnboarding
          form={form}
          firstName={firstName}
          lastTopic={caseAttributes.currentOnboardingTopic}
          saveAttributes={saveAttributes}
          navigateToDashboard={navigateToDashboard}
          analytics={{ trackOnboardingPageViewed }}
        />
      ) : (
        <>
          <Styled.BackLink
            leftMargin={16}
            onClick={navigateToDashboard}
          >{`Back to Dashboard`}</Styled.BackLink>

          {/* Case Attributes */}
          <CaseAttributes
            caseAttributes={caseAttributes}
            openEditCaseDetailsModal={openEditCaseDetailsModal}
            analytics={{ trackEditCaseDetailsClicked }}
          />
          <Styled.Body>
            <Styled.InsightsOpportunitiesWrapper>
              {/* Insights */}
              <Insights
                insight={caseAttributes.insight}
                selectedRecommendation={selectedRecommendation}
                fullName={caseAttributes.client?.fullName}
                openEditCaseDetailsModal={openEditCaseDetailsModal}
                lsirScore={caseAttributes.lsirScore}
              />
              {/* Opportunities */}
              <Opportunities
                firstName={firstName}
                selectedRecommendation={selectedRecommendation}
                communityOpportunities={communityOpportunities}
                recommendedOpportunities={recommendedOpportunities}
                updateRecommendedOpportunities={updateRecommendedOpportunities}
                caseAttributes={caseAttributes}
                analytics={{
                  trackOpportunityModalOpened,
                  trackAddOpportunityToRecommendationClicked,
                  trackRemoveOpportunityFromRecommendationClicked,
                }}
              />
            </Styled.InsightsOpportunitiesWrapper>
            {/* Recommendations */}
            <Recommendations
              firstName={firstName}
              externalId={caseAttributes.externalId}
              fullName={caseAttributes.client?.fullName}
              insight={caseAttributes.insight}
              selectedRecommendation={selectedRecommendation}
              needs={caseAttributes.needsToBeAddressed}
              gender={caseAttributes.client?.gender}
              handleRecommendationUpdate={handleRecommendationUpdate}
              saveRecommendation={saveRecommendation}
              recommendedOpportunities={recommendedOpportunities}
              lastSavedRecommendation={caseAttributes.selectedRecommendation}
              setCaseStatusCompleted={updateCaseStatusToCompleted}
              analytics={{
                trackCreateOrUpdateRecommendationClicked,
                trackCopySummaryToClipboardClicked,
                trackDownloadReportClicked,
                trackCaseStatusCompleteClicked,
              }}
            />
          </Styled.Body>

          {/* Edit Case Details Modal */}
          {form && (
            <EditCaseDetailsModal
              firstName={firstName}
              form={form}
              hideModal={hideEditCaseDetailsModal}
              isOpen={showEditCaseDetailsModal}
              saveAttributes={saveAttributes}
            />
          )}
        </>
      )}
    </Styled.PageContainer>
  );
});

export const CaseDetails: React.FC<{
  psiStore: PSIStore;
}> = observer(function CaseDetails({ psiStore }) {
  const { caseStore } = psiStore;
  const params = useParams();

  if (!params["caseId"]) {
    return <Styled.PageContainer>No case ID found.</Styled.PageContainer>;
  }

  const presenter = new CaseDetailsPresenter(caseStore, params["caseId"]);

  return (
    <Hydrator hydratable={presenter} failed={<ErrorMessage />}>
      <CaseDetailsWithPresenter presenter={presenter} />
    </Hydrator>
  );
});

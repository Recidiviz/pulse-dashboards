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
import { StoreProvider } from "../StoreProvider/StoreProvider";
import { CaseAttributes } from "./CaseAttributes";
import * as Styled from "./CaseDetails.styles";
import { CaseOnboarding } from "./CaseOnboarding/CaseOnboarding";
import { OnboardingTopic } from "./CaseOnboarding/types";
import EditCaseDetailsModal from "./EditCaseDetailsModal";
import { Insights } from "./Insights/Insights";
import { Opportunities } from "./Opportunities/Opportunities";
import Recommendations from "./Recommendations/Recommendations";
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
    stateCode,
    caseAttributes,
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

  const firstName = caseAttributes?.client?.firstName;
  const lastName = caseAttributes?.client?.lastName;

  const [selectedRecommendation, setSelectedRecommendation] = useState(
    caseAttributes.selectedRecommendation,
  );
  const [showEditCaseDetailsModal, setShowEditCaseDetailsModal] =
    useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(true);

  const openEditCaseDetailsModal = () => setShowEditCaseDetailsModal(true);
  const hideEditCaseDetailsModal = () => setShowEditCaseDetailsModal(false);

  const handleRecommendationUpdate = (
    recommendation: RecommendationType | string,
  ) => {
    trackRecommendedDispositionChanged(recommendation);
    setSelectedRecommendation(recommendation);
  };

  const saveRecommendation = () => {
    if (selectedRecommendation) {
      updateRecommendation(selectedRecommendation);
    }
  };

  const saveAttributes = (
    attributes?: MutableCaseAttributes,
    options?: { showToast?: boolean },
  ) => {
    updateAttributes(caseId, attributes);
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
                stateCode={stateCode}
                analytics={{
                  trackOpportunityModalOpened,
                  trackAddOpportunityToRecommendationClicked,
                  trackRemoveOpportunityFromRecommendationClicked,
                }}
              />
              {/* Footer Disclaimer */}
              <Styled.DisclaimerWrapper>
                <span style={{ fontWeight: 800 }}>DISCLAIMER</span> This tool is
                for informational purposes only. Recidiviz does not guarantee
                the accuracy, completeness, validity, timeliness, or suitability
                of the information in this tool and is not liable for any
                errors, omissions, or consequences of using the information. The
                information is not legal advice. Data on past conduct is not a
                guarantee of future outcomes. Users are solely responsible for
                their use of the information and agree that Recidiviz is not
                liable for any claim, loss, or damage arising from the use of
                this tool.
              </Styled.DisclaimerWrapper>
            </Styled.InsightsOpportunitiesWrapper>
            {/* Recommendations */}
            <Recommendations
              firstName={firstName}
              lastName={lastName}
              age={caseAttributes.age}
              stateCode={stateCode}
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
          <EditCaseDetailsModal
            firstName={firstName}
            hideModal={hideEditCaseDetailsModal}
            isOpen={showEditCaseDetailsModal}
            saveAttributes={saveAttributes}
          />
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
      <StoreProvider store={psiStore}>
        <CaseDetailsWithPresenter presenter={presenter} />
      </StoreProvider>
    </Hydrator>
  );
});

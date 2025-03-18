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

import { PSIStore } from "../../datastores/PSIStore";
import { CaseDetailsPresenter } from "../../presenters/CaseDetailsPresenter";
import { psiUrl } from "../../utils/routing";
import { pluralizeDuplicates } from "../../utils/utils";
import { PageHydrator } from "../PageHydrator/PageHydrator";
import { StoreProvider } from "../StoreProvider/StoreProvider";
import { CaseAttributes } from "./CaseAttributes";
import * as Styled from "./CaseDetails.styles";
import { CaseOnboarding } from "./CaseOnboarding/CaseOnboarding";
import { OnboardingTopic } from "./CaseOnboarding/types";
import EditCaseDetailsModal from "./EditCaseDetailsModal";
import { Insights } from "./Insights/Insights";
import { Opportunities } from "./Opportunities/Opportunities";
import Recommendations from "./Recommendations/Recommendations";
import SummaryReport from "./Recommendations/SummaryReport";
import { MutableCaseAttributes } from "./types";

const CaseDetailsWithPresenter = observer(function CaseDetailsWithPresenter({
  presenter,
}: {
  presenter: CaseDetailsPresenter;
}) {
  const navigate = useNavigate();
  const {
    staffPseudoId,
    caseAttributes,
    activeEligibleCommunityOpportunities,
    recommendedOpportunities,
    geoConfig,
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
  const savedSummary = caseAttributes?.recommendationSummary;

  const [selectedRecommendation, setSelectedRecommendation] = useState(
    caseAttributes.selectedRecommendation,
  );
  const [showEditCaseDetailsModal, setShowEditCaseDetailsModal] =
    useState(false);
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [initialPageLoad, setInitialPageLoad] = useState(true);
  const [isCreatingRecommendation, setIsCreatingRecommendation] = useState(
    !caseAttributes.selectedRecommendation,
  );

  const opportunityDescriptions = recommendedOpportunities
    ?.map((opp) => opp.genericDescription)
    .filter((desc) => desc) as string[] | undefined;

  const openEditCaseDetailsModal = () => {
    setShowEditCaseDetailsModal(true);
    trackEditCaseDetailsClicked();
  };
  const hideEditCaseDetailsModal = () => setShowEditCaseDetailsModal(false);
  const openSummaryReport = () => setShowSummaryReport(true);
  const hideSummaryReport = () => setShowSummaryReport(false);

  const handleRecommendationUpdate = (recommendation: string) => {
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
    updateAttributes(attributes);
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
                geoConfig={geoConfig}
              />
              {/* Opportunities */}
              <Opportunities
                firstName={firstName}
                selectedRecommendation={selectedRecommendation}
                communityOpportunities={activeEligibleCommunityOpportunities}
                recommendedOpportunities={recommendedOpportunities}
                updateRecommendedOpportunities={updateRecommendedOpportunities}
                caseAttributes={caseAttributes}
                geoConfig={geoConfig}
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
              geoConfig={geoConfig}
              firstName={firstName}
              insight={caseAttributes.insight}
              selectedRecommendation={selectedRecommendation}
              handleRecommendationUpdate={handleRecommendationUpdate}
              saveRecommendation={saveRecommendation}
              recommendedOpportunities={recommendedOpportunities}
              lastSavedRecommendation={caseAttributes.selectedRecommendation}
              analytics={{
                trackCreateOrUpdateRecommendationClicked,
                trackCopySummaryToClipboardClicked,
                trackDownloadReportClicked,
                trackCaseStatusCompleteClicked,
              }}
              openSummaryReport={openSummaryReport}
              isCreatingRecommendation={isCreatingRecommendation}
              setIsCreatingRecommendation={setIsCreatingRecommendation}
            />
          </Styled.Body>

          {showSummaryReport && (
            <SummaryReport
              fullName={caseAttributes.client?.fullName}
              firstName={firstName}
              lastName={lastName}
              geoConfig={geoConfig}
              age={caseAttributes.age}
              insight={caseAttributes.insight}
              externalId={caseAttributes.externalId}
              selectedRecommendation={selectedRecommendation}
              opportunityDescriptions={pluralizeDuplicates(
                opportunityDescriptions ?? [],
              )}
              needs={caseAttributes.needsToBeAddressed}
              protectiveFactors={caseAttributes.protectiveFactors}
              gender={caseAttributes.client?.gender}
              savedSummary={savedSummary}
              hideSummaryReport={hideSummaryReport}
              setCaseStatusCompleted={updateCaseStatusToCompleted}
              isCreatingRecommendation={isCreatingRecommendation}
              updateAttributes={updateAttributes}
              analytics={{
                trackCopySummaryToClipboardClicked,
                trackDownloadReportClicked,
                trackCaseStatusCompleteClicked,
              }}
            />
          )}
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
    <PageHydrator hydratable={presenter}>
      <StoreProvider store={psiStore}>
        <CaseDetailsWithPresenter presenter={presenter} />
      </StoreProvider>
    </PageHydrator>
  );
});

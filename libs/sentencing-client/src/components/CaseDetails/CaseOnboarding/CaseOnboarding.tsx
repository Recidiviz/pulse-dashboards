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

import { Case } from "../../../api";
import { formatPossessiveName } from "../../../utils/utils";
import { CaseStatus } from "../../Dashboard/types";
import * as Styled from "../CaseDetails.styles";
import { form } from "../Form/FormStore";
import OnboardingStepFour from "./OnboardingStepFour";
import OnboardingStepOne from "./OnboardingStepOne";
import OnboardingStepThree from "./OnboardingStepThree";
import OnboardingStepTwo from "./OnboardingStepTwo";
import { CaseOnboardingProps, OnboardingTopic } from "./types";

const onboardingTopics: Case["currentOnboardingTopic"][] = [
  OnboardingTopic.OffenseLsirScore,
  OnboardingTopic.PrimaryNeeds,
  OnboardingTopic.ProtectiveFactors,
  OnboardingTopic.AdditionalNeeds,
  OnboardingTopic.Done,
];

export const CaseOnboarding: React.FC<CaseOnboardingProps> = observer(
  function CaseOnboarding({
    firstName,
    lastTopic,
    saveAttributes,
    navigateToDashboard,
    analytics,
  }) {
    const { trackOnboardingPageViewed } = analytics;
    const [currentTopicIndex, setCurrentTopicIndex] = useState(
      lastTopic ? onboardingTopics.indexOf(lastTopic) : 0,
    );

    const currentTopic: Case["currentOnboardingTopic"] | undefined =
      onboardingTopics[currentTopicIndex];
    const hasCompletedOnboarding =
      currentTopicIndex === onboardingTopics.length - 1;
    const isNextButtonDisabled = form.hasError;

    const goToPrevTopic = () => {
      if (currentTopicIndex === 0) {
        navigateToDashboard();
        form.resetUpdates();
      } else {
        saveAttributes(form.updates);
      }
      currentTopic && trackOnboardingPageViewed(currentTopic, "back");
      setCurrentTopicIndex((prev) => prev - 1);
    };

    const goToNextTopic = () => {
      saveAttributes(form.updates);
      const nextTopic = onboardingTopics[currentTopicIndex + 1];
      const willCompleteOnboarding = nextTopic === OnboardingTopic.Done;
      const currentTopicProgressUpdate = {
        currentOnboardingTopic: willCompleteOnboarding
          ? OnboardingTopic.Done
          : nextTopic,
        // Set the case status to "In Progress" after completing the first onboarding topic
        ...(nextTopic === OnboardingTopic.PrimaryNeeds
          ? { status: CaseStatus.InProgress }
          : {}),
      };
      currentTopic && trackOnboardingPageViewed(currentTopic, "next");
      setCurrentTopicIndex((prev) => prev + 1);

      if (willCompleteOnboarding) {
        // TODO(Recidiviz/recidiviz-data#31435): Instead of an artificial timeout, figure out a way to wait for the response of the update.
        setTimeout(() => {
          saveAttributes(currentTopicProgressUpdate);
        }, 2500);
      } else {
        saveAttributes(currentTopicProgressUpdate);
      }
    };

    return (
      <Styled.FullPageContainer>
        <Styled.OnboardingProgressBar topic={currentTopic} />
        <Styled.OnboardingContainer>
          {!hasCompletedOnboarding ? (
            <>
              {currentTopic === OnboardingTopic.OffenseLsirScore && (
                <OnboardingStepOne firstName={firstName} />
              )}
              {currentTopic === OnboardingTopic.PrimaryNeeds && (
                <OnboardingStepTwo firstName={firstName} />
              )}
              {currentTopic === OnboardingTopic.ProtectiveFactors && (
                <OnboardingStepThree firstName={firstName} />
              )}
              {currentTopic === OnboardingTopic.AdditionalNeeds && (
                <OnboardingStepFour firstName={firstName} />
              )}
              <Styled.ButtonWrapper>
                <Styled.ActionButton kind="link" onClick={goToPrevTopic}>
                  Back
                </Styled.ActionButton>
                <Styled.ActionButton
                  onClick={goToNextTopic}
                  disabled={isNextButtonDisabled}
                >
                  Next
                </Styled.ActionButton>
              </Styled.ButtonWrapper>
            </>
          ) : (
            <Styled.OnboardingCompleteLoading>
              <Styled.OnboardingCompleteMessage>
                Pulling in all of {formatPossessiveName(firstName)} case details
                to find the best opportunities and insights
              </Styled.OnboardingCompleteMessage>
              <span>Loading...</span>
            </Styled.OnboardingCompleteLoading>
          )}
        </Styled.OnboardingContainer>
      </Styled.FullPageContainer>
    );
  },
);

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
import { CaseStatus } from "../../Dashboard/types";
import * as Styled from "../CaseDetails.styles";
import { OnboardingAdditionalNeeds } from "./OnboardingAdditionalNeeds";
import { OnboardingOffenseLsirScore } from "./OnboardingOffenseLsirScore";
import { OnboardingPrimaryNeeds } from "./OnboardingPrimaryNeeds";
import { CaseOnboardingProps, OnboardingTopic } from "./types";

const onboardingTopics: Case["currentOnboardingTopic"][] = [
  OnboardingTopic.OffenseLsirScore,
  OnboardingTopic.PrimaryNeeds,
  OnboardingTopic.AdditionalNeeds,
  OnboardingTopic.Done,
];

export const CaseOnboarding: React.FC<CaseOnboardingProps> = observer(
  function CaseOnboarding({
    form,
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

    if (!form) return;

    const currentTopic: Case["currentOnboardingTopic"] | undefined =
      onboardingTopics[currentTopicIndex];
    const hasCompletedOnboarding =
      currentTopicIndex === onboardingTopics.length;
    const isNextButtonDisabled =
      currentTopic === OnboardingTopic.OffenseLsirScore &&
      (form.hasError || !form.getFormValue("offense"));

    const goToPrevTopic = () => {
      if (currentTopicIndex === 0) {
        navigateToDashboard();
      }
      currentTopic && trackOnboardingPageViewed(currentTopic, "back");
      setCurrentTopicIndex((prev) => prev - 1);
    };

    const goToNextTopic = () => {
      const nextTopic = onboardingTopics[currentTopicIndex + 1];
      const willCompleteOnboarding = !nextTopic;
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
          saveAttributes(undefined, currentTopicProgressUpdate, true);
        }, 2500);
      } else {
        saveAttributes(undefined, currentTopicProgressUpdate, true);
      }
    };

    return (
      <Styled.FullPageContainer>
        <Styled.OnboardingProgressBar topic={currentTopic} />
        <Styled.OnboardingContainer>
          {!hasCompletedOnboarding ? (
            <>
              {currentTopic === OnboardingTopic.OffenseLsirScore && (
                <OnboardingOffenseLsirScore form={form} firstName={firstName} />
              )}
              {currentTopic === OnboardingTopic.PrimaryNeeds && (
                <OnboardingPrimaryNeeds form={form} firstName={firstName} />
              )}
              {currentTopic === OnboardingTopic.AdditionalNeeds && (
                <OnboardingAdditionalNeeds form={form} firstName={firstName} />
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
                Pulling in all of {firstName}&apos;s case details to find the
                best opportunities and insights
              </Styled.OnboardingCompleteMessage>
              <span>Loading...</span>
            </Styled.OnboardingCompleteLoading>
          )}
        </Styled.OnboardingContainer>
      </Styled.FullPageContainer>
    );
  },
);

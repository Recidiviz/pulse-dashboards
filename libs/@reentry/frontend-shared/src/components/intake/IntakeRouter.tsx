// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

"use client";

import { Loading } from "@recidiviz/design-system";
import { useEffect, useState } from "react";

import {
  getInitialStep,
  getIntakeTenantConfig,
} from "../../configs/tenantConfig";
import type { PreIntakeStep } from "../../configs/types";
import { hasVideo, isPreIntakeStep } from "../../configs/types";
import { useSocket } from "../../websockets/IntakeSocketContext";
import AddressForm from "./AddressForm";
import { ChatHeader } from "./ChatInterface/ChatHeader";
import ConversationLayout from "./ChatInterface/ConversationLayout";
import IntakeCompleted from "./IntakeCompleted";
import IntakeSurvey from "./IntakeSurvey";
import { LockedInterstitial } from "./LockedInterstitial";
import {
  PreIntakeNoteOne,
  PreIntakeNoteTwo,
  PreIntakeVideo,
} from "./PreIntakeNote";

export function IntakeRouter() {
  const { intakeContext, intakeDispatchContext } = useSocket();
  const {
    intakeStatus,
    currentSection,
    conversationStarted,
    has_accepted_terms,
    has_address,
    has_survey,
    intakeId,
    isLocked,
  } = intakeContext;
  const { startConversation } = intakeDispatchContext;
  const tenantConfig = getIntakeTenantConfig(intakeContext.client_state);
  const stepStorageKey = `preIntakeStep:${intakeContext.client_state ?? "default"}`;
  const [preIntakeStep, setPreIntakeStep] = useState<PreIntakeStep>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(stepStorageKey);
      if (isPreIntakeStep(saved)) return saved;
    }
    return getInitialStep(tenantConfig);
  });
  const [displaySurvey, setDisplaySurvey] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(has_survey);

  // Updated completion logic to check for address collection
  const isCompleted = intakeStatus === "completed";
  const needsAddress =
    intakeStatus === "in_progress" &&
    currentSection === "Completion" &&
    !has_address;
  const isPreIntake =
    (intakeStatus === "in_progress" || intakeStatus === "created") &&
    !conversationStarted &&
    !needsAddress &&
    !isCompleted;
  const isClientStateInitialized = !!intakeContext.client_state;
  const isConversationInProgress =
    (intakeStatus === "in_progress" || intakeStatus === "created") &&
    conversationStarted &&
    !needsAddress &&
    !isCompleted;

  /**
   * Re-sync step when client_state loads asynchronously — the useState
   * initializer only runs once (with client_state=null → default text flow),
   * so we need to reset to the correct initial step for the actual tenant.
   */
  useEffect(() => {
    if (!isClientStateInitialized) return;
    const saved = sessionStorage.getItem(stepStorageKey);
    if (isPreIntakeStep(saved)) {
      setPreIntakeStep(saved);
    } else {
      setPreIntakeStep(getInitialStep(tenantConfig));
    }
  }, [isClientStateInitialized, stepStorageKey, tenantConfig]);

  /** Save step to sessionStorage only on intentional user navigation. */
  const goToStep = (step: PreIntakeStep) => {
    setPreIntakeStep(step);
    if (typeof window !== "undefined" && intakeContext.client_state) {
      sessionStorage.setItem(stepStorageKey, step);
    }
  };

  const handleStartConversation = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(stepStorageKey);
    }
    startConversation();
  };
  // Auto-start conversation if it's already underway
  useEffect(() => {
    if (
      intakeStatus === "in_progress" &&
      has_accepted_terms &&
      !conversationStarted &&
      !isCompleted // Don't auto-start if completed
    ) {
      startConversation();
    }
  }, [
    intakeStatus,
    has_accepted_terms,
    conversationStarted,
    startConversation,
    isCompleted,
  ]);

  useEffect(() => {
    const checkDisplaySurvey =
      has_address && intakeStatus === "completed" && !has_survey;
    setDisplaySurvey(checkDisplaySurvey);
  }, [has_address, intakeStatus, has_survey]);

  const shouldRenderHeader = !isConversationInProgress;

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50">
      {isLocked && <LockedInterstitial />}
      {shouldRenderHeader && (
        <div className="relative max-w-full overflow-x-hidden flex-shrink-0">
          <ChatHeader />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto">
        {((isCompleted && surveySubmitted) || (isCompleted && has_survey)) && (
          <IntakeCompleted />
        )}

        {needsAddress && !displaySurvey && intakeId && (
          <AddressForm
            setDisplaySurvey={setDisplaySurvey}
            onError={(error) => {
              console.error("Address submission error:", error);
              // Could add toast notification here
              // TODO : prevent displaying survey and handle error in place.
            }}
            intakeId={intakeId}
          />
        )}
        {displaySurvey && !surveySubmitted && intakeId && (
          <IntakeSurvey
            setSurveySubmitted={setSurveySubmitted}
            intakeId={intakeId}
          />
        )}
        {isPreIntake &&
          (!isClientStateInitialized ? (
            <Loading showMessage={false} />
          ) : (
            <>
              {preIntakeStep === "one" && (
                <PreIntakeNoteOne
                  onContinue={() => goToStep("two")}
                  tenantConfig={tenantConfig}
                />
              )}

              {preIntakeStep === "two" && (
                <PreIntakeNoteTwo
                  onGoBack={() => goToStep("one")}
                  onStartIntake={
                    tenantConfig.preIntakeFlow === "text+video"
                      ? () => goToStep("video")
                      : handleStartConversation
                  }
                  tenantConfig={tenantConfig}
                />
              )}

              {preIntakeStep === "video" && hasVideo(tenantConfig) && (
                <PreIntakeVideo
                  onGoBack={
                    tenantConfig.preIntakeFlow === "text+video"
                      ? () => goToStep("two")
                      : () => {
                          sessionStorage.removeItem("intake_token");
                          window.location.reload();
                        }
                  }
                  onStartIntake={handleStartConversation}
                  tenantConfig={tenantConfig}
                />
              )}
            </>
          ))}

        {isConversationInProgress && !isLocked && <ConversationLayout />}
      </div>
    </div>
  );
}

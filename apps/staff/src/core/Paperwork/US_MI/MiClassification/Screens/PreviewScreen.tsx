// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2026 Recidiviz, Inc.
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

import { Button, palette, StepDot } from "~design-system";

import { useFeatureVariants } from "../../../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../../../utils";
import { UsMiInitialClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { WorkflowsBadgePill } from "../../../../BadgePill/BadgePill";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { FormStages } from "../FormUsMiClassification";
import { ClassificationText, OverrideContainer } from "./OverrideStyle";
import {
  AfterCompleteHeading,
  AfterCompleteList,
  CardHr,
  CompletionCard,
  CompletionCardBody,
  CompletionCardHeader,
  CompletionCardText,
  ReadOnlyCard,
  ReadOnlyCompletedBy,
  ReadOnlyHr,
  ReadOnlyLabel,
  ReadOnlyRow,
  StepList,
  StepRow,
} from "./PreviewStyle";
import { SummaryBanner } from "./SummaryBanner";

export const UsMiClassificationPreviewScreen = observer(
  function UsMiClassificationPreviewScreen({
    onChangeNavigation,
  }: {
    onChangeNavigation: (page: FormStages) => void;
  }) {
    const form = useOpportunityFormContext() as
      | UsMiInitialClassificationForm
      | UsMiReviewClassificationForm;

    const { usMiCanFinalizeClassification } = useFeatureVariants();

    const readOnly = form.opportunity.isCompleted;

    const residentName = (
      <span className="fs-exclude">{form.person.displayName}</span>
    );

    const steps = [
      "The current COMS classification screen is complete.",
      "True Security Level uses departure reason D12: Classification Pilot Based Departure.",
      "The classification has been submitted for supervisor approval in COMS.",
      <>
        The classification moves to Past classifications on {residentName}’s
        profile.
      </>,
    ];

    const FinalizeForm = () => {
      form.opportunity.setCompletedIfEligible();
    };

    const completedUpdate = form.opportunity.updates?.completed?.update;
    // date is null until Firestore resolves the serverTimestamp() written on
    // finalize, so the line briefly shows no date right after finalizing.
    const completedDate = completedUpdate?.date
      ? formatWorkflowsDate(completedUpdate.date.toDate())
      : undefined;

    return (
      <OverrideContainer>
        {!readOnly && (
          <Button
            type="button"
            kind="secondary"
            onClick={() => onChangeNavigation("OVERRIDE")}
          >
            Back
          </Button>
        )}
        {readOnly && (
          <ReadOnlyCard>
            <ReadOnlyLabel>Read Only</ReadOnlyLabel>
            <ReadOnlyHr />
            <ReadOnlyRow>
              <div>
                <ReadOnlyCompletedBy>Recidiviz</ReadOnlyCompletedBy>
                <div>
                  Completed {completedDate} by{" "}
                  <span className="fs-exclude">{completedUpdate?.by}</span>
                </div>
              </div>
              <div>
                <WorkflowsBadgePill text="Completed" palette="GREEN" />
              </div>
            </ReadOnlyRow>
          </ReadOnlyCard>
        )}
        {usMiCanFinalizeClassification && (
          <CompletionCard>
            <CompletionCardHeader>
              <ClassificationText
                $fontWeight={600}
                $color={palette.text.primary}
                $fontSize={18}
              >
                {form.type} Classification Summary
              </ClassificationText>

              <Button
                kind="primary"
                onClick={() => FinalizeForm()}
                disabled={readOnly}
              >
                Complete Classification
              </Button>
            </CompletionCardHeader>
            <CardHr />
            <CompletionCardBody>
              <ClassificationText
                $fontWeight={500}
                $color={palette.text.primary}
                $fontSize={16}
              >
                Confirm that the classification has been entered in COMS
              </ClassificationText>
              <CompletionCardText>
                The PC enters the classification in COMS. Check that COMS
                matches the values here, then complete.
              </CompletionCardText>
              <StepList>
                {steps.map((step, index) => (
                  <StepRow>
                    <StepDot
                      $isCompleted={true}
                      $isCurrent={false}
                      $compact={false}
                      $accentColor={palette.pine3}
                    >
                      {index + 1}
                    </StepDot>
                    <ClassificationText as="span" $padding="0 0 0 5px">
                      {step}
                    </ClassificationText>
                  </StepRow>
                ))}
              </StepList>
              <AfterCompleteHeading>After you complete</AfterCompleteHeading>
              <AfterCompleteList>
                <li>Answers and overrides are locked.</li>
                <li>
                  The classification moves to Past classifications on{" "}
                  {residentName}’s profile.
                </li>
                <li>You can still download the form.</li>
              </AfterCompleteList>
            </CompletionCardBody>
          </CompletionCard>
        )}
        <SummaryBanner final={true} />
      </OverrideContainer>
    );
  },
);

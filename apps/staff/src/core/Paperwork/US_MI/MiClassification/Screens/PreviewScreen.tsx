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

import {
  calculateUsMiClassificationLevels,
  usMiDepartureReasons,
  usMiFemaleLevelBreakdowns,
  usMiMaleLevelBreakdowns,
  usMiWaiverReasons,
} from "~datatypes";
import { Button, Icon, palette, StepDot } from "~design-system";

import { useFeatureVariants } from "../../../../../components/StoreProvider";
import { formatWorkflowsDate } from "../../../../../utils";
import { UsMiInitialClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { UsMiReviewClassificationForm } from "../../../../../WorkflowsStore/Opportunity/Forms/UsMiReviewClassification2026Form";
import { WorkflowsBadgePill } from "../../../../BadgePill/BadgePill";
import { useOpportunityFormContext } from "../../../OpportunityFormContext";
import { PrintablePage } from "../../../styles";
import { QuestionNotes } from "../FormNotes";
import { FormStages } from "../FormUsMiClassification";
import { SectionTitle } from "../Styles";
import { ClassificationText, OverrideContainer } from "./OverrideStyle";
import {
  AfterCompleteHeading,
  AfterCompleteList,
  BlackHr,
  BoldValue,
  CardHr,
  CenteredSpaceBetweenRow,
  CompletionCard,
  CompletionCardBody,
  CompletionCardHeader,
  CompletionCardText,
  FullWidth,
  InfoGrid,
  LevelFlow,
  LevelSection,
  LevelStep,
  PageHr,
  PageTitle,
  PointRangeItem,
  PointRanges,
  PreviewFormSection,
  QuestionNotesIndent,
  QuestionRow,
  ReadOnlyCard,
  ReadOnlyCompletedBy,
  ReadOnlyHr,
  ReadOnlyLabel,
  ReadOnlyRow,
  SignatureBlock,
  SignatureLine,
  SignatureRow,
  StepList,
  StepRow,
  SubtotalRow,
  TableCell,
} from "./PreviewStyle";
import { SummaryBanner } from "./SummaryBanner";

export const UsMiClassificationPreviewScreen = observer(
  function UsMiClassificationPreviewScreen({
    onChangeNavigation,
  }: {
    onChangeNavigation: (page: FormStages) => void;
  }) {
    const today = formatWorkflowsDate(new Date());
    const form = useOpportunityFormContext() as
      | UsMiInitialClassificationForm
      | UsMiReviewClassificationForm;

    const { usMiCanFinalizeClassification } = useFeatureVariants();
    const { formData, derivedData, draftData } = form;

    const readOnly = form.opportunity.isCompleted;

    const residentName = (
      <span className="fs-exclude">{form.person.displayName}</span>
    );

    const steps = [
      {
        id: "coms-complete",
        text: "The current COMS classification screen is complete.",
      },
      {
        id: "departure-d12",
        text: "True Security Level uses departure reason D12: Classification Pilot Based Departure.",
      },
      {
        id: "supervisor-approval",
        text: "The classification has been submitted for supervisor approval in COMS.",
      },
      {
        id: "past-classifications",
        text: (
          <>
            The classification moves to Past classifications on {residentName}’s
            profile.
          </>
        ),
      },
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

    const tableRows = {
      "Prisoner Number": (
        <span className="fs-exclude">{form.person.displayId}</span>
      ),
      "Prisoner Name": residentName,

      // Purpose & Supervisor reviewing are intentionally left
      // blank as staff will fill this out manually
      Purpose: "",

      "Assessed date": completedDate ?? today,
      "Assessed by": (
        <span className="fs-exclude">
          {completedUpdate?.by ?? form.currentUserId}
        </span>
      ),
      "Supervisor reviewing": "",
      "Assessed work unit": form.person.unitId,
    };

    const documentNumber = form.formTitle.includes("Initial")
      ? "CSJ-480-P"
      : "CSJ-481-P";

    const levelBreakdowns =
      form.person.gender === "MALE"
        ? usMiMaleLevelBreakdowns
        : usMiFemaleLevelBreakdowns;

    const { calculatedLevel, trueLevel, actualLevel } =
      calculateUsMiClassificationLevels({
        totalScore: derivedData.totalScore,
        override1_2Selection: draftData.override1_2Selection,
        override2_2Selection: draftData.override2_2Selection,
        currentLevel: form.displayCustodyLevel,
        levelBreakdowns,
      });

    const levelRows = [
      {
        "Total points": derivedData.totalScore,
        "Calculated level": calculatedLevel,
      },
      {
        Departure: draftData.override1_1Selection
          ? usMiDepartureReasons[draftData.override1_1Selection]
          : undefined,
        "True Security Level": trueLevel,
      },
      {
        Waiver: draftData.override2_1Selection
          ? usMiWaiverReasons[draftData.override2_1Selection]
          : undefined,
        "Actual Placement Level": actualLevel,
      },
    ];

    let questionNumber = 0;

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
                  <StepRow key={step.id}>
                    <StepDot
                      $isCompleted={true}
                      $isCurrent={false}
                      $compact={false}
                      $accentColor={palette.pine3}
                    >
                      {index + 1}
                    </StepDot>
                    <ClassificationText as="span" $padding="0 0 0 5px">
                      {step.text}
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
        <PreviewFormSection id="preview-form">
          {" "}
          <PrintablePage stretchable>
            <CenteredSpaceBetweenRow id="header">
              <div>
                <div>Michigan Department of Corrections</div>
                <PageTitle>Security Classification: {form.formTitle}</PageTitle>
              </div>
              <div>
                <div>{documentNumber}</div>
                <div>2026 Pilot</div>
              </div>
            </CenteredSpaceBetweenRow>
            <PageHr />
            <InfoGrid>
              {Object.entries(tableRows).map(([key, value]) => (
                <TableCell key={key}>
                  <div>{key}</div>
                  <BoldValue>{value}</BoldValue>
                </TableCell>
              ))}
            </InfoGrid>
            <div>
              <LevelSection>
                Current Security Level:{" "}
                <BoldValue as="span">{form.displayCustodyLevel}</BoldValue>
                <LevelFlow>
                  {levelRows.map((section, s_index) => {
                    const arrow = levelRows.length === s_index + 1;
                    return (
                      <LevelStep key={Object.keys(section)[0]}>
                        <FullWidth>
                          {Object.entries(section).map(([key, value]) => {
                            return (
                              <TableCell key={key}>
                                <div>{key}</div>
                                <BoldValue>
                                  {value === undefined || value === null
                                    ? "None"
                                    : value}
                                </BoldValue>
                              </TableCell>
                            );
                          })}
                        </FullWidth>
                        {!arrow && <Icon kind="Next" size={10} />}
                      </LevelStep>
                    );
                  })}
                </LevelFlow>
                <PointRanges>
                  <div>Point ranges:</div>
                  {/* for each level go over the point levels */}
                  {levelBreakdowns.map((value) => (
                    <PointRangeItem
                      key={value.title}
                    >{`${value.title} ${value.range}`}</PointRangeItem>
                  ))}
                </PointRanges>
                {form.questionList?.map((section, s_index) => {
                  return (
                    <div key={section.title}>
                      <CenteredSpaceBetweenRow>
                        <SectionTitle>{section.title}</SectionTitle>
                        {/* s_index */}
                        <div>{derivedData["subscores"][s_index]} Points</div>
                      </CenteredSpaceBetweenRow>
                      <BlackHr />
                      {section.questions.map((question) => {
                        questionNumber += 1;
                        const questionKey = `s${s_index + 1}q${questionNumber}`;

                        const selectionKey = `${questionKey}Selection`;
                        const scoreKey = `${questionKey}Score`;
                        const notesKey = `${questionKey}Notes`;

                        const rawSelection = formData[selectionKey];
                        const selection =
                          typeof rawSelection === "number"
                            ? rawSelection
                            : undefined;
                        const selectedOption =
                          question.type === "SINGLE" && selection !== undefined
                            ? question.options[selection]
                            : undefined;

                        const score =
                          derivedData[
                            scoreKey as Extract<
                              keyof typeof derivedData,
                              `${string}Score`
                            >
                          ];

                        const note =
                          derivedData[
                            notesKey as Extract<
                              keyof typeof derivedData,
                              `${string}Notes`
                            >
                          ];

                        return (
                          <div key={question.title}>
                            <QuestionRow>
                              <div>{questionNumber}.</div>
                              <div>{question.title}</div>
                              {/* these are the selections */}
                              <div>
                                {question.type === "NUMBER" && (
                                  <div>
                                    <BoldValue as="span">{selection}</BoldValue>
                                    <span> x {question.multiplier}</span>
                                  </div>
                                )}
                                {question.type === "SINGLE" && (
                                  <div>{selectedOption?.text}</div>
                                )}
                              </div>
                              {/* these are the points for each */}
                              <div>{score}</div>
                            </QuestionRow>
                            <QuestionNotesIndent>
                              <QuestionNotes
                                noteInfo={question.note}
                                note={note}
                                preview
                              />
                            </QuestionNotesIndent>
                            <BlackHr />
                          </div>
                        );
                      })}
                      <SubtotalRow>
                        {section.title} subtotal{" "}
                        {form.derivedData.subscores[s_index]} pts
                      </SubtotalRow>
                    </div>
                  );
                })}
                <SignatureRow>
                  <SignatureBlock>
                    <SignatureLine />
                    <div>Assessed by / date</div>
                  </SignatureBlock>
                  <SignatureBlock>
                    <SignatureLine />
                    <div>Supervisor reviewing / date</div>
                  </SignatureBlock>
                </SignatureRow>
              </LevelSection>
            </div>
          </PrintablePage>
        </PreviewFormSection>
      </OverrideContainer>
    );
  },
);

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
import { rem } from "polished";
import React, { useEffect, useState } from "react";

import { Button, palette } from "~design-system";

import { Opportunity } from "../../../../WorkflowsStore";
import { UsMiClassificationForm } from "../../../../WorkflowsStore/Opportunity/Forms/UsMiInitialClassification2026Form";
import { useOpportunityFormContext } from "../../OpportunityFormContext";
import { ClassificationQuestion } from "./MultipleChoiceQuestion";
import {
  ClassificationForm,
  FormFooter,
  FormTitle,
  LevelBadge,
  RemainingFields,
  ScoringNote,
  SectionHeading,
  StatusBadge,
  StickyHeader,
  SubHeading,
  VerticalHr,
} from "./Styles";

export const FormUsMiClassification = observer(function FormUsMiClassification({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const formRef = React.useRef<HTMLDivElement>(null);
  const form = useOpportunityFormContext() as UsMiClassificationForm;

  const { displayCustodyLevel, questionList, derivedData, formTitle } = form;

  const [headerVisible, isHeaderVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        isHeaderVisible(false);
      } else {
        isHeaderVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  let questionNumber = 0;
  return (
    <>
      <StickyHeader $headerVisible={headerVisible}>
        <div>
          <FormTitle>{formTitle}</FormTitle>
          <SubHeading $headerVisible={headerVisible}>
            Auto-filled fields are pulled from OMS. Review each and complete
            required fields.
          </SubHeading>
        </div>
        <StatusBadge $headerVisible={headerVisible}>
          <LevelBadge $headerVisible={headerVisible}>
            <div style={{ fontSize: rem(12) }}>CURRENT LEVEL</div>
            <div
              style={{ fontWeight: 700, color: "black", padding: "0px 5px" }}
            >
              {displayCustodyLevel}
            </div>
          </LevelBadge>
          <VerticalHr />
          <div style={{ flexGrow: "5", fontSize: `${rem(12)}` }}>
            All Changes Saved
          </div>
        </StatusBadge>
      </StickyHeader>

      <ClassificationForm
        ref={formRef}
        style={{
          borderLeft: `1px solid ${palette.slate20}`,
          marginTop: "90px",
        }}
      >
        {questionList?.map((section, sectionIndex) => {
          const { subscores } = derivedData;
          return (
            <div key={section.title}>
              <SectionHeading>
                <div style={{ fontWeight: "600", color: "black" }}>
                  {section.title}
                </div>
                <div>Subtotal: {subscores && subscores[sectionIndex]}</div>
              </SectionHeading>
              {section.questions.map((question) => {
                questionNumber += 1;
                return (
                  <ClassificationQuestion
                    key={question.title}
                    questionSection={sectionIndex + 1}
                    question={question}
                    questionNumber={questionNumber}
                  />
                );
              })}
            </div>
          );
        })}
        <hr style={{ width: "100%" }} />
        <FormFooter>
          <div
            id="remaining-fields"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <RemainingFields>1 required field remaining</RemainingFields>
            <ScoringNote>
              The score and recommended level appear after you calculate
            </ScoringNote>
          </div>
          <Button type="button" kind="primary">
            Calculate Classification
          </Button>
        </FormFooter>
      </ClassificationForm>
    </>
  );
});

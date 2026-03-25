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

import { TooltipTrigger } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import useClipboard from "react-use-clipboard";
import styled from "styled-components";

import { useUsNcTranslations } from "~@jii/translation";
import { Button, palette, spacing } from "~design-system";

import CopyIcon from "../../../assets/static/images/copy.svg?react";
import { RNAResultsSectionProps } from "./RNAResultsSection";
import { MediumAnswerCell, RNAResultsTable, WideAnswerCell } from "./styles";

const TextWithCopyOption = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CopyButton = styled(Button).attrs({ kind: "borderless" })`
  padding: ${rem(spacing.xxs)};
  &:hover {
    background: ${palette.slate10};
  }
  &:active {
    background: ${palette.slate30};
  }
`;

const CopiableText = ({ text }: { text: string }) => {
  const [, copyToClipboard] = useClipboard(text, {
    successDuration: 5000,
  });
  return (
    <TextWithCopyOption>
      <span>{text}</span>
      <TooltipTrigger contents={`Copy to clipboard`}>
        <CopyButton
          kind={"borderless"}
          shape={"block"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            copyToClipboard();
          }}
        >
          <CopyIcon />
        </CopyButton>
      </TooltipTrigger>
    </TextWithCopyOption>
  );
};

export const RNAResultsLifeAreaGrid = observer(function RNAResultsLifeAreaGrid({
  questions,
  presenter,
}: RNAResultsSectionProps) {
  const { t } = useUsNcTranslations();
  const { lifeAreasQuestionCopy, questionCopy } = t(($) => $.rna, {
    returnObjects: true,
  });

  return (
    <RNAResultsTable>
      <thead>
        <tr>
          <th scope="col">Life Area</th>
          <th scope="col">{lifeAreasQuestionCopy.isThisAProblem}</th>
          <th scope="col">{lifeAreasQuestionCopy.interestedInImproving}</th>
          <th scope="col">{lifeAreasQuestionCopy.improvement}</th>
        </tr>
      </thead>

      <tbody>
        {questions.map((id) => {
          const answer = presenter.lifeAreaAnswers[id];

          const customText = answer?.customLifeArea;
          const hasInterest = !!(answer?.interest || customText);
          const lifeAreaName = questionCopy[id].question;

          const interestRating = answer?.interestRating;
          const improvementText = answer?.improvementText;

          return (
            <tr key={id}>
              <MediumAnswerCell>
                <>
                  <span>
                    <strong>{lifeAreaName}</strong>
                  </span>
                  {customText && <CopiableText text={customText} />}
                </>
              </MediumAnswerCell>
              <MediumAnswerCell>{hasInterest ? "Yes" : "No"}</MediumAnswerCell>
              <MediumAnswerCell>
                {hasInterest ? interestRating : "–"}
              </MediumAnswerCell>
              <WideAnswerCell>
                {improvementText ? (
                  <CopiableText text={improvementText} />
                ) : (
                  "–"
                )}
              </WideAnswerCell>
            </tr>
          );
        })}
      </tbody>
    </RNAResultsTable>
  );
});

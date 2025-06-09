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

import { spacing, typography } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { ConfigLabels } from "../../InsightsStore/presenters/types";
import { toTitleCase } from "../../utils";
import { createLabelString } from "./utils";

const FaqWrapper = styled.div`
  display: grid;
  justify-items: center;
  background: ${palette.pine2};
  padding: ${rem(130)} ${rem(spacing.md)};
  margin-top: ${rem(124)};
`;

const FaqContent = styled.div`
  max-width: ${rem(500)};
  width: fill-available;
`;

const FaqTitle = styled.div`
  ${typography.Sans24}
  color: ${palette.white};
  margin-bottom: ${rem(spacing.lg)};
`;

const FaqSummary = styled.summary`
  ${typography.Sans18}
  color: ${palette.data.teal1};
  padding: ${rem(spacing.lg)} 0;
  border-top: 1px solid ${palette.slate60};
  transition: all 0.5s ease;
  list-style-type: none;

  &::before {
    content: "+";
    margin-right: ${rem(spacing.sm)};
  }

  &:hover {
    cursor: pointer;
    color: ${palette.white};
  }
`;

const FaqDetails = styled.details`
  &[open] > ${FaqSummary} {
    color: ${palette.white};
    &::before {
      content: "-";
    }
  }
`;

const FaqAnswer = styled.div`
  ${typography.Sans18}
  color: ${palette.white};
  padding-bottom: ${rem(spacing.lg)};
`;

const OnboardingFaq: React.FC<{
  labels: ConfigLabels;
  eventLabels: string[];
}> = ({ labels, eventLabels }) => {
  const { supervisionOfficerLabel, supervisionSupervisorLabel, docLabel } =
    labels;

  const faqs = [
    {
      question: "Which metrics are shown in this tool?",
      answer: `This tool shows three metrics: ${createLabelString(eventLabels, "and")} rate.\n
      The tool includes more detail about how those rates are calculated.`,
    },
    {
      question: `What is an “outlier” ${supervisionOfficerLabel}?`,
      answer: `An outlier ${createLabelString(eventLabels, "or")} rate that is over 1 interquartile
      range higher than the statewide rate. That means that the
      ${supervisionOfficerLabel}’s rate is much higher than the other ${supervisionOfficerLabel}s in the
      state.`,
    },
    {
      question: "Who has access to this tool?",
      answer: `${toTitleCase(supervisionSupervisorLabel)}s, district and regional management, FOA and ${docLabel} administrators have access to this tool. 
      ${toTitleCase(supervisionOfficerLabel)}s do not have access.`,
    },
    {
      question: "Have more questions?",
      answer: `Click on the chat button in the bottom right corner of the screen to ask a question or send us feedback anytime.`,
    },
  ];

  return (
    <FaqWrapper>
      <FaqContent>
        <FaqTitle>Frequently Asked Questions</FaqTitle>
        {faqs.map((faq) => (
          <FaqDetails key={faq.question}>
            <FaqSummary>{faq.question}</FaqSummary>
            <FaqAnswer>{faq.answer}</FaqAnswer>
          </FaqDetails>
        ))}
      </FaqContent>
    </FaqWrapper>
  );
};

export default OnboardingFaq;

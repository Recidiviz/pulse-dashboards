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

import { rem } from "polished";
import { Form } from "react-bootstrap";
import styled from "styled-components";

import { palette } from "~design-system";

export const ClassificationForm = styled(Form)`
  padding: 40px;
  margin-left: 1px;
  background-color: ${palette.marble3};
`;

export const FormTitle = styled.div`
  text-align: left;
  margin-bottom: 5px;
  font-size: ${rem(24)};
  color: black;
  width: 100%;
`;

export const StickyHeader = styled.div<{
  $headerVisible?: boolean;
}>`
  position: fixed;
  z-index: 4000;
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
  background: white;
  padding: 10px 20px;
  border-bottom: 1px solid ${palette.slate20};
  border-left: 1px solid ${palette.slate20};
  transition: all 0.5s ease-in-out;
  width: -webkit-fill-available;

  ${({ $headerVisible }) =>
    !$headerVisible &&
    `
    height: 60px;
    transition: all 0.5s ease-in-out;
    position: fixed;`}
`;

export const SubHeading = styled.div<{
  $headerVisible?: boolean;
}>`
  width: 100%;
  font-size: ${rem(14)};
  margin: 5px 0;

  ${({ $headerVisible }) =>
    !$headerVisible &&
    `
    display: none;
  `}
`;

export const SubsectionHeading = styled.div`
  color: black;
  font-weight: 600;
  font-size: ${rem(18)};
`;

export const StatusBadge = styled.div<{
  $headerVisible?: boolean;
}>`
  padding: 15px;
  margin: 10px 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  box-shadow:
    0 0 1px rgba(var(--slate-rgb), 0.1),
    0 4px 8px rgba(var(--slate-rgb), 0.06),
    0 8px 56px rgba(var(--slate-rgb), 0.12);
  ${({ $headerVisible }) =>
    !$headerVisible &&
    `
  align-items: center;
  text-wrap: nowrap;
  `}
`;

export const LevelBadge = styled.div<{
  $headerVisible?: boolean;
}>`
  display: flex;
  flex-direction: column;
  ${({ $headerVisible }) =>
    !$headerVisible &&
    `
    flex-direction: row;
    align-items: center;
    `}
`;

export const VerticalHr = styled.hr`
  transform: rotate(90deg);
  width: 40px;
  color: ${palette.slate60};
  margin: 2px;
`;

// for questions

export const QuestionBox = styled.div<{
  $status?: string | boolean;
}>`
  display: flex;
  flex-direction: column;
  margin: 10px 0px;
  background: white;
  padding: 18px;
  border: 1px solid ${palette.slate40};
  border-radius: 10px;

  ${({ $status }) =>
    $status === "required" &&
    `background: rgba(224, 168, 82, 0.05);
    border: 1px solid rgba(224, 168, 82, 0.55);
    `}
`;

export const QuestionStatusBadge = styled.div<{ $status: string }>`
  font-weight: 700;
  padding: 5px 8px;
  margin-right: 10px;
  border-radius: 999px;
  font-size: ${rem(12)};
  width: fit-content;
  text-wrap: nowrap;
  height: fit-content;
  ${({ $status }) =>
    $status === "AUTO-FILLED"
      ? `color: ${palette.pine3};
    background-color: rgba(0, 196, 157, 0.16);
    `
      : `
    color: rgb(138, 100, 32);
    background-color: rgba(224, 168, 82, 0.22) `}
`;

export const QuestionTextArea = styled.textarea`
  width: 100%;
  min-height: 64px;
  border: 1px solid ${palette.slate20};
  border-radius: 8px;
  color: ${palette.slate85};
  padding: 10px 12px;
  font-size: ${rem(14)};
`;

export const FormFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 10px 10px;
`;

export const RemainingFields = styled.div`
  color: rgb(138, 100, 32);
  font-size: ${rem(14)};
  font-weight: 600;
`;

export const ScoringNote = styled.div`
  color: ${palette.slate60};
  font-size: ${rem(14)};
  margin: 8px 0;
`;

export const SectionHeading = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

/*
 * Styling Below for the individual questions
 */

export const StyledQuestionButton = styled.div`
  background: white;
  border-radius: 10px;
  margin: 5px;
  font-size: ${rem(14)};

  &:has(input:checked) {
    border-color: ${palette.pine3};
  }

  &:hover {
    cursor: pointer;
  }
`;

export const QuestionHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const QuestionDescription = styled.div`
  color: ${palette.slate50};
  font-size: ${rem(14)};
  margin: 8px 0;
`;

export const QuestionTitle = styled.div`
  font-weight: 600;
  font-size: ${rem(16)};
  color: black;
`;

export const FormInput = styled.input`
  border-radius: 5px;
  border: 1px grey solid;
  height: 30px;
  max-width: 70px;
  margin: 0 10px;
  text-align: center;
`;

export const PlacementsSection = styled.div`
  border-radius: 8px;
  border: 1px grey solid;
  width: 100%;
  padding: 12px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin: 5px;
  background: white;
`;

/*
 * Case notes - show few and show more
 */

export const ViewMoreNotes = styled.button`
  color: ${palette.pine4};
  border: none;
  background: none;
  font-weight: 500;
  padding: 5px;
  text-align: left;
`;

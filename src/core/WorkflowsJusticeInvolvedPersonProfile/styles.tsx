// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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

import {
  Button,
  palette,
  spacing,
  TooltipTrigger,
  typography,
} from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

export const DetailsSection = styled.dl``;

export const DetailsBorderedSection = styled(DetailsSection)`
  border-top: 1px solid ${palette.slate10};
  border-bottom: 1px solid ${palette.slate10};
  margin: 0 -${rem(spacing.md)};
  padding: 0 ${rem(spacing.md)};
  background: ${palette.marble2};

  & + hr {
    display: none;
  }
`;

export const DetailsHeading = styled.dt`
  ${typography.Sans14}
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
  margin-top: ${rem(spacing.md)};
`;

export const DetailsList = styled.dl``;

export const MilestonesList = styled.dl`
  align-items: center;
  display: flex;
  gap: ${rem(spacing.sm)};
  margin-bottom: ${rem(spacing.xs)};
`;

export const MilestonesItem = styled.span``;

export const DetailsSubheading = styled.dt`
  ${typography.Sans14}
  color: rgba(53, 83, 98, 0.5);
  margin-bottom: ${rem(spacing.xs)};
`;
const DetailsContent = styled.dd`
  ${typography.Sans14}
  color: rgba(53, 83, 98, 0.9);
`;

export const SpecialConditionsCopy = styled.div`
  ${typography.Body12}
`;

export const CaseNoteTitle = styled.span`
  font-weight: 700;
`;

export const CaseNoteDate = styled.span`
  color: ${palette.slate60};
`;

export type EmptySpecialConditionCopy = {
  parole: string;
  probation: string;
};

export const SecureDetailsContent = styled(DetailsContent).attrs({
  className: "fs-exclude",
})``;

export const SecureDetailsList = styled(DetailsList).attrs({
  className: "fs-exclude",
})``;
export const PillButton = styled(Button).attrs({ kind: "secondary" })<{
  active?: boolean;
}>`
  color: ${palette.slate85};
  min-width: unset;
  min-height: unset;
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
  margin: 0 ${rem(spacing.sm)} ${rem(spacing.sm)} 0;
  display: inline-block;
  ${({ active }) =>
    active &&
    `background-color: ${palette.slate10}; border-color: transparent;`}

  &:hover {
    background-color: ${palette.slate10};
  }

  &:focus:not(:hover) {
    ${({ active }) => !active && `background-color: unset;`}
  }
`;

export const InfoTooltipWrapper = styled(TooltipTrigger)`
  vertical-align: text-bottom;
`;

export const Separator = styled.span`
  color: ${palette.slate30};
`;

export const Divider = styled.hr`
  border-top: 1px solid ${palette.slate20};
  margin: ${rem(spacing.md)} 0;

  &:has(+ [class*="DetailsBorderedSection"]) {
    display: none;
  }

  :last-child {
    display: none;
  }
`;

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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
  palette,
  Sans12,
  Sans14,
  Sans18,
  spacing,
  typography,
} from "@recidiviz/design-system";
import { rem, rgba } from "polished";
import styled from "styled-components/macro";

import TealStar from "../assets/static/images/tealStar.svg?react";

export const Heading = styled.div<{ isMobile?: boolean }>`
  ${({ isMobile }) => (isMobile ? typography.Serif24 : typography.Serif34)}
  color: ${palette.pine2};
  padding-bottom: ${rem(spacing.md)};
`;

export const SubHeading = styled(Sans18)`
  color: ${palette.slate70};
  padding-bottom: ${rem(spacing.md)};
`;

export const SectionLabelText = styled(Sans14)`
  color: ${palette.slate60};
  margin-top: ${rem(spacing.xl)};
  border-bottom: 1px solid ${palette.slate20};
  padding-bottom: ${rem(spacing.sm)};
`;

export const TooltipContainer = styled.div`
  min-width: 100%;
  margin: ${rem(spacing.sm)};
`;

export const TooltipSection = styled.div`
  &:not(:first-child) {
    padding: 1rem 1rem 0 0;
  }
`;

export const TooltipSectionHeader = styled(Sans14)`
  color: white;
`;

type TooltipSectionDetailsProps = {
  overdue?: boolean;
};

export const TooltipSectionDetails = styled(Sans12)<TooltipSectionDetailsProps>`
  color: ${(p) => (p.overdue ? "rgb(224, 14, 0)" : "rgba(255, 255, 255, 0.7)")};
`;

export const TooltipRow = styled.div<{
  justifyContent?: string;
}>`
  display: flex;
  align-items: center;
  flex-direction: row;
  justify-content: ${(props) => props.justifyContent ?? "flex-start"};
  padding: 0.5rem 0 0 0;
`;

export const OtherReasonInputWrapper = styled.div`
  display: block;
  margin: ${rem(spacing.sm)} 2.5rem 1rem;
`;

export const OtherReasonInput = styled.textarea.attrs({ type: "text" })`
  background: ${palette.marble3};
  border-radius: ${rem(4)};
  border: 2px solid transparent;
  display: block;
  margin-top: ${rem(spacing.xs)};
  width: 100%;
  min-height: 2rem;

  &:focus {
    border-color: ${rgba(palette.slate, 0.1)};
  }
`;

export const TooltipTealStar = styled(TealStar)`
  margin-right: 0.375rem;
  height: 16px;
  width: 16px;
`;

export const Banner = styled.div`
  background: #f2f7f7;
  border-width: 1px;
  border-radius: 8px;
  border-color: #00665f;
  border-opacity: 10%;
  margin-top: ${rem(spacing.xs)};
  margin-bottom: ${rem(spacing.xs)};
  justify-content: center;
  padding: ${rem(spacing.lg)};
  color: ${palette.pine1};
  @media (max-width: 1024px) {
    width: 100% !important;
  }
`;

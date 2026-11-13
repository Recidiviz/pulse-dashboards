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
import styled from "styled-components";

import { Icon, palette } from "~design-system";

import { FullWidthHr } from "../Styles";

export const OverrideContainer = styled.div`
  width: 100%;
  padding: 40px;
  margin-top: 90px;
`;

export const TopBanner = styled.div<{ $final?: boolean }>`
  border: ${({ $final }) =>
    $final
      ? `1px solid ${palette.text.primary}`
      : ` 1px dotted ${palette.slate70}`};
  background: ${({ $final }) => ($final ? palette.white : palette.slate05)};
  border-radius: 10px;
`;

export const BannerRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
`;

export const LevelColumn = styled.div`
  display: flex;
  flex-direction: column;
  margin: 10px;
`;

export const PointsBySection = styled.div`
  display: flex;
  flex-grow: 2;
  justify-content: space-between;
  flex-direction: column;
  margin: 10px;
`;

export const LevelSummary = styled.div`
  display: flex;
  flex-direction: row;
  padding: 10px;
  margin-bottom: 15px;
  justify-content: space-around;
  align-items: center;
`;

export const SectionRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 5px 0;
  font-size: ${rem(16)};
`;

export const TotalRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-weight: 600;
`;

export const SectionDivider = styled.hr`
  width: 100%;
  color: ${palette.slate20};
  border: 0.5px solid ${palette.slate20};
`;

export const PointerRow = styled.div<{ $width: number }>`
  display: flex;
  width: ${({ $width }) => `${$width}%`};
  justify-content: end;
`;

export const PointRange = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;

  & > :first-child {
    border-radius: 8px 0 0 8px;
  }

  & > :last-child {
    border-radius: 0 8px 8px 0;
  }
`;

export const LevelDividers = styled.div<{
  $current: boolean;
  $width: number;
}>`
  width: ${({ $width }) => `${$width}%`};
  margin: 1px;
  display: flex;
  flex-direction: column;
  padding: 5px;
  color: ${({ $current }) =>
    $current ? palette.marble1 : palette.text.primary};
  background: ${({ $current }) => ($current ? palette.pine1 : palette.slate10)};
`;

export const OverridesTitle = styled.div`
  font-size: ${rem(20)};
  color: ${palette.text.primary};
  margin: 5px 0;
`;

export const ClassificationText = styled.div<{
  $color?: string;
  $fontSize?: number;
  $padding?: string;
  $fontWeight?: number;
}>`
  ${({ $color }) => $color && `color: ${$color};`}
  ${({ $fontSize }) => $fontSize && `font-size: ${rem($fontSize)};`}
  ${({ $padding }) => $padding && `padding: ${$padding};`}
  ${({ $fontWeight }) => $fontWeight && `font-weight: ${$fontWeight};`}
`;

export const SubHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const OverrideSelect = styled.select`
  padding: 12px;
  border-radius: 8px;
  color: ${palette.slate90};
`;

export const OverrideDivider = styled(FullWidthHr)`
  color: ${palette.slate70};
`;

export const BannerContent = styled.div`
  margin: 10px;
`;

export const FinalBannerHeader = styled.div`
  width: 100%;
  color: ${palette.white};
  background: ${palette.text.primary};
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px 8px 0 0;
`;

export const FinalBannerHeaderLabel = styled.span`
  margin-left: 5px;
`;

export const FinalLevelGrid = styled.div`
  width: 50%;
  margin: 10px;
  display: grid;
  grid-template-columns: 60% 40%;
`;

export const FinalLevelCell = styled.div<{
  $value?: boolean;
  $placement?: boolean;
}>`
  padding-bottom: 5px;
  margin-bottom: 5px;
  ${({ $value, $placement }) =>
    ($value || $placement) &&
    `color: ${palette.text.primary}; font-weight: 600;`}
  ${({ $placement }) =>
    $placement
      ? "margin-top: 5px;"
      : `border-bottom: 1px solid ${palette.slate30};`}
  ${({ $value, $placement }) =>
    $value && $placement && `font-size: ${rem(20)};`}
`;

export const LevelChange = styled.div`
  font-weight: 400;
  font-size: ${rem(14)};
`;

export const UpChevron = styled(Icon)`
  transform: rotate(180deg);
`;

export const InlineArrow = styled(Icon)`
  display: inline;
`;

export const PointerContainer = styled.div`
  width: 100%;
  color: ${palette.pine1};
`;

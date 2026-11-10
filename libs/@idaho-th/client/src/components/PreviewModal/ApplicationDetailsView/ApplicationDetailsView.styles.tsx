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

import styled, { css } from "styled-components";

import {
  BodyM1,
  BodyM2,
  borderRadius,
  palette,
  spacing,
} from "../../../styles";
import ArrowDownSvg from "../../assets/arrow-down.svg?react";
import { buttonOutline } from "../../common/StyledComponents";

export const ArrowDown = styled(ArrowDownSvg)`
  display: block;
  height: 0.375rem;
  width: 0.6669rem;
`;

export const PanelRoot = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0 ${spacing[4]};
  width: 100%;
`;

export const PanelBody = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: ${spacing[6]};
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 0 ${spacing[4]};
  width: 100%;
`;

export const ResponseSection = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const AccordionsContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  width: 100%;
`;

export const ExpandCollapseToggle = styled.button`
  ${buttonOutline}
  align-items: center;
  background-color: transparent;
  box-sizing: border-box;
  color: ${palette.foreground.brand};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[1]};
  height: 1.25rem;
  margin-bottom: 0;

  &:hover {
    opacity: 0.85;
  }
`;

export const ExpandCollapseChevron = styled.span<{ $expanded: boolean }>`
  align-items: center;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  transform: ${({ $expanded }) =>
    $expanded ? "rotate(180deg)" : "rotate(0deg)"};
  transition: transform 0.2s ease;
  width: 1rem;
`;

export const PanelFooter = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex: none;
  gap: ${spacing[2]};
  height: 3.75rem;
  justify-content: flex-end;
  min-height: 3.75rem;
  padding: ${spacing[4]} ${spacing[4]} 0;
  width: 100%;
`;

export const SubmitFooterButton = styled.button`
  align-items: center;
  background: ${palette.background.brand};
  border-radius: ${borderRadius.round};
  border: none;
  color: ${palette.foreground.onBrand};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: 2.75rem;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0 ${spacing[5]};
  white-space: nowrap;
  ${buttonOutline}
  &:hover {
    background: ${palette.misc.eerieBlack};
  }
`;

export const Section = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
`;

export const SectionHeader = styled.button`
  align-items: flex-end;
  background-color: transparent;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[3]};
  justify-content: flex-end;
  min-height: 2.5rem;
  padding: 0 0 ${spacing[4]};
  width: 100%;
  ${buttonOutline}
`;

export const SectionHeaderRow = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[3]};
  justify-content: space-between;
  min-height: 1.5rem;
  width: 100%;
`;

export const SectionTitle = styled(BodyM2)`
  color: ${palette.foreground.primary};
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  text-transform: uppercase;
`;

export const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  width: 100%;
`;

const sharedDividerStyles = css`
  align-self: stretch;
  border: none;
  border-top: 0.0625rem solid ${palette.misc.subtleAlpha};
  height: 0;
  width: 100%;
`;

export const SectionDivider = styled.hr`
  ${sharedDividerStyles}
  margin: 0;
`;

export const ChevronIcon = styled.span<{ $open: boolean }>`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 0.2s ease;
  width: 1rem;
`;

export const Subsection = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: ${spacing[4]} 0 ${spacing[1]};
  width: 100%;
`;

export const SubsectionTitle = styled.div`
  color: ${palette.foreground.primary};
  text-transform: uppercase;
`;

export const SubsectionDivider = styled.hr`
  ${sharedDividerStyles}
  margin: 0;
`;

export const FieldRow = styled.div`
  align-items: center;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  justify-content: space-between;
  min-height: 2.375rem;
  width: 100%;
`;

export const FieldLabel = styled(BodyM1)`
  color: ${palette.foreground.secondary};
  flex: 0 1 auto;
  min-width: 0;
`;

export const FieldTextValue = styled(BodyM1)`
  color: ${palette.foreground.primary};
  flex: 0 1 auto;
  text-align: right;
  word-break: break-word;
`;

export const LongTextField = styled.div`
  align-items: flex-start;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: none;
  min-height: 0;
  padding: 0.125rem 0;
  width: 100%;
`;

export const LongTextLabel = styled(BodyM1)`
  color: ${palette.foreground.secondary};
`;

export const LongTextValue = styled(BodyM1)`
  align-self: stretch;
  color: ${palette.foreground.primary};
  width: 100%;
  word-break: break-word;
`;

export const BadgesRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  flex: 0 1 auto;
  gap: ${spacing[2]};
  justify-content: flex-end;
  max-width: 100%;
`;

export type BadgeVariant = "yes" | "no" | "neutral";

const badgeBackground: Record<BadgeVariant, string> = {
  neutral: palette.misc.catskillWhite,
  no: palette.background.attentionLight,
  yes: palette.background.brandLight,
};

const badgeColor: Record<BadgeVariant, string> = {
  neutral: palette.misc.seaBlue,
  no: palette.foreground.attention,
  yes: palette.foreground.brand,
};

export const ValueBadge = styled.span<{
  $variant?: BadgeVariant;
}>`
  align-items: center;
  background: ${({ $variant = "neutral" }) => badgeBackground[$variant]};
  border-radius: ${borderRadius[8]};
  color: ${({ $variant = "neutral" }) => badgeColor[$variant]};
  display: inline-flex;
  gap: 0.625rem;
  height: 1.5rem;
  min-height: 1.5rem;
  padding: 0 ${spacing[2]};

  & > * {
    color: inherit;
  }
`;

export const DateContainer = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const DateInfoRow = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 1.25rem;
  justify-content: space-between;
  width: 100%;
`;

export const DateInfoLabel = styled.span`
  color: ${palette.foreground.secondary};
`;

export const DateInfoValue = styled.span`
  color: ${palette.foreground.primary};
`;

export const ActionButtonsRow = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: 2rem;
`;

export const ViewButton = styled.button`
  ${buttonOutline}
  align-items: center;
  background: ${palette.background.secondary};
  border-radius: ${borderRadius.round};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  cursor: pointer;
  display: flex;
  height: 2rem;
  justify-content: center;
  padding: 0 ${spacing[3]};
  white-space: nowrap;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;

    &:hover {
      opacity: 0.5;
    }
  }
`;

export const ViewButtonDivider = styled.hr`
  align-self: stretch;
  border: none;
  border-top: 0.0625rem solid ${palette.border.subtle};
  height: 0;
  margin: 0;
  width: 100%;
`;

export const PdfRenderHost = styled.div`
  position: fixed;
  top: 0;
  width: max-content;
  height: max-content;
  overflow: visible;
  pointer-events: none;
  z-index: -1;
`;

export const ClosedBanner = styled.div`
  align-items: flex-start;
  background: ${palette.misc.catskillWhite};
  border-radius: ${borderRadius[12]};
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  padding: ${spacing[3]};
  width: 100%;
`;

export const ClosedBannerIcon = styled.span`
  color: ${palette.foreground.information};
  flex-shrink: 0;
  height: 1.25rem;
  width: 1.25rem;

  & > svg {
    display: block;
    height: 100%;
    width: 100%;
  }
`;

export const ClosedBannerText = styled.p`
  color: ${palette.misc.seaBlue};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  margin: 0;
`;

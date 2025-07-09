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

import { typography } from "@recidiviz/design-system";
import { StylesConfig } from "react-select";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import {
  HeaderCell as DashboardHeaderCell,
  Row,
  Table as DashboardTable,
  TableBody as DashboardTableBody,
  TableHeader as DashboardTableHeader,
} from "../Dashboard/Dashboard.styles";
import { MAX_MODAL_HEIGHT } from "../Modal/Modal";
import { customPalette } from "../styles/palette";
import { OnboardingTopic } from "./CaseOnboarding/types";
import { PDF_PAGE_WIDTH } from "./constants";
import { SelectOption } from "./Form/types";
import { RecommendationSummary } from "./Recommendations/report/Report.styles";
import { FormAttributes, ProfileStrength } from "./types";

const RECOMMENDATION_PANEL_HEIGHT_OFFSET = 244;
const OPPORTUNITY_TABLE_HEIGHT = 525;
const RECOMMENDATION_PANEL_WIDTH = 504;

export const PageContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
`;

export const FullPageContainer = styled.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  background-color: ${palette.white};
  padding: 24px 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
`;

export const Body = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  background-color: ${palette.marble3};
  border: 1px solid ${palette.marble5};
  flex-grow: 1;
  overflow-y: auto;
  overscroll-behavior: auto;
  position: relative;
`;

export const BackLink = styled.div<{ leftMargin?: number }>`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 0 24px;
  margin-bottom: 16px;
  margin-left: ${({ leftMargin }) => leftMargin ?? -7}px;
  color: ${palette.slate85};
  position: relative;

  &:hover {
    cursor: pointer;
  }

  &::before {
    content: "";
    position: absolute;
    border: solid ${palette.slate85};
    border-width: 0 1px 1px 0;
    display: inline-block;
    padding: 3px;
    transform: rotate(135deg);
    left: 10px;
  }
`;

export const ModuleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0 22px 24px 22px;
`;

export const ModuleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: ${palette.white};
  border-radius: 10px;
  padding: 24px;
`;

export const IconWrapper = styled.div``;

/** Case Attributes */

export const CaseAttributes = styled.div`
  padding: 0 24px;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 16px;
`;

export const Name = styled.div`
  ${typography.Serif34}
  color: ${palette.pine2};
`;

export const ID = styled.div`
  color: ${palette.slate85};
  align-self: flex-end;
  margin-bottom: 5px;
`;

export const DueDate = styled.div`
  ${typography.Sans14}
  height: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${palette.pine1};
  background-color: ${customPalette.blue.light1};
  border-radius: 10px;
  padding: 0 8px;
  font-size: 13px;
  line-height: 18px;
  margin-bottom: 5px;
`;

export const CaseAttributesWrapper = styled.div`
  display: flex;
  gap: 24px;
`;

export const AttributeValueWrapper = styled.div`
  ${typography.Body14}
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
`;

export const Attribute = styled.div`
  color: ${palette.slate80};
`;

export const Value = styled.div`
  display: flex;
  gap: 6px;
  color: ${palette.pine2};
  text-transform: capitalize;

  span {
    text-transform: none;
    color: ${palette.slate60};
  }
`;

export const Link = styled.a`
  width: fit-content;
  display: flex;
  gap: 4px;
  text-decoration: none;
  color: ${customPalette.blue.link};
  text-transform: none;

  &:hover {
    cursor: pointer;
    color: ${customPalette.blue.link};
  }

  &:visited,
  &:active {
    color: ${customPalette.blue.link};
  }
`;

export const LinkValue = styled.div`
  color: ${palette.pine4};
  text-transform: none;

  &:hover {
    cursor: pointer;
  }
`;

export const EditCaseDetails = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid ${palette.marble5};
  background: ${palette.white};
  margin-bottom: 15px;
`;

export const ProfileStrengthWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 7px;
`;

const profileStrengthToColor = {
  High: palette.text.links,
  Medium: palette.signal.notification,
  Low: palette.signal.error,
};

export const Indicator = styled.div<{
  profileStrength: ProfileStrength;
}>`
  width: 9px;
  height: 6px;
  background-color: ${({ profileStrength }) =>
    profileStrength !== "Low"
      ? profileStrengthToColor[profileStrength]
      : palette.slate60};
  position: relative;
  margin: 12px;

  &::before {
    content: "";
    width: 9px;
    height: 6px;
    background-color: ${({ profileStrength }) =>
      profileStrength
        ? profileStrengthToColor[profileStrength]
        : palette.slate60};
    position: absolute;
    left: -10px;
    border-radius: 3px 0 0 3px;
  }

  &::after {
    content: "";
    width: 9px;
    height: 6px;
    background-color: ${({ profileStrength }) =>
      profileStrength === "High"
        ? profileStrengthToColor[profileStrength]
        : palette.slate60};
    position: absolute;
    right: -10px;
    border-radius: 0 3px 3px 0;
  }
`;

export const Carot = styled.div<{
  profileStrength: ProfileStrength;
}>`
  display: block;
  width: 0px;
  height: 0px;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgb(0, 51, 49);
  margin-left: 5px;
  position: absolute;
  top: -8px;
  right: ${({ profileStrength }) => {
    if (profileStrength === "Low") return `8px`;
    if (profileStrength === "Medium") return `-2px`;
    if (profileStrength === "High") return `-11px`;
    return 0;
  }};
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  // TODO(#8709): Add color to design system or change to design system color
  color: rgba(0, 17, 51, 1);
  ${typography.Sans14}
`;

export const Text = styled.div`
  span {
    color: green;
  }
`;
export const Caption = styled.div``;

export const EditCaseDetailsButton = styled.button`
  width: fit-content;
  display: flex;
  align-items: center;
  align-self: flex-end;
  border: 1px solid ${palette.slate20};
  border-radius: 32px;
  background-color: ${palette.white};
  color: ${palette.slate85};
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  margin-left: auto;

  &:hover {
    cursor: pointer;
    border: 1px solid ${palette.slate30};
  }
`;

/** Recommendations */

export const Recommendations = styled.div`
  height: 100%;
  min-width: ${RECOMMENDATION_PANEL_WIDTH}px;
  width: ${RECOMMENDATION_PANEL_WIDTH}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  border-left: 1px solid ${palette.marble5};
  background-color: ${palette.white};
  max-height: calc(-${RECOMMENDATION_PANEL_HEIGHT_OFFSET}px + 100vh);
  overflow-y: auto;
  overscroll-behavior: auto;
  position: sticky;
  top: 0;
  left: 100%;
  z-index: 1;
`;

export const RecommendationsContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
`;

export const RecommendationsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  padding-bottom: 50px;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  ${typography.Header24}
  color: ${palette.pine1};
  margin-bottom: 4px;
`;

export const Description = styled.div<{ rightPadding?: number }>`
  color: ${palette.slate85};
  display: flex;
  flex-direction: column;
  padding-right: ${({ rightPadding }) =>
    rightPadding ? `${rightPadding}px` : "inherit"};
`;

export const RecommendationOptionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const RecommendationOption = styled.div<{
  selected?: boolean;
  isDisabled?: boolean;
}>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid ${palette.slate20};
  ${({ selected }) =>
    selected &&
    // TODO(#8709): Add color to design system or change to design system color
    `
    background-color: rgba(43, 105, 105, 0.03);
    border: 1px solid rgba(0, 102, 95, 0.4);
  `}
  ${({ isDisabled }) =>
    isDisabled &&
    `
    opacity: 0.6;
  `}
`;

export const RecommendationDetails = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const RecommendationOptionLabel = styled.label<{ smallFont: boolean }>`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 0;
  color: ${({ smallFont }) => (smallFont ? palette.slate85 : palette.pine2)};

  ${({ smallFont }) => (smallFont ? typography.Sans14 : typography.Sans18)}
`;

export const OpportunitiesSelections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5.5px;
`;

export const OpportunitiesWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 6px;

  svg {
    flex-shrink: 0;
  }
`;

export const OpportunitiesText = styled.div`
  color: ${palette.pine3};
  text-wrap: balance;
`;

export const OpportunitiesCount = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${palette.white};
  background-color: ${palette.pine4};
  border-radius: 100%;
  font-size: 12px;
`;

export const NoOpportunitiesWrapper = styled.div`
  width: 100%;
  height: 430px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${palette.slate60};
  margin-right: 4px;

  span {
    ${typography.Sans18}
    color: ${palette.pine1};
  }
`;

export const NoOpportunitiesTextContainer = styled.div`
  width: 285px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 4px;
`;

export const NoOpportunitiesSelectedText = styled.div`
  color: ${palette.slate60};
  margin-right: 4px;
`;

export const RecommendationOutcome = styled.div`
  display: flex;
  gap: 64px;
`;

export const PercentageWrapper = styled.div``;

export const Percentage = styled.div`
  ${typography.Serif24}
  color: ${palette.pine3};
  margin-bottom: 4px;
`;

export const PercentageLabel = styled.div`
  color: ${palette.slate85};
`;

export const InputSelection = styled.input`
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: ${palette.pine4};
`;

export const RecommendationActionButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 24px 24px 24px;
  border-top: 1px solid ${palette.marble5};
  position: sticky;
  z-index: 1;
  bottom: 0;
  right: 0;
  background-color: ${palette.white};

  @media screen and (max-height: 336px) {
    position: unset;
  }
`;

export const ActionButton = styled.button<{
  kind?: "link" | "bordered";
  fullWidth?: boolean;
}>`
  height: 48px;
  min-width: 117px;
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  justify-content: center;
  align-items: center;
  background-color: ${({ kind }) =>
    kind === "link" || kind === "bordered" ? "transparent" : palette.pine4};
  color: ${({ kind }) =>
    kind === "link" || kind === "bordered" ? palette.slate85 : palette.white};
  border: ${({ kind }) =>
    kind === "bordered" ? `1px solid ${palette.slate20}` : `none`};
  border-radius: 4px;
  ${({ fullWidth }) => fullWidth && `width: 100%;`}

  &:disabled {
    opacity: 0.6;
    border: 1px solid ${palette.slate30};
    background-color: transparent;
    color: ${palette.slate80};
  }
`;

/** Recommendation: Summary and Report */
export const RecommendationSummaryReport = styled.div`
  width: 100%;
  min-height: 100%;
  display: flex;
  justify-content: center;
  background-color: ${palette.white};
  padding: 24px 0;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99;

  & > div:nth-child(2) {
    position: absolute;
    left: 100%;
    top: -200%;
  }
`;

export const SummaryReportWrapper = styled.div`
  width: 568px;
  display: flex;
  flex-direction: column;
  color: ${palette.slate85};
`;

export const SummaryReportTitle = styled(Title)`
  ${typography.Sans24}
  color: ${palette.pine2};
  margin-bottom: 24px;
`;

export const SummaryReportSectionTitle = styled.div`
  ${typography.Sans18}
  color: ${palette.pine2};
  margin-top: 4px;
  margin-bottom: 8px;
`;

export const SectionWrapper = styled.div`
  width: 100%;
  margin-bottom: 32px;
`;

export const SummaryTextAreaWrapper = styled.div`
  margin-bottom: 8px;

  textarea {
    width: 100%;
    height: 185px;
    ${typography.Sans16}
    color: ${palette.slate85};
  }
`;

export const ReportPDFContainer = styled.div``;

// TODO(Recidiviz/recidiviz-data#32716) Refactor and better target the `div > div > div`
export const PlaceholderPdfPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${palette.slate30};
  height: 346px;
  margin-top: 8px;
  margin-bottom: 8px;
  user-select: none;

  ${ReportPDFContainer} {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 24px;
  }

  ${ReportPDFContainer} > div > div > div {
    background: ${palette.white};
    min-width: ${PDF_PAGE_WIDTH}px;
    height: 1335px;
  }

  ${ReportPDFContainer} > div > div {
    display: flex;
    justify-content: center;
    gap: 30px;
  }
`;

export const ButtonWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

/** Insights */

export const InsightsOpportunitiesWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 18px ${RECOMMENDATION_PANEL_WIDTH}px 18px 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: auto;
  position: absolute;
  z-index: 0;
`;

export const Insights = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
`;

export const InsightsHeaderWrapper = styled.div`
  margin-left: 22px;
  padding-right: 50px;
`;

export const AddLsirScoreContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: ${palette.white};
  margin-right: 60px;
  margin-top: 12px;
  border: 1px solid ${palette.slate20};
  border-radius: 10px;
  color: ${palette.pine1};
`;

export const ChartControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Notification = styled.div`
  width: fit-content;
  padding: 10px;
  justify-content: center;
  align-items: center;
  border-radius: 5px;
  color: ${palette.slate80};
  background-color: ${palette.marble5};
`;

export const CarouselButton = styled.div`
  display: flex;
  align-items: center;
  // TODO(#8709): Add color to design system or change to design system color
  background-color: rgba(241, 255, 253, 1);
  color: ${palette.text.links};
  border-radius: 3px;
  border: 1px solid ${palette.text.links};
  padding: 7px;
  user-select: none;

  &:hover {
    cursor: pointer;
  }
`;

export const CarouselButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-right: 24px;
  margin-left: 50px;
  position: absolute;
  right: 0;
  top: -36px;
  z-index: 10;

  ${CarouselButton} > svg {
    stroke: ${palette.text.links};
    stroke-width: 0.5px;
  }

  ${CarouselButton}:nth-of-type(2) > svg {
    rotate: 180deg;
  }
`;

export const Charts = styled.div`
  display: inline-flex;
`;

export const Chart = styled.div<{
  $marginRight?: number;
}>`
  display: flex;
  flex-direction: column;
  height: 555px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 24px;
  border: 1px solid #2b54691a;
  margin-right: ${(props) => props.$marginRight}px;
`;

/** Factors and Needs */
export const FactorsNeedsContainer = styled.div`
  display: flex;
  gap: 24px;
`;

export const FactorsNeedsWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

export const FactorsNeedsTitle = styled.div`
  ${typography.Sans18}
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${palette.pine1};
  border-bottom: 1px solid ${palette.marble5};
  padding-bottom: 8px;
  padding-right: 8px;
`;

export const FactorsNeedsList = styled.div`
  ${typography.Sans14}
  max-height: 170px;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  color: ${palette.pine1};
  overflow-x: scroll;
  overflow-y: hidden;
  scrollbar-gutter: stable;

  /* WebKit browsers (Chrome, Safari, Edge) */
  &::-webkit-scrollbar {
    height: 8px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${palette.slate30};
    border-radius: 4px;
  }

  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: ${palette.slate30};
`;

export const FactorsNeedsListItem = styled.div`
  margin-right: 8px;
  max-width: 220px;
`;

/** Opportunities */

export const Opportunities = styled.div`
  display: flex;
  flex-direction: column;
  margin-right: 22px;
  margin-left: 22px;
`;

export const OpportunitiesTableWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${palette.white};
  border: 1px solid ${palette.marble5};
  padding: 23px 25px;
  margin-top: 12px;
`;

export const OpportunitiesTable = styled.div`
  position: relative;
`;

export const TableWrapper = styled.div`
  width: 100%;
  position: relative;
  height: ${OPPORTUNITY_TABLE_HEIGHT}px;
  overflow-y: scroll;
  border: 0.5px solid ${customPalette.white.white2};
`;

export const OpportunitiesNotAvailable = styled.div`
  width: fit-content;
  display: flex;
  gap: 8px;
  background-color: ${palette.marble5};
  border: 1px solid ${palette.slate85};
  border-radius: 3px;
  padding: 7px 16px;
  color: ${palette.slate85};
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
`;

export const SearchFilter = styled.div`
  display: flex;
  gap: 17px;
  margin-bottom: 10px;
`;

export const Search = styled.div`
  position: relative;

  /* Search icon */
  svg:first-child {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 16px;
  }

  /* Reset search icon */
  svg:nth-of-type(2) {
    cursor: pointer;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 16px;
  }
`;

export const SearchInput = styled.input`
  ${typography.Sans14};
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 36px 12px 34px;
  gap: 6px;
  border-radius: 5px;
  border: 1px solid ${palette.slate20};
  color: ${palette.pine3};
`;

export const Filter = styled.div`
  display: flex;
  gap: 8px;
`;

export const Table = styled(DashboardTable)<{ disabled?: boolean }>`
  border-spacing: 0;
  border: none;

  ${({ disabled }) => disabled && `opacity: 0.5; pointer-events: none;`}
`;

export const TableRow = styled(Row)`
  border-bottom: 1px solid ${customPalette.white.white2};

  &:hover {
    background: ${customPalette.grey.light1};
  }
`;

export const TableHeader = styled(DashboardTableHeader)`
  position: relative;

  tr {
    position: sticky;
    top: 0;
    background: ${customPalette.white.white1};
    box-shadow: inset 0 -1px 0 ${customPalette.white.white2};
  }
`;

export const TableBody = styled(DashboardTableBody)``;

export const HeaderCell = styled(DashboardHeaderCell)`
  font-weight: 500;
`;

export const CaseDetailsApplied = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 1px solid ${customPalette.white.white2};
  border-radius: 10px;
  background-color: ${customPalette.grey.light1};
  margin-bottom: 16px;
`;

export const CaseDetailsAppliedTitle = styled.div`
  font-size: 13px;
  color: ${palette.pine1};
`;

export const CaseDetailsAppliedList = styled.div`
  ${typography.Sans14}
  color: ${palette.slate85};
`;

export const ViewMore = styled.div`
  color: ${palette.signal.notification};
`;

export const InfoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 100%;
  background-color: ${palette.slate60};
  color: ${palette.white};
  ${typography.Sans12}

  &::before {
    content: "i";
  }
`;

export const WarningIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0;
  height: 0;
  border-left: 50px solid transparent;
  border-right: 50px solid transparent;
  border-bottom: 100px solid #007bff;
  border-radius: 50%;
  transform: rotate(45deg);
  background-color: ${palette.slate60};
  color: ${palette.white};
  ${typography.Sans12}

  &::before {
    content: "i";
  }
`;

export const AddRecommendationButton = styled(EditCaseDetailsButton)<{
  isAdded?: boolean;
}>`
  display: flex;
  justify-content: center;
  gap: 8px;
  min-width: 200px;
  height: 32px;
  text-align: center;

  &:disabled {
    cursor: not-allowed;
    color: ${palette.slate60};
    svg path {
      ${({ isAdded }) =>
        isAdded
          ? // TODO(#8709): Add color to design system or change to design system color
            `fill: rgba(134, 152, 161, 1);`
          : `stroke: rgba(134, 152, 161, 1);`}
    }
    ${({ isAdded }) => isAdded && `border: 1px solid transparent;`};
  }

  ${({ isAdded }) =>
    isAdded &&
    `
      background-color: ${palette.slate10}; 
      border: 1px solid transparent;
      &:not(:disabled):hover {
        background-color: ${palette.white};
        border: 1px solid ${palette.slate30};
      }
    `}
`;

const ChipColors = {
  green: `color: ${palette.white}; background-color: ${palette.pine4}; `,
  teal: `color: ${palette.pine2}; background-color: ${customPalette.teal};`,
};

export const Chip = styled.div<{ color?: keyof typeof ChipColors }>`
  ${({ color }) => (color ? ChipColors[color] : ChipColors["green"])};
  width: fit-content;
  border-radius: 10px;
  padding: 4px 8px;
  ${typography.Sans12}
`;

export const NeedsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`;

export const Need = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

/** Edit Case Details Modal */

export const ModalHeaderWrapper = styled.div`
  width: 100%;
  background: ${palette.white};
`;

export const ModalHeader = styled.div`
  ${typography.Sans24}
  color: ${palette.pine2};
  margin-bottom: 4px;
  padding-right: 32px;
`;

export const ModalDescription = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-bottom: 32px;
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  margin: 32px 0;
`;

export const SectionRowWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 32px;
`;

export const SectionContent = styled.div<{ isLink?: boolean }>`
  ${typography.Sans14}
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: ${palette.slate85};
  line-height: 21px;

  ${({ isLink }) =>
    isLink &&
    `
      width: fit-content;
      color: ${palette.pine4};
      border-bottom: 1px solid ${palette.pine4};

      &:hover {
        cursor: pointer;
             color: ${palette.pine2};
      }
    `}
`;

export const SectionLabel = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-bottom: 4px;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  margin-right: 11px;
  margin-left: 1px;
`;

export const FormScrollWrapper = styled.div`
  height: calc(${MAX_MODAL_HEIGHT} - 35vh);
  overflow-y: auto;
  margin-bottom: 28px;
`;

export const InputContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

export const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
`;

export const Input = styled.input<{ hasError?: boolean }>`
  padding: 12px 16px;
  border: 1px solid ${palette.slate20};
  border-radius: 8px;
  color: ${palette.pine3};
  font-size: 13px;
  font-weight: 500;

  /* Chrome, Safari, Edge, Opera */
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  &[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
  }

  &:disabled {
    color: ${palette.pine3};
    background-color: ${palette.slate10};
  }

  ${({ hasError }) =>
    hasError &&
    `
      background-color: ${customPalette.lightred};
      border-color: ${palette.signal.error};
    `}
`;

export const ViolentOrSexOffenseCheckboxContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 16px;
`;

export const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    color: ${palette.slate85};
    margin: 0;
  }

  input {
    accent-color: ${palette.pine4};
  }
`;

export const TextArea = styled.textarea<{ hasError?: boolean }>`
  min-height: 117px;
  padding: 12px 16px;
  border: 1px solid
    ${({ hasError }) => (hasError ? palette.signal.error : palette.slate20)};
  border-radius: 8px;
  color: ${palette.pine3};
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;

  &::placeholder {
    ${typography.Sans16}
    color: ${palette.slate60};
  }

  &:focus {
    border-color: ${({ hasError }) =>
      hasError ? palette.signal.error : palette.pine4};
  }
`;

export const InputLabel = styled.label`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;

  span {
    color: ${palette.slate60};
    font-style: italic;
  }
`;

export const InputDescription = styled.div`
  ${typography.Sans16};
  color: ${palette.slate60};
  margin-top: 4px;
  ${typography.Sans14}
`;

export const InputAlert = styled.div`
  ${typography.Sans14};
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: ${customPalette.green.light3};
  border: 1px solid ${palette.pine4};
  border-radius: 4px;
  padding: 12px;
  margin-top: 12px;
  color: ${palette.pine4};

  svg {
    margin-right: 8px;
  }

  svg > path {
    fill: ${palette.pine4};
    fill-opacity: 1;
  }
`;

export const InputAlertMessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ErrorMessage = styled.div`
  display: flex;
  margin-top: 6px;
  color: ${palette.signal.error};
  gap: 8px;
`;

export const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 18px 12px 6px 12px;
  color: ${palette.slate70};
`;

export const OptionFrequencyLabelWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

export const OptionLabel = styled.div``;

export const FrequencyLabel = styled.div`
  margin-left: 35px;
  white-space: nowrap;
`;

export const MultiSelectContainer = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: 4px;
  margin-bottom: 16px;
`;

export const SelectChip = styled.div<{
  selected?: boolean;
  isNotSureYetOption: boolean;
}>`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 9px 12px;
  gap: 6px;
  background-color: ${({ selected }) =>
    selected ? customPalette.green.light3 : "none"};
  color: ${({ selected }) => (selected ? palette.pine3 : palette.slate85)};
  border: 1px solid
    ${({ selected }) => (selected ? palette.pine4 : palette.slate20)};
  border-radius: 32px;
  ${typography.Sans14}

  &:hover {
    cursor: pointer;
  }

  ${({ selected, isNotSureYetOption }) =>
    selected &&
    isNotSureYetOption &&
    `
      background-color: ${customPalette.green.light2};
      border: 1px solid ${palette.slate20};
      path {
        fill: ${palette.slate60};
      }
  `}
`;

export const InputRowWrapper = styled.div`
  width: 100%;
  display: flex;
  gap: 18px;
`;

export const RollupLoading = styled(InputDescription)`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
`;

export const RollupOffenseCategory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 40px;
  margin-top: 24px;

  span {
    ${typography.Sans14}
    color: ${palette.pine3};
  }
`;

export const NestedWrapper = styled.div`
  margin-left: 40px;
`;

export const ActionButtonRowWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  border-top: 1px solid ${palette.slate20};
  padding: 10px 40px;
  position: absolute;
  width: 100%;
  left: 0;
  margin-top: 16px;
`;

export const StickyActionButtonWrapper = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  background: ${palette.white};
  border-top: 1px solid ${palette.slate20};
  padding: 10px 40px;
  position: absolute;
  width: 100%;
  left: 0;
  margin-top: 16px;
  z-index: 99;
`;

export const dropdownStyles: StylesConfig<SelectOption, boolean> = {
  control: (styles, { isFocused, isDisabled }) => ({
    ...styles,
    borderColor: isFocused ? palette.pine4 : palette.slate20,
    boxShadow: isFocused ? `0 0 0 1px  ${palette.pine4}` : "none",
    backgroundColor: isDisabled ? palette.slate10 : palette.white,
    ":hover": {
      borderColor: palette.pine4,
    },
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    color: palette.pine3,
    // eslint-disable-next-line no-nested-ternary
    backgroundColor: isFocused
      ? palette.slate10
      : isSelected
        ? customPalette.green.light3
        : undefined,
    ":active": {
      backgroundColor: palette.slate10,
    },
  }),
  singleValue: (styles) => ({ ...styles, color: palette.pine3 }),
};

export const multiDropdownStyles: StylesConfig<SelectOption, true> = {
  ...dropdownStyles,
  multiValue: (styles) => {
    return {
      ...styles,
      backgroundColor: customPalette.green.light3,
      borderRadius: "35px",
      border: `1px solid ${palette.pine4}`,
      color: palette.pine3,
      padding: "0px 4px",
      display: "flex",
      alignItems: "center",
    };
  },
  multiValueLabel: (styles) => {
    return {
      ...styles,
      color: palette.pine3,
      marginRight: "3px",
    };
  },
  multiValueRemove: (styles) => ({
    ...styles,
    color: palette.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ":hover": {
      backgroundColor: "none",
      color: "white",
    },
    "::before": {
      content: `""`,
      position: "absolute",
      width: "16px",
      height: "16px",
      backgroundColor: palette.pine3,
      borderRadius: "100%",
    },
    "> svg": {
      zIndex: 0,
    },
  }),
};

/** Onboarding */

export const OnboardingContainer = styled.div`
  width: 567px;
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const OnboardingHeaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const OnboardingHeader = styled(ModalHeader)`
  font-weight: 500;
`;

export const OnboardingDescription = styled(Description)``;

export const OnboardingCompleteLoading = styled.div`
  width: 443px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;

  span {
    ${typography.Sans24}
    color: ${palette.slate60};
  }
`;

export const OnboardingCompleteMessage = styled.div`
  ${typography.Sans24}
  color: ${palette.slate85};
  text-align: center;
`;

const onboardingTopicToBarWidthPercentage = {
  [OnboardingTopic.OffenseLsirScore]: 20,
  [OnboardingTopic.PrimaryNeeds]: 40,
  [OnboardingTopic.ProtectiveFactors]: 60,
  [OnboardingTopic.AdditionalNeeds]: 80,
  [OnboardingTopic.Done]: 100,
};

export const OnboardingProgressBar = styled.div<{
  topic: FormAttributes["currentOnboardingTopic"];
}>`
  height: 16px;
  width: 100%;
  background-color: ${palette.slate10};
  position: absolute;
  top: 0;

  &::after {
    content: "";
    width: ${({ topic }) =>
      topic
        ? onboardingTopicToBarWidthPercentage[topic]
        : onboardingTopicToBarWidthPercentage[OnboardingTopic.Done]}%;
    height: 16px;
    position: absolute;
    top: 0;
    background-color: ${palette.signal.highlight};
  }
`;

export const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-left: auto;
  margin-top: 20px;
`;

export const Pages = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: ${palette.text.normal};
`;

export const PaginationButton = styled.div<{ disabled?: boolean }>`
  width: 32px;
  height: 32px;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;

  &:hover {
    cursor: pointer;
  }
  svg {
    opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  }
`;

export const DisclaimerWrapper = styled.div`
  ${typography.Sans12}
  color: ${palette.slate85};
  margin-top: 32px;
  padding: 0 24px;
  font-weight: 500;
`;

export const ExternalOpportunityButton = styled.button`
  padding: 10px 20px;
  border: 1px solid ${customPalette.white.white2};
  border-radius: 4px;
  width: max-content;
  display: flex;
  align-items: center;
`;

export const ReportSummaryOverflowDetector = styled(RecommendationSummary)`
  position: absolute;
  top: 0;
  left: 0;
  width: 835px;
  height: auto;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  visibility: hidden;
  border: 1px solid red;
`;

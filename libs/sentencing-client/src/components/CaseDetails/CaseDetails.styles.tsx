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

import { palette, typography } from "@recidiviz/design-system";
import { StylesConfig } from "react-select";
import styled from "styled-components/macro";

import { customPalette } from "../styles/palette";
import { ProfileStrength } from "./types";

export const PageContainer = styled.div`
  width: 100%;
  height: calc(100vh - 64px);
  padding: 24px 0;
  display: flex;
  flex-direction: column;
`;

export const Body = styled.div`
  width: 100%;
  display: flex;
  background-color: rgba(244, 245, 246, 1);
  border: 1px solid ${palette.marble5};
  flex-grow: 1;
`;

export const BackLink = styled.div`
  width: fit-content;
  display: flex;
  align-items: center;
  padding: 0 24px;
  margin-bottom: 16px;
  margin-left: 16px;
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
  color: ${palette.pine1};
  background-color: ${customPalette.blue1};
  border-radius: 10px;
  padding: 4px 10px;
  font-size: 13px;
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
  align-items: center;
  gap: 6px;
  color: ${palette.pine2};
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
  color: rgba(0, 17, 51, 1);
  ${typography.Sans14}
`;

export const Text = styled.div`
  span {
    color: green;
  }
`;
export const Caption = styled.div``;

export const EditCaseDetailsButton = styled.div`
  width: fit-content;
  height: 40px;
  display: flex;
  align-items: center;
  align-self: flex-end;
  border: 1px solid ${palette.slate20};
  border-radius: 32px;
  color: ${palette.slate85};
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  margin-left: auto;

  &:hover {
    cursor: pointer;
  }
`;

/** Recommendations */

export const Recommendations = styled.div`
  height: 100%;
  min-width: 504px;
  width: 504px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  border-right: 1px solid ${palette.marble5};
  background-color: ${palette.white};
`;

export const RecommendationsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 26px;
`;

export const Header = styled.div``;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  ${typography.Header24}
  color: ${palette.pine1};
  margin-bottom: 4px;
`;

export const Description = styled.div`
  color: ${palette.slate85};
`;

export const RecommendationOption = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid ${palette.slate20};
  ${({ selected }) =>
    selected &&
    `
    background-color: rgba(43, 105, 105, 0.03);
    border: 1px solid rgba(0, 102, 95, 0.4);
  `}
`;

export const RecommendationDetails = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const RecommendationOptionLabel = styled.div`
  ${typography.Sans18}
  color: ${palette.pine2};
`;

export const OpportunitiesSelections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5.5px;
`;

export const OpportunitiesWrapper = styled.div`
  display: flex;
  align-items: center;
`;

export const OpportunitiesText = styled.div`
  color: ${palette.pine2};
  margin-right: 4px;
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

export const NoOpportunitiesSelectedText = styled.div`
  color: ${palette.slate85};
  margin-right: 4px;
`;

export const RecommendationOutcome = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const PercentageWrapper = styled.div``;

export const Percentage = styled.div`
  ${typography.Sans24}
  font-weight: 600;
  color: ${palette.pine2};
`;

export const PercentageLabel = styled.div`
  color: ${palette.slate85};
`;

export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  margin-top: 2px;
  accent-color: ${palette.pine4};
`;

export const ActionButtons = styled.div`
  padding: 10px 24px;
  border-top: 1px solid ${palette.marble5};
`;

export const ActionButton = styled.button<{ kind?: "link" }>`
  display: flex;
  padding: 12px 32px;
  justify-content: center;
  align-items: center;
  background-color: ${({ kind }) =>
    kind === "link" ? "transparent" : palette.pine4};
  color: ${({ kind }) => (kind === "link" ? palette.slate85 : palette.white)};
  border: none;
  border-radius: 4px;
`;

/** Insights */

export const InsightsOpportunitiesWrapper = styled.div`
  max-height: calc(100vh - 64px - 250px);
  display: flex;
  flex-direction: column;
  padding: 18px 22px;
  overflow-x: hidden;
  overflow-y: auto;
`;

export const Insights = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
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

export const CarouselButtons = styled.div`
  display: flex;
  gap: 4px;
`;

export const CarouselButton = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(241, 255, 253, 1);
  color: ${palette.text.links};
  border-radius: 3px;
  border: 1px solid ${palette.text.links};
  padding: 7px;
`;

export const Charts = styled.div`
  overflow-x: hidden;
`;

/** Opportunities */

export const Opportunities = styled.div`
  display: flex;
  flex-direction: column;
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

export const TableWrapper = styled.div<{ disabled?: boolean }>`
  ${({ disabled }) => disabled && `opacity: 0.5;`}
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
  z-index: 99;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

export const SearchFilter = styled.div`
  display: flex;
  gap: 17px;
  margin-bottom: 10px;
`;

export const Search = styled.div`
  display: flex;
  width: 373px;
  padding: 12px 8px;
  align-items: center;
  gap: 6px;
  border-radius: 5px;
  border: 1px solid ${palette.slate20};
`;

export const Filter = styled.div`
  display: flex;
  gap: 8px;
`;

export const Table = styled.table`
  border-spacing: 0px;
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
  margin-bottom: 15px;
  background-color: transparent;
  text-align: left;

  &,
  tr {
    border: 1px solid ${palette.marble5};
  }

  tr:nth-child(2) {
    background-color: ${palette.slate10};
  }

  thead {
    background-color: ${palette.marble2};
    border-bottom: 1px solid ${palette.marble5};
  }

  th,
  td {
    border: none;
    padding: 16px;
  }
`;

export const HeaderCell = styled.th`
  font-weight: bold;
  border: 1px solid #cccccc;
  padding: 8px;
  color: ${palette.pine1};

  &:first-child {
    width: 25%;
  }
`;

export const Cell = styled.td`
  border: 1px solid #cccccc;
  padding: 8px;
  color: ${palette.slate80};

  &:first-child {
    color: ${palette.signal.notification};
  }

  &:last-child {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
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
  min-width: 180px;
  text-align: center;
  border-radius: 32px;
  padding: 8px 16px;
  ${({ isAdded }) => isAdded && `background-color: ${palette.slate10};`}
`;

export const Chip = styled.div`
  background-color: ${palette.pine4};
  color: ${palette.white};
  border-radius: 10px;
  padding: 4px 8px;
  ${typography.Sans12}
  font-size: 10px;
`;

/** Edit Case Details Modal */

export const ModalHeader = styled.div`
  ${typography.Sans24}
  color: ${palette.pine2};
  margin-bottom: 4px;
`;

export const ModalDescription = styled.div`
  ${typography.Sans14}
  color: ${palette.slate70};
  margin-bottom: 32px;
`;

export const Form = styled.form``;

export const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
`;

export const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid ${palette.slate20};
  border-radius: 8px;
  color: ${palette.pine3};
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
`;

export const TextArea = styled.textarea`
  min-height: 117px;
  padding: 12px 16px;
  border: 1px solid ${customPalette.green.light4};
  border-radius: 8px;
  color: ${palette.pine3};
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  background-color: ${customPalette.green.light1};
`;

export const InputLabel = styled.label`
  ${typography.Sans16}
  color: ${palette.pine1};
  margin-bottom: 8px;
`;

export const InputDescription = styled.div`
  color: ${palette.slate60};
  ${typography.Sans14}
`;

export const MultiSelectContainer = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  align-content: center;
  gap: 4px;
`;

export const MultiSelectChip = styled.div<{
  selected?: boolean;
  isNotSureYetOption: boolean;
}>`
  width: fit-content;
  display: flex;
  padding: 9px 12px;
  align-items: center;
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
      border: none;
      path {
        fill: ${palette.slate60};
      }
  `}
`;

export const NestedWrapper = styled.div`
  margin-top: 24px;
  margin-left: 40px;
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

export const dropdownStyles: StylesConfig<unknown, true> = {
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
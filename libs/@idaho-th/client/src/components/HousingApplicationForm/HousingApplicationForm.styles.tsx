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

import { BodyM1, BodyS1, borderRadius, palette, spacing } from "../../styles";
import AlertIcon from "../assets/tabler-icon-alert-triangle.svg?react";

export const Card = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: none;
  height: 100%;
  min-width: 0;
  padding: 0;
  width: clamp(0rem, calc(56vw - 0.75rem), 45rem);
`;

export const Header = styled.div`
  align-items: center;
  align-self: stretch;
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: row;
  height: 3rem;
  justify-content: space-between;
  padding: ${spacing[5]} ${spacing[5]} ${spacing[3]} ${spacing[4]};
  width: 100%;
`;

export const PageIndicator = styled.div`
  color: ${palette.misc.black};
  height: 1rem;
  line-height: 1rem;
  width: auto;
`;

export const CloseButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  padding: 0;
  width: 1rem;

  & > svg {
    height: 1rem;
    width: 1rem;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
`;

export const Body = styled.div`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${spacing[7]};
  height: auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior-y: contain;
  padding: ${spacing[3]} ${spacing[4]} ${spacing[3]} ${spacing[4]};
  width: 100%;
`;

export const Section = styled.section`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[5]};
  max-width: 100%;
  width: 100%;
`;

export const ImportantFieldsInputGroup = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex: none;
  gap: ${spacing[4]};
  width: 100%;
`;

export const ImportantFieldsRow = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing[3]};
  width: 100%;

  @media (max-width: 768px) {
    & > * {
      flex: 1 1 100%;
    }
  }
`;

export const SubsectionTitle = styled.div`
  color: ${palette.foreground.primary};
  height: 1rem;
  line-height: 1rem;
  text-transform: uppercase;
`;

export const Subsection = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  width: 100%;
`;

export const ColumnGroup = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: ${spacing[4]};
  width: 100%;
`;

export const FullWidthRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${spacing[4]};
  width: 100%;

  @media (max-width: 768px) {
    & > * {
      flex: 1 1 100%;
    }
  }
`;

export const Row = styled.div<{ $gap?: string }>`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: ${({ $gap }) => $gap ?? spacing[4]};
  height: auto;
  width: 100%;

  @media (max-width: 768px) {
    & > * {
      flex: 1 1 100%;
    }
  }
`;

export const Field = styled.div<{ $maxWidth?: string }>`
  align-items: flex-start;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: ${spacing[1]};
  height: auto;
  min-height: 4rem;
  min-width: 0;
  width: 100%;
  ${({ $maxWidth }) =>
    $maxWidth &&
    css`
      max-width: ${$maxWidth};
    `}

  @media (max-width: 768px) {
    max-width: none;
  }
`;

export const TabletView = styled(Body)<{ $isTablet: boolean }>`
  ${({ $isTablet }) =>
    $isTablet &&
    css`
      & ${Field} {
        flex: none;
      }
    `}
`;

export const LabelRow = styled.div`
  align-items: flex-start;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: auto;
  min-height: 1.25rem;
`;

export const Label = styled.label`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: flex-start;
  gap: ${spacing[1.5]};
  min-width: 0;
  white-space: normal;
`;

export const QuestionNumber = styled.span`
  color: ${palette.misc.primaryMuted};
`;

export type InputVariant = "valid" | "warning" | "error";

const variantBorderColor: Record<InputVariant, string> = {
  error: palette.foreground.attention,
  warning: palette.misc.strongAmber,
  valid: palette.foreground.brand,
};

const formControlHeight = "2.5rem";

const formControlBase = css<{ $variant: InputVariant }>`
  align-self: stretch;
  background: ${palette.background.secondary};
  border: 0.0625rem solid ${({ $variant }) => variantBorderColor[$variant]};
  border-radius: ${borderRadius[8]};
  box-sizing: border-box;
  color: ${palette.foreground.primary};
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  width: 100%;
`;

export const AlertTriangleIcon = styled(AlertIcon)`
  flex: none;
  height: 0.875rem;
  width: 0.875rem;

  & path {
    stroke: ${palette.foreground.attention};
  }
`;

export const DropdownWrapper = styled.div`
  position: relative;
  width: 100%;
`;

export const DropdownMenu = styled.div`
  align-items: flex-start;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[4]};
  top: calc(100% + ${spacing[2]});
  border: 0.0625rem solid ${palette.misc.subtleAlpha};
  box-shadow: 0.1875rem 0.3125rem 1.875rem 0.3125rem ${palette.misc.shadowFaint};
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
  left: 0;
  max-height: 20.5rem;
  overflow-x: hidden;
  overflow-y: auto;
  padding: ${spacing[2]};
  position: absolute;
  right: 0;
  scrollbar-width: thin;
  width: 100%;
  z-index: 20;

  &[hidden] {
    display: none;
  }
`;

export const MultiSelectDropdownMenu = styled.div`
  align-items: stretch;
  background: ${palette.background.primary};
  border-radius: ${borderRadius[20]};
  box-shadow: 0.1875rem 0.1875rem 1.875rem 0.3125rem ${palette.misc.shadowFaint};
  display: flex;
  flex-direction: column;
  gap: 0;
  left: 0;
  max-height: 20rem;
  overflow: hidden;
  padding: ${spacing[2]} ${spacing[3]};
  position: absolute;
  right: 0;
  top: calc(100% + ${spacing[2]});
  width: 100%;
  z-index: 20;
`;

export const MultiSelectDropdownOptions = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: ${spacing[1]};
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-color: ${palette.misc.jupiter} transparent;
  scrollbar-width: thin;
  width: 100%;

  &::-webkit-scrollbar {
    width: 0.375rem;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${palette.misc.jupiter};
    border-radius: ${borderRadius.round};
  }
`;

export const MultiSelectDropdownFooter = styled.div`
  align-items: center;
  background: ${palette.background.primary};
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  gap: 0.625rem;
  justify-content: space-between;
  padding: ${spacing[2]} 0 0;
  width: 100%;
`;

const multiSelectFooterButtonCss = css`
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  font-size: 0.875rem;
  line-height: 1.25rem;
  white-space: nowrap;

  &:focus-visible {
    outline-offset: 0.125rem;
    outline: 0.125rem solid ${palette.border.brand};
  }
`;

export const MultiSelectDropdownClearButton = styled.button`
  ${multiSelectFooterButtonCss}
  color: ${palette.foreground.attention};
  font-weight: 500;
`;

export const MultiSelectDropdownCloseButton = styled.button`
  ${multiSelectFooterButtonCss}
  color: ${palette.foreground.secondary};
  font-weight: 400;
`;

export const DropdownMenuItem = styled.button`
  align-items: center;
  background-color: transparent;
  border: none;
  box-shadow: none;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: 2.5rem;
  outline: none;
  padding: ${spacing[2]} ${spacing[3]};
  transition: background-color 0.2s ease;
  width: 100%;

  &:hover {
    background-color: ${palette.state.brandHover};
  }

  &:focus,
  &:focus-visible {
    outline: none;
  }
`;

export const DropdownCheckbox = styled.span<{ $checked: boolean }>`
  align-items: center;
  background: ${({ $checked }) =>
    $checked ? palette.background.brand : palette.background.secondary};
  border: ${({ $checked }) =>
    $checked ? "none" : `0.0625rem solid ${palette.misc.subtleAlpha}`};
  border-radius: 0.3125rem;
  display: inline-flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  position: relative;
  width: 1rem;

  ${({ $checked }) =>
    $checked &&
    css`
      &::after {
        content: "";
        position: absolute;
        width: 0.375rem;
        height: 0.5625rem;
        border: solid ${palette.background.primary};
        border-width: 0 1.5px 1.5px 0;
        transform: rotate(45deg) translateY(-0.0625rem) translateX(-0.0625rem);
      }
    `}
`;

export const DropdownMenuItemLabel = styled(BodyM1)<{ $checked?: boolean }>`
  color: ${({ $checked }) =>
    $checked ? palette.foreground.secondary : palette.foreground.primary};
  flex: 1;
  font-style: normal;
  text-align: left;
`;

export const SelectDropdownMenuItemLabel = styled(BodyS1)`
  flex: 1;
  font-style: normal;
  text-align: left;
`;

export const SelectDropdownOptionCheck = styled.span<{ $selected: boolean }>`
  align-items: center;
  display: flex;
  flex: none;
  height: 1rem;
  justify-content: center;
  position: relative;
  width: 1rem;

  & svg {
    display: block;
    flex: none;
    height: 1rem;
    visibility: ${({ $selected }) => ($selected ? "visible" : "hidden")};
    width: 1rem;
  }

  & path {
    stroke: ${palette.foreground.brand};
    stroke-opacity: 1;
  }
`;

export const SelectDropdownMenuItem = styled.button`
  align-items: center;
  background-color: transparent;
  border: none;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  gap: ${spacing[2]};
  height: 100%;
  min-height: 2rem;
  outline: none;
  padding: 0;
  transition: background-color 0.2s ease;
  width: 100%;

  &:hover {
    background-color: ${palette.state.brandHover};

    ${SelectDropdownMenuItemLabel} {
      color: ${palette.foreground.primary};
    }
  }
`;

export const Input = styled.input<{ $variant: InputVariant }>`
  ${formControlBase}
  height: ${formControlHeight};
  padding: ${spacing[3]};
`;

export const Textarea = styled.textarea<{ $variant: InputVariant }>`
  ${formControlBase}
  font-family: inherit;
  min-height: ${formControlHeight};
  padding: ${spacing[3]};
  resize: none;
  overflow: auto;
  scrollbar-color: ${palette.misc.jupiter} transparent;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 0.5rem;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
    border-radius: ${borderRadius[8]};
    margin: ${spacing[3]};
  }

  &::-webkit-scrollbar-thumb {
    background: ${palette.misc.jupiter};
    border-radius: ${borderRadius.round};
    border: 0.125rem solid ${palette.background.secondary};
  }

  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

export const DropdownInput = styled(Input)`
  background-image: url("data:image/svg+xml,%3Csvg%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2016%2016'%20fill%3D'none'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Cpath%20d%3D'M4%206l4%204%204-4'%20stroke%3D'%239AA9B1'%20stroke-width%3D'1.5'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%2F%3E%3C%2Fsvg%3E");
  background-position: right ${spacing[3]} center;
  background-repeat: no-repeat;
  background-size: 1rem 1rem;
  cursor: pointer;
  padding: 0 ${spacing[8]} 0 ${spacing[3]};
`;

export const DateCalendarIcon = styled.span`
  align-items: center;
  color: ${palette.foreground.tertiary};
  display: flex;
  justify-content: center;

  & svg {
    display: block;
    height: 1rem;
    width: 1rem;
  }
`;

export const DatePickerShell = styled.div`
  width: 100%;

  .react-datepicker-wrapper,
  .react-datepicker__input-container {
    display: block;
    position: relative;
    width: 100%;
  }

  .react-datepicker__calendar-icon {
    cursor: pointer;
    height: 1rem;
    left: auto;
    margin: 0;
    padding: 0;
    position: absolute;
    right: ${spacing[3]};
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    z-index: 1;
  }

  .react-datepicker__view-calendar-icon input {
    padding-left: ${spacing[3]};
    padding-right: ${spacing[8]};
  }

  .idaho-th-housing-datepicker {
    z-index: 999;
  }
`;

export const Select = styled.select<{ $variant: InputVariant }>`
  ${formControlBase}
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg%20width%3D'16'%20height%3D'16'%20viewBox%3D'0%200%2016%2016'%20fill%3D'none'%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%3E%3Cpath%20d%3D'M4%206l4%204%204-4'%20stroke%3D'%239AA9B1'%20stroke-width%3D'1.5'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%2F%3E%3C%2Fsvg%3E");
  background-position: right ${spacing[3]} center;
  background-repeat: no-repeat;
  background-size: 1rem 1rem;
  height: ${formControlHeight};
  padding: 0 ${spacing[8]} 0 ${spacing[3]};
`;

export const Footer = styled.div`
  align-items: center;
  align-self: stretch;
  box-sizing: border-box;
  display: flex;
  flex: none;
  flex-direction: row;
  gap: ${spacing[3]};
  height: 4.75rem;
  justify-content: flex-end;
  padding: ${spacing[3]} ${spacing[5]} ${spacing[5]} ${spacing[4]};
  width: 100%;
`;

const stepNavigationButtonCss = css`
  align-items: center;
  border: none;
  border-radius: ${borderRadius.round};
  cursor: pointer;
  display: flex;
  flex: none;
  flex-direction: row;
  font-size: 1rem;
  font-style: normal;
  font-weight: 600;
  gap: ${spacing[2]};
  height: 2.75rem;
  justify-content: center;
  line-height: 1.125rem;
  min-height: 2.75rem;
  padding: 0 ${spacing[5]};
`;

export const BackButton = styled.button`
  ${stepNavigationButtonCss}
  background: ${palette.background.secondary};
  color: ${palette.foreground.primary};
  width: 4.875rem;
`;

export const NextButton = styled.button`
  ${stepNavigationButtonCss}
  background: ${palette.background.brand};
  color: ${palette.foreground.onBrand};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

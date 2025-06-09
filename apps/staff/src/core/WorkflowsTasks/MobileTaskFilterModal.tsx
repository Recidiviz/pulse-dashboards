// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { Modal, Serif24, spacing, typography } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import Checkbox from "../../components/Checkbox";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import { ModalCloseButton } from "../CaseloadSelect";
import {
  TaskFilterField,
  TaskFilterOption,
  TaskFilterType,
} from "../models/types";
import { FilterGroup, FilterGroupHeader } from "./TaskFilterDropdown";

const FullScreenModal = styled(Modal)`
  .ReactModal__Content {
    max-width: unset;
    max-height: unset;
    width: 100%;
    height: 100%;
    padding: 1rem;
    overflow: hidden;
  }
`;

const TopGradient = styled.div`
  position: sticky;
  top: -${rem(1)};
  left: 0;
  background: linear-gradient(${palette.white}, rgba(255, 0, 0, 0));
  height: ${rem(spacing.md)};
  width: calc(100% - 2rem);
  z-index: 1;
`;

const BottomGradient = styled.div`
  position: absolute;
  bottom: ${rem(40)};
  height: ${rem(spacing.xxl)};
  width: calc(100% - 2rem);
  background: linear-gradient(rgba(255, 0, 0, 0), ${palette.white});
`;

const ScrollableContainer = styled.div`
  overflow-y: scroll;
  width: 100%;
  padding-bottom: ${rem(spacing.md)};
`;

const ModalCloseIcon = styled.i`
  vertical-align: baseline;
  margin-right: ${rem(spacing.xs)};
`;

const ModalHeaderText = styled(Serif24)`
  color: ${palette.pine2};
`;

const ModalContents = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(spacing.sm)};
`;

// TODO(#8355) Refactor the checkbox component to be resizable via prop,
// and put it in the design system
const BiggerCheckboxContainer = styled.div`
  & .Checkbox__container {
    width: ${rem(20)} !important;
    height: ${rem(20)};
    margin: unset;
  }

  & .Checkbox__box {
    width: ${rem(20)};
    height: ${rem(20)};
    &::after {
      left: 6px;
      top: 1px;
      width: 6px;
      height: 13px;
    }
  }
`;

// unset default button styles
const FilterOptionRow = styled.button`
  border: unset;
  background-color: unset;
  text-align: left;

  ${typography.Sans16}

  margin-right: ${rem(12)};
  margin-bottom: ${rem(6)};
  display: flex;
  justify-content: space-between;
`;

const FilterCount = styled.div<{ $isZero: boolean }>`
  color: ${({ $isZero }) => ($isZero ? palette.slate30 : palette.pine4)};
`;

const FilterOption = styled.div`
  width: auto;
  max-width: 90%;
  display: flex;
  gap: 8px;
`;

const FilterOptionText = styled.div`
  color: ${palette.slate85};
  white-space: wrap;
`;

const MobileClearAllButton = styled.button`
  ${typography.Sans14}

  z-index: 1;

  width: 100%;
  height: ${rem(32)};
  line-height: ${rem(32)};
  padding: 0 ${rem(spacing.md)};

  text-transform: uppercase;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;

  border: none;
  background-color: ${palette.white};
  color: ${palette.pine4};

  transition-property: background-color;
  transition-timing-function: ease-in-out;
  transition-duration: 0.15s;

  &:active {
    outline: none;
    background-color: ${palette.slate20};
    cursor: pointer;
  }
`;

const MobileTaskFilterItem = observer(function MobileTaskFilterItem({
  option,
  onClick,
  checked,
  count,
}: {
  option: TaskFilterOption;
  onClick: () => void;
  checked: boolean;
  count: number;
}) {
  return (
    <FilterOptionRow
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={checked && count === 0}
    >
      <FilterOption>
        <BiggerCheckboxContainer>
          <Checkbox
            checked={checked}
            value={option.value}
            disabled={checked && count === 0}
          />
        </BiggerCheckboxContainer>
        <FilterOptionText>{option.label ?? option.value}</FilterOptionText>
      </FilterOption>
      {checked && <FilterCount $isZero={count === 0}>{count}</FilterCount>}
    </FilterOptionRow>
  );
});

const MobileClearAll = observer(function ClearAll({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  if (presenter.allFiltersSelected) {
    return (
      <MobileClearAllButton onClick={() => presenter.clearFilters()}>
        Clear all filters
      </MobileClearAllButton>
    );
  }

  return (
    <MobileClearAllButton onClick={() => presenter.resetFilters()}>
      Select all filters
    </MobileClearAllButton>
  );
});

const MobileTaskFilterGroup = observer(function MobileTaskFilterGroup({
  type,
  field,
  options,
  presenter,
  title,
}: {
  type: TaskFilterType;
  field: TaskFilterField;
  options: TaskFilterOption[];
  presenter: CaseloadTasksPresenterV2;
  title: string;
}) {
  return (
    <FilterGroup $isMobile>
      <FilterGroupHeader>{title}</FilterGroupHeader>
      {options.map((option) => {
        const checked = presenter.filterIsSelected(field, option);
        return (
          <MobileTaskFilterItem
            key={option.value}
            option={option}
            checked={checked}
            onClick={() => presenter.toggleFilter(field, option)}
            count={presenter.numTasksMatchingFilter(type, field, option)}
          />
        );
      })}
    </FilterGroup>
  );
});

export const MobileTaskFilterModal = observer(function MobileTaskFilterModal({
  presenter,
  modalIsOpen,
  setModalIsOpen,
}: {
  presenter: CaseloadTasksPresenterV2;
  modalIsOpen: boolean;
  setModalIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { filters } = presenter;
  return (
    <FullScreenModal
      isOpen={modalIsOpen}
      onRequestClose={(e) => {
        setModalIsOpen(false);
      }}
    >
      <ModalContents>
        <ModalCloseButton
          onClick={(e) => {
            setModalIsOpen(false);
          }}
        >
          <ModalCloseIcon className="fa fa-angle-left" /> Back
        </ModalCloseButton>
        <ModalHeaderText>Filters</ModalHeaderText>

        <ScrollableContainer>
          <TopGradient />
          <div>
            {filters.map(({ type, field, options, title }) => (
              <MobileTaskFilterGroup
                key={field}
                type={type}
                title={title}
                field={field}
                options={options}
                presenter={presenter}
              />
            ))}
          </div>
          <BottomGradient />
        </ScrollableContainer>

        <MobileClearAll presenter={presenter} />
      </ModalContents>
    </FullScreenModal>
  );
});

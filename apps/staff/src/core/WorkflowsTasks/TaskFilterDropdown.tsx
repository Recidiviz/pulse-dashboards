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

import { Dropdown, DropdownMenu, DropdownMenuItem, DropdownToggle, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React from "react";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import Checkbox from "../../components/Checkbox";
import useIsMobile from "../../hooks/useIsMobile";
import { CaseloadTasksPresenterV2 } from "../../WorkflowsStore/presenters/CaseloadTasksPresenterV2";
import {
  TaskFilterField,
  TaskFilterOption,
  TaskFilterType,
} from "../models/types";
import { MobileTaskFilterModal } from "./MobileTaskFilterModal";

const FilterDropdownToggle = styled(DropdownToggle)`
  padding: 12px 16px;
  height: 40px;
`;

const FilterIcon = styled.i.attrs({
  className: "fa fa-filter",
})`
  color: ${palette.slate30};
  margin-top: -2px;
  padding-right: 4px;
`;

const FilterDownArrow = styled.i.attrs({
  className: "fa fa-caret-down",
})`
  margin-top: -2px;
  padding-left: 8px;
`;

// TODO: Replace the magic numbers with calculations
const FILTER_COLUMN_WIDTH = 250;

const FilterDropdownMenu = styled(DropdownMenu)`
  transform: translateX(-${rem(2 * FILTER_COLUMN_WIDTH - 26)}) translateY(4px);
  padding: 24px 22px;
`;

export const FilterGroup = styled.div<{ $isMobile: boolean }>`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  white-space: nowrap;

  &:not(:first-child) {
    margin-top: ${({ $isMobile }) => ($isMobile ? rem(12) : "18px")};
    padding-top: 18px;
    border-top: ${palette.slate30} 1px solid;
  }

  ${({ $isMobile }) => $isMobile && `gap: ${rem(spacing.xs)};`}
`;

export const FilterGroupHeader = styled.div`
  text-transform: uppercase;
  font-size: ${rem(12)};
  font-weight: 700;
  padding: 0;
  padding-bottom: ${rem(spacing.xs)};
`;

const FilterRightText = `
  border: none;
  padding-right: ${rem(spacing.xs)};
  margin-left: ${rem(spacing.xs)};
`;

const FilterCount = styled.div<{ $isZero: boolean }>`
  ${FilterRightText}
  color: ${({ $isZero }) => ($isZero ? palette.slate30 : palette.pine4)};
`;

const SelectOnlyButton = styled.div`
  ${FilterRightText}
  color: ${palette.pine4};
  display: none;
`;

const StyledFilterDropdownMenuItem = styled(DropdownMenuItem)<{
  $disabled?: boolean;
}>`
  padding-left: 0;
  padding-right: 0;
  overflow: hidden;
  color: ${palette.pine4};
  // 17px text height plus 4px padding top and bottom
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:last-child {
    margin-bottom: 0;
  }

  ${({ $disabled }) =>
    // If this item is not disabled, show the "only" button and hide the count when hovered
    !$disabled &&
    `
  &:hover {
    & > ${SelectOnlyButton} {
      display: block;
    }

    & > ${FilterCount} {
      display: none;
    }
  }`}

  &:active,
  &:focus {
    // Override the default color inversion on hover
    background-color: ${palette.slate10};
    color: ${palette.pine4};
  }

  ${({ $disabled }) => $disabled && `cursor: not-allowed !important;`}
`;

const FilterOptionLabel = styled.div<{ $disabled: boolean }>`
  display: flex;
  justify-content: flex-start;
  gap: 8px;

  ${({ $disabled }) => $disabled && `color: ${palette.slate30};`}
`;

const FilterCheckboxContainer = styled.div`
  & label.Checkbox__container {
    margin-bottom: 0;
    margin-top: 8px;
    padding-left: 0;
  }
`;

const FilterGroupColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  border-bottom: ${palette.slate30} 1px solid;
  padding-bottom: 24px;
`;

const FilterGroupColumn = styled.div`
  width: ${rem(FILTER_COLUMN_WIDTH)};
`;

const ClearAllButton = styled(StyledFilterDropdownMenuItem)`
  margin-top: ${rem(spacing.md)};
  text-transform: uppercase;
  font-weight: 700;
`;

const TaskFilterDropdownItem = observer(function TaskFilterDropdownItem({
  option,
  onClick,
  onClickOnly,
  checked,
  count,
}: {
  option: TaskFilterOption;
  onClick: () => void;
  onClickOnly: () => void;
  checked: boolean;
  count: number;
}) {
  return (
    <StyledFilterDropdownMenuItem
      preventCloseOnClickEvent
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      key={option.value}
    >
      <FilterOptionLabel $disabled={false}>
        <FilterCheckboxContainer>
          <Checkbox checked={checked} value={option.value} />
        </FilterCheckboxContainer>
        {option.shortLabel ?? option.label ?? option.value}
      </FilterOptionLabel>
      {<FilterCount $isZero={count === 0}>{count}</FilterCount>}
      <SelectOnlyButton
        onClick={(e) => {
          onClickOnly();
          e.stopPropagation();
        }}
      >
        ONLY
      </SelectOnlyButton>
    </StyledFilterDropdownMenuItem>
  );
});

const TaskFilterDropdownGroup = observer(function TaskFilterDropdownGroup({
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
    <FilterGroup $isMobile={false}>
      <FilterGroupHeader>{title}</FilterGroupHeader>
      {options.map((option) => (
        <TaskFilterDropdownItem
          key={option.value}
          option={option}
          checked={presenter.filterIsSelected(field, option)}
          onClick={() => presenter.toggleFilter(field, option)}
          onClickOnly={() => presenter.setOnlyFilterForField(field, option)}
          count={presenter.numTasksMatchingFilter(type, field, option)}
        />
      ))}
    </FilterGroup>
  );
});

const ClearAll = observer(function ClearAll({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  if (presenter.allFiltersSelected) {
    return (
      <ClearAllButton
        preventCloseOnClickEvent
        onClick={() => presenter.clearFilters()}
      >
        Clear all filters
      </ClearAllButton>
    );
  }

  return (
    <ClearAllButton
      preventCloseOnClickEvent
      onClick={() => presenter.resetFilters()}
    >
      Select all filters
    </ClearAllButton>
  );
});

export const TaskFilterDropdown = observer(function TaskFilterDropdown({
  presenter,
}: {
  presenter: CaseloadTasksPresenterV2;
}) {
  const { isMobile } = useIsMobile(true);

  const { filters } = presenter;

  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setModalIsOpen(false);
  }, [isMobile]);

  if (isMobile) {
    return (
      <>
        <Dropdown>
          <FilterDropdownToggle
            // TODO(#7899): Replace with a proper onMenuOpen handler
            onMouseUp={() => {
              presenter.trackFilterDropdownOpened();
              setModalIsOpen(true);
            }}
          >
            <FilterIcon /> Filters
            <FilterDownArrow />
          </FilterDropdownToggle>
        </Dropdown>

        <MobileTaskFilterModal
          presenter={presenter}
          modalIsOpen={modalIsOpen}
          setModalIsOpen={setModalIsOpen}
        />
      </>
    );
  }

  return (
    <Dropdown>
      <FilterDropdownToggle
        // TODO(#7899): Replace with a proper onMenuOpen handler
        onMouseUp={() => presenter.trackFilterDropdownOpened()}
      >
        <FilterIcon /> Filters
        <FilterDownArrow />
      </FilterDropdownToggle>
      <FilterDropdownMenu>
        <FilterGroupColumns>
          <FilterGroupColumn>
            {filters
              .slice(0, Math.ceil(filters.length / 2))
              .map(({ type, field, options, title }) => (
                <TaskFilterDropdownGroup
                  key={field}
                  type={type}
                  title={title}
                  field={field}
                  options={options}
                  presenter={presenter}
                />
              ))}
          </FilterGroupColumn>
          <FilterGroupColumn>
            {filters
              .slice(Math.ceil(filters.length / 2))
              .map(({ type, field, options, title }) => (
                <TaskFilterDropdownGroup
                  key={field}
                  type={type}
                  title={title}
                  field={field}
                  options={options}
                  presenter={presenter}
                />
              ))}
          </FilterGroupColumn>
        </FilterGroupColumns>
        <ClearAll presenter={presenter} key="clear" />
      </FilterDropdownMenu>
    </Dropdown>
  );
});

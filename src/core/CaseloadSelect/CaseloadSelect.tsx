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
  Icon,
  palette,
  Pill,
  Sans14,
  spacing,
  zindex,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import ReactSelect, {
  components,
  IndicatorContainerProps,
  MenuListComponentProps,
  MultiValueProps,
  OptionProps,
  SelectComponentsConfig,
} from "react-select";
import { IndicatorProps } from "react-select/src/components/indicators";
import { MultiValueRemoveProps } from "react-select/src/components/MultiValue";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import { StaffRecord } from "../../FirestoreStore";

// This is a query limitation imposed by Firestore
const SELECTED_OFFICER_LIMIT = 10;

const ValuePill = styled(Pill).attrs({ color: palette.slate20, filled: false })`
  align-self: flex-start;
  border-radius: ${rem(8)};
  font-size: inherit;
  height: ${rem(32)};
`;

const DisabledMessage = styled.div`
  color: ${palette.signal.notification};
  /* non-standard padding value to match library styles */
  padding: 12px;
`;

function DisabledMenuList({
  children,
  ...props
}: MenuListComponentProps<{ label: string; value: string }, true>) {
  return (
    <components.MenuList {...props}>
      <DisabledMessage>
        Cannot select more than {SELECTED_OFFICER_LIMIT} officers.
      </DisabledMessage>
      {children}
    </components.MenuList>
  );
}

type SelectOption = { label: string; value: string };

const buildSelectOption = (officer: StaffRecord): SelectOption => {
  const name = `${officer.givenNames} ${officer.surname}`.trim();
  return { label: name, value: officer.id };
};

const DistrictIndicator = observer(function DistrictIndicator() {
  const {
    workflowsStore: { caseloadDistrict },
  } = useRootStore();

  if (!caseloadDistrict) return null;

  return (
    <ValuePill>
      D{caseloadDistrict}&nbsp;
      <Icon kind="Place" size={12} color={palette.slate60} />
    </ValuePill>
  );
});

function IndicatorsContainer({
  children,
  ...props
}: IndicatorContainerProps<SelectOption, true>) {
  return (
    <components.IndicatorsContainer {...props}>
      {children}
      <DistrictIndicator />
    </components.IndicatorsContainer>
  );
}

const Option = ({ children, ...props }: OptionProps<SelectOption, true>) => {
  return (
    <components.Option className="fs-exclude" {...props}>
      {children}
    </components.Option>
  );
};

const MultiValue = ({ children, ...props }: MultiValueProps<SelectOption>) => {
  return (
    <components.MultiValue className="fs-exclude" {...props}>
      {children}
    </components.MultiValue>
  );
};

const ValueRemover = (props: MultiValueRemoveProps<SelectOption>) => {
  return (
    <components.MultiValueRemove {...props}>
      <Icon kind="CloseOutlined" size={14} />
    </components.MultiValueRemove>
  );
};

const ClearAll = (officerTitle: string) =>
  function ClearAllButton(props: IndicatorProps<SelectOption, true>) {
    return (
      <components.ClearIndicator {...props}>
        <>Clear {officerTitle}s</>
      </components.ClearIndicator>
    );
  };

const CaseloadSelectContainer = styled(Sans14)`
  margin-bottom: ${rem(spacing.xxl)};
`;

type CaseloadSelectProps = {
  hideIndicators?: boolean;
};

export const CaseloadSelect = observer(function CaseloadSelect({
  hideIndicators = false,
}: CaseloadSelectProps) {
  const { workflowsStore, analyticsStore } = useRootStore();

  const { availableOfficers, selectedOfficers, workflowsOfficerTitle } =
    workflowsStore;

  const customComponents: SelectComponentsConfig<SelectOption, true> = {
    ClearIndicator: ClearAll(workflowsOfficerTitle),
    DropdownIndicator: null,
    IndicatorsContainer,
    MultiValueRemove: ValueRemover,
    Option,
    MultiValue,
  };

  const disableAdditionalSelections =
    selectedOfficers.length >= SELECTED_OFFICER_LIMIT;

  if (disableAdditionalSelections) {
    customComponents.MenuList = DisabledMenuList;
  }

  return (
    <CaseloadSelectContainer>
      <ReactSelect
        classNamePrefix="CaseloadSelect"
        className="CaseloadSelect"
        components={customComponents}
        isMulti
        isOptionDisabled={() => disableAdditionalSelections}
        onChange={(newValue) => {
          workflowsStore.updateSelectedOfficers(
            newValue.map((item) => item.value)
          );
          analyticsStore.trackCaseloadSearch({
            officerCount: newValue.length,
            isDefault: false,
          });
        }}
        options={availableOfficers.map(buildSelectOption)}
        placeholder={`Search for one or more ${workflowsOfficerTitle}s …`}
        styles={{
          clearIndicator: (base) => ({
            ...base,
            color: palette.slate85,
            cursor: "pointer",
            fontSize: rem(14),
            margin: `0 ${rem(spacing.md)}`,
            padding: 0,
            textTransform: "capitalize",
            "&:hover": {
              color: palette.slate,
            },
          }),
          control: (base) => ({
            ...base,
            borderColor: palette.slate20,
            borderRadius: rem(8),
            minHeight: rem(48),
            padding: rem(spacing.sm),
          }),
          indicatorsContainer: (base) => ({
            ...base,
            alignSelf: "flex-start",
            display: hideIndicators ? "none" : "inherit",
            height: rem(30),
          }),
          menu: (base) => ({ ...base, zIndex: zindex.tooltip - 1 }),
          multiValue: (base) => ({
            ...base,
            alignItems: "center",
            background: "transparent",
            border: `1px solid ${palette.slate20}`,
            borderRadius: rem(8),
            height: rem(30),
            margin: 0,
            padding: rem(spacing.sm),
          }),
          multiValueLabel: (base) => ({
            ...base,
            color: palette.slate85,
            fontSize: rem(14),
            lineHeight: rem(16),
            padding: 0,
          }),
          multiValueRemove: (base, state) => ({
            ...base,
            color: rgba(palette.slate, 0.4),
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "transparent",
              color: palette.slate60,
            },
          }),
          valueContainer: (base) => ({
            ...base,
            padding: 0,
            gap: rem(spacing.sm),
          }),
        }}
        value={selectedOfficers.map(buildSelectOption)}
      />
    </CaseloadSelectContainer>
  );
});

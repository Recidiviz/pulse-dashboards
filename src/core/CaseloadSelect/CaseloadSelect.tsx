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
import { Icon, palette, Pill, spacing, zindex } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import ReactSelect, {
  components,
  IndicatorContainerProps,
  MenuListComponentProps,
  SelectComponentsConfig,
} from "react-select";
import { IndicatorProps } from "react-select/src/components/indicators";
import { MultiValueRemoveProps } from "react-select/src/components/MultiValue";
import styled from "styled-components/macro";

import { trackCaseloadSearch } from "../../analytics";
import { useRootStore } from "../../components/StoreProvider";
import { UiSans14 } from "../../components/typography";
import { StaffRecord } from "../../firestore";

// This is a query limitation imposed by Firestore
const SELECTED_OFFICER_LIMIT = 10;

const BaseTypeface = styled(UiSans14)`
  font-size: ${rem(13)};
  line-height: 1;
`;

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

const DisabledMenuList = ({
  children,
  ...props
}: MenuListComponentProps<{ label: string; value: string }, true>) => (
  <components.MenuList {...props}>
    <DisabledMessage>
      Cannot select more than {SELECTED_OFFICER_LIMIT} officers.
    </DisabledMessage>
    {children}
  </components.MenuList>
);

type SelectOption = { label: string; value: string };

const buildSelectOption = (officer: StaffRecord): SelectOption => {
  return { label: officer.name, value: officer.id };
};

const DistrictIndicator = observer(() => {
  const {
    practicesStore: { user },
  } = useRootStore();
  const district = user?.info.district;

  if (!district) return null;

  return (
    <ValuePill>
      D{district}&nbsp;
      <Icon kind="Place" size={13} color={palette.slate60} />
    </ValuePill>
  );
});

const IndicatorsContainer = ({
  children,
  ...props
}: IndicatorContainerProps<SelectOption, true>) => {
  return (
    <components.IndicatorsContainer {...props}>
      {children}
      <DistrictIndicator />
    </components.IndicatorsContainer>
  );
};

const ValueRemover = (props: MultiValueRemoveProps<SelectOption>) => {
  return (
    <components.MultiValueRemove {...props}>
      <Icon kind="CloseOutlined" size={13} />
    </components.MultiValueRemove>
  );
};

const ClearAll = (props: IndicatorProps<SelectOption, true>) => {
  return (
    <components.ClearIndicator {...props}>
      <>Clear Officers</>
    </components.ClearIndicator>
  );
};

type CaseloadSelectProps = {
  hideIndicators?: boolean;
};

export const CaseloadSelect = observer(
  ({ hideIndicators = false }: CaseloadSelectProps) => {
    const { practicesStore } = useRootStore();

    const customComponents: SelectComponentsConfig<SelectOption, true> = {
      ClearIndicator: ClearAll,
      DropdownIndicator: null,
      IndicatorsContainer,
      MultiValueRemove: ValueRemover,
    };

    const disableAdditionalSelections =
      practicesStore.selectedOfficers.length >= SELECTED_OFFICER_LIMIT;

    if (disableAdditionalSelections) {
      customComponents.MenuList = DisabledMenuList;
    }

    return (
      <BaseTypeface>
        <ReactSelect
          components={customComponents}
          isMulti
          isOptionDisabled={() => disableAdditionalSelections}
          onChange={(newValue) => {
            practicesStore.updateSelectedOfficers(
              newValue.map((item) => item.value)
            );
            trackCaseloadSearch({
              officerCount: newValue.length,
              isDefault: false,
            });
          }}
          options={practicesStore.availableOfficers.map(buildSelectOption)}
          placeholder="Search for one or more officers …"
          styles={{
            clearIndicator: (base) => ({
              ...base,
              color: palette.slate85,
              cursor: "pointer",
              fontSize: rem(13),
              margin: `0 ${rem(spacing.md)}`,
              padding: 0,
              "&:hover": {
                color: palette.slate,
              },
            }),
            control: (base) => ({
              ...base,
              borderColor: palette.slate20,
              borderRadius: rem(8),
              minHeight: rem(50),
              padding: rem(spacing.sm),
            }),
            indicatorsContainer: (base) => ({
              ...base,
              alignSelf: "flex-start",
              display: hideIndicators ? "none" : "inherit",
              height: rem(32),
            }),
            menu: (base) => ({ ...base, zIndex: zindex.tooltip - 1 }),
            multiValue: (base) => ({
              ...base,
              alignItems: "center",
              background: "transparent",
              border: `1px solid ${palette.slate20}`,
              borderRadius: rem(8),
              height: rem(32),
              margin: 0,
              padding: rem(spacing.sm),
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: palette.slate85,
              fontSize: rem(13),
              lineHeight: 1,
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
          value={practicesStore.selectedOfficers.map(buildSelectOption)}
        />
      </BaseTypeface>
    );
  }
);

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

import {
  Button,
  Icon,
  IconSVG,
  Modal,
  Pill,
  Sans14,
  Serif24,
  spacing,
  zindex,
} from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem, rgba } from "polished";
import React from "react";
import { useInView } from "react-intersection-observer";
import ReactSelect, {
  ClearIndicatorProps,
  components,
  GroupBase,
  IndicatorsContainerProps,
  MenuListProps,
  MultiValueProps,
  MultiValueRemoveProps,
  OptionProps,
  SelectComponentsConfig,
  StylesConfig,
} from "react-select";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import useIsMobile from "../../hooks/useIsMobile";
import { pluralizeWord } from "../../utils";
import { Searchable, SearchableGroup, SearchIcon } from "../models/types";

// This is a query limitation imposed by Firestore
const SELECTED_SEARCH_LIMIT = 30;

const ValuePill = styled(Pill).attrs({ color: palette.slate20, filled: false })`
  align-self: flex-start;
  border-radius: ${rem(8)};
  font-size: inherit;
  height: ${rem(32)};
`;

const DisabledMessage = styled.div`
  color: ${palette.signal.notification};
  /* non-standard padding value to match library styles */
  padding: ${rem(spacing.sm)} ${rem(spacing.md)};
`;

export type SelectOption = { label: string; value: string; icon?: SearchIcon };

type SelectGroupedOptions = { label: string; options: SelectOption[] };

const buildSelectOptionsFromSearchableGroup = (
  searchableGroup: SearchableGroup[],
): SelectGroupedOptions[] | SelectOption[] => {
  if (searchableGroup.length === 1) {
    return buildSelectOptionsFromSearchables(searchableGroup[0].searchables);
  }

  return searchableGroup.map((group) => ({
    label: group.groupLabel,
    options: buildSelectOptionsFromSearchables(group.searchables),
  }));
};

const buildSelectOptionsFromSearchables = (
  searchables: Searchable[],
): SelectOption[] => {
  return searchables.map((searchable) => ({
    label: searchable.searchLabel,
    value: searchable.searchId,
    icon: searchable.icon,
  }));
};

const DistrictIndicatorsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  row-gap: ${rem(spacing.xs)};
`;

const DistrictIndicator = observer(function DistrictIndicator() {
  const {
    workflowsStore: { districtsFilteredBy },
  } = useRootStore();

  if (!districtsFilteredBy) return null;

  return (
    <DistrictIndicatorsWrapper>
      {districtsFilteredBy.map((district) => (
        <ValuePill key={district}>
          {district.match(/^\d/) ? `D${district}` : district}&nbsp;
          <Icon kind="Place" size={12} color={palette.slate60} />
        </ValuePill>
      ))}
    </DistrictIndicatorsWrapper>
  );
});

const IndicatorsWrapper = styled.div<{
  isMobile: boolean;
  hasDistricts: boolean;
}>`
  display: flex;
  flex-basis: ${({ isMobile, hasDistricts }) =>
    isMobile || !hasDistricts ? "initial" : "30%"};
  flex-wrap: wrap;
  align-items: center;
  justify-content: end;
  row-gap: ${rem(spacing.sm)};
  margin-top: ${({ isMobile }) => (isMobile ? rem(spacing.md) : 0)};
`;

const Indicators = (isMobile: boolean) =>
  observer(function IndicatorsContainer({
    children,
  }: IndicatorsContainerProps<SelectOption, true>) {
    const {
      workflowsStore: { districtsFilteredBy },
    } = useRootStore();

    return (
      <IndicatorsWrapper
        isMobile={isMobile}
        hasDistricts={Boolean(districtsFilteredBy)}
      >
        {children}
        <DistrictIndicator />
      </IndicatorsWrapper>
    );
  });

const Option = ({ children, ...props }: OptionProps<SelectOption, true>) => {
  return (
    <components.Option className="fs-exclude" {...props}>
      {children}
    </components.Option>
  );
};

const IconContainer = styled.div`
  display: flex;
  justify-content: center;

  padding: ${rem(spacing.xs)};

  // TODO(#8709): Add color to design system or change to design system color
  background-color: rgba(226, 244, 255, 1);
  border-radius: 50%;
`;

const SearchIconElement = styled.i`
  color: ${palette.logoBlue};
`;

const SearchableIcon = ({ icon }: { icon?: SearchIcon }) => {
  switch (icon) {
    case "flag":
      return (
        <IconContainer>
          <SearchIconElement className="fa fa-flag" />
        </IconContainer>
      );
    default:
      return null;
  }
};

const MultiValueContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.xs)};
`;

export const MultiValue = ({
  children,
  ...props
}: MultiValueProps<SelectOption, true>) => {
  const {
    data,
    data: { icon },
    selectProps,
  } = props;

  const handleRemove = () => {
    // Filter out the item to remove
    const newValues = Array.isArray(selectProps?.value)
      ? selectProps.value.filter((item) => item.value !== data.value)
      : [];
    // Update the selected values
    selectProps.onChange(newValues, {
      action: "remove-value",
      removedValue: data,
    });
  };

  return (
    <components.MultiValue className="fs-exclude" {...props}>
      <MultiValueContainer onTouchStart={handleRemove}>
        <SearchableIcon icon={icon} />
        {children}
      </MultiValueContainer>
    </components.MultiValue>
  );
};

export const ValueRemover = (props: MultiValueRemoveProps<SelectOption>) => {
  return (
    <components.MultiValueRemove {...props}>
      <Icon kind="CloseOutlined" size={14} />
    </components.MultiValueRemove>
  );
};

const ClearAll = (searchFieldTitle: string, searchTitleIgnoreCase = false) =>
  function ClearAllButton(props: ClearIndicatorProps<SelectOption, true>) {
    return (
      <components.ClearIndicator {...props}>
        <>
          Clear{" "}
          {pluralizeWord({
            term: searchFieldTitle,
            justAppendS: searchTitleIgnoreCase,
          })}
        </>
      </components.ClearIndicator>
    );
  };

export const ScrollShadow = styled.div<{
  show: boolean;
  side: "top" | "bottom";
}>`
  background: linear-gradient(
    ${({ side }) => (side === "top" ? 180 : 360)}deg,
    ${palette.marble1} 3.13%,
    ${palette.marble1} 109.62%
  );
  pointer-events: none;
  position: absolute;
  opacity: ${({ show }) => (show ? 1 : 0)};
  transition: all 200ms ease;
  ${({ side }) => side}: 0;
  width: 100%;
  height: 3em;
  z-index: ${zindex.tooltip - 1};
`;

export const MenuListWithShadow = (
  entriesNumber: number,
  isDisabled: boolean,
  searchFieldTitle: string,
  searchTitleIgnoreCase?: boolean,
) =>
  function MenuList({ children, ...props }: MenuListProps<SelectOption, true>) {
    const topShadow = useInView();
    const bottomShadow = useInView();

    return (
      <>
        <ScrollShadow
          show={!!topShadow.entry && !topShadow.inView && entriesNumber > 9}
          side="top"
        />
        <components.MenuList {...props}>
          <div ref={topShadow.ref} />
          {isDisabled && (
            <DisabledMessage>
              Cannot select more than {SELECTED_SEARCH_LIMIT}{" "}
              {pluralizeWord({
                term: searchFieldTitle,
                justAppendS: searchTitleIgnoreCase,
              })}
              .
            </DisabledMessage>
          )}
          {children}
          <div ref={bottomShadow.ref} />
        </components.MenuList>
        <ScrollShadow
          show={!bottomShadow.inView && entriesNumber > 9}
          side="bottom"
        />
      </>
    );
  };

const CaseloadSelectContainer = styled(Sans14)`
  color: ${palette.slate85};
  margin-bottom: ${rem(spacing.lg)};
  flex: 1;
`;

const CaseloadSelectMobileButton = styled(Button).attrs({ kind: "link" })`
  color: ${palette.signal.links};
  padding: 0 0.5rem;
`;

const StyledModal = styled(Modal)`
  .ReactModal__Content {
    font-family: "Public Sans", sans-serif;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.2;
    letter-spacing: -0.01em;
    max-width: unset;
    max-height: unset;
    width: 100%;
    height: 100%;
    padding: 1rem;
    overflow: hidden;
  }
`;

const ModalButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ModalButton = styled(Button).attrs({ kind: "link" })`
  color: ${palette.signal.links};
  text-decoration: none !important;
  padding: ${rem(spacing.sm)} 0;
`;

export const ModalCloseButton = styled(ModalButton).attrs({ kind: "link" })``;

export const ModalHeader = styled(Serif24)`
  color: ${palette.pine2};
  padding-top: ${rem(spacing.md)};
`;

type CaseloadSelectProps = {
  hideIndicators?: boolean;
};

export const caseloadSelectStyles = (
  isMobile: any,
  hideIndicators: boolean,
  disableAdditionalSelections: boolean,
): Partial<StylesConfig<SelectOption, true, GroupBase<SelectOption>>> => ({
  placeholder: (base) => ({
    ...base,
    color: palette.text.secondary,
  }),
  clearIndicator: (base) => ({
    ...base,
    color: palette.slate85,
    cursor: "pointer",
    fontSize: rem(14),
    margin: `0 ${rem(spacing.sm)}`,
    padding: 0,
    textTransform: "capitalize",
    "&:hover": {
      color: palette.slate,
    },
  }),
  indicatorsContainer: (base) => ({
    ...base,
    display: hideIndicators ? "none" : "inherit",
  }),
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
    fontSize: isMobile ? rem(12) : rem(14),
    lineHeight: rem(16),
    padding: 0,
  }),
  multiValueRemove: (base) => ({
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
    color: palette.slate60,
  }),
  container: (base) => ({
    ...base,
    margin: isMobile && "0 -1rem",
    fontSize: rem(16),
  }),
  menuList: (base) => ({
    ...base,
    maxHeight: rem(isMobile ? 900 : 300),
    padding: `${rem(spacing.sm)} 0`,
  }),
  control: (base, state) => ({
    ...base,
    borderWidth: state.menuIsOpen ? "0" : `1px`,
    borderStyle: "solid",
    borderColor: `${palette.slate10} !important`,
    borderRadius: state.menuIsOpen ? "8px 8px 0 0" : rem(8),
    minHeight: rem(48),
    padding: `${rem(isMobile ? spacing.md : spacing.sm)} ${rem(spacing.md)}`,
    margin: 0,
    boxShadow:
      state.menuIsOpen && !isMobile
        ? `0px 10px 40px ${palette.slate30}`
        : "none",
  }),
  menu: (base) => ({
    ...base,
    zIndex: zindex.tooltip - 1,
    margin: 0,
    border: "none",
    borderTop: `1px solid ${palette.slate20}`,
    borderRadius: "0 0 8px 8px",
    boxShadow: !isMobile ? `0px 10px 40px ${palette.slate20}` : "none",
  }),
  option: (base) => ({
    ...base,
    backgroundColor: "none",
    color: disableAdditionalSelections ? palette.slate20 : palette.pine3,
    pointerEvents: disableAdditionalSelections ? "none" : "initial",
    padding: isMobile
      ? `${rem(10)} ${rem(spacing.xl)}`
      : `${rem(spacing.sm)} ${rem(spacing.md)}`,

    "&:hover": {
      backgroundColor: palette.slate10,
    },
  }),
  group: (base) => ({
    ...base,
    paddingTop: `${rem(spacing.sm)}`,
    borderBottom: `1px solid ${palette.slate10}`,

    "&:nth-last-child(2)": {
      paddingTop: `${rem(spacing.md)}`,
      borderBottom: "none",
    },
  }),
  groupHeading: (base) => ({
    ...base,
    padding: `${rem(2)} ${rem(spacing.md)}`,
    marginBottom: `${rem(8)}`,
    color: palette.slate60,
    fontSize: `${rem(12)}`,
    lineHeight: `${rem(14.4)}`,
    textTransform: "capitalize",
  }),
});

export const CaseloadSelect = observer(function CaseloadSelect({
  hideIndicators = false,
}: CaseloadSelectProps) {
  const { workflowsStore, analyticsStore } = useRootStore();
  const { isMobile } = useIsMobile(true);
  const {
    supportsMultipleSystems,
    activeSystem,
    activeSystemConfig,
    searchStore: {
      selectedSearchables,
      selectedSearchIds,
      searchType,
      availableSearchables,
      searchTitleOverride,
      updateSelectedSearch,
    },
  } = workflowsStore;

  const searchTitle =
    supportsMultipleSystems && activeSystem === "ALL" && searchType === "ALL"
      ? "caseload"
      : searchTitleOverride(activeSystem, "caseload");

  const searchTitleIgnoreCase = activeSystemConfig?.search.filter(
    (search) => search.searchType === searchType,
  )[0]?.searchTitleIgnoreCase;

  const customComponents: SelectComponentsConfig<
    SelectOption,
    true,
    GroupBase<SelectOption>
  > = {
    ClearIndicator: ClearAll(searchTitle, searchTitleIgnoreCase),
    DropdownIndicator: null,
    IndicatorsContainer: Indicators(isMobile),
    MultiValueRemove: ValueRemover,
    Option,
    MultiValue,
  };

  const disableAdditionalSelections =
    selectedSearchables.length >= SELECTED_SEARCH_LIMIT;

  customComponents.MenuList = MenuListWithShadow(
    availableSearchables.length,
    disableAdditionalSelections,
    searchTitle,
    searchTitleIgnoreCase,
  );

  const defaultOptions = {
    classNamePrefix: "CaseloadSelect",
    className: "CaseloadSelect",
    components: customComponents,
    isMulti: true,
    isOptionDisabled: () => disableAdditionalSelections,
    onChange: (newValue: any) => {
      updateSelectedSearch(newValue.map((item: SelectOption) => item.value));
      analyticsStore.trackCaseloadSearch({
        searchCount: newValue.length,
        isDefault: false,
        searchType,
      });
    },
    options: buildSelectOptionsFromSearchableGroup(availableSearchables),
    placeholder: `Search for one or more ${pluralizeWord({ term: searchTitle, justAppendS: searchTitleIgnoreCase })} …`,
    styles: caseloadSelectStyles(
      isMobile,
      hideIndicators,
      disableAdditionalSelections,
    ),
    value: buildSelectOptionsFromSearchables(selectedSearchables),
    // use of satisfies narrows isMulti from boolean to true,
    // which the custom components defined here will require
  } satisfies { isMulti: true; [key: string]: unknown };

  const [modalIsOpen, setModalIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile) setModalIsOpen(false);
  }, [isMobile]);

  if (isMobile) {
    return (
      <CaseloadSelectContainer>
        Caseloads:
        <CaseloadSelectMobileButton onClick={() => setModalIsOpen(true)}>
          {selectedSearchIds.length > 0
            ? `${selectedSearchIds.length} selected`
            : "Click to search caseloads"}
          &nbsp;
          <Icon kind={IconSVG.DownChevron} width={8} />
        </CaseloadSelectMobileButton>
        <StyledModal
          isOpen={modalIsOpen}
          onRequestClose={() => setModalIsOpen(false)}
        >
          <ModalButtonRow>
            <ModalCloseButton onClick={() => setModalIsOpen(false)}>
              Back
            </ModalCloseButton>
            <ModalButton onClick={() => updateSelectedSearch([])}>
              Clear
            </ModalButton>
          </ModalButtonRow>
          <ModalHeader>Search</ModalHeader>
          <ReactSelect menuIsOpen isClearable={false} {...defaultOptions} />
        </StyledModal>
      </CaseloadSelectContainer>
    );
  }

  return (
    <CaseloadSelectContainer>
      <ReactSelect {...defaultOptions} />
    </CaseloadSelectContainer>
  );
});

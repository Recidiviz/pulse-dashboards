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

import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect, { components, GroupBase, OptionProps } from "react-select";

import { SystemId } from "~datatypes";

import { useRootStore } from "../../components/StoreProvider";
import { PersonSearchResult, PersonType } from "../../WorkflowsStore/types";
import { workflowsUrl } from "../views";
import { createMenuListWithScrollShadow } from "../WorkflowsSearchBar/WorkflowsSearchBar.styles";
import {
  OptionExternalId,
  OptionName,
  OptionNameGroup,
  OptionRow,
  PersonSearchBarContainer,
  personSearchBarStyles,
} from "./PersonSearchBar.styles";

export type PersonSearchOption = {
  label: string;
  value: string;
  result: PersonSearchResult;
};

const PERSON_TYPE_GROUPS: Array<{ label: string; personType: PersonType }> = [
  { label: "Clients", personType: "CLIENT" },
  { label: "Residents", personType: "RESIDENT" },
];

function buildDisplayName(result: PersonSearchResult): string {
  const { givenNames, surname, preferredName } = result;
  const originalName = [givenNames, surname].filter(Boolean).join(" ");

  if (preferredName && preferredName !== givenNames) {
    return `${givenNames} (${preferredName}) ${surname}`;
  }

  return originalName;
}

function toOption(result: PersonSearchResult): PersonSearchOption {
  return {
    label: buildDisplayName(result),
    value: result.pseudonymizedId,
    result,
  };
}

export function buildGroupedOptions(
  results: PersonSearchResult[],
): GroupBase<PersonSearchOption>[] {
  return PERSON_TYPE_GROUPS.map(({ label, personType }) => ({
    label,
    options: results
      .filter((result) => result.personType === personType)
      .map(toOption),
  })).filter((group) => group.options.length > 0);
}

function PersonOption(props: OptionProps<PersonSearchOption, false>) {
  const { data } = props;

  return (
    <components.Option className="fs-exclude" {...props}>
      <OptionRow>
        <OptionNameGroup>
          <OptionName>{data.label}</OptionName>
          <OptionExternalId>{data.result.personExternalId}</OptionExternalId>
        </OptionNameGroup>
      </OptionRow>
    </components.Option>
  );
}

function buildPlaceholder(workflowsSupportedSystems: SystemId[] | undefined) {
  const hasSupervision = workflowsSupportedSystems?.includes("SUPERVISION");
  const hasIncarceration = workflowsSupportedSystems?.includes("INCARCERATION");

  if (hasSupervision && !hasIncarceration)
    return "Search for a client by name or ID …";
  if (hasIncarceration && !hasSupervision)
    return "Search for a resident by name or ID …";
  return "Search for a client/resident by name or ID …";
}

export const PersonSearchBar = observer(function PersonSearchBar() {
  const {
    workflowsStore: {
      workflowsSupportedSystems,
      searchStore: { personSearchManager },
    },
    analyticsStore,
  } = useRootStore();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState("");

  return (
    <PersonSearchBarContainer>
      <ReactSelect<PersonSearchOption, false, GroupBase<PersonSearchOption>>
        classNamePrefix="PersonSearchBar"
        inputValue={inputValue}
        value={null}
        menuIsOpen={inputValue.length > 0}
        isLoading={personSearchManager.searchPending}
        loadingMessage={() => "Loading…"}
        noOptionsMessage={() =>
          inputValue ? `No matches for "${inputValue}"` : null
        }
        onInputChange={(newValue) => {
          setInputValue(newValue);
          personSearchManager.handleSearchInput(newValue);
          return newValue;
        }}
        filterOption={() => true}
        options={buildGroupedOptions(personSearchManager.results)}
        components={{
          Option: PersonOption,
          DropdownIndicator: null,
          MenuList: createMenuListWithScrollShadow<PersonSearchOption, false>(
            personSearchManager.results.length,
          ),
        }}
        onChange={(option) => {
          if (!option) return;
          const { result } = option;

          analyticsStore.trackPersonSearchResultClicked({
            justiceInvolvedPersonId: result.pseudonymizedId,
            personType: result.personType,
            searchInput: inputValue,
          });

          setInputValue("");

          navigate(
            workflowsUrl(
              result.personType === "CLIENT"
                ? "clientProfile"
                : "residentProfile",
              { justiceInvolvedPersonId: result.pseudonymizedId },
            ),
          );
        }}
        placeholder={buildPlaceholder(workflowsSupportedSystems)}
        styles={personSearchBarStyles}
      />
    </PersonSearchBarContainer>
  );
});

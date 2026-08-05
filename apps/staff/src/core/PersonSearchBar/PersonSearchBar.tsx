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
import ReactSelect, { components, GroupBase, OptionProps } from "react-select";

import { useRootStore } from "../../components/StoreProvider";
import { PersonSearchResult, PersonType } from "../../WorkflowsStore/types";
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

export const PersonSearchBar = observer(function PersonSearchBar() {
  const {
    workflowsStore: {
      searchStore: { personSearchManager },
    },
  } = useRootStore();

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
        // Selecting/navigating to a result is intentionally out of scope for
        // this component (TODO: OBT-40289)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onChange={() => {}}
        placeholder="Search for a client or resident …"
        styles={personSearchBarStyles}
      />
    </PersonSearchBarContainer>
  );
});

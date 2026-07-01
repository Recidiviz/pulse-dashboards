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

import { spacing, zindex } from "@recidiviz/design-system";
import debounce from "lodash/debounce";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

import { StaffRecord } from "~datatypes";
import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { JusticeInvolvedPerson } from "../../WorkflowsStore";
import { Opportunity } from "../../WorkflowsStore/Opportunity";
import WorkflowsOfficerName from "../WorkflowsOfficerName/WorkflowsOfficerName";

const LookupWrapper = styled.div`
  position: relative;
  display: flex;
  height: ${rem(40)};
  padding: ${rem(12)} ${rem(17)};
  justify-content: space-between;
  align-items: center;
  align-self: stretch;

  border-radius: ${rem(8)};
  border: ${rem(1)} solid ${palette.signal.links};
  background: ${palette.white};
`;

const LookupInput = styled.input<{
  $showDropdown: boolean;
  $isFocused: boolean;
}>`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  border: none;

  &:hover,
  &:focus,
  &:active {
    background: transparent;
    border: none;
    outline: none;
    box-shadow: none;
  }
`;

const ResultsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  width: ${rem(547)};
  padding: ${rem(8)} 0;
  flex-direction: column;
  align-items: flex-start;

  border-radius: ${rem(8)};
  background: ${palette.white};
  z-index: ${zindex.tooltip};

  /* Card.Shadow */
  box-shadow:
    0 ${rem(15)} ${rem(40)} 0 rgba(53, 83, 98, 0.3),
    0 ${rem(-1)} ${rem(1)} 0 rgba(19, 44, 82, 0.2) inset;

  max-height: ${rem(200)};
  overflow-y: auto;
`;

const ResultItem = styled.div<{ $selected: boolean }>`
  display: flex;
  padding: ${rem(2)} ${rem(16)};
  flex-direction: column;
  align-items: flex-start;
  gap: ${rem(8)};
  align-self: stretch;
  cursor: pointer;

  background: ${({ $selected }) =>
    $selected ? palette.slate10 : palette.white};

  &:hover {
    background: ${palette.slate10};
  }
`;

const NoResults = styled.div`
  padding: ${rem(spacing.md)};
  color: ${palette.slate60};
  text-align: center;
`;

const ClearButton = styled.button`
  position: absolute;
  right: ${rem(spacing.md)};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${palette.slate60};
  cursor: pointer;
  padding: ${rem(4)};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${rem(4)};

  &:hover {
    background: ${palette.slate10};
    color: ${palette.slate85};
  }
`;

type StaffLookupProps = {
  opportunity: Opportunity<JusticeInvolvedPerson>;
  onSelect: (officer: StaffRecord | null) => void;
};

export const StaffLookup = observer(function StaffLookup({
  opportunity,
  onSelect,
}: StaffLookupProps) {
  const { workflowsStore } = useRootStore();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<StaffRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (skipNextSearch.current) {
          skipNextSearch.current = false;
          return;
        }
        if (value.trim().length >= 2) {
          const searchResults = workflowsStore
            .searchStaffWithOrWithoutCaseloads(value)
            .filter(
              (o) =>
                o.staffExternalId !==
                workflowsStore.rootStore.userStore.externalId,
            );
          setResults(searchResults);
          setShowDropdown(true);
          setSelectedIndex(-1);
        } else {
          setResults([]);
          setShowDropdown(false);
        }
      }, 200),
    [workflowsStore],
  );

  useEffect(() => {
    debouncedSearch(searchValue);
    return () => debouncedSearch.cancel();
  }, [searchValue, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === "Escape") {
        setSearchValue("");
        setShowDropdown(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectStaff(results[selectedIndex]);
        } else if (results.length === 1) {
          selectStaff(results[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const selectStaff = (staff: StaffRecord) => {
    skipNextSearch.current = true;
    onSelect(staff);
    setSearchValue(`${staff.surname}, ${staff.givenNames}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleClear = () => {
    setSearchValue("");
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSelect(null);
    inputRef.current?.focus();
  };

  const disableLookup =
    workflowsStore.searchStore.selectedSearchables.length === 0;

  if (disableLookup) {
    return;
  }

  const placeholderText = `Search and Select the next reviewer`;

  return (
    <LookupWrapper>
      <LookupInput
        ref={inputRef}
        type="text"
        value={searchValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          if (results.length > 0) setShowDropdown(true);
        }}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholderText}
        aria-label={`Staff ID or Name lookup`}
        $showDropdown={showDropdown && results.length > 0}
        $isFocused={isFocused}
      />
      {searchValue && (
        <ClearButton
          onClick={handleClear}
          aria-label="Clear search"
          type="button"
        >
          ×
        </ClearButton>
      )}
      {showDropdown && (
        <ResultsDropdown>
          {results.length > 0 ? (
            results.map((staff, index) => (
              <ResultItem
                key={staff.staffExternalId}
                $selected={index === selectedIndex}
                onClick={() => selectStaff(staff)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <WorkflowsOfficerName
                  officerId={staff.staffExternalId}
                  availableOfficers={
                    workflowsStore.availableOfficersWithOrWithoutCaseloads
                  }
                />
              </ResultItem>
            ))
          ) : (
            <NoResults>No matches found</NoResults>
          )}
        </ResultsDropdown>
      )}
    </LookupWrapper>
  );
});

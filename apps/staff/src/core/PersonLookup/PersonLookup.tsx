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
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

import { palette } from "~design-system";

import { useRootStore } from "../../components/StoreProvider";
import { toTitleCase } from "../../utils";
import { JusticeInvolvedPerson } from "../../WorkflowsStore/types";

const LookupWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const LookupInput = styled.input<{
  $showDropdown: boolean;
  $isFocused: boolean;
}>`
  display: flex;
  width: ${rem(240)};
  height: ${rem(40)};
  padding: ${rem(12)} ${rem(16)};
  align-items: center;
  gap: ${rem(8)};
  flex-shrink: 0;
  color: ${palette.pine3};

  border-radius: ${rem(4)};
  border: 1px solid ${palette.slate20};
  background: #fff;
  outline: none;

  &:focus {
    border-color: ${palette.slate40};
    gap: ${rem(1)};
  }

  &:not(:placeholder-shown) {
    border-color: ${palette.slate60};
    gap: ${rem(1)};
  }

  &::placeholder {
    color: ${palette.text.secondary};
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px; /* 114.286% */
  }
`;

const ResultsDropdown = styled.div`
  display: flex;
  width: ${rem(240)};
  padding: ${rem(12)} 0;
  flex-direction: column;
  align-items: stretch;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${palette.marble1};
  border: 1px solid ${palette.slate20};
  border-top: 1px solid ${palette.slate20};
  border-radius: ${rem(8)};
  box-shadow:
    0 0 ${rem(1)} 0 ${palette.slate10},
    0 ${rem(4)} ${rem(8)} 0 ${palette.slate06} 0 ${rem(8)} ${rem(56)} 0
      ${palette.slate12};
  max-height: ${rem(190)};
  overflow-y: auto;
  z-index: ${zindex.tooltip};
`;

const ResultItem = styled.div<{ $selected: boolean }>`
  padding: ${rem(7)} ${rem(16)};
  gap: ${rem(8)};
  cursor: pointer;
  background: ${({ $selected }) =>
    $selected ? palette.slate10 : palette.marble1};
  border-bottom: 1px solid ${palette.slate10};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${palette.slate10};
  }
`;

const PersonName = styled.div`
  font-weight: ${rem(500)};
  color: ${palette.pine3};
  font-size: ${rem(14)};
  line-height: ${rem(16)};
  letter-spacing: ${rem(-0.14)};
`;

const PersonId = styled.div`
  font-size: ${rem(12)};
  color: ${palette.slate60};
  margin-top: ${rem(2)};
  line-height: ${rem(16)};
  letter-spacing: ${rem(-0.12)};
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

export const PersonLookup = observer(function PersonLookup() {
  const { workflowsStore } = useRootStore();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<JusticeInvolvedPerson[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        if (value.trim().length >= 2) {
          const searchResults = workflowsStore.searchPersons(value);
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

  const navigateToPerson = (person: JusticeInvolvedPerson) => {
    setSearchValue("");
    setResults([]);
    setShowDropdown(false);
    navigate(person.profileUrl, {
      state: { previousPage: `${pathname}${search}` },
    });
  };

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
          navigateToPerson(results[selectedIndex]);
        } else if (results.length === 1) {
          navigateToPerson(results[0]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleClear = () => {
    setSearchValue("");
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getPersonDisplayName = (person: JusticeInvolvedPerson) => {
    return person.displayName || "Unknown";
  };

  const disableLookup =
    workflowsStore.searchStore.selectedSearchables.length === 0;

  if (disableLookup) {
    return;
  }

  const personTitle = toTitleCase(workflowsStore.justiceInvolvedPersonTitle);
  const placeholderText = `Search by ${personTitle} ID or Name`;

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
        aria-label={`${personTitle} ID or Name lookup`}
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
            results.map((person, index) => (
              <ResultItem
                key={person.pseudonymizedId}
                $selected={index === selectedIndex}
                onClick={() => navigateToPerson(person)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <PersonName>{getPersonDisplayName(person)}</PersonName>
                <PersonId>ID: {person.displayId}</PersonId>
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

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

import React, { useEffect, useId, useRef, useState } from "react";

import SearchIcon from "../../../components/assets/search-icon.svg?react";
import XIcon from "../../../components/assets/x.svg?react";
import * as Styled from "./SearchBar.styles";
import { SearchDropdown } from "./SearchDropdown";

export interface SearchBarItem {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SearchBarProps {
  placeholder?: string;
  debounceMs?: number;
  onSearch: (value: string) => void;
  items?: SearchBarItem[];
  onSelectItem?: (item: SearchBarItem) => void;
  loading?: boolean;
}

export const SearchBar = function SearchBar({
  placeholder = "Search…",
  debounceMs = 300,
  onSearch,
  items,
  onSelectItem,
  loading = false,
}: SearchBarProps) {
  const listboxId = useId();
  const dropdownOptionId = (index: number) => `${listboxId}-option-${index}`;

  const [inputValue, setInputValue] = useState("");

  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(inputValue);
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputValue, debounceMs, onSearch]);

  // Reset the keyboard highlight whenever the result set changes so it never
  // points at a stale row.
  useEffect(() => {
    setActiveIndex(-1);
  }, [items]);

  const handleClear = () => {
    setInputValue("");
  };

  const handleSelectItem = (item: SearchBarItem) => {
    setInputValue("");
    onSelectItem?.(item);
  };

  const hasInput = inputValue.length > 0;
  const showDropdown = items !== undefined && hasInput && isFocused;
  const canNavigate = showDropdown && !loading && !!items && items.length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsFocused(false);
      return;
    }
    if (!canNavigate || !items) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          handleSelectItem(items[activeIndex]);
        }
        break;
      default:
        break;
    }
  };

  return (
    <Styled.SearchBarContainer ref={containerRef}>
      <Styled.SearchFieldWrapper>
        <Styled.SearchIcon aria-hidden>
          <SearchIcon />
        </Styled.SearchIcon>

        <Styled.SearchInput
          type="text"
          value={inputValue}
          onChange={(e) => {
            if (!isFocused) setIsFocused(true);
            setInputValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          aria-label={placeholder}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            canNavigate && activeIndex >= 0
              ? dropdownOptionId(activeIndex)
              : undefined
          }
        />

        {hasInput && (
          <Styled.ClearButton
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
          >
            <XIcon />
          </Styled.ClearButton>
        )}
      </Styled.SearchFieldWrapper>

      {showDropdown && (
        <SearchDropdown
          id={listboxId}
          items={items}
          loading={loading}
          onSelect={handleSelectItem}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
          getOptionId={dropdownOptionId}
        />
      )}
    </Styled.SearchBarContainer>
  );
};

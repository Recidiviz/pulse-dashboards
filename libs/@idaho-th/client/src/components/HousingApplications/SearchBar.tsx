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

import React, { useEffect, useState } from "react";

import SearchIcon from "../assets/search-icon.svg?react";
import * as Styled from "./HousingApplications.styles";

const SEARCH_DEBOUNCE_MS = 300;

type SearchBarProps = {
  onSearchChange: (value: string) => void;
};

export const SearchBar: React.FC<SearchBarProps> = ({ onSearchChange }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const trimmed = value.trim();
    const timeoutId = setTimeout(() => {
      onSearchChange(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [value, onSearchChange]);

  return (
    <Styled.SearchBarWrapper>
      <Styled.SearchIconWrapper aria-hidden="true">
        <SearchIcon />
      </Styled.SearchIconWrapper>
      <Styled.SearchInput
        placeholder="Search clients by name"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
      />
    </Styled.SearchBarWrapper>
  );
};

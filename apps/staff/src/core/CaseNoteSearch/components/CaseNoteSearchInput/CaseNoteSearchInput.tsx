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

import { palette, spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import styled from "styled-components/macro";

import SearchIconComponent from "../../../../assets/static/images/search.svg?react";
import { PrototypePill } from "../../common/Styles";

const SearchInputWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid ${palette.slate10};
  border-radius: ${rem(spacing.sm)};
  padding: 0 ${rem(spacing.md)};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${rem(spacing.md)} ${rem(spacing.sm)};
  border-radius: ${rem(spacing.sm)};
  border: 0;
  outline: 0;

  &::placeholder {
    color: ${palette.slate60};
  }
`;

const SearchInputAside = styled.span`
  display: flex;
  align-items: center;
  pointer-events: none;
`;

const SearchIcon = styled(SearchIconComponent)`
  width: ${rem(18)};
  height: ${rem(18)};
  margin: ${rem(3)};
`;

interface CaseNoteSearchInputProps
  extends React.ComponentPropsWithoutRef<"input"> {
  hasSearchIcon?: boolean;
  hasPrototypeBadge?: boolean;
  onPressReturn: () => void;
}

export function CaseNoteSearchInput({
  onPressReturn,
  hasSearchIcon = true,
  hasPrototypeBadge = true,
  ...props
}: CaseNoteSearchInputProps) {
  return (
    <SearchInputWrapper>
      {hasSearchIcon && (
        <SearchInputAside>
          <SearchIcon />
        </SearchInputAside>
      )}
      <SearchInput
        className="fs-exclude"
        {...props}
        placeholder="Search Case Notes"
        onKeyDown={(e) => {
          if (e.key === "Enter") onPressReturn();
        }}
      />
      {hasPrototypeBadge && (
        <SearchInputAside>
          <PrototypePill>Prototype</PrototypePill>
        </SearchInputAside>
      )}
    </SearchInputWrapper>
  );
}

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

import React, { useEffect, useRef } from "react";

import SearchIcon from "../../../components/assets/search-icon.svg?react";
import { useDelay } from "../../../hooks/useDelayedTrue";
import { BodyS1, palette } from "../../../styles";
import * as Styled from "./SearchDropdown.styles";

interface SearchDropdownProps {
  id?: string;
  items: Array<{ id: string; name: string }>;
  loading?: boolean;
  onSelect: (item: { id: string; name: string }) => void;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  getOptionId?: (index: number) => string;
}

export const SearchDropdown = function SearchDropdown({
  id,
  items,
  loading = false,
  onSelect,
  activeIndex = -1,
  onActiveIndexChange,
  getOptionId,
}: SearchDropdownProps) {
  let content: React.ReactNode;
  const showLoading = useDelay(loading);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Keep the keyboard-highlighted item scrolled into view.
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  if (showLoading) {
    content = (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <Styled.SkeletonItem key={i}>
            <Styled.SkeletonBar />
          </Styled.SkeletonItem>
        ))}
      </>
    );
  } else if (items.length === 0) {
    content = (
      <Styled.EmptyState>
        <SearchIcon height={24} width={24} />
        <BodyS1 $color={palette.foreground.secondary}>
          No providers found
        </BodyS1>
      </Styled.EmptyState>
    );
  } else {
    content = items.map((item, index) => {
      const isActive = index === activeIndex;
      return (
        <Styled.SelectItem
          key={item.id}
          ref={isActive ? activeItemRef : undefined}
          id={getOptionId?.(index)}
          type="button"
          role="option"
          aria-selected={isActive}
          $active={isActive}
          onMouseEnter={() => onActiveIndexChange?.(index)}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          <Styled.SelectItemText>{item.name}</Styled.SelectItemText>
        </Styled.SelectItem>
      );
    });
  }

  return (
    <Styled.DropdownContainer id={id} role="listbox">
      <Styled.DropdownSlot>{content}</Styled.DropdownSlot>
    </Styled.DropdownContainer>
  );
};

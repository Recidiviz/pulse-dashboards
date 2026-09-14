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

import React from "react";
import styled, { css } from "styled-components";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  DropdownToggle,
  Icon,
  Menubar,
  palette,
} from "~design-system";

import { Sections } from "../../content/types";
import { PathwaysSection } from "../../views";
import { Badge } from "../Badge";

const MAX_VISIBLE = 5;

const StyledMenubar = styled(Menubar)<{ $focusColor: string }>`
  justify-content: flex-start;
  width: auto;
  flex: 1;
  gap: 12px;
  align-items: center;
  padding: 0.5rem;

  && > [role="menuitem"]:focus-visible,
  && > * > [role="menuitem"]:focus-visible {
    box-shadow: none;
    outline: 2px solid ${({ $focusColor }) => $focusColor} !important;
    outline-offset: 2px;
    border-radius: 50px;
  }
`;

const pillBase = css`
  font-size: 14px;
  letter-spacing: -0.14px;
  line-height: 16px;
  border-radius: 50px;
  padding: 8px 16px;
  height: 38px;
  cursor: pointer;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
`;

const disabledPillStyle = css`
  border: 1px solid ${palette.slate15};
  background: white;
  color: ${palette.slate60};
  font-weight: 400;
  opacity: 0.7;
  cursor: not-allowed;
`;

const activePillStyle = ($accent: string) => css`
  border: 1px solid ${$accent};
  background: color-mix(in srgb, ${$accent} 5%, white);
  color: ${$accent};
  font-weight: 700;
`;

const selectablePillStyle = css`
  border: 1px solid ${palette.slate15};
  background: white;
  color: black;
  font-weight: 400;

  &:hover {
    background: ${palette.slate05};
  }
`;

const StyledSectionPill = styled.button<{
  $active: boolean;
  $accent: string;
  $disabled?: boolean;
}>`
  ${pillBase}

  outline: none;

  ${({ $active, $accent, $disabled }) => {
    if ($disabled) return disabledPillStyle;
    if ($active) return activePillStyle($accent);
    return selectablePillStyle;
  }}
`;

type SectionPillProps = {
  label: string;
  active: boolean;
  accent: string;
  disabledReason?: string;
  onSelect: () => void;
};

/**
 * One pill in the section nav. Shows `label`; when `disabledReason` is set,
 * disables the pill, shows the reason as its tooltip and accessible name, and
 * ignores clicks.
 */
function SectionPill({
  label,
  active,
  accent,
  disabledReason,
  onSelect,
}: SectionPillProps) {
  const disabled = Boolean(disabledReason);
  return (
    <StyledSectionPill
      role="menuitem"
      $active={active}
      $accent={accent}
      $disabled={disabled}
      aria-current={active ? "true" : undefined}
      aria-disabled={disabled ? "true" : undefined}
      aria-label={disabledReason ? `${label}, ${disabledReason}` : undefined}
      title={disabledReason}
      onClick={disabled ? undefined : onSelect}
    >
      {label}
    </StyledSectionPill>
  );
}

const MoreToggle = styled(DropdownToggle)<{ $accent: string }>`
  ${pillBase}
  border: 1px solid ${palette.slate15};
  background: white;
  color: black;
  font-weight: 400;
  min-width: auto;
  min-height: auto;

  &:hover,
  &:focus-visible {
    background: ${palette.slate05};
    color: black;
  }

  &:active,
  &[aria-expanded="true"] {
    border-color: ${({ $accent }) => $accent};
    color: ${({ $accent }) => $accent};
    background: white;
  }
`;

const StyledDropdownMenu = styled(DropdownMenu)<{ $accent: string }>`
  && {
    transition: none;
    transform: none;
    min-width: 240px;
  }

  button[role="menuitem"] {
    color: black;

    &:focus {
      color: white;
      background-color: ${({ $accent }) => $accent};
    }
  }

  .section-nav-active-item {
    font-weight: 700;
    color: ${({ $accent }) => $accent};

    &:focus {
      color: white;
    }
  }
`;

const DisabledItemContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
`;

export interface SectionNavigationProps {
  sections: Partial<Sections>;
  activeSection: PathwaysSection;
  onSectionSelect: (sectionId: PathwaysSection) => void;
  accentColor?: string;
  maxVisible?: number;
  disabledSections?: Partial<Record<PathwaysSection, string>>;
}

export function SectionNavigation({
  sections,
  activeSection,
  onSectionSelect,
  accentColor = palette.signal.links,
  maxVisible = MAX_VISIBLE,
  disabledSections = {},
}: SectionNavigationProps) {
  const entries = Object.entries(sections) as [PathwaysSection, string][];
  const needsOverflow = entries.length > maxVisible;

  const visibleEntries = needsOverflow ? entries.slice(0, maxVisible) : entries;
  const overflowEntries = needsOverflow ? entries.slice(maxVisible) : [];

  if (needsOverflow && overflowEntries.some(([id]) => id === activeSection)) {
    const activeIdx = overflowEntries.findIndex(([id]) => id === activeSection);
    const displaced = visibleEntries[maxVisible - 1];
    visibleEntries[maxVisible - 1] = overflowEntries[activeIdx];
    overflowEntries[activeIdx] = displaced;
  }

  const items: React.JSX.Element[] = visibleEntries.map(([id, label]) => (
    <SectionPill
      key={id}
      label={label}
      active={id === activeSection}
      accent={accentColor}
      disabledReason={disabledSections[id]}
      onSelect={() => onSectionSelect(id)}
    />
  ));

  const hasDropdown = overflowEntries.length > 0;

  if (hasDropdown) {
    items.push(
      <Dropdown key="more-dropdown">
        <MoreToggle
          role="menuitem"
          kind="secondary"
          shape="pill"
          $accent={accentColor}
        >
          More
          <Icon kind="Caret" size={8} />
        </MoreToggle>
        <StyledDropdownMenu
          alignment="left"
          ariaLabel="More sections"
          $accent={accentColor}
        >
          {overflowEntries.map(([id, label]) => {
            const disabledReason = disabledSections[id];
            if (disabledReason) {
              return (
                <DropdownMenuItem key={id} disabled preventCloseOnClickEvent>
                  <DisabledItemContent>
                    {label}
                    <Badge>{disabledReason}</Badge>
                  </DisabledItemContent>
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem
                key={id}
                className={
                  id === activeSection ? "section-nav-active-item" : undefined
                }
                onClick={() => onSectionSelect(id)}
              >
                {label}
              </DropdownMenuItem>
            );
          })}
        </StyledDropdownMenu>
      </Dropdown>,
    );
  }

  return (
    <StyledMenubar
      ariaLabel="Section navigation"
      focusBorderColor={accentColor}
      $focusColor={accentColor}
    >
      {items}
    </StyledMenubar>
  );
}

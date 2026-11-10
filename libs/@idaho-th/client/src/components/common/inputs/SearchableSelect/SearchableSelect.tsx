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

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactSelect, { type StylesConfig } from "react-select";

import { borderRadius, fontSizes, palette, spacing } from "../../../../styles";
import type { SelectOption } from "../Select";

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  /** A softer, non-blocking highlight — shown only when hasError is false. */
  hasWarning?: boolean;
  defaultBorderColor?: string;
  backgroundColor?: string;
  disabled?: boolean;
  /** Off by default: most uses need a value at all times. */
  clearable?: boolean;
  id?: string;
  "aria-label"?: string;
  isSearchable?: boolean;
  height?: string;
}

type ReactSelectOption = { value: string; label: string };

function buildStyles(
  hasError?: boolean,
  hasWarning?: boolean,
  defaultBorderColor: string = palette.border.subtle,
  backgroundColor: string = palette.background.primary,
  height = "40px",
  clearable = false,
): StylesConfig<ReactSelectOption, false> {
  let borderColor: string = defaultBorderColor;
  if (hasError) borderColor = palette.border.attention;
  else if (hasWarning) borderColor = palette.misc.strongAmber;

  return {
    container: (base) => ({
      ...base,
      width: "100%",
    }),
    control: (base) => ({
      ...base,
      alignSelf: "stretch",
      background: backgroundColor,
      border: `0.0625rem solid ${borderColor}`,
      borderRadius: borderRadius[8],
      boxShadow: "none",
      boxSizing: "border-box",
      color: palette.foreground.primary,
      cursor: "pointer",
      fontSize: fontSizes.bodyS,
      fontWeight: 400,
      height,
      lineHeight: "1.25rem",
      minHeight: height,
      overflow: "hidden",
      padding: `0 0 0 ${spacing[3]}`,
      width: "100%",
      "&:hover": {
        borderColor,
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: 0,
    }),
    input: (base) => ({
      ...base,
      color: palette.foreground.primary,
      fontSize: fontSizes.bodyS,
      fontWeight: 400,
      lineHeight: "1.25rem",
      margin: 0,
      padding: 0,
    }),
    singleValue: (base) => ({
      ...base,
      color: palette.foreground.primary,
      fontSize: fontSizes.bodyS,
      fontWeight: 400,
      lineHeight: "1.25rem",
      margin: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: palette.misc.primaryMuted,
      fontSize: fontSizes.bodyS,
      fontWeight: 400,
      lineHeight: "1.25rem",
      margin: 0,
    }),
    // react-select renders this unconditionally; it only divides anything once
    // the clear × is there.
    indicatorSeparator: (base, state) => ({
      ...base,
      alignSelf: "center",
      backgroundColor: palette.border.subtle,
      display: clearable && state.selectProps.value ? "block" : "none",
      height: "1rem",
      margin: spacing[1],
      width: "0.065rem",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: palette.foreground.tertiary,
      padding: 0,
      svg: { height: "1rem", width: "1rem" },
      "&:hover": {
        color: palette.foreground.primary,
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: palette.foreground.tertiary,
      padding: `0 ${spacing[3]} 0 0`,
      svg: { height: "1rem", width: "1rem" },
      "&:hover": {
        color: palette.foreground.primary,
      },
    }),
    menu: (base) => ({
      ...base,
      background: palette.background.primary,
      border: `0.0625rem solid ${palette.misc.subtleAlpha}`,
      borderRadius: borderRadius[20],
      boxShadow: `0.1875rem 0.3125rem 1.875rem 0.3125rem ${palette.misc.shadowFaint}`,
      marginTop: spacing[2],
      padding: spacing[2],
      zIndex: 20,
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: "20.5rem",
      padding: 0,
      scrollbarWidth: "thin",
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused ? palette.state.brandHover : "transparent",
      borderRadius: borderRadius[12],
      color: state.isSelected
        ? palette.foreground.secondary
        : palette.foreground.primary,
      cursor: "pointer",
      fontSize: fontSizes.bodyS,
      fontWeight: 400,
      lineHeight: "1.25rem",
      minHeight: "2rem",
      padding: `${spacing[2]} ${spacing[3]}`,
      "&:active": {
        background: palette.state.brandHover,
      },
    }),
  };
}

/**
 * Searchable single-select on react-select, styled to match `Select`. Adds a
 * hover tooltip for truncated values, which react-select lacks.
 */
export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  onBlur,
  placeholder = "Select…",
  hasError,
  hasWarning,
  defaultBorderColor,
  backgroundColor,
  disabled,
  clearable = false,
  id,
  "aria-label": ariaLabel,
  isSearchable = true,
  height = "40px",
}) => {
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  const selectedOption = value ? { value, label: value } : null;
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  const handleMouseEnter = () => {
    if (isMenuOpen) return;
    const container = controlRef.current;
    if (!container) return;
    const singleValueEl = container.querySelector(
      ".searchable-select__single-value",
    ) as HTMLElement | null;
    if (
      singleValueEl &&
      singleValueEl.scrollWidth > singleValueEl.clientWidth
    ) {
      const rect = singleValueEl.getBoundingClientRect();
      setTooltipPos({ x: rect.left, y: rect.top });
    }
  };

  return (
    <div
      ref={controlRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setTooltipPos(null)}
      style={{ width: "100%" }}
    >
      <ReactSelect<ReactSelectOption, false>
        inputId={id}
        isSearchable={isSearchable}
        classNamePrefix="searchable-select"
        isClearable={clearable}
        isDisabled={disabled}
        onMenuOpen={() => {
          setIsMenuOpen(true);
          setTooltipPos(null);
        }}
        onMenuClose={() => setIsMenuOpen(false)}
        options={options}
        value={selectedOption ? { value, label: selectedLabel } : null}
        onChange={(option) => onChange(option ? option.value : "")}
        onBlur={onBlur}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={hasError}
        styles={buildStyles(
          hasError,
          hasWarning,
          defaultBorderColor,
          backgroundColor,
          height,
          clearable,
        )}
      />
      {tooltipPos &&
        value &&
        createPortal(
          <div
            style={{
              background: palette.background.strong,
              borderRadius: borderRadius[4],
              color: palette.foreground.onStrong,
              fontSize: fontSizes.caption,
              left: tooltipPos.x,
              lineHeight: "1.25rem",
              maxWidth: "20rem",
              padding: `${spacing[1]} ${spacing[2]}`,
              pointerEvents: "none",
              position: "fixed",
              top: Math.max(0, tooltipPos.y - 40),
              wordBreak: "break-word",
              zIndex: 9999,
            }}
          >
            {selectedLabel}
          </div>,
          document.body,
        )}
    </div>
  );
};

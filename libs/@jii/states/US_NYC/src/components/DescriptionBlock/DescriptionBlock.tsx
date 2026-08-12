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

import { FC, useLayoutEffect, useRef, useState } from "react";

import { CopyWrapper } from "~@jii/common-ui";

import {
  DescriptionBody,
  DescriptionWrapper,
  ToggleButton,
} from "./DescriptionBlock.styles";

const DESCRIPTION_BLOCK_COPY = {
  showLess: "Show less",
  showMore: "Show full description",
};

const COLLAPSE_LINES = 3;
const TOLERANCE = 2;

export type DescriptionBlockProps = {
  markdown: string;
};

export const DescriptionBlock: FC<DescriptionBlockProps> = ({ markdown }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  /** Runs before paint so long text isn't briefly visible at full height before clamping. */
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    setExpanded(false);

    /**
     * getComputedStyle returns a px string ("19.2px") - parseFloat strips the unit.
     * Fallback to 24 (an arbitrary value derived from ≈1.5 × a 16px font) in case the value is
     * the keyword "normal", which parseFloat can't parse. Browsers resolve "normal" to px in
     * practice, so this is a last-resort safety net.
     */
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 24;
    setOverflows(el.scrollHeight > lineHeight * COLLAPSE_LINES + TOLERANCE);
  }, [markdown]);

  return (
    <DescriptionWrapper>
      <DescriptionBody ref={bodyRef} $clamped={!expanded && overflows}>
        <CopyWrapper>{markdown}</CopyWrapper>
      </DescriptionBody>
      {overflows && (
        <ToggleButton
          type="button"
          onClick={() => setExpanded((expanded) => !expanded)}
          aria-expanded={expanded}
        >
          {expanded
            ? DESCRIPTION_BLOCK_COPY.showLess
            : DESCRIPTION_BLOCK_COPY.showMore}
        </ToggleButton>
      )}
    </DescriptionWrapper>
  );
};

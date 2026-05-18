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
import { rem } from "polished";
import styled, { css } from "styled-components";

import { Icon, palette, spacing } from "~design-system";

import { CopyWrapper } from "../CopyWrapper/CopyWrapper";

// this allows us to interpolate this component into styled-components styles
const AccordionCopyWrapper = styled(CopyWrapper)``;

const AccordionPanel = styled.div`
  padding: ${rem(spacing.md)};
  padding-bottom: ${rem(40)};
`;

// hide the arrow
const AccordionSummary = styled.summary`
  list-style: none;
  margin: 0;
  &::-webkit-details-marker {
    display: none;
  }
`;

const CaretContainer = styled.div`
  height: ${rem(24)};
  width: ${rem(24)};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const SummaryBar = styled.div<{ $isOpen: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: ${rem(spacing.md)};

  ${AccordionCopyWrapper} {
    margin: 0;
  }

  ${({ $isOpen }) =>
    $isOpen
      ? css`
          background-color: ${palette.pine2};
          border-radius: ${rem(spacing.xs)};

          ${AccordionCopyWrapper}, ${CaretContainer} {
            color: ${palette.marble1};
          }
        `
      : `border-bottom: 1px solid ${palette.slate30};`}
`;

export type AccordionCopy = Record<string, { header: string; content: string }>;

type AccordionProps = {
  /* Copy for each accordion panel, keyed by panel ID. Both the header and content
     of a panel can be Markdown. */
  copy: AccordionCopy;

  /* State of the accordion: open panel IDs map to true, closed panels to false.
     By default, if an ID doesn't appear in this record, that panel is closed. */
  toggledPanels: Partial<Record<string, boolean>>;

  /* Called whenever the user toggles an accordion panel open or closed. */
  onToggle: (id: string) => void;
};

/**
 * An accordion for grouping related sections of Markdown content
 * that can be shown/hidden. Multiple accordion panels can be open at once.
 *
 * The accordion expects to be fully controlled by its parent.
 */
export const Accordion = observer(function Accordion({
  copy,
  toggledPanels,
  onToggle,
}: AccordionProps) {
  return Object.keys(copy).map((id) => {
    const isOpen = !!toggledPanels[id];
    return (
      <details key={id} open={isOpen}>
        <AccordionSummary
          onClick={(e) => {
            e.preventDefault();
            onToggle(id);
          }}
        >
          <SummaryBar $isOpen={isOpen}>
            <AccordionCopyWrapper>{copy[id].header}</AccordionCopyWrapper>
            <CaretContainer>
              <Icon kind="DownChevron" rotate={isOpen ? 180 : 0} size={14} />
            </CaretContainer>
          </SummaryBar>
        </AccordionSummary>

        <AccordionPanel>
          <AccordionCopyWrapper>{copy[id].content}</AccordionCopyWrapper>
        </AccordionPanel>
      </details>
    );
  });
});

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

import { spacing } from "@recidiviz/design-system";
import { rem } from "polished";
import { useCallback } from "react";
import WindowScroller from "react-virtualized/dist/commonjs/WindowScroller";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import styled from "styled-components/macro";

import useIsMobile from "../../hooks/useIsMobile";
import { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { CaseloadOpportunityCell } from "./CaseloadOpportunityCell";

const DEFAULT_ITEM_HEIGHT = 80;
const DEFAULT_ITEM_WIDTH = 200;

const CaseloadOpportunityRow = styled.div`
  margin-top: ${rem(spacing.md)};
`;

type CaseloadOpportunityGridProps = {
  items: Opportunity<JusticeInvolvedPerson>[];
};

// TODO(#7667): Make the screen width breakpoint for 1 column display narrower
// TODO(#7684): Stop scrolling to the top of page when this component renders
const CaseloadOpportunityGrid = ({
  items = [],
}: CaseloadOpportunityGridProps) => {
  const isMobile = useIsMobile();

  const itemsPerRow = isMobile ? 1 : 2;
  const rowCount = Math.ceil(items.length / itemsPerRow);

  const RenderRow = useCallback<List["props"]["children"]>(
    ({ index, style }) => {
      const fromIndex = index * itemsPerRow;
      const toIndex = Math.min(fromIndex + itemsPerRow, items.length);

      // When there is an odd number of opportunity candidates AND we are displaying
      // the caseload in two columns, we need to align the final candidate cell's width
      // with the first column, rather than having it take up the full final row width.
      const halfWidthItem =
        items.length % 2 === 1 &&
        itemsPerRow === 2 &&
        toIndex === items.length &&
        items.length > 1;

      const halfWidthStyle = {
        width: "50%",
        flex: "none",
      };

      const defaultStyle = {
        width: DEFAULT_ITEM_WIDTH,
        flex: `${DEFAULT_ITEM_WIDTH} 0 auto`,
      };

      const opportunityCells = items
        .slice(fromIndex, toIndex)
        .map((item) => (
          <CaseloadOpportunityCell
            key={item.selectId}
            opportunity={item}
            style={halfWidthItem ? halfWidthStyle : defaultStyle}
          />
        ));

      return (
        <CaseloadOpportunityRow style={{ display: "flex", ...style }}>
          {opportunityCells}
        </CaseloadOpportunityRow>
      );
    },
    [items, itemsPerRow],
  );

  return (
    <WindowScroller scrollElement={window}>
      {({ registerChild }) => (
        <AutoSizer disableHeight>
          {({ width }) => (
            <List
              outerRef={registerChild}
              height={DEFAULT_ITEM_HEIGHT * rowCount + spacing.md}
              itemCount={rowCount}
              itemSize={DEFAULT_ITEM_HEIGHT}
              width={width * 0.875}
            >
              {RenderRow}
            </List>
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );
};

export default CaseloadOpportunityGrid;

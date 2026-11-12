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

import { rem } from "polished";
import styled from "styled-components";

import {
  ModalActionRow,
  ParoleBoardButton,
  semantics,
} from "~@parole-board/common";
import { SkeletonGroup, SkeletonText } from "~@parole-board/common/loading";

import { PUBLISH_COPY } from "./copy";
import { ConfirmPanel, CountsTable } from "./PublishMonthModal.styles";

const { space } = semantics;

// The counts sit at the right of their cells.
const NumberSkeleton = styled(SkeletonText)`
  margin-left: auto;
`;

// Stands in for the CheckboxGroup's own padding inside the panel.
const ConfirmLines = styled.div`
  padding: ${rem(space.sm)};
`;

export interface PublishMonthSkeletonProps {
  onCancel: () => void;
}

/**
 * The publish dialog's body while the publish preview loads: the counts
 * table and the confirm panel as placeholders, with "Cancel" ready and the
 * publish button disabled.
 */
export function PublishMonthSkeleton({ onCancel }: PublishMonthSkeletonProps) {
  return (
    <>
      <SkeletonGroup label="Loading the publish preview">
        <CountsTable aria-hidden>
          <tbody>
            {["days", "hearings"].map((row) => (
              <tr key={row}>
                <th>
                  <SkeletonText width="40%" level="Sans14" />
                </th>
                <td>
                  <NumberSkeleton width="25%" level="Sans14" />
                </td>
              </tr>
            ))}
          </tbody>
        </CountsTable>
        <ConfirmPanel aria-hidden $disabled>
          <ConfirmLines>
            <SkeletonText width="100%" level="Sans14" />
            <SkeletonText width="60%" level="Sans14" />
          </ConfirmLines>
        </ConfirmPanel>
      </SkeletonGroup>
      <ModalActionRow>
        <ParoleBoardButton kind="secondary" onClick={onCancel}>
          Cancel
        </ParoleBoardButton>
        <ParoleBoardButton kind="primary" disabled>
          {PUBLISH_COPY.action}
        </ParoleBoardButton>
      </ModalActionRow>
    </>
  );
}

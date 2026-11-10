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

import { ColumnDef } from "@tanstack/react-table";

import { findAlert } from "~@idaho-th/client/utils/applications";
import { formatResponseTimestamp } from "~@idaho-th/client/utils/date";
import { AlertType, APPLICATION_LAST_UPDATED_STATUS } from "~@idaho-th/shared";

import { HousingApplication } from "../../../../interfaces/common";
import * as Styled from "../ApplicationsTable.styles";

// id matches the backend's sortable field name (HousingApplication.lastActivityAt);
// accessorKey reads the corresponding value off the dashboard list item.
export const lastActivityAtColumn: ColumnDef<HousingApplication> = {
  id: "lastActivityAt",
  accessorKey: "lastUpdatedAt",
  enableSorting: true,
  header: "Last Updated",
  meta: { textAlign: "right" },
  cell: ({ row }) => {
    const { lastUpdatedAt, lastUpdatedStatus, alerts } = row.original;
    const isNewApplication = !!findAlert(alerts, AlertType.NEW_APPLICATION);
    const dateLabel = formatResponseTimestamp(lastUpdatedAt);
    return (
      <Styled.AlertsCell>
        <Styled.CellSlot $align="end">
          <Styled.LastUpdatesContent>
            {isNewApplication && (
              <Styled.AlertWrapper>
                <Styled.NewApplicationDot />
                <Styled.NewApplicationText>
                  New application
                </Styled.NewApplicationText>
              </Styled.AlertWrapper>
            )}
            {!isNewApplication &&
              lastUpdatedStatus ===
                APPLICATION_LAST_UPDATED_STATUS.NEW_UPDATES && (
                <Styled.AlertWrapper>
                  <Styled.AlertDot />
                  <Styled.AlertText>New Updates</Styled.AlertText>
                </Styled.AlertWrapper>
              )}
            {lastUpdatedStatus ===
              APPLICATION_LAST_UPDATED_STATUS.NO_UPDATES_30D && (
              <Styled.NoAlertText>No Updates (30d)</Styled.NoAlertText>
            )}
            <Styled.LastUpdatedDateText>{dateLabel}</Styled.LastUpdatedDateText>
          </Styled.LastUpdatesContent>
        </Styled.CellSlot>
      </Styled.AlertsCell>
    );
  },
};

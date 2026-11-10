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

import { CellContext, ColumnDef } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import React from "react";

import {
  findAlert,
  formatReleaseDateChange,
} from "~@idaho-th/client/utils/applications";
import { formatCalendarDate } from "~@idaho-th/client/utils/date";
import { AlertType, USER_ROLE } from "~@idaho-th/shared";

import { useIdahoTHStore } from "../../../../datastores/IdahoTHStoreContext";
import { HousingApplication } from "../../../../interfaces/common";
import ArrowSmRightIcon from "../../../assets/arrow-sm-right.svg?react";
import * as Styled from "../ApplicationsTable.styles";

const StaffReleaseDateCell: React.FC<{ expectedReleaseDate: Date | null }> = ({
  expectedReleaseDate,
}) => (
  <Styled.CellSlot $align="end">
    {formatCalendarDate(expectedReleaseDate, "MMM dd") || "—"}
  </Styled.CellSlot>
);

const ProviderReleaseDateCell: React.FC<{
  expectedReleaseDate: Date | null;
  deltaDays: number | undefined;
}> = ({ expectedReleaseDate, deltaDays }) => (
  <Styled.ReleaseDateContent>
    <Styled.CellSlot $align="end">
      {deltaDays !== undefined ? (
        <Styled.ReleaseDateHighlight>
          <Styled.ReleaseDateDot />
          <Styled.ReleaseDateHighlightText>
            {formatCalendarDate(expectedReleaseDate, "MMM dd") || "—"}
          </Styled.ReleaseDateHighlightText>
        </Styled.ReleaseDateHighlight>
      ) : (
        formatCalendarDate(expectedReleaseDate, "MMM dd") || "—"
      )}
    </Styled.CellSlot>
    {deltaDays !== undefined && (
      <Styled.ReleaseDateAnnotationRow>
        <ArrowSmRightIcon width={12} height={12} />
        <Styled.ReleaseDateAnnotationText>
          {formatReleaseDateChange(deltaDays)}
        </Styled.ReleaseDateAnnotationText>
      </Styled.ReleaseDateAnnotationRow>
    )}
  </Styled.ReleaseDateContent>
);

const ReleaseDateCell = observer(function ReleaseDateCell({
  row,
}: CellContext<HousingApplication, unknown>) {
  const idahoTHStore = useIdahoTHStore();
  const userRole = idahoTHStore.rootStore.userStore.user?.role;
  const { expectedReleaseDate, alerts } = row.original;
  const releaseDateAlert = findAlert(alerts, AlertType.RELEASE_DATE_CHANGED);

  return (
    <Styled.ReleaseDateCell>
      {userRole === USER_ROLE.PROVIDER ? (
        <ProviderReleaseDateCell
          expectedReleaseDate={expectedReleaseDate}
          deltaDays={releaseDateAlert?.metadata.deltaDays}
        />
      ) : (
        <StaffReleaseDateCell expectedReleaseDate={expectedReleaseDate} />
      )}
    </Styled.ReleaseDateCell>
  );
});

export const expectedReleaseDateColumn: ColumnDef<HousingApplication> = {
  id: "expectedReleaseDate",
  accessorKey: "expectedReleaseDate",
  enableSorting: true,
  header: "Release date",
  meta: { textAlign: "right", width: "10rem" },
  cell: ReleaseDateCell,
};

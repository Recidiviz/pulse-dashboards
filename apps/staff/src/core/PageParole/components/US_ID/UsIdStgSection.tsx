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

import { ParoleCase } from "~datatypes";

import type { ParoleConfig } from "../../../models/types";
import { EmptyState, SubsectionTitle } from "../shared";

export function UsIdStgSection({
  caseDetail,
}: {
  caseDetail: ParoleCase;
  config: ParoleConfig;
}) {
  const stg = caseDetail.stg;
  return (
    <div>
      <SubsectionTitle>Gang / Security Threat Group (STG)</SubsectionTitle>
      {stg ? (
        <div>{stg}</div>
      ) : (
        <EmptyState>No STG affiliation on record.</EmptyState>
      )}
    </div>
  );
}

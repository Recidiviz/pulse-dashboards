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

import { observer } from "mobx-react-lite";
import React from "react";

import { useRootStore } from "../../components/StoreProvider";

type WorkflowsOfficerNameProps =
  | {
      officerId: string;
      officerEmail?: never;
    }
  | {
      officerId?: never;
      officerEmail: string;
    };

const WorkflowsOfficerName: React.FC<WorkflowsOfficerNameProps> = ({
  officerId,
  officerEmail,
}) => {
  const {
    workflowsStore: {
      availableOfficers,
      searchStore: { searchType },
    },
  } = useRootStore();

  if (!officerId && !officerEmail) return null;

  const officer = availableOfficers.find((o) => {
    return officerId ? o.id === officerId : o.email === officerEmail;
  });

  let officerFullName: string | undefined;
  // unlikely but not impossible that name data could be missing
  if (officer?.givenNames && officer?.surname) {
    officerFullName = `${officer.givenNames} ${officer.surname}`.trim();
  }

  if (searchType === "CASELOAD" && officerId)
    officerFullName = `Caseload ${officerId}`;

  return (
    <span className="fs-exclude">
      {officerFullName ?? officerId ?? officerEmail}
    </span>
  );
};

export default observer(WorkflowsOfficerName);

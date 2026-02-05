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

import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";

import { useRootStore } from "../../components/StoreProvider";
import { WorkflowsNavLayout } from "../WorkflowsLayouts";

export const UsNcRNAViewer = observer(function UsNcRNAViewer() {
  const { jiiTrpcClient, workflowsStore } = useRootStore();

  const q = useQuery(
    jiiTrpcClient.staff.usNc.rnaStatusList.queryOptions({
      pseudonymizedIds: workflowsStore.caseloadPersons.map(
        (p) => p.pseudonymizedId,
      ),
    }),
  );
  // TODO: proof of concept only
  // eslint-disable-next-line no-console
  console.log(q.data);

  return (
    <WorkflowsNavLayout>
      <div>Hello world!</div>
    </WorkflowsNavLayout>
  );
});

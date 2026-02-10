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

import { useSuspenseQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";

import { useRootStore } from "../../components/StoreProvider";

export const RNAListQuerier = observer(function RNAListQuerier() {
  const { workflowsStore } = useRootStore();

  if (
    workflowsStore.searchStore.searchType !== "FACILITY" ||
    workflowsStore.searchStore.selectedSearchIds.length === 0
  ) {
    // TODO: style this correctly to match other workflows pages
    return <div>Please select a facility</div>;
  }

  return (
    <RNAFacilityQuerier
      facilityIds={workflowsStore.searchStore.selectedSearchIds}
    />
  );
});

type QuerierProps = {
  facilityIds: Array<string>;
};

function RNAFacilityQuerier({ facilityIds }: QuerierProps) {
  const { jiiTrpcClient } = useRootStore();

  const { data } = useSuspenseQuery(
    jiiTrpcClient.staff.usNc.rnaStatusList.queryOptions({
      lookupField: "facilityId",
      lookupValue: facilityIds,
    }),
  );

  return (
    <>
      <div>Hello world!</div>
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
    </>
  );
}

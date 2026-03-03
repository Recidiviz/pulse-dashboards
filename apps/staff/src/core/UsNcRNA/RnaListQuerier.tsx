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

import { JiiStaffAppRouterInputs } from "~@jii/trpc-types";

import { useRootStore } from "../../components/StoreProvider";
import { Location } from "../../WorkflowsStore/Location";
import { Officer } from "../../WorkflowsStore/Officer";
import {
  EmptyStateText,
  EmptyStateWrapper,
} from "../OpportunityCaseloadView/HydratedOpportunityPersonList";
import { RNATable } from "./UsNcRNATable";

export const RNAListQuerier = observer(function RNAListQuerier() {
  const {
    workflowsStore: { searchStore },
  } = useRootStore();

  const searchedForFacility = searchStore.selectedSearchables.some(
    (s) => s instanceof Location,
  );
  const searchedForOfficer = searchStore.selectedSearchables.some(
    (s) => s instanceof Officer,
  );

  if (searchedForFacility && searchedForOfficer) {
    // TODO(#12294): handle this case if needed
    return (
      <EmptyStateWrapper>
        <EmptyStateText>
          Please select only facilities or only case managers above.
        </EmptyStateText>
      </EmptyStateWrapper>
    );
  } else if (searchedForFacility) {
    return (
      <RNAQuerier
        lookupField={"facilityId"}
        ids={searchStore.selectedSearchIds}
      />
    );
  } else if (searchedForOfficer) {
    return (
      <RNAQuerier
        lookupField={"officerId"}
        ids={searchStore.selectedSearchIds}
      />
    );
  } else {
    return (
      <EmptyStateWrapper>
        <EmptyStateText>Please select a caseload above.</EmptyStateText>
      </EmptyStateWrapper>
    );
  }
});

type LookupField =
  JiiStaffAppRouterInputs["staff"]["usNc"]["rnaStatusList"]["lookupField"];

type QuerierProps = {
  ids: Array<string>;
  lookupField: LookupField;
};

function RNAQuerier({ ids, lookupField }: QuerierProps) {
  const {
    jiiTrpc: { querier },
  } = useRootStore();

  const { data, refetch } = useSuspenseQuery(
    querier.staff.usNc.rnaStatusList.queryOptions({
      lookupField,
      lookupValue: ids,
    }),
  );

  return <RNATable data={data} refetch={refetch} />;
}

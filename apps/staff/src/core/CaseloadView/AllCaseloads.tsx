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

import {
  useFeatureVariants,
  useRootStore,
} from "../../components/StoreProvider";
import { pluralizeWord, toTitleCase } from "../../utils";
import CaseloadHydrator from "../CaseloadHydrator/CaseloadHydrator";
import WorkflowsResults from "../WorkflowsResults";
import { AllCaseloadsList } from "./AllCaseloadsList";
import { AllCaseloadsTable } from "./AllCaseloadsTable";

function AllCaseloadsViz() {
  const { usTn2026ClassificationPolicyPilot } = useFeatureVariants();
  const {
    currentTenantId,
    workflowsStore: { activeSystem },
  } = useRootStore();

  if (
    usTn2026ClassificationPolicyPilot &&
    currentTenantId === "US_TN" &&
    activeSystem === "INCARCERATION"
  ) {
    return <AllCaseloadsTable />;
  }

  return <AllCaseloadsList />;
}

export const AllCaseloads = observer(function AllCaseloads() {
  const {
    workflowsStore: {
      justiceInvolvedPersonTitle,
      activeSystemConfig,
      searchStore: { caseloadPersons, workflowsSearchFieldTitle, searchType },
    },
  } = useRootStore();

  const searchTitleIgnoreCase = activeSystemConfig?.search.filter(
    (search) => search.searchType === searchType,
  )[0]?.searchTitleIgnoreCase;

  return (
    <CaseloadHydrator
      initial={
        <WorkflowsResults
          headerText={`All ${toTitleCase(justiceInvolvedPersonTitle)}s`}
          callToActionText={`Search for ${pluralizeWord({
            term: workflowsSearchFieldTitle,
            justAppendS: searchTitleIgnoreCase,
          })} above to view their entire caseload.`}
        />
      }
      hydrated={
        <WorkflowsResults
          headerText={`All ${toTitleCase(justiceInvolvedPersonTitle)}s (${
            caseloadPersons.length
          })`}
        >
          <AllCaseloadsViz />
        </WorkflowsResults>
      }
      empty={null}
    />
  );
});

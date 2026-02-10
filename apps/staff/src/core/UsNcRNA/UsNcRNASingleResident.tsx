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

import { observer } from "mobx-react-lite";
import { Suspense } from "react";

import Loading from "../../components/Loading";
import { useRootStore } from "../../components/StoreProvider";
import { Resident } from "../../WorkflowsStore/Resident";
import ErrorBoundary from "../ErrorBoundary";
import { ResultsPage } from "./UsNcRNASingleResidentResults/ResultsPage";

export const UsNcRNASingleResident = observer(function UsNcRNASingleResident() {
  const {
    workflowsStore: { selectedPerson },
  } = useRootStore();

  if (
    !selectedPerson ||
    selectedPerson.stateCode !== "US_NC" ||
    !(selectedPerson instanceof Resident)
  ) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <ResultsPage resident={selectedPerson} />;
      </Suspense>
    </ErrorBoundary>
  );
});

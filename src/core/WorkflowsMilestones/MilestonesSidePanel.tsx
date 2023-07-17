// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { useRootStore } from "../../components/StoreProvider";
import CongratulatedSidePanel from "./CongratulatedSidePanel";
import DeclinedSidePanel from "./DeclinedSidePanel";
import ErrorSidePanel from "./ErrorSidePanel";
import { MilestonesTab } from "./MilestonesCaseloadView";
import NewMilestonesSidePanel from "./NewMilestonesSidePanel";

export const MilestonesSidePanel = observer(function MilestonesSidePanel({
  activeTab,
}: {
  activeTab: MilestonesTab;
}) {
  const {
    workflowsStore,
    workflowsStore: { selectedClient },
  } = useRootStore();
  if (!selectedClient) return null;

  switch (activeTab) {
    case "NEW_MILESTONES":
      return <NewMilestonesSidePanel client={selectedClient} />;
    case "CONGRATULATED":
      return (
        <CongratulatedSidePanel
          client={selectedClient}
          closeModal={() => workflowsStore.updateSelectedPerson(undefined)}
        />
      );
    case "DECLINED":
      return (
        <DeclinedSidePanel
          client={selectedClient}
          closeModal={() => workflowsStore.updateSelectedPerson(undefined)}
        />
      );
    case "ERRORS":
      return <ErrorSidePanel client={selectedClient} />;
    default:
      return <div>Default page</div>;
  }
});

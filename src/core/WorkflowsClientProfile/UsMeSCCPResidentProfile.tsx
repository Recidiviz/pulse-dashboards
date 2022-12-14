// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { Incarceration } from "./Details";
import { Heading } from "./Heading";
import { OpportunityModule } from "./OpportunityModule";

type UsMeSCCPResidentProfileProps = {
  formLinkButton?: boolean;
};

export const UsMeSCCPResidentProfile: React.FC<UsMeSCCPResidentProfileProps> = observer(
  function UsMeSCCPResidentProfile({ formLinkButton }) {
    const { workflowsStore } = useRootStore();

    const resident = workflowsStore.selectedResident;
    if (!resident?.verifiedOpportunities.usMeSCCP) {
      return null;
    }
    // TODO(#2786) Add back CaseNotes once data is available for US_ME
    return (
      <article>
        <Heading person={resident} />
        <OpportunityModule
          opportunity={resident.verifiedOpportunities.usMeSCCP}
          formLinkButton={formLinkButton}
        />
        <Incarceration resident={resident} />
        {/* <CaseNotes
          opportunityRecord={resident.verifiedOpportunities.usMeSCCP?.record}
        /> */}
      </article>
    );
  }
);

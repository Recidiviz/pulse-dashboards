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
import { CaseNotes, Contact, Supervision } from "./Details";
import { Heading } from "./Heading";
import { OpportunityModule } from "./OpportunityModule";

type LSUClientProfileProps = {
  formLinkButton?: boolean;
};

export const LSUClientProfile: React.FC<LSUClientProfileProps> = observer(
  function LSUClientProfile({ formLinkButton }) {
    const { workflowsStore } = useRootStore();

    const client = workflowsStore.selectedClient;
    if (!client?.verifiedOpportunities.LSU) {
      return null;
    }

    return (
      <article>
        <Heading person={client} />
        <OpportunityModule
          opportunity={client.verifiedOpportunities.LSU}
          formLinkButton={formLinkButton}
        />
        <Supervision client={client} />
        <Contact client={client} />
        <CaseNotes
          opportunityRecord={client.verifiedOpportunities.LSU?.record}
        />
      </article>
    );
  }
);

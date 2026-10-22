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

import { DocumentData } from "firebase/firestore";

import { OpportunityRecordBase, opportunitySchemaBase } from "~datatypes";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityTab, OpportunityTabGroup } from "../../types";

export class UsTxRemovalFromElectronicMonitoringOpportunity extends OpportunityBase<
  Client,
  OpportunityRecordBase
> {
  constructor(client: Client, record: DocumentData) {
    super(
      client,
      "usTxRemovalFromElectronicMonitoring",
      client.rootStore,
      opportunitySchemaBase.parse(record),
    );
  }

  tabTitle(category?: OpportunityTabGroup): OpportunityTab {
    const title = super.tabTitle(category);
    const configuredTabs = Object.values(this.config.tabGroups ?? {}).flat();
    return title === "Eligible Now" &&
      configuredTabs.includes("Ready for Review")
      ? "Ready for Review"
      : title;
  }
}

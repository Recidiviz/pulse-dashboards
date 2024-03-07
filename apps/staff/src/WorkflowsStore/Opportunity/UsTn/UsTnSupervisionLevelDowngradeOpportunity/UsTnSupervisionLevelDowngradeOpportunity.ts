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

import { makeObservable } from "mobx";

import { Client } from "../../../Client";
import { OpportunityBase } from "../../OpportunityBase";
import { formatBaseSLDRequirements } from "../../SupervisionLevelDowngradeReferralRecord";
import { OpportunityRequirement } from "../../types";
import {
  getSLDValidator,
  UsTnSupervisionLevelDowngradeReferralRecord,
  usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter,
} from "./UsTnSupervisionLevelDowngradeReferralRecord";

export class UsTnSupervisionLevelDowngradeOpportunity extends OpportunityBase<
  Client,
  UsTnSupervisionLevelDowngradeReferralRecord
> {
  readonly caseNotesTitle = "Relevant Contact Codes";

  constructor(client: Client) {
    super(
      client,
      "supervisionLevelDowngrade",
      client.rootStore,
      usTnSupervisionLevelDowngradeReferralRecordSchemaForSupervisionLevelFormatter(
        (raw) => client.rootStore.workflowsStore.formatSupervisionLevel(raw),
      ).parse,
      getSLDValidator(client),
    );

    makeObservable(this, { requirementsMet: true });
  }

  get requirementsMet(): OpportunityRequirement[] {
    if (!this.record) return [];

    return formatBaseSLDRequirements(this.record);
  }
}

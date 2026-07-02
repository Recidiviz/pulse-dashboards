// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { DenialInputSettings } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";
import { usTnGateMarkSubmittedOnFormDownloaded } from "./utils";

export class UsTnSuspensionofDirectSupervisionConfiguration extends ApiOpportunityConfiguration {
  get markSubmittedOnFormDownload(): boolean {
    return usTnGateMarkSubmittedOnFormDownloaded(this.userStore);
  }

  get denialInputSettings(): Record<string, DenialInputSettings> {
    const leadershipDenialInput: DenialInputSettings = {
      required: false,
      heading: "Reason given by leadership:",
      placeholder: "Please specify a reason...",
      inputType: "text",
    };
    return {
      "DENIAL BY DD": leadershipDenialInput,
      "DENIAL BY CA": leadershipDenialInput,
      "DENIAL BY PA": leadershipDenialInput,
    };
  }
}

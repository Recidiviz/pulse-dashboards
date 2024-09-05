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

import { OpportunityTab } from "../../../../types";
import { ApiOpportunityConfiguration } from "../../ApiOpportunityConfigurationImpl";

// TODO(#6073) Remove this file once the fields are added to the backend
export class UsNdIncarcerationConfiguration extends ApiOpportunityConfiguration {
  get snoozeModalPrompt() {
    return "What action has been taken?";
  }

  get snoozeConfirmationText() {
    return "Action taken: Entered in Elite";
  }

  get deniedTabTitle(): OpportunityTab {
    return "Assessment Complete";
  }
}

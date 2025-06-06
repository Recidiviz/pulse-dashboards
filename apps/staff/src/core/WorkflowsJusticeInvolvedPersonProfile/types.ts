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

import type { JusticeInvolvedPerson, Opportunity } from "../../WorkflowsStore";
import { Client } from "../../WorkflowsStore";
import { Resident } from "../../WorkflowsStore/Resident";

export type PersonProfileProps = {
  person: JusticeInvolvedPerson;
};

export type ClientProfileProps = {
  client: Client;
};

export type ResidentProfileProps = {
  resident: Resident;
};

export type OpportunityProfileProps = {
  opportunity: Opportunity;
};

export type ClientWithOpportunityProps = ClientProfileProps &
  OpportunityProfileProps;

export type ResidentWithOptionalOpportunityProps = ResidentProfileProps &
  Partial<OpportunityProfileProps>;

export type OpportunitySidebarProfileProps = {
  opportunity?: Opportunity;
  formLinkButton?: boolean;
  formView?: boolean;
  shouldTrackOpportunityPreviewed?: boolean;
  onDenialButtonClick?: () => void;
  onSubmit?: () => void;
  selectedPerson: JusticeInvolvedPerson | undefined;
};

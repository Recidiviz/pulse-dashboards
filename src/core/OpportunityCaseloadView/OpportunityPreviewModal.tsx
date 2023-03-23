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

import { Opportunity } from "../../WorkflowsStore";
import { OpportunityProfile } from "../WorkflowsClientProfile/OpportunityProfile";
import { WorkflowsPreviewModal } from "../WorkflowsPreviewModal";

type OpportunityCaseloadProps = {
  opportunity?: Opportunity;
};

export function OpportunityPreviewModal({
  opportunity,
}: OpportunityCaseloadProps): JSX.Element {
  return (
    <WorkflowsPreviewModal
      isOpen={!!opportunity}
      onAfterOpen={() => opportunity?.trackPreviewed()}
      pageContent={
        <OpportunityProfile
          opportunity={opportunity}
          formLinkButton={!!opportunity?.form}
          formPrintButton={false}
        />
      }
    />
  );
}

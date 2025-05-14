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

import { observer } from "mobx-react-lite";
import toast from "react-hot-toast";

import { Opportunity } from "../../WorkflowsStore";
import { UsNeSupervisionDowngradeOpportunity } from "../../WorkflowsStore/Opportunity/UsNe";
import { FormContainer } from "../Paperwork/FormContainer";
import EmailPreview from "./EmailPreview";

const WorkflowsUsNeSupervisionDowngradeForm = observer(
  function WorkflowsUsNeSupervisionDowngradeForm({
    opportunity,
  }: {
    opportunity: Opportunity;
  }) {
    if (!(opportunity instanceof UsNeSupervisionDowngradeOpportunity)) {
      return null;
    }

    const onClickDownload = async () => {
      const { emailText } = opportunity.form.formData;
      if (!emailText) return;

      await navigator.clipboard.writeText(emailText);
      toast("Email copied to clipboard", {
        position: "bottom-left",
        duration: 5000,
      });
    };

    return (
      <FormContainer
        agencyName="NDCS"
        heading={opportunity.config.label}
        onClickDownload={onClickDownload}
        downloadButtonLabel="Copy Email"
        opportunity={opportunity}
      >
        <EmailPreview />
      </FormContainer>
    );
  },
);

export default WorkflowsUsNeSupervisionDowngradeForm;

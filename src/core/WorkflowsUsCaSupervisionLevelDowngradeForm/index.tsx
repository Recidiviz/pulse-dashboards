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
import * as React from "react";

import { useRootStore } from "../../components/StoreProvider";
import { FormContainer } from "../Paperwork/FormContainer";
import FormViewer from "../Paperwork/FormViewer";
import { connectComponentToOpportunityForm } from "../Paperwork/OpportunityFormContext";
import FormCDCR1657 from "../Paperwork/US_CA/SupervisionLevelDowngrade/FormCDCR1657";

const Form = observer(function FormUsCaSupervisionLeveDowngrade() {
  const formRef = React.useRef() as React.MutableRefObject<HTMLDivElement>;

  const {
    workflowsStore: { selectedClient: client },
  } = useRootStore();
  const opportunity =
    client?.verifiedOpportunities?.usCaSupervisionLevelDowngrade;

  if (!opportunity) {
    return null;
  }
  return (
    <FormContainer
      agencyName="CDCR"
      heading="Supervision Level Downgrade"
      /* eslint-disable-next-line @typescript-eslint/no-empty-function */
      onClickDownload={async () => {}}
      downloadButtonLabel="Download PDF"
      opportunity={opportunity}
    >
      <FormViewer formRef={formRef}>
        <FormCDCR1657 />
      </FormViewer>
    </FormContainer>
  );
});

export default connectComponentToOpportunityForm(
  Form,
  "usCaSupervisionLevelDowngrade"
);

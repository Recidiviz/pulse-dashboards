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
import { palette } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components/macro";

import { useRootStore } from "../../components/StoreProvider";
import FormViewer from "../Paperwork/FormViewer";
import FormCR3947Rev0518 from "../Paperwork/US_TN";

const CompliantReportingFormContainer = styled.div`
  background-color: ${palette.pine2};
  border-left: 1px solid ${palette.slate20};
`;

const PracticesCompliantReportingForm: React.FC = () => {
  const { practicesStore } = useRootStore();

  if (!practicesStore.selectedCompliantReportingReferral) {
    return <CompliantReportingFormContainer />;
  }

  return (
    <CompliantReportingFormContainer>
      <FormViewer
        fileName={`${practicesStore.selectedClient?.displayName} - Form CR3947 Rev05-18.pdf`}
      >
        <FormCR3947Rev0518
          data={practicesStore.selectedCompliantReportingReferral}
        />
      </FormViewer>
    </CompliantReportingFormContainer>
  );
};

export default observer(PracticesCompliantReportingForm);

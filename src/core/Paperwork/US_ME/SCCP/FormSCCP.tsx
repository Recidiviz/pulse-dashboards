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
import { palette, Sans12, Sans24, spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { useRootStore } from "../../../../components/StoreProvider";
import { FormLastEdited } from "../../../FormLastEdited";
import { connectComponentToOpportunityForm } from "../../OpportunityFormContext";
import { WebForm } from "../../WebForm";
import { WebFormFieldProps } from "../../WebFormField";

const FormHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${rem(spacing.lg)} 0;
  border-bottom: 1px solid ${palette.marble5};
  margin-bottom: ${rem(spacing.lg)};
`;

const FormHeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${rem(spacing.md)};
`;

const FormHeading = styled(Sans24)`
  color: ${palette.pine1};
`;

const FormContainer = styled.div`
  margin: 0 ${rem(spacing.xl)};
  padding-bottom: ${rem(spacing.xl)};
`;

const LastEditedMessage = styled(Sans12)`
  color: ${palette.slate85};
`;

const SCCPFormFields: WebFormFieldProps[] = [
  { name: "residentName", label: "Resident's Name" },
  { name: "mdocNo", label: "MDOC No." },
  { name: "facilityHousingUnit", label: "Facility/Housing Unit" },
  { name: "caseManager", label: "Case Manager" },
];

const Form = observer(function FormSCCP() {
  const { workflowsStore } = useRootStore();
  const opportunity =
    workflowsStore?.selectedPerson?.verifiedOpportunities?.usMeSCCP;

  if (!opportunity) {
    return null;
  }

  return (
    <FormContainer>
      <FormHeader>
        <FormHeaderSection>
          <FormHeading>
            SCCP Program Plan
            <br />
            <LastEditedMessage>
              <FormLastEdited agencyName="MDOC" form={opportunity.form} />
            </LastEditedMessage>
          </FormHeading>
        </FormHeaderSection>
      </FormHeader>
      <WebForm fields={SCCPFormFields} />
    </FormContainer>
  );
});

export const FormSCCP = connectComponentToOpportunityForm(Form, "usMeSCCP");

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

import { useMutation } from "@tanstack/react-query";

import { useModuleTrpcQuerier } from "~trpc-client-utils";

import { useFeatureVariants } from "../../../../components/StoreProvider";
import { UsTnReclassification2026FormV2 } from "../../../../WorkflowsStore/Opportunity/Forms/UsTnReclassification2026FormV2";
import { StyledFormButton } from "../../FormContainer";
import { useOpportunityFormContext } from "../../OpportunityFormContext";

export function UsTnReclassSubmitButton() {
  const { usTnCafSubmissionButton } = useFeatureVariants();
  const form = useOpportunityFormContext() as UsTnReclassification2026FormV2;
  const trpcQuerier = useModuleTrpcQuerier("UsTnReclassification");
  const mutation = useMutation(
    trpcQuerier.saveForm.mutationOptions({
      onSuccess: (data) => {
        // eslint-disable-next-line no-console
        console.log("wrote", data);
      },
    }),
  );

  if (!usTnCafSubmissionButton) return;

  const onClick = async () => {
    const { formData } = form;

    if (!formData.omsId) return;

    mutation.mutate({
      residentId: formData.omsId,
      editor: "name@example.com",
    });
  };

  return (
    <StyledFormButton onClick={onClick} disabled={mutation.isPending}>
      Submit
    </StyledFormButton>
  );
}

import { when } from "mobx";

import { trackSetOpportunityStatus } from "../../../../analytics";
import {
  FormFieldData,
  updateEarlyTerminationDraft,
} from "../../../../firestore";
import { Client } from "../../../../WorkflowsStore";

async function updateEarlyTerminationDraftFieldData(
  client: Client,
  name: string,
  valueToStore: FormFieldData[keyof FormFieldData]
): Promise<void> {
  await updateEarlyTerminationDraft(
    client.currentUserName || "user",
    client.recordId,
    { [name]: valueToStore }
  );

  await when(() => client.opportunityUpdates.earlyTermination !== undefined);

  if (client.opportunities.earlyTermination?.reviewStatus === "PENDING") {
    trackSetOpportunityStatus({
      clientId: client.pseudonymizedId,
      status: "IN_PROGRESS",
      opportunityType: "earlyTermination",
    });
  }
}

export { updateEarlyTerminationDraftFieldData };

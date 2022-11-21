import { observer } from "mobx-react-lite";
import React, { createContext, useContext } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { OpportunityType } from "../../WorkflowsStore";
import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";
import { usePersonTracking } from "../hooks/usePersonTracking";

/**
 * A helper to create a Context and Provider with no upfront default value, and
 * without having to check for undefined all the time.
 */
function createOmnipresentContext<A extends unknown | null>() {
  const ctx = createContext<A | undefined>(undefined);
  function useCtx() {
    const c = useContext(ctx);
    if (c === undefined)
      throw new Error("useCtx must be inside a Provider with a value");
    return c;
  }
  return [useCtx, ctx.Provider] as const; // 'as const' makes TypeScript infer a tuple
}

export const [
  useOpportunityFormContext,
  OpportunityFormProvider,
] = createOmnipresentContext<FormBase<any>>(); // specify type, but no need to specify value upfront!

export const connectComponentToOpportunityForm = (
  FormComponent: React.FC,
  opportunityType: OpportunityType
): React.FC => {
  return observer(function ConnectComponentToOpportunityForm() {
    const {
      workflowsStore: { selectedClient: client },
    } = useRootStore();
    const opportunity = client?.verifiedOpportunities[opportunityType];

    usePersonTracking(client, () => {
      opportunity?.form?.trackViewed();
    });

    if (!opportunity) {
      return null;
    }

    return (
      <OpportunityFormProvider value={opportunity.form}>
        <FormComponent />
      </OpportunityFormProvider>
    );
  });
};

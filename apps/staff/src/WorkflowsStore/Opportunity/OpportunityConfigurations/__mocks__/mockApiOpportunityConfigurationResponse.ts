import { OPPORTUNITY_CONFIGS } from "../../OpportunityConfigs";
import { ApiOpportunityConfigurationResponse } from "../interfaces";

export const mockApiOpportunityConfigurationResponse: ApiOpportunityConfigurationResponse =
  {
    enabledConfigs: Object.fromEntries(
      Object.entries(OPPORTUNITY_CONFIGS).map(([opportunity_type, config]) => [
        opportunity_type,
        {
          ...config,
          displayName: config.label,
          eligibleCriteriaCopy: config.eligibleCriteriaCopy ?? {},
          ineligibleCriteriaCopy: config.ineligibleCriteriaCopy ?? {},
          isAlert: config.isAlert ?? false,
        },
      ]),
    ),
  };

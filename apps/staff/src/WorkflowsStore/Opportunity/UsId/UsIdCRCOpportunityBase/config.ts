import { Resident } from "../../../Resident";
import { OpportunityBase } from "../../OpportunityBase";
import { OpportunityConfig } from "../../OpportunityConfigs";
import { OpportunityTabGroups } from "../../types";
import { generateTabs } from "../../utils/tabUtils";

export const baseUsIdCRCConfig = (): Pick<
  OpportunityConfig<OpportunityBase<Resident, any, any>>,
  "tabOrder"
> => ({
  tabOrder: {
    "ELIGIBILITY STATUS": generateTabs({}),
    GENDER: [
      "Cisgender Male",
      "Cisgender Female",
      "Non-Binary",
      "Transgender Male",
      "Transgender Female",
      "Transgender - Unavailable",
      "Gender Unavailable",
      "Marked Ineligible",
    ],
    "GENDER - Transgender Only": [
      "Transgender Male",
      "Transgender Female",
      "Transgender - Unavailable",
      "Marked Ineligible",
    ],
  } as unknown as Readonly<OpportunityTabGroups>,
});

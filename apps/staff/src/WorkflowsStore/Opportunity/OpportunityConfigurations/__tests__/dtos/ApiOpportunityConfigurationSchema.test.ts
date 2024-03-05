/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { OpportunityType } from "../../..";
import { mockApiOpportunityConfigurationResponse } from "../../__mocks__/mockApiOpportunityConfigurationResponse";
import { apiOpportunityConfigurationSchema } from "../../dtos/ApiOpportunityConfigurationSchema";

function mockGetDoc(opportunityType: OpportunityType) {
  return mockApiOpportunityConfigurationResponse["enabledConfigs"][
    opportunityType
  ];
}

describe("ApiOpportunityConfiguration schema", () => {
  it("should validate schema", () => {
    const doc = mockGetDoc("usIdCRCWorkRelease");
    expect(apiOpportunityConfigurationSchema.parse(doc)).toBeDefined();
  });

  describe("methodologyURL", () => {
    it("rejects incorrect url", async () => {
      const doc = await mockGetDoc("usIdCRCWorkRelease");
      doc!.methodologyUrl = "www.google.com";
      expect(() => apiOpportunityConfigurationSchema.parse(doc)).toThrow();
    });
  });
});

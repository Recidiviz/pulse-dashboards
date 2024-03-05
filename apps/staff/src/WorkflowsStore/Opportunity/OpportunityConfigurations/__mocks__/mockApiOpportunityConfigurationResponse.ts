import { ApiOpportunityConfigurationResponse } from "../interfaces";

export const mockApiOpportunityConfigurationResponse: ApiOpportunityConfigurationResponse =
  {
    enabledConfigs: {
      usIdCRCWorkRelease: {
        stateCode: "US_ID",
        urlSection: "CRCWorkRelease",
        displayName: "Work-release at Community Reentry Centers",
        featureVariant: "usIdCRC",
        dynamicEligibilityText:
          "resident[|s] may be eligible for work-release at a Community Reentry Center",
        callToAction:
          "Review residents who may be eligible for work-release to a CRC and start their paperwork in ATLAS.",
        firestoreCollection: "US_ID-CRCWorkReleaseReferrals",
        snooze: {
          defaultSnoozeDays: 30,
          maxSnoozeDays: 90,
        },
        denialReasons: {
          MEDICAL: "Was not approved by an IDOC medical provider",
          PENDING:
            "There are pending felony charges or felony investigations in which the resident is a suspect",
          BEHAVIOR: "Resident has had poor institutional behavior",
          PROGRAM: "Missing required facility programming",
          Other: "Other, please specify a reason",
        },
        eligibleCriteriaCopy: {
          custodyLevelIsMinimum: {
            text: "Currently on Minimum custody",
          },
          notServingForSexualOffense: {
            text: "Not serving for a sexual offense",
          },
        },
        ineligibleCriteriaCopy: {},
        sidebarComponents: [
          "Incarceration",
          "UsIdPastTwoYearsAlert",
          "CaseNotes",
        ],
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      },
    },
  };

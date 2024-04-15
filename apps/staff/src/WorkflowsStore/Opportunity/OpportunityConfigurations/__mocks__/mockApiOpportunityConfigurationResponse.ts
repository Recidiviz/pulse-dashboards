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
          usIdNoAbsconsionEscapeAndEludingPoliceOffensesWithin10Years: {
            text: "No escape attempts in the last 10 years",
            tooltip:
              "No escape, eluding police, or absconsion offense(s) in the last 10 years",
          },
          usIdNoDetainersForXcrcAndCrc: {
            text: "No active felony detainers or holds",
            tooltip: "Cannot have any felony detainers or holds",
          },
          usIdIncarcerationWithin18MonthsOfFtcdOrTpd: {
            text: "Tentative Parole Date (TPD) within eighteen (18) months OR Full Term Release Date (FTRD) within eighteen (18) months",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
          usIdIncarcerationWithin18MonthsOfEprdAnd15YearsOfFtcd: {
            text: "Early Release Date (EPRD) within 18 months AND Full Term Release Date (FTRD) within 15 years",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
          usIdIncarcerationWithin1YearOfTpdAndLifeSentence: {
            text: "Life sentence AND Tentative Parole Date (TPD) within 1 year",
            tooltip:
              "The resident must fulfill one of the following three conditions:\n    1. Tentative Parole Date (TPD) within seven (18) months OR\n        Full Term Release Date (FTRD) within seven (18) months\n    2. Early Release Date (EPRD) within 18 months AND\n        Full Term Release Date (FTRD) within 15 years\n    3. Life sentence AND\n        Tentative Parole Date (TPD) within 1 year",
          },
        },
        ineligibleCriteriaCopy: {},
        sidebarComponents: [
          "Incarceration",
          "UsIdPastTwoYearsAlert",
          "CaseNotes",
        ],
        compareBy: [{ field: "reviewStatus" }, { field: "eligibilityDate" }],
        methodologyUrl:
          "https://drive.google.com/file/d/1pum9mrOIvGoBIwwE3dQEITod7O5mcYGm/view?usp=sharing",
      },
    },
  };

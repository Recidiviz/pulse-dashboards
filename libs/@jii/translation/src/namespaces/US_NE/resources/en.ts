// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import gbmdDefinition from "./definitions/gbmd.md?raw";
import jailCreditsDefinition from "./definitions/jailCredits.md?raw";
import lb191Definition from "./definitions/lb191.md?raw";
import mmtdDefinition from "./definitions/mmtd.md?raw";
import pedDefinition from "./definitions/ped.md?raw";
import trdDefinition from "./definitions/trd.md?raw";

export default {
  lastUpdated:
    "This information was last changed on {{sentenceLastModifiedDate, formatFullDate}}",
  topLinkText: "Back to top",
  homeLink: "Back",
  definitionsLinksHeading: "Other definitions",
  home: {
    pageTitle: "Learn More About Your Sentence",
    noSentenceFallback:
      "Your sentence details have still not been confirmed by NDCS. Contact Records for more information.",
    headerFields: {
      numHoldsAndDetainers: {
        label: "Open Detainers/Holds:",
        value: "{{count, number}}",
      },
      numNotifiers: {
        label: "Open Notifiers:",
        value: "{{count, number}}",
      },
      deadTime: {
        label: "Dead Time:",
        value_one: "{{count, number}} Day",
        value_other: "{{count, number}} Days",
      },
      minimumSentence: {
        label: "Minimum Sentence:",
        value_one: "{{count, number}} Yr",
        value_other: "{{count, number}} Yrs",
      },
      maximumSentence: {
        label: "Maximum Sentence:",
        value_one: "{{count, number}} Yr",
        value_other: "{{count, number}} Yrs",
      },
      goodTimeLaw: {
        label: "Good Time Law:",
        value: "LB {{goodTimeLawNumber}}",
      },
    },
    todos: {
      sectionTitle: "To-dos",
      goodTimeRestoration: {
        eligible: {
          title: "Restore Lost Good Time",
          body: "Congrats on going 6 months without any misconduct reports. You are eligible to request 30 days back this month. You currently have {{goodTimeLostDaysRestorable}} total days lost.\n\nTo begin the time restoration process, ask your case manager or submit an Inmate Interview Request (IIR) to the records office personnel in your facility.",
          linkText: "Learn More",
        },
        eligibleForMoreThan30Days: {
          title: "Restore Lost Good Time",
          body: "Congrats on getting 30 days of good time back each of the last 5 months. You are now eligible to request more than 30 days back this month. You currently have {{goodTimeLostDaysRestorable}} total days lost.\n\nTo begin the time restoration process, ask your case manager or submit an Inmate Interview Request (IIR) to the records office personnel in your facility.",
          linkText: "Learn More",
        },
        almostEligible: {
          title: "Become Eligible For Good Time Restoration",
          body_one:
            "{{count, number}} more month with no Misconduct Reports and you will be eligible to request a good time restoration.\nIf you become eligible, staff will automatically initiate a request and inform you of the decision.\n\nYou currently have {{goodTimeLostDaysRestorable, number}} total days lost.",
          body_other:
            "{{count, number}} more months with no Misconduct Reports and you will be eligible to request a good time restoration.\nIf you become eligible, staff will automatically initiate a request and inform you of the decision.\n\nYou currently have {{goodTimeLostDaysRestorable, number}} total days lost.",
          linkText: "Learn More",
        },
        ineligibleLTRH: {
          title: "Become Eligible For Good Time Restoration",
          body: "Despite no disqualifying recent Misconduct Reports, facility staff have noted you are currently ineligible for good time restoration due to your current or recent placement in Long-Term Restrictive Housing. Please speak with facility staff for more detail.\n\nYou currently have {{goodTimeLostDaysRestorable}} total days lost.",
          linkText: "Learn More",
        },
        ineligibleTreatment: {
          title: "Become Eligible For Good Time Restoration",
          body: "Despite no disqualifying recent Misconduct Reports, facility staff have noted you are currently ineligible for good time restoration due to your refusal of recommended clinical programming. Please speak with facility staff for more detail.\n\nYou currently have {{goodTimeLostDaysRestorable}} total days lost.",
          linkText: "Learn More",
        },
      },
      reentryChecklist: {
        title: "Complete Your Roadmap to Reentry",
        body: "Complete the items on your reentry checklist to prepare for success.",
        linkText: "Learn More",
      },
      reentryAssessment: {
        title: "Complete 120 Day Reentry Assessment",
        body: "Your Reentry Specialist has assigned this assessment to you so they can better understand your needs before your 120 day meeting with them. This will enable them to bring more customized resources and clear answers to your meeting.",
        linkText: "Begin Assessment",
      },
    },
    dates: {
      sectionTitle: "Important dates",
      moreInfoLink: "Learn more",
      cards: {
        trd: {
          label: "Tentative Release Date (TRD)",
          value: "{{value, formatFullDate(fallbackText: 'No TRD date')}}",
          summary:
            "Your Tentative Release Date (TRD) is the estimated date you will be released from incarceration. This date can be changed as a result of a disciplinary action, a change in good time, a parole revocation, or a change in the law or the interpretation of the law.",
        },
        ped: {
          label: "Parole Eligibility Date (PED)",
          value: "{{value, formatFullDate(fallbackText: 'No PE date')}}",
          summary:
            "The Parole Eligibility Date (PED) is the date you are first eligible for parole.",
        },
        mmtd: {
          label: "Mandatory Minimum Term Date (MMTD)",
          value: "{{value, formatFullDate(fallbackText: 'No MMTD date')}}",
          summary:
            "Your Mandatory Minimum Term Date (MMTD) is the date when the required minimum part of your sentence ends. The mandatory minimum term is set by the law based on your total combined sentence.",
        },
      },
    },
    goodTimeBalances: {
      sectionTitle: "Credits",
      moreInfoLink: "Learn more",
      cards: {
        gbmd: {
          label: "Good Time Balance/Mandatory Discharge (GB/MD)",
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
          summary:
            "A person sentenced to prison immediately gets this time up front. This is a type of good time that can be removed for Misconduct Reports (MRs).",
        },
        lgtr: {
          label: "Lost Good Time (Restorable)",
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
          summary_zero:
            "You do not have any lost good time days that are restorable.",
          summary_other:
            "This good time has been removed due to misconduct reports (MRs). You may apply to have these days restored after some time without misconduct reports. Ask your case manager for specific details on when you are eligible to ask for time back.",
        },
        lgtn: {
          label: "Lost Good Time (Non-Restorable)",
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
          summary_zero:
            "You do not have any lost good time days that are not restorable.",
          summary_other:
            "This good time has been lost due to misconduct reports (MRs). It is not possible to restore these days.\n\nThis is already applied to your Tentative Release Date (TRD).",
        },
        lb191: {
          label: "LB 191 Earned Time Credits",
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
          summary:
            "After the first 12 months, you may earn an extra 3 days off your max sentence each month for good conduct. These days are applied to your Tentative Release Date (TRD) when they are earned.",
          summaryOtherLaw:
            "You were sentenced under LB {{lawNumber}}, not LB 191. For more information, submit your questions to the records office personnel in your facility on an Inmate Interview Request (IIR).",
        },
        jailCredits: {
          label: "Jail Credits",
          value_one: "{{count, number}} Day",
          value_other: "{{count, number}} Days",
          summary:
            "Jail credits are the amount of days the court determined you spent in jail for the criminal charge which led to your prison sentence. These days are subtracted from your total combined sentence.",
        },
      },
    },
    goodTimeAdjustments: {
      sectionTitle: "Good Time Adjustments",
      emptyMessage: "No adjustments made",
      adjustmentType: {
        addition: "Addition",
        additionWithViolation: "Addition: {{violationDescription}}",
        removal: "Removal",
        removalWithViolation: "Removal: {{violationDescription}}",
      },
      tableColumns: {
        adjustmentType: "Adjustment Type",
        misconductReportNumber: "MR Number (If\u00A0applicable)",
        days: "Days",
        transactionDate: "Transaction Date",
      },
    },
  },
  reentryAssessment: {
    pageTitle: "Reentry Assessment",
  },
  reentryChecklist: {
    pageTitle: "Roadmap to Reentry",
    verifiedItem: {
      confirmed: {
        default: "NDCS staff confirmed this as complete for you.",
        "state-id-license":
          "NDCS staff confirmed some form of ID. However, the ID may be expired. Please check with staff for more.",
      },
      unconfirmed: {
        default:
          "NDCS staff have not yet confirmed this as done. Speak with your case manager.",
      },
    },
    subtitle:
      "Mark tasks as complete to keep your case manager updated on your progress",
    backLink: "Back to home",
    progressBar: {
      sectionsComplete:
        "{{completedSections}}/{{totalSections}} Sections Complete",
      lastSaved: "Saved {{date, formatFullDate}}",
    },
    saveButton: "Save",
    savingButton: "Saving...",
    writeErrorMessage: "We couldn't save your progress: {{error}}",
    unsavedChangesModal: {
      title: "Unsaved Changes",
      message:
        "You have unsaved changes to your Roadmap to Reentry. Are you sure you want to discard them?",
      cancelButtonText: "Cancel",
      discardButtonText: "Discard",
    },
    sections: {
      early: {
        title: "Complete Anytime",
        subtitle:
          "These tasks can be completed as early as possible to set you up for success.",
      },
      "3-years": {
        title: "Complete 3 Years Pre-Release",
        subtitle:
          "Career readiness should be prioritized especially within 3 years of release.",
      },
      "6-months": {
        title: "Complete 6 Months Pre-Release",
        subtitle:
          "Start your housing and employment plan within 6 months of release.",
      },
      "120-days": {
        title: "Complete 120 Days Pre-Release",
        subtitle:
          "Finalize your reentry plan. Your Reentry Specialist can assist with these items at your 120-Day meeting.",
      },
    },
    items: {
      "birth-certificate":
        "I have my birth certificate, or have applied to receive one.",
      "applied-medicaid": "I have applied for Medicaid.",
      "ged-diploma":
        "I have my GED or high school diploma, or am enrolled in GED classes currently.",
      "job-training":
        "I am taking part in job training, industries, or an apprenticeship to prepare me for a career.",
      "skills-career-interests": "I know my skills and career interests.",
      "parenting-programs":
        "*If I have a family,* I am participating in parenting or family programs.",
      "five-keys-interest":
        "I know which of the 5 Keys programs I am interested in participating in.",
      "career-programs":
        "I am enrolled in college, vocational, or training programs to prepare me for a career.",
      "mental-health-assessment":
        "I have completed a mental health or substance use assessment.",
      "parenting-programs-2yr":
        "*If I have a family,* I am participating in parenting or family programs.",
      "clinical-program":
        "*If relevant,* I have completed or am on track to complete any prescribed clinical program.",
      "job-opportunities":
        "I know what kind of job opportunities I can apply for.",
      "resume-portfolio": "I have a resume or work portfolio.",
      "safe-housing": "I have a safe place to live after release.",
      "backup-housing": "I have a backup housing plan.",
      "reentry-circle":
        "I know when my Reentry Inner Circle Meeting is, or I have already attended.",
      "social-security-card": "I have my Social Security card.",
      "state-id-license": "I have my state ID or driver's license.",
      "birth-certificate-120": "I have my birth certificate.",
      "medicaid-120": "I have Medicaid.",
      "medical-checkup": "I have completed a medical check-up.",
      "continuation-care-plan":
        "*If relevant,* I have a medical continuation-of-care plan (appointments, providers, or referrals).",
      "medication-supply":
        "*If relevant,* I will leave with a 30-day supply of medications plus refills.",
      "treatment-aftercare":
        "*If relevant,* I know where I can go for treatment or aftercare if needed.",
      "barriers-plan":
        "I have a plan to deal with driver's license or employment barriers.",
      "budget-plan": "I have a budget plan for my first month after release.",
      "legal-obligations":
        "*If relevant,* I know my legal or financial obligations (child support, fines, debt).",
      "parole-expectations":
        "*If relevant,* I understand what to expect while on parole.",
      "supportive-person":
        "I have at least one supportive person or mentor I can count on.",
      "peer-support": "I am connected to peer support or reentry programs.",
      "success-plan":
        "I have a Success Plan with goals for 2 weeks, 30, 60, and 90 days.",
      "community-help": "I know where to go in the community for extra help.",
      "transportation-plan":
        "I have a transportation plan for release day and for work/supervision.",
    },
  },
  infoPages: {
    mmtd: {
      heading: "Mandatory Minimum Term Date (MMTD)",
      body: mmtdDefinition,
    },
    ped: {
      heading: "Parole Eligibility Date (PED)",
      body: pedDefinition,
    },
    trd: {
      heading: "Tentative Release Date (TRD)",
      body: trdDefinition,
    },
    gbmd: {
      heading: "Good Time Balance/Mandatory Discharge (GB/MD)",
      body: gbmdDefinition,
    },
    lb191: {
      heading: "LB 191 Credits",
      body: lb191Definition,
    },
    jailCredits: {
      heading: "Jail Credits",
      body: jailCreditsDefinition,
    },
  },
  disclaimer:
    "This information is provided by a third-party vendor for general informational purposes only. This information is not intended as legal advice or as a substitute for the individualized advice of your counsel. Providing this information does not create an attorney-client relationship between the Nebraska Department of Correctional Services and the user. Providing this information does not create an attorney-client relationship between the third-party vendor and the user. The Nebraska Department of Correctional Services and the third-party vendor shall not be liable for any errors, omissions, delays, or interruptions related to the provided information.",
};

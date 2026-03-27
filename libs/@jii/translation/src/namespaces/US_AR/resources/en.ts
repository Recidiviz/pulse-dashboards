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

import importantDatesInfoPage from "./importantDatesInfoPage.md?raw";

export default {
  moreInformation: {
    pages: {
      earnedCredit: {
        heading: "Understanding Release Dates & Good Time",
        body: importantDatesInfoPage,
        backLink: "Back to Programs",
      },
    },
  },
  importantDates: {
    sectionHeader: "Your Important Dates",
    eligibilityDate: {
      labels: {
        "Transfer Eligibility Date": "Transfer Eligibility Date",
        "Parole Eligibility Date": "Parole Eligibility Date",
        "Release Eligibility Date": "Release Eligibility Date",
      } as Record<string, string>,
      description:
        "The earliest date you can become eligible for transfer to community supervision.",
    },
    maximumReleaseDate: {
      label: "Maximum Release Date",
      description:
        "The latest date you can be held in custody, marking the full completion of your sentence.",
    },
    formatFullDate: "{{date, formatFullDate}}",
    moreInfoLink: "Learn more about dates",
    moreInfo: {
      heading: "Understanding Release Dates & Good Time",
      body: importantDatesInfoPage,
    },
    missingDateMessage: "No date on record",
  },
  programs: {
    homepageCta: {
      sectionHeader: "Programming",
      heading: "Browse Available Programs",
      description:
        "Explore available programs, filter by facility, and star the ones that are interesting to you.",
      link: "View full list of programs",
    },
    lastUpdated: "This information was last updated {{date, formatFullDate}}.",
    backLink: "Back to Home",
    pageTitle: "Earn time off your sentence",
    pageDescription: `This page helps you find programs and activities that can provide Good Time off of your Parole/Transfer/Release Eligibility Date. 

This list will update from time to time—look for the “New” label to see what has changed. If you are eligible for a particular program, please follow your facility’s process for signing up.`,
    learnMoreLink: "Learn about earned time",
    resultsCount_one: "{{count}} result below.",
    resultsCount_other: "{{count}} results below.",
    resultsHint: "Tap on each card to view more information.",
    filters: {
      button: "Filters",
      categoryLabel: "Select by Category",
      facilityLabel: "Select by Facility",
      allCategories: "All categories",
      allFacilities: "All facilities",
      onlyEarnCredits: "Only show programs that earn credits",
      onlyStarred: "Only show my starred programs",
      clearAll: "Clear all",
    },
    card: {
      earnLabel: "EARN",
      daysOfCredit_zero: "no achievement credits earned",
      daysOfCredit_one: "up to {{count}} day of achievement credit",
      daysOfCredit_other: "up to {{count}} days of achievement credit",
      newBadge: "New",
    },
    category: {
      programCount_one: "{{count}} program",
      programCount_other: "{{count}} programs",
      programCountFiltered_one: "{{count}} program (out of {{total}} total)",
      programCountFiltered_other: "{{count}} programs (out of {{total}} total)",
    },
    modal: {
      earnSubtitle_zero: "No achievement credits earned",
      earnSubtitle_one: "Earn up to {{count}} day of achievement credit",
      earnSubtitle_other: "Earn up to {{count}} days of achievement credit",
      programDescription: "Program Description",
      eligibility: "Eligibility",
      eligibilityPrereq: "Prerequisite: {{prereq}}",
      eligibilityNone: "No requirements needed",
      availableFacilities: "Available Facilities",
      callToAction:
        "Sound interesting? Talk to your case manager to see if there might be a good fit.",
      closeWindow: "Close window",
    },
  },
};

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

import aboutInfoPage from "./aboutInfoPage.md?raw";
import importantDatesInfoPage from "./importantDatesInfoPage.md?raw";
import onboardingInfoPage from "./onboardingInfoPage.md?raw";

export default {
  about: {
    heading: "About the App",
    body: aboutInfoPage,
  },
  homePageLinkText: "Home Page",
  backToHomePageLinkText: "Back to Home",
  moreInfoPageLinksHeading: "More Information",
  backToTopLinkText: "Back to top",
  lastUpdated:
    "This information was last updated on {{lastUpdatedDate, formatFullDate}}. It updates once per month.",
  lastUpdatedNoDate: "This information updates once per month.",
  goLink: "Learn more about ",
  goLinkFull: "Read into full list of release types",
  distanceFromTodayNow: "Today",
  distanceFromTodayPast:
    "({{date, formatDateRangeFromToday(delimiter: ' and ')}} ago)",
  distanceFromTodayFuture:
    "({{date, formatDateRangeFromToday(delimiter: ' and ')}} from today)",
  upcomingDateCopy:
    "Your date is coming up soon - stay on track to ensure that your date doesn't change. ",
  onboarding: {
    heading: "Tool disclaimer",
    body: onboardingInfoPage,
    continueLink: "I understand, take me to the tool",
  },
  importantDates: {
    sectionHeader: "Your Important Dates",
    sectionSubHeader:
      "These are all the dates that Time Comp has calculated for your sentence. These dates may change if you get a disciplinary infraction, or get lost time restored. You may also see some dates appear or disappear  depending on if you meet the criteria to qualify for them. Tap “Learn More” to see what you need to do in order to be released on a particular date",
    moreInfo: {
      heading: "Release Types, Their Requirements, and Restrictions",
      body: importantDatesInfoPage,
    },
    dates: {
      acisTprDate: {
        title: "Standard Transition Program (TPR)",
        info: "Release up to 90 days earlier, if you agree to attend a program in the community; must meet criteria. You may also hear this called “Transition Program Release” (TPR) or “Transition Release”.",
        skeletonInfo: "",
        shortName: "TPR",
        value: "{{acisTprDate, formatFullDate}}",
      },
      acisDtpDate: {
        title: "Drug Transition Program (DTP)",
        info: "Release up to 90 days earlier, if you agree to attend a program in the community; must meet criteria. This is a version of Transition Program Release (TPR) for people with only drug possession or use charges.",
        skeletonInfo: "",
        shortName: "DTP",
        value: "{{acisDtpDate, formatFullDate}}",
      },
      csbdDate: {
        title: "Community Supervision Begin Date (CSBD)",
        info: "Also called a Transition Release (TR) date, allows for release up to 90 days before your ERCD; must meet criteria.",
        skeletonInfo: "",
        shortName: "CSBD",
        value: "{{csbdDate, formatFullDate}}",
      },
      ercdDate: {
        title: "Earned Release Credit Date (ERCD)",
        info: "The earliest date you can be released based on Earned Release Credits – usually, a minimum of 85.7% of your sentence.",
        skeletonInfo: "",
        shortName: "ERCD",
        value: "{{ercdDate, formatFullDate}}",
      },
      sedDate: {
        title: "100% Date (Flat Sentence, SED)",
        info: "The full term of your sentence; when you can be released if you haven’t met conditions for earlier release types. May require you to agree to conditions of supervision.",
        skeletonInfo: "TKTK",
        shortName: "SED",
        value: "{{sedDate, formatFullDate}}",
      },
      csedDate: {
        title: "115% Date (CSED)",
        info: "The last day that you can be under ADCRR supervision for your current sentence.",
        skeletonInfo: "TKTK",
        shortName: "CSED",
        value: "{{csedDate, formatFullDate}}",
      },
      addDate: {
        title: "Absolute Discharge Date (ADD)",
        info: "The earliest date you can be released to Probation based on Earned Release Credits – usually, a minimum of 85.7% of your sentence.",
        skeletonInfo: "",
        shortName: "ADD",
        value: "{{addDate, formatFullDate}}",
      },
      trToAddDate: {
        title: "Transition to Absolute Discharge Date (TR to ADD)",
        info: "Allows for release up to 90 days before your ADD (Absolute Discharge Date); must meet criteria.",
        skeletonInfo: "",
        shortName: "TR to ADD",
        value: "{{trToAddDate, formatFullDate}}",
      },
    },
  },
};

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
import dprInfoPage from "./dprInfoPage.md?raw";
import importantDatesInfoPage from "./importantDatesInfoPage.md?raw";

export default {
  about: {
    heading: "About the App",
    body: aboutInfoPage,
  },
  homePageLinkText: "Home Page",
  backToHomePageLinkText: "Back to Home",
  moreInfoPageLinksHeading: "More Information",
  backToTopLinkText: "Back to top",
  lastUpdatedNoDate: "This information updates once per month.",
  goLink: "Learn more about {{label}}",
  goLinkFull: "Read into full list of release types",
  dprInfoPage: {
    heading:
      "You may qualify for earlier release through Drug Program Release (DPR). What does that mean?",
    body: dprInfoPage,
  },
  importantDates: {
    dprBanner: {
      message:
        "**You may qualify for Drug Program Release (DPR).** See how finishing a Major Program could move up your release dates.",
      linkText: "Learn more",
    },
    sectionHeader: "Your Important Dates",
    sectionSubHeader: `These are all of the projected release dates that the Time Computation Unit has calculated 
      for your sentence. These dates may change if you receive a disciplinary infraction and lose 
      release credits, or if your release credits are restored. You may also see some dates appear 
      or disappear depending on if you meet the qualifying criteria. **Tap the “Learn more about …”
      button under any of the dates below** to learn more about that release date and its criteria.`,
    moreInfo: {
      heading: "Release Types, Their Requirements, and Restrictions",
      body: importantDatesInfoPage,
    },
    pastDateMessage: `If this date has already passed, it means you have not met all the requirements yet. 
    Reviewing [the criteria]({{linkUrl}}) will show you what steps you still need to take.`,
    pastDateTag: "Only eligible if criteria are met",
    missingDateMessage: "No date on record",
    upcomingDateMessage: `Your date is coming up soon! Remaining compliant with
    [the criteria]({{linkUrl}}) is the best way to keep your date from changing.`,
    dates: {
      tprDate: {
        title: "Standard Transition Program (STP)",
        info: `Under STP, you may qualify for release up to 90 days earlier than your 
        [Temporary Release (TR)]({{trLinkUrl}}) under the Standard Transition Program if you meet all 
        of [the criteria]({{linkUrl}}). You may also hear this called “Transition Program Release” 
        (TPR) or “Transition Release.”`,
        shortName: "STP",
        value: "{{tprDate, formatFullDate}}",
      },
      dtpDate: {
        title: "Drug Transition Program (DTP)",
        info: `You may qualify for release up to 90 days earlier than your Temporary Release (TR)
        under the Drug Transition Program if you meet all of [the criteria]({{linkUrl}}). This 
        is a special version of the Transition Program Release (TPR) for people with only qualifying drug 
        possession or use charges. You may also hear this called “Drug Transition Program Release” 
        (DTP) or “Drug Transition Release.”`,
        shortName: "DTP",
        value: "{{dtpDate, formatFullDate}}",
      },
      csbdDate: {
        title: "Community Supervision Begin Date (CSBD)",
        info: `A discretionary release up to 90 days before your ERCD. You must meet
        [the criteria]({{linkUrl}}) listed in ADCRR Department Order 1002. You may also hear
        this called a “Temporary Release” (TR) date.`,
        shortName: "CSBD",
        value: "{{csbdDate, formatFullDate}}",
      },
      ercdDate: {
        title: "Earned Release Credit Date (ERCD)",
        info: "The earliest date you can be released based on Earned Release Credits.",
        shortName: "ERCD",
        value: "{{ercdDate, formatFullDate}}",
      },
      sedDate: {
        title: "Sentence Expiration Date (SED, “100%”, “Flat Time”)",
        info: `The full term of your prison sentence (often called “100%” or “Flat Time”).
        You will be released on this date if you are not eligible for earlier release types. If you
        have to complete Community Supervision after your prison term, you must still agree to
        certain conditions of supervision.`,
        shortName: "SED",
        value: "{{sedDate, formatFullDate}}",
      },
      csedDate: {
        title: "Community Supervision End Date (CSED)",
        info: "The last day that you can be under ADCRR supervision for your current sentence.",
        shortName: "CSED",
        value: "{{csedDate, formatFullDate}}",
      },
      addDate: {
        title: "Absolute Discharge Date (ADD)",
        info: `The earliest date you can be released to Probation based on Earned Release Credits. 
        It applies to individuals whose sentence includes a term of probation right after their prison term.`,
        shortName: "ADD",
        value: "{{addDate, formatFullDate}}",
      },
      trToAddDate: {
        title: "Temporary Release to Absolute Discharge Date (TR to ADD)",
        info: `A discretionary release up to 90 days before your ADD (Absolute Discharge Date). 
        You must meet [the criteria]({{linkUrl}}) listed in ADCRR Department Order 1002. This is
        used for individuals who will be released to probation following the completion of 
        their prison term.`,
        shortName: "TR to ADD",
        value: "{{trToAddDate, formatFullDate}}",
      },
    },
  },
};

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
  aboutVideo: {
    homepageCta: {
      heading: "What is Opportunities?",
      description:
        "Want to learn about how the Opportunities App works or how to understand your shown sentence dates? Watch this video to find out.",
      confirmClose: "Move to “About” page",
      cancelClose: "Never mind, keep video here",
      videoButtonAltText: "Open video",
      closeButtonAltText: "Dismiss video",
    },
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
      "What changed about Drug Program Release (DPR) information on this app",
    body: dprInfoPage,
  },
  importantDates: {
    dprBanner: {
      message:
        "**We’ve changed what the app shows about Drug Program Release (DPR) early release.** Tap “Learn more” to see why.",
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
        of [the criteria]({{linkUrl}}). You may also hear this called "Transition Program Release"
        (TPR) or "Transition Release."`,
        shortName: "STP",
        value: "{{tprDate, formatFullDate}}",
        approved: {
          info: `Great work! Time Comp confirmed you've met the criteria for Transition Release.
          One last thing stands between you and the gate: **an approved home plan**. Get that finalized
          to walk out on this date. (Steer clear of disciplinary infractions, too — they can still
          put this date at risk.)`,
        },
        tentative: {
          info: `You may qualify to go home **as early as {{tprDate, formatFullDate}}** ({{tprDate, formatDateRangeFromToday(delimiter: ' and ')}} from today) through the Transition Program.
          This date is **tentative**, and not guaranteed. To qualify, focus on meeting the criteria – tap below to learn how. `,
          value: `You may be eligible for early release through the Transition Program`,
        },
      },
      dtpDate: {
        title: "Drug Transition Program (DTP)",
        info: `You may qualify for release up to 90 days earlier than your Temporary Release (TR)
        under the Drug Transition Program if you meet all of [the criteria]({{linkUrl}}). This
        is a special version of the Transition Program Release (TPR) for people with only qualifying drug
        possession or use charges. You may also hear this called "Drug Transition Program Release"
        (DTP) or "Drug Transition Release."`,
        shortName: "DTP",
        value: "{{dtpDate, formatFullDate}}",
        approved: {
          info: `Great work! Time Comp confirmed you've met the criteria for Transition Release.
          One last thing stands between you and the gate: **an approved home plan**. Get that finalized
          to walk out on this date. (Steer clear of disciplinary infractions, too — they can still
          put this date at risk.)`,
        },
        tentative: {
          info: `You may qualify to go home **as early as {{dtpDate, formatFullDate}}** ({{dtpDate, formatDateRangeFromToday(delimiter: ' and ')}} from today) through the Transition Program.
          This date is **tentative**, and not guaranteed. To qualify, focus on meeting the criteria – tap below to learn how. `,
          value: `You may be eligible for early release through the Transition Program`,
        },
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
    overlay: {
      closeLabel: "Close",
      overlayLinkText: "Learn more about {{label}}",
      goLink: "What do I need to do to qualify for this date?",
      tprDate: {
        approved: {
          eyebrow: "Standard Transition Program",
          heading:
            "What to focus on before your release date of {{tprDate, formatFullDate}}.",
          body: `Here's what to keep in mind between now and then.

**Start now**
- Get your home plan approved. The sooner, the better! You won't be released until it is.
- Sign the Transition Program agreement with your COIII
- Complete the Mandatory Literacy requirement (if you haven't already)

**Watch out for**
- Disciplinary incidents in the next 6 months can put your date at risk
- Being removed from a major program can affect your eligibility
- Staying at Medium or Minimum custody`,
        },
        tentative: {
          eyebrow: "",
          heading: "Standard Transition Program",
          body: `To be released on your STP date, you must meet the following criteria:

1. You must sign the Transition Program agreement form – talk to your COIII in order to do this.
2. You must be classified as Medium or Minimum custody.
3. You must complete the Mandatory Literacy requirement, unless you have an exemption.
4. You can’t have any felony holds, felony detainers, or felony warrants.
5. You must not have been found guilty of any Major Class A or Class B disciplinary rule violations within the last 6 months. You also cannot have any Major Violent rule violations during your current incarceration. Even if you qualified, getting a new infraction could cause you to lose your STP date.
6. You cannot have refused or been removed from a major program for poor behavior within the last 18 months, unless you have since successfully reenrolled and completed it.
7. You must have an approved home plan – starting to work on this ASAP is essential to receiving your full 90 days.
8. You can’t have any past arrests, convictions, or requirements to register for sex offenses.
9. You can’t have a history of Dangerous Crimes Against Children (A.R.S. §13-705).
10. If you have participated in the Transition Program before, you must wait at least 24 months after your last [CSED]({{csedLinkUrl}}) date before being eligible again.
11. You must be a US Citizen or a legal permanent resident without an ICE detainer.
`,
        },
      },
      dtpDate: {
        approved: {
          eyebrow: "Drug Transition Program",
          heading:
            "What to focus on before your release date of {{dtpDate, formatFullDate}}.",
          body: `Here's what to keep in mind between now and then.

**Start now**
- Get your home plan approved. The sooner, the better! You won't be released until it is.
- Sign the Transition Program agreement with your COIII
- Complete the Mandatory Literacy requirement (if you haven't already)

**Watch out for**
- Disciplinary incidents in the next 6 months can put your date at risk
- Being removed from a major program can affect your eligibility
- Staying at Medium or Minimum custody`,
        },
        tentative: {
          eyebrow: "",
          heading: "Drug Transition Program",
          body: `The Drug Transition Program (DTP) is for people serving sentences only for qualifying drug possession or use offenses. To qualify, you will need to meet the following criteria:

1. You must sign the Transition Program agreement form.
2. You must be classified as Medium or Minimum custody.
3. You must at least be enrolled in Functional Literacy — but to be released on your earliest possible date, you must complete it (see previous question).
4. You can’t have any felony holds, felony detainers, or felony warrants
5. You can’t be found guilty of any Class A or Class B major disciplinary rule violations within 6 months of your CSBD / TR to ADD. Even if you qualified, getting a new major disciplinary infraction could cause you to lose your DTP date.
6. You cannot have refused or been removed from a major program for poor behavior within the last 18 months, unless you later successfully reenrolled and completed it.
7. You need a home plan that gets approved ASAP.
8. You can’t have any past arrests, convictions, or requirements to register for sex offenses.
9. You can’t have a history of Dangerous Crimes Against Children (A.R.S. §13-705).
10. If you have participated in the Transition Program before, it must have been at least 24 months since your last [CSED]({{csedLinkUrl}}).
11. You must be a US Citizen or legal permanent resident without an ICE detainer.
12. You must be up to date with any restitution payments.
`,
        },
      },
    },
  },
  openAll: "Open all content",
  closeAll: "Close all content",
  importantDatesInfoPage: {
    filterContent: "Filter content by:",
    personalDates: "My Release Dates",
    allDates: "All Release Types",
    generalFAQ: {
      about: {
        header: "General Release Information",
        questions: {
          whySoMany: {
            header: "Why do I have so many different release dates?",
            content: `Arizona has several different ways someone can be released, and each one has its own date. You might see dates for:

- **Transition Release (STP or DTP)** — the earliest possible release, up to 90 days before your ERCD.
- **CSBD or TR to ADD** — release up to about 77 days before your ERCD.
- **ERCD or ADD** — release based on earned credits, usually around 85% of your sentence.
- **SED** — 100% of your sentence.
- **CSED** — when your community supervision ends.

**Not all of these dates apply to everyone.** The dates you see on your homepage are the ones that apply to you. The page you're on now explains what each one means.`,
          },
          datesNotMatchingTimeComp: {
            header:
              "The dates in the app don't match my time comp paperwork. Why?",
            content: `This usually happens because something changed after your time comp paperwork was printed. The app shows what's currently in the computer system that your COIII uses, which is updated more often than printed paperwork.
If your dates have changed, the app should be the more recent source. But if something looks wrong, talk to your COIII — they can check the system and write to Time Comp if there's a real problem.`,
          },
        },
      },
    },
  },
  importantDatesFAQ: {
    tprDate: {
      header: "Standard Transition Program (STP)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content:
            "The Standard Transition Program (STP) allows for release up to **90 days before your next earliest eligible release date** if you are willing to attend a program while in the community. It is designed to help people transition to the community earlier. You may also hear it called “Transition Release” or “TPR”. In this section, we call this type of release STP.",
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `Most people can qualify for this release type unless you have been convicted of certain crimes now or in the past. The next two sections talk about ineligible crimes.

The Department typically begins reviewing cases for eligibility up to 7 months before the earliest release date.
`,
        },
        toBeReleasedOnThisDate: {
          header: "What do I need to do in order to be released on this date?",
          content: `To be released on your STP date, you must meet the following criteria:

- You must sign the Transition Program agreement form – talk to your COIII in order to do this.
- You must be classified as Medium or Minimum custody.
- You must complete the Mandatory Literacy requirement, unless you have an exemption.
- You can’t have any felony holds, felony detainers, or felony warrants.
- You must not have been found guilty of any Major Class A or Class B disciplinary rule violations within the last 6 months. You also cannot have any Major Violent rule violations during your current incarceration. Even if you qualified, getting a new infraction could cause you to lose your STP date.
- You cannot have refused or been removed from a major program for poor behavior within the last 18 months, unless you have since successfully reenrolled and completed it.
- You must have an approved home plan – starting to work on this ASAP is essential to receiving your full 90 days.
- You can’t have any past arrests, convictions, or requirements to register for sex offenses.
- You can’t have a history of Dangerous Crimes Against Children (A.R.S. §13-705).
- If you have participated in the Transition Program before, you must wait at least 24 months after your last [CSED](#csedDate) date before being eligible again.
- You must be a US Citizen or a legal permanent resident without an ICE detainer.`,
        },
        disqualifyingConvictions: {
          header:
            "What convictions would disqualify me from Transition Release?",
          content: `You are not eligible for Transition Release if you have ever been convicted of the following crimes, unless you committed them as a juvenile (when you were 18 or younger):

- Murder (first or second degree)
- Kidnapping
- Aggravated assault
- Sex offenses
- Robbery or burglary when a person is present or using a deadly weapon
- Arson when a person is present

For a more detailed list of the specific crimes that would disqualify you, please see ADCRR Department Order 1002, attachments A, B, and C. (You can find this in the FYI app, under the Department Orders section. The attachments are at the end of the document.) You can also look up ARS §31-281, the law that defines Transition Program Release, in the Law Library. It may also be available on your tablet through LexisNexis.`,
        },
        ifIAmReleased: {
          header: "If I'm released on STP, what does that mean for me?",
          content: `If you are released on STP, you will begin community supervision early. During the Transition Program Release period (the up to 90 days before you reach your next release date), you will need to regularly attend a program in the community, and report to a community supervision officer.

If you violate the conditions of your supervision while on Transition Program Release, you can be returned to prison to serve the remainder of your sentence until your next eligible release date.`,
        },
      },
    },
    dtpDate: {
      header: "Drug Transition Program (DTP)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content: `The Drug Transition Program (DTP) is a special version of the "Transition Program" designed for individuals serving sentences only for specific drug possession or use offenses. **This program allows you to be released to the community up to 90 days before your earliest eligible release date**, if you agree to participate in required transition programs while under supervision.

Because DTP is a specific category of early release, if you qualify for and are approved through this drug-specific track, you cannot also qualify for the [Standard Transition Program (STP)](#tprDate).

The primary goal of DTP is to help you successfully re-enter the community by providing early access to support services and treatment.
`,
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `People convicted of particular drug use/possession crimes, who also meet the rest of the criteria. Those crimes are:

- Possession or use of Marijuana (A.R.S. §13-3405(A)(1))
- Possession or use of Dangerous Drug (A.R.S. §13-3407(A)(1))
- Possession or use of a Narcotic Drug (A.R.S. §13-3408(A)(1))
- Possession or use of Drug Paraphernalia (A.R.S. §13-3415(A))

Please note that in order to qualify for DTP, your current sentence can _only_ be for drug possession/use. For example, someone convicted of marijuana possession _and_ another charge like assault or burglary will not qualify for DTP. However, you may still qualify for another version of Transition Program Release called [Standard Transition Program (STP)](#tprDate) if you meet those requirements.

The Department typically begins reviewing cases for eligibility up to 7 months before the next earliest release date. If you want to read the statutes like A.R.S. §13-3405(A)(1), you can find them in the Law Library or on your tablet through LexisNexis.`,
        },
        toBeReleasedOnThisDate: {
          header: "What do I need to do in order to be released on this date?",
          content: `- You must sign the Transition Program agreement form.
- You must be classified as Medium or Minimum custody.
- You must at least be enrolled in Functional Literacy.
- You can’t have any felony holds, felony detainers, or felony warrants.
- You can’t be found guilty of any Class A or Class B major disciplinary rule violations within 6 months of your CSBD / TR to ADD. Even if you qualified, getting a new major disciplinary infraction could cause you to lose your DTP date.
- You cannot have refused or been removed from a major program for poor behavior within the last 18 months, unless you later successfully reenrolled and completed it.
- You need a home plan that gets approved ASAP (see <AccordionOpener panelId="startHomePlanEarly">next question</AccordionOpener>).
- You can’t have any past arrests, convictions, or requirements to register for sex offenses.
- You can’t have a history of Dangerous Crimes Against Children (A.R.S. §13-705).
- If you have participated in the Transition Program before, it must have been at least 24 months since your last CSED.
- You must be a US Citizen or legal permanent resident without an ICE detainer.
- You must be up to date with any restitution payments.
`,
        },
        startHomePlanEarly: {
          header: `Why is it important to start my home plan early?`,
          content: `To get your full 90-day release, you need an approved home plan. Start working on this as soon as you can to avoid delays. If you don’t have a place to go, you might still be released, but that doesn’t mean you can go anywhere you want. You’ll be taken to the Community Corrections Office (CCO) where you may stay in a reentry center or transitional housing facility until a permanent residence is found. So no matter what, you still need a place that’s approved. **Starting early ensures you know exactly where you are going and prevents any last-minute loss of your early release time.**`,
        },
        ifIAmReleased: {
          header: "If I'm released on DTP, what does that mean for me?",
          content: `Under DTP, you begin your term of community supervision up to 90 days early. During this transition period, you must report regularly to a Community Corrections Officer and will remain under the jurisdiction of the ADCRR.

You are required to attend mandatory community-based programs, which may include substance abuse treatment and case management services, until you reach your formal [Community Supervision Begin Date (CSBD)](#csbdDate-trToAddDate).
`,
        },
      },
    },
    "csbdDate-trToAddDate": {
      header:
        "Community Supervision Begin Date (CSBD) or Temporary Release to Absolute Discharge Date (TR to ADD)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content: `This is a release up to 90 days earlier than ERCD (for most people, it’s ~77 days earlier), which can be granted if you meet <AccordionOpener panelId="toBeReleasedOnThisDate">the criteria</AccordionOpener>.

If your sentence includes a term of Probation following your release, this date is officially called Temporary Release to Absolute Discharge Date (TR to ADD). Be careful not to confuse “Temporary Release” with [“Transition Release” (TPR)](#tprDate), as they are different programs with different rules.`,
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `Most people whose crime was committed on/after January 1, 1994, can qualify if they meet the criteria. The law that created the rules after that date is often called “Truth in Sentencing,” or TIS.`,
        },
        toBeReleasedOnThisDate: {
          header: `What do I need to do in order to be released on this date?`,
          content: `In order to be released on your CSBD or TR to ADD, you must meet these requirements:

- You can’t have any past arrests, convictions, or requirements to register for sex offenses.
- You can’t have a history of Dangerous Crimes Against Children (A.R.S. 13-705).
- You must be classified as Medium or Minimum custody.
- You can’t have any felony holds, felony detainers, or felony warrants.
- You must meet the Mandatory Literacy requirement, unless you have an exemption.
- You can’t have been sent back to prison for a supervision violation or revocation after already being released on your current sentence.
- If you are a foreign national, you cannot have an ICE detainer.
- You can’t be released on your CSBD without an approved program or placement from Community Corrections (note: this requirement does not apply to TR to ADD releases)

Please note that Temporary Releases (TR) are at the discretion of the ADCRR Director. This means that you can be denied release on this date, even if you meet all the criteria. You can find more information about discretionary TR by looking up A.R.S. §§31-233(A)(B); 41-1604.11 in the Law Library, or on your tablet through LexisNexis.

Please also see ADCRR Department Order 1002, section 8.1, to learn more about this. You can find it in the FYI app, under the Department Orders section.
`,
        },
        ifIAmReleased: {
          header:
            "If I’m released on my CSBD or TR to ADD, what does that mean for me?",
          content: `If you are released on your CSBD or TR to ADD, you move to supervision in the community, reporting to a Community Reentry Officer. If you don’t meet requirements (for example: refuse to sign, or haven’t met Mandatory Literacy requirement), you may remain in prison past your CSBD or TR to ADD – either until you meet the CSBD requirements, or reach the next release date whose requirements you meet.`,
        },
        twoDifferentNames: {
          header:
            "Why can there be two different names for this date (CSBD vs. TR to ADD)?",
          content: `If you have a Probation term after your current prison sentence, this will be called your “Temporary Release to Absolute Discharge Date”, or TR to ADD. That is because when the “Temporary Release” period is over, you will be “Discharged” from ADCRR, over to the County that will supervise you on Probation.

If you have Community Supervision after your prison sentence, the release type is referred to as your CSBD. If you are released on this release type, and follow your Conditions of Supervision (like reporting as directed to your supervision officer), you would then be on Community Supervision until your Community Supervision End Date (CSED).
`,
        },
      },
    },
    "ercdDate-addDate": {
      header:
        "Earned Release Credit Date (ERCD) or Absolute Discharge Date (ADD)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content: `The Earned Release Credit Date (ERCD) or Absolute Discharge Date (ADD) is the earliest date you can leave prison based just on Earned Release Credits. For most people sentenced after 1994, this is at the earliest when you have served 85.7% of your sentence. Some offenses have different rules (for example, flat-time).

Earned Release Credits are given for time served, good behavior, and program participation.
`,
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `Most people sentenced under Truth in Sentencing (after January 1, 1994), unless you are serving flat-time (day-for-day), or your specific crime doesn't allow for release credits (certain violent or sex offenses).`,
        },
        toBeReleasedOnThisDate: {
          header: "What do I need to do in order to be released on this date?",
          content: `As long as your offense allows you to earn release credits:

- Stay eligible to earn credits (avoid major disciplinary infraction, participate in assigned programs, stay out of max custody)
- Meet or be exempt from any literacy/program requirements

Talk to your COIII to understand your program and Mandatory Literacy requirements. Most people who have less than 6 months between the date they arrive at ADCRR and their ERCD are exempt from the Mandatory Literacy requirement.
`,
        },
        ifIAmReleased: {
          header: "If I'm released on this date, what would that mean for me?",
          content: `If released at your ERCD or ADD, you begin serving the Community Supervision portion of your sentence, or your Probation sentence, in the community. Conditions of supervision apply, including reporting to an officer and possibly electronic monitoring.
`,
        },
        percent: {
          header: "Where does the 85.7% come from?",
          content: `Most people sentenced under Truth in Sentencing are eligible to earn 1 day of Earned Release Credit for every 6 days that they serve. If you don’t get any disciplinary infractions that remove your Credits, this means that you would serve 6/7ths of your sentence. 6 divided by 7 is 85.7%.

Note that some people serving time for _only_ non-violent drug possession or use crimes may be eligible for release after serving just 70% of their sentence. This is because they are eligible to earn more release credits – 3 for every 7 days served.`,
        },
        twoDifferentNames: {
          header:
            "Why can there be two different names for this date (ERCD or ADD)?",
          content: `If you have a probation term after your current prison sentence, this will be called your Absolute Discharge Date, or ADD. That is because you are being “Discharged” from ADCRR to the County that will supervise you on Probation. If you have a term of Community Supervision after your current prison sentence, this is called your ERCD.
`,
        },
      },
    },
    sedDate: {
      header: "Sentence Expiration Date (SED; 100% date)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content: `This is your "max out" date unless you refuse to sign conditions of your supervision.`,
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `Almost everyone has an SED. The two groups who do not are:

- People serving life sentences, and
- People who were released and later returned to prison on a supervision violation — they must stay in prison until their CSED.
`,
        },
        toBeReleasedOnThisDate: {
          header: "What do I need to do in order to be released on this date?",
          content: `If you are still in prison when you reach your SED, there is only one requirement for release: You must sign your Conditions of Supervision. If you refuse to sign, you will stay in prison until you reach your Community Supervision End Date (CSED).`,
        },
        ifIAmReleased: {
          header: "If I'm released on this date, what would that mean for me?",
          content: `If you are released on your SED, it means you have finished 100% of your prison time, but you still have to complete the Community Supervision or Probation part of your sentence. To leave the yard on this date, you must sign and agree to the Conditions of Supervision. Once you sign and are released, you will finish the rest of your supervision time in the community until you reach your final Community Supervision End Date (CSED).

It is important to know that if you refuse to sign these conditions, you will not be released; instead, you will be required to serve your entire supervision term inside the prison until your CSED.
`,
        },
      },
    },
    csedDate: {
      header: "Community Supervision End Date (CSED)",
      questions: {
        whatDoesThisMean: {
          header: "What does this mean?",
          content: `The CSED is the date when you are no longer under ADCRR custody. If you have a CSED, it means that you have a term of Community Supervision after your prison sentence. But, the CSED can mean different things depending on whether you sign and agree to your Conditions of Supervision, or if you refuse to sign and remain in prison.`,
        },
        signConditions: {
          header: "What if I sign and agree to my Conditions of Supervision?",
          content: `If you agree to your conditions and are released (on your ERCD or SED), you will serve the rest of your time in the community. As long as you follow the rules and avoid violations, your CSED is the date you stop reporting to your Community Corrections Officer (CCO).

While on Community Supervision, you can be revoked for a violation. If this happens, you may be returned to prison, but you cannot be held past your CSED unless you have picked up a new criminal charge.`,
        },
        doNotSignConditions: {
          header:
            "What if I _do not_ want to sign my Conditions of Supervision?",
          content: `If you **choose** not to sign your Conditions of Supervision when you reach your release date (like your ERCD or SED), you will not be released. Instead, you will remain in prison to serve your supervision term behind bars until you reach your CSED. Once you hit your CSED, you must be released unless you have picked up a new criminal charge while in custody (such as an aggravated assault or possession of contraband).
`,
        },
        whoHasThisDate: {
          header: "Who has this date?",
          content: `Most people sentenced after 1994 have a "Community Supervision" requirement. If the judge gave you Probation instead of Community Supervision, you will not have a CSED.
`,
        },
        howIsThisDateCalculated: {
          header: "How is this date calculated?",
          content: `Community Supervision is a mandatory period of supervision that follows your time in prison. Your Community Supervision is a fixed length of time (per A.R.S. §13-603(I)): 1 day for every 7 days of your original sentence (or around 15% of the total sentence). This total length of time remains exactly the same, no matter when you are released.

The CSED is calculated by adding the length of your Community Supervision to your Earned Release Credit Date. This means that your CSED can change over the course of your incarceration if you get a disciplinary infraction and lose Release Credits, or have Credits restored.

If you lose all of your Release Credits and serve 100% of your sentence, the latest that your CSED can be is 115% of your original sentence time.

Please note that time you spend on [Temporary Release](#csbdDate-trToAddDate) (the time between your CSBD and ERCD) or on early release through the [Transition Program](#tprDate) (STP/DTP) does not count towards your Community Supervision term. If you are released on one of the dates before your ERCD, you will spend less time in prison, but will be reporting to a Community Supervision officer for longer. The clock only starts on your Community Supervision term once you reach your ERCD.`,
        },
      },
    },
  },
};

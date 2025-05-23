// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { LanternMethodology } from "../types";

export const US_MO_METHODOLOGY: LanternMethodology = {
  admissionsOverTime: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `This chart displays the total number of admissions to prison during each month due to revocation by the parole board or the court. Note: This chart uses an event-based methodology – meaning, if a single individual has multiple admissions to prison during the time period, each admission is counted separately. For all other charts on this dashboard, a person-based methodology is used, which means if an individual has multiple admissions during the time period, they are only counted once for their most recent admission.`,
    },
    {
      id: 2,
      title: "Who is included",
      methodology: `This chart includes only people who were revoked to prison. Counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. This chart (like all charts on the page) will automatically repopulate to match whatever filter(s) the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
  ],
  admissionsMatrix: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `This chart plots all people who were revoked to prison during the time period selected by the user, according to their most serious violation and the total number of violation reports and notices of citation. The user can select the time period for revocations included in the chart by using the drop-down menu in the upper left corner of the page. The most serious violation and total number of reported violations are determined by looking back at all violation reports and notices of citation filed within one year prior to the last reported violation before their revocation. For example, if the last violation a person committed occurred on February 1, 2017, and they were revoked on January 15, 2018, the most serious violation and number of violations would be determined by looking over the period of February 1, 2016 - February 1, 2017. This methodology negates the lag time between the last violation report and the court's decision to revoke, and therefore gives a fuller picture of a person's behavioral record leading up to the decision to recommend revocation. Reports filed after the revocation are not included, since they were presumptively irrelevant to the revocation. These violation counts include citations as well as initial and interdistrict violation reports. No other types of violation reports are included. Hence, if a person had three initial violation reports and one interdistrict report, they would be counted as having four violations. They would be categorized according to the most severe violation reported in all of these reports, regardless of whether it was in the initial report or interdistrict report.`,
    },
    {
      id: 2,
      title: "Most serious violation",
      methodology: `Violations, starting with the least serious, are listed in order of severity: technical, substance use, municipal offense, absconsion, misdemeanor, felony. The most serious violation determines what row a person is placed in, regardless of whether it was the most recent violation. For example, if a person had one misdemeanor violation, then two technical violations, then one substance use violation, and then they were revoked, they would be placed in the misdemeanor row because a misdemeanor is their most serious violation.`,
    },
    {
      id: 3,
      title: "Number of violation reports and notices of citation filed",
      methodology: `This is determined by counting the total number of violation reports and notices of citation that were filed one year prior to the last reported violation before their revocation. For example, if a person had one notice of citation on February 10, 2016 and one violation report on February 1, 2017, and then they were revoked (without any new violations), they would be in the "2" column. This is the case even if several types of violations or conditions violated were listed within a single report.`,
    },
    {
      id: 4,
      title: "Who is included",
      methodology: `This chart includes only people who were revoked to prison. It does not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; (3) people who have been detained pending a revocation hearing, but who have not been legally revoked; and (4) people who have zero violation reports and notices of citation within the year leading up to their revocation (this is around 1% of the revoked population). This chart (like all charts on the page) will automatically repopulate to match whatever filters the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
  ],
  admissionsByDistrict: [
    {
      id: 1,
      title: `What the "revocation count" chart shows`,
      methodology: `When no violation history filters are selected in the "Admissions by violation history" plot, this chart shows the total number of people revoked to prison from each district during the time period selected in the "Time Period" drop down menu. The districts are positioned in descending order from left to right, with the district with the highest number of people revoked at the left. If a person's district is unknown (meaning they were not under active supervision in any district within 2 years prior to the revocation), they are not included in the district counts or rates. When hovering a mouse over any district column, users can see the total number of people on supervision in that district as the denominator and the total number of people admitted in that district as the numerator.`,
    },
    {
      id: 2,
      title: `What the "percent revoked of standing population" chart shows`,
      methodology: `This chart shows the percentage of people revoked in each district. Percent revoked is defined as the number of people revoked from that district in the selected time period divided by the total supervised population within that district during the same time period. The districts are positioned in descending order from left to right, with the district with the highest revocation rate at the left. If a person's district is unknown (meaning they were not under active supervision in any district within 2 years prior to the revocation), they are not included in the district counts or rates.`,
    },
    {
      id: 3,
      title: "Who is included",
      methodology: `This chart includes only people who were revoked to prison. Counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. This chart (like all charts on the page) will automatically repopulate to match whatever filter(s) the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
    {
      id: 4,
      title: "Filtering by violation history",
      methodology: `If the user has filtered the page by clicking on a specific violation type (i.e., low technical) or bubble (i.e., low technical and 3 violation reports) within the "Admissions by violation history" plot, this chart will show the percentage of people admitted with the selected violation history among those with a similar violation history within each district. For example, if the user selected the low technical row on the plot, the chart would show: For each district, the number of people admitted whose most serious violation was a low technical, divided by the total number of people on supervision whose most serious violation was a low technical, regardless of whether they were admitted. Continuing with this example, if a user hovers their mouse over the district column, the numerator would be all people admitted for a low technical violation in that district and the denominator would be all people who committed a low technical violation, whether or not they were admitted to a DOC facility. Comparing these percentages will indicate whether admission practices differ by district for various violation histories. That is, whether people with similar violation histories are admitted more frequently in one district than another. For people who have not been admitted, the most serious violation is identified by considering all violations reported within one year from either the current date (if the person is still on supervision) or the date that the person was discharged from supervision.`,
    },
  ],
  admissionsByOfficer: [
    {
      id: 1,
      title: `What the "revocation count" chart shows`,
      methodology: `This chart shows the total number of people revoked to prison by the 50 supervision officers with the most revocations during the time period selected in the "Time Period" drop-down menu. Supervision officers are positioned in descending order from left to right, with the officer with the highest number of people admitted from supervision at the left. If the chart shows fewer than 50 bars, there were less than 50 officers who had admissions during the selected time period. The officer associated with each admission from supervision is based on the officer who was assigned most recently to a supervision case at the time of admission.`,
    },
    {
      id: 2,
      title: `What the "percent revoked of standing population" chart shows`,
      methodology: `When no violation history filters are selected in the "Admissions by violation history" plot, this chart shows the percentage of people revoked to prison from each supervision officer's caseload. Admission rate of standing population is defined as the number of people revoked to prison per officer divided by the total number of people supervised by each officer. The 50 supervision officers with the highest admission rates are positioned in descending order from left to right. If the chart shows fewer than 50 bars, there were fewer than 50 officers who had admissions during the selected time period. The officer associated with each admission from supervision is based on the officer who most recently was assigned to a supervision case at the time of admission. When hovering over any officer column, users can see the total number of people on supervision on that officer's caseload as the denominator and the total number of people admitted from that officer's caseload as the numerator. officer caseloads vary widely, so admission rates by officer may be based on a relatively small number of cases and therefore less generalizable. `,
    },
    {
      id: 3,
      title: "Who is included",
      methodology: `This chart includes only people who were revoked to prison. Counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. This chart (like all charts on the page) will automatically repopulate to match whatever filter(s) the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
    {
      id: 4,
      title: "Filtering by violation history",
      methodology: `If the user has filtered the page by clicking on a specific violation type (i.e., low technical) or bubble (i.e., low technical and three violation reports) within the "Admissions by violation history" plot, this chart will show the percentage of people admitted with the selected violation history among those with a similar violation history within an officer's caseload. For example, if the user selected the low technical row on the plot, the chart would show for each officer, the number of people admitted whose most serious violation was a low technical, divided by the total number of people supervised by that officer whose most serious violation was a low technical, regardless of whether they were admitted. Continuing with this example, if a user hovers over the officer column, the numerator would show all people admitted for a low technical violation on that officer's caseload, and the denominator would show all people on that officer's caseload who committed a low technical violation, whether they were admitted to a DOC facility or not. Comparing these percentages will indicate whether admission practices differ by officer for various violation histories. That is, whether people with similar violation histories are admitted more frequently by one officer than another. For people who have not been admitted, the most serious violation is identified by considering all violations reported within one year from either the current date (if the person is still on supervision) or the date that the person was discharged from supervision.`,
    },
  ],
  admissionsByRiskLevel: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `When no violation history filters are selected in the "Admissions by violation history" plot, this chart shows the percentage of people who were revoked in each risk level group. This is calculated as the number of people of each risk level who were revoked divided by the total number of people on supervision at that risk level. Risk level is based only on the Community Supervision Screening Tool and/or the Community Supervision Tool (if relevant) and no other assessment (i.e., Prison Intake Tool). Those without Community Supervision Screening Tool/Community Supervision Tool scores are counted in the No Score category. When hovering a mouse over any risk column, users can see the total number of people on supervision assessed at that specific risk level as the denominator and the total number of people revoked at that risk level as the numerator. `,
    },
    {
      id: 2,
      title: "Who is included",
      methodology: `This chart includes only people who were revoked to prison. Counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. This chart (like all charts on the page) will automatically repopulate to match whatever filter(s) the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
    {
      id: 3,
      title: "Filtering by violation history",
      methodology: `If the user has filtered the page by clicking on a specific violation type (i.e., technical) or bubble (i.e., technical, 3) within the revocation plot, this chart will show the percentage of people revoked with the selected violation history among those on supervision with the same risk level. For example, if the user had selected the technical row on the revocations plot, the chart would show: For each risk level, the number of people revoked whose most serious violation was a technical, divided by the total number of people on supervision whose most serious violation was a technical, regardless of whether they were revoked. Continuing with this example, if a user hovers their mouse over the low risk column, the numerator would be all low risk people admitted for a low technical violation and the denominator would be all low risk people who committed a low technical violation, whether or not they were admitted to a DOC facility. Comparing these percentages will indicate whether revocation practices are sensitive to risk level. That is, whether people who are higher risk are more likely to be revoked than lower risk people who have similar violation histories. For people who have not been revoked, the most serious violation is identified by considering all violations reported within one year from either the current date (if the person is still on supervision) or the date that the person was discharged from supervision.
`,
    },
  ],
  admissionsByViolationType: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `This chart shows the relative frequency of each type of violation among the selected group. The blue bars represent the different categories of conditions violated that constitute technical violations. The orange bars represent different categories of law violations. This is calculated as follows: The total number of violation reports or notices of citation upon which each type of violation appears, divided by the total number of violation reports or notices of citation filed. Violation counts include all reported violations filed within one year of a person's last violation before they were revoked. For this chart only, if multiple violation types are listed on one violation report or notice of citation, they are all counted. For example, if a single notice of citation lists both an employment violation and a reporting violation, both are counted. Hence the total number of reported violations included in this chart will be larger than the total number of violation reports and notices of citation. For example, if there were a total of 100 violation reports and notices of citation, but each report listed 2 different violations, the denominator in each percentage would still be 100. If, out of these 100 violation reports and notices of citation, 20 included at least one employment violation, then the percentage for employment violations would be 20/100=20%`,
    },
    {
      id: 2,
      title: "Who is included",
      methodology: `This chart includes only violation records for people who were revoked to prison. Counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. This chart (like all charts on the page) will automatically repopulate to match whatever filters the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this chart will automatically update to include only people from the probation population in District 2.`,
    },
  ],
  admissionsByGender: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `When no violation history filters are selected in the "Admissions by violation history" plot, this chart shows the percent of each gender who were revoked, on supervision, and in Missouri's general population. At a high level, comparing these percentages can indicate whether a given gender is over- or under-represented when compared to the broader population. If an individual does not have a known gender, they are excluded from this chart.`,
    },
    {
      id: 2,
      methodology: `"Missouri Population" refers to the number of individuals of the selected gender divided by the total number of people in Missouri, according to the US Census Bureau. This value stays the same regardless of whether any filters are selected on the page.`,
    },
    {
      id: 3,
      methodology: `The "Supervision Population" refers to the number of individuals of the selected gender divided by the total number of people on supervision during the selected time period.`,
    },
    {
      id: 4,
      methodology: `"Admitted Population" refers to the number of individuals of the selected gender who were admitted to a DOC facility for a revocation divided by the total number of people revoked during the selected time period. Revocation counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. `,
    },
    {
      id: 5,
      methodology: `If a specific district is selected, "Admitted Population" and the "Supervision Population" will only include individuals currently assigned to or terminated by an officer from that district. `,
    },
    {
      id: 6,
      title: "Filtering by violation history",
      methodology: `If the user has filtered the page by clicking on a specific violation type (i.e. technical) or bubble (i.e. technical, 3) within the revocation plot, the groups of "Admitted Population" and "Supervision Population" groups will be updated. If a user selected the row "Technical", the denominator of "Admitted Population" will now only be people who were revoked with a most serious violation of technical, and the numerator would be the subset of people who are of the selected gender and who have been revoked with a most serious violation of technical. Similarly, with the above example, the "Supervision Population" denominator would now be all people on supervision who committed a technical violation, whether or not they were revoked, and the numerator would be the subset of that population who were of the specified gender. For people who have not been revoked, the most serious violation is identified by considering all violations reported within one year from either the current date (if the person is still on supervision) or the date that the person was discharged from supervision.`,
    },
  ],
  admissionsByRace: [
    {
      id: 1,
      title: "What this chart shows",
      methodology: `When no violation history filters are selected in the "Admissions by violation history" plot, this chart shows the percent of people in each race/ethnicity group who were revoked, on supervision, and in Missouri's general population. At a high level, comparing these percentages can indicate whether a given race/ethnicity is over- or under-represented when compared to the broader population. If an individual has more than one race/ethnicity recorded from different data systems, they are counted toward the least common race/ethnicity in the state. For example, if the individual is Caucasian and African American, they would count in the African American selection because there are fewer African Americans than Caucasians in the state. If an individual does not have a known race/ethnicity, they are excluded from this chart.`,
    },
    {
      id: 2,
      methodology: `"Missouri Population" refers to the number of individuals of the selected race/ethnicity divided by the total number of people in Missouri, according to the US Census Bureau. This value stays the same regardless of whether any filters are selected on the page.`,
    },
    {
      id: 3,
      methodology: `The "Supervision Population" refers to the number of individuals of the selected race/ethnicity divided by the total number of people on supervision during the selected time period. `,
    },
    {
      id: 4,
      methodology: `"Admitted Population" refers to the number of individuals of the selected race/ethnicity who were admitted to a DOC facility for a revocation divided by the total number of people revoked during the selected time period. Revocation counts do not include (1) people who were revoked to termination or to a new form of supervision (i.e., SIS to SES); (2) people who were admitted to prison for reasons aside from revocation, such as treatment or short term sanctions; and (3) people who have been detained pending a revocation hearing, but who have not been legally revoked. `,
    },
    {
      id: 5,
      methodology: `If a specific district is selected, "Admitted Population" and the "Supervision Population" will only include individuals currently assigned to or terminated by an officer from that district. `,
    },
    {
      id: 6,
      title: "Filtering by violation history",
      methodology: `If the user has filtered the page by clicking on a specific violation type (i.e. technical) or bubble (i.e. technical, 3) within the revocation plot, the groups of "Admitted Population" and "Supervision Population" groups will be updated. If a user selected the row "Technical", the denominator of "Admitted Population" will now only be people who were revoked with a most serious violation of technical, and the numerator would be the subset of people who are of the selected race/ethnicity and who have been revoked with a most serious violation of technical. Similarly, with the above example, the "Supervision population" denominator would now be all people on supervision who committed a technical violation, whether or not they were revoked, and the numerator would be the subset of that population who were of the specified race/ethnicity. For people who have not been revoked, the most serious violation is identified by considering all violations reported within one year from either the current date (if the person is still on supervision) or the date that the person was discharged from supervision.`,
    },
  ],
  filteredCaseTable: [
    {
      id: 1,
      title: "What this list includes",
      methodology: `This is a list of people who fall within the filters that have been selected on the page. In the default landing view, this includes all people who have been revoked to prison during the time period selected in the revocations plot. If the user has selected a different set of filters, this list will automatically repopulate to match whatever filters the user has selected. For example, if the user has selected "District 2" and "Probation" from the drop down menus at the top of the screen, this list would automatically update to include only people from the probation population in District 2.`,
    },
    {
      id: 2,
      title: "District",
      methodology: `The district within which a person was under supervision during their last active supervision period prior to revocation. For a small percentage of individuals (approx. 4-8 percent), the district and officer are unknown. This happens when the individual was not associated with an active supervision period at any point within the two years prior to the revocation.`,
    },
    {
      id: 3,
      title: "Officer",
      methodology: `The most recent supervision officer the person was assigned to prior to revocation.`,
    },
    {
      id: 4,
      title: "Risk Level",
      methodology: `Risk level is defined based only on the Community Supervision Screening Tool and/or the Community Supervision Tool (if relevant) and no other assessment (i.e., Prison Intake Tool). Those without Community Supervision Screening Tool/Community Supervision Tool scores are counted in the No Score category.`,
    },
    {
      id: 5,
      title: "Last Officer Recommendation (Including Supplemental)",
      methodology: `The recommendation listed on the last violation report before the person was revoked, including any supplemental violation reports.`,
    },
    {
      id: 6,
      title: "Violation Record",
      methodology: `A summary of the most severe reported violation on each violation report or notice of citation filed within one year prior to the last reported violation before the person was revoked.`,
    },
    {
      id: 7,
      title: "Total Admissions",
      methodology: `The number of total admissions for an admitted individual during the selected time period.`,
    },
  ],
};

export default { US_MO_METHODOLOGY };

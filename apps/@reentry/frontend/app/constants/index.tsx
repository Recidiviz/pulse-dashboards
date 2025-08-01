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

import type { AppData } from "../types";

export const DEFAULT_TREE = `
graph TD
    A[Enter Chart Definition] --> B(Preview)
    B --> C{decide}
    C --> D[Keep]
    C --> E[Edit Definition]
    E --> B
    D --> F[Save Image and Code]
    F --> B`;

export const APP_DATA = {
	actions: [
		{
			title: "ROOTS YA Shelter",
			subtitle: "4 stars, 7 min from sis' home",
			options: [
				{
					label: "Action 1",
					key: "action1",
				},
				{
					label: "Action 2",
					key: "action2",
				},
				{
					label: "Action 3",
					key: "action3",
				},
				{
					label: "Action 4",
					key: "action4",
				},
			],
		},
		{
			title: "YouthCare",
			subtitle: "2.7 stars, 21 min from school",
			options: [
				{
					label: "Action 1",
					key: "action1",
				},
				{
					label: "Action 2",
					key: "action2",
				},
				{
					label: "Action 3",
					key: "action3",
				},
				{
					label: "Action 4",
					key: "action4",
				},
			],
		},
		{
			title: "Youth Eastside Services",
			subtitle: "4.1 stars, 14 min from school",
			options: [
				{
					label: "Action 1",
					key: "action1",
				},
				{
					label: "Action 2",
					key: "action2",
				},
				{
					label: "Action 3",
					key: "action3",
				},
				{
					label: "Action 4",
					key: "action4",
				},
			],
		},
		{
			title: "Valley Corps",
			subtitle: "1.7 stars, 3 min from home",
			options: [
				{
					label: "Action 1",
					key: "action1",
				},
				{
					label: "Action 2",
					key: "action1",
				},
				{
					label: "Action 3",
					key: "action1",
				},
				{
					label: "Action 4",
					key: "action1",
				},
			],
		},
	],
	sections: [
		{
			title: "Goals",
			subsections: [
				{
					title: "4 stars, 7 min from sis' home",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
			],
			text: "The primary goal is to achieve stable housing and financial independence while addressing any underlying challenges that contribute to the current situation. This includes securing safe and affordable housing, increasing income through stable employment or expanding music opportunities, and developing essential life skills. Additionally, the plan aims to support mental and emotional well-being and ensure compliance with any legal obligations.",
		},
		{
			title: "Timeline",
			text: "The action plan outlines a timeline with both short-term and long-term goals. The initial focus is on securing immediate safe housing and stabilizing income within the first month.  Education and skills development, along with mental health support, are prioritized in the first three months. Long-term goals, such as career development, financial planning, and finding stable housing, are targeted for completion within 3 to 12 months. The timeline is flexible and subject to adjustment based on individual progress and circumstances.",
		},
		{
			title: "Substance use",
			subsections: [
				{
					title: "Immediate steps",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
				{
					title: "Monitoring",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
			],
			text: "This section of the action plan likely focuses on addressing any potential substance use issues that may be impacting the individual's stability or hindering their progress towards their goals. It could include steps such as seeking immediate professional help if needed, developing strategies for monitoring and managing substance use, and participating in ongoing support or treatment programs. The specific details would depend on the individual's situation and needs, but the overall aim is to promote a healthy and substance-free lifestyle that supports long-term stability and success.",
		},
		{
			title: "Housing",
			subsections: [
				{
					title: "Short-term stability",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
				{
					title: "Long-term plan",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
			],
			text: "The action plan prioritizes securing stable housing, recognizing its crucial role in overall well-being and success. In the short term, the focus is on finding immediate safe housing, potentially through youth shelters or exploring options with family members. The long-term goal is to achieve independent living, which involves researching affordable housing options, applying for assistance if eligible, and saving for moving costs. The plan emphasizes working with Officer Kindra to develop a sustainable housing plan that aligns with the individual's financial capabilities and long-term goals.",
		},
		{
			title: "Education",
			subsections: [
				{
					title: "Funding",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
				{
					title: "Enrollment",
					text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
				},
			],
			text: "This section of the plan emphasizes the importance of education and skills development as a pathway to stability and self-sufficiency. It encourages pursuing a GED if high school hasn't been completed and exploring vocational training opportunities, particularly in music or related fields. The plan also highlights the importance of securing funding and enrollment for these educational pursuits, potentially with the assistance of Officer Kindra or other support services. The focus is on acquiring the knowledge and skills necessary to achieve long-term career goals and financial independence.",
		},
		{
			title: "Resource List",
			text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
		},
		{
			title: "Using Link to Help",
			text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. ",
		},
	],
} as AppData;

export const EXAMPLE_MARKDOWN = `
# Action Plan for Allistor

## Summary of Client's Circumstances
Allistor is a 17-year-old client currently on probation for petty theft. His sentence involves 4 years of probation, with a possibility of reduction through community college attendance. Allistor faces several challenges including strained family relationships, educational needs, and housing insecurity. He prefers staying with his sister due to ongoing conflicts with his parents. His recidivism risk is medium, and his substance use risk is low. He has expressed interest in attending community college but lacks stable housing.

## Short-Term Plan (1-3 months)
### Objectives:
1. **Stabilize Housing Situation**
2. **Initiate Educational Planning**
3. **Address Immediate Needs**

### Actions:
- **Assess Immediate Needs**:
  - Determine if Allistor is in immediate danger (no immediate danger noted).
  - Refer to healthcare services if medical attention is needed.
  - Provide food or refer to a food bank if Allistor is hungry.

- **Housing Solutions**:
  - Assess availability of shelter beds.
  - If shelter beds are unavailable, provide temporary housing options such as emergency motel vouchers or connect with temporary housing programs.

- **Educational Planning**:
  - Contact local community colleges to gather information on enrollment, financial aid, and support services.
  - Assist Allistor in completing necessary forms for college enrollment and financial aid applications.

## Long-Term Plan (3-12 months)
### Objectives:
1. **Secure Stable Housing**
2. **Support Educational Progress**
3. **Enhance Self-Sufficiency and Employment Prospects**

### Actions:
- **Secure Housing**:
  - Assess income stability and explore housing assistance programs.
  - Assist Allistor in applying for long-term housing solutions, including affordable housing programs or housing subsidies.

- **Educational Support**:
  - Monitor Allistor's progress in community college and provide tutoring or academic support as needed.
  - Encourage participation in college support programs such as counseling, mentoring, and extracurricular activities.

- **Employment Plan**:
  - Refer Allistor to employment services to assess job skills and develop an employment plan.
  - Connect with job training programs and internships that align with his interests and career goals.

- **Self-Sufficiency**:
  - Develop a self-sufficiency plan focusing on life skills, financial literacy, and personal development.
  - Connect with community resources for additional support in areas such as mental health, substance abuse prevention, and social services.

## Resources and Providers to Connect With
- **Local Shelters and Temporary Housing Programs**
- **Community Colleges and Financial Aid Offices**
- **Food Banks and Meal Programs**
- **Employment Services and Job Training Programs**
- **Affordable Housing Programs and Housing Subsidy Agencies**
- **Mental Health Services and Counseling Centers**
- **Substance Abuse Prevention Programs**
- **Community Support Organizations**

## Timeline for Check-Ins with Case Officer
- **Monthly Check-Ins**: Regular updates on Allistor's housing stability, educational progress, and employment status.
- **Quarterly Reviews**: Comprehensive assessment of Allistor's overall well-being, self-sufficiency progress, and adjustment of the action plan as needed.
- **Bi-Annual Evaluations**: Detailed review and reporting of Allistor's achievements, challenges, and necessary plan modifications.

## Steps for the Case Officer
1. **Initial Assessment and Immediate Needs**:
   - Conduct an initial assessment to identify and address Allistor's immediate needs.
   - Coordinate with local shelters and food banks if necessary.

2. **Educational and Housing Support**:
   - Assist Allistor with community college enrollment and financial aid applications.
   - Explore and secure temporary and long-term housing options.

3. **Employment and Self-Sufficiency Planning**:
   - Refer Allistor to employment services and job training programs.
   - Develop and monitor a self-sufficiency plan focusing on life skills and personal development.

4. **Regular Monitoring and Adjustments**:
   - Conduct monthly check-ins and quarterly reviews to track Allistor's progress.
   - Adjust the action plan based on Allistor's evolving needs and circumstances.
   - Ensure Allistor is connected with appropriate community resources and support services.

---

By following this structured action plan, the case officer can provide comprehensive support to Allistor, helping him achieve stability and self-sufficiency over the next 24 months.
`;

export const EXAMPLE_OUTPUT = {
	output:
		"# Action Plan for Allistor\n\n## Summary\nAllistor is a 17-year-old on probation for petty theft, with a four-year sentence. He is facing several challenges, including strained family relationships, educational needs, and housing insecurity. He shows interest in attending community college but lacks stable housing. His recidivism risk is medium, and his substance use risk is low.\n\n## Short-term Plan (1-3 Months)\n\n1. **Immediate Needs Assessment**\n    - No immediate danger.\n    - No need for medical attention.\n    - He has housing insecurity.\n\n2. **Housing Security**\n    - **Check availability** at SafeStay Youth Shelter: [Contact SafeStay](https://safestay.org) (Phone: 555-1234).\n    - **Refer client** to SafeStay for temporary housing.\n\n3. **Educational Pathway**\n    - **Enroll** Allistor in Cityville Community College: [Contact CCC](https://cityvillecc.edu) (Phone: 555-5678).\n    - **Check class availability** for courses that can meet probation reduction criteria.\n\n4. **Family Relationship Support**\n    - Arrange family mediation to address conflicts and strain.\n\n### Timeline for Short-term Plan Check-ins\n- **Check-in bi-weekly** with Allistor to monitor progress on housing and college enrollment.\n- **Case Officer Actions**:\n    - September 15, 2024: Verify housing arrangement with SafeStay.\n    - September 30, 2024: Confirm college enrollment and class start dates.\n    - October 15, 2024: Conduct first mediation session with the family.\n\n## Long-term Plan (3-24 Months)\n\n1. **Sustained Housing Stability**\n    - **Assist in finding permanent housing** solutions alongside employment.\n    - **Explore housing assistance programs** if income remains insufficient.\n\n2. **Educational Advancement**\n    - Monitor academic progress at college.\n    - Ensure participation in 5 quarters to meet probation reduction criteria.\n\n3. **Employment Services**\n    - **Refer to employment services** to help Allistor find a job.\n    - Develop an employment plan based on assessed job skills and education.\n\n4. **Mental Health and Substance Use**\n    - **Assess mental health needs** and provide appropriate resources if needed.\n    - Regularly check to ensure low-risk substance use remains unchanged.\n\n5. **Community and Self-Sufficiency**\n    - **Connect with community resources** for additional support.\n    - Develop a plan to achieve self-sufficiency over the probation period.\n\n### Timeline for Long-term Plan Check-ins\n- **Monthly check-ins** with Allistor to monitor progress in housing, education, and employment.\n- **Case Officer Actions**: \n    - November 1, 2024: Review housing stability.\n    - December 1, 2024: Check academic performance and employment status.\n    - January 2025: Reassess mental health and ensure community connections.\n    - Continue monthly reviews adjusting support as needed until 2026.\n\n## Resources and Providers to Connect With\n\n1. **SafeStay Youth Shelter**\n    - **Phone**: 555-1234\n    - **Website**: [SafeStay](https://safestay.org)\n    - **Services**: Temporary housing for homeless youth\n    - **Actions**: Check availability, Refer client\n\n2. **Cityville Community College**\n    - **Phone**: 555-5678\n    - **Website**: [Cityville CC](https://cityvillecc.edu)\n    - **Services**: Degree programs and vocational training\n    - **Actions**: Enroll, Check class availability\n\n## Steps for the Case Officer\n\n1. Schedule and facilitate bi-weekly and monthly check-ins with Allistor.\n2. Maintain regular contact with SafeStay Youth Shelter and Cityville Community College.\n3. Conduct family mediation and ongoing support.\n4. Oversee Allistor’s progress in the 5 quarters of community college needed for probation reduction.\n5. Regularly update risk assessments and adapt support plans accordingly.",
};

export const BACKEND_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

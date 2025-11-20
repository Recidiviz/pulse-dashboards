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

import { AppData } from "~@reentry/frontend/types";

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

export const BACKEND_URL =
  process.env["NEXT_PUBLIC_API_URL"] || "http://localhost:8000";

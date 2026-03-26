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

export default {
  reentry: {
    intro: {
      heading: "Prepare for Reentry",
      body: `This application is for individuals nearing their parole hearing or release. It allows you to take a survey about your goals and needs for reentry, kick off planning with your case manager, and receive a step-by-step guide to help you succeed. Talk to your case manager to get access.`,
    },
    surveyCard: {
      heading: "Status",
      noSurvey: {
        chip: "Not ready",
        value: "No surveys available",
        body: "You will only have access to interact with this application when your case manager has assigned it to you.",
      },
      survey: {
        chip: "Ready",
        value: "Reentry survey available",
        body: `Using this tablet, you will answer a series of questions about your education, employment, finances, 
        family, housing, and more. Information you share will be used to prepare a Reentry Guide just for you. 

When you’re ready, click the button below to learn more and begin your reentry preparation. `,
        linkText: "Get started",
      },
    },
  },
};

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

type Personas = {
  [key: string]: {
    name: string;
    dateOfBirth: string;
    age: number;
    summary: string;
    dimensions: {
      [key: string]: {
        riskLevel: string;
        history: string;
      };
    };
  };
};

export const CLIENT_PERSONAS: Personas = {
  "Ethan 'Eddie' Sullivan": {
    name: 'Ethan "Eddie" Sullivan',
    dateOfBirth: "April 9, 1990",
    age: 34,
    summary: `Ethan "Eddie" Sullivan is a 34-year-old individual who has faced multiple arrests for non-violent crimes. Despite his criminal history, he is highly motivated to change his lifestyle and has shown significant progress through community service, vocational interests, and therapeutic engagement. Supported by his family and a network of positive influences, Eddie's current focus is on rehabilitation, employment, and forming healthy lifestyle habits. His high willingness to change and seek help makes him a promising candidate for successful reintegration into society.`,
    dimensions: {
      Criminal: {
        riskLevel: "high",
        history: `Multiple arrests primarily for non-violent offenses such as theft and vandalism.
  First arrested at age 19 for shoplifting.
  Has served short sentences, primarily in county jail, with the latest incident occurring a year ago.
  Currently on probation and actively participating in community service as part of his sentencing.`,
      },
      Education: {
        riskLevel: "low",
        history: `Completed high school with difficulty due to a lack of engagement.
  No further formal education but has expressed interest in taking vocational training in automotive repair.
  Literate and capable but lacks formal certification or skills training.`,
      },
      Employment: {
        riskLevel: "moderate",
        history: `Currently unemployed but actively seeking opportunities.
  Previously worked in various low-skill jobs including construction and retail, but often lost jobs due to absenteeism before he began his rehabilitation journey.
  Actively exploring training programs and work placement opportunities.`,
      },
      Financial: {
        riskLevel: "moderate",
        history: `Limited financial stability; relies on short-term, odd jobs for income.
  Managed to clear personal debts with assistance from a financial counseling service.
  No significant savings but is budgeting carefully.`,
      },
      Family: {
        riskLevel: "low",
        history: `Strong family ties; lives with an older sister who has been supportive through legal troubles.
  Parents live nearby and are part of his support network.
  No children, maintains good relationships with extended family members.`,
      },
      Housing: {
        riskLevel: "low",
        history: `Stable housing with his sister in a supportive home environment.
  Located in a community with resources for rehabilitation and self-improvement.
  Contributes to household expenses and maintains a clean living arrangement.`,
      },
      Recreation: {
        riskLevel: "low",
        history: `Recently joined a local gym to improve physical health and engage in positive lifestyle changes.
  Enjoys creative writing and has started composing short stories as a therapeutic outlet.
  Actively avoids past social circles to focus on self-improvement.`,
      },
      Associates: {
        riskLevel: "low",
        history: `Transitioned from previous negative influences to new, positive peers through community programs.
  Regular attendance at support meetings with peers focused on rehabilitation and positive life changes.
  Limited contact with former associates to minimize relapse risks.`,
      },
      "Cognition/Psychiatric": {
        riskLevel: "low",
        history: `No diagnosed cognitive or psychiatric issues, but has faced challenges with impulsivity and decision-making.
  Engaged in therapy to develop better coping mechanisms and decision-making skills.
  High level of self-awareness and openness to interventions.`,
      },
      Health: {
        riskLevel: "low",
        history: `Generally healthy with a focus on improving physical fitness.
  Recent efforts to quit smoking have been successful.
  Regularly attends health check-ups and is proactive about wellness.`,
      },
    },
  },
};

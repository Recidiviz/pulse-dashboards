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

import { ProgramsConfig } from "../types";

export const US_MA_CONFIG: ProgramsConfig = {
  spreadsheetEnvVar: "US_MA_PROGRAMS_SPREADSHEET_ID",
  sources: {
    en: {
      range: "Program list!A:H",
      fixtures: [
        {
          programId: "MA-0001",
          category: "Education",
          title: "Introduction to Plumbing",
          description:
            "Introduces students to the basics of plumbing including pipe fitting, soldering, and installation of fixtures.",
          abbreviatedDescription:
            "Hands-on training in pipe fitting, soldering, and fixture installation.",
          facilitiesOffered: ["MCI-Concord", "MCI-Shirley"],
          eligibilityRequirements: "Must have GED/HSD",
        },
        {
          programId: "MA-0002",
          category: "Education",
          title: "Basic Literacy",
          description:
            "Literacy instruction is provided for learners who are assessed below the 9th grade education level.",
          abbreviatedDescription:
            "Reading and writing instruction for learners below the 9th grade level.",
          facilitiesOffered: ["All facilities"],
          eligibilityRequirements: "None",
        },
        {
          programId: "MA-0003",
          category: "Vocational",
          title: "Culinary Arts",
          description:
            "Provides hands-on training in food preparation, kitchen safety, and ServSafe certification to prepare participants for employment in the food service industry.",
          abbreviatedDescription:
            "Food preparation, kitchen safety, and ServSafe certification.",
          facilitiesOffered: ["MCI-Norfolk", "Old Colony Correctional Center"],
          eligibilityRequirements: "Must have GED/HSD",
        },
        {
          programId: "MA-0004",
          category: "Cognitive & Behavioral",
          title: "Thinking for a Change",
          description:
            "An integrated, cognitive-behavioral program that includes cognitive restructuring, social skills, and problem-solving to reduce recidivism.",
          abbreviatedDescription:
            "Cognitive restructuring, social skills, and problem-solving.",
          facilitiesOffered: [
            "Souza-Baranowski Correctional Center",
            "MCI-Cedar Junction",
            "MCI-Framingham",
          ],
          eligibilityRequirements: "None",
        },
      ],
    },
    // The ES tab carries the same columns as the English one.
    // MA-0004 is deliberately missing so offline mode exercises the English fallback.
    es: {
      range: "ES!A:H",
      fixtures: [
        {
          programId: "MA-0001",
          category: "Educación",
          title: "Introducción a la plomería",
          description:
            "Introduce a los estudiantes a los conceptos básicos de la plomería, incluyendo el ajuste de tuberías, la soldadura y la instalación de accesorios.",
          abbreviatedDescription:
            "Capacitación práctica en ajuste de tuberías, soldadura e instalación de accesorios.",
          facilitiesOffered: ["MCI-Concord", "MCI-Shirley"],
          eligibilityRequirements: "Debe tener GED/HSD",
        },
        {
          programId: "MA-0002",
          category: "Educación",
          title: "Alfabetización básica",
          description:
            "Se ofrece instrucción de alfabetización a estudiantes cuyo nivel educativo evaluado es inferior al noveno grado.",
          abbreviatedDescription:
            "Instrucción de lectura y escritura para estudiantes por debajo del noveno grado.",
          facilitiesOffered: ["Todas las instalaciones"],
          eligibilityRequirements: "Ninguno",
        },
        {
          programId: "MA-0003",
          category: "Vocacional",
          title: "Artes culinarias",
          description:
            "Ofrece capacitación práctica en preparación de alimentos, seguridad en la cocina y certificación ServSafe para preparar a los participantes para trabajar en la industria de servicios de alimentos.",
          abbreviatedDescription:
            "Preparación de alimentos, seguridad en la cocina y certificación ServSafe.",
          facilitiesOffered: ["MCI-Norfolk", "Centro Penitenciario Old Colony"],
          eligibilityRequirements: "Debe tener GED/HSD",
        },
      ],
    },
  },
};

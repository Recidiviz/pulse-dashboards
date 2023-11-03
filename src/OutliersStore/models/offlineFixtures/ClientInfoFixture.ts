// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { mapValues } from "lodash";

import { ClientInfo, clientInfoSchema, RawClientInfo } from "../ClientInfo";

export const rawClientInfoFixture: Record<string, RawClientInfo> = {
  "707222": {
    clientName: {
      givenNames: "Gary",
      surname: "Alexander",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "205752": {
    clientName: {
      givenNames: "Beau",
      surname: "Riley",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "792381": {
    clientName: {
      givenNames: "Deena",
      surname: "Dunlap",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "869516": {
    clientName: {
      givenNames: "Angelo",
      surname: "Cohen",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "170571": {
    clientName: {
      givenNames: "Ward",
      surname: "Bradley",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "461718": {
    clientName: {
      givenNames: "Janette",
      surname: "Sosa",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "837771": {
    clientName: {
      givenNames: "Nora",
      surname: "Robbins",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "617754": {
    clientName: {
      givenNames: "Jason",
      surname: "Barton",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },

  "985771": {
    clientName: {
      givenNames: "Nicholas",
      surname: "Rhodes",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "326160": {
    clientName: {
      givenNames: "Ethel",
      surname: "Leonard",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "931890": {
    clientName: {
      givenNames: "Ricardo",
      surname: "Wood",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "930441": {
    clientName: {
      givenNames: "Stanley",
      surname: "Maxwell",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "564940": {
    clientName: {
      givenNames: "Miguel",
      surname: "Haynes",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },

  "144925": {
    clientName: {
      givenNames: "Inez",
      surname: "Griffith",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "283496": {
    clientName: {
      givenNames: "Gerald",
      surname: "Barber",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "334531": {
    clientName: {
      givenNames: "Leroy",
      surname: "Stone",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "840134": {
    clientName: {
      givenNames: "Patrick",
      surname: "Schneider",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "968048": {
    clientName: {
      givenNames: "Violet",
      surname: "Johnson",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "413899": {
    clientName: {
      givenNames: "Warren",
      surname: "Franklin",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "415630": {
    clientName: {
      givenNames: "Alta",
      surname: "Jackson",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },

  "235261": {
    clientName: {
      givenNames: "Rosie",
      surname: "Luna",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "531407": {
    clientName: {
      givenNames: "Glenn",
      surname: "Francis",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "436502": {
    clientName: {
      givenNames: "Steve",
      surname: "Schwartz",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "339710": {
    clientName: {
      givenNames: "Bertha",
      surname: "Figueroa",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },

  "803013": {
    clientName: {
      givenNames: "Troy",
      surname: "Rodgers",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "470308": {
    clientName: {
      givenNames: "Leo",
      surname: "Marshall",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "582059": {
    clientName: {
      givenNames: "Shawn",
      surname: "Romero",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "374673": {
    clientName: {
      givenNames: "Jeremiah",
      surname: "Walsh",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "128785": {
    clientName: {
      givenNames: "Dorothy",
      surname: "Luna",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "914408": {
    clientName: {
      givenNames: "Viola",
      surname: "Schultz",
    },
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
  "504894": {
    clientName: {
      givenNames: "Marie",
      surname: "Hudson",
    },
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
    supervisionStart: "2021-01-08",
    officerAssignmentStart: "2021-01-08",
    supervisionType: "PAROLE",
  },
};

export const clientInfoFixture: Record<string, ClientInfo> = mapValues(
  rawClientInfoFixture,
  (c) => clientInfoSchema.parse(c)
);

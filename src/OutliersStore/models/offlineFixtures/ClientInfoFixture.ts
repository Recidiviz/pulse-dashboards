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
    clientId: "707222",
    pseudonymizedClientId: "hashed-707222",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "205752": {
    clientName: {
      givenNames: "Beau",
      surname: "Riley",
    },
    clientId: "205752",
    pseudonymizedClientId: "hashed-205752",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "792381": {
    clientName: {
      givenNames: "Deena",
      surname: "Dunlap",
    },
    clientId: "792381",
    pseudonymizedClientId: "hashed-792381",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "869516": {
    clientName: {
      givenNames: "Angelo",
      surname: "Cohen",
    },
    clientId: "869516",
    pseudonymizedClientId: "hashed-869516",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "170571": {
    clientName: {
      givenNames: "Ward",
      surname: "Bradley",
    },
    clientId: "170571",
    pseudonymizedClientId: "hashed-170571",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "461718": {
    clientName: {
      givenNames: "Janette",
      surname: "Sosa",
    },
    clientId: "461718",
    pseudonymizedClientId: "hashed-461718",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "837771": {
    clientName: {
      givenNames: "Nora",
      surname: "Robbins",
    },
    clientId: "837771",
    pseudonymizedClientId: "hashed-837771",
    gender: null,
    raceOrEthnicity: null,
    birthdate: null,
  },
  "617754": {
    clientName: {
      givenNames: "Jason",
      surname: "Barton",
    },
    clientId: "617754",
    pseudonymizedClientId: "hashed-617754",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "985771": {
    clientName: {
      givenNames: "Nicholas",
      surname: "Rhodes",
    },
    clientId: "985771",
    pseudonymizedClientId: "hashed-985771",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "326160": {
    clientName: {
      givenNames: "Ethel",
      surname: "Leonard",
    },
    clientId: "326160",
    pseudonymizedClientId: "hashed-326160",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "931890": {
    clientName: {
      givenNames: "Ricardo",
      surname: "Wood",
    },
    clientId: "931890",
    pseudonymizedClientId: "hashed-931890",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "930441": {
    clientName: {
      givenNames: "Stanley",
      surname: "Maxwell",
    },
    clientId: "930441",
    pseudonymizedClientId: "hashed-930441",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "564940": {
    clientName: {
      givenNames: "Miguel",
      surname: "Haynes",
    },
    clientId: "564940",
    pseudonymizedClientId: "hashed-564940",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "144925": {
    clientName: {
      givenNames: "Inez",
      surname: "Griffith",
    },
    clientId: "144925",
    pseudonymizedClientId: "hashed-144925",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "283496": {
    clientName: {
      givenNames: "Gerald",
      surname: "Barber",
    },
    clientId: "283496",
    pseudonymizedClientId: "hashed-283496",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "334531": {
    clientName: {
      givenNames: "Leroy",
      surname: "Stone",
    },
    clientId: "334531",
    pseudonymizedClientId: "hashed-334531",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "840134": {
    clientName: {
      givenNames: "Patrick",
      surname: "Schneider",
    },
    clientId: "840134",
    pseudonymizedClientId: "hashed-840134",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "968048": {
    clientName: {
      givenNames: "Violet",
      surname: "Johnson",
    },
    clientId: "968048",
    pseudonymizedClientId: "hashed-968048",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "413899": {
    clientName: {
      givenNames: "Warren",
      surname: "Franklin",
    },
    clientId: "413899",
    pseudonymizedClientId: "hashed-413899",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "415630": {
    clientName: {
      givenNames: "Alta",
      surname: "Jackson",
    },
    clientId: "415630",
    pseudonymizedClientId: "hashed-415630",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "235261": {
    clientName: {
      givenNames: "Rosie",
      surname: "Luna",
    },
    clientId: "235261",
    pseudonymizedClientId: "hashed-235261",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "531407": {
    clientName: {
      givenNames: "Glenn",
      surname: "Francis",
    },
    clientId: "531407",
    pseudonymizedClientId: "hashed-531407",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "436502": {
    clientName: {
      givenNames: "Steve",
      surname: "Schwartz",
    },
    clientId: "436502",
    pseudonymizedClientId: "hashed-436502",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "339710": {
    clientName: {
      givenNames: "Bertha",
      surname: "Figueroa",
    },
    clientId: "339710",
    pseudonymizedClientId: "hashed-339710",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "803013": {
    clientName: {
      givenNames: "Troy",
      surname: "Rodgers",
    },
    clientId: "803013",
    pseudonymizedClientId: "hashed-803013",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "470308": {
    clientName: {
      givenNames: "Leo",
      surname: "Marshall",
    },
    clientId: "470308",
    pseudonymizedClientId: "hashed-470308",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "582059": {
    clientName: {
      givenNames: "Shawn",
      surname: "Romero",
    },
    clientId: "582059",
    pseudonymizedClientId: "hashed-582059",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "374673": {
    clientName: {
      givenNames: "Jeremiah",
      surname: "Walsh",
    },
    clientId: "374673",
    pseudonymizedClientId: "hashed-374673",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "128785": {
    clientName: {
      givenNames: "Dorothy",
      surname: "Luna",
    },
    clientId: "128785",
    pseudonymizedClientId: "hashed-128785",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "914408": {
    clientName: {
      givenNames: "Viola",
      surname: "Schultz",
    },
    clientId: "914408",
    pseudonymizedClientId: "hashed-914408",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "504894": {
    clientName: {
      givenNames: "Marie",
      surname: "Hudson",
    },
    clientId: "504894",
    pseudonymizedClientId: "hashed-504894",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
};

export const clientInfoFixture: Record<string, ClientInfo> = mapValues(
  rawClientInfoFixture,
  (c) => clientInfoSchema.parse(c)
);

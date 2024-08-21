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

import { mapValues } from "lodash";

import { ClientInfo, clientInfoSchema, RawClientInfo } from "../ClientInfo";

export const rawClientInfoFixture: Record<string, RawClientInfo> = {
  "hashed-707222": {
    clientName: {
      givenNames: "Quinn",
      surname: "Adams",
    },
    clientId: "707222",
    pseudonymizedClientId: "hashed-707222",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-205752": {
    clientName: {
      givenNames: "Frank",
      surname: "Roberts",
    },
    clientId: "205752",
    pseudonymizedClientId: "hashed-205752",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-792381": {
    clientName: {
      givenNames: "Jessica",
      surname: "Rivera",
    },
    clientId: "792381",
    pseudonymizedClientId: "hashed-792381",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-869516": {
    clientName: {
      givenNames: "Samuel",
      surname: "Wilson",
    },
    clientId: "869516",
    pseudonymizedClientId: "hashed-869516",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-170571": {
    clientName: {
      givenNames: "Aaron",
      surname: "Adams",
    },
    clientId: "170571",
    pseudonymizedClientId: "hashed-170571",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-461718": {
    clientName: {
      givenNames: "Elizabeth",
      surname: "Ramirez",
    },
    clientId: "461718",
    pseudonymizedClientId: "hashed-461718",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-837771": {
    clientName: {
      givenNames: "Mary",
      surname: "Davis",
    },
    clientId: "837771",
    pseudonymizedClientId: "hashed-837771",
    gender: null,
    raceOrEthnicity: null,
    birthdate: null,
  },
  "hashed-617754": {
    clientName: {
      givenNames: "Kenneth",
      surname: "Green",
    },
    clientId: "617754",
    pseudonymizedClientId: "hashed-617754",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "hashed-985771": {
    clientName: {
      givenNames: "Kevin",
      surname: "Baker",
    },
    clientId: "985771",
    pseudonymizedClientId: "hashed-985771",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-326160": {
    clientName: {
      givenNames: "Ana",
      surname: "Hernandez",
    },
    clientId: "326160",
    pseudonymizedClientId: "hashed-326160",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-931890": {
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
  "hashed-930441": {
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
  "hashed-564940": {
    clientName: {
      givenNames: "Walter",
      surname: "King",
    },
    clientId: "564940",
    pseudonymizedClientId: "hashed-564940",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "hashed-144925": {
    clientName: {
      givenNames: "Rosa",
      surname: "Smith",
    },
    clientId: "144925",
    pseudonymizedClientId: "hashed-144925",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-283496": {
    clientName: {
      givenNames: "Wei",
      surname: "Lee",
    },
    clientId: "283496",
    pseudonymizedClientId: "hashed-283496",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-334531": {
    clientName: {
      givenNames: "Luz",
      surname: "Johnson",
    },
    clientId: "334531",
    pseudonymizedClientId: "hashed-334531",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-840134": {
    clientName: {
      givenNames: "Donald",
      surname: "White",
    },
    clientId: "840134",
    pseudonymizedClientId: "hashed-840134",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-968048": {
    clientName: {
      givenNames: "Casey",
      surname: "Baker",
    },
    clientId: "968048",
    pseudonymizedClientId: "hashed-968048",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-413899": {
    clientName: {
      givenNames: "David",
      surname: "Johnson",
    },
    clientId: "413899",
    pseudonymizedClientId: "hashed-413899",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-415630": {
    clientName: {
      givenNames: "Matthew",
      surname: "Wilson",
    },
    clientId: "415630",
    pseudonymizedClientId: "hashed-415630",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },

  "hashed-235261": {
    clientName: {
      givenNames: "Jacob",
      surname: "Allen",
    },
    clientId: "235261",
    pseudonymizedClientId: "hashed-235261",
    gender: "FEMALE",
    raceOrEthnicity: "NATIVE_HAWAIIAN_PACIFIC_ISLANDER",
    birthdate: "1971-03-15",
  },
  "hashed-531407": {
    clientName: {
      givenNames: "Bryan",
      surname: "Johnson",
    },
    clientId: "531407",
    pseudonymizedClientId: "hashed-531407",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-436502": {
    clientName: {
      givenNames: "Arthur",
      surname: "Gonzalez",
    },
    clientId: "436502",
    pseudonymizedClientId: "hashed-436502",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-339710": {
    clientName: {
      givenNames: "Terry",
      surname: "Clark",
    },
    clientId: "339710",
    pseudonymizedClientId: "hashed-339710",
    gender: "FEMALE",
    raceOrEthnicity: "AMERICAN_INDIAN_ALASKAN_NATIVE",
    birthdate: "1971-03-15",
  },

  "hashed-803013": {
    clientName: {
      givenNames: "Ryan",
      surname: "Lewis",
    },
    clientId: "803013",
    pseudonymizedClientId: "hashed-803013",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-470308": {
    clientName: {
      givenNames: "Casey",
      surname: "Moore",
    },
    clientId: "470308",
    pseudonymizedClientId: "hashed-470308",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-582059": {
    clientName: {
      givenNames: "Michael",
      surname: "Carter",
    },
    clientId: "582059",
    pseudonymizedClientId: "hashed-582059",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-374673": {
    clientName: {
      givenNames: "Nathan",
      surname: "Hill",
    },
    clientId: "374673",
    pseudonymizedClientId: "hashed-374673",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-128785": {
    clientName: {
      givenNames: "Gabriela",
      surname: "Hernandez",
    },
    clientId: "128785",
    pseudonymizedClientId: "hashed-128785",
    gender: "FEMALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-914408": {
    clientName: {
      givenNames: "Alexander",
      surname: "Hill",
    },
    clientId: "914408",
    pseudonymizedClientId: "hashed-914408",
    gender: "MALE",
    raceOrEthnicity: "BLACK",
    birthdate: "1971-03-15",
  },
  "hashed-504894": {
    clientName: {
      givenNames: "Kyle",
      surname: "Wright",
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
  (c) => clientInfoSchema.parse(c),
);

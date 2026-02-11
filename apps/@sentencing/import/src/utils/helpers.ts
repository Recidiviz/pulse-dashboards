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

/**
 * Mapping of Missouri P&P district acronyms to full district names.
 * Source: https://doc.mo.gov/facilities/probation-parole/address-listing
 */
export const MO_DISTRICT_ACRONYM_TO_NAME: Record<string, string> = {
  "1": "District 1 - St. Joseph Community Supervision Center",
  "1S": "District 1S - Maryville",
  "2": "District 2 - Chillicothe",
  "2S": "District 2S - Brookfield",
  "3": "District 3 - Hannibal Community Supervision Center",
  "3S": "District 3S - Kirksville",
  "4": "District 4 - Kansas City",
  "4W": "District 4W - Kansas City",
  "5": "District 5 - Nevada",
  "5S": "District 5S - Belton",
  "6": "District 6 - Columbia",
  "6S": "District 6S - Moberly",
  "7B": "District 7B - St. Louis",
  "8C": "District 8C - St. Louis",
  "8N": "District 8N - St. Louis",
  "8S": "District 8S - St. Louis",
  "9": "District 9 - Joplin",
  "9S": "District 9S - Neosho",
  "10": "District 10 - Springfield",
  "10N": "District 10N - Springfield",
  "10R": "District 10R - Springfield",
  "11": "District 11 - Rolla",
  "11S": "District 11S - Steelville",
  "12": "District 12 - Farmington Community Supervision Center",
  "13": "District 13 - Nixa",
  "13S": "District 13S - West Plains",
  "15": "District 15 - Hillsboro",
  "15S": "District 15S - Potosi",
  "16": "District 16 - Union",
  "17": "District 17 - St. Charles",
  "17S": "District 17S - Troy",
  "19": "District 19 - Liberty",
  "20": "District 20 - Camdenton",
  "20S": "District 20S - Lebanon",
  "21": "District 21 - Branson",
  "21S": "District 21S - Cassville",
  "22": "District 22 - Cape Girardeau",
  "22S": "District 22S - Dexter",
  "23": "District 23 - Kennett Community Supervision Center",
  "23S": "District 23S - Caruthersville",
  "24": "District 24 - Independence",
  "25": "District 25 - Poplar Bluff Community Supervision Center",
  "26": "District 26 - Fulton Community Supervision Center",
  "27": "District 27 - Jefferson City",
  "29": "District 29 - Lexington",
  "29S": "District 29S - Marshall",
  EP: "District EP - St. Louis",
  TCKC: "Transition Center of Kansas City",
  TCSTL: "Transition Center of St. Louis",
};

/**
 * Returns the full Missouri district name for a given acronym.
 * If the acronym is not found in the mapping, returns the input as-is.
 */
export function getMODistrictFullName(acronym: string): string {
  return MO_DISTRICT_ACRONYM_TO_NAME[acronym] ?? acronym;
}

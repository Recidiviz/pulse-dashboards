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

import { CountyDistrictMap } from "./types";

/**
 * Source:
 * Idaho - https://isc.idaho.gov/district-courts
 * North Dakota - https://www.ndcourts.gov/district-court
 */
export const COUNTY_DISTRICT_MAP: CountyDistrictMap = {
  US_ID: {
    Ada: "DISTRICT 4",
    Adams: "DISTRICT 3",
    Bannock: "DISTRICT 6",
    "Bear Lake": "DISTRICT 6",
    Benewah: "DISTRICT 1",
    Bingham: "DISTRICT 7",
    Blaine: "DISTRICT 5",
    Boise: "DISTRICT 4",
    Bonner: "DISTRICT 1",
    Bonneville: "DISTRICT 7",
    Boundary: "DISTRICT 1",
    Butte: "DISTRICT 7",
    Camas: "DISTRICT 5",
    Canyon: "DISTRICT 3",
    Caribou: "DISTRICT 6",
    Cassia: "DISTRICT 5",
    Clark: "DISTRICT 7",
    Clearwater: "DISTRICT 2",
    Custer: "DISTRICT 7",
    Elmore: "DISTRICT 4",
    Franklin: "DISTRICT 6",
    Fremont: "DISTRICT 7",
    Gem: "DISTRICT 3",
    Gooding: "DISTRICT 5",
    Idaho: "DISTRICT 2",
    Jefferson: "DISTRICT 7",
    Jerome: "DISTRICT 5",
    Kootenai: "DISTRICT 1",
    Latah: "DISTRICT 2",
    Lemhi: "DISTRICT 7",
    Lewis: "DISTRICT 2",
    Lincoln: "DISTRICT 5",
    Madison: "DISTRICT 7",
    Minidoka: "DISTRICT 5",
    "Nez Perce": "DISTRICT 2",
    Oneida: "DISTRICT 6",
    Owyhee: "DISTRICT 3",
    Payette: "DISTRICT 3",
    Power: "DISTRICT 6",
    Shoshone: "DISTRICT 1",
    Teton: "DISTRICT 7",
    "Twin Falls": "DISTRICT 8",
    Valley: "DISTRICT 4",
    Washington: "DISTRICT 3",
  },
  US_ND: {
    Adams: "Southwest",
    Barnes: "Southeast",
    Benson: "Northeast",
    Billings: "Southwest",
    Bottineau: "Northeast",
    Bowman: "Southwest",
    Burke: "North Central",
    Burleigh: "South Central",
    Cass: "East Central",
    Cavalier: "Northeast",
    Dickey: "Southeast",
    Divide: "Northwest",
    Dunn: "Southwest",
    Eddy: "Southeast",
    Emmons: "South Central",
    Foster: "Southeast",
    "Golden Valley": "Southwest",
    "Grand Forks": "Northeast Central",
    Grant: "South Central",
    Griggs: "Southeast",
    Hettinger: "Southwest",
    Kidder: "Southeast",
    LaMoure: "Southeast",
    Logan: "Southeast",
    McHenry: "Northeast",
    McIntosh: "Southeast",
    McKenzie: "Northwest",
    McLean: "South Central",
    Mercer: "South Central",
    Morton: "South Central",
    Mountrail: "North Central",
    Nelson: "Northeast Central",
    Oliver: "South Central",
    Pembina: "Northeast",
    Pierce: "Northeast",
    Ramsey: "Northeast",
    Ransom: "Southeast",
    Renville: "Northeast",
    Richland: "Southeast",
    Rolette: "Northeast",
    Sargent: "Southeast",
    Sheridan: "South Central",
    Sioux: "South Central",
    Slope: "Southwest",
    Stark: "Southwest",
    Steele: "East Central",
    Stutsman: "Southeast",
    Towner: "Northeast",
    Traill: "East Central",
    Walsh: "Northeast",
    Ward: "North Central",
    Wells: "Southeast",
    Williams: "Northwest",
  },
};

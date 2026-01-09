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

// Mapping of state codes to human-readable labels
export const STATE_CODE_LABELS: Record<string, string> = {
  US_AK: "Alaska",
  US_AL: "Alabama",
  US_AR: "Arkansas",
  US_AZ: "Arizona",
  US_CA: "California",
  US_CO: "Colorado",
  US_CT: "Connecticut",
  US_DC: "District of Columbia",
  US_DE: "Delaware",
  US_FL: "Florida",
  US_GA: "Georgia",
  US_HI: "Hawaii",
  US_IA: "Iowa",
  US_ID: "Idaho",
  US_IL: "Illinois",
  US_IN: "Indiana",
  US_IX: "Idaho", // Alternative code
  US_KS: "Kansas",
  US_KY: "Kentucky",
  US_LA: "Louisiana",
  US_MA: "Massachusetts",
  US_MD: "Maryland",
  US_ME: "Maine",
  US_MI: "Michigan",
  US_MN: "Minnesota",
  US_MO: "Missouri",
  US_MS: "Mississippi",
  US_MT: "Montana",
  US_NC: "North Carolina",
  US_ND: "North Dakota",
  US_NE: "Nebraska",
  US_NH: "New Hampshire",
  US_NJ: "New Jersey",
  US_NM: "New Mexico",
  US_NV: "Nevada",
  US_NY: "New York",
  US_OH: "Ohio",
  US_OK: "Oklahoma",
  US_OR: "Oregon",
  US_PA: "Pennsylvania",
  US_RI: "Rhode Island",
  US_SC: "South Carolina",
  US_SD: "South Dakota",
  US_TN: "Tennessee",
  US_TX: "Texas",
  US_UT: "Utah",
  US_VA: "Virginia",
  US_VT: "Vermont",
  US_WA: "Washington",
  US_WI: "Wisconsin",
  US_WV: "West Virginia",
  US_WY: "Wyoming",
};

/**
 * Convert a state code to a human-readable label
 * @param stateCode - State code (e.g., "US_ID", "US_UT")
 * @returns Human-readable label (e.g., "Idaho", "Utah")
 */
export function getStateLabel(stateCode: string): string {
  return STATE_CODE_LABELS[stateCode] || stateCode.replace("US_", "");
}

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

export interface USState {
  code: string;
  name: string;
}

export const US_STATES: USState[] = [
  { code: "US_AL", name: "Alabama" },
  { code: "US_AK", name: "Alaska" },
  { code: "US_AZ", name: "Arizona" },
  { code: "US_AR", name: "Arkansas" },
  { code: "US_CA", name: "California" },
  { code: "US_CO", name: "Colorado" },
  { code: "US_CT", name: "Connecticut" },
  { code: "US_DE", name: "Delaware" },
  { code: "US_FL", name: "Florida" },
  { code: "US_GA", name: "Georgia" },
  { code: "US_HI", name: "Hawaii" },
  { code: "US_ID", name: "Idaho" },
  { code: "US_IL", name: "Illinois" },
  { code: "US_IN", name: "Indiana" },
  { code: "US_IA", name: "Iowa" },
  { code: "US_KS", name: "Kansas" },
  { code: "US_KY", name: "Kentucky" },
  { code: "US_LA", name: "Louisiana" },
  { code: "US_ME", name: "Maine" },
  { code: "US_MD", name: "Maryland" },
  { code: "US_MA", name: "Massachusetts" },
  { code: "US_MI", name: "Michigan" },
  { code: "US_MN", name: "Minnesota" },
  { code: "US_MS", name: "Mississippi" },
  { code: "US_MO", name: "Missouri" },
  { code: "US_MT", name: "Montana" },
  { code: "US_NE", name: "Nebraska" },
  { code: "US_NV", name: "Nevada" },
  { code: "US_NH", name: "New Hampshire" },
  { code: "US_NJ", name: "New Jersey" },
  { code: "US_NM", name: "New Mexico" },
  { code: "US_NY", name: "New York" },
  { code: "US_NC", name: "North Carolina" },
  { code: "US_ND", name: "North Dakota" },
  { code: "US_OH", name: "Ohio" },
  { code: "US_OK", name: "Oklahoma" },
  { code: "US_OR", name: "Oregon" },
  { code: "US_PA", name: "Pennsylvania" },
  { code: "US_RI", name: "Rhode Island" },
  { code: "US_SC", name: "South Carolina" },
  { code: "US_SD", name: "South Dakota" },
  { code: "US_TN", name: "Tennessee" },
  { code: "US_TX", name: "Texas" },
  { code: "US_UT", name: "Utah" },
  { code: "US_VT", name: "Vermont" },
  { code: "US_VA", name: "Virginia" },
  { code: "US_WA", name: "Washington" },
  { code: "US_WV", name: "West Virginia" },
  { code: "US_WI", name: "Wisconsin" },
  { code: "US_WY", name: "Wyoming" },
];

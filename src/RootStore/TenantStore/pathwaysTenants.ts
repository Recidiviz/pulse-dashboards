// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

export const US_CO = "US_CO";
export const US_ID = "US_ID";
export const US_ME = "US_ME";
export const US_MI = "US_MI";
export const US_MO = "US_MO";
export const US_NC = "US_NC";
export const US_ND = "US_ND";
export const US_TN = "US_TN";
// Hack alert - US_PA is not yet a Pathways tenant - but adding it here to enable US_MO (the other LANTERN tenant) access to Pathways.
// The navigation set up in tenants.ts only allows US_PA access to /revocations,
// but adding it as a Pathways tenant allows LANTERN tenants to use the Pathways allowed navigation logic, thus enabling Pathways for US_MO.
export const US_PA = "US_PA";
export const US_DEMO = "US_DEMO";

export const PATHWAYS_TENANTS = [
  // NOTE: the first state in this list is where Recidiviz users will default to
  US_TN,
  US_CO,
  US_ID,
  US_ME,
  US_MI,
  US_MO,
  US_NC,
  US_ND,
  US_PA,
];

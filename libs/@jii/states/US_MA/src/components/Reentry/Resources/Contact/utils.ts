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

import { UsMaTFunction } from "~@jii/translation";

import { ResourceDetail } from "../types";

export type ContactRow = {
  key: string;
  label: string;
  value: string;
};

/**
 * Assumes each MA resource has at most one address, so it shows only the
 * first. NYC's buildContactInformation groups phones and websites under each
 * of several addresses; MA would need something similar if resources start
 * listing more than one.
 */
export function buildContactInformation(
  { addresses, county }: Pick<ResourceDetail, "addresses" | "county">,
  t: UsMaTFunction,
): ContactRow[] {
  const notAvailable = t(
    ($) => $.reentry.resources.detail.contact.notAvailable,
  );

  return [
    {
      key: "address",
      label: t(($) => $.reentry.resources.detail.contact.labels.address),
      value: addresses[0]?.address ?? notAvailable,
    },
    {
      key: "county",
      label: t(($) => $.reentry.resources.detail.contact.labels.county),
      value: county ?? notAvailable,
    },
  ];
}

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

import { FC } from "react";

import type { LocationEntry } from "../../hooks/types";
import {
  ContactRowList,
  LocationGroupWrapper,
  LocationLabel,
} from "./ContactInformation.styles";
import { ContactRow } from "./ContactRow";

type LocationGroupProps = {
  location: LocationEntry;
};

/**
 * Renders once per address inside a list (see LocationGroupsSection) - as opposed to
 * GeneralContactSection, which renders once for standalone rows not tied to any address.
 * `label` is optional since a single, unlabeled location doesn't need one to be
 * distinguishable from its siblings.
 */
export const LocationGroup: FC<LocationGroupProps> = ({
  location: { id, label, rows },
}) => {
  const labelId = label ? `location-label-${id}` : undefined;

  return (
    <LocationGroupWrapper aria-labelledby={labelId}>
      {label && <LocationLabel id={labelId}>{label}</LocationLabel>}
      <ContactRowList>
        {rows.map((row) => (
          <ContactRow key={row.key} label={row.label} value={row.value} />
        ))}
      </ContactRowList>
    </LocationGroupWrapper>
  );
};

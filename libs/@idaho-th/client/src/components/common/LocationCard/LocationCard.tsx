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

import React, { useEffect, useState } from "react";

import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";
import { USER_ROLE, type UserRole } from "~@idaho-th/shared";

import CheckOutlineIcon from "../../assets/check-outline.svg?react";
import PencilIcon from "../../assets/pencil.svg?react";
import XIcon from "../../assets/x.svg?react";
import { GhostIconButton } from "../buttons";
import { SearchableSelect, type SelectOption, TextInput } from "../inputs";
import {
  ACCEPTED_GENDER_SELECT_OPTIONS,
  DISTRICT_SELECT_OPTIONS,
  YES_NO_SELECT_OPTIONS,
} from "./locationCard.constants";
import * as Styled from "./LocationCard.styles";
import {
  diffLocationFormValues,
  formatPopulation,
  formatYesNo,
  LocationFormErrors,
  LocationFormPatch,
  LocationFormValues,
  toLocationFormValues,
  validateLocationPatch,
} from "./locationCard.utils";

export interface LocationCardProps {
  location: HousingProviderLocation;
  viewerRole: UserRole;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  /** Receives only the fields that actually changed; never called when none did. */
  onSave?: (values: LocationFormPatch) => void;
  isSaving?: boolean;
}

const yesNoValue = (value: boolean) => (value ? "true" : "false");

type BooleanField = {
  [K in keyof LocationFormValues]: LocationFormValues[K] extends boolean
    ? K
    : never;
}[keyof LocationFormValues];

/** One row of the card body, rendered as text in read mode and as a select in edit mode. */
interface LocationRow {
  label: string;
  display: (location: HousingProviderLocation) => string;
  positive: (location: HousingProviderLocation) => boolean;
  options: SelectOption[];
  draftValue: (draft: LocationFormValues) => string;
  patch: (value: string) => LocationFormPatch;
}

const booleanRow = (label: string, field: BooleanField): LocationRow => ({
  label,
  display: (location) => formatYesNo(location[field]),
  positive: (location) => location[field],
  options: YES_NO_SELECT_OPTIONS,
  draftValue: (draft) => yesNoValue(draft[field]),
  patch: (value) => ({ [field]: value === "true" }),
});

const LOCATION_ROWS: LocationRow[] = [
  {
    label: "District",
    display: (location) => location.district,
    positive: () => true,
    options: DISTRICT_SELECT_OPTIONS,
    draftValue: (draft) => draft.district,
    patch: (value) => ({ district: value as LocationFormValues["district"] }),
  },
  {
    label: "Population",
    display: (location) => formatPopulation(location.acceptedGenders),
    positive: () => true,
    options: ACCEPTED_GENDER_SELECT_OPTIONS,
    draftValue: (draft) => draft.acceptedGender,
    patch: (value) => ({
      acceptedGender: value as LocationFormValues["acceptedGender"],
    }),
  },
  booleanRow("Accepts Riders", "acceptsRiders"),
  booleanRow("Accepts Violent Criminals", "acceptsViolentCriminals"),
  booleanRow("Accepts Sex Offenders", "acceptsSexOffenders"),
  booleanRow("Faith-based", "faithBased"),
];

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  viewerRole,
  isEditing = false,
  onStartEdit,
  onCancelEdit,
  onSave,
  isSaving = false,
}) => {
  const [draft, setDraft] = useState<LocationFormValues>(() =>
    toLocationFormValues(location),
  );
  const [errors, setErrors] = useState<LocationFormErrors>({});

  // `isEditing` going false covers cancel, save, and another card taking the
  // shared edit slot — one place to discard a draft.
  useEffect(() => {
    if (!isEditing) {
      setDraft(toLocationFormValues(location));
      setErrors({});
    }
  }, [isEditing, location]);

  const canEdit = viewerRole === USER_ROLE.PROVIDER;

  const handleCancel = () => {
    setDraft(toLocationFormValues(location));
    setErrors({});
    onCancelEdit?.();
  };

  const handleSave = () => {
    const changed = diffLocationFormValues(
      toLocationFormValues(location),
      draft,
    );
    if (Object.keys(changed).length === 0) {
      handleCancel();
      return;
    }

    // Validate before onSave: the card closes optimistically, so a later
    // rejection would discard the draft.
    const validationErrors = validateLocationPatch(changed);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSave?.(changed);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      // Buttons fire their own click on Enter, and an open select menu
      // preventDefaults to pick the focused option.
      if (isSaving || event.defaultPrevented) return;
      if ((event.target as HTMLElement).closest("button")) return;
      handleSave();
      return;
    }

    if (event.key !== "Escape") return;
    // Stops the settings modal's own Escape-to-close from also firing.
    event.stopPropagation();
    handleCancel();
  };

  if (canEdit && isEditing) {
    return (
      <Styled.Card onKeyDown={handleKeyDown}>
        <Styled.Head $alignTop>
          <Styled.EditFields>
            <TextInput
              aria-label="Street address"
              value={draft.streetAddress}
              onChange={(value) =>
                setDraft((prev) => ({ ...prev, streetAddress: value }))
              }
              disabled={isSaving}
              placeholder="Street address"
              hasError={!!errors.streetAddress}
              errorText={errors.streetAddress}
            />
            <Styled.EditFieldRow>
              <Styled.EditField>
                <TextInput
                  aria-label="City"
                  value={draft.city}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, city: value }))
                  }
                  disabled={isSaving}
                  placeholder="City"
                  hasError={!!errors.city}
                  errorText={errors.city}
                />
              </Styled.EditField>
              <Styled.EditField>
                <TextInput
                  aria-label="ZIP"
                  value={draft.zip}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, zip: value }))
                  }
                  disabled={isSaving}
                  placeholder="ZIP"
                  hasError={!!errors.zip}
                  errorText={errors.zip}
                />
              </Styled.EditField>
            </Styled.EditFieldRow>
          </Styled.EditFields>
          <Styled.HeaderControls>
            <GhostIconButton
              aria-label="Save location"
              onClick={handleSave}
              disabled={isSaving}
            >
              <CheckOutlineIcon />
            </GhostIconButton>
            <GhostIconButton
              aria-label="Cancel editing location"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <XIcon />
            </GhostIconButton>
          </Styled.HeaderControls>
        </Styled.Head>
        <Styled.Body>
          {LOCATION_ROWS.map(({ label, options, draftValue, patch }) => (
            <Styled.Row key={label}>
              <Styled.RowLabel>{label}</Styled.RowLabel>
              <Styled.RowValueField>
                <SearchableSelect
                  aria-label={label}
                  value={draftValue(draft)}
                  options={options}
                  onChange={(value) =>
                    setDraft((prev) => ({ ...prev, ...patch(value) }))
                  }
                  isSearchable={false}
                  disabled={isSaving}
                  height="36px"
                />
              </Styled.RowValueField>
            </Styled.Row>
          ))}
        </Styled.Body>
      </Styled.Card>
    );
  }

  const { streetAddress = "", city = "", state = "", zip = "" } = location;

  const address = (
    <>
      <Styled.StreetAddress>{streetAddress}</Styled.StreetAddress>
      <Styled.CityStateZip>{`${city}, ${state} ${zip}`}</Styled.CityStateZip>
    </>
  );

  return (
    <Styled.Card>
      {canEdit && (
        <Styled.Head $alignTop>
          <Styled.AddressStack>{address}</Styled.AddressStack>
          <GhostIconButton
            aria-label="Edit location"
            onClick={() => onStartEdit?.()}
          >
            <PencilIcon />
          </GhostIconButton>
        </Styled.Head>
      )}
      <Styled.Body>
        {LOCATION_ROWS.map(({ label, display, positive }) => (
          <Styled.Row key={label}>
            <Styled.RowLabel>{label}</Styled.RowLabel>
            <Styled.RowValue $positive={positive(location)}>
              {display(location)}
            </Styled.RowValue>
          </Styled.Row>
        ))}
      </Styled.Body>
    </Styled.Card>
  );
};

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

import type { HousingProviderLocation } from "~@idaho-th/client/interfaces/common";
import {
  ACCEPTED_GENDER,
  AcceptedGender,
  DISTRICT_OPTIONS,
  ProviderLocationAddress,
  providerLocationAddressSchema,
} from "~@idaho-th/shared";

type District = (typeof DISTRICT_OPTIONS)[number];

const GENDER_LABELS: Record<AcceptedGender, string> = {
  MALE: "Men",
  FEMALE: "Women",
  ALL: "All",
};

export const formatPopulation = (genders: AcceptedGender[]): string => {
  if (genders.length === 0) return "—";
  if (genders.includes("ALL")) return "All";
  return genders.length === 1
    ? `${GENDER_LABELS[genders[0]]} only`
    : genders.map((gender) => GENDER_LABELS[gender]).join(" and ");
};

export const formatYesNo = (value: boolean): string => (value ? "Yes" : "No");

// Real rows hold one gender; a legacy MALE+FEMALE row collapses to ALL, which
// the eligibility filter already treats as satisfying both.
export const toAcceptedGenderChoice = (
  genders: AcceptedGender[],
): AcceptedGender => (genders.length === 1 ? genders[0] : ACCEPTED_GENDER.ALL);

export interface LocationFormValues {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  district: District;
  acceptedGender: AcceptedGender;
  acceptsRiders: boolean;
  acceptsSexOffenders: boolean;
  acceptsViolentCriminals: boolean;
  faithBased: boolean;
}

/** The subset of a card's fields that a save actually needs to write. */
export type LocationFormPatch = Partial<LocationFormValues>;

export const diffLocationFormValues = (
  original: LocationFormValues,
  draft: LocationFormValues,
): LocationFormPatch =>
  Object.fromEntries(
    Object.entries(draft).filter(
      ([field, value]) => original[field as keyof LocationFormValues] !== value,
    ),
  );

export type LocationFormErrors = Partial<
  Record<keyof ProviderLocationAddress, string>
>;

// Validates only the fields a save sends, so an untouched legacy value never
// blocks a save.
export const validateLocationPatch = (
  patch: LocationFormPatch,
): LocationFormErrors => {
  const result = providerLocationAddressSchema.partial().safeParse(patch);
  if (result.success) return {};

  const { fieldErrors } = result.error.flatten();
  return {
    streetAddress: fieldErrors.streetAddress?.[0],
    city: fieldErrors.city?.[0],
    state: fieldErrors.state?.[0],
    zip: fieldErrors.zip?.[0],
  };
};

export const toLocationFormValues = (
  location: HousingProviderLocation,
): LocationFormValues => ({
  // The card is always given a full row; the address columns are optional on
  // the entity only because the provider search projects them away.
  streetAddress: location.streetAddress ?? "",
  city: location.city ?? "",
  state: location.state ?? "",
  zip: location.zip ?? "",
  // DB column is a plain string; the dropdown only offers DISTRICT_OPTIONS.
  district: location.district as District,
  acceptedGender: toAcceptedGenderChoice(location.acceptedGenders),
  acceptsRiders: location.acceptsRiders,
  acceptsSexOffenders: location.acceptsSexOffenders,
  acceptsViolentCriminals: location.acceptsViolentCriminals,
  faithBased: location.faithBased,
});

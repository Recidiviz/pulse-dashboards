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

import { DEFAULT_HOUSING_APPLICATION_FORM_VALUES } from "~@idaho-th/shared/fixtures/housingApplication";

import { housingApplicationFormSchema } from "../housingApplication.form.schema";

// Shape-level validation for formData.preferredProviders. Rejecting an id
// with no matching provider is the PreferredHousingProvider foreign key's job,
// covered by the save-path service tests — this file only covers what Zod can
// decide on its own: shape, count, duplicates, and stripping empty slots.
function withPreferredProviders(preferredProviders: unknown) {
  return {
    ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
    preferredProviders,
  };
}

describe("housingApplicationFormSchema — preferredProviders", () => {
  it("accepts an empty array", () => {
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders([]),
    );
    expect(result.success).toBe(true);
    expect(result.success && result.data.preferredProviders).toEqual([]);
  });

  it("accepts up to 3 unique provider UUIDs unchanged", () => {
    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
    ];
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders(ids),
    );
    expect(result.success).toBe(true);
    expect(result.success && result.data.preferredProviders).toEqual(ids);
  });

  it("strips empty and whitespace-only slots before validating, rather than storing them", () => {
    const realId = "11111111-1111-4111-8111-111111111111";
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders([realId, "", "   "]),
    );
    expect(result.success).toBe(true);
    expect(result.success && result.data.preferredProviders).toEqual([realId]);
  });

  it("rejects a non-UUID string", () => {
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders(["not-a-real-provider-id"]),
    );
    expect(result.success).toBe(false);
  });

  it("rejects duplicate ids", () => {
    const realId = "11111111-1111-4111-8111-111111111111";
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders([realId, realId]),
    );
    expect(result.success).toBe(false);
  });

  it("rejects more than 3 ids", () => {
    const ids = [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
      "33333333-3333-4333-8333-333333333333",
      "44444444-4444-4444-8444-444444444444",
    ];
    const result = housingApplicationFormSchema.safeParse(
      withPreferredProviders(ids),
    );
    expect(result.success).toBe(false);
  });
});

describe("housingApplicationFormSchema — None option", () => {
  it("drops None when it is sent alongside other options", () => {
    const result = housingApplicationFormSchema.safeParse({
      ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
      childFamilyServicesDocumentation: ["None", "Supervision Order"],
    });
    expect(result.success).toBe(true);
    expect(
      result.success && result.data.childFamilyServicesDocumentation,
    ).toEqual(["Supervision Order"]);
  });

  it("drops None when it is sent after other options", () => {
    const result = housingApplicationFormSchema.safeParse({
      ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
      childFamilyServicesDocumentation: ["Supervision Order", "None"],
    });
    expect(
      result.success && result.data.childFamilyServicesDocumentation,
    ).toEqual(["Supervision Order"]);
  });

  it("defaults to an empty selection when the field is omitted", () => {
    const valuesWithoutField: Partial<
      typeof DEFAULT_HOUSING_APPLICATION_FORM_VALUES
    > = { ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES };
    delete valuesWithoutField.childFamilyServicesDocumentation;
    const result = housingApplicationFormSchema.safeParse(valuesWithoutField);
    expect(
      result.success && result.data.childFamilyServicesDocumentation,
    ).toEqual([]);
  });

  it("keeps None when it is the only selection", () => {
    const result = housingApplicationFormSchema.safeParse({
      ...DEFAULT_HOUSING_APPLICATION_FORM_VALUES,
      childFamilyServicesDocumentation: ["None"],
    });
    expect(result.success).toBe(true);
    expect(
      result.success && result.data.childFamilyServicesDocumentation,
    ).toEqual(["None"]);
  });
});

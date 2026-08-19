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

import startCase from "lodash-es/startCase";
import { z } from "zod";

import { nullishAsUndefined } from "~datatypes";
import { camelCaseObject } from "~utils";

const organizationBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: nullishAsUndefined(z.string()),
  attributes: z.object({
    categorizations: z.array(
      z.object({
        section: z.string(),
        subsection: z.string(),
      }),
    ),
    tags: z.array(z.string()),
  }),
  primaryContactMethod: nullishAsUndefined(z.string()),
  primaryContactValue: nullishAsUndefined(z.string()),
});

const organizationDetailBaseSchema = organizationBaseSchema.extend({
  addresses: z.array(
    z.object({
      id: z.number(),
      address: z.string(),
      googlePlaceId: nullishAsUndefined(z.string()),
      label: nullishAsUndefined(z.string()),
      isMailingOnly: z.boolean(),
    }),
  ),
  phoneNumbers: z.array(
    z.object({
      id: z.number(),
      phoneNumber: z.string(),
      label: nullishAsUndefined(z.string()),
      addressId: nullishAsUndefined(z.number()),
    }),
  ),
  websites: z.array(
    z.object({
      id: z.number(),
      url: z.string(),
      addressId: nullishAsUndefined(z.number()),
    }),
  ),
});

function sanitizeString(s: string): string {
  // U+FFFC (Object Replacement Character) appears in raw API subcategory values
  return s.replace(/￼/g, "").trim();
}

function organizationTransform<
  T extends z.infer<typeof organizationBaseSchema>,
>({ id, attributes: { categorizations, tags }, ...rest }: T) {
  return {
    organizationId: id,
    ...rest,
    categories: categorizations.map(({ section, subsection }) => ({
      category: sanitizeString(section),
      subcategory: sanitizeString(subsection),
    })),
    tags: tags
      .map((tag) => (tag === tag.toUpperCase() ? tag : startCase(tag)))
      .sort((a, b) => a.localeCompare(b)),
  };
}

// Each exported schema runs two steps:
// 1. preprocess: camelCaseObject converts snake_case API fields before validation.
// 2. transform: semantic renames are applied after validation on the typed output.
export const organizationApiSchema = z.preprocess(
  (val) => camelCaseObject(z.object({}).passthrough().parse(val)),
  organizationBaseSchema.transform(organizationTransform),
);

export const organizationDetailApiSchema = z.preprocess(
  (val) => camelCaseObject(z.object({}).passthrough().parse(val)),
  organizationDetailBaseSchema.transform(organizationTransform),
);

export type OrganizationSummary = z.infer<typeof organizationApiSchema>;
export type OrganizationDetail = z.infer<typeof organizationDetailApiSchema>;
export type OrganizationAddress = OrganizationDetail["addresses"][number];
export type OrganizationPhoneNumber =
  OrganizationDetail["phoneNumbers"][number];
export type OrganizationWebsite = OrganizationDetail["websites"][number];

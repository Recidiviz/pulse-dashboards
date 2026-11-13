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

import type {
  ParoleBoardReport,
  ParoleBoardReportSectionKey,
} from "~datatypes";

/** Locates one PHI report: the resident's record id, and the report's id. */
export type ParoleBoardReportRef = { recordId: string; reportId: string };

/**
 * The row a PHI edit applies to. Every edit writes source and atlasLabel
 * along with the value, so the row can still be named after it drops out of
 * Atlas.
 */
export type ParoleBoardReportRow = {
  // The row's Atlas id, or a generated id for a row the PHI added.
  id: string;
  source: "ATLAS" | "PHI";
  atlasLabel?: string;
};

type SectionInput<Section extends ParoleBoardReportSectionKey> = NonNullable<
  ParoleBoardReport["sections"][Section]
>;

type SectionFields<Section extends ParoleBoardReportSectionKey> = NonNullable<
  SectionInput<Section>["fields"]
>;

/** One row's saved input in a section, as the report schema parses it. */
export type ParoleBoardReportRowEntry<
  Section extends ParoleBoardReportSectionKey,
> = NonNullable<SectionInput<Section>["rows"]>[string];

type RowFields<Section extends ParoleBoardReportSectionKey> = NonNullable<
  ParoleBoardReportRowEntry<Section>["fields"]
>;

export type ParoleBoardReportFieldName<
  Section extends ParoleBoardReportSectionKey,
> = keyof SectionFields<Section> & string;

export type ParoleBoardReportFieldValue<
  Section extends ParoleBoardReportSectionKey,
  Field extends ParoleBoardReportFieldName<Section>,
> =
  NonNullable<SectionFields<Section>[Field]> extends { value: infer Value }
    ? Value
    : never;

export type ParoleBoardReportRowFieldName<
  Section extends ParoleBoardReportSectionKey,
> = keyof RowFields<Section> & string;

export type ParoleBoardReportRowFieldValue<
  Section extends ParoleBoardReportSectionKey,
  Field extends ParoleBoardReportRowFieldName<Section>,
> =
  NonNullable<RowFields<Section>[Field]> extends { value: infer Value }
    ? Value
    : never;

/**
 * Values for some of a row's fields, keyed by field name, with null for a
 * field the PHI cleared.
 */
export type ParoleBoardReportRowValues<
  Section extends ParoleBoardReportSectionKey,
> = {
  [Field in ParoleBoardReportRowFieldName<Section>]?: ParoleBoardReportRowFieldValue<
    Section,
    Field
  >;
};

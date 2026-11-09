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

/**
 * A timestamp as it reads off a report document: a Firestore Timestamp, or a
 * Date in tests and offline fixtures.
 */
type ReportTimestamp = Date | { toDate(): Date };

type PhiValueInput<Value> = {
  value: Value | null;
  updatedBy: string;
  updatedAt: ReportTimestamp;
};

type RowEntryInput<RowFields> = {
  source: "ATLAS" | "PHI";
  atlasLabel?: string;
  removed?: unknown;
  fields?: { [Name in keyof RowFields]?: PhiValueInput<RowFields[Name]> };
};

/**
 * The PHI's input for one section of a report, in the shape
 * paroleBoardReportSchema parses it to. A parsed section such as
 * OffenseInformationInput fits this type.
 */
export type SectionInput<SectionFields, RowFields> = {
  fields?: {
    [Name in keyof SectionFields]?: PhiValueInput<SectionFields[Name]>;
  };
  rows?: Record<string, RowEntryInput<RowFields>>;
};

type FieldConfig<Atlas, Value> = {
  // Reads the field's current value from Atlas. Omit it for a field Atlas
  // doesn't have.
  fromAtlas?: (atlas: Atlas) => Value | null | undefined;
};

type AtlasRowsConfig<AtlasSection, AtlasRow> = {
  fromAtlas: (atlas: AtlasSection) => AtlasRow[];
  // The row's Atlas id, which keys the PHI's input for it.
  id: (row: AtlasRow) => string;
  // Names the row. Writers save it as atlasLabel with the row's first edit,
  // so the row can still be named after it drops out of Atlas.
  label: (row: AtlasRow) => string;
};

// A section whose rows all come from the PHI, such as Past Actions, reads no
// rows from Atlas.
type NoAtlasRows = { fromAtlas?: never; id?: never; label?: never };

/**
 * How one section's Atlas data and PHI input fit together. List every field
 * the section shows, including ones the PHI can't edit yet, because a
 * submitted report freezes the resolved section.
 */
export type SectionConfig<AtlasSection, AtlasRow, SectionFields, RowFields> = {
  fields: {
    [Name in keyof SectionFields]: FieldConfig<
      AtlasSection,
      SectionFields[Name]
    >;
  };
  rows?: (AtlasRowsConfig<AtlasSection, AtlasRow> | NoAtlasRows) & {
    fields: {
      [Name in keyof RowFields]: FieldConfig<AtlasRow, RowFields[Name]>;
    };
    // Orders the resolved rows, as a sort comparator. Rows it ranks equal
    // keep the order resolveSection gives them without one.
    compare?: (a: ResolvedRow<RowFields>, b: ResolvedRow<RowFields>) => number;
  };
};

export type ResolvedField<Value> = {
  // The PHI's value if they entered one, including null for a field they
  // cleared, and otherwise the current Atlas value.
  value: Value | null;
  source: "ATLAS" | "PHI";
  // The current Atlas value, which the Edited tooltip shows beside a PHI value.
  atlasValue: Value | null;
  editedBy: string | null;
  editedAt: Date | null;
};

export type ResolvedRowStatus =
  | "IN_ATLAS"
  | "NO_LONGER_IN_ATLAS"
  | "ADDED_BY_PHI";

export type ResolvedRow<RowFields> = {
  id: string;
  status: ResolvedRowStatus;
  // The current Atlas label, the saved atlasLabel for a row no longer in
  // Atlas, or null for a row the PHI added.
  label: string | null;
  fields: { [Name in keyof RowFields]: ResolvedField<RowFields[Name]> };
};

export type ResolvedSection<SectionFields, RowFields> = {
  fields: {
    [Name in keyof SectionFields]: ResolvedField<SectionFields[Name]>;
  };
  rows: Array<ResolvedRow<RowFields>>;
};

type FieldConfigs<Atlas, Fields> = {
  [Name in keyof Fields]: FieldConfig<Atlas, Fields[Name]>;
};

type FieldEntries<Fields> = {
  [Name in keyof Fields]?: PhiValueInput<Fields[Name]>;
};

function toDate(timestamp: ReportTimestamp): Date {
  return timestamp instanceof Date ? timestamp : timestamp.toDate();
}

function resolveField<Atlas, Value>(
  config: FieldConfig<Atlas, Value>,
  atlas: Atlas | undefined,
  entry: PhiValueInput<Value> | undefined,
): ResolvedField<Value> {
  const atlasValue =
    atlas === undefined ? null : config.fromAtlas?.(atlas) ?? null;
  if (!entry) {
    return {
      value: atlasValue,
      source: "ATLAS",
      atlasValue,
      editedBy: null,
      editedAt: null,
    };
  }
  return {
    value: entry.value,
    source: "PHI",
    atlasValue,
    editedBy: entry.updatedBy,
    editedAt: toDate(entry.updatedAt),
  };
}

function resolveFields<Atlas, Fields>(
  configs: FieldConfigs<Atlas, Fields>,
  atlas: Atlas | undefined,
  entries: FieldEntries<Fields> | undefined,
): { [Name in keyof Fields]: ResolvedField<Fields[Name]> } {
  const names = Object.keys(configs) as Array<keyof Fields>;
  return Object.fromEntries(
    names.map((name) => [
      name,
      resolveField(configs[name], atlas, entries?.[name]),
    ]),
  ) as { [Name in keyof Fields]: ResolvedField<Fields[Name]> };
}

function hasAnyValue<Atlas, RowFields>(
  configs: FieldConfigs<Atlas, RowFields>,
  entry: RowEntryInput<RowFields>,
): boolean {
  const names = Object.keys(configs) as Array<keyof RowFields>;
  return names.some((name) => entry.fields?.[name] !== undefined);
}

/**
 * Combines a section's Atlas data with the PHI's input into what the report
 * shows. The PHI's input wins wherever it exists, even after Atlas changes.
 *
 * For example, suppose Atlas sends two offenses, the PHI corrected one of
 * their sentencing dates, and the PHI also edited a third offense that has
 * since dropped out of Atlas (other fields left out):
 *
 *   Atlas rows:  1001 "Robbery"   sentencing date 2025-08-12
 *                1002 "Escape"    sentencing date 2025-12-03
 *   PHI input:   1001             sentencingDate 2025-08-15
 *                0998             sentencingDate 2024-02-01, atlasLabel "Burglary"
 *
 * The section resolves to these rows:
 *
 *   id    status              label     sentencingDate  source  atlasValue
 *   1001  IN_ATLAS            Robbery   2025-08-15      PHI     2025-08-12
 *   1002  IN_ATLAS            Escape    2025-12-03      ATLAS   2025-12-03
 *   0998  NO_LONGER_IN_ATLAS  Burglary  2024-02-01      PHI     null
 *
 * Atlas rows keep Atlas's order. Rows no longer in Atlas follow them, then rows
 * the PHI added, each group sorted by id. Rows the PHI added get their ids from
 * newPhiRowId, so sorting by id keeps them in the order the PHI added them. A
 * config's compare function, if it has one, reorders the rows, and rows it
 * ranks equal keep this order. A row the PHI removed is left out, and so is a
 * row no longer in Atlas that has no PHI values left. A row the PHI added
 * shows even before it has values, so the PHI can fill it in.
 *
 * Every missing value is null rather than undefined, because submitting a
 * report writes this output to Firestore as its snapshot.
 *
 * @param config - How the section's fields and rows map onto Atlas data.
 * @param atlas - The section's current Atlas data.
 * @param input - The PHI's input for the section, or undefined if they have
 *   entered none.
 */
export function resolveSection<
  AtlasSection,
  AtlasRow,
  SectionFields,
  RowFields,
>(
  config: SectionConfig<AtlasSection, AtlasRow, SectionFields, RowFields>,
  atlas: AtlasSection,
  input: SectionInput<SectionFields, RowFields> | undefined,
): ResolvedSection<SectionFields, RowFields> {
  const fields = resolveFields(config.fields, atlas, input?.fields);
  const rowConfig = config.rows;
  if (!rowConfig) return { fields, rows: [] };

  const entries = input?.rows ?? {};
  const atlasIds = new Set<string>();
  const atlasRows: Array<ResolvedRow<RowFields>> = [];
  if (rowConfig.fromAtlas) {
    const atlasRowsConfig = rowConfig;
    atlasRowsConfig.fromAtlas(atlas).forEach((atlasRow) => {
      const id = atlasRowsConfig.id(atlasRow);
      atlasIds.add(id);
      const entry = entries[id];
      if (entry?.removed) return;
      atlasRows.push({
        id,
        status: "IN_ATLAS",
        label: atlasRowsConfig.label(atlasRow),
        fields: resolveFields(rowConfig.fields, atlasRow, entry?.fields),
      });
    });
  }

  const unmatched = Object.entries(entries)
    .filter(
      ([id, entry]) =>
        !atlasIds.has(id) &&
        !entry.removed &&
        (entry.source === "PHI" || hasAnyValue(rowConfig.fields, entry)),
    )
    .sort(([a], [b]) => a.localeCompare(b));
  const toRow = ([id, entry]: [
    string,
    RowEntryInput<RowFields>,
  ]): ResolvedRow<RowFields> => ({
    id,
    status: entry.source === "PHI" ? "ADDED_BY_PHI" : "NO_LONGER_IN_ATLAS",
    label: entry.atlasLabel ?? null,
    fields: resolveFields(rowConfig.fields, undefined, entry.fields),
  });

  const rows = [
    ...atlasRows,
    ...unmatched.filter(([, entry]) => entry.source === "ATLAS").map(toRow),
    ...unmatched.filter(([, entry]) => entry.source === "PHI").map(toRow),
  ];
  if (rowConfig.compare) rows.sort(rowConfig.compare);
  return { fields, rows };
}

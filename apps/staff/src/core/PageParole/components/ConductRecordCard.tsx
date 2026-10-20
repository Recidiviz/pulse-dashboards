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

import {
  isParoleUnknownDate,
  PAROLE_UNKNOWN_TEXT,
  ParoleConductRecord,
} from "~datatypes";

import { PaletteKey, statusStyles } from "../../BadgePill/BadgePill";
import {
  ParoleDisciplinaryRecord,
  ParoleDisciplinaryRecordHeader,
} from "./ParoleDisciplinaryRecord";
import { formatDate } from "./shared";

// Tenant configs key these colors by the severity string as the backend
// spells it today ("Class 1"). Matching case-insensitively keeps a casing
// change upstream from silently collapsing every class onto the same
// fallback grey.
export function conductClassificationPalette(
  conductClassificationColors: Record<string, PaletteKey>,
  severity: string,
): PaletteKey {
  const match = Object.entries(conductClassificationColors).find(
    ([configuredSeverity]) =>
      configuredSeverity.toLowerCase() === severity.toLowerCase(),
  );
  return match?.[1] ?? "SLATE_DARK";
}

// statusStyles[key].color is only legible as plain text for palettes meant to
// sit on a light background -- SLATE_DARK is the one solid-fill exception
// (white text on its own dark backgroundColor), so using its `color` alone
// renders invisible white-on-white text wherever there's no pill behind it
// (e.g. ConductHistorySection's summary counts). Use backgroundColor instead
// for that one case; it's a plain dark grey, legible on its own.
export function conductClassificationTextColor(paletteKey: PaletteKey): string {
  const style = statusStyles[paletteKey];
  return paletteKey === "SLATE_DARK" ? style.backgroundColor : style.color;
}

// Shared between ConductHistorySection's own (recent) records and any
// tenant-specific older-records slot (e.g. US_CO's "See Older
// Disciplinaries" toggle), so a disciplinary record renders identically
// wherever it's shown.
//
// Kept in its own file rather than shared.tsx: tenant-config-owned
// components import this, which puts whatever module holds it on the tenant
// config's import path. shared.tsx is deliberately kept small for that
// reason -- see the note in SectionAnchor.tsx for the import cycle that path
// can close.
export function ConductRecordCard({
  record,
  conductClassificationColors,
}: {
  record: ParoleConductRecord;
  conductClassificationColors: Record<string, PaletteKey>;
}) {
  return (
    <ParoleDisciplinaryRecord>
      <ParoleDisciplinaryRecordHeader
        facts={[
          {
            label: "Date",
            value: isParoleUnknownDate(record.date)
              ? PAROLE_UNKNOWN_TEXT
              : formatDate(record.date),
          },
          { label: "Offense", value: record.violation },
          { label: "Institution", value: record.facility },
          { label: "Disposition", value: record.disposition },
        ]}
        shouldKeepFactsOnOneLine={true}
        badgeText={record.severity}
        badgePalette={conductClassificationPalette(
          conductClassificationColors,
          record.severity,
        )}
      />
    </ParoleDisciplinaryRecord>
  );
}

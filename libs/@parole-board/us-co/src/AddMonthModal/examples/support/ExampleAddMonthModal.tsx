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

import "./setModalAppElement";

import { useForm, useStore } from "@tanstack/react-form";
import { useState } from "react";

import type {
  CalendarApiConfig,
  CurrentPatternRow,
  YearMonthOption,
} from "~@parole-board/common";

import { addMonthTiles, initialSelection } from "../../../model/addMonthTiles";
import { toYearMonthParam } from "../../../model/month";
import { AddMonthForm } from "../../AddMonthForm";
import { ADD_MONTHS_ERROR_MESSAGE } from "../../AddMonthModal";
import { AddMonthModalForm } from "../../AddMonthModal.styles";
import { countLocations, facilityPatternRows } from "../../facilityPatternRows";
import { generateButtonLabel } from "../../generateButtonLabel";

// This file lives one folder below examples/ and isn't named *.examples.tsx,
// so the examples indexer doesn't read it as a story.

/**
 * The addMonthChoices fixture's fields this needs. Example files pass it in,
 * since only they may import the fixtures.
 */
type Choices = {
  currentMonth: YearMonthOption;
  options: YearMonthOption[];
  currentPatterns: CurrentPatternRow[];
  config: CalendarApiConfig;
};

export type ExampleAddMonthModalProps = {
  choices: Choices;
  /** The months selected at first. Defaults to the earliest selectable. */
  initialSelected?: string[];
  patternsDefaultOpen?: boolean;
};

/**
 * AddMonthForm with the addMonthChoices fixture, in the dialog as
 * AddMonthModal lays it out, for the states AddMonthModal reaches only
 * through clicks: an open Facility patterns list and a larger selection. It
 * holds its own form so each example stays interactive; Generate sends
 * nothing.
 */
export function ExampleAddMonthModal({
  choices,
  initialSelected,
  patternsDefaultOpen = false,
}: ExampleAddMonthModalProps) {
  const tiles = addMonthTiles(choices.options, choices.currentMonth);
  // Kept in state, since useForm resets an untouched form's values whenever
  // defaultValues changes.
  const [defaultValues] = useState(() => ({
    months: initialSelected ?? initialSelection(tiles),
  }));
  const form = useForm({ defaultValues });
  const months = useStore(form.store, (state) => state.values.months);
  const labels = tiles
    .filter((tile) => months.includes(toYearMonthParam(tile)))
    .map(({ label }) => label);

  return (
    <AddMonthModalForm
      form={form}
      isOpen
      contentLabel="Add a month"
      submitLabel={generateButtonLabel(labels)}
      submitDisabled={months.length === 0}
      errorMessage={ADD_MONTHS_ERROR_MESSAGE}
      onCancel={() => undefined}
    >
      <form.Field name="months">
        {(field) => (
          <AddMonthForm
            tiles={tiles}
            field={field}
            patterns={facilityPatternRows(
              choices.currentPatterns,
              choices.config.resources,
            )}
            locationCount={countLocations(choices.currentPatterns)}
            patternsDefaultOpen={patternsDefaultOpen}
          />
        )}
      </form.Field>
    </AddMonthModalForm>
  );
}

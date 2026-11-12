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

import { useForm, useStore } from "@tanstack/react-form";
import { useLayoutEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

import {
  type CreateMonthsResult,
  useAddMonthOptions,
  useCalendarConfig,
  useCreateMonths,
  useCurrentPatterns,
  useParoleBoardHost,
  type YearMonthOption,
} from "~@parole-board/common";
import {
  Skeleton,
  SkeletonGroup,
  SkeletonText,
  SuspenseBoundary,
} from "~@parole-board/common/loading";
import { ModalHeading } from "~design-system";

import {
  addMonthTiles,
  initialSelection,
  monthLabel,
} from "../model/addMonthTiles";
import {
  compareYearMonth,
  formatMonthYear,
  parseYearMonthParam,
  toYearMonthParam,
} from "../model/month";
import { useCurrentYearMonth } from "../model/useCurrentYearMonth";
import { AddMonthForm } from "./AddMonthForm";
import {
  AddMonthModalForm,
  MONTH_TILE_HEIGHT,
  PatternsBarSkeleton,
  Subtitle,
  TilesSkeleton,
} from "./AddMonthModal.styles";
import type { CreateNoticeGroup } from "./CreateNotices";
import { countLocations, facilityPatternRows } from "./facilityPatternRows";
import { generateButtonLabel } from "./generateButtonLabel";

export const ADD_MONTHS_ERROR_MESSAGE =
  "We couldn't add these months. Try again or contact Recidiviz support.";

const LOAD_ERROR_TITLE = "We couldn't load the months you can add.";

/**
 * The router state Add month navigates with, so the month view can show the
 * notices months.create returned. The server doesn't store them.
 */
export type AddMonthNavigationState = { createNotices: CreateNoticeGroup[] };

/** Reads the notices from a location's state, or none for any other state. */
export function readCreateNotices(state: unknown): CreateNoticeGroup[] {
  if (typeof state !== "object" || state === null) return [];
  const { createNotices } = state as Partial<AddMonthNavigationState>;
  return Array.isArray(createNotices) ? createNotices : [];
}

function noticeGroups(
  created: CreateMonthsResult["created"],
): CreateNoticeGroup[] {
  return created
    .filter(({ notices }) => notices.length > 0)
    .map(({ year, month, notices }) => ({
      year,
      month,
      messages: notices.map(({ message }) => message),
    }));
}

function createdToast(created: CreateMonthsResult["created"]): string {
  return created.length === 1
    ? `Added ${formatMonthYear(created[0])}`
    : `Added ${created.length} months`;
}

/** The selected "YYYY-MM" keys as months, in month order. */
function selectedMonths(keys: readonly string[]): YearMonthOption[] {
  return keys
    .map(parseYearMonthParam)
    .filter((ym): ym is YearMonthOption => ym !== null)
    .sort(compareYearMonth);
}

// One object, since useForm resets an untouched form's values whenever
// defaultValues changes, comparing them shallowly, so a new [] on each
// render would count as a change.
const NO_MONTHS: { months: string[] } = { months: [] };

/** The dialog's form: the selected months as "YYYY-MM" keys. */
function useAddMonthForm(create: (months: YearMonthOption[]) => Promise<void>) {
  return useForm({
    defaultValues: NO_MONTHS,
    onSubmit: ({ value }) => create(selectedMonths(value.months)),
  });
}

type AddMonthFormApi = ReturnType<typeof useAddMonthForm>;

/**
 * Keeps the selection to months the server offers. When the options first
 * load it selects the earliest, and when they change, as when a CONFLICT
 * refetches them, a selected month the server no longer offers drops out.
 * While a create runs, and after one succeeds while the dialog fades out,
 * the selection stays as sent, so Generate's label doesn't change under its
 * spinner. It runs before the browser paints, so Generate never shows its
 * empty label first.
 */
function useOfferedSelection(
  form: AddMonthFormApi,
  options: YearMonthOption[],
  { year, month }: YearMonthOption,
  holdSelection: boolean,
) {
  const started = useRef(false);
  useLayoutEffect(() => {
    if (holdSelection) return;
    if (!started.current) {
      started.current = true;
      const tiles = addMonthTiles(options, { year, month });
      form.setFieldValue("months", initialSelection(tiles), {
        dontUpdateMeta: true,
      });
      return;
    }
    const offered = new Set(options.map(toYearMonthParam));
    const months = form.getFieldValue("months");
    const kept = months.filter((key) => offered.has(key));
    if (kept.length < months.length) {
      form.setFieldValue("months", kept, { dontUpdateMeta: true });
    }
  }, [form, options, year, month, holdSelection]);
}

/**
 * The dialog's loading state: the real heading and subtitle, with
 * placeholders for the month tiles and the Facility patterns bar.
 */
function AddMonthSkeleton() {
  return (
    <>
      <ModalHeading>Add a month</ModalHeading>
      <Subtitle>
        Select one or more months to draft. You can adjust the default facility
        patterns later.
      </Subtitle>
      <SkeletonGroup label="Loading the months you can add">
        <TilesSkeleton>
          {Array.from({ length: 13 }, (_, index) => (
            <Skeleton key={index} height={MONTH_TILE_HEIGHT} />
          ))}
        </TilesSkeleton>
        <PatternsBarSkeleton>
          <SkeletonText level="Sans12" width="60%" />
        </PatternsBarSkeleton>
      </SkeletonGroup>
    </>
  );
}

/**
 * The dialog's fields once their data has loaded: the tiles from
 * months.addOptions as the form's months field, and the Facility patterns
 * from patterns.listCurrent with full names from config.get.
 */
function AddMonthChoices({ form }: { form: AddMonthFormApi }) {
  const { data: options } = useAddMonthOptions();
  const { data: patterns } = useCurrentPatterns();
  const { data: config } = useCalendarConfig();
  const current = useCurrentYearMonth();
  const submitting = useStore(form.store, (state) => state.isSubmitting);
  // isSubmitted is true only once a create has succeeded.
  const created = useStore(form.store, (state) => state.isSubmitted);
  useOfferedSelection(form, options, current, submitting || created);

  return (
    <form.Field name="months">
      {(field) => (
        <AddMonthForm
          tiles={addMonthTiles(options, current)}
          field={field}
          patterns={facilityPatternRows(patterns, config.resources)}
          locationCount={countLocations(patterns)}
          disabled={submitting}
        />
      )}
    </form.Field>
  );
}

export type AddMonthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * The Add a month dialog, a ModalForm at the design's width. Its fields load months.addOptions,
 * patterns.listCurrent and config.get only while it's open, behind a
 * skeleton, and closing it drops the selection, the open Facility patterns
 * list and any error. Generate, or Enter on a tile, creates the selected
 * months as drafts from the facility patterns, then closes the dialog, shows
 * a toast, reports trackPbPublicCalendarMonthAdded and opens the earliest new
 * month, passing any notices the server returned in the router state. A
 * failed create keeps the dialog open with the error above the buttons.
 */
export function AddMonthModal({ isOpen, onClose }: AddMonthModalProps) {
  const createMonths = useCreateMonths();
  const navigate = useNavigate();
  const location = useLocation();
  const { analyticsStore } = useParoleBoardHost();

  const form = useAddMonthForm(async (months) => {
    const result = await createMonths.mutateAsync({ months });
    const created = [...result.created].sort(compareYearMonth);
    if (created.length === 0) return;
    const keys = created.map(toYearMonthParam);
    analyticsStore.trackPbPublicCalendarMonthAdded({
      months: keys,
      count: keys.length,
    });
    onClose();
    toast(createdToast(created), { id: "add-month" });
    const state: AddMonthNavigationState = {
      createNotices: noticeGroups(created),
    };
    // The query string stays, so the staff app's tenantId does too.
    navigate({ pathname: `../${keys[0]}`, search: location.search }, { state });
  });
  const months = useStore(form.store, (state) => state.values.months);

  return (
    <AddMonthModalForm
      form={form}
      isOpen={isOpen}
      contentLabel="Add a month"
      submitLabel={generateButtonLabel(selectedMonths(months).map(monthLabel))}
      submitDisabled={months.length === 0}
      errorMessage={ADD_MONTHS_ERROR_MESSAGE}
      onCancel={onClose}
      onAfterClose={() => form.reset()}
    >
      <SuspenseBoundary
        fallback={<AddMonthSkeleton />}
        errorTitle={LOAD_ERROR_TITLE}
      >
        <AddMonthChoices form={form} />
      </SuspenseBoundary>
    </AddMonthModalForm>
  );
}

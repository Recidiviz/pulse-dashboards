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

import { injectable, withDi } from "react-magnetic-di";
import styled from "styled-components";

import { generateMonthDraft } from "~@modules/Calendar/rules";
import {
  US_CO_PAROLE_BOARD_RULES,
  US_CO_REFERENCE_DATA,
} from "~@modules/Calendar/rules/us_co/parole_board";
import type {
  CalendarApiConfig,
  EntryDto,
  KindDto,
  MonthDetail,
  ResourceDto,
  YearMonthOption,
} from "~@parole-board/common";
import {
  useCalendarConfig,
  useMonth,
  useMonthsList,
  usePrefetchMonth,
} from "~@parole-board/common";
import {
  calendarApiConfig,
  infiniteQueryResult,
  loadedQueryResult,
  monthDetail,
  monthSummariesPage,
  queryResult,
  september2026Config,
} from "~@parole-board/common/fixtures";
import { AdminPageSkeleton } from "~@parole-board/common/loading";

import { MonthPage } from "./AdminRoutes";
import { useCurrentYearMonth } from "./model/useCurrentYearMonth";
import { useMonthSkeleton } from "./model/useMonthSkeleton";
import { useMonthWithoutSuspense } from "./model/useMonthWithoutSuspense";

// Months as Colorado's patterns draft them, each next to the skeleton that
// stands in for it, so the two can be compared row by row: February 2026
// spans four weeks, September 2026 five and August 2026 six. Each month is
// the current one, so its chips can be selected.

// The generator drafts each month from Colorado's typed reference data, with
// no holidays, so a draft holds every session the patterns make. Ids are
// the codes, so slot keys and resource ids read the same. All of it is
// synthetic: the reference data names facilities and parole offices, not
// people.

const CALENDAR_ID = "PAROLE_BOARD_PUBLIC";
const EDITED_AT = new Date("2026-10-01T16:00:00Z");
const { kinds, resources, patterns } = US_CO_REFERENCE_DATA;

const kindByCode = new Map<string, KindDto>(
  september2026Config.kinds.map((kind) => [kind.code, kind]),
);
const resourceByCode = new Map(
  resources.map((resource) => [resource.code, resource]),
);

/** The calendar config with Colorado's kinds and every hearing location. */
const generatedMonthConfig: CalendarApiConfig = {
  ...calendarApiConfig,
  kinds: september2026Config.kinds,
  resources: resources.map(
    ({ code, name, label, typeCode, sortOrder }): ResourceDto => ({
      id: code,
      code,
      name,
      label,
      typeCode,
      sortOrder,
    }),
  ),
};

/**
 * The month as months.get returns a draft no one has edited: the generator's
 * entries in its order, with the server's counts of hearing days and
 * hearings.
 */
function generatedMonthDetail(yearMonth: YearMonthOption): MonthDetail {
  const draft = generateMonthDraft({
    calendarId: CALENDAR_ID,
    yearMonth,
    rules: US_CO_PAROLE_BOARD_RULES,
    kinds: kinds.map(({ code, label, sortOrder }) => ({
      id: code,
      calendarId: CALENDAR_ID,
      code,
      label,
      sortOrder,
    })),
    resources: resources.map(({ code, label, sortOrder, isActive }) => ({
      id: code,
      calendarId: CALENDAR_ID,
      code,
      label,
      sortOrder,
      isActive,
    })),
    patterns: patterns.map(
      ({ kindCode, resourceCode, rules, startTime, endTime }) => ({
        kindId: kindCode,
        resourceId: resourceCode,
        rules,
        startTime,
        endTime,
      }),
    ),
    holidays: [],
  });

  const entries = draft.entries.map((draftEntry): EntryDto => {
    const kind = kindByCode.get(draftEntry.kindCode);
    if (!kind) throw new Error(`No kind ${draftEntry.kindCode}`);
    const resource = draftEntry.resourceId
      ? resourceByCode.get(draftEntry.resourceId)
      : undefined;
    return {
      id: `${draftEntry.date}:${draftEntry.slotKey}`,
      date: draftEntry.date,
      kind: {
        code: kind.code,
        label: kind.label,
        cancellable: kind.cancellable,
        deletable: kind.deletable,
        countsTowardTotal: kind.countsTowardTotal,
      },
      // An entry with no resource shows its kind's label, as months.get does.
      label: resource?.label ?? kind.label,
      resource: resource
        ? {
            id: resource.code,
            code: resource.code,
            label: resource.label,
            typeCode: resource.typeCode,
          }
        : null,
      slotKey: draftEntry.slotKey,
      startTime: draftEntry.startTime,
      endTime: draftEntry.endTime,
      source: "PATTERN",
      cancelled: false,
      cancelledAt: null,
      cancelledByEmail: null,
      holidayName: null,
      version: 1,
      updatedAt: EDITED_AT,
      updatedByEmail: "editor-a@example.com",
    };
  });

  const counted = entries.filter((entry) => entry.kind.countsTowardTotal);
  return monthDetail({
    ...yearMonth,
    entries,
    holidays: [],
    counts: {
      entryDays: new Set(counted.map((entry) => entry.date)).size,
      entryCount: counted.length,
    },
  });
}

const FEBRUARY_2026 = { year: 2026, month: 2 };
const SEPTEMBER_2026 = { year: 2026, month: 9 };
const AUGUST_2026 = { year: 2026, month: 8 };

// A page fills the viewport, so the frame gives it its height.
const FullHeight = styled.div`
  height: 100vh;

  & > * {
    height: 100%;
  }
`;

const configDi = injectable(useCalendarConfig, () =>
  queryResult(generatedMonthConfig),
);
const monthsListDi = injectable(
  useMonthsList,
  (): ReturnType<typeof useMonthsList> =>
    infiniteQueryResult([monthSummariesPage]),
);
const monthReadyDi = injectable(
  useMonthWithoutSuspense,
  (): ReturnType<typeof useMonthWithoutSuspense> => loadedQueryResult(null),
);
const prefetchDi = injectable(usePrefetchMonth, () => () => undefined);

/** MonthPage on a month the generator drafted, with that month as today. */
function generatedPage(viewed: YearMonthOption) {
  const month = generatedMonthDetail(viewed);
  return withDi(MonthPage, [
    configDi,
    monthsListDi,
    monthReadyDi,
    prefetchDi,
    injectable(useCurrentYearMonth, () => viewed),
    injectable(useMonth, (): ReturnType<typeof useMonth> => queryResult(month)),
  ]);
}

const FebruaryPage = generatedPage(FEBRUARY_2026);
const SeptemberPage = generatedPage(SEPTEMBER_2026);
const AugustPage = generatedPage(AUGUST_2026);

/** The page skeleton MonthPage shows on a first load of viewed. */
function PageSkeleton({ viewed }: { viewed: YearMonthOption }) {
  return <AdminPageSkeleton {...useMonthSkeleton(viewed)} />;
}

export default { parameters: { layout: "fullscreen" } };

/** February 2026, which spans four weeks. */
export const February2026 = () => (
  <FullHeight>
    <FebruaryPage viewed={FEBRUARY_2026} />
  </FullHeight>
);

/** The skeleton for a first load of February 2026. */
export const February2026Loading = () => (
  <FullHeight>
    <PageSkeleton viewed={FEBRUARY_2026} />
  </FullHeight>
);

/** September 2026, which spans five weeks, drafted with no holidays. */
export const September2026 = () => (
  <FullHeight>
    <SeptemberPage viewed={SEPTEMBER_2026} />
  </FullHeight>
);

/** The skeleton for a first load of September 2026. */
export const September2026Loading = () => (
  <FullHeight>
    <PageSkeleton viewed={SEPTEMBER_2026} />
  </FullHeight>
);

/** August 2026, which spans six weeks. */
export const August2026 = () => (
  <FullHeight>
    <AugustPage viewed={AUGUST_2026} />
  </FullHeight>
);

/** The skeleton for a first load of August 2026. */
export const August2026Loading = () => (
  <FullHeight>
    <PageSkeleton viewed={AUGUST_2026} />
  </FullHeight>
);

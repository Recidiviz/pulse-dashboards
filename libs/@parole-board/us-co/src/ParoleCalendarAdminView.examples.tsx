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

import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, ReactNode, useContext, useState } from "react";
import { injectable, withDi } from "react-magnetic-di";
import { Route, Routes } from "react-router-dom";
import styled from "styled-components";

import type {
  EntryDto,
  MonthDetail,
  YearMonthOption,
} from "~@parole-board/common";
import {
  ParoleBoardHostProvider,
  useCalendarConfig,
  useMonth,
  useMonthsList,
  useMoveEntries,
  usePrefetchMonth,
  usePublishMonth,
  usePublishPreview,
  useUnpublishMonth,
} from "~@parole-board/common";
import {
  calendarApiConfig,
  calendarApiError,
  december2026Summary,
  failedQuery,
  infiniteQueryResult,
  loadedQueryResult,
  monthDetail,
  monthListPage,
  monthSummariesPage,
  monthSummary,
  mutationResult,
  november2026Summary,
  pendingQueryResult,
  publishPreview,
  queryResult,
  september2026Config,
  september2026MonthDetail,
  september2026MonthDetailWithHolidayHearings,
  september2026Summary,
  suspendedQuery,
} from "~@parole-board/common/fixtures";
import {
  createFakeCalendarTrpc,
  createFakeHost,
} from "~@parole-board/common/testing";

import { AdminRoutes, MonthPage } from "./AdminRoutes";
import { useCurrentYearMonth } from "./model/useCurrentYearMonth";
import { useMonthWithoutSuspense } from "./model/useMonthWithoutSuspense";
import { useSelectedEntries } from "./model/useSelectedEntries";

const SEPTEMBER_2026 = { year: 2026, month: 9 };
const OCTOBER_2026 = { year: 2026, month: 10 };
const NOVEMBER_2026 = { year: 2026, month: 11 };
const DECEMBER_2026 = { year: 2026, month: 12 };

// A page fills the viewport, so the frame gives it its height.
const FullHeight = styled.div`
  height: 100vh;

  & > * {
    height: 100%;
  }
`;

// Typed as the hooks' own results, so the builders take the hooks' error
// type.
const monthResult = (data: MonthDetail | null): ReturnType<typeof useMonth> =>
  queryResult(data);
const monthsListResult = (): ReturnType<typeof useMonthsList> =>
  infiniteQueryResult([monthSummariesPage]);

const useConfigDi = injectable(useCalendarConfig, () =>
  queryResult(calendarApiConfig),
);
const useMonthsListDi = injectable(useMonthsList, monthsListResult);
/**
 * The viewed month, for MonthContent's useMonth and for the header's
 * actions, which read the same month without suspending.
 */
const monthDi = (month: MonthDetail | null) => [
  injectable(useMonth, () => monthResult(month)),
  injectable(
    useMonthWithoutSuspense,
    (): ReturnType<typeof useMonthWithoutSuspense> => loadedQueryResult(month),
  ),
];
// The header's month while the page loads.
const monthPendingDi = injectable(
  useMonthWithoutSuspense,
  (): ReturnType<typeof useMonthWithoutSuspense> => pendingQueryResult(),
);
const usePrefetchMonthDi = injectable(usePrefetchMonth, () => () => undefined);
// The publish dialog's preview, and a publish that logs to the actions panel
// and never settles.
const usePublishPreviewDi = injectable(
  usePublishPreview,
  (): ReturnType<typeof usePublishPreview> => queryResult(publishPreview()),
);
const usePublishMonthDi = injectable(
  usePublishMonth,
  (): ReturnType<typeof usePublishMonth> => mutationResult(),
);
// Edit month's months.unpublish, which logs to the actions panel and never
// settles.
const useUnpublishMonthDi = injectable(
  useUnpublishMonth,
  (): ReturnType<typeof useUnpublishMonth> => mutationResult(),
);
// The clock at 2026-09-08 and at 2026-10-08, in Denver.
const inSeptemberDi = injectable(useCurrentYearMonth, () => SEPTEMBER_2026);
const inOctoberDi = injectable(useCurrentYearMonth, () => OCTOBER_2026);
// A DRAFT no one has edited since months.create, as september2026Summary.
const septemberDi = monthDi(monthDetail({ year: 2026, month: 9 }));
const publishedDi = monthDi(monthDetail(november2026Summary));
const backInDraftDi = monthDi(monthDetail(december2026Summary));
const september2026ConfigDi = injectable(useCalendarConfig, () =>
  queryResult(september2026Config),
);
/** The selection held at ids, as if the editor had clicked those chips. */
const selectedDi = (ids: readonly string[]) =>
  injectable(useSelectedEntries, () => ({
    selectedIds: ids,
    toggle: () => undefined,
    selectOnly: () => undefined,
    clear: () => undefined,
  }));

// The examples' own copy of a month, which entries.move below changes, so a
// drop or "Move to…" moves the chip in the example.
const InMemoryMonthContext = createContext<{
  month: MonthDetail;
  setMonth: (month: MonthDetail) => void;
} | null>(null);

function InMemoryMonth({
  initial,
  children,
}: {
  initial: MonthDetail;
  children: ReactNode;
}) {
  const [month, setMonth] = useState(initial);
  return (
    <InMemoryMonthContext.Provider value={{ month, setMonth }}>
      {children}
    </InMemoryMonthContext.Provider>
  );
}

function useInMemoryMonthContext() {
  const value = useContext(InMemoryMonthContext);
  if (!value) throw new Error("Render this page inside InMemoryMonth");
  return value;
}

const kindOrder = new Map(
  september2026Config.kinds.map((kind) => [kind.code, kind.sortOrder]),
);

/**
 * The month after entries.move puts the entries of ids on newDate, as
 * months.get would return it: in date order, then kind order, with each moved
 * entry's version and the month's revision one higher and the counts
 * recounted.
 */
function moveInMonth(
  month: MonthDetail,
  ids: ReadonlySet<string>,
  newDate: string,
): MonthDetail {
  const entries = month.entries
    .map((entry) =>
      ids.has(entry.id)
        ? { ...entry, date: newDate, version: entry.version + 1 }
        : entry,
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (kindOrder.get(a.kind.code) ?? 0) - (kindOrder.get(b.kind.code) ?? 0),
    );
  const counted = entries.filter((entry) => entry.kind.countsTowardTotal);
  return {
    ...month,
    entries,
    revision: month.revision + 1,
    counts: {
      entryDays: new Set(counted.map((entry) => entry.date)).size,
      entryCount: counted.length,
    },
  };
}

function useInMemoryMonth(): ReturnType<typeof useMonth> {
  return monthResult(useInMemoryMonthContext().month);
}

function useInMemoryMoveEntries(): ReturnType<typeof useMoveEntries> {
  const { month, setMonth } = useInMemoryMonthContext();
  const result: ReturnType<typeof useMoveEntries> = mutationResult();
  return {
    ...result,
    mutateAsync: async ({ entries, newDate }) => {
      const ids = new Set(entries.map(({ entryId }) => entryId));
      const next = moveInMonth(month, ids, newDate);
      setMonth(next);
      return {
        entries: next.entries.filter((entry) => ids.has(entry.id)),
        month: next,
        monthRevision: next.revision,
      };
    },
  };
}

/** entries.move that never answers, so a dropped chip keeps saving. */
function useNeverSavedMoveEntries(): ReturnType<typeof useMoveEntries> {
  const [isPending, setIsPending] = useState(false);
  const result: ReturnType<typeof useMoveEntries> = mutationResult({
    isPending,
  });
  return {
    ...result,
    mutateAsync: (input) => {
      setIsPending(true);
      return result.mutateAsync(input);
    },
  };
}

const neverSavedMoveEntriesDi = injectable(
  useMoveEntries,
  useNeverSavedMoveEntries,
);
const inMemoryMonthDi = injectable(useMonth, useInMemoryMonth);
const inMemoryMonthReadyDi = injectable(
  useMonthWithoutSuspense,
  (): ReturnType<typeof useMonthWithoutSuspense> =>
    loadedQueryResult(useInMemoryMonthContext().month),
);
const inMemoryMoveEntriesDi = injectable(
  useMoveEntries,
  useInMemoryMoveEntries,
);
const missingMonthDi = monthDi(null);
// The header's month on the error pages. MonthActions shows nothing for a
// month that failed to load, as for one that doesn't exist, so null stands
// in for the failed read.
const monthFailedDi = injectable(
  useMonthWithoutSuspense,
  (): ReturnType<typeof useMonthWithoutSuspense> => loadedQueryResult(null),
);
const loadingDi = injectable(useMonth, suspendedQuery);
const forbiddenDi = injectable(useMonth, () =>
  failedQuery(calendarApiError("FORBIDDEN", "Not allowed")),
);
const loadErrorDi = injectable(useMonth, () =>
  failedQuery(calendarApiError("INTERNAL_SERVER_ERROR", "Network error")),
);

const defaults = [
  useConfigDi,
  useMonthsListDi,
  inOctoberDi,
  usePrefetchMonthDi,
  usePublishMonthDi,
  usePublishPreviewDi,
  useUnpublishMonthDi,
];

const DraftPage = withDi(MonthPage, [
  ...defaults,
  inSeptemberDi,
  ...septemberDi,
]);
// Only the clock is injected, so the page reads through the real hooks.
const LiveSeptemberPage = withDi(MonthPage, [inSeptemberDi]);
// The September 2026 fixture with FCF and CTCF added by hand on Labor Day.
const HolidayHearingsPage = withDi(MonthPage, [
  ...defaults,
  september2026ConfigDi,
  inSeptemberDi,
  ...monthDi(september2026MonthDetailWithHolidayHearings),
]);
const PastMonthPage = withDi(MonthPage, [...defaults, ...septemberDi]);
const PublishedPage = withDi(MonthPage, [...defaults, ...publishedDi]);
// December's own preview, so Review & Publish opens on a republish.
const decemberPreviewDi = injectable(
  usePublishPreview,
  (): ReturnType<typeof usePublishPreview> =>
    queryResult(
      publishPreview({
        monthId: "month-2026-12",
        month: 12,
        revision: december2026Summary.revision,
        latestPublication: december2026Summary.latestPublication,
      }),
    ),
);
const BackInDraftPage = withDi(MonthPage, [
  ...defaults,
  ...backInDraftDi,
  decemberPreviewDi,
]);
const EmptyPage = withDi(MonthPage, [...defaults, ...missingMonthDi]);
const OneHearingSelectedPage = withDi(MonthPage, [
  september2026ConfigDi,
  useMonthsListDi,
  inSeptemberDi,
  inMemoryMonthDi,
  inMemoryMonthReadyDi,
  usePrefetchMonthDi,
  inMemoryMoveEntriesDi,
  selectedDi(["2026-09-15:HEARING:CCF"]),
]);
const SeveralHearingsSelectedPage = withDi(MonthPage, [
  september2026ConfigDi,
  useMonthsListDi,
  inSeptemberDi,
  inMemoryMonthDi,
  inMemoryMonthReadyDi,
  usePrefetchMonthDi,
  inMemoryMoveEntriesDi,
  selectedDi([
    "2026-09-14:HEARING:FCF",
    "2026-09-15:HEARING:CCF",
    "2026-09-17:HEARING:AVCF",
  ]),
]);
// The full September 2026 fixture, with its config's facility names.
const MovePendingPage = withDi(MonthPage, [
  ...defaults,
  september2026ConfigDi,
  inSeptemberDi,
  ...monthDi(september2026MonthDetail),
  neverSavedMoveEntriesDi,
]);
const LoadingPage = withDi(MonthPage, [...defaults, loadingDi, monthPendingDi]);
const ForbiddenPage = withDi(MonthPage, [
  ...defaults,
  forbiddenDi,
  monthFailedDi,
]);
const LoadErrorPage = withDi(MonthPage, [
  ...defaults,
  loadErrorDi,
  monthFailedDi,
]);

export default { parameters: { layout: "fullscreen" } };

// Each story renders its withDi component rather than exporting it, because
// Storybook reads the object withDi returns as a story object.

/**
 * September 2026 on 2026-09-08: the first stored month, as generated, with
 * "Review & Publish".
 */
export const Draft = () => (
  <FullHeight>
    <DraftPage viewed={SEPTEMBER_2026} />
  </FullHeight>
);

// A request takes half a second to answer, so its waiting state shows.
const WRITE_DELAY_MS = 500;

const answerLater = <T,>(value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), WRITE_DELAY_MS);
  });

// The counts months.get sends: the entries that count toward the total, and
// the days they fall on.
const countEntries = (entries: readonly EntryDto[]) => {
  const counted = entries.filter((entry) => entry.kind.countsTowardTotal);
  return {
    entryDays: new Set(counted.map((entry) => entry.date)).size,
    entryCount: counted.length,
  };
};

/**
 * The real hooks against a fake calendar client that holds the September
 * 2026 fixture and changes it as the server would, so a write shows on the
 * page through the month it returns.
 */
function LiveSeptember() {
  const [host] = useState(() => {
    let month: MonthDetail = structuredClone(september2026MonthDetail);
    const setEntries = (entries: EntryDto[]) => {
      month = { ...month, entries, counts: countEntries(entries) };
      return answerLater({ month: structuredClone(month) });
    };
    const setCancelled = (input: unknown, cancelled: boolean) => {
      const { entryId } = input as { entryId: string };
      return setEntries(
        month.entries.map((entry) =>
          entry.id === entryId
            ? { ...entry, cancelled, version: entry.version + 1 }
            : entry,
        ),
      );
    };
    return createFakeHost({
      calendarTrpc: createFakeCalendarTrpc({
        procedures: {
          "admin.config.get": () => september2026Config,
          "admin.months.list": () => monthListPage([september2026Summary]),
          "admin.months.get": () => structuredClone(month),
          "admin.entries.cancel": (input) => setCancelled(input, true),
          "admin.entries.uncancel": (input) => setCancelled(input, false),
          "admin.entries.delete": (input) => {
            const { entryId } = input as { entryId: string };
            return setEntries(
              month.entries.filter((entry) => entry.id !== entryId),
            );
          },
        },
      }),
    });
  });
  return (
    <ParoleBoardHostProvider host={host}>
      <QueryClientProvider client={host.calendarTrpc.queryClient}>
        <FullHeight>
          <LiveSeptemberPage viewed={SEPTEMBER_2026} />
        </FullHeight>
      </QueryClientProvider>
    </ParoleBoardHostProvider>
  );
}

/**
 * The September 2026 fixture on 2026-09-08: the counts, the action bar and
 * the grid. Click chips to select them; one selected hearing shows "Delete
 * hearing", and Delete removes it and moves focus to the month's title. The
 * Full Board on the 11th or the Business Meeting on the 25th shows "Cancel",
 * which turns into "Undo".
 */
export const September2026 = () => <LiveSeptember />;

/**
 * September 2026 with FCF and CTCF added by hand on Labor Day: the counts
 * include them, and the day keeps its "Labor Day" label below their chips.
 */
export const HolidayHearings = () => (
  <FullHeight>
    <HolidayHearingsPage viewed={SEPTEMBER_2026} />
  </FullHeight>
);

/**
 * CCF on September 15 selected: the action bar reads "CCF · September 15"
 * with "Delete hearing" and "Move to…". Dropping any chip on another weekday
 * moves it there in the example; a weekend refuses the drop.
 */
export const OneHearingSelected = () => (
  <FullHeight>
    <InMemoryMonth initial={september2026MonthDetail}>
      <OneHearingSelectedPage viewed={SEPTEMBER_2026} />
    </InMemoryMonth>
  </FullHeight>
);

/**
 * Three hearings on different days selected: the action bar holds only
 * "Move to…", which moves all three. Dropping one of them on another weekday
 * moves all three there in the example; a weekend refuses the drop.
 */
export const SeveralHearingsSelected = () => (
  <FullHeight>
    <InMemoryMonth initial={september2026MonthDetail}>
      <SeveralHearingsSelectedPage viewed={SEPTEMBER_2026} />
    </InMemoryMonth>
  </FullHeight>
);

/**
 * The September 2026 fixture on 2026-09-08, where entries.move never
 * answers: a dropped chip shows on its new day with a moving band, and stays
 * saving.
 */
export const MovePending = () => (
  <FullHeight>
    <MovePendingPage viewed={SEPTEMBER_2026} />
  </FullHeight>
);

/**
 * September 2026 on 2026-10-08: a past month, viewable and read-only, with no
 * selection and no action bar.
 */
export const PastMonthReadOnly = () => (
  <FullHeight>
    <PastMonthPage viewed={SEPTEMBER_2026} />
  </FullHeight>
);

/**
 * November 2026, published and locked: the published banner and "Edit
 * month", its only action. Its chips can't be selected, so there's no action
 * bar.
 */
export const Published = () => (
  <FullHeight>
    <PublishedPage viewed={NOVEMBER_2026} />
  </FullHeight>
);

/**
 * December 2026, published and then moved back to draft with Edit month, so
 * the DRAFT strip shows under the header, and Review & Publish opens on a
 * republish.
 */
export const BackInDraft = () => (
  <FullHeight>
    <BackInDraftPage viewed={DECEMBER_2026} />
  </FullHeight>
);

/** October 2026, which hasn't been created. */
export const Empty = () => (
  <FullHeight>
    <EmptyPage viewed={OCTOBER_2026} />
  </FullHeight>
);

/**
 * October 2026 while it loads: the header shows from the URL, with
 * placeholders for its actions, and the month section shows its skeleton.
 */
export const Loading = () => (
  <FullHeight>
    <LoadingPage viewed={OCTOBER_2026} />
  </FullHeight>
);

export const Forbidden = () => (
  <FullHeight>
    <ForbiddenPage viewed={OCTOBER_2026} />
  </FullHeight>
);

export const LoadError = () => (
  <FullHeight>
    <LoadErrorPage viewed={OCTOBER_2026} />
  </FullHeight>
);

// The stored months for Navigation, with gaps in October 2026 and in January
// and March 2027.
const navigationMonths = [
  september2026Summary,
  november2026Summary,
  december2026Summary,
  monthSummary({ year: 2027, month: 2 }),
  monthSummary({ year: 2027, month: 4 }),
];

// Each month takes a second to load, as on a slow connection, so a month
// that isn't cached shows its skeleton for a moment. A publish or an Edit
// month answers a little sooner, so its button's waiting state shows.
const MONTH_DELAY_MS = 1000;
const PUBLISH_DELAY_MS = 800;

const after = <T,>(ms: number, value: T) =>
  new Promise<T>((resolve) => {
    setTimeout(() => resolve(value), ms);
  });

const monthKey = ({ year, month }: YearMonthOption) => `${year}-${month}`;

/**
 * A fake calendar client over the navigation months. Publishing a draft
 * stores it as PUBLISHED, and Edit month stores a published month as DRAFT,
 * so months.get reads it back that way, as the server would.
 */
function createLiveCalendarTrpc() {
  const stored = new Map(
    navigationMonths.map((summary) => [
      monthKey(summary),
      monthDetail(summary),
    ]),
  );
  const byId = (monthId: string) =>
    [...stored.values()].find((month) => month.id === monthId);
  return createFakeCalendarTrpc({
    procedures: {
      "admin.config.get": () => calendarApiConfig,
      "admin.months.list": () => monthListPage(navigationMonths),
      "admin.months.get": (input) =>
        after(
          MONTH_DELAY_MS,
          stored.get(monthKey(input as YearMonthOption)) ?? null,
        ),
      "admin.months.publishPreview": (input) => {
        const draft = byId((input as { monthId: string }).monthId);
        return publishPreview(
          draft && {
            monthId: draft.id,
            year: draft.year,
            month: draft.month,
            revision: draft.revision,
            latestPublication: draft.latestPublication,
          },
        );
      },
      "admin.months.publish": (input) => {
        const { monthId } = input as { monthId: string };
        const draft = byId(monthId);
        if (!draft) throw new Error(`No month ${monthId}`);
        const month: MonthDetail = {
          ...draft,
          status: "PUBLISHED",
          revision: draft.revision + 1,
          latestPublication: {
            publishedAt: new Date(),
            publishedByEmail: "editor-a@example.com",
          },
        };
        stored.set(monthKey(month), month);
        return after(PUBLISH_DELAY_MS, {
          monthId,
          status: "PUBLISHED" as const,
          revision: month.revision,
          month,
        });
      },
      "admin.months.unpublish": (input) => {
        const { monthId } = input as { monthId: string };
        const published = byId(monthId);
        if (!published) throw new Error(`No month ${monthId}`);
        const month: MonthDetail = {
          ...published,
          status: "DRAFT",
          revision: published.revision + 1,
        };
        stored.set(monthKey(month), month);
        return after(PUBLISH_DELAY_MS, {
          monthId,
          status: "DRAFT" as const,
          revision: month.revision,
          month,
        });
      },
    },
  });
}

/**
 * The real hooks against a fake calendar client, so changing month behaves
 * as it does in the app: the arrows' months are prefetched and switch at
 * once, while a month picked from the menu that isn't cached shows only the
 * month section's skeleton under the header. Review & Publish publishes a
 * draft, and Edit month moves a published month back to draft, for real,
 * against the fake client.
 */
function LiveAdmin() {
  const [host] = useState(() =>
    createFakeHost({ calendarTrpc: createLiveCalendarTrpc() }),
  );
  return (
    <ParoleBoardHostProvider host={host}>
      <QueryClientProvider client={host.calendarTrpc.queryClient}>
        <FullHeight>
          <Routes>
            <Route path="/parole/public-calendar/*" element={<AdminRoutes />} />
          </Routes>
        </FullHeight>
      </QueryClientProvider>
    </ParoleBoardHostProvider>
  );
}

/** November 2026 with live navigation between the stored months. */
export const Navigation = () => <LiveAdmin />;
Navigation.parameters = { route: "/parole/public-calendar/2026-11" };

/**
 * December 2026, back in draft, published live: Review & Publish opens the
 * dialog, and once the publish succeeds the dialog closes and the month shows
 * as published, with no Review & Publish.
 */
export const PublishFlow = () => <LiveAdmin />;
PublishFlow.parameters = { route: "/parole/public-calendar/2026-12" };

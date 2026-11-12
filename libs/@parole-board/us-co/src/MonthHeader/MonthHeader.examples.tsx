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

import { ReactNode } from "react";
import { injectable, withDi } from "react-magnetic-di";
import { action } from "storybook/actions";

import type { MonthSummary, YearMonthOption } from "~@parole-board/common";
import {
  ParoleBoardButton,
  semantics,
  useMonthsList,
  usePrefetchMonth,
} from "~@parole-board/common";
import {
  december2026Summary,
  infiniteQueryResult,
  monthSummariesPage,
  november2026Summary,
  september2026Summary,
} from "~@parole-board/common/fixtures";
import { Button, Icon } from "~design-system";

import { formatMonthYear, neighborMonths } from "../model/month";
import { MonthStatusBanner } from "../MonthStatusBanner/MonthStatusBanner";
import { MonthActions } from "./MonthActions";
import { MonthHeader } from "./MonthHeader";
import { Mirrored } from "./MonthHeader.styles";
import { MonthLink, MonthNav } from "./MonthNav";
import { MonthPicker } from "./MonthPicker";

// The clock is at 2026-10-08: September is past, October isn't stored, and
// November and December are.
const OCTOBER_2026 = { year: 2026, month: 10 };
const DENVER = "America/Denver";

/** A months.list month with the live counts months.get adds. */
const withCounts = (summary: MonthSummary) => ({
  ...summary,
  counts: { entryDays: 13, entryCount: 37 },
});

// Typed as the hook's own result, so the builder takes the hook's types.
const monthsListResult = (): ReturnType<typeof useMonthsList> =>
  infiniteQueryResult([monthSummariesPage]);

const useMonthsListDi = injectable(useMonthsList, monthsListResult);
const usePrefetchMonthDi = injectable(usePrefetchMonth, () => () => undefined);

/** The header as the admin view composes it, for the viewed month. */
function Header({
  viewed,
  actions,
}: {
  viewed: YearMonthOption;
  actions?: ReactNode;
}) {
  const { previous, next } = neighborMonths([monthSummariesPage], viewed);
  return (
    <MonthHeader
      title={formatMonthYear(viewed)}
      navigation={
        <>
          <MonthNav>
            <MonthLink month={previous} label="Previous month">
              <Mirrored>
                <Icon kind="Arrow" size={semantics.space.md} />
              </Mirrored>
            </MonthLink>
            <MonthPicker viewed={viewed} current={OCTOBER_2026} />
            <MonthLink month={next} label="Next month">
              <Icon kind="Arrow" size={semantics.space.md} />
            </MonthLink>
          </MonthNav>
          <Button kind="secondary" shape="block" onClick={action("Add month")}>
            + Add month
          </Button>
        </>
      }
      actions={actions}
    />
  );
}

const InjectedHeader = withDi(Header, [useMonthsListDi, usePrefetchMonthDi]);

// Stand-ins for a draft's Add hearing and Review & Publish buttons.
const exampleActions = (
  <>
    <Button kind="secondary">Add hearing</Button>
    <Button>Review & Publish</Button>
  </>
);

// A published month is locked, so its only action is Edit month.
const publishedActions = <ParoleBoardButton>Edit month</ParoleBoardButton>;

export default {};

export const Draft = () => (
  <InjectedHeader viewed={OCTOBER_2026} actions={exampleActions} />
);

/** December 2026, published and then moved back to draft with Edit month. */
export const BackInDraft = () => (
  <>
    <InjectedHeader viewed={december2026Summary} actions={exampleActions} />
    <MonthStatusBanner
      month={withCounts(december2026Summary)}
      timeZone={DENVER}
    />
  </>
);

export const Published = () => (
  <>
    <InjectedHeader viewed={november2026Summary} actions={publishedActions} />
    <MonthStatusBanner
      month={withCounts(november2026Summary)}
      timeZone={DENVER}
    />
  </>
);

// September is the first stored month, and past, so it has no actions.
export const FirstMonth = () => (
  <InjectedHeader viewed={september2026Summary} />
);

export const LastMonth = () => (
  <InjectedHeader viewed={december2026Summary} actions={exampleActions} />
);

/**
 * A month that isn't cached yet: the header shows at once from the URL, and
 * placeholders hold the actions' place until the month loads.
 */
export const ActionsLoading = () => (
  <InjectedHeader
    viewed={november2026Summary}
    actions={<MonthActions pending />}
  />
);

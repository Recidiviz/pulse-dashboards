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

import { ErrorBoundary } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { Suspense, useMemo } from "react";

import { AdminPageSkeleton } from "~@parole-board/common/loading";
import { Button, ErrorPage } from "~design-system";

import { useRootStore } from "../../../components/StoreProvider";
import { useLazyWithRetry } from "../../../utils/lazyWithRetry";
import { createParoleBoardHost } from "./createParoleBoardHost";

/**
 * The US_CO Parole Board Public Calendar admin tool as a Parole subpage.
 * ParolePublicCalendar renders it for US_CO under the staff header, on a route
 * ending in "/*", and the admin tool owns the routes below it. The admin tool
 * loads in its own chunk, so its calendar code stays out of the bundle for
 * every other staff user.
 */
export const UsCoParolePublicCalendarView = observer(
  function UsCoParolePublicCalendarView() {
    const rootStore = useRootStore();
    const host = useMemo(() => createParoleBoardHost(rootStore), [rootStore]);
    const [UsCoParoleCalendarAdmin, retryLazy] = useLazyWithRetry(() =>
      import("~@parole-board/us-co").then((m) => ({
        default: m.UsCoParoleCalendarAdmin,
      })),
    );

    // A failed chunk fetch or an error the admin tool throws keeps
    // PageParole's header and offers a retry, which re-runs the import.
    const errorFallback = ({ resetError }: { resetError: () => void }) => (
      <ErrorPage
        headerText="Sorry, it looks like something went wrong..."
        logo={null}
      >
        Please try refreshing the page or reach out to your contact at Recidiviz
        for more assistance.
        <Button
          onClick={() => {
            retryLazy();
            resetError();
          }}
        >
          Try again
        </Button>
      </ErrorPage>
    );

    // While the chunk loads, a skeleton of the admin page holds its place. It
    // comes from common's loading entry point, which doesn't pull the rest of
    // the Parole Board libraries into the main bundle.
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Suspense fallback={<AdminPageSkeleton />}>
          <UsCoParoleCalendarAdmin host={host} />
        </Suspense>
      </ErrorBoundary>
    );
  },
);

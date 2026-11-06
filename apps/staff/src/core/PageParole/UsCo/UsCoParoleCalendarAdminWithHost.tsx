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

import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { UsCoParoleCalendarAdmin } from "~@parole-board/us-co";

import { useRootStore } from "../../../components/StoreProvider";
import { createParoleBoardHost } from "./createParoleBoardHost";

/**
 * The US_CO admin tool with a host built from the staff RootStore.
 * UsCoParolePublicCalendarView loads this module lazily, so the calendar
 * client and the rest of the Parole Board libraries stay in the admin tool's
 * chunk rather than the main bundle.
 */
const UsCoParoleCalendarAdminWithHost = observer(
  function UsCoParoleCalendarAdminWithHost() {
    const rootStore = useRootStore();
    const host = useMemo(() => createParoleBoardHost(rootStore), [rootStore]);
    return <UsCoParoleCalendarAdmin host={host} />;
  },
);

export default UsCoParoleCalendarAdminWithHost;

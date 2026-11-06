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

import { TRPCClientError } from "@trpc/client";

import { US_CO_PAROLE_BOARD_SETTINGS } from "~@modules/Calendar/rules/us_co/parole_board";
import { type Auth0User, router } from "~@modules-server/trpc-base";

import { manifest } from "../../../../src";
import { initFastifyAndSetUser } from "../../../setup";
import { coEditor, coViewer, recidivizUser } from "../../../setup/users";
import { initUsCoClient } from "../../../us_co/parole_board/setup";

/** A US_CO user with the editor route Colorado's settings name. */
const usCoEditor: Auth0User = {
  ...coEditor,
  "https://dashboard.recidiviz.org/app_metadata": {
    stateCode: "us_co",
    routes: { [US_CO_PAROLE_BOARD_SETTINGS.editorRoute]: true },
  },
};

describe("Calendar router", () => {
  it.each([
    ["a US_CO editor", usCoEditor],
    ["a Recidiviz user", recidivizUser],
  ])("passes %s through to the handler", async (_label, user) => {
    const trpc = await initUsCoClient(user);

    await expect(
      trpc.Calendar.usCo.paroleBoard.admin.months.list.query({}),
    ).rejects.toSatisfy(
      (e) => e instanceof TRPCClientError && e.data?.code === "NOT_IMPLEMENTED",
    );
  });

  it("is FORBIDDEN for a US_CO user without the publicCalendar route", async () => {
    const trpc = await initUsCoClient(coViewer);

    await expect(
      trpc.Calendar.usCo.paroleBoard.admin.months.list.query({}),
    ).rejects.toSatisfy(
      (e) => e instanceof TRPCClientError && e.data?.code === "FORBIDDEN",
    );
  });
});

describe("the Calendar module's manifest", () => {
  // Mounted the way the Modules server mounts it, under the module name.
  const modulesTestRouter = router({ Calendar: manifest.router });

  it("is the Calendar module for US_CO", () => {
    expect(manifest.module).toBe("Calendar");
    expect(manifest.enabledTenants).toEqual(["US_CO"]);
  });

  // An unmounted path fails with NOT_FOUND, so FORBIDDEN shows the request
  // reached Colorado's editor procedure.
  it("serves Colorado's procedures at Calendar.usCo.paroleBoard.<procedure>", async () => {
    const trpc = await initFastifyAndSetUser(coViewer, {
      router: modulesTestRouter,
    });

    await expect(
      trpc.Calendar.usCo.paroleBoard.admin.months.list.query({}),
    ).rejects.toSatisfy(
      (e) => e instanceof TRPCClientError && e.data?.code === "FORBIDDEN",
    );
  });
});

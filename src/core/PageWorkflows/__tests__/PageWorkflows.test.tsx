/*
 * Recidiviz - a data platform for criminal justice reform
 * Copyright (C) 2022 Recidiviz, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * =============================================================================
 */

import { mount } from "enzyme";
import React from "react";

import { useRootStore } from "../../../components/StoreProvider";
import isIE11 from "../../../utils/isIE11";
import PageWorkflows from "../PageWorkflows";

jest.mock("../../CoreStoreProvider");
jest.mock("../../../utils/isIE11");
jest.mock("../../../components/StoreProvider");
jest.mock("react-router-dom", () => ({
  // @ts-ignore
  ...jest.requireActual("react-router-dom"),
  useRouteMatch: jest.fn().mockReturnValue({
    path: "/",
  }),
}));

const workflowsStoreMock = jest.fn().mockReturnValue({
  hydrate: jest.fn().mockReturnValue(jest.fn()),
})();
(useRootStore as jest.Mock).mockReturnValue({
  workflowsStore: workflowsStoreMock,
});

describe("PageWorkflows test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("attempts to hydrate the workflows models when not on IE11", () => {
    (isIE11 as jest.Mock).mockReturnValue(false);
    mount(<PageWorkflows />);
    expect(workflowsStoreMock.hydrate).toHaveBeenCalled();
  });

  it("does not attempt to hydrate the workflows models when on IE11", () => {
    (isIE11 as jest.Mock).mockReturnValue(true);
    mount(<PageWorkflows />);
    expect(workflowsStoreMock.hydrate).toHaveBeenCalledTimes(0);
  });
});

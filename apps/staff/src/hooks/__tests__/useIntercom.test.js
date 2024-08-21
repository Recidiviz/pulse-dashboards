// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { renderHook } from "@testing-library/react";

import { useRootStore } from "../../components/StoreProvider";
import useIntercom from "../useIntercom";

vi.mock("../../components/StoreProvider");

describe("useIntercom hook tests", () => {
  const mockName = "some user name";
  const mockNickname = "some user nickname";
  const mockEmail = "some user email";
  const mockUserId = "some user id";
  const mockStateCode = "some state code";
  const mockUser = {
    name: mockName,
    nickname: mockNickname,
    email: mockEmail,
  };

  const mockIntercomId =
    "1bf02f3b6639dd2a6bfdfbdda269db483eceab0184c634affe26d82a62706161";
  const mockUserAppMetadata = {
    segmentId: mockUserId,
    intercomId: mockIntercomId,
  };

  const intercom = vi.fn();
  window.Intercom = intercom;

  let rendered;

  beforeEach(() => {
    vi.resetAllMocks();
    useRootStore.mockReturnValue({
      userStore: {
        user: mockUser,
        userAppMetadata: mockUserAppMetadata,
      },
      tenantStore: { currentTenantId: mockStateCode },
    });
    rendered = renderHook(() => useIntercom());
  });

  it("should update intercom with user data", () => {
    expect(intercom).toHaveBeenCalledWith("update", {
      state_code: mockStateCode,
      name: mockName,
      nickname: mockNickname,
      email: mockEmail,
      user_id: mockUserId,
      user_hash: mockIntercomId,
      hide_default_launcher: false,
    });
  });

  it("should update intercom if user data changed", () => {
    const mockNewName = "some new user name";
    mockUser.name = mockNewName;

    useRootStore.mockReturnValue({
      userStore: { user: mockUser, userAppMetadata: mockUserAppMetadata },
      tenantStore: { currentTenantId: mockStateCode },
    });

    rendered.rerender();

    expect(intercom).toHaveBeenCalledTimes(2);
    expect(intercom).toHaveBeenLastCalledWith("update", {
      state_code: mockStateCode,
      name: mockNewName,
      nickname: mockNickname,
      email: mockEmail,
      user_id: mockUserId,
      user_hash: mockIntercomId,
      hide_default_launcher: false,
    });
  });

  it("should hide intercom on unmount", () => {
    rendered.unmount();

    expect(intercom).toHaveBeenCalledTimes(2);
    expect(intercom).toHaveBeenLastCalledWith("update", {
      hide_default_launcher: true,
    });
  });
});

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

import { render } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import { Mock } from "vitest";

import { useUserStore } from "../../../components/StoreProvider";
import { UserAvatar } from "../UserAvatar";

vi.mock("../../../components/StoreProvider");

describe("UserAvatar tests", () => {
  const renderAvatar = (name: string, picture: string) => {
    const userStore = {
      user: {
        name,
        picture,
      },
    };
    (useUserStore as Mock).mockReturnValue(userStore);
    return render(
      <Router>
        <UserAvatar />
      </Router>,
    );
  };

  it("renders a span with the first letter of the user's name when the profile image is from Gravatar", () => {
    const { container } = renderAvatar(
      "Essun",
      "https://s.gravatar.com/avatar/foo",
    );
    const avatarInitials = container.querySelector(".UserAvatar > div");
    expect(avatarInitials).toHaveTextContent("E");
  });

  it("renders an image when the profile icon is not from Gravatar.", () => {
    const { container } = renderAvatar(
      "Essun",
      "https://the-fulcrum.com/avatar/indite",
    );
    const avatarImage = container.querySelector(
      ".UserAvatar > div",
    ) as HTMLElement;
    expect(avatarImage?.style.backgroundImage).toEqual(
      `url(https://the-fulcrum.com/avatar/indite)`,
    );
  });
});

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Sans12, Sans16 } from "@recidiviz/design-system";
import toast from "react-hot-toast";

import { breakpoints } from "../hooks/useIsMobile";

type DesktopLinkGateOptions = {
  minWidth?: keyof typeof breakpoints;
  headline: string;
  body?: string;
};

export const desktopLinkGate =
  ({ minWidth, headline, body }: DesktopLinkGateOptions) =>
  (e: React.MouseEvent) => {
    if (window.innerWidth > breakpoints[minWidth ?? "laptop"]) {
      return;
    }
    e.preventDefault();
    return toast(
      (t) => (
        <div>
          <Sans16>{headline}</Sans16>
          <Sans12>{body ?? "View on desktop or increase window size"}</Sans12>
        </div>
      ),
      {
        duration: 5000,
        id: "link-gate", // prevents duplicate toasts
        style: { paddingRight: "2.5rem" },
      }
    );
  };

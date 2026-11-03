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

import { useEffect, useState } from "react";

import { useScrollTipStore } from "./scrollTipStore";

const SHOW_DELAY_MS = 3000;
const MAX_TIMES_SHOWN = 2;

type Status = "waiting" | "visible" | "dismissed";

type Params = {
  enabled: boolean;
};

export const useScrollTip = ({ enabled }: Params) => {
  const isEligible = useScrollTipStore((s) => s.shownCount < MAX_TIMES_SHOWN);
  const markShown = useScrollTipStore((s) => s.markShown);
  const [status, setStatus] = useState<Status>("waiting");

  useEffect(() => {
    if (!enabled || !isEligible || status !== "waiting") return;
    const timeout = setTimeout(() => {
      setStatus("visible");
      markShown();
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [enabled, isEligible, status, markShown]);

  return {
    isVisible: status === "visible",
    dismiss: () => setStatus("dismissed"),
  };
};

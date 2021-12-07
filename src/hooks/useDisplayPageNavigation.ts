// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { useRootStore } from "../components/StoreProvider";

const useDisplayPageNavigation = (): boolean => {
  const { userStore } = useRootStore();
  const { pathname } = useLocation();
  const view = pathname.split("/")[1];
  const navigationLayout = userStore.userAllowedNavigation;
  const pageOptions = useMemo(() => navigationLayout[view] ?? [], [
    navigationLayout,
    view,
  ]);

  const [isDisplayPageNavigation, setIsDisplayPageNavigation] = useState(
    pageOptions.length > 1
  );

  useEffect(() => {
    setIsDisplayPageNavigation(pageOptions.length > 1);
  }, [pageOptions]);

  return isDisplayPageNavigation;
};

export default useDisplayPageNavigation;

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

import { observer } from "mobx-react-lite";
import { Navigate, Route, Routes } from "react-router-dom";

import Loading from "../components/Loading";
import { useUserStore } from "../components/StoreProvider";
import DashboardLayout from "../core/DashboardLayout";
import Profile from "../core/Profile";
import useAuth from "../hooks/useAuth";
import LanternLayout from "../lantern/LanternLayout";
import RedirectHome from "../RedirectHome";

const ProtectedLayout = observer(function ProtectedLayout() {
  const { userIsLoading } = useUserStore();
  useAuth();

  if (userIsLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path="/profile" element={<Profile />} />
      <Route path="/" element={<RedirectHome />} />
      <Route path="/*" element={<DashboardLayout />} />
      <Route path="/community/revocations" element={<LanternLayout />} />
      <Route
        path="/revocations"
        element={<Navigate replace to="/community/revocations" />}
      />
    </Routes>
  );
});

export default ProtectedLayout;
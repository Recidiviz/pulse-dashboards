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

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useUserStore } from "../datastores/StoreProvider";

/**
 * Triggers Auth0 authentication once the user is not yet authorized.
 */
const useAuth = () => {
  const userStore = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      await userStore.authorize(
        (targetUrl: string) => {
          const url = new URL(targetUrl);
          navigate(url.pathname, { replace: true });
        },
        { redirectIfUnauthenticated: false },
      );

      if (!userStore.isAuthorized && !userStore.userIsLoading) {
        navigate("/login", { replace: true });
      }
    })();
    // userStore and navigate are stable references — intentionally run once
  }, [userStore, navigate]);

  if (userStore.authError) throw userStore.authError;
};

export default useAuth;

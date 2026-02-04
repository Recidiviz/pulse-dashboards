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

import { Loading as LoadingSpinner } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { ReactNode } from "react";
import styled from "styled-components";

import useAuth from "../../useAuth";
import { useUserStore } from "../StoreProvider";

const LoadingContainer = styled.div`
  position: fixed;
  left: calc(50% - 45px);
  top: calc(50% - 45px);
`;

type AuthProviderProps = {
  children: ReactNode;
};

const AuthProvider = observer(function AuthProvider({
  children,
}: AuthProviderProps) {
  const { userIsLoading } = useUserStore();

  useAuth();

  if (userIsLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    );
  }
  return <>{children}</>;
});

export default AuthProvider;

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

import { Loading } from "@recidiviz/design-system";
import { captureException } from "@sentry/react";
import { observer } from "mobx-react-lite";
import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { castToError } from "~hydration-utils";

import { AuthClient } from "../models/AuthClient";
import { NotAuthorized } from "./NotAuthorized";

export const HandleRedirectAfterLogin: FC<{
  authClient: AuthClient;
  defaultRedirectPath?: string;
}> = observer(function HandleRedirectAfterLogin({
  authClient,
  defaultRedirectPath,
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<Error | undefined>();

  useEffect(() => {
    authClient
      .handleRedirectFromLogin(navigate, defaultRedirectPath)
      .catch((r) => {
        captureException(r);
        setError(castToError(r));
      });
  });

  if (error) return <NotAuthorized />;

  return <Loading />;
});

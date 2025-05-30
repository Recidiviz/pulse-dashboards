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

import React from "react";

import ErrorLogo from "../../assets/static/images/error_logo.svg?react";
import useLogout from "../../hooks/useLogout";
import { StatusMessage } from ".";

export const ErrorMessage: React.FC = () => {
  const logout = useLogout();

  const onReload = () => {
    window.location.reload();
  };

  return (
    <StatusMessage
      icon={<ErrorLogo />}
      title="Sorry, we’re having trouble loading this page"
      subtitle={
        <>
          Try reloading the page. If that doesn’t work, log out and log back in.
          <br />
          Contact us at{" "}
          <a href="mailto:feedback@recidiviz.org">feedback@recidiviz.org</a> if
          the issue continues.
        </>
      }
    >
      <button type="button" onClick={onReload}>
        Reload
      </button>
      <button type="button" onClick={logout}>
        Log out
      </button>
    </StatusMessage>
  );
};

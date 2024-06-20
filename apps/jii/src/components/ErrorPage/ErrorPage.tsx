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

import { Body16, Body19, Header34 } from "@recidiviz/design-system";
import { ReactElement } from "react";
import { Link } from "react-router-dom";

import { BaseLayout } from "../BaseLayout/BaseLayout";

export const ErrorPage = ({ error }: { error: Error }): ReactElement => {
  return (
    <BaseLayout>
      <Header34>Something went wrong</Header34>
      <Body19>
        An error occurred that prevented this page from loading. Please try
        reloading the page, or <Link to="/">return to your homepage</Link>.
      </Body19>
      <Body16>
        <em>
          [{error.name}] {error.message}
        </em>
      </Body16>
    </BaseLayout>
  );
};

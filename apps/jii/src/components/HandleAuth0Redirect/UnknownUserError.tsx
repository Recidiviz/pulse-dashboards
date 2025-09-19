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

import { Body19, Header34 } from "@recidiviz/design-system";
import { FC, ReactElement } from "react";
import { useTypedSearchParams } from "react-router-typesafe-routes/dom";

import { PageContainer, usePageTitle } from "~@jii/common-ui";
import { AfterLogin } from "~@jii/paths";
import { useCommonTranslations } from "~@jii/translation";
import { UsMaUnknownUserError } from "~@jii/US_MA";

const GenericError = (): ReactElement => {
  const { t } = useCommonTranslations();

  const title = t(($) => $.unknownUser.heading);
  usePageTitle(title);

  return (
    <PageContainer>
      <Header34>{title}</Header34>
      <Body19>{t(($) => $.unknownUser.body)}</Body19>
    </PageContainer>
  );
};

// This should correspond to the error string we compose in our auth0 actions
// when roster lookup fails
const stateCodeErrorRegex = /\(state code: ([A-Z]{2}_[A-Z]{2})\)/;

function stateCodeFromError(error: string | undefined): string | undefined {
  return error?.match(stateCodeErrorRegex)?.[1];
}

export const UnknownUserError: FC = () => {
  const [{ error_description }] = useTypedSearchParams(AfterLogin);

  const stateCode = stateCodeFromError(error_description);

  switch (stateCode) {
    case "US_MA":
      return <UsMaUnknownUserError />;
    default:
      return <GenericError />;
  }
};

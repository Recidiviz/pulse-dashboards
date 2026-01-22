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

import dedent from "dedent";

import { CopyWrapper, PageContainer } from "~@jii/common-ui";
import { useCommonTranslations } from "~@jii/translation";

type ErrorPageProps = {
  error: Error;
};

const ErrorPageMainContentWrapped = ({ error }: ErrorPageProps) => {
  const { t } = useCommonTranslations();

  const contents = dedent`# ${t(($) => $.errorPage.heading)}

  ${t(($) => $.errorPage.message)}

  <em>[${error.name}] ${error.message}</em>
  `;

  return (
    <PageContainer>
      <CopyWrapper>{contents}</CopyWrapper>
    </PageContainer>
  );
};

// When used as a Sentry fallback function this will be called within the body of a class component,
// which means it can't contain any React hook calls. This extra wrapper prevents the component
//  from breaking in that context and should have no effect otherwise
export const ErrorPageMainContent = (props: ErrorPageProps) => (
  <ErrorPageMainContentWrapped {...props} />
);

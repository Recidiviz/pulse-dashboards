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

import { withCopyWrapperOverrides } from "~@jii/common-ui";
import { DefinitionPage } from "~@jii/layout";
import { AboutVideoCta } from "~@jii/onboarding-video";
import { useUsNdTranslations } from "~@jii/translation";

const CopyWrapperWithCustomComponents = withCopyWrapperOverrides({
  AboutVideoCta: { component: AboutVideoCta, props: { onHomepage: false } },
});

export const SentenceDatesDrilldownPage = () => {
  const { t } = useUsNdTranslations();

  return (
    <DefinitionPage
      backLinkProps={{
        to: "../../",
      }}
      heading={t(($) => $.pages.sentenceDates.heading)}
      body={t(($) => $.pages.sentenceDates.body)}
      CopyWrapperOverride={CopyWrapperWithCustomComponents}
    />
  );
};

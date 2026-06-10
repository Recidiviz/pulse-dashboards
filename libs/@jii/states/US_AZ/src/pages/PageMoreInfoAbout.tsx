// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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

import { usePageTitle, withCopyWrapperOverrides } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";

import { AboutVideoCta } from "../components/AboutVideoCta/AboutVideoCta";
import { DefinitionView } from "../components/DefinitionView";
import { useInfoPageFooterLinks } from "../hooks/useInfoPageFooterLinks";

const CopyWrapperWithCustomComponents = withCopyWrapperOverrides({
  AboutVideoCta: { component: AboutVideoCta, props: { onHomePage: false } },
});

export function PageMoreInfoAbout() {
  const { t } = useUsAzTranslations();

  usePageTitle(t(($) => $.about.heading));

  return (
    <DefinitionView
      heading={t(($) => $.about.heading)}
      body={t(($) => $.about.body)}
      moreInfoPageLinks={useInfoPageFooterLinks()}
      CopyWrapperOverride={CopyWrapperWithCustomComponents}
    />
  );
}

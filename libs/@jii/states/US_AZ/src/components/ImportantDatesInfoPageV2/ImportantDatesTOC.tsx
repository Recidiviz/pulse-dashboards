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

import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { SlateCopy } from "~@jii/common-ui";
import { clickableText } from "~@jii/common-ui";
import { useUsAzTranslations } from "~@jii/translation";
import { spacing } from "~design-system";

import { ImportantDatesFAQPresenter } from "./ImportantDatesFAQPresenter";

const TOCList = styled.ol`
  list-style-type: none;
  padding: 0;
  margin-bottom: ${rem(spacing.xl)};

  li {
    margin-bottom: ${rem(spacing.md)};
  }

  a {
    ${clickableText}
  }
`;

export const ImportantDatesTOC = observer(function ImportantDatesTOC({
  presenter,
}: {
  presenter: ImportantDatesFAQPresenter;
}) {
  const { t } = useUsAzTranslations();

  return (
    <>
      <TOCList>
        {presenter.nonDateSectionHashes.map((hash) => (
          <li key={hash}>
            <Link to={`#${hash}`}>
              {/* @ts-expect-error This is a list of keys from the object but the types are lost by Object.keys */}
              {t(($) => $.importantDatesInfoPage.generalFAQ[hash].header)}
            </Link>
          </li>
        ))}
      </TOCList>

      <SlateCopy>
        {presenter.isViewingAllDates
          ? t(($) => $.importantDatesInfoPage.allDates)
          : t(($) => $.importantDatesInfoPage.personalDates)}
      </SlateCopy>

      <TOCList>
        {presenter.dateHashes.map((hash) => (
          <li key={hash}>
            <Link to={`#${hash}`}>
              {t(($) => $.importantDatesFAQ[hash].header)}
            </Link>
          </li>
        ))}
      </TOCList>
    </>
  );
});

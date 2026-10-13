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

import { GoLink } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import {
  defaultComponents,
  SentenceDatesComponents,
} from "~@jii/sentence-dates";
import { useUsMaTranslations } from "~@jii/translation";

export const DateCardBodyWrapperOverride: SentenceDatesComponents["DateCardBodyWrapper"] =
  ({ children, ...props }) => {
    const { t } = useUsMaTranslations();

    return (
      <defaultComponents.DateCardBodyWrapper {...props}>
        {children}
        {props.datePresenter.id === "rts" && (
          <GoLink
            to={State.Resident.EGT.$.Definition.buildRelativePath({
              pageSlug: "rts",
            })}
          >
            {t(($) => $.home.dates.rts.moreInfoLink)}
          </GoLink>
        )}
      </defaultComponents.DateCardBodyWrapper>
    );
  };

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

import { Card, GoButton, SlateCopy } from "~@jii/common-ui";
import { State } from "~@jii/paths";
import { useUsMaTranslations } from "~@jii/translation";

import { useEGTDataContext } from "../../EGTDataContext/context";
import { DateInfo } from "./DateInfo";

export const RTSCard = () => {
  const { data } = useEGTDataContext();
  const { t } = useUsMaTranslations();

  return (
    <Card>
      <DateInfo
        {...t(($) => $.home.dates.rts, { returnObjects: true, ...data })}
        tag={t(($) => $.tags.rts)}
      />
      <SlateCopy options={{ forceBlock: true }}>
        {t(($) => $.home.dates.rts.summary)}
      </SlateCopy>
      <GoButton
        to={State.Resident.EGT.$.Definition.buildRelativePath({
          pageSlug: "rts",
        })}
      >
        {t(($) => $.home.dates.rts.moreInfoLink)}
      </GoButton>
    </Card>
  );
};

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

import { observer } from "mobx-react-lite";

import { Card, SlateCopy } from "~@jii/common-ui";
import { BulletTimeline } from "~@jii/earned-good-time";
import { useUsMaTranslations } from "~@jii/translation";

import { useEGTDataContext } from "../../EGTDataContext/context";
import { DateInfo } from "./DateInfo";

const AdjustmentBreakdown = observer(function AdjustmentBreakdown() {
  const { data } = useEGTDataContext();
  const { t } = useUsMaTranslations();
  const items = [
    t(($) => $.home.dates.maxRelease.breakdown.original, {
      returnObjects: true,
      ...data,
    }),
    // have to access these segments individually because returnObjects doesn't support plurals
    {
      label: t(($) => $.home.dates.maxRelease.breakdown.change.label),
      value: t(($) => $.home.dates.maxRelease.breakdown.change.value, {
        count: data.totalStateCreditDaysCalculated,
      }),
    },
    t(($) => $.home.dates.maxRelease.breakdown.adjusted, {
      returnObjects: true,
      ...data,
    }),
  ];

  return (
    <div>
      <SlateCopy>
        {t(($) => $.home.dates.maxRelease.summary, {
          count: data.totalStateCreditDaysCalculated,
        })}
      </SlateCopy>
      <BulletTimeline items={items} />
    </div>
  );
});

export const MAXCard = observer(function MAXCard() {
  const { data } = useEGTDataContext();
  const { t } = useUsMaTranslations();

  return (
    <Card>
      <DateInfo
        label={t(($) => $.home.dates.maxRelease.label)}
        value={t(($) => $.home.dates.maxRelease.value, data)}
        tag={t(($) => $.tags.maxRelease)}
      />
      {!!data.totalStateCreditDaysCalculated && <AdjustmentBreakdown />}
    </Card>
  );
});

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
import { hydrateTemplate } from "~@jii/data";
import { BulletTimeline } from "~@jii/earned-good-time";

import {
  EGTDataContext,
  useEGTDataContext,
} from "../../EGTDataContext/context";
import { DateInfo } from "./DateInfo";

const formatBreakdownItem = (
  { label, value }: { label: string; value: string },
  data: EGTDataContext["data"],
) => ({
  label,
  value: hydrateTemplate(value, data),
});

const AdjustmentBreakdown = observer(function AdjustmentBreakdown() {
  const {
    data,
    copy: {
      home: {
        dates: {
          maxRelease: { breakdown, summary },
        },
      },
    },
  } = useEGTDataContext();

  // const items = dates.ma.map(({label, value}) => ({label, value: hydrateTemplate(value)}))
  const items = [
    formatBreakdownItem(breakdown.original, data),
    formatBreakdownItem(breakdown.change, data),
    formatBreakdownItem(breakdown.adjusted, data),
  ];

  return (
    <div>
      <SlateCopy>{hydrateTemplate(summary, data)}</SlateCopy>
      <BulletTimeline items={items} />
    </div>
  );
});

export const MAXCard = observer(function MAXCard() {
  const {
    data,
    copy: {
      home: { dates },
      tags,
    },
  } = useEGTDataContext();

  return (
    <Card>
      <DateInfo {...dates.maxRelease} tag={tags.maxRelease} />
      {!!data.totalStateCreditDaysCalculated && <AdjustmentBreakdown />}
    </Card>
  );
});

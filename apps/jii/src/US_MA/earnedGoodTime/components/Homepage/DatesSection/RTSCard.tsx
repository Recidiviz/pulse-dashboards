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

import { Card } from "../../../../../common/components/Card";
import { GoButton } from "../../../../../components/ButtonLink/GoButton";
import { State } from "../../../../../routes/routes";
import { useEGTDataContext } from "../../EGTDataContext/context";
import { SlateCopy } from "../styles";
import { DateInfo } from "./DateInfo";

export const RTSCard = () => {
  const {
    copy: {
      home: { dates },
    },
  } = useEGTDataContext();

  return (
    <Card>
      <DateInfo {...dates.rts} />
      <SlateCopy>{dates.rts.summary}</SlateCopy>
      <GoButton
        to={State.Resident.EGT.$.Definition.buildRelativePath({
          pageSlug: "rts",
        })}
      >
        {dates.rts.moreInfoLink}
      </GoButton>
    </Card>
  );
};

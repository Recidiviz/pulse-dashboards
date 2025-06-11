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
import { useEGTDataContext } from "../../EGTDataContext/context";
import { SectionHeading, SlateCopy } from "../styles";
import { DateInfo } from "./DateInfo";
import { MAXCard } from "./MAXCard";
import { RTSCard } from "./RTSCard";

export const DatesSection = () => {
  const {
    data,
    copy: {
      home: { dates },
    },
  } = useEGTDataContext();

  // if we have an RTS date or if both dates are null, put RTS first
  const showRTSFirst = !!(data.rtsDate || !data.adjustedMaxReleaseDate);

  return (
    <section>
      <SectionHeading>{dates.sectionTitle}</SectionHeading>
      {showRTSFirst ? (
        <>
          <RTSCard />
          <MAXCard />
        </>
      ) : (
        <>
          <MAXCard />
          <RTSCard />
        </>
      )}
      <Card>
        <DateInfo {...dates.parole} muted />
        <SlateCopy>{dates.parole.summary}</SlateCopy>
      </Card>
    </section>
  );
};

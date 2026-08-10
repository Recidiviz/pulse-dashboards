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

import { ReactNode, useState } from "react";

import { DatePicker } from "./DatePicker";
import { MonthYearHeader } from "./MonthYearHeader";

// Required by the custom CSF indexer. Title auto-derives from the file path.
export default {};

const Frame = ({ children }: { children: ReactNode }) => (
  <div style={{ width: 320, padding: 24 }}>{children}</div>
);

export const MonthYearPicker = () => {
  const [selected, setSelected] = useState<Date | null>(new Date());
  return (
    <Frame>
      <DatePicker
        selected={selected}
        onChange={setSelected}
        inline
        showMonthYearPicker
        dateFormat="MM/yyyy"
        renderCustomHeader={(headerProps) => (
          <MonthYearHeader {...headerProps} />
        )}
      />
    </Frame>
  );
};

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2021 Recidiviz, Inc.
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
import "./ChartNote.scss";

import React from "react";

type Props = {
  note: string;
  isLoading?: boolean;
};

const ChartNote: React.FC<Props> = ({ note, isLoading = false }) => {
  if (isLoading || !note) {
    return (
      <div className="ChartNote">
        <br />
      </div>
    );
  }

  return (
    <div className="ChartNote">
      <strong>Note: </strong>
      {/* TODO add link when methodology is ready */}
      {note} See full methodology.
    </div>
  );
};

export default ChartNote;

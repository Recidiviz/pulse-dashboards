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
import { FC } from "react";

import { Button } from "~design-system";

import { ResultsPagePresenter } from "./ResultsPagePresenter";

export const RNAPrintButton: FC<{
  presenter: ResultsPagePresenter;
}> = observer(function RNAPrintButton({ presenter }) {
  if (!["SUBMITTED_BY_STAFF", "COMPLETE"].includes(presenter.status)) {
    return null;
  }
  return (
    <Button shape={"block"} onClick={() => window.print()}>
      Print self-report responses
    </Button>
  );
});

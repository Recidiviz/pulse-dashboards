// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2023 Recidiviz, Inc.
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

import { Link, useParams } from "react-router-dom";

import OutliersNavLayout from "../OutliersNavLayout";
import { OUTLIERS_PATHS } from "../views";

const OutliersSupervisor = () => {
  const { supervisorId }: { supervisorId: string } = useParams();

  return (
    <OutliersNavLayout>
      Hello, supervisor {supervisorId} <br />
      <Link
        to={{
          pathname: `${OUTLIERS_PATHS.supervision}/staff/${supervisorId}o1`,
        }}
      >
        Officer 1
      </Link>
      <br />
      <Link
        to={{
          pathname: `${OUTLIERS_PATHS.supervision}/staff/${supervisorId}o2`,
        }}
      >
        Officer 2
      </Link>
    </OutliersNavLayout>
  );
};

export default OutliersSupervisor;

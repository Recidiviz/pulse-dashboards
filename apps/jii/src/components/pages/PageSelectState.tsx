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
import { Link } from "react-router-dom";

import { stateConfigs } from "../../configs/stateConstants";
import { State } from "../../routes/routes";
import { NotFound } from "../NotFound/NotFound";
import { useRootStore } from "../StoreProvider/useRootStore";

export const PageSelectState = observer(function PageSelectState() {
  const {
    userStore: { isRecidivizUser },
  } = useRootStore();

  if (!isRecidivizUser) return <NotFound />;

  return (
    <div>
      {stateConfigs.map((c) => (
        <p key={c.stateCode}>
          <Link to={State.buildPath({ stateSlug: c.urlSlug })}>
            {c.displayName}
          </Link>
        </p>
      ))}
    </div>
  );
});

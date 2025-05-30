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

import { ResidentsConfig } from "./types";

export const home: ResidentsConfig["home"] = {
  footer: {
    about: {
      title: "About this app",
      body: `This app is made by Recidiviz, a technology nonprofit.  
      It is free to access. The information updates daily.`,
    },
    contact: {
      title: "Contact us",
      body: `1322 Webster St, Suite 402  
      Oakland, CA 94612`,
    },
  },
};

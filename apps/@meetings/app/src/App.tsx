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

import "../global.css";

import React from "react";
import { Auth0Provider } from "react-native-auth0";

import config from "~@meetings/app/auth0-config";

import AppNavigator from "./navigation/AppNavigator";

const App = () => {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <AppNavigator />
    </Auth0Provider>
  );
};

export default App;

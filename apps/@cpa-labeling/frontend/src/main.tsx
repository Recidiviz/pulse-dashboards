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

import "./index.css";

import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "login.recidiviz.org";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
const audience =
  import.meta.env.VITE_AUTH0_AUDIENCE || "https://api.recidiviz.org";

if (!clientId && import.meta.env.PROD) {
  throw new Error("VITE_AUTH0_CLIENT_ID is required in production");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
);

// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2020 Recidiviz, Inc.
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

import "react-app-polyfill/ie11";
import "react-app-polyfill/stable";
import "./index.css";

import { createRoot } from "react-dom/client";
import ReactModal from "react-modal";

import App from "./App";
import * as serviceWorker from "./serviceWorker";

// safe to assert that this exists, see index.html
const container = document.getElementById("root") as HTMLElement;

createRoot(container).render(<App />);
ReactModal.setAppElement(container);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
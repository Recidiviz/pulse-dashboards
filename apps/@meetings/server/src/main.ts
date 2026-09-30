// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { buildServer } from "~@meetings/server/server";
import { cleanupStaleLocalFiles } from "~@meetings/tasks";
import { startServer } from "~server-setup-plugin";

// No-op outside local mode. Runs on every restart (including `--watch`
// reloads), so it only removes recordings that are old enough to have
// passed a realistic TTL rather than wiping everything.
cleanupStaleLocalFiles(7);

const server = buildServer();

startServer(server, { defaultPort: 3002, hot: import.meta.hot });

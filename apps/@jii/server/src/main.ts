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

import { startServer } from "~server-setup-plugin";

import { buildServer } from "./server";

const server = buildServer();

await startServer(server, { defaultPort: 4210 });

// CPU spent since process start, compared against wall time, shows whether startup
// is busy computing (user), busy in the kernel (system), or waiting
const { user, system } = process.cpuUsage();
server.log.info(
  {
    userCpuSeconds: user / 1e6,
    systemCpuSeconds: system / 1e6,
    uptimeSeconds: process.uptime(),
  },
  "startup cpu usage",
);

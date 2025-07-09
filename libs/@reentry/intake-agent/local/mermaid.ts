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

import fs from "fs/promises";
import path from "path";

import { builder } from "~@reentry/intake-agent/graph";

async function printMermaid() {
  const graph = builder.compile();

  const representation = await graph.getGraphAsync();
  const image = await representation.drawMermaidPng();
  const arrayBuffer = await image.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  // Write the buffer to a file called graph.png in the same directoryZ
  const filePath = path.join(__dirname, "graph.png");
  await fs.writeFile(filePath, buffer);
  console.log(`Saved graph.png to ${filePath}`);
}

printMermaid();

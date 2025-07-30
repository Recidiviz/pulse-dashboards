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

import Markdown from "markdown-to-jsx";
import React from "react";

import { TasksDescriptionContainer } from "./styles";

export const TasksDescription: React.FC<{ children: string }> = ({
  children,
}) => (
  <TasksDescriptionContainer>
    <Markdown
      options={{
        forceInline: true,
        overrides: {
          a: {
            props: {
              target: "_blank",
              rel: "noopener noreferrer",
            },
          },
        },
      }}
    >
      {children}
    </Markdown>
  </TasksDescriptionContainer>
);

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

"use client";

import Image from "next/image";
import { FC, memo, ReactNode } from "react";

import {
  ApplicationContextProvider,
  ImageComponentProps,
} from "~@reentry/frontend-shared";

import { $api } from "../api";
import { socket } from "../websockets/socket";
import { useAnalytics } from "./AnalyticsProvider";

const applicationContext = {
  socket,
  $api,
  Image: (props: ImageComponentProps) => <Image {...props} />,
  features: {
    enableSTT: true,
  },
};

export const IntakeIntegrationProvider: FC<{ children: ReactNode }> = memo(
  function IntakeIntegrationProvider({ children }) {
    const analytics = useAnalytics();

    return (
      <ApplicationContextProvider value={{ ...applicationContext, analytics }}>
        {children}
      </ApplicationContextProvider>
    );
  },
);

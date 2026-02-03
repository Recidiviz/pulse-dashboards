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

import { ComponentType, createContext } from "react";

import { useRequiredContext } from "~utils";

import { $Api } from "../api";
import { SocketConnection } from "../websockets/socket";

/**
 * This is a subset of NextJs Image props that we require here.
 * We can't depend directly on Next but consumers on other frameworks
 * need to provide an equivalent interface (some members may be no-ops)
 * if they are not applicable, e.g. in a SPA
 */
export type ImageComponentProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
};

type IntakeAnalyticsMetadata = {
  justiceInvolvedPersonPseudoId: string;
};

/**
 * Enumerates analytics tracking methods required for the features in this library.
 * Written with Segment in mind but not tied to any particular implementation across
 * apps.
 */
export interface IntakeAnalytics {
  trackIntakeChatClientLogin: (metadata: IntakeAnalyticsMetadata) => void;
  trackIntakeChatClientAddressSubmitted: (
    metadata: IntakeAnalyticsMetadata,
  ) => void;
  trackIntakeChatSttEvent: (
    eventName: string,
    metadata: IntakeAnalyticsMetadata,
  ) => void;
  trackIntakeChatTtsEvent: (
    eventName: string,
    metadata: IntakeAnalyticsMetadata,
  ) => void;
}

/**
 * Contains objects that depend on application-specific settings
 */
export type ApplicationContext = {
  $api: $Api;
  socket: SocketConnection;
  Image: ComponentType<ImageComponentProps>;
  analytics: IntakeAnalytics;
  features: {
    enableSTT: boolean;
  };
};

const context = createContext<ApplicationContext | undefined>(undefined);

export const ApplicationContextProvider = context.Provider;

export function useApplicationContext() {
  return useRequiredContext(context);
}

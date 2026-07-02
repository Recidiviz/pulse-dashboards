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

import React, { createContext, useContext } from "react";

import type { SAR, SARInsight } from "../../../api";
import type { ActiveFeatureVariants } from "../../../datastores/types";

/**
 * The complete data the PDF renders from: the raw `getSAR` tRPC response plus
 * the separately-fetched `getSARInsight` response (null when no insight covers
 * this offense/score bucket). Both flow through context so SAR-aware section
 * components read them via `useSAR()` instead of threading props down the tree.
 *
 * React Context works inside @react-pdf/renderer — it uses its own React
 * reconciler, and the Provider is a transparent (non-host) node, so it resolves
 * normally in the headless `pdf().toBlob()` path too.
 */
export interface SARContextValue {
  sar: SAR;
  insight: NonNullable<SARInsight> | null;
  activeFeatureVariants: ActiveFeatureVariants;
}

const SARContext = createContext<SARContextValue | null>(null);

export const SARProvider: React.FC<{
  sar: SAR;
  insight?: SARInsight | null;
  activeFeatureVariants: ActiveFeatureVariants;
  children: React.ReactNode;
}> = ({ sar, insight, activeFeatureVariants, children }) => (
  <SARContext.Provider
    value={{ sar, insight: insight ?? null, activeFeatureVariants }}
  >
    {children}
  </SARContext.Provider>
);

/** Read the SAR + insight from context. Throws if used outside `SARProvider`. */
export const useSAR = (): SARContextValue => {
  const value = useContext(SARContext);
  if (!value) {
    throw new Error("useSAR must be used within a SARProvider");
  }
  return value;
};

/** Read just the active feature variants from context. Throws if used outside `SARProvider`. */
export const useActiveFeatureVariants = (): ActiveFeatureVariants =>
  useSAR().activeFeatureVariants;

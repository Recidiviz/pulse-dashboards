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

import { StateLandingPageConfig } from "../../types";

const config: Omit<StateLandingPageConfig, "connections"> = {
  copy: {
    intro: `# Check if you’re eligible for opportunities like work release and home confinement.

Work Release and the Supervised Community Confinement Program (SCCP) allow residents to 
**spend the last part of their sentence living or working in the community.** Learn 
about these programs and check which requirements you’ve met.`,
    selectorLabel: "Select your facility to log in to Opportunities",
    selectorPlaceholder: "Select a facility …",
    useCases: {
      intro: "**Use this website to answer questions like …**",
      examples: [
        {
          icon: "PencilRuler",
          description:
            "How do Work Release and SCCP work? What are the rules and expectations?",
        },
        {
          icon: "Todo",
          description:
            "What do I need to do to become eligible? Have I met those requirements?",
        },
        {
          icon: "Paper",
          description:
            "What is the application and approval process for these programs?",
        },
      ],
    },
  },
};

/**
 * Returns config values matching the specified tenant, if it exists.
 * For convenience in scenarios such as test, offline, etc., connection values
 * will be empty strings, preserving the type structure.
 * @param tenantKey the only valid keys are "staging" and "production", but because we expect
 * this to be read from an environment variable in practice we will accept any string
 */
export function getConfig(tenantKey: string): StateLandingPageConfig {
  const connections = {
    MVCF: {
      displayName: "Mountain View Correctional Facility",
      connectionName: "",
    },
  };

  switch (tenantKey) {
    case "staging":
      connections.MVCF.connectionName =
        "ME-Mountain-View-AD-Staging-Connection";
      break;
    case "production":
      connections.MVCF.connectionName = "ME-Mountain-View-AD-Connection";
      break;
  }

  return { ...config, connections };
}

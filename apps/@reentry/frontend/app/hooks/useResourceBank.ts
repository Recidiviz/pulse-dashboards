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

import { useEffect, useState } from "react";

import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";

import type { ResourceSection, ResourceWithMeta } from "./resourceBank.types";
import { useMockRessourceAPICall } from "./useMockRessourceAPICall";

// Phase 2: replace with real $api.useMutation calls.
const mockAddResourceApi = async (
  section: string,
  resource: ResourceWithMeta,
): Promise<void> => {
  console.log("[mock] addResource", { section, resource });
  return new Promise((resolve) => setTimeout(resolve, 500));
};

const mockRemoveResourceApi = async (
  section: string,
  resourceId: string,
): Promise<void> => {
  console.log("[mock] removeResource", { section, resourceId });
  return new Promise((resolve) => setTimeout(resolve, 500));
};

export const useResourceBank = () => {
  const { data, isLoading, isError } = useMockRessourceAPICall();

  const [sections, setSections] = useState<ResourceSection[]>(
    () => data?.resources_by_sections ?? [],
  );

  // Re-initialise when mock data becomes available (e.g. after loading state).
  useEffect(() => {
    if (data) {
      setSections(data.resources_by_sections);
    }
  }, [data]);

  const appendResourceToSection = (
    sectionTitle: string,
    resource: ResourceWithMeta,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.title === sectionTitle
          ? { ...s, resources: [...s.resources, resource] }
          : s,
      ),
    );
  };

  const removeResourceFromSection = (
    sectionTitle: string,
    resourceId: string,
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.title === sectionTitle
          ? { ...s, resources: s.resources.filter((r) => r.id !== resourceId) }
          : s,
      ),
    );
  };

  const addResource = (
    sectionTitle: string,
    resource: ResourceWithMeta,
  ): void => {
    const current =
      sections.find((s) => s.title === sectionTitle)?.resources ?? [];
    if (current.some((r) => r.id === resource.id)) {
      showInfoToast(`${resource.name} is already in ${sectionTitle}.`);
      return;
    }
    if (current.length >= 20) {
      showErrorToast("Cannot add more than 20 resources per section.");
      return;
    }
    appendResourceToSection(sectionTitle, resource);

    mockAddResourceApi(sectionTitle, resource).then(
      () =>
        showSuccessToast(
          `${resource.name} added to ${sectionTitle} resources.`,
        ),
      () => {
        showErrorToast(
          `Failed to add ${resource.name} to ${sectionTitle} resources.`,
        );
        removeResourceFromSection(sectionTitle, resource.id);
      },
    );
  };

  const removeResource = (sectionTitle: string, resourceId: string): void => {
    const removed = sections
      .find((s) => s.title === sectionTitle)
      ?.resources.find((r) => r.id === resourceId);

    removeResourceFromSection(sectionTitle, resourceId);

    mockRemoveResourceApi(sectionTitle, resourceId).then(
      () =>
        showSuccessToast(
          `${removed?.name} removed from ${sectionTitle} resources.`,
        ),
      () => {
        showErrorToast(
          `Failed to remove ${removed?.name} from ${sectionTitle} resources.`,
        );
        if (removed) appendResourceToSection(sectionTitle, removed);
      },
    );
  };

  return {
    sections,
    addResource,
    removeResource,
    isLoading,
    isError,
  };
};

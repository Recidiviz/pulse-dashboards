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

import { useAuth } from "~@reentry/frontend/lib/auth/authContext";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "~@reentry/frontend-shared";
import type { components } from "~@reentry/openapi-types";

import { $api } from "../api";
import type { ResourceSection } from "./resourceBank.types";

type Resource = components["schemas"]["Resource"];

export const useResourceBank = (planGenerationId: string | undefined) => {
  const { getAccessToken } = useAuth();
  const { data, isLoading, isError, refetch } = $api.useQuery(
    "get",
    "/plan-generation/{plan_gen_id}/active-resources",
    {
      params: { path: { plan_gen_id: planGenerationId ?? "" } },
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
      },
    },
    { enabled: Boolean(planGenerationId) },
  );

  const [sections, setSections] = useState<ResourceSection[]>(
    () => (data?.resources_by_sections as ResourceSection[]) ?? [],
  );

  const { mutateAsync: addResourceMutation } = $api.useMutation(
    "post",
    "/add-resource",
  );

  const { mutateAsync: removeResourceMutation } = $api.useMutation(
    "post",
    "/remove-resource",
  );

  useEffect(() => {
    if (data) {
      setSections(data.resources_by_sections as ResourceSection[]);
    }
  }, [data]);

  const appendResourceToSection = (
    sectionTitle: string,
    resource: Resource,
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

  const addResource = (sectionTitle: string, resource: Resource): void => {
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

    if (!planGenerationId) {
      showErrorToast(
        `Failed to add ${resource.name} to ${sectionTitle} resources.`,
      );
      removeResourceFromSection(sectionTitle, resource.id);
      return;
    }

    if (resource.resource_id == null) {
      showErrorToast(
        `Failed to add ${resource.name} to ${sectionTitle} resources.`,
      );
      removeResourceFromSection(sectionTitle, resource.id);
      return;
    }

    addResourceMutation({
      body: {
        resource_id: resource.resource_id,
        section_title: sectionTitle,
        plan_generation_id: planGenerationId,
      },
    }).then(
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

    if (!removed) return;

    removeResourceFromSection(sectionTitle, resourceId);

    if (!planGenerationId) {
      showErrorToast(
        `Failed to remove ${removed.name} from ${sectionTitle} resources.`,
      );
      appendResourceToSection(sectionTitle, removed);
      return;
    }

    if (removed.resource_id == null) {
      showErrorToast(
        `Failed to remove ${removed.name} from ${sectionTitle} resources.`,
      );
      appendResourceToSection(sectionTitle, removed);
      return;
    }

    removeResourceMutation({
      body: {
        resource_id: removed.resource_id,
        section_title: sectionTitle,
        plan_generation_id: planGenerationId,
      },
    }).then(
      () =>
        showSuccessToast(
          `${removed.name} removed from ${sectionTitle} resources.`,
        ),
      () => {
        showErrorToast(
          `Failed to remove ${removed.name} from ${sectionTitle} resources.`,
        );
        appendResourceToSection(sectionTitle, removed);
      },
    );
  };

  return {
    sections,
    addResource,
    removeResource,
    refetch,
    isLoading,
    isError,
  };
};

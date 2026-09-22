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

import { FileText, Home as HomeIcon } from "lucide-react";

import { UsMaTFunction } from "~@jii/translation";

import {
  CompletedQuestionnaireCardCopy,
  GuideTopicConfig,
  QuestionnaireCardCopy,
  ResourceCategoryConfig,
} from "./types";

export const GUIDE_TOPICS: GuideTopicConfig[] = [
  {
    slug: "id-documents",
    icon: FileText,
    label: (t) => t(($) => $.reentry.overview.guideCta.idDocuments),
  },
  {
    slug: "housing-basics",
    icon: HomeIcon,
    label: (t) => t(($) => $.reentry.overview.guideCta.housingBasics),
  },
];

/**
 * Add a new entry here to add a new resource category card to the Overview
 * page - each renders its own icon + heading + description + CTA.
 */
export const RESOURCE_CATEGORIES: ResourceCategoryConfig[] = [
  {
    category: "housing",
    icon: HomeIcon,
    copy: (t) => ({
      heading: t(($) => $.reentry.overview.resourceCategories.housing.heading),
      description: t(
        ($) => $.reentry.overview.resourceCategories.housing.description,
      ),
      cta: t(($) => $.reentry.overview.resourceCategories.housing.cta),
    }),
  },
];

export const QUESTIONNAIRE_STATUS_COPY = {
  notStarted: (t: UsMaTFunction): QuestionnaireCardCopy => ({
    heading: t(($) => $.reentry.overview.questionnaireCta.notStarted.heading),
    description: t(
      ($) => $.reentry.overview.questionnaireCta.notStarted.description,
    ),
    cta: t(($) => $.reentry.overview.questionnaireCta.notStarted.cta),
  }),
  inProgress: (t: UsMaTFunction): QuestionnaireCardCopy => ({
    heading: t(($) => $.reentry.overview.questionnaireCta.inProgress.heading),
    description: t(
      ($) => $.reentry.overview.questionnaireCta.inProgress.description,
    ),
    cta: t(($) => $.reentry.overview.questionnaireCta.inProgress.cta),
  }),
  completed: (t: UsMaTFunction): CompletedQuestionnaireCardCopy => ({
    heading: t(($) => $.reentry.overview.questionnaireCta.completed.heading),
    recommendedTaskCount: (count) =>
      t(
        ($) =>
          $.reentry.overview.questionnaireCta.completed.recommendedTaskCount,
        { count },
      ),
    cta: t(($) => $.reentry.overview.questionnaireCta.completed.cta),
    reviewProfile: {
      heading: t(
        ($) => $.reentry.overview.questionnaireCta.reviewProfile.heading,
      ),
      description: t(
        ($) => $.reentry.overview.questionnaireCta.reviewProfile.description,
      ),
      cta: t(($) => $.reentry.overview.questionnaireCta.reviewProfile.cta),
    },
  }),
};

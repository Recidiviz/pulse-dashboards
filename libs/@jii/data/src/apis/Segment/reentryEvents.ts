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

import type { NoProperties } from "./types";

type QuestionnaireState = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type QuestionnaireExitScreen =
  | "intro"
  | "question"
  | "review_before_submit"
  | "review_profile"
  | "completion";

export type ReentryPage =
  | "home"
  | "checklist"
  | "topic_page"
  | "resource_explorer";

type HomeCta =
  | { cta: "questionnaire"; questionnaireState: QuestionnaireState }
  | { cta: "topic_page"; topicId: string }
  | { cta: "checklist" | "resource_explorer" };

/**
 * The Segment events for the Reentry questionnaire, checklist and the pages
 * around them, as defined in the Reentry PRD, by event name.
 */
export type ReentryEvents = {
  frontend_reentry_entrypoint_clicked: {
    entryPoint: "home_card" | "home_banner" | "global_nav";
  };
  frontend_reentry_local_nav_clicked: {
    departurePage: ReentryPage;
    topicId?: string;
    destination: Exclude<ReentryPage, "topic_page">;
  };
  frontend_reentry_home_cta_clicked: HomeCta;
  frontend_reentry_video_cta_clicked: {
    entryPoint: "top_banner" | "bottom_cta";
  };
  frontend_reentry_video_played: { positionSeconds: number };
  frontend_reentry_video_paused: { positionSeconds: number };
  frontend_reentry_video_closed: {
    positionSeconds: number;
    completed: boolean;
  };
  frontend_reentry_video_banner_dismissed: NoProperties;
  frontend_reentry_questionnaire_started: NoProperties;
  frontend_reentry_questionnaire_resumed: {
    // questionId is missing when every question is answered, so it opens on Review
    questionId?: string;
    questionsAnswered: number;
  };
  frontend_reentry_question_viewed: {
    questionId: string;
    sectionId: string;
    stepIndex: number;
    stepTotal: number;
    isEditingProfile: boolean;
  };
  frontend_reentry_question_answered: {
    questionId: string;
    sectionId: string;
    ratherNotSay: boolean;
  };
  frontend_reentry_question_back_clicked: {
    questionId: string;
    isEditingProfile: boolean;
  };
  frontend_reentry_questionnaire_exited: {
    trigger: "close" | "save_and_exit" | "go_to_checklist";
    screen: QuestionnaireExitScreen;
    questionId?: string;
  };
  frontend_reentry_questionnaire_completed: { ratherNotSayCount: number };
  frontend_reentry_questionnaire_end_cta_clicked: { cta: "checklist" | "home" };
  frontend_reentry_profile_edit_started: {
    entryPoint: "home" | "checklist" | "checklist_popover";
  };
  frontend_reentry_profile_edit_answer_saved: {
    questionId: string;
    ratherNotSay: boolean;
  };
  frontend_reentry_profile_edit_discarded: { questionId: string };
  frontend_reentry_checklist_viewed: {
    itemsTotal: number;
    itemsChecked: number;
    isPersonalized: boolean;
  };
  frontend_reentry_checklist_item_checked: {
    itemId: string;
    band: string;
    isPersonalizedItem: boolean;
  };
  frontend_reentry_checklist_item_unchecked: {
    itemId: string;
    band: string;
    isPersonalizedItem: boolean;
  };
  frontend_reentry_checklist_questionnaire_cta_clicked: {
    questionnaireState: QuestionnaireState;
  };
  frontend_reentry_checklist_why_opened: { itemId: string };
  frontend_reentry_topic_scrolled_to_end: { topicId: string };

  // Community Resource Explorer (CRE).
  // Search queries are logged server-side instead, so they never carry the resident's identity.
  frontend_cre_category_selected: { category: string };
  frontend_cre_subcategory_selected: {
    category: string;
    subcategory: string;
    isOpen: boolean;
  };
  frontend_cre_filters_updated: { category: string } & (
    | { subcategories: string[]; tags: string[] }
    // Selected option ids per filter group, so states can add groups
    // without changing this event. Used by every state but NYC.
    | { filters: Record<string, string[]> }
  );
  frontend_cre_filter_cleared: { category: string };
  frontend_cre_resource_viewed: {
    resourceId: number;
    resourceName: string;
    source: "category_list" | "similar_resources" | "search";
  };
  frontend_cre_description_toggled: {
    resourceId: number;
    resourceName: string;
    isExpanded: boolean;
  };
};

import {
  SUPERVISION_NEED_TYPES,
  SUPERVISION_TASK_TYPES,
  SupervisionNeedType,
} from "../../WorkflowsStore/Task/types";

export const SUPERVISION_TASK_CATEGORIES = [
  "DUE_THIS_MONTH",
  ...SUPERVISION_TASK_TYPES,
  ...SUPERVISION_NEED_TYPES,
] as const;
export type SupervisionTaskCategory =
  (typeof SUPERVISION_TASK_CATEGORIES)[number];

export const TASK_SELECTOR_LABELS: Record<SupervisionTaskCategory, string> = {
  DUE_THIS_MONTH: "Due this month",
  assessment: "Risk Assessments",
  contact: "Contacts",
  homeVisit: "Home Contacts",
  employment: "Unemployed",
};

export const NEED_DISPLAY_NAME: Record<SupervisionNeedType, string> = {
  employment: "Unemployed",
} as const;

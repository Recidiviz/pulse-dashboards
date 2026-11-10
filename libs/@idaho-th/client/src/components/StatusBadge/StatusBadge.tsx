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

import { observer } from "mobx-react-lite";
import React from "react";
import styled from "styled-components";

import {
  type ApplicationStatus,
  type ApplicationSubStage,
  type HomePlanApprovalsBadge,
  type ParoleCommissionDecision,
  USER_ROLE,
  type UserRole,
} from "~@idaho-th/shared";

import { useIdahoTHStore } from "../../datastores/IdahoTHStoreContext";
import { badgeBase, borderRadius, palette, spacing } from "../../styles";

type BadgeStatus =
  | ApplicationStatus
  | ApplicationSubStage
  | "ACCEPTED_AS_HOME_PLAN"
  | HomePlanApprovalsBadge
  | ParoleCommissionDecision
  | "HOME_PLAN";

const STATUS_LABEL_STAFF: Record<BadgeStatus, string> = {
  ACTION_NEEDED: "Action Needed",
  WAITING: "Waiting",
  WAITING_ON_PAROLE_BOARD: "Waiting on Parole Board",
  WAITING_ON_PP: "Waiting on P&P",
  AWAITING_RELEASE: "Awaiting Release",
  DONE: "Done",
  PROVIDER_REVIEW: "Pending",
  OFFERS_RECEIVED: "Offers Received",
  INFO_NEEDED: "Info Needed",
  DECLINED: "Declined",
  RELEASED: "Released",
  PLAN_REJECTED: "Plan Rejected",
  CANCELED: "Canceled",
  CONDITIONALLY_APPROVED: "Conditionally Approved",
  SELECTED: "Selected",
  NOT_SELECTED: "Not Selected",
  CONDITIONAL_APPROVAL_REVOKED: "Approval Canceled",
  ACCEPTED_AS_HOME_PLAN: "Accepted as Home Plan",
  PENDING: "Pending",
  HOUSING_PLAN_APPROVED: "Housing Plan Approved",
  HOUSING_PLAN_REJECTED: "Housing Plan Rejected",
  RELEASE_DENIED: "Release Denied",
  PAROLE_GRANTED: "Parole Granted",
  PAROLE_DENIED: "Parole Denied",
  NOT_APPLICABLE: "Not Applicable",
  HOME_PLAN: "Home Plan",
};

const STATUS_LABEL_PROVIDER: Record<BadgeStatus, string> = {
  ACTION_NEEDED: "Action Needed",
  WAITING: "Waiting",
  WAITING_ON_PAROLE_BOARD: "Waiting",
  WAITING_ON_PP: "Waiting",
  AWAITING_RELEASE: "Awaiting Release",
  DONE: "Done",
  PROVIDER_REVIEW: "Provider Review",
  OFFERS_RECEIVED: "Offers Received",
  INFO_NEEDED: "Info Needed",
  DECLINED: "Declined",
  RELEASED: "Released",
  PLAN_REJECTED: "Plan Rejected",
  CANCELED: "Canceled",
  CONDITIONALLY_APPROVED: "Conditionally Approved",
  SELECTED: "Selected",
  NOT_SELECTED: "Not Selected",
  CONDITIONAL_APPROVAL_REVOKED: "Approval Canceled",
  ACCEPTED_AS_HOME_PLAN: "Accepted as Home Plan",
  PENDING: "Pending",
  HOUSING_PLAN_APPROVED: "Housing Plan Approved",
  HOUSING_PLAN_REJECTED: "Housing Plan Rejected",
  RELEASE_DENIED: "Release Denied",
  PAROLE_GRANTED: "Parole Granted",
  PAROLE_DENIED: "Parole Denied",
  NOT_APPLICABLE: "Not Applicable",
  HOME_PLAN: "Home Plan",
};

const getStatusLabel = (status: BadgeStatus, userRole: UserRole): string => {
  const labelMap =
    userRole === USER_ROLE.STAFF ? STATUS_LABEL_STAFF : STATUS_LABEL_PROVIDER;
  return labelMap[status];
};

const BADGE_VARIANTS = {
  attention: `background-color: ${palette.background.attentionLight}; color: ${palette.foreground.attention};`,
  warning: `background-color: ${palette.background.warningLight}; color: ${palette.foreground.warning};`,
  brand: `background-color: ${palette.background.brandLight}; color: ${palette.foreground.brand};`,
  info: `background-color: ${palette.misc.catskillWhite}; color: ${palette.misc.seaBlue};`,
  neutral: "",
} as const;

const STATUS_CHIP_STYLES: Record<BadgeStatus, string> = {
  ACTION_NEEDED: BADGE_VARIANTS.attention,
  WAITING: BADGE_VARIANTS.warning,
  WAITING_ON_PAROLE_BOARD: BADGE_VARIANTS.warning,
  WAITING_ON_PP: BADGE_VARIANTS.warning,
  AWAITING_RELEASE: BADGE_VARIANTS.warning,
  DONE: BADGE_VARIANTS.brand,
  PROVIDER_REVIEW: BADGE_VARIANTS.warning,
  OFFERS_RECEIVED: BADGE_VARIANTS.neutral,
  INFO_NEEDED: BADGE_VARIANTS.info,
  DECLINED: BADGE_VARIANTS.attention,
  RELEASED: BADGE_VARIANTS.neutral,
  CONDITIONALLY_APPROVED: BADGE_VARIANTS.brand,
  SELECTED: BADGE_VARIANTS.brand,
  NOT_SELECTED: BADGE_VARIANTS.attention,
  CONDITIONAL_APPROVAL_REVOKED: BADGE_VARIANTS.attention,
  PLAN_REJECTED: BADGE_VARIANTS.attention,
  CANCELED: BADGE_VARIANTS.attention,
  ACCEPTED_AS_HOME_PLAN: BADGE_VARIANTS.brand,
  PENDING: BADGE_VARIANTS.warning,
  HOUSING_PLAN_APPROVED: BADGE_VARIANTS.brand,
  HOUSING_PLAN_REJECTED: BADGE_VARIANTS.attention,
  RELEASE_DENIED: BADGE_VARIANTS.attention,
  PAROLE_GRANTED: BADGE_VARIANTS.brand,
  PAROLE_DENIED: BADGE_VARIANTS.attention,
  NOT_APPLICABLE: BADGE_VARIANTS.neutral,
  HOME_PLAN: BADGE_VARIANTS.brand,
};

const Badge = styled.span<{ $styles: string }>`
  border-radius: ${borderRadius[8]};
  ${badgeBase}
  font-size: 0.875rem;
  height: 1.5rem;
  line-height: 1.25rem;
  padding: 0 ${spacing[2]};
  ${({ $styles }) => $styles}
`;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = observer(
  function StatusBadge({ status, label }) {
    const idahoTHStore = useIdahoTHStore();
    const userRole = idahoTHStore.rootStore.userStore.user?.role;

    const badgeLabel =
      label || (userRole ? getStatusLabel(status, userRole) : status);

    return (
      <Badge $styles={STATUS_CHIP_STYLES[status] ?? ""}>{badgeLabel}</Badge>
    );
  },
);

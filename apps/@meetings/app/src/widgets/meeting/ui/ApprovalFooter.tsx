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

import { TouchableOpacity, View } from "react-native";

import { formatMeetingStartDate } from "~@meetings/app/entities/meeting";
import { Checkbox } from "~@meetings/app/shared/ui/Checkbox";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { SectionApproval } from "../lib/getSectionApprovalByTab";

type Props = {
  activeSectionApproval?: SectionApproval;
  isFooterChecked: boolean;
  hasBeenEdited: boolean;
  onFooterCheckedChange: () => void;
  onConfirm: () => void;
  isConfirmPending: boolean;
};

// Content-only: no outer max-width/border/height wrapper, so desktop and
// mobile can each lay out the footer container the way they need to.
export function ApprovalFooter({
  activeSectionApproval,
  isFooterChecked,
  hasBeenEdited,
  onFooterCheckedChange,
  onConfirm,
  isConfirmPending,
}: Props) {
  if (activeSectionApproval?.isApproved && activeSectionApproval.approvedAt) {
    return (
      <Typography className="flex-1 shrink text-sm font-normal leading-[20px] text-primary">
        ✓ Reviewed by {activeSectionApproval.approverEmail} on{" "}
        {formatMeetingStartDate(activeSectionApproval.approvedAt)}.
      </Typography>
    );
  }

  return (
    <>
      <View className="flex-1 flex-row items-center gap-3">
        <Checkbox
          checked={isFooterChecked}
          onCheckedChange={onFooterCheckedChange}
          disabled={!hasBeenEdited}
        />
        <View className="flex-1 shrink">
          <Typography className="text-sm font-normal leading-[20px] text-primary">
            I've reviewed this for accuracy and it's ready to use.
          </Typography>
          {!hasBeenEdited && (
            <Typography className="text-xs font-normal leading-[16px] text-secondary">
              Make at least one edit to enable review
            </Typography>
          )}
        </View>
      </View>
      {isFooterChecked && (
        <TouchableOpacity
          onPress={onConfirm}
          disabled={isConfirmPending}
          className="ml-3 mr-8 shrink-0 rounded-full bg-brand px-3 py-2"
        >
          <Typography className="text-sm font-semibold text-on-brand">
            Confirm
          </Typography>
        </TouchableOpacity>
      )}
    </>
  );
}

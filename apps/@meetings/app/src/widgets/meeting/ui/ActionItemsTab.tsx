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

import { Arrow as TooltipArrowWeb } from "@radix-ui/react-tooltip";
import * as TooltipPrimitive from "@rn-primitives/tooltip";
import clsx from "clsx";
import { ReactNode, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { TrashIcon } from "react-native-heroicons/outline";
import CheckIcon from "react-native-heroicons/solid/CheckIcon";
import PencilIcon from "react-native-heroicons/solid/PencilIcon";

import { trpc } from "~@meetings/app/shared/api";
import { useIsMobileWidth } from "~@meetings/app/shared/lib/platform";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { Button } from "~@meetings/app/shared/ui/Button";
import { Checkbox } from "~@meetings/app/shared/ui/Checkbox";
import { EditableTypography } from "~@meetings/app/shared/ui/EditableTypography";
import { HorizontalDivider } from "~@meetings/app/shared/ui/HorizontalDivider";
import Modal from "~@meetings/app/shared/ui/Modal";
import { useSnackbar } from "~@meetings/app/shared/ui/Snackbar";
import { Typography } from "~@meetings/app/shared/ui/Typography";

type ActionItem = {
  id: string;
  assignee: string;
  completed: boolean;
  editedTask: string | null;
  generatedTask: string;
  context: string | null;
  evidenceQuotes: string[];
  deleted: boolean;
};

type ActionItemsTabProps = {
  items?: ActionItem[] | null;
  outputVote?: ReactNode;
  meetingId: string;
};

export const ActionItemsTab = ({
  items,
  outputVote,
  meetingId,
}: ActionItemsTabProps) => {
  const utils = trpc.useUtils();
  const { showSnackbar } = useSnackbar();
  const isMobile = useIsMobileWidth();
  const [isMobileEditMode, setIsMobileEditMode] = useState(false);
  const [pendingAssignee, setPendingAssignee] = useState<string | null>(null);
  const [newlyCreatedActionItemId, setNewlyCreatedActionItemId] = useState<
    string | null
  >(null);
  const { isOnline } = useIsOnline();

  const createActionItem = trpc.v1.meeting.createActionItem.useMutation({
    onSuccess: (data) => {
      setNewlyCreatedActionItemId(data.id);
    },
    onError: () => {
      setPendingAssignee(null);
      showSnackbar("Failed to create action item");
    },
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
  });

  const itemsByOwner = items?.reduce(
    (acc, item) => {
      if (!acc[item.assignee]) {
        acc[item.assignee] = [];
      }
      acc[item.assignee].push(item);
      return acc;
    },
    {} as Record<string, ActionItem[]>,
  );

  // The placeholder/loading row stays up until the newly created item
  // actually shows up in `items` (i.e. the post-mutation refetch has landed).
  useEffect(() => {
    if (
      pendingAssignee &&
      newlyCreatedActionItemId &&
      items?.some((item) => item.id === newlyCreatedActionItemId)
    ) {
      setPendingAssignee(null);
    }
  }, [items, pendingAssignee, newlyCreatedActionItemId]);

  const handleAddActionItem = (assignee: string) => {
    setPendingAssignee(assignee);
    createActionItem.mutate({ meetingId, task: "", assignee });
  };

  if (!items || items.filter((item) => !item.deleted).length === 0) {
    return (
      <View className="flex-1 px-4 pb-4">
        <View className="mb-3 flex flex-col">
          <Typography variant="heading-4">Action items</Typography>
          <Typography variant="body-s-regular" className="mt-1">
            No action items were generated for this meeting
          </Typography>
        </View>
      </View>
    );
  }

  const isMobileReviewMode = isMobile && !isMobileEditMode;

  return (
    <View className="flex-1 px-4 pb-4">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex flex-col">
          <Typography variant="heading-4">
            {isMobileEditMode ? "Edit Action Items" : "Action items"}
          </Typography>
          {!isMobileReviewMode && (
            <Typography variant="body-s-regular" className="mt-1">
              Click on an item's text to make edits
            </Typography>
          )}
        </View>
        {isMobile && (
          <Button
            variant="secondary"
            icon={{ icon: isMobileEditMode ? CheckIcon : PencilIcon }}
            onPress={() => setIsMobileEditMode((prev) => !prev)}
          >
            {isMobileEditMode ? "Done" : "Edit"}
          </Button>
        )}
      </View>
      <View>
        {Object.values(itemsByOwner ?? {}).map((ownerItems, idx) => {
          const assignee = ownerItems[0].assignee;
          const isCreatingHere = pendingAssignee === assignee;

          return (
            <View key={assignee} className="mb-4">
              <Typography variant="body-m-medium" className="mb-4">
                {assignee}
              </Typography>
              {ownerItems.map((item, itemIdx) => (
                <ActionItemRow
                  key={item.id}
                  actionItem={item}
                  meetingId={meetingId}
                  idx={itemIdx}
                  autoEdit={item.id === newlyCreatedActionItemId}
                  disableEditing={pendingAssignee !== null}
                  isMobile={isMobile}
                  isMobileEditMode={isMobileEditMode}
                />
              ))}
              {isCreatingHere && (
                <>
                  {ownerItems.length > 0 && (
                    <HorizontalDivider className="my-3" />
                  )}
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" />
                    <Typography variant="body-s-regular">
                      Adding action item…
                    </Typography>
                  </View>
                </>
              )}
              {!isMobileReviewMode && (
                <Button
                  className="mt-4 self-start"
                  variant="secondary"
                  disabled={pendingAssignee !== null || !isOnline}
                  loading={isCreatingHere}
                  onPress={() => handleAddActionItem(assignee)}
                >
                  Add action item
                </Button>
              )}
            </View>
          );
        })}
      </View>
      {outputVote}
    </View>
  );
};

function SourceLabel() {
  const style = Platform.select({
    android: { transform: "translateY(5px)" },
    ios: { transform: "translateY(14px)" },
  });

  return (
    <View
      className="relative rounded-lg bg-secondary px-1.5 py-0.5"
      style={style}
    >
      <Typography className="border-b-2 border-dotted border-secondary text-sm text-secondary">
        Source
      </Typography>
    </View>
  );
}

function SourceTooltip({
  context,
  isMobile,
}: {
  context: string;
  isMobile: boolean;
}) {
  return (
    <TooltipPrimitive.Root
      delayDuration={0}
      className="inline-flex items-baseline"
    >
      <TooltipPrimitive.Trigger>
        <SourceLabel />
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          className="relative max-w-xs rounded-xl bg-strong p-4"
          side="top"
          sideOffset={8}
        >
          <ScrollView className="max-h-[240px]">
            <Typography className="text-sm text-on-brand">{context}</Typography>
          </ScrollView>
          {isMobile ? (
            <View className="absolute bottom-0 left-1/2 -z-10 size-4 rotate-45 bg-strong" />
          ) : (
            <TooltipArrowWeb className="fill-strong" />
          )}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

function ActionItemRow({
  actionItem,
  meetingId,
  idx,
  autoEdit = false,
  disableEditing = false,
  isMobile = false,
  isMobileEditMode = false,
}: {
  actionItem: ActionItem;
  meetingId: string;
  idx: number;
  autoEdit?: boolean;
  disableEditing?: boolean;
  isMobile?: boolean;
  isMobileEditMode?: boolean;
}) {
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const utils = trpc.useUtils();
  const taskText = actionItem.editedTask ?? actionItem.generatedTask;
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSnackbar } = useSnackbar();
  const isMobileReviewMode = isMobile && !isMobileEditMode;
  const { isOnline } = useIsOnline();

  const toggleCompletion = trpc.v1.meeting.completeActionItem.useMutation({
    onMutate: async ({ actionItemId }) => {
      await utils.v1.meeting.getDetails.cancel({ meetingId });
      const previousData = utils.v1.meeting.getDetails.getData({ meetingId });
      // Do an optimistic update here so the checkbox toggles before the server
      // confirms it. Aids on slow connections
      utils.v1.meeting.getDetails.setData({ meetingId }, (old) =>
        old
          ? {
              ...old,
              meetingActionItems: old.meetingActionItems.map((item) =>
                item.id === actionItemId
                  ? { ...item, completed: !item.completed }
                  : item,
              ),
            }
          : old,
      );
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      // If there was an error, roll back the optimistic update
      if (context?.previousData) {
        utils.v1.meeting.getDetails.setData(
          { meetingId },
          context.previousData,
        );
      }
    },
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
  });

  const updateActionItem = trpc.v1.meeting.updateActionItem.useMutation({
    onMutate: async ({ actionItemId, task }) => {
      await utils.v1.meeting.getDetails.cancel({ meetingId });
      const previousData = utils.v1.meeting.getDetails.getData({ meetingId });
      // Do an optimistic update here so the edited item appears before the server
      // confirms it. Aids on slow connections
      utils.v1.meeting.getDetails.setData({ meetingId }, (old) =>
        old
          ? {
              ...old,
              meetingActionItems: old.meetingActionItems.map((item) =>
                item.id === actionItemId ? { ...item, editedTask: task } : item,
              ),
            }
          : old,
      );
      return { previousData };
    },
    onSuccess: () => {
      showSnackbar("Action item updated");
    },
    onError: (_err, _vars, context) => {
      // If there was an error, roll back the optimistic update
      if (context?.previousData) {
        utils.v1.meeting.getDetails.setData(
          { meetingId },
          context.previousData,
        );
      }
    },
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
    },
  });

  const softDeleteActionItem = trpc.v1.meeting.deleteActionItem.useMutation({
    onSuccess: () => {
      showSnackbar("Action item deleted");
    },
    onSettled: () => {
      utils.v1.meeting.getDetails.invalidate({ meetingId });
      setShowDeletionModal(false);
      setIsDeleting(false);
    },
  });

  const onDeleteConfirmed = () => {
    setIsDeleting(true);
    softDeleteActionItem.mutate({ actionItemId: actionItem.id });
  };

  const deletionConfirmationDialog = (
    <Modal
      visible={showDeletionModal}
      transparent
      onClickOutside={() => setShowDeletionModal(false)}
    >
      <View className="flex flex-col items-center gap-4 p-6">
        <Modal.Title>Delete action item?</Modal.Title>
        <Modal.Body>
          Are you sure you want to delete this action item? This action cannot
          be undone.
        </Modal.Body>
        <Modal.Actions>
          <Button
            variant="destructive"
            disabled={isDeleting}
            loading={isDeleting}
            onPress={onDeleteConfirmed}
          >
            Remove Action Item
          </Button>
          <Button
            variant="secondary"
            onPress={() => {
              setShowDeletionModal(false);
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </Modal.Actions>
      </View>
    </Modal>
  );

  const isEditableNow = !disableEditing && !isMobileReviewMode;

  return (
    <>
      {deletionConfirmationDialog}
      <View className="flex flex-col">
        {idx > 0 && <HorizontalDivider className="my-3" />}
        <TouchableOpacity
          activeOpacity={isMobileReviewMode ? undefined : 1}
          disabled={!isMobileReviewMode}
          onPress={
            isMobileReviewMode
              ? () => toggleCompletion.mutate({ actionItemId: actionItem.id })
              : undefined
          }
          className="flex-row items-start gap-2"
        >
          <Checkbox
            checked={actionItem.completed}
            onCheckedChange={() =>
              toggleCompletion.mutate({ actionItemId: actionItem.id })
            }
            disabled={(isMobile && isMobileEditMode) || !isOnline}
            className="mt-0.5"
          />
          <View className="flex-1 flex-row flex-wrap items-baseline gap-x-1.5">
            <EditableTypography
              variant="body-m-regular"
              value={taskText}
              onEditComplete={(task) =>
                updateActionItem.mutate({ actionItemId: actionItem.id, task })
              }
              className={clsx(
                "flex-1",
                actionItem.completed && "text-tertiary",
              )}
              editingClassName="bg-warning-light"
              placeholder="New action item"
              defaultEditing={autoEdit}
              disabled={!isEditableNow || !isOnline}
            />
            {actionItem.context && !(isMobile && isMobileEditMode) && (
              <SourceTooltip context={actionItem.context} isMobile={isMobile} />
            )}
          </View>
          {!isMobileReviewMode && (
            <TouchableOpacity
              className="mt-0.5"
              onPress={() => setShowDeletionModal(true)}
              disabled={!isOnline}
            >
              <TrashIcon className="stroke-attention" size={20} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

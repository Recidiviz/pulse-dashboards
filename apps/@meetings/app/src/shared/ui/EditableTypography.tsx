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

import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  Platform,
  Pressable,
  TextInput,
  TextInputKeyPressEventData,
} from "react-native";

import {
  Typography,
  TYPOGRAPHY_VARIANTS,
  TypographyVariant,
} from "./Typography";

type EditableTypographyProps = {
  variant?: TypographyVariant;
  value: string;
  onEditComplete: (value: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
  className?: string;
  // Applied only to the TextInput while actively editing, on top of
  // `className` - e.g. a background tint like "bg-warning-light".
  editingClassName?: string;
  // Seeds the initial edit state - e.g. to drop a freshly created item
  // straight into edit mode. Only read on mount, not kept in sync afterward.
  defaultEditing?: boolean;
  // Prevents entering edit mode. If it flips to true while already editing,
  // the in-progress edit is force-committed (same as blur).
  disabled?: boolean;
  // Shown (dimmed) in place of the value when it's empty, so there's always
  // something visible and tappable to start editing.
  placeholder?: string;
};

// react-native-web's key press event is a real DOM KeyboardEvent under the
// hood, so `shiftKey`/`preventDefault` are there at runtime even though RN's
// cross-platform TextInputKeyPressEventData type doesn't declare them.
type WebKeyPressEvent = TextInputKeyPressEventData & {
  shiftKey?: boolean;
  preventDefault?: () => void;
};

// Looks exactly like `Typography` until tapped, at which point it swaps to a
// borderless, auto-growing TextInput (Text itself can't be made editable on
// native). Commits on blur, or (web only) Enter - Shift+Enter inserts a
// newline instead, like Slack/Discord.
export function EditableTypography({
  variant,
  value,
  onEditComplete,
  onEditingChange,
  className,
  editingClassName,
  defaultEditing = false,
  disabled = false,
  placeholder = "Tap to edit",
}: EditableTypographyProps) {
  const [isEditing, setIsEditingState] = useState(defaultEditing);
  const [draft, setDraft] = useState(value);
  const [inputHeight, setInputHeight] = useState(0);
  const hasCommittedRef = useRef(false);
  const didMountRef = useRef(false);

  const setIsEditing = (next: boolean) => {
    setIsEditingState(next);
    onEditingChange?.(next);
  };

  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  const beginEditing = () => {
    hasCommittedRef.current = false;
    setIsEditing(true);
  };

  // Blur and the Enter keypress can both race to close the field - only the
  // first one should actually commit.
  const commitEdit = () => {
    if (hasCommittedRef.current) return;
    hasCommittedRef.current = true;
    setIsEditing(false);
    if (draft !== value) onEditComplete(draft);
  };

  // Force-close and save if we're disabled out from under an open edit
  // (e.g. leaving mobile edit mode mid-edit). Skips the mount render itself -
  // a freshly created item can mount with `disabled` and `defaultEditing`
  // both true for a single render (before the parent clears its pending
  // state), and that's not a real "disabled out from under you" transition.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (disabled && isEditing) commitEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  if (!isEditing) {
    return (
      <Pressable
        onPress={beginEditing}
        disabled={disabled}
        className={className}
      >
        <Typography
          variant={variant}
          className={clsx(className, !value && "text-tertiary")}
        >
          {value || placeholder}
        </Typography>
      </Pressable>
    );
  }

  return (
    <TextInput
      autoFocus
      multiline
      scrollEnabled={false}
      textAlignVertical="top"
      value={draft}
      onChangeText={setDraft}
      onContentSizeChange={(e) =>
        setInputHeight(e.nativeEvent.contentSize.height)
      }
      onBlur={commitEdit}
      onKeyPress={
        Platform.OS === "web"
          ? (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
              const event = e.nativeEvent as WebKeyPressEvent;
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault?.();
                commitEdit();
              }
            }
          : undefined
      }
      style={{
        outlineColor: "transparent",
        minHeight: inputHeight,
        overflow: "hidden",
      }}
      className={clsx(
        "font-inter",
        variant && TYPOGRAPHY_VARIANTS[variant],
        className,
        editingClassName && "-mx-1 rounded px-1",
        editingClassName,
      )}
    />
  );
}

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
import { ReactNode, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";

import { theme } from "../../config/theme";
import { Typography } from "../Typography";
import { DropdownSheet } from "./DropdownSheet";

export type DropdownContentProps = {
  close: () => void;
  isOpen: boolean;
};

type DropdownContainerProps = {
  className?: string;
  variant?: "text" | "outline";
  label?: string;
  buttonText?: string | null;
  /** Heading for the bottom sheet. Native only — the web popover has no header. */
  title?: string;
  placeholder?: string;
  errorMessage?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (props: DropdownContentProps) => ReactNode;
};

const DropdownContainer = ({
  className,
  variant = "text",
  label,
  buttonText,
  title,
  placeholder,
  errorMessage,
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownContainerProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next);
    else setUncontrolledOpen(next);
  };

  const handleToggle = () => setOpen(!open);

  const close = () => setOpen(false);

  return (
    <View className={clsx("flex flex-col items-center gap-2", className)}>
      <View
        className={clsx(
          "relative z-50 md:min-w-[200px]",
          variant === "text" && "w-fit max-w-full shrink self-start",
          variant === "outline" &&
            "w-full rounded-lg border bg-secondary px-3 py-2.5 md:w-[320px]",
          errorMessage ? "border-attention" : "border-subtle",
        )}
      >
        <Pressable
          className={clsx(
            "min-w-0 flex-row items-center",
            variant === "text" && "justify-end",
            variant === "outline" && "justify-between",
          )}
          onPress={handleToggle}
        >
          {label && (
            <Typography className="shrink-0 text-sm text-secondary md:text-base">
              {label}:
            </Typography>
          )}

          <View
            className={clsx(
              "min-w-0 shrink flex-row items-center rounded-md",
              variant === "text" && "justify-end",
              variant === "outline" && "w-full justify-between",
            )}
          >
            <Typography
              className={clsx(
                "min-w-0 shrink px-1 text-sm text-primary",
                variant === "text" && "md:text-base md:font-medium",
                buttonText ? "text-primary" : "text-secondary",
              )}
              numberOfLines={1}
            >
              {buttonText || placeholder}
            </Typography>
            {open ? (
              <ChevronUpIcon className="size-4 shrink-0 stroke-tertiary stroke-[3px]" />
            ) : (
              <ChevronDownIcon className="size-4 shrink-0 stroke-tertiary stroke-[3px]" />
            )}
          </View>
        </Pressable>
        {open && Platform.OS === "web" && (
          <>
            <TouchableWithoutFeedback onPress={close}>
              <View className="fixed inset-0 z-40" />
            </TouchableWithoutFeedback>
            <View
              className={clsx(
                "absolute right-0 z-50 w-fit flex-1 rounded-lg border border-subtle bg-primary p-1",
                variant === "text" && "top-7 w-fit",
                variant === "outline" && "top-[120%] max-h-[150px] w-full",
              )}
              style={{
                shadowColor: theme["backgroundColor"]["brand-light"],
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
              }}
            >
              <ScrollView>{children({ close, isOpen: open })}</ScrollView>
            </View>
          </>
        )}
        {Platform.OS !== "web" && !isControlled && (
          <DropdownSheet visible={open} onClose={close} title={title}>
            {children({ close, isOpen: open })}
          </DropdownSheet>
        )}
      </View>
      {errorMessage && (
        <Typography variant="caption-s-regular" className="!text-attention">
          {errorMessage}
        </Typography>
      )}
    </View>
  );
};

export default DropdownContainer;

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

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import clsx from "clsx";
import { ReactNode, useCallback, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import ChevronDownIcon from "react-native-heroicons/outline/ChevronDownIcon";
import ChevronUpIcon from "react-native-heroicons/outline/ChevronUpIcon";
import XIcon from "react-native-heroicons/outline/XIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../../config/theme";
import { Typography } from "../Typography";

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
  children,
}: DropdownContainerProps) => {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleToggle = useCallback(() => {
    if (Platform.OS === "web") {
      setOpen((open) => !open);
    } else {
      bottomSheetRef.current?.present();
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    bottomSheetRef.current?.close();
  }, []);

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
        {Platform.OS !== "web" && (
          <BottomSheetModal
            ref={bottomSheetRef}
            onChange={(index) => setOpen(index >= 0)}
            onDismiss={() => setOpen(false)}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
            enableDynamicSizing
            enablePanDownToClose
            handleIndicatorStyle={{
              backgroundColor: theme["backgroundColor"]["strong"],
            }}
            containerStyle={{ flex: 1 }}
            backdropComponent={(props) => (
              <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={1}
                pressBehavior="close"
                opacity={0.5}
              />
            )}
          >
            <BottomSheetScrollView className="flex max-h-full flex-1 flex-col px-4">
              <View className="mb-4 flex flex-row items-center justify-between">
                <View className="pointer-events-none size-8" />
                {title && (
                  <Typography className="text-lg font-semibold text-primary">
                    {title}
                  </Typography>
                )}
                <Pressable onPress={close}>
                  <View className="flex size-8 items-center justify-center rounded-full bg-secondary">
                    <XIcon className="!size-4 stroke-tertiary" />
                  </View>
                </Pressable>
              </View>
              <View
                className="flex size-full flex-col py-1"
                style={{ paddingBottom: insets.bottom + 32 }}
              >
                {children({ close, isOpen: open })}
              </View>
            </BottomSheetScrollView>
          </BottomSheetModal>
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

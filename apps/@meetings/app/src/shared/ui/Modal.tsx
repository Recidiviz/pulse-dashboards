// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2025 Recidiviz, Inc.
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
import { ComponentType, ReactNode } from "react";
import {
  Modal as RNModal,
  ModalBaseProps,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";

import { Typography } from "./Typography";

type ModalProps = ModalBaseProps & {
  onClickOutside?: () => void;
  containerClassName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backdrop?: ComponentType<any>;
  children: ReactNode;
};

function DefaultBackdrop() {
  return <View className="absolute size-full bg-scrim-default" />;
}

const ModalContent = ({
  onClickOutside,
  backdrop: customBackdrop,
  children,
  containerClassName = "",
}: Pick<
  ModalProps,
  "onClickOutside" | "backdrop" | "children" | "containerClassName"
>) => {
  const Backdrop = customBackdrop || DefaultBackdrop;

  return (
    <TouchableWithoutFeedback onPress={onClickOutside}>
      <View style={StyleSheet.absoluteFill}>
        <Backdrop />
        <View className="size-full items-center justify-center p-5">
          <TouchableWithoutFeedback>
            <View
              className={`max-h-full overflow-hidden rounded-3xl bg-primary shadow-md ${containerClassName}`}
            >
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

// On Android, avoid RN Modal to prevent an intermittent Yoga layout crash
// in Fabric (YGNodeGetOwner assertion failure) when coexisting with @gorhom/bottom-sheet.
// https://github.com/facebook/react-native/issues/52349
const Modal = ({
  onClickOutside,
  backdrop: customBackdrop,
  children,
  containerClassName = "",
  ...modalProps
}: ModalProps) => {
  const { width, height } = useWindowDimensions();

  if (Platform.OS === "android") {
    if (!modalProps.visible) return null;
    return (
      <View className="absolute left-0 top-0 z-50" style={{ width, height }}>
        <ModalContent
          onClickOutside={onClickOutside}
          backdrop={customBackdrop}
          containerClassName={containerClassName}
        >
          {children}
        </ModalContent>
      </View>
    );
  }

  return (
    <RNModal {...modalProps} id="rnmodal">
      <ModalContent
        onClickOutside={onClickOutside}
        backdrop={customBackdrop}
        containerClassName={containerClassName}
      >
        {children}
      </ModalContent>
    </RNModal>
  );
};

type ModalSectionProps = {
  className?: string;
  children: ReactNode;
};

// Matches the most common title style across existing modals (e.g.
// DiscardMeetingModal, DiscardUploadModal, EndMeetingModal).
function ModalTitle({ className, children }: ModalSectionProps) {
  return (
    <Typography
      className={clsx(
        "text-center text-xl font-semibold text-primary",
        className,
      )}
    >
      {children}
    </Typography>
  );
}

// Matches the most common body/description style across existing modals.
function ModalBody({ className, children }: ModalSectionProps) {
  return (
    <Typography
      className={clsx("text-center text-sm text-secondary", className)}
    >
      {children}
    </Typography>
  );
}

// Matches the most common actions-row style across existing modals.
function ModalActions({ className, children }: ModalSectionProps) {
  return (
    <View className={clsx("flex-row justify-end gap-2", className)}>
      {children}
    </View>
  );
}

Modal.Title = ModalTitle;
Modal.Body = ModalBody;
Modal.Actions = ModalActions;

export default Modal;

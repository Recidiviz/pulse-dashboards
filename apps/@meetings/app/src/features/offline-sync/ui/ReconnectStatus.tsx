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

import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import clsx from "clsx";
import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import CheckIcon from "react-native-heroicons/outline/CheckIcon";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  XIcon,
} from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import simplur from "simplur";
import { match } from "ts-pattern";

import {
  ReconnectUploadStatus,
  useReconnectUploadStore,
} from "~@meetings/app/entities/meeting";
import { Person } from "~@meetings/app/shared/api";
import CloudOffline from "~@meetings/app/shared/assets/icons/cloud-off.svg";
import BgAvatarImage from "~@meetings/app/shared/assets/images/bg-avatar.png";
import { theme } from "~@meetings/app/shared/config";
import { getInitials } from "~@meetings/app/shared/lib/format";
import useIsOnline from "~@meetings/app/shared/lib/useIsOnline";
import { CircularProgressBar } from "~@meetings/app/shared/ui/CircularProgressBar";
import { Expandable } from "~@meetings/app/shared/ui/Expandable";
import { FadeContainer } from "~@meetings/app/shared/ui/FadeContainer";
import { FloatingCard } from "~@meetings/app/shared/ui/FloatingCard";
import { HorizontalDivider } from "~@meetings/app/shared/ui/HorizontalDivider";
import { Typography } from "~@meetings/app/shared/ui/Typography";

import { useUploadTimeRemaining } from "../lib/useUploadTimeRemaining";

type ReconnectRowProps = {
  person?: Person;
  recordedOn: Date;
  uploadStatus: ReconnectUploadStatus;
  uploadCurrent?: number;
  uploadTotal?: number;
  onRetry?: () => void;
};

function useOfflineUploads() {
  const { uploads: uploadStatuses } = useReconnectUploadStore();

  const uploads = Object.entries(uploadStatuses).map(([meetingId, entry]) => ({
    meetingId,
    person: entry.person,
    endTime: entry.recordedAt,
    uploadStatus: entry.status,
    uploadCurrent: entry.uploadedBytes,
    uploadTotal: entry.totalBytes,
  }));

  const activeUpload = uploads.find((u) => u.uploadStatus === "uploading");

  return {
    uploads,
    activeUploadedBytes: activeUpload?.uploadCurrent ?? 0,
    activeTotalBytes: activeUpload?.uploadTotal ?? 0,
  };
}

function StatusIndicator({
  uploadCurrent = 0,
  uploadTotal = 1,
  uploadStatus,
  onRetry,
}: {
  uploadCurrent?: number;
  uploadTotal?: number;
  uploadStatus?: ReconnectUploadStatus;
  onRetry?: () => void;
}) {
  if (uploadStatus === "complete") {
    return (
      <View className="size-8 items-center justify-center rounded-full bg-brand">
        <CheckIcon className="size-4 stroke-[3px] text-white" />
      </View>
    );
  }

  if (uploadStatus === "error") {
    return (
      <TouchableOpacity onPress={onRetry}>
        <Typography className="text-signal-error text-sm font-medium">
          Retry
        </Typography>
      </TouchableOpacity>
    );
  }

  return (
    <CircularProgressBar
      current={uploadCurrent}
      total={uploadTotal}
      size={32}
    />
  );
}

function ReconnectRow({
  person,
  recordedOn,
  uploadStatus,
  uploadCurrent,
  uploadTotal,
  onRetry,
}: ReconnectRowProps) {
  if (!person) return null;

  const isUploading = uploadStatus === "uploading";
  const recordedOnLabel =
    recordedOn.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    }) +
    " at " +
    recordedOn.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <View className="flex-row items-start gap-3">
      <View className={clsx(!isUploading && "opacity-50")}>
        <ImageBackground
          source={BgAvatarImage}
          className="size-11 items-center justify-center overflow-hidden rounded-full"
          imageClassName="!size-11"
        >
          <Typography className="text-base font-medium text-on-brand">
            {getInitials(person.fullName)}
          </Typography>
        </ImageBackground>
      </View>
      <View className="flex-1">
        <Typography className="text-base font-medium">
          {person.fullName}
        </Typography>
        <Typography className="text-sm text-secondary">
          ID: {person.displayPersonExternalId}
          {"supervisionType" in person ? ` · ${person.supervisionType}` : ""}
        </Typography>
        <Typography className="text-sm text-secondary">
          Recorded on {recordedOnLabel}
        </Typography>
      </View>
      <View className="self-center">
        <StatusIndicator
          uploadCurrent={uploadCurrent}
          uploadTotal={uploadTotal}
          uploadStatus={uploadStatus}
          onRetry={onRetry}
        />
      </View>
    </View>
  );
}

export function ReconnectStatus({
  onRetry,
  isVisible,
}: {
  onRetry?: () => void;
  isVisible?: boolean;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < parseInt(theme["screens"]["md"]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { uploads, activeUploadedBytes, activeTotalBytes } =
    useOfflineUploads();
  const timeRemaining = useUploadTimeRemaining(
    activeUploadedBytes,
    activeTotalBytes,
  );
  const { isOnline } = useIsOnline();
  const { clear: clearUploadStatuses } = useReconnectUploadStore();

  const toggleExpanded = () => {
    if (isExpanded) {
      bottomSheetRef.current?.close();
      setIsExpanded(false);
    } else {
      bottomSheetRef.current?.snapToIndex(0);
      setIsExpanded(true);
    }
  };

  // Prevent jumpy scrollbar appearing before the expand animation finishes.
  useEffect(() => {
    if (isExpanded) {
      const timeout = setTimeout(() => setScrollEnabled(true), 250);
      return () => clearTimeout(timeout);
    } else {
      setScrollEnabled(false);
      return undefined;
    }
  }, [isExpanded]);

  const uploadsComplete =
    uploads.length > 0 && uploads.every((u) => u.uploadStatus === "complete");
  const isFinishing = isVisible && uploadsComplete;

  useEffect(
    function onCompleted() {
      // We gate on isVisible here so that we don't show cleared UI
      // before we're actually done dequeueing our events
      if (uploadsComplete && !isVisible) {
        clearUploadStatuses();
        bottomSheetRef.current?.close();
        setIsExpanded(false);
      }
    },
    [uploadsComplete, isVisible, clearUploadStatuses, setIsExpanded],
  );

  useEffect(
    function resetDismissalOnReconnect() {
      if (isOnline) setIsDismissed(false);
    },
    [isOnline],
  );

  const dismiss = () => {
    bottomSheetRef.current?.close();
    setIsDismissed(true);
  };

  const shouldShow =
    !isDismissed &&
    (isVisible || uploads.some((u) => u.uploadStatus !== "pending"));

  const rowContent = (
    <>
      {uploads.map((upload, i) => (
        <Fragment key={upload.meetingId}>
          <ReconnectRow
            person={upload.person}
            recordedOn={upload.endTime}
            uploadStatus={upload.uploadStatus}
            uploadCurrent={upload.uploadCurrent}
            uploadTotal={upload.uploadTotal}
            onRetry={onRetry}
          />
          {i < uploads.length - 1 && <HorizontalDivider className="my-4" />}
        </Fragment>
      ))}
    </>
  );

  const rows = (
    <ScrollView
      showsVerticalScrollIndicator={scrollEnabled}
      scrollEnabled={scrollEnabled}
      className="mt-5 max-h-[275px]"
    >
      {rowContent}
    </ScrollView>
  );

  const uploadMetaProgress = {
    totalUploads: uploads?.length ?? 0,
    percentComplete: uploads?.length
      ? Math.round(
          (uploads.filter((u) => u.uploadStatus === "complete").length /
            uploads.length) *
            100,
        )
      : 0,
    numberComplete:
      uploads?.filter((u) => u.uploadStatus === "complete").length ?? 0,
  };

  const headerTitle = match({ isOnline, isFinishing })
    .with({ isOnline: false }, () => (
      <View className="flex-row items-center gap-3">
        <View className="size-10 items-center justify-center rounded-full bg-warning-light">
          <CloudOffline />
        </View>
        <View className="flex-1">
          <Typography className="text-base font-medium">
            Upload Stopped
          </Typography>
          <Typography className="text-sm font-normal text-warning">
            Will continue automatically when online
          </Typography>
        </View>
      </View>
    ))
    .with({ isFinishing: true }, () => (
      <View className="flex-row items-center gap-3">
        <ActivityIndicator size="small" />
        <Typography className="flex-1 text-base font-medium">
          Finishing sync...
        </Typography>
      </View>
    ))
    .otherwise(() => (
      <View className="flex-row items-center gap-3">
        <CircularProgressBar
          current={uploadMetaProgress.numberComplete}
          total={uploadMetaProgress.totalUploads}
          showText
        />
        <View className="flex-1">
          <Typography className="text-base font-medium">
            {simplur`${uploadMetaProgress.totalUploads} meeting[|s] [is|are] uploading...`}
          </Typography>
          <Typography className="text-sm font-normal text-secondary">
            {uploadMetaProgress.percentComplete}% Uploaded
            {timeRemaining ? ` · ${timeRemaining} left` : ""}
          </Typography>
        </View>
      </View>
    ));

  const header = (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-1">{headerTitle}</View>
      <View className="shrink-0 flex-row gap-2">
        {isOnline && (
          <TouchableOpacity
            onPress={toggleExpanded}
            className="size-8 items-center justify-center rounded-full bg-secondary"
          >
            {isExpanded ? (
              <ChevronDownIcon className="size-4 stroke-[3px] text-secondary" />
            ) : (
              <ChevronUpIcon className="size-4 stroke-[3px] text-secondary" />
            )}
          </TouchableOpacity>
        )}

        {!isOnline && (
          <TouchableOpacity
            onPress={dismiss}
            className="size-8 items-center justify-center rounded-full bg-secondary"
          >
            <XIcon className="size-4 stroke-[3px] text-secondary" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (isMobile) {
    return (
      <>
        <FadeContainer isVisible={shouldShow}>
          <FloatingCard position="bottom-right" className="max-w-[400px]">
            {header}
          </FloatingCard>
        </FadeContainer>
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          enableDynamicSizing
          enablePanDownToClose
          enableContentPanningGesture
          onClose={() => setIsExpanded(false)}
          handleComponent={null}
          backdropComponent={(props) => (
            <BottomSheetBackdrop
              {...props}
              appearsOnIndex={0}
              disappearsOnIndex={-1}
              opacity={0.5}
              pressBehavior="close"
            />
          )}
        >
          <BottomSheetView
            style={{ padding: 20, paddingBottom: insets.bottom + 20 }}
          >
            <View className="mb-5">{header}</View>
            {rowContent}
          </BottomSheetView>
        </BottomSheet>
      </>
    );
  }

  return (
    <FadeContainer isVisible={shouldShow}>
      <FloatingCard position="bottom-right" className="max-w-[400px]">
        {header}
        <Expandable isExpanded={isExpanded}>{rows}</Expandable>
      </FloatingCard>
    </FadeContainer>
  );
}

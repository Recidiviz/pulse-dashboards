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
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import CheckIcon from "react-native-heroicons/outline/CheckIcon";
import { ChevronDownIcon, ChevronUpIcon } from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import simplur from "simplur";

import BgAvatarImage from "../assets/images/bg-avatar.png";
import { theme } from "../common/theme";
import { Person } from "../common/types";
import useIsOnline from "../hooks/useIsOnline";
import {
  ReconnectUploadStatus,
  useReconnectUploadStore,
} from "../hooks/useReconnectUploadStore";
import { useUploadTimeRemaining } from "../hooks/useUploadTimeRemaining";
import { Typography } from "../shared/ui/Typography";
import { getInitials } from "../utils/format";
import { CircularProgressBar } from "./CircularProgressBar";
import { Expandable } from "./Expandable";
import { FloatingCard } from "./FloatingCard";
import { HorizontalDivider } from "./HorizontalDivider";

type ReconnectRowProps = {
  person?: Person;
  recordedOn: Date;
  uploadStatus: ReconnectUploadStatus;
  uploadCurrent?: number;
  uploadTotal?: number;
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
}: {
  uploadCurrent?: number;
  uploadTotal?: number;
  uploadStatus?: "uploading" | "complete" | "failed" | "error" | "pending";
}) {
  if (uploadStatus === "complete") {
    return (
      <View className="size-8 items-center justify-center rounded-full bg-brand">
        <CheckIcon className="size-4 stroke-[3px] text-white" />
      </View>
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
          className="!size-11 items-center justify-center overflow-hidden rounded-full"
          imageClassName="!size-11"
        >
          <Typography className="text-sm font-semibold text-white">
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
        />
      </View>
    </View>
  );
}

export function ReconnectStatus() {
  const { width } = useWindowDimensions();
  const isMobile = width < parseInt(theme["screens"]["md"]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { uploads, activeUploadedBytes, activeTotalBytes } =
    useOfflineUploads();
  const { isOnline } = useIsOnline();
  const timeRemaining = useUploadTimeRemaining(
    activeUploadedBytes,
    activeTotalBytes,
  );
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

  const uploadsComplete = uploads.every((u) => u.uploadStatus === "complete");
  useEffect(
    function onCompleted() {
      if (uploadsComplete) {
        clearUploadStatuses();
        setIsExpanded(false);
      }
    },
    [uploadsComplete, clearUploadStatuses, setIsExpanded],
  );

  // TODO(#12931): We actually don't want to ALWAYS hide this when offline, as a
  // user might lose connection during the re-connect process and we need to deal with that.
  if (uploads.length === 0 || !isOnline) return null;

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
          (uploads.filter(
            (u) => u.uploadStatus === "complete" || u.uploadStatus === "error",
          ).length /
            uploads.length) *
            100,
        )
      : 0,
    numberComplete:
      uploads?.filter((u) => u.uploadStatus === "complete").length ?? 0,
  };

  const header = (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-3">
        <CircularProgressBar
          current={uploadMetaProgress.numberComplete}
          total={uploadMetaProgress.totalUploads}
          showText
        />
        <View>
          <Typography className="text-base font-medium">
            {simplur`${uploadMetaProgress.totalUploads} meeting[|s] are uploading...`}
          </Typography>
          <Typography className="text-sm font-normal text-secondary">
            {uploadMetaProgress.percentComplete}% Uploaded
            {timeRemaining ? ` · ${timeRemaining} left` : ""}
          </Typography>
        </View>
      </View>
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
    </View>
  );

  if (isMobile) {
    return (
      <>
        <FloatingCard position="bottom-right" className="max-w-[400px]">
          {header}
        </FloatingCard>
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
    <FloatingCard position="bottom-right" className="max-w-[400px]">
      {header}
      <Expandable isExpanded={isExpanded}>{rows}</Expandable>
    </FloatingCard>
  );
}

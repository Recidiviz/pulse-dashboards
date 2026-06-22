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

import {
  CompositeNavigationProp,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { keepPreviousData } from "@tanstack/react-query";
import upperFirst from "lodash/upperFirst";
import React, { useEffect, useMemo, useState } from "react";
import { ImageBackground, TouchableOpacity, View } from "react-native";
import ChevronRightIcon from "react-native-heroicons/outline/ChevronRightIcon";

import {
  deserializeClient,
  deserializeResident,
  serializeSort,
  SortDirection,
  SortOption,
} from "~@meetings/app/entities/person";
import { useRecording } from "~@meetings/app/features/recording";
import { Person, PersonType, trpc } from "~@meetings/app/shared/api";
import BgAvatarImage from "~@meetings/app/shared/assets/images/bg-avatar.png";
import {
  ClientsStackParamList,
  ResidentsStackParamList,
} from "~@meetings/app/shared/config";
import { getInitials } from "~@meetings/app/shared/lib/format";
import ProcessingErrorBanner from "~@meetings/app/shared/ui/ProcessingErrorBanner";
import { RecordingIndicator } from "~@meetings/app/shared/ui/RecordingIndicator";
import { SortArrow } from "~@meetings/app/shared/ui/SortArrow";
import {
  Table,
  TABLE_CELL_HEIGHT,
  TABLE_HEAD_CELL_HEIGHT,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableHeadRow,
  TableRow,
} from "~@meetings/app/shared/ui/Table.web";
import { TablePagination } from "~@meetings/app/shared/ui/TablePagination";
import { TooltipText } from "~@meetings/app/shared/ui/TooltipText";
import { Typography } from "~@meetings/app/shared/ui/Typography";

const PAGE_SIZE = 7;
const TABLE_HEIGHT = TABLE_HEAD_CELL_HEIGHT + PAGE_SIZE * TABLE_CELL_HEIGHT;

type ProfileNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<ClientsStackParamList, "ClientProfile">,
  NativeStackNavigationProp<ResidentsStackParamList, "ResidentProfile">
>;

type CaseloadFilter = "mine" | "others" | "all";

type Props = {
  type: PersonType;
  caseload?: CaseloadFilter;
  search: string;
  sort: { sortBy: string; direction: SortDirection };
  setSort: (sort: { sortBy: string; direction: SortDirection }) => void;
  sectionTitle?: string;
};

export function PersonsTable({
  type,
  caseload = "all",
  search,
  sort,
  setSort,
  sectionTitle,
}: Props) {
  const [page, setPage] = useState(1);
  const isFocused = useIsFocused();
  const navigation = useNavigation<ProfileNavProp>();
  const {
    status,
    meetingId: activeMeetingId,
    person: recordingPerson,
  } = useRecording<"web">();

  useEffect(() => {
    setPage(1);
  }, [search, sort, caseload]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedSortBy = serializeSort(sort.sortBy as SortOption) as any;

  const clientQuery = trpc.v1.client.list.useQuery(
    {
      size: PAGE_SIZE,
      cursor: page,
      filters: {
        search,
        caseload,
      },
      sort: { sortBy: serializedSortBy, sortDirection: sort.direction },
    },
    {
      enabled: isFocused && type === "client",
      placeholderData: keepPreviousData,
    },
  );

  const residentQuery = trpc.v1.resident.list.useQuery(
    {
      size: PAGE_SIZE,
      cursor: page,
      filters: {
        search,
      },
      sort: { sortBy: serializedSortBy, sortDirection: sort.direction },
    },
    {
      enabled: isFocused && type === "resident",
      placeholderData: keepPreviousData,
    },
  );

  const persons: Person[] = useMemo(() => {
    if (type === "client") {
      return (clientQuery.data?.data ?? []).map(deserializeClient);
    }
    return (residentQuery.data?.data ?? []).map(deserializeResident);
  }, [clientQuery.data, residentQuery.data, type]);

  if (persons.length === 0) return null;

  const rawData = type === "client" ? clientQuery.data : residentQuery.data;
  const totalPages = rawData?.totalPages ?? 1;
  const total = rawData?.total ?? 0;

  const handleNavigateToProfile = (personId: string) => {
    navigation.navigate(
      type === "client" ? "ClientProfile" : "ResidentProfile",
      { personId },
    );
  };

  const handleSort = (sortOption: SortOption) => {
    let direction: SortDirection;
    if (sort.sortBy === sortOption) {
      direction =
        sort.direction === SortDirection.Ascending
          ? SortDirection.Descending
          : SortDirection.Ascending;
    } else {
      direction = SortDirection.Ascending;
    }
    setSort({ sortBy: sortOption, direction });
  };

  return (
    <>
      {sectionTitle && (
        <Typography className="mt-6 text-base font-medium text-secondary">
          {sectionTitle}
        </Typography>
      )}
      <View className="mt-2 w-full" style={{ height: TABLE_HEIGHT }}>
        <Table className="table-fixed">
          <TableHead>
            <TableHeadRow>
              <TableHeadCell className="w-[35%]">
                <TouchableOpacity
                  onPress={() => handleSort(SortOption.Name)}
                  className="flex size-full flex-row items-center"
                >
                  <Typography className="text-left text-sm font-medium text-secondary group-hover:text-brand">
                    NAME{" "}
                  </Typography>
                  <View className="flex flex-col items-center justify-center gap-px p-0.5">
                    <SortArrow
                      arrowDirection="up"
                      isActive={
                        sort.sortBy === SortOption.Name &&
                        sort.direction === SortDirection.Ascending
                      }
                    />
                    <SortArrow
                      arrowDirection="down"
                      isActive={
                        sort.sortBy === SortOption.Name &&
                        sort.direction === SortDirection.Descending
                      }
                    />
                  </View>
                </TouchableOpacity>
              </TableHeadCell>
              <TableHeadCell className="w-[15%]">
                <TouchableOpacity
                  onPress={() => handleSort(SortOption.Id)}
                  className="flex size-full flex-row items-center"
                >
                  <Typography className="text-left text-sm font-medium text-secondary group-hover:text-brand">
                    ID{" "}
                  </Typography>
                  <View className="flex flex-col items-center justify-center gap-px p-0.5">
                    <SortArrow
                      arrowDirection="up"
                      isActive={
                        sort.sortBy === SortOption.Id &&
                        sort.direction === SortDirection.Ascending
                      }
                    />
                    <SortArrow
                      arrowDirection="down"
                      isActive={
                        sort.sortBy === SortOption.Id &&
                        sort.direction === SortDirection.Descending
                      }
                    />
                  </View>
                </TouchableOpacity>
              </TableHeadCell>
              <TableHeadCell className="w-[23%]">
                <TouchableOpacity
                  onPress={() =>
                    handleSort(
                      type === "client"
                        ? SortOption.SupervisionType
                        : SortOption.Facility,
                    )
                  }
                  className="flex size-full flex-row items-center"
                >
                  <Typography className="text-left text-sm font-medium text-secondary group-hover:text-brand">
                    {type === "client" ? "SUPERVISION" : "FACILITY"}{" "}
                  </Typography>
                  <View className="flex flex-col items-center justify-center gap-px p-0.5">
                    <SortArrow
                      arrowDirection="up"
                      isActive={
                        sort.sortBy ===
                          (type === "client"
                            ? SortOption.SupervisionType
                            : SortOption.Facility) &&
                        sort.direction === SortDirection.Ascending
                      }
                    />
                    <SortArrow
                      arrowDirection="down"
                      isActive={
                        sort.sortBy ===
                          (type === "client"
                            ? SortOption.SupervisionType
                            : SortOption.Facility) &&
                        sort.direction === SortDirection.Descending
                      }
                    />
                  </View>
                </TouchableOpacity>
              </TableHeadCell>
              <TableHeadCell className="w-[23%]">
                <TouchableOpacity
                  onPress={() => handleSort(SortOption.LastMeeting)}
                  className="flex size-full flex-row items-center"
                >
                  <Typography className="text-left text-sm font-medium text-secondary group-hover:text-brand">
                    LAST MEETING{" "}
                  </Typography>
                  <View className="flex flex-col items-center justify-center gap-px p-0.5">
                    <SortArrow
                      arrowDirection="up"
                      isActive={
                        sort.sortBy === SortOption.LastMeeting &&
                        sort.direction === SortDirection.Ascending
                      }
                    />
                    <SortArrow
                      arrowDirection="down"
                      isActive={
                        sort.sortBy === SortOption.LastMeeting &&
                        sort.direction === SortDirection.Descending
                      }
                    />
                  </View>
                </TouchableOpacity>
              </TableHeadCell>
              <TableHeadCell className="w-[4%]"></TableHeadCell>
            </TableHeadRow>
          </TableHead>
          <TableBody>
            {persons.map((person) => {
              const isPersonInActiveMeeting =
                status !== "idle" &&
                recordingPerson?.personId === person.personId &&
                !!activeMeetingId;

              return (
                <TableRow
                  key={person.personId}
                  // onClickCapture allows row to be clicked instead of Pressable inside TooltipText,
                  // If inside row by design we have to add something clickable
                  // then this solution has to be changed
                  onClickCapture={() =>
                    handleNavigateToProfile(person.personId.toString())
                  }
                >
                  <TableCell>
                    <View className="flex size-full flex-row items-center gap-3">
                      <ImageBackground
                        source={BgAvatarImage}
                        className="size-11 items-center justify-center overflow-hidden rounded-full"
                        imageClassName="!size-11"
                      >
                        <Typography className="text-base font-medium text-on-brand">
                          {getInitials(person.fullName)}
                        </Typography>
                      </ImageBackground>
                      <TooltipText triggerTextClassName="text-base font-medium capitalize text-primary">
                        {person.fullName.toLowerCase()}
                      </TooltipText>
                    </View>
                  </TableCell>
                  <TableCell>
                    <TooltipText triggerTextClassName="text-secondary">
                      {person.displayPersonExternalId}
                    </TooltipText>
                  </TableCell>
                  {!isPersonInActiveMeeting &&
                  person.meetingDetails.validationErrorType ? (
                    <TableCell colSpan={2}>
                      <ProcessingErrorBanner
                        validationErrorType={
                          person.meetingDetails.validationErrorType
                        }
                        className="h-[90%]"
                      />
                    </TableCell>
                  ) : (
                    <>
                      <TableCell>
                        <TooltipText triggerTextClassName="text-secondary">
                          {person.primaryMetadata}
                        </TooltipText>
                      </TableCell>
                      <TableCell>
                        {isPersonInActiveMeeting && (
                          <View className="flex-row items-center pb-2">
                            <RecordingIndicator
                              isRecording={status === "recording"}
                            />
                            <Typography className="px-2 text-secondary">
                              In progress
                            </Typography>
                          </View>
                        )}
                        {!isPersonInActiveMeeting &&
                          !person.meetingDetails.validationErrorType && (
                            <View className="flex flex-col">
                              <Typography className="text-base font-medium text-secondary">
                                {upperFirst(person.lastMeeting)}
                                {person.meetingDetails.staffEmail && " by"}
                              </Typography>
                              <TooltipText triggerTextClassName="text-base font-medium text-secondary">
                                {person.meetingDetails.staffEmail}
                              </TooltipText>
                            </View>
                          )}
                      </TableCell>
                    </>
                  )}

                  <TableCell>
                    <View className="invisible size-5 items-center justify-center group-hover:visible">
                      <ChevronRightIcon className="stroke-secondary stroke-[3px]" />
                    </View>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </View>
      {totalPages > 1 && (
        <View className="mt-2 w-full border-spacing-0 overflow-hidden rounded-[20px] border border-subtle">
          <TablePagination
            page={page}
            setPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            setNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
            tableItemsLength={total}
          />
        </View>
      )}
    </>
  );
}

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

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { View, VirtualizedList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Person } from "../common/types";
import { RootStackParamList } from "../navigation/DrawerNavigator";
import PersonCardItem from "./PersonCardItem";
import PersonsHeaderContent from "./PersonsHeaderContent";
import PersonsPlaceholder from "./PersonsPlaceholder";

type ProfileNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "Clients" | "Residents"
>;

type Props = {
  persons: Person[];
  recordingState: string;
  navigation: ProfileNavProp;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSortBy: (option: string) => void;
  keyword: "Client" | "Resident";
  className?: string;
};

const PersonsMobileList = ({
  persons,
  recordingState,
  navigation,
  searchQuery,
  setSearchQuery,
  setSortBy,
  keyword,
  className,
}: Props) => {
  const insets = useSafeAreaInsets();
  const emptyListPlaceholderMessage =
    keyword === "Client" ? "No clients found" : "No residents found";
  const headerDescription =
    keyword === "Client"
      ? "All clients on your caseload are displayed below"
      : "All residents are displayed below";

  return (
    <VirtualizedList
      className={className}
      data={persons}
      keyExtractor={(item: Person) => item.personId.toString()}
      getItemCount={(data: Person[]) => data.length}
      getItem={(data: Person[], index) => data[index]}
      renderItem={({ item }: { item: Person }) => (
        <PersonCardItem
          person={item}
          recordingState={recordingState}
          navigation={navigation}
          type={keyword === "Client" ? "clients" : "residents"}
        />
      )}
      initialNumToRender={10}
      ListEmptyComponent={
        <PersonsPlaceholder
          message={emptyListPlaceholderMessage}
          onClearSearch={() => setSearchQuery("")}
        />
      }
      ListHeaderComponent={
        <View className="mx-auto w-full max-w-[960px] flex-1">
          <PersonsHeaderContent
            keyword={keyword}
            description={headerDescription}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSortBy={setSortBy}
          />
        </View>
      }
      contentContainerStyle={{ paddingBottom: insets.bottom }}
    />
  );
};

export default PersonsMobileList;

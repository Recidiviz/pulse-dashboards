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

import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Ref, useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { TouchableOpacity } from "react-native";

import Icons from "../../assets/icons";
import Modal from "./Modal";

const title = "Restricted to authorized users";
const content = `Recidiviz applications are restricted to authorized individuals in the performance of their assigned duties.
Any unauthorized use, misuse, or modification of the data in transit or from this system is strictly prohibited.

This system and the equipment are subject to monitoring to ensure proper performance of applicable security features or procedures. Such monitoring may result in the acquisition, recording, and analysis of all data being communicated, transmitted, processed, or stored in this system by a user.

If monitoring reveals possible evidence of criminal activity, such evidence may be provided to Law Enforcement Personnel.
Unauthorized use of the system is prohibited and subject to criminal and civil penalties.

Use of the system indicates consent to monitoring and recording. Data hosted in this application is confidential. Users should log off of this system if they do not agree to these requirements.`;

type LearnMoreModalProps = {
  visible: boolean;
  onClose: () => void;
};

export const LearnMoreModal = ({ visible, onClose }: LearnMoreModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onClose={onClose}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="font-inter text-xl font-semibold text-primary">
          {title}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Image source={Icons.Cross} className="!size-5" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <Text className="font-inter leading-[22px] text-primary">
          {content}
        </Text>
      </ScrollView>
    </Modal>
  );
};

type LearnMoreSheetProps = {
  ref?: Ref<BottomSheet>;
};

export const LearnMoreSheet = ({ ref }: LearnMoreSheetProps) => {
  const snapPoints = useMemo(() => ["70%"], []);

  const handleClose = () => {
    if (ref && "current" in ref && ref.current) {
      ref.current.close();
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      handleIndicatorStyle={{ backgroundColor: "#35536280" }}
    >
      <BottomSheetScrollView className="px-5">
        <Text className="mb-4 text-base leading-6 text-gray-700">
          {content}
        </Text>
        <TouchableOpacity
          className="mb-6 mt-4 rounded-full border border-gray-300 bg-white py-4"
          onPress={handleClose}
        >
          <Text className="text-center font-semibold text-gray-700">Close</Text>
        </TouchableOpacity>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};

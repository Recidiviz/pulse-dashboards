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

import { ReactNode } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import XIcon from "react-native-heroicons/outline/XIcon";

import Modal from "~@meetings/app/shared/ui/Modal";
import { Typography } from "~@meetings/app/shared/ui/Typography";
import {
  ConfigFieldDoc,
  ConfigSchemaSection,
  getConfigSchemaSections,
} from "~@meetings/config";

import { ConfigSchema } from "../lib/configValidation";

type Props = {
  schema: ConfigSchema;
  rootName: string;
  onClose: () => void;
};

export function AgencyConfigFieldsModal({ schema, rootName, onClose }: Props) {
  const sections = getConfigSchemaSections(schema, rootName);

  return (
    <Modal
      visible
      transparent
      onClickOutside={onClose}
      containerClassName="sm:w-[640px] w-[520px] max-h-[80vh]"
    >
      <View className="flex flex-col px-6 py-5">
        <View className="relative mb-3 flex w-full flex-col gap-1">
          <Typography variant="heading-4">Available config fields</Typography>
          <Typography variant="body-s-regular">
            Below are the fields recognized by the schemas used for config
            validation along with the expected types and other details. Includes
            details for nested schemas referenced.
          </Typography>
          <TouchableOpacity
            onPress={onClose}
            className="absolute right-0 top-0"
          >
            <XIcon className="size-4 stroke-tertiary" />
          </TouchableOpacity>
        </View>
        <ScrollView className="max-h-[60vh]">
          <View className="flex flex-col gap-6 py-1">
            {sections.map((section) => (
              <SectionBlock key={section.name} section={section} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function SectionBlock({ section }: { section: ConfigSchemaSection }) {
  return (
    <View className="flex flex-col gap-3">
      <View className="flex flex-col gap-1">
        <Typography className="font-mono text-base font-semibold text-primary">
          {section.name}
        </Typography>
        {section.description && (
          <Typography variant="body-s-regular">
            {section.description}
          </Typography>
        )}
      </View>
      <View className="ml-4 flex flex-col gap-4">
        {section.fields.map((field) => (
          <FieldRow key={field.key} field={field} />
        ))}
      </View>
    </View>
  );
}

function FieldRow({ field }: { field: ConfigFieldDoc }) {
  return (
    <View className="flex flex-col gap-1 border-b border-subtle pb-3">
      <View className="flex flex-row flex-wrap items-center gap-2">
        <Typography className="font-mono text-sm font-semibold text-primary">
          {field.key}
        </Typography>
        <Tag>{field.typeLabel}</Tag>
        {!field.required && <Tag>optional</Tag>}
        {field.defaultValue !== undefined && (
          <Tag>default: {field.defaultValue}</Tag>
        )}
      </View>
      {field.description && (
        <Typography variant="body-s-regular">{field.description}</Typography>
      )}
    </View>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <View className="rounded-full bg-secondary px-2 py-0.5">
      <Typography variant="caption-s-regular">{children}</Typography>
    </View>
  );
}

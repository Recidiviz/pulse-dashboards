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

import { observer } from "mobx-react-lite";

import { useTypesenseStore } from "../../../../components/StoreProvider";
import type {
  CollectionField,
  CollectionSchema,
} from "../../../../RootStore/TypesenseStore";
import { SectionCardHeader } from "../../../SectionCard";
import {
  CardBody,
  CollectionBlock,
  CollectionFieldCount,
  CollectionName,
  CollectionPanel,
  CollectionSettings,
  CollectionSummaryRow,
  DataTable,
  FieldAttrsCell,
  FieldNameCell,
  FieldTypeCell,
  SchemaEmptyMessage,
  TableWrap,
  TypesenseCard,
} from "../styles";

function fieldAttributes(field: CollectionField): string {
  return (["facet", "optional", "sort", "infix"] as const)
    .filter((k) => field[k])
    .join(", ");
}

function collectionSettings(schema: CollectionSchema): string | null {
  const parts: string[] = [];
  if (schema.enable_nested_fields) parts.push("enable_nested_fields=true");
  if (schema.default_sorting_field)
    parts.push(`default_sorting_field=${schema.default_sorting_field}`);
  return parts.length > 0 ? `Collection Settings: ${parts.join(" · ")}` : null;
}

export const SchemaCard = observer(function SchemaCard() {
  const store = useTypesenseStore();
  const { collectionsSchema } = store;
  const schemas = collectionsSchema ? Object.values(collectionsSchema) : [];

  return (
    <TypesenseCard>
      <SectionCardHeader>Collection Schema</SectionCardHeader>
      <CardBody>
        <TableWrap>
          {schemas.length > 0 ? (
            schemas.map((schema) => {
              const settings = collectionSettings(schema);
              return (
                <CollectionBlock key={schema.name}>
                  <CollectionSummaryRow>
                    <CollectionName>{schema.name}</CollectionName>
                    <CollectionFieldCount>
                      ({schema.fields.length} fields)
                    </CollectionFieldCount>
                  </CollectionSummaryRow>
                  <CollectionPanel>
                    <DataTable>
                      <tbody>
                        {schema.fields.map((field) => (
                          <tr key={field.name}>
                            <FieldNameCell>{field.name}</FieldNameCell>
                            <FieldTypeCell>{field.type}</FieldTypeCell>
                            <FieldAttrsCell>
                              {fieldAttributes(field)}
                            </FieldAttrsCell>
                          </tr>
                        ))}
                      </tbody>
                    </DataTable>
                    {settings && (
                      <CollectionSettings>{settings}</CollectionSettings>
                    )}
                  </CollectionPanel>
                </CollectionBlock>
              );
            })
          ) : (
            <SchemaEmptyMessage>No collections found</SchemaEmptyMessage>
          )}
        </TableWrap>
      </CardBody>
    </TypesenseCard>
  );
});

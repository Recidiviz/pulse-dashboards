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
import { SectionCardHeader } from "../../../SectionCard";
import {
  CardBody,
  ColHeader,
  DataTable,
  EmptyCell,
  NameCell,
  NumCell,
  TableWrap,
  TypesenseCard,
} from "../styles";

export const SummaryCard = observer(function SummaryCard() {
  const store = useTypesenseStore();
  const { collectionsSummary } = store;

  return (
    <TypesenseCard>
      <SectionCardHeader>Collection Summary</SectionCardHeader>
      <CardBody>
        <TableWrap>
          <DataTable>
            <thead>
              <tr>
                <ColHeader>Name</ColHeader>
                <ColHeader $right>Docs</ColHeader>
                <ColHeader $right>Fields</ColHeader>
              </tr>
            </thead>
            <tbody>
              {collectionsSummary && collectionsSummary.length > 0 ? (
                collectionsSummary.map((c) => (
                  <tr key={c.name}>
                    <NameCell>{c.name}</NameCell>
                    <NumCell>{c.numDocuments.toLocaleString()}</NumCell>
                    <NumCell>{c.numFields}</NumCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <EmptyCell colSpan={3}>No collections found</EmptyCell>
                </tr>
              )}
            </tbody>
          </DataTable>
        </TableWrap>
      </CardBody>
    </TypesenseCard>
  );
});

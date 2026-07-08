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

import { Button } from "~design-system";
import { hydrationFailure, Hydrator } from "~hydration-utils";

import { useTypesenseStore } from "../../../components/StoreProvider";
import { SectionCardHeader } from "../../SectionCard";
import { StatusCard } from "./Status/StatusCard";
import {
  CardBody,
  CardsRow,
  CenteredRow,
  ErrorMessage,
  ErrorTitle,
  StatusCardColumn,
  TitleRow,
  TypesenseCard,
  TypesenseSectionContainer,
} from "./styles";
import { SummaryCard } from "./Summary/SummaryCard";

const TypesenseSectionError = observer(function TypesenseSectionError() {
  const store = useTypesenseStore();
  const error = hydrationFailure(store);

  return (
    <TypesenseCard>
      <SectionCardHeader>Error</SectionCardHeader>
      <CardBody>
        <ErrorTitle>Failed to load Typesense data</ErrorTitle>
        {error && <ErrorMessage>{error.message}</ErrorMessage>}
        <CenteredRow>
          <Button kind="secondary" shape="pill" onClick={() => store.refresh()}>
            Refresh
          </Button>
        </CenteredRow>
      </CardBody>
    </TypesenseCard>
  );
});

// Displays all Typesense monitoring tools for easy triage of common issues
export const TypesenseSection = observer(function TypesenseSection() {
  const store = useTypesenseStore();

  return (
    <TypesenseSectionContainer>
      <TitleRow>
        <div className="Profile__heading">Typesense</div>
      </TitleRow>
      <Hydrator hydratable={store} failed={<TypesenseSectionError />}>
        <CardsRow>
          <StatusCardColumn>
            <StatusCard />
            <Button
              kind="secondary"
              shape="pill"
              onClick={() => store.refresh()}
            >
              Refresh
            </Button>
          </StatusCardColumn>
          <SummaryCard />
        </CardsRow>
      </Hydrator>
    </TypesenseSectionContainer>
  );
});

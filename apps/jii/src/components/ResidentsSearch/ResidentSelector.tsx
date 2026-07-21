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

import { Body16 } from "@recidiviz/design-system";
import { useQuery } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { FC, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Selector } from "~@jii/common-ui";
import {
  useNewResidentData,
  useResidentsContext,
  useRootStore,
} from "~@jii/data";
import {
  ErrorPageMainContent,
  MainContentHydratorWithErrorLogging,
} from "~@jii/layout";
import { State } from "~@jii/paths";
import { castToError, withPresenterManager } from "~hydration-utils";

import { ResidentSelectorPresenter } from "./ResidentSelectorPresenter";

function usePresenter({ facilityId }: { facilityId: string }) {
  const { residentsStore } = useResidentsContext();
  return new ResidentSelectorPresenter(residentsStore, facilityId);
}

type SelectOption = {
  label: string;
  value: { pseudonymizedId: string };
};

// this renders the UI irrespective of the data source
const ResidentSelectorInner: FC<{ selectOptions: Array<SelectOption> }> = ({
  selectOptions,
}) => {
  const navigate = useNavigate();
  const residentLabelId = useId();
  const urlParams = useTypedParams(State.Search);
  return (
    <>
      <Body16 as="p" id={residentLabelId}>
        Search for a resident to explore what they will see in Opportunities.
      </Body16>
      <Selector
        labelId={residentLabelId}
        options={selectOptions}
        onChange={(value) => {
          // this should land you on the selected resident's homepage
          navigate(
            State.Resident.buildPath({
              ...urlParams,
              personPseudoId: value.pseudonymizedId,
            }),
          );
        }}
        placeholder="Start typing a resident's name or DOC ID …"
      />
    </>
  );
};

const ManagedComponent: FC<{ presenter: ResidentSelectorPresenter }> = observer(
  function ResidentSelectorWithPresenter({ presenter }) {
    return <ResidentSelectorInner selectOptions={presenter.selectOptions} />;
  },
);

// TODO(OBT-29541): don't need this anymore once the migration is complete
const FirestoreResidentSelector = withPresenterManager({
  usePresenter,
  ManagedComponent,
  managerIsObserver: true,
  HydratorComponent: MainContentHydratorWithErrorLogging,
});

function TrpcResidentSelector({ facilityId }: { facilityId: string }) {
  const {
    apiClient: { trpcQuerier },
  } = useRootStore();
  const newData = useQuery(
    trpcQuerier.resident.getResidentsInFacility.queryOptions({ facilityId }),
  );

  if (newData.error)
    return <ErrorPageMainContent error={castToError(newData.error)} />;

  if (!newData.data) return null;

  const selectOptions = newData.data.map((r) => ({
    label: `${r.givenNames ?? ""} ${r.surname ?? ""} (${r.displayId})`,
    value: r,
  }));

  return <ResidentSelectorInner selectOptions={selectOptions} />;
}

export function ResidentSelector({ facilityId }: { facilityId: string }) {
  return useNewResidentData() ? (
    <TrpcResidentSelector facilityId={facilityId} />
  ) : (
    <FirestoreResidentSelector facilityId={facilityId} />
  );
}

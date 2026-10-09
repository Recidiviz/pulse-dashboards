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
import { FC, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useTypedParams } from "react-router-typesafe-routes/dom";

import { Selector } from "~@jii/common-ui";
import { useRootStore } from "~@jii/data";
import { ErrorPageMainContent } from "~@jii/layout";
import { State } from "~@jii/paths";
import { castToError } from "~hydration-utils";

type SelectOption = {
  label: string;
  value: { pseudonymizedId: string };
};

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

export function ResidentSelector({ facilityId }: { facilityId: string }) {
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

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

// @ts-expect-error Types from the extended component library can't be resolved under
// moduleResolution of "node"
import { PlacePicker } from "@googlemaps/extended-component-library/react";
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import styled from "styled-components/macro";

import { palette } from "~design-system";

import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const PlacePickerContainer = styled.div`
  margin-bottom: ${rem(spacing.lg)};
`;

const PlacePickerLabel = styled.div`
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const StyledPlacePicker = styled(PlacePicker)`
  width: 100%;
`;

export const RoutePlannerPlacePicker = observer(
  function RoutePlannerPlacePicker({
    presenter,
  }: {
    presenter: RoutePlannerPresenter;
  }) {
    return (
      <PlacePickerContainer>
        <PlacePickerLabel>Your starting address</PlacePickerLabel>
        <StyledPlacePicker
          placeholder={presenter.startingAddressPlaceholder}
          country={["us"]}
          locationBias={presenter.locationBias}
          radius={presenter.radius}
          strictBounds={true}
          // @ts-expect-error We don't have types from the extended component library
          onPlaceChange={(e) => {
            presenter.userPickedStartingAddress =
              e.target.value?.formattedAddress;
          }}
        />
      </PlacePickerContainer>
    );
  },
);

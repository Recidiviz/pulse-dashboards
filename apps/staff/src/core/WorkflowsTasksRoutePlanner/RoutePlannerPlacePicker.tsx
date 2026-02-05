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

// prettier-ignore
// @ts-expect-error Types from the extended component library can't be resolved under moduleResolution of "node"
import { Place, PlacePicker } from "@googlemaps/extended-component-library/react";
import { spacing } from "@recidiviz/design-system";
import { observer } from "mobx-react-lite";
import { rem } from "polished";
import { useRef } from "react";
import styled from "styled-components";

import { palette } from "~design-system";

import Checkbox from "../../components/Checkbox/Checkbox";
import { RoutePlannerPresenter } from "./RoutePlannerPresenter";

const PlacePickersRow = styled.div`
  display: flex;
  gap: ${rem(spacing.md)};
`;

const PlacePickerContainer = styled.div`
  flex: 1;
`;

const PlacePickerLabel = styled.div`
  color: ${palette.pine1};
  margin-bottom: ${rem(spacing.sm)};
`;

const CheckboxContainer = styled.div`
  margin-top: ${rem(spacing.sm)};

  .Checkbox__container {
    width: auto;
    height: auto;
    display: flex;
    align-items: center;
  }

  .Checkbox__label {
    top: 0;
    font-size: ${rem(13)};
    font-weight: 500;
  }
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
    const hasStartingAddress = !!presenter.startingAddress;
    const startingPickerRef = useRef<PlacePicker>(null);
    const endingPickerRef = useRef<PlacePicker>(null);

    const syncEndingPickerWithStart = () => {
      const startingPicker: PlacePicker = startingPickerRef.current;
      const endingPicker: PlacePicker = endingPickerRef.current;
      if (!startingPicker || !endingPicker) return;

      const startingPlace: Place = startingPicker.value;
      if (!startingPlace) return;

      // valueInternal is the PlacePicker's internal Place object setter from Google's
      // extended-component-library — we use it to programmatically sync the ending
      // picker's selection with the starting picker's value.
      // See: https://github.com/googlemaps/extended-component-library/blob/70aff8d2f92a2cc925bf37338e7ad298edf008aa/src/place_picker/place_picker.ts#L240
      endingPicker.valueInternal = startingPlace;

      const input = endingPicker.shadowRoot?.querySelector("input");
      if (input && startingPlace.formattedAddress) {
        input.value = startingPlace.formattedAddress;
      }

      // Dispatch the placechange event so our handler fires
      endingPicker.dispatchEvent(new Event("gmpx-placechange"));
    };

    const clearEndingPicker = () => {
      const endingPicker = endingPickerRef.current;
      if (!endingPicker) return;

      endingPicker.valueInternal = undefined;

      const input = endingPicker.shadowRoot?.querySelector("input");
      if (input) {
        input.value = "";
      }

      endingPicker.dispatchEvent(new Event("gmpx-placechange"));
    };

    const handleCheckboxChange = () => {
      const newValue = !presenter.isEndingAddressMatchingStart;
      presenter.setEndingAddressMatchingStart(newValue);

      if (newValue) {
        syncEndingPickerWithStart();
      } else {
        clearEndingPicker();
      }
    };

    return (
      <>
        <PlacePickersRow>
          <PlacePickerContainer>
            <PlacePickerLabel>Starting address</PlacePickerLabel>
            <StyledPlacePicker
              ref={startingPickerRef}
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

          <PlacePickerContainer>
            <PlacePickerLabel>
              Ending address <small>(optional)</small>
            </PlacePickerLabel>
            <StyledPlacePicker
              ref={endingPickerRef}
              placeholder={presenter.endingAddressPlaceholder}
              country={["us"]}
              locationBias={presenter.locationBias}
              radius={presenter.radius}
              strictBounds={true}
              // @ts-expect-error We don't have types from the extended component library
              onPlaceChange={(e) => {
                presenter.userPickedEndingAddress =
                  e.target.value?.formattedAddress;
              }}
            />
          </PlacePickerContainer>
        </PlacePickersRow>

        <CheckboxContainer>
          <Checkbox
            value="match-addresses"
            name="match-addresses"
            checked={presenter.isEndingAddressMatchingStart}
            disabled={!hasStartingAddress}
            onChange={handleCheckboxChange}
          >
            Match starting and ending address
          </Checkbox>
        </CheckboxContainer>
      </>
    );
  },
);

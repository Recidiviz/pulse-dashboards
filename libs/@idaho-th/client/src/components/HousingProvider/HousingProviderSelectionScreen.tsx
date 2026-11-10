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

import React from "react";

import { useSwitchHousingProvider } from "../../hooks/housingProvider";
import type { HousingProviderOption } from "../../interfaces/common";
import ArrowLeftIcon from "../assets/arrow-left.svg?react";
import { AppHeader } from "../HousingApplications/AppHeader/AppHeader";
import * as Styled from "./HousingProviderSelectionScreen.styles";
import { formatLocationsCount } from "./HousingProviderSelectionScreen.utils";

export interface HousingProviderSelectionScreenProps {
  housingProviders: HousingProviderOption[];
  /**
   * Present when the user opened the picker from a provider they were already
   * acting as. Going back keeps that provider's loaded data; picking it from
   * the list would clear and refetch it.
   */
  onBack?: () => void;
}

/**
 * Where a provider picks the organization they are acting as.
 *
 * An empty list is not an error and not an empty table — it is the plain
 * explanation that nobody has assigned this person to an organization yet. The
 * screen never issues a provider-scoped query, so a user with no assignments
 * cannot be bounced back here by the very request that brought them.
 */
export const HousingProviderSelectionScreen: React.FC<
  HousingProviderSelectionScreenProps
> = ({ housingProviders, onBack }) => {
  const switchHousingProvider = useSwitchHousingProvider();

  if (housingProviders.length === 0) {
    return (
      <Styled.PageContainer>
        <AppHeader />
        <Styled.PageContent>
          <Styled.Panel>
            <Styled.Title>No provider assigned</Styled.Title>
            <Styled.Description>
              Your account is not assigned to a housing provider yet, so there
              are no applications to show. Contact your administrator to be
              added to one.
            </Styled.Description>
          </Styled.Panel>
        </Styled.PageContent>
      </Styled.PageContainer>
    );
  }

  return (
    <Styled.PageContainer>
      <AppHeader />
      <Styled.PageContent>
        <Styled.PageHeading>
          {onBack && (
            <Styled.BackButton type="button" onClick={onBack}>
              <ArrowLeftIcon aria-hidden />
              Back
            </Styled.BackButton>
          )}
          <Styled.PageTitle>Choose a provider</Styled.PageTitle>
          <Styled.Description>
            Your applications are scoped to the provider you pick. You can
            switch at any time.
          </Styled.Description>
        </Styled.PageHeading>
        <Styled.HousingProviderList>
          {housingProviders.map((housingProvider) => {
            const details = [
              // formatDistricts(housingProvider.districts),
              formatLocationsCount(housingProvider.locationsCount),
            ].filter((detail) => detail !== null);

            return (
              <li key={housingProvider.id}>
                <Styled.HousingProviderButton
                  type="button"
                  onClick={() => switchHousingProvider(housingProvider)}
                >
                  <Styled.HousingProviderName>
                    {housingProvider.name}
                  </Styled.HousingProviderName>
                  {details.length > 0 && (
                    <Styled.HousingProviderDetail>
                      {details.join(" • ")}
                    </Styled.HousingProviderDetail>
                  )}
                </Styled.HousingProviderButton>
              </li>
            );
          })}
        </Styled.HousingProviderList>
      </Styled.PageContent>
    </Styled.PageContainer>
  );
};

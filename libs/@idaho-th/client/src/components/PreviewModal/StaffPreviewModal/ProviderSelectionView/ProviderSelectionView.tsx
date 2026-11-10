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
import { useState } from "react";

import { ActionButton } from "~@idaho-th/client/components/common/buttons";

import { Spinner } from "../../../common/LoadingSpinner/Spinner";
import { SearchBar } from "../../../common/SearchBar";
import * as ParentStyled from "../../PreviewModal.styles";
import { ProviderDetailView } from "../ProviderResponses/ProviderDetails/ProviderDetailView";
import { FullEmptyStateView } from "./common";
import { Header } from "./Header";
import { IneligibleProviderModal } from "./IneligibleProviderModal";
import * as Styled from "./ProviderSelectionView.styles";
import { SelectedProviders } from "./SelectedProviders";
import { SuggestedProviders } from "./SuggestedProviders";
import {
  ProviderSelectionVariant,
  useProviderSelection,
} from "./useProviderSelection";
import { toProviderDetail } from "./utils/toProviderDetail";

interface ProviderSelectionViewProps {
  variant?: ProviderSelectionVariant;
  onClose?: () => void;
  onSent?: (count: number) => void;
}

export const ProviderSelectionView = observer(function ProviderSelectionView({
  variant = "default",
  onClose,
  onSent,
}: ProviderSelectionViewProps) {
  const {
    form,
    eligibilityParams,
    isAutoSelectPending,
    isProvidersLoading,
    searchResults,
    newProvider,
    setNewProvider,
    selected,
    suggestions,
    eligibleProviders,
    allEligibleSent,
    isSendPending,
    sendButtonLabel,
    handleSearch,
    handleSelectProvider,
    handleAddNewProvider,
    handleAddToSelected,
    handleRemoveFromSelected,
    handleSendToProviders,
  } = useProviderSelection(variant, onClose, onSent);

  const [detailProviderId, setDetailProviderId] = useState<string | null>(null);

  if (!form || !eligibilityParams) return null;

  if (isAutoSelectPending) {
    return (
      <Styled.ProviderRoot>
        <Styled.ProvidersBody $centered>
          <Spinner size="2rem" />
        </Styled.ProvidersBody>
      </Styled.ProviderRoot>
    );
  }

  // Details open from the providers panel only, never inside the Add Provider modal
  const handleOpenDetails =
    variant === "modal" ? undefined : setDetailProviderId;

  const detailProvider = [...selected, ...suggestions].find(
    (provider) => provider.id === detailProviderId,
  );

  if (detailProvider) {
    return (
      <ProviderDetailView
        provider={toProviderDetail(detailProvider)}
        onBack={() => setDetailProviderId(null)}
      />
    );
  }

  const searchBar = (
    <SearchBar
      placeholder="Search for provider"
      onSearch={handleSearch}
      items={searchResults}
      onSelectItem={handleSelectProvider}
      loading={isProvidersLoading}
    />
  );

  const header = <Header variant={variant} onClose={onClose} />;

  const ineligibleModal = newProvider && (
    <IneligibleProviderModal
      isOpen
      onClose={() => setNewProvider(null)}
      provider={newProvider}
      onConfirm={handleAddNewProvider}
    />
  );

  if (eligibleProviders.length === 0) {
    return (
      <FullEmptyStateView
        header={header}
        searchBar={searchBar}
        title="No eligible providers found"
        body="We couldn't find any providers that match this client's eligibility criteria. Use the search bar above to add a provider manually."
      >
        {ineligibleModal}
      </FullEmptyStateView>
    );
  }

  if (allEligibleSent) {
    return (
      <FullEmptyStateView
        header={header}
        searchBar={searchBar}
        title="Application sent to all recommended providers"
        body="An application has already been sent to all eligible providers. Use the search bar above to add additional providers manually."
      >
        {ineligibleModal}
      </FullEmptyStateView>
    );
  }

  return (
    <Styled.ProviderRoot>
      <Styled.HeaderWrapper>
        {header}
        <Styled.SearchBarWrapper>{searchBar}</Styled.SearchBarWrapper>
      </Styled.HeaderWrapper>

      <Styled.ProvidersBody>
        <SelectedProviders
          selected={selected}
          onRemove={handleRemoveFromSelected}
          onSelect={handleOpenDetails}
          hideEmptyState={variant === "modal"}
        />
        <SuggestedProviders
          suggestions={suggestions}
          onAdd={handleAddToSelected}
          onSelect={handleOpenDetails}
        />
      </Styled.ProvidersBody>

      <ParentStyled.PanelFooter>
        {variant === "modal" && onClose && (
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
        )}
        <Styled.SendButtonColumn>
          <ActionButton
            onClick={handleSendToProviders}
            disabled={selected.length === 0}
            isLoading={isSendPending}
          >
            {sendButtonLabel}
          </ActionButton>
        </Styled.SendButtonColumn>
      </ParentStyled.PanelFooter>

      {selected.length > 0 && (
        <Styled.SendButtonSubtextRow>
          <Styled.SendButtonSubtext>
            You can send to more providers later
          </Styled.SendButtonSubtext>
        </Styled.SendButtonSubtextRow>
      )}

      {ineligibleModal}
    </Styled.ProviderRoot>
  );
});

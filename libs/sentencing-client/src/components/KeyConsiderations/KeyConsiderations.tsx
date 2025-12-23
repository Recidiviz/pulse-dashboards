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

import { observer } from "mobx-react-lite";
import React from "react";

import { SARDetailsPresenter } from "../../presenters/SARDetailsPresenter";
import { NeedsToBeAddressed, ProtectiveFactors } from "../constants";
import { MultiSelectRadioInput } from "../shared/MultiSelectRadioInput";
import * as Styled from "./KeyConsiderations.styles";
import { createMultiSelectHandler, mapEnumKeysToDisplay } from "./utils";

interface KeyConsiderationsProps {
  presenter: SARDetailsPresenter;
}

export const KeyConsiderations: React.FC<KeyConsiderationsProps> = observer(
  function KeyConsiderations({ presenter }) {
    const {
      needsToBeAddressed,
      otherNeedToBeAddressed,
      mitigatingFactors,
      otherMitigatingFactor,
    } = presenter.sarData ?? {};

    const firstName = presenter.sarData?.client?.firstName ?? "the defendant";

    // Options from shared constants - display values for UI
    const needsOptions = Object.values(NeedsToBeAddressed);
    const factorsOptions = Object.values(ProtectiveFactors);

    // Auto-save handlers (follow CaseInformation pattern)
    const handleNeedsChange = createMultiSelectHandler(
      NeedsToBeAddressed,
      needsToBeAddressed,
      presenter.updateNeedsToBeAddressed,
      () => presenter.updateOtherNeedToBeAddressed(""),
    );

    const handleNeedsOtherChange = (value: string) => {
      presenter.updateOtherNeedToBeAddressed(value);
    };

    const handleFactorsChange = createMultiSelectHandler(
      ProtectiveFactors,
      mitigatingFactors,
      presenter.updateMitigatingFactors,
      () => presenter.updateOtherMitigatingFactor(""),
    );

    const handleFactorsOtherChange = (value: string) => {
      presenter.updateOtherMitigatingFactor(value);
    };

    // Convert stored enum keys to display values for UI
    const selectedNeedsDisplay = mapEnumKeysToDisplay(
      NeedsToBeAddressed,
      needsToBeAddressed,
    );
    const selectedFactorsDisplay = mapEnumKeysToDisplay(
      ProtectiveFactors,
      mitigatingFactors,
    );

    return (
      <Styled.Container>
        <Styled.InfoContainer>
          Select key considerations to help paint a fuller picture of{" "}
          {firstName}'s situation. <br />
          Considerations selected will be listed on the final report and will be
          used to identify potential community and institutional strategies.
        </Styled.InfoContainer>
        <MultiSelectRadioInput
          title="Select Areas of Need"
          options={needsOptions}
          selections={selectedNeedsDisplay}
          updateSelections={handleNeedsChange}
          otherValue={otherNeedToBeAddressed ?? ""}
          onOtherChange={handleNeedsOtherChange}
          otherPlaceholder="Please specify other need"
          includeIcon={false}
          skipped={presenter.needsSkipped}
          onSkipChange={(skipped) =>
            presenter.updateFieldSkipped(
              "keyConsiderations",
              skipped,
              "areasOfNeed",
            )
          }
        />

        <MultiSelectRadioInput
          title="Select Mitigating Factors"
          options={factorsOptions}
          selections={selectedFactorsDisplay}
          updateSelections={handleFactorsChange}
          otherValue={otherMitigatingFactor ?? ""}
          onOtherChange={handleFactorsOtherChange}
          otherPlaceholder="Please specify other mitigating factor"
          includeIcon={false}
          skipped={presenter.factorsSkipped}
          onSkipChange={(skipped) =>
            presenter.updateFieldSkipped(
              "keyConsiderations",
              skipped,
              "mitigatingFactors",
            )
          }
        />
      </Styled.Container>
    );
  },
);

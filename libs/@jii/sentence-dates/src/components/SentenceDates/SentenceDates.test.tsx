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

import { fireEvent, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";

import { prepareUsOzTranslations } from "../../fixtures/copy";
import { getSentenceDatesFixtureData } from "../../fixtures/data";
import { FakeStoreProvider } from "../../fixtures/store";
import { SentenceDates, SentenceDatesProps } from "./SentenceDates";

function renderSentenceDates({
  showToggle,
  hideSentenceDates,
}: Pick<SentenceDatesProps, "showToggle"> & { hideSentenceDates?: boolean }) {
  render(
    <Suspense>
      <I18nextProvider i18n={prepareUsOzTranslations()}>
        <FakeStoreProvider hideSentenceDates={hideSentenceDates}>
          <SentenceDates
            data={getSentenceDatesFixtureData()}
            stateCode="US_OZ"
            showToggle={showToggle}
          />
        </FakeStoreProvider>
      </I18nextProvider>
    </Suspense>,
  );
}

const HIDDEN_MESSAGE = "Your dates are currently hidden";
const DATE_LABEL = "Parole Eligibility Date";

describe("SentenceDates show/hide toggle", () => {
  it("shows the hidden message instead of the dates when hidden", async () => {
    renderSentenceDates({ showToggle: true, hideSentenceDates: true });

    expect(await screen.findByText(HIDDEN_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(DATE_LABEL)).not.toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("does not show the switch without showToggle", async () => {
    renderSentenceDates({});

    await screen.findByText(DATE_LABEL);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("shows the hidden message when the switch is clicked while dates are shown", async () => {
    renderSentenceDates({ showToggle: true, hideSentenceDates: false });

    fireEvent.click(await screen.findByRole("switch"));

    expect(await screen.findByText(HIDDEN_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(DATE_LABEL)).not.toBeInTheDocument();
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("shows dates regardless of the saved setting when showToggle is off", async () => {
    renderSentenceDates({ showToggle: false, hideSentenceDates: true });

    expect(await screen.findByText(DATE_LABEL)).toBeInTheDocument();
    expect(screen.queryByText(HIDDEN_MESSAGE)).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });
});

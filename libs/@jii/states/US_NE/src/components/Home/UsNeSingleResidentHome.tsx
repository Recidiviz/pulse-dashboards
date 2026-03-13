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

import { usePageTitle } from "~@jii/common-ui";
import { useResidentMetadata } from "~@jii/data";
import { useUsNeTranslations } from "~@jii/translation";

import { UsNeTodos } from "../Todos/UsNeTodos";
import UsNeDateCardGroup from "./UsNeDateCardGroup";
import UsNeGoodTimeAdjustments from "./UsNeGoodTimeAdjustments";
import UsNeGoodTimeCardGroup from "./UsNeGoodTimeCardGroup";
import UsNeHomeHeader from "./UsNeHomeHeader";

const UsNeSingleResidentHome = () => {
  const metadata = useResidentMetadata("US_NE");
  const { t } = useUsNeTranslations();
  usePageTitle(t(($) => $.home.pageTitle));

  if (!metadata.sentenceLastModifiedDate) {
    return <p>{t(($) => $.home.noSentenceFallback)}</p>;
  }

  return (
    <>
      <UsNeHomeHeader />
      <UsNeTodos />
      <UsNeDateCardGroup />
      <UsNeGoodTimeCardGroup />
      <UsNeGoodTimeAdjustments />
    </>
  );
};

export default UsNeSingleResidentHome;

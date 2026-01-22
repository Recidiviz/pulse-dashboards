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

import { makeAutoObservable } from "mobx";

import { UsNcRNAForm } from "../../models/UsNcRNAForm";
import { fullRNASpec, RNAQuestionId } from "./usNcRNAFormSpec";

export class UsNcRNAFormPagePresenter {
  constructor(
    readonly pageNum: number,
    public form: UsNcRNAForm,
  ) {
    makeAutoObservable(this);
  }

  // Methods related to the display of the form page itself

  get isValidPage(): boolean {
    return (
      Number.isInteger(this.pageIndex) &&
      this.pageIndex >= 0 &&
      this.pageIndex < fullRNASpec.length
    );
  }

  // Convenience method since page numbers are 1-indexed
  get pageIndex() {
    return this.pageNum - 1;
  }

  get sectionId() {
    return fullRNASpec[this.pageIndex].id;
  }

  get showSubmit(): boolean {
    return this.pageIndex === fullRNASpec.length - 1;
  }

  get questionIds(): RNAQuestionId[] {
    return fullRNASpec[this.pageIndex].questions;
  }
}

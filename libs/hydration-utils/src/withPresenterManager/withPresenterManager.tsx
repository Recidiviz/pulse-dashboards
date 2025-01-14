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
import { FC, memo, MemoExoticComponent } from "react";

import { Hydratable } from "../Hydratable/types";
import { HydratorProps } from "../Hydrator/types";

type HydratorComponentProps = Pick<HydratorProps, "children" | "hydratable">;

type ManagerOptsBase<Presenter, Props, HC> = {
  ManagedComponent: FC<{ presenter: Presenter }>;
  usePresenter: (props: Props) => Presenter | null;
  managerIsObserver: boolean;
  HydratorComponent?: HC;
};

type PresenterManagerOpts<Presenter, Props> = Presenter extends Hydratable
  ? ManagerOptsBase<Presenter, Props, FC<HydratorComponentProps>>
  : ManagerOptsBase<Presenter, Props, never>;

/**
 * Wraps `ManagedComponent` in a `PresenterManager` component, which creates a presenter,
 * manages its lifecycle, and passes it to `ManagedComponent` as a prop.
 *
 * @param opts.usePresenter - React hook function that creates a presenter.
 * - If `usePresenter` accepts a Props object, the returned `PresenterManager` will take
 * the same props.
 * - If `usePresenter` references any observables you **must** set `managerIsObserver` to `true`.
 * - `usePresenter` can return `null` to silently bail out of rendering (e.g. for type safety
 * or when waiting for an observable to populate)
 * @param opts.ManagedComponent - Component that will consume the presenter created by `usePresenter`.
 * @param opts.managerIsObserver - If `usePresenter` references any MobX observables, this **must** be
 * set to `true` to ensure `PresenterManager` is properly annotated with MobX.
 * @param opts.HydratorComponent - if provided, will be wrapped around `this.ManagedComponent` and
 * receive the presenter as a prop. Presenter must implement the {@link Hydratable} interface.
 * @returns a `PresenterManager` component that takes the same props as `opts.usePresenter`and renders
 * `ManagedComponent` as its children.
 */
export function withPresenterManager<Presenter, Props>({
  usePresenter,
  ManagedComponent,
  managerIsObserver,
  HydratorComponent,
}: PresenterManagerOpts<Presenter, Props>):
  | FC<Props>
  | MemoExoticComponent<FC<Props>> {
  function PresenterManager(managerProps: Props) {
    const presenter = usePresenter(managerProps);

    if (!presenter) return null;

    const wrapped = <ManagedComponent presenter={presenter} />;

    return HydratorComponent ? (
      // asserting Hydratable because `PresenterManagerOpts` ensures this component only
      // exists if the presenter is Hydratable, even though TS can't infer that here
      <HydratorComponent hydratable={presenter as unknown as Hydratable}>
        {wrapped}
      </HydratorComponent>
    ) : (
      wrapped
    );
  }

  // memoization is needed to prevent unnecessary re-renders from destroying and re-creating
  // the presenter; `observer` handles this for us if it is used
  return managerIsObserver
    ? observer(PresenterManager)
    : memo(PresenterManager);
}

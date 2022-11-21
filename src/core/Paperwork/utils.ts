// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2022 Recidiviz, Inc.
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
import { debounce, isString, throttle } from "lodash";
import { reaction } from "mobx";
import { rem } from "polished";
import * as React from "react";
import { MutableRefObject, useEffect, useRef, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { updateFormDraftData } from "../../firestore";
import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";
import { PrintablePageMargin } from "./styles";

export const REACTIVE_INPUT_UPDATE_DELAY = 2000;

export const useAnimatedValue = (
  input: MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  value?: string,
  duration = 1750,
  delay = 250
): boolean => {
  const [mountedAt, setMountedAt] = useState<number>(+new Date() + delay);
  const [animated, setAnimated] = useState<boolean>(false);
  const { workflowsStore } = useRootStore();

  useEffect(() => {
    let animationFrameId = 0;
    const animate = () => {
      if (!input.current || !value || !isString(value)) return;

      const elapsed = +new Date() - mountedAt;

      const range = Math.ceil(value.length * Math.min(1, elapsed / duration));

      // eslint-disable-next-line no-param-reassign
      input.current.value = value.substr(0, range);

      if (elapsed <= duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setAnimated(true);
      }
    };

    if (input.current) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [input, mountedAt, duration, value, setAnimated]);

  // Effect that triggers when a user selects the Print/Download CTA and stops the form-filling animation
  useEffect(() => {
    return reaction(
      () => workflowsStore.formIsPrinting,
      () => {
        if (workflowsStore.formIsPrinting) {
          setMountedAt(0);
          setAnimated(true);
        }
      }
    );
  }, [workflowsStore]);

  return animated;
};

export interface ResizeFormLayout {
  margin: number;
  scale: number;
  scaledHeight: number;
  transform: string;
}

export interface UseResizeForm {
  layout: ResizeFormLayout;
  resize: () => void;
}

export const useResizeForm = (
  formRef: React.MutableRefObject<HTMLDivElement>,
  pageSelector = `${PrintablePageMargin}`
): UseResizeForm => {
  const [layout, setLayout] = useState<ResizeFormLayout>({
    margin: 0,
    scale: 1,
    scaledHeight: 0,
    transform: "",
  });

  useEffect(() => {
    const resize = throttle(() => {
      const container = formRef.current;
      const page = formRef.current?.querySelector(
        pageSelector
      ) as HTMLDivElement;

      if (!page || !container) return;

      const margin = 0.075 * container.offsetWidth;
      const scale = (container.offsetWidth - margin * 2) / page.offsetWidth;
      const scaledMargin = margin / scale;
      const scaledHeight = page.offsetHeight * scale;

      const transform = `scale(${scale})
         translateX(${rem(scaledMargin)})
         translateY(${rem(10 / scale)})`;

      page.style.transform = transform;
      container.style.minHeight = rem(scaledHeight + scaledMargin * 2);

      setLayout({
        margin,
        transform,
        scale,
        scaledHeight,
      });
    }, 1000 / 60);

    resize();

    const eventList = ["resize", "scroll"];

    eventList.forEach((eventName) =>
      window.addEventListener(eventName, resize)
    );

    return () => {
      eventList.forEach((eventName) =>
        window.removeEventListener(eventName, resize)
      );
    };
  }, [formRef, pageSelector]);

  return { layout, resize: () => window.dispatchEvent(new Event("resize")) };
};

type ReactiveInputValue = string | undefined;
type ReactiveInputReturnValue<
  E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement
> = [ReactiveInputValue, (event: React.ChangeEvent<E>) => void];

function useReactiveInput<E extends HTMLInputElement | HTMLTextAreaElement>(
  name: string,
  form: FormBase<any>
): ReactiveInputReturnValue<E> {
  /*
    Hook which integrates a controlled input component and Firestore and MobX.
    Firestore is updated two seconds after the user stops typing.
    When the MobX value is updated (via a Firestore subscription or its onChange handler),
    we update the controlled input's state value.
   */

  const fetchFromStore = () => (form.formData[name] as string) || "";
  const [value, setValue] = useState<ReactiveInputValue>(fetchFromStore());

  const updateFirestoreRef = useRef(
    debounce((valueToStore: string) => {
      updateFormDraftData(form, name, valueToStore);
    }, REACTIVE_INPUT_UPDATE_DELAY)
  );

  const onChange = (event: React.ChangeEvent<E>) => {
    setValue(event.target.value);

    if (updateFirestoreRef.current) {
      updateFirestoreRef.current(event.target.value);
    }
  };

  useEffect(() => {
    return reaction(
      () => fetchFromStore(),
      (newValue) => {
        setValue(newValue);
      },
      { name: `useReactiveInput(${name})` }
    );
  });

  return [value, onChange];
}

export { useReactiveInput };

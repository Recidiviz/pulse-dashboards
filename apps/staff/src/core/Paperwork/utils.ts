// Recidiviz - a data platform for criminal justice reform
// Copyright (C) 2024 Recidiviz, Inc.
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

import { captureException } from "@sentry/react";
import saveAs from "file-saver";
import { debounce, isString, throttle } from "lodash";
import { autorun, reaction } from "mobx";
import PizZip from "pizzip";
import { rem } from "polished";
import * as React from "react";
import { MutableRefObject, useEffect, useRef, useState } from "react";

import { useRootStore } from "../../components/StoreProvider";
import { FormBase } from "../../WorkflowsStore/Opportunity/Forms/FormBase";
import { PrintablePageMargin } from "./styles";

export const REACTIVE_INPUT_UPDATE_DELAY = 2000;

export const DEFAULT_ANIMATION_DURATION = 1750;

export const useAnimatedValue = (
  input: MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  value?: string,
  duration = DEFAULT_ANIMATION_DURATION,
  delay = 250,
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

  // Effect that triggers when a user selects the Download CTA and stops the form-filling animation
  useEffect(() => {
    return reaction(
      () => workflowsStore.formIsDownloading,
      () => {
        if (workflowsStore.formIsDownloading) {
          setMountedAt(0);
          setAnimated(true);
        }
      },
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
  pageSelector = `${PrintablePageMargin}`,
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
      if (!container) return;
      const pages = container.querySelectorAll(
        pageSelector,
      ) as NodeListOf<HTMLDivElement>;

      if (pages.length === 0) {
        return;
      }

      const margin = 0;
      const scale = (container.offsetWidth - margin * 2) / pages[0].offsetWidth;
      const scaledMargin = margin / scale;

      const gutter = 10;

      let yOffset = gutter;
      let containerHeight = 0;

      pages.forEach((page, i) => {
        const transform = `scale(${scale})
         translateX(${rem(scaledMargin)})
         translateY(${rem(yOffset / scale)})`;

        yOffset += gutter + (scale - 1) * page.offsetHeight;
        containerHeight +=
          gutter + page.offsetHeight * scale + 2 * scaledMargin;

        page.style.transform = transform;

        if (i === 0) {
          setLayout({
            margin,
            transform,
            scale,
            scaledHeight: page.offsetHeight * scale,
          });
        }
      });

      container.style.minHeight = rem(containerHeight);
    }, 1000 / 60);

    resize();

    const eventList = ["resize", "scroll"];

    eventList.forEach((eventName) =>
      window.addEventListener(eventName, resize),
    );

    return () => {
      eventList.forEach((eventName) =>
        window.removeEventListener(eventName, resize),
      );
    };
  }, [formRef, pageSelector]);

  return { layout, resize: () => window.dispatchEvent(new Event("resize")) };
};

type ReactiveInputValue = string | undefined;
type ReactiveInputReturnValue<
  E extends
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement = HTMLInputElement,
> = [ReactiveInputValue, (event: React.ChangeEvent<E>) => void];

function useReactiveInput<
  E extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
>(name: string, form: FormBase<any>): ReactiveInputReturnValue<E> {
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
      form.updateDraftData(name, valueToStore);
    }, REACTIVE_INPUT_UPDATE_DELAY),
  );

  const onChange = (event: React.ChangeEvent<E>) => {
    setValue(event.target.value);

    if (updateFirestoreRef.current) {
      updateFirestoreRef.current(event.target.value);
    }
  };

  useEffect(() => {
    return autorun(() => {
      if (form.formIsDownloading) {
        updateFirestoreRef.current?.flush();
      }
      if (form.formIsReverting) {
        updateFirestoreRef.current?.cancel();
        setValue(fetchFromStore());
      }
    });
  });

  useEffect(() => {
    return reaction(
      () => fetchFromStore(),
      (newValue) => {
        setValue(newValue);
      },
      { name: `useReactiveInput(${name})` },
    );
  });

  return [value, onChange];
}

export { useReactiveInput };

export const downloadZipFile = (
  zipFilename: string,
  files: { filename: string; fileContents: any }[],
) => {
  try {
    const zip = new PizZip();
    files.forEach(({ filename, fileContents }) => {
      zip.file(filename, fileContents);
    });
    const blob = zip.generate({ type: "blob" });
    saveAs(blob, zipFilename);
  } catch (e) {
    captureException(e);
  }
};

export const createDownloadLabel = (
  formIsDownloading: boolean,
  buttonIsDisabled: boolean | undefined,
  downloadButtonLabel: string,
): string => {
  if (buttonIsDisabled) return "Download Unavailable";
  return formIsDownloading ? "Downloading..." : downloadButtonLabel;
};

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

import { act, renderHook } from "@testing-library/react";

import { SaveAnswers } from "../../../../../hooks/types";
import { ReentryQuestionnaireStatus } from "../../../types";
import {
  QuestionnaireQuestion,
  QuestionnaireSectionDisplay,
} from "../../types";
import { QuestionnaireScreen } from "../types";
import { useQuestionnaireFlow } from "../useQuestionnaireFlow";

const questions: QuestionnaireQuestion[] = [
  {
    id: "needsCare",
    format: "RADIO",
    heading: "Need care?",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
    ],
    sectionDomain: "health",
  },
  {
    id: "careDetails",
    format: "CHECKBOX",
    heading: "What care?",
    options: [
      { value: "MEDS", label: "Medicine" },
      { value: "UNSURE", label: "I'm not sure", exclusive: true },
    ],
    showIf: { questionId: "needsCare", operator: "equals", value: "YES" },
    sectionDomain: "health",
  },
  {
    id: "benefits",
    format: "RADIO",
    heading: "Benefits?",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
    ],
    sectionDomain: "money",
  },
];

const sections: QuestionnaireSectionDisplay[] = [
  { domain: "health", label: "Health" },
  { domain: "money", label: "Money" },
];

const save = vi.fn<SaveAnswers>();
const onExit = vi.fn();
const onGoToChecklist = vi.fn();

beforeEach(() => {
  // mockReset (in the vitest config) clears implementations before each test.
  save.mockImplementation((_input, options) => options?.onSuccess?.());
});

const render = (
  status: ReentryQuestionnaireStatus = "NOT_STARTED",
  storedAnswers: Record<string, unknown> = {},
  flowQuestions: QuestionnaireQuestion[] = questions,
) =>
  renderHook(
    (props: { storedAnswers: Record<string, unknown> }) =>
      useQuestionnaireFlow({
        questions: flowQuestions,
        sections,
        status,
        storedAnswers: props.storedAnswers,
        save,
        onExit,
        onGoToChecklist,
      }),
    { initialProps: { storedAnswers } },
  );

type Result = ReturnType<typeof render>["result"];

// Fails the test unless the current screen is the expected kind.
const screenOf = <Kind extends QuestionnaireScreen["kind"]>(
  result: Result,
  kind: Kind,
) => {
  const screen = result.current;
  if (screen.kind !== kind) {
    throw new Error(`Expected the ${kind} screen, got ${screen.kind}`);
  }
  return screen as Extract<QuestionnaireScreen, { kind: Kind }>;
};

const questionIdOf = (result: Result) =>
  screenOf(result, "question").props.question.id;

// Review before submitting, which has Back and Submit.
const firstTimeReviewOf = (result: Result) => {
  const { props } = screenOf(result, "review");
  if (props.isEditing) throw new Error("Expected review before submitting");
  return props;
};

// Review of a completed profile, which has Change links but no Submit.
const editReviewOf = (result: Result) => {
  const { props } = screenOf(result, "review");
  if (!props.isEditing)
    throw new Error("Expected review of a completed profile");
  return props;
};

const updatedQuestionIdsOf = (result: Result) =>
  editReviewOf(result)
    .entries.filter((entry) => entry.isUpdated)
    .map((entry) => entry.questionId);

// Answers the current question and moves on.
const answerAndNext = (result: Result, value: string[]) => {
  act(() => screenOf(result, "question").props.onChange(value));
  act(() => screenOf(result, "question").props.onNext());
};

// Lands on review with every question answered, then taps Change on one.
const startEditing = (
  status: ReentryQuestionnaireStatus,
  questionId: string,
) => {
  const allAnswered = { needsCare: "NO", benefits: "YES" };
  const hook = render(status, allAnswered);
  const entry = screenOf(hook.result, "review").props.entries.find(
    (e) => e.questionId === questionId,
  );
  act(() => entry?.onEdit());
  return hook;
};

describe("initial step", () => {
  test("NOT_STARTED starts on the intro", () => {
    const { result } = render("NOT_STARTED");
    expect(result.current.kind).toBe("intro");
  });

  test("IN_PROGRESS resumes at the first unanswered question", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    expect(questionIdOf(result)).toBe("benefits");
  });

  test("COMPLETED lands on review", () => {
    const { result } = render("COMPLETED", {
      needsCare: "NO",
      benefits: "YES",
    });
    expect(result.current.kind).toBe("review");
  });
});

describe("answering and navigating", () => {
  test("start goes to the first question", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    expect(questionIdOf(result)).toBe("needsCare");
  });

  test("Next is disabled until the question is answered", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    expect(screenOf(result, "question").props.canGoNext).toBe(false);
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    expect(screenOf(result, "question").props.canGoNext).toBe(true);
  });

  test("an answer that reveals a follow-up routes into it", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    answerAndNext(result, ["YES"]);
    expect(questionIdOf(result)).toBe("careDetails");
  });

  test("an answer that hides a follow-up skips it", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    answerAndNext(result, ["NO"]);
    expect(questionIdOf(result)).toBe("benefits");
    expect(
      screenOf(result, "question").sectionProgress.currentSectionIndex,
    ).toBe(1);
  });

  test("Next on the last question goes to review", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    answerAndNext(result, ["NO"]);
    answerAndNext(result, ["YES"]);
    expect(result.current.kind).toBe("review");
  });

  test("Back steps to the previous question, then the intro", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    answerAndNext(result, ["NO"]);
    act(() => screenOf(result, "question").props.onBack?.());
    expect(questionIdOf(result)).toBe("needsCare");
    act(() => screenOf(result, "question").props.onBack?.());
    expect(result.current.kind).toBe("intro");
  });

  test("Back from review goes to the last visible question", () => {
    const { result } = render("IN_PROGRESS", {
      needsCare: "NO",
      benefits: "YES",
    });
    act(() => firstTimeReviewOf(result).onBack());
    expect(questionIdOf(result)).toBe("benefits");
  });

  test("applies exclusive options to CHECKBOX answers", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "YES" });
    act(() => screenOf(result, "question").props.onChange(["MEDS"]));
    act(() => screenOf(result, "question").props.onChange(["MEDS", "UNSURE"]));
    expect(screenOf(result, "question").props.value).toEqual(["UNSURE"]);
  });

  test("hiding a follow-up clears its answer, so it starts empty if shown again", () => {
    const { result } = render("IN_PROGRESS", {
      needsCare: "YES",
      careDetails: ["MEDS"],
    });
    act(() => screenOf(result, "question").props.onBack?.());
    act(() => screenOf(result, "question").props.onBack?.());
    expect(questionIdOf(result)).toBe("needsCare");

    act(() => screenOf(result, "question").props.onChange(["NO"]));
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    act(() => screenOf(result, "question").props.onNext());
    expect(questionIdOf(result)).toBe("careDetails");
    expect(screenOf(result, "question").props.value).toBeUndefined();
  });

  test("submit goes to completion", () => {
    const { result } = render("IN_PROGRESS", {
      needsCare: "NO",
      benefits: "YES",
    });
    act(() => firstTimeReviewOf(result).onSubmit());
    expect(result.current.kind).toBe("completion");
  });
});

describe("section list", () => {
  const isSectionListOpen = (result: Result) =>
    screenOf(result, "question").sectionProgress.isOpen;

  const openSectionList = (result: Result) =>
    act(() => screenOf(result, "question").sectionProgress.onToggle());

  test("toggles open and closed", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    expect(isSectionListOpen(result)).toBe(false);
    openSectionList(result);
    expect(isSectionListOpen(result)).toBe(true);
    act(() => screenOf(result, "question").sectionProgress.onToggle());
    expect(isSectionListOpen(result)).toBe(false);
  });

  test("closes when an answer is picked", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    openSectionList(result);
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    expect(isSectionListOpen(result)).toBe(false);
  });

  test("closes on Next", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    act(() => screenOf(result, "question").props.onBack?.());
    openSectionList(result);
    act(() => screenOf(result, "question").props.onNext());
    expect(questionIdOf(result)).toBe("benefits");
    expect(isSectionListOpen(result)).toBe(false);
  });

  test("closes on Back", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    openSectionList(result);
    act(() => screenOf(result, "question").props.onBack?.());
    expect(questionIdOf(result)).toBe("needsCare");
    expect(isSectionListOpen(result)).toBe(false);
  });
});

describe("saving", () => {
  test("a first pass saves on every Next", () => {
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    answerAndNext(result, ["NO"]);
    expect(save).toHaveBeenCalledWith(
      { answers: { needsCare: ["NO"] }, isCompleted: false },
      { onSuccess: expect.any(Function) },
    );
  });

  test("submitting saves the answers as completed", () => {
    const { result } = render("IN_PROGRESS", {
      needsCare: "NO",
      benefits: "YES",
    });
    act(() => firstTimeReviewOf(result).onSubmit());
    expect(save).toHaveBeenCalledWith(
      { answers: { needsCare: ["NO"], benefits: ["YES"] }, isCompleted: true },
      { onSuccess: expect.any(Function) },
    );
  });

  test("an edit of a completed profile only saves once it's finished", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    act(() => screenOf(result, "question").props.onNext());
    // Walked into the follow-up, so the edit isn't finished yet.
    expect(save).not.toHaveBeenCalled();

    answerAndNext(result, ["MEDS"]);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.kind).toBe("review");
  });

  test("a failed save on Next calls onError and stays on the question", () => {
    save.mockImplementation((_input, options) => options?.onError?.());
    const onError = vi.fn();
    const { result } = render();
    act(() => screenOf(result, "intro").props.onStart());
    act(() => screenOf(result, "question").props.onChange(["NO"]));
    act(() =>
      screenOf(result, "question").props.onNext({ onSaveError: onError }),
    );
    expect(onError).toHaveBeenCalled();
    expect(questionIdOf(result)).toBe("needsCare");
  });

  test("a failed save at the end of an edit calls onError and stays on the question", () => {
    save.mockImplementation((_input, options) => options?.onError?.());
    const onError = vi.fn();
    const { result } = startEditing("COMPLETED", "benefits");
    act(() => screenOf(result, "question").props.onChange(["NO"]));
    act(() =>
      screenOf(result, "question").props.onNext({ onSaveError: onError }),
    );
    expect(onError).toHaveBeenCalled();
    expect(questionIdOf(result)).toBe("benefits");
  });

  test("a failed submit calls onError and stays on Review", () => {
    save.mockImplementation((_input, options) => options?.onError?.());
    const onError = vi.fn();
    const { result } = render("IN_PROGRESS", {
      needsCare: "NO",
      benefits: "YES",
    });
    act(() => firstTimeReviewOf(result).onSubmit({ onSaveError: onError }));
    expect(onError).toHaveBeenCalled();
    expect(result.current.kind).toBe("review");
  });
});

describe("review entries", () => {
  test("lists visible questions with their formatted answers", () => {
    const { result } = render("COMPLETED", {
      needsCare: "YES",
      careDetails: ["MEDS", "UNSURE"],
      benefits: "NO",
    });
    expect(
      screenOf(result, "review").props.entries.map(
        ({ heading, answerText }) => ({ heading, answerText }),
      ),
    ).toEqual([
      { heading: "Need care?", answerText: "Yes" },
      { heading: "What care?", answerText: "Medicine, I'm not sure" },
      { heading: "Benefits?", answerText: "No" },
    ]);
  });
});

describe("changing an answer from review before submitting", () => {
  test("Change opens the question without Back, outside edit mode", () => {
    const { result } = startEditing("IN_PROGRESS", "needsCare");
    const { props } = screenOf(result, "question");
    expect(props.question.id).toBe("needsCare");
    expect(props.editing).toBeUndefined();
    expect(props.onBack).toBeUndefined();
  });

  test("with no follow-up, Next returns to review", () => {
    const { result } = startEditing("IN_PROGRESS", "needsCare");
    act(() => screenOf(result, "question").props.onNext());
    expect(result.current.kind).toBe("review");
  });

  test("revealing a follow-up walks it, then returns to review", () => {
    const { result } = startEditing("IN_PROGRESS", "needsCare");
    answerAndNext(result, ["YES"]);
    expect(questionIdOf(result)).toBe("careDetails");
    expect(screenOf(result, "question").props.onBack).toBeDefined();

    answerAndNext(result, ["MEDS"]);
    // Returns to review instead of continuing into "benefits".
    expect(result.current.kind).toBe("review");
  });
});

describe("editing a completed profile from review", () => {
  test("Change opens the question in edit mode, without Back", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    const { props } = screenOf(result, "question");
    expect(props.question.id).toBe("needsCare");
    expect(props.editing).toBeDefined();
    expect(props.onBack).toBeUndefined();
  });

  test("with no follow-up, Next returns to review", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    expect(
      screenOf(result, "question").props.editing?.isLastQuestionBeforeReview,
    ).toBe(true);
    act(() => screenOf(result, "question").props.onNext());
    expect(result.current.kind).toBe("review");
  });

  test("revealing a follow-up walks it, then returns to review", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    expect(
      screenOf(result, "question").props.editing?.isLastQuestionBeforeReview,
    ).toBe(false);

    act(() => screenOf(result, "question").props.onNext());
    const { props } = screenOf(result, "question");
    expect(props.question.id).toBe("careDetails");
    expect(props.onBack).toBeDefined();
    expect(props.editing?.isLastQuestionBeforeReview).toBe(true);

    answerAndNext(result, ["MEDS"]);
    // Returns to review instead of continuing into "benefits".
    expect(result.current.kind).toBe("review");
  });

  test("walks a follow-up that comes after an unrelated question, skipping it both ways", () => {
    const [needsCare, careDetails, benefits] = questions;
    // careDetails comes after benefits, and is shown if either is answered YES.
    const laterFollowUp = [
      needsCare,
      benefits,
      {
        ...careDetails,
        showIf: {
          any: [
            { questionId: "needsCare", operator: "equals", value: "YES" },
            { questionId: "benefits", operator: "equals", value: "YES" },
          ],
        },
      },
    ] satisfies QuestionnaireQuestion[];
    const { result } = render(
      "COMPLETED",
      { needsCare: "NO", benefits: "NO" },
      laterFollowUp,
    );
    const needsCareEntry = screenOf(result, "review").props.entries.find(
      (entry) => entry.questionId === "needsCare",
    );
    act(() => needsCareEntry?.onEdit());

    answerAndNext(result, ["YES"]);
    expect(questionIdOf(result)).toBe("careDetails");

    act(() => screenOf(result, "question").props.onBack?.());
    expect(questionIdOf(result)).toBe("needsCare");

    act(() => screenOf(result, "question").props.onNext());
    answerAndNext(result, ["MEDS"]);
    expect(result.current.kind).toBe("review");
  });

  test("cancelling without changes returns to review directly", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.editing?.onCancel());
    expect(result.current.kind).toBe("review");
  });

  test("cancelling with changes asks to confirm first", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    act(() => screenOf(result, "question").props.editing?.onCancel());
    const screen = screenOf(result, "question");
    expect(screen.cancelDialog.isOpen).toBe(true);
    expect(screen.props.question.id).toBe("needsCare");
  });

  test("keep answering closes the confirmation and stays put", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    act(() => screenOf(result, "question").props.editing?.onCancel());
    act(() => screenOf(result, "question").cancelDialog.onStay());
    const screen = screenOf(result, "question");
    expect(screen.cancelDialog.isOpen).toBe(false);
    expect(screen.props.value).toEqual(["YES"]);
  });

  test("discarding restores the previous answers and returns to review", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onChange(["YES"]));
    act(() => screenOf(result, "question").props.editing?.onCancel());
    act(() => screenOf(result, "question").cancelDialog.onLeave());
    expect(
      screenOf(result, "review").props.entries.find(
        (e) => e.questionId === "needsCare",
      )?.answerText,
    ).toBe("No");
  });

  test("discarding brings back follow-up answers the edit cleared", () => {
    const { result } = render("COMPLETED", {
      needsCare: "YES",
      careDetails: ["MEDS"],
      benefits: "NO",
    });
    const entry = screenOf(result, "review").props.entries.find(
      (e) => e.questionId === "needsCare",
    );
    act(() => entry?.onEdit());
    act(() => screenOf(result, "question").props.onChange(["NO"]));
    act(() => screenOf(result, "question").props.editing?.onCancel());
    act(() => screenOf(result, "question").cancelDialog.onLeave());
    expect(
      screenOf(result, "review").props.entries.find(
        (e) => e.questionId === "careDetails",
      )?.answerText,
    ).toBe("Medicine");
  });
});

describe("after saving an edit of a completed profile", () => {
  test("marks each changed answer as updated, including a follow-up question that just appeared", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    // Yes makes careDetails appear. It started with no answer, so answering it
    // counts as an update.
    answerAndNext(result, ["YES"]);
    answerAndNext(result, ["MEDS"]);
    expect(updatedQuestionIdsOf(result)).toEqual(["needsCare", "careDetails"]);
    expect(editReviewOf(result).savedBanner).toBeDefined();
  });

  test("skips saving and the banner when no answer changed", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    act(() => screenOf(result, "question").props.onNext());
    expect(save).not.toHaveBeenCalled();
    expect(updatedQuestionIdsOf(result)).toEqual([]);
    expect(editReviewOf(result).savedBanner).toBeUndefined();
  });

  test("the banner links to the checklist", () => {
    const { result } = startEditing("COMPLETED", "benefits");
    answerAndNext(result, ["NO"]);
    act(() => editReviewOf(result).savedBanner?.onGoToChecklist());
    expect(onGoToChecklist).toHaveBeenCalled();
  });

  test("dismissing the banner keeps the updated answers marked", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    answerAndNext(result, ["YES"]);
    answerAndNext(result, ["MEDS"]);
    act(() => editReviewOf(result).savedBanner?.onDismiss());
    expect(editReviewOf(result).savedBanner).toBeUndefined();
    expect(updatedQuestionIdsOf(result)).toEqual(["needsCare", "careDetails"]);
  });

  test("keeps marking answers updated across edits", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    answerAndNext(result, ["YES"]);
    answerAndNext(result, ["MEDS"]);
    // A second edit, of a different question.
    const benefitsEntry = editReviewOf(result).entries.find(
      (entry) => entry.questionId === "benefits",
    );
    act(() => benefitsEntry?.onEdit());
    answerAndNext(result, ["NO"]);
    expect(updatedQuestionIdsOf(result)).toEqual([
      "needsCare",
      "careDetails",
      "benefits",
    ]);
  });

  test("an answer changed back to how it started is no longer marked", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    answerAndNext(result, ["YES"]);
    answerAndNext(result, ["MEDS"]);
    // Edits needsCare again, back to its starting answer.
    const needsCareEntry = editReviewOf(result).entries.find(
      (entry) => entry.questionId === "needsCare",
    );
    act(() => needsCareEntry?.onEdit());
    answerAndNext(result, ["NO"]);
    expect(updatedQuestionIdsOf(result)).toEqual([]);
  });

  test("starting another edit hides the banner", () => {
    const { result, rerender } = startEditing("COMPLETED", "benefits");
    answerAndNext(result, ["NO"]);
    // Workaround: the mocked save doesn't reload the saved answers like the
    // app does, so this updates them by hand to match what was just saved.
    rerender({ storedAnswers: { needsCare: "NO", benefits: "NO" } });

    const needsCareEntry = editReviewOf(result).entries.find(
      (entry) => entry.questionId === "needsCare",
    );
    act(() => needsCareEntry?.onEdit());
    act(() => screenOf(result, "question").props.editing?.onCancel());
    expect(editReviewOf(result).savedBanner).toBeUndefined();
  });

  test("a failed save stays on the question, with no banner", () => {
    // The mocked save never calls onSuccess.
    save.mockImplementation(() => undefined);
    const { result } = startEditing("COMPLETED", "benefits");
    answerAndNext(result, ["NO"]);
    expect(questionIdOf(result)).toBe("benefits");
  });
});

describe("re-checking the same options in a different order", () => {
  // "careDetails" with a second option that isn't exclusive, so two options
  // can be checked at once.
  const withTwoCareOptions = questions.map((question) =>
    question.id === "careDetails"
      ? {
          ...question,
          options: [
            { value: "MEDS", label: "Medicine" },
            { value: "THERAPY", label: "Therapy" },
            { value: "UNSURE", label: "I'm not sure", exclusive: true },
          ],
        }
      : question,
  );

  // Opens a completed profile with both options checked, changes the answer,
  // then unchecks and re-checks "MEDS", so it's checked after "THERAPY".
  const recheckInNewOrder = () => {
    const hook = render(
      "COMPLETED",
      { needsCare: "YES", careDetails: ["MEDS", "THERAPY"], benefits: "NO" },
      withTwoCareOptions,
    );
    const entry = editReviewOf(hook.result).entries.find(
      (e) => e.questionId === "careDetails",
    );
    act(() => entry?.onEdit());
    act(() => screenOf(hook.result, "question").props.onChange(["THERAPY"]));
    act(() =>
      screenOf(hook.result, "question").props.onChange(["THERAPY", "MEDS"]),
    );
    return hook;
  };

  test("doesn't save or mark the answer updated", () => {
    const { result } = recheckInNewOrder();
    act(() => screenOf(result, "question").props.onNext());
    expect(save).not.toHaveBeenCalled();
    expect(updatedQuestionIdsOf(result)).toEqual([]);
  });

  test("cancelling returns to review without asking to confirm", () => {
    const { result } = recheckInNewOrder();
    act(() => screenOf(result, "question").props.editing?.onCancel());
    expect(result.current.kind).toBe("review");
  });
});

describe("header action", () => {
  test("the intro and completion screens offer Close", () => {
    expect(render().result.current.headerAction?.kind).toBe("close");

    const { result } = render("IN_PROGRESS", {
      needsCare: "NO",
      benefits: "YES",
    });
    act(() => firstTimeReviewOf(result).onSubmit());
    expect(result.current.headerAction?.kind).toBe("close");
  });

  test("before submitting, questions offer Save and exit, then review offers Close", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    expect(result.current.headerAction?.kind).toBe("saveAndExit");
    answerAndNext(result, ["YES"]);
    expect(result.current.kind).toBe("review");
    expect(result.current.headerAction?.kind).toBe("close");
  });

  test("editing a completed profile hides it, then review offers Close", () => {
    const { result } = startEditing("COMPLETED", "needsCare");
    expect(result.current.headerAction).toBeNull();
    act(() => screenOf(result, "question").props.onNext());
    expect(result.current.kind).toBe("review");
    expect(result.current.headerAction?.kind).toBe("close");
  });

  test("Save and exit saves the answers, then exits", () => {
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    act(() => result.current.headerAction?.onClick());
    expect(save).toHaveBeenCalledWith(
      { answers: { needsCare: ["NO"] }, isCompleted: false },
      { onSuccess: expect.any(Function) },
    );
    expect(onExit).toHaveBeenCalled();
  });

  test("Save and exit stays put if the save fails", () => {
    save.mockImplementationOnce(() => undefined);
    const { result } = render("IN_PROGRESS", { needsCare: "NO" });
    act(() => result.current.headerAction?.onClick());
    expect(onExit).not.toHaveBeenCalled();
  });
});

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

import React, { useState } from "react";

import { showErrorToast } from "~@reentry/frontend-shared";

import { useApplicationContext } from "../../contexts/ApplicationContext";
import { useSocket } from "../../websockets/IntakeSocketContext";

const IntakeSurvey = ({
  setSurveySubmitted,
  intakeId,
}: {
  setSurveySubmitted: (submitted: boolean) => void;
  intakeId: string;
}) => {
  const { $api } = useApplicationContext();
  const { intakeDispatchContext } = useSocket();

  const { setIntakeComplete } = intakeDispatchContext;
  const [formData, setFormData] = useState({
    difficulty: null as number | null,
    confusing: "",
    method: "",
    methodOther: "",
    feedback: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    difficulty: "",
    confusing: "",
    method: "",
    methodOther: "",
    feedback: "",
  });

  const { mutateAsync: submitIntakeSurvey } = $api.useMutation(
    "post",
    "/external/client/{intake_id}/survey",
  );

  const getIntakeToken = () => {
    // Get token from sessionStorage where it's stored for intake authentication
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("intake_token") || "";
    }
    return "";
  };

  const getDifficultyButtonClasses = (num: number) => {
    if (formData.difficulty === num) {
      return "bg-[#00665f] text-white scale-110 shadow-md";
    }
    if (errors.difficulty) {
      return "bg-red-100 text-gray-700 hover:bg-red-200 border-2 border-red-500";
    }
    return "bg-gray-200 text-gray-700 hover:bg-gray-300";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear previous errors
    setErrors({
      difficulty: "",
      confusing: "",
      method: "",
      methodOther: "",
      feedback: "",
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await submitIntakeSurvey({
        params: {
          path: {
            intake_id: intakeId,
          },
        },
        body: {
          difficulty_rating: formData.difficulty,
          questions_confusing: formData.confusing,
          preferred_method: formData.method,
          method_other: formData.method === "other" ? formData.methodOther : "",
          additional_feedback: formData.feedback,
        },
        headers: {
          Authorization: `Bearer ${getIntakeToken()}`,
        },
      });
      if (response.survey_submitted) {
        setIntakeComplete();
        setSurveySubmitted(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("Failed to submit survey:", error);
      showErrorToast("Failed to submit survey. Please try again.");

      // Set generic error message for fields that are empty
      const newErrors = {
        difficulty: !formData.difficulty ? "Please select a difficulty rating" : "",
        confusing: !formData.confusing ? "Please select an option" : "",
        method: !formData.method ? "Please select a preferred method" : "",
        methodOther: formData.method === "other" && !formData.methodOther ? "Please describe your preferred method" : "",
        feedback: "",
      };
      setErrors(newErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-[2vh] font-public bg-slate-50">
      <div className="w-full max-w-3xl ">
        <div className="bg-white shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] rounded-lg px-2 md:px-12 pt-14 pb-10 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="px-8 md:px-12">
            <h1
              className="text-center text-black text-3xl font-normal mb-6"
              style={{ fontFamily: "Libre Baskerville, serif" }}
            >
              Feedback on your Experience
            </h1>
            <p className="text-center text-black text-lg font-medium mb-12 px-4">
              Thank you for completing the intake! Please answer a few questions
              about your experience to help us make it even easier for others in
              the future. You can skip any questions you don't want to answer.
            </p>

            {/* Question 1: Difficulty Rating */}
            <div className="mb-10">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="block text-black text-lg font-medium mb-6">
                1. How hard or easy was it to do this intake?
              </label>
              <div className="flex justify-between text-sm text-gray-600 mb-3">
                <span>Very hard</span>
                <span>Very easy</span>
              </div>
              <div className="flex justify-between items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, difficulty: num })
                    }
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${getDifficultyButtonClasses(num)}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {errors.difficulty && (
                <p className="text-red-600 text-sm mt-2">{errors.difficulty}</p>
              )}
            </div>

            {/* Question 2: Confusing Questions */}
            <div className="mb-10">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="block text-black text-lg font-medium mb-4">
                2. Were any of the questions confusing or hard to understand?
              </label>

              <div className={`space-y-3 ${errors.confusing ? "border-2 border-red-500 rounded-lg p-3" : ""}`}>
                {[
                  { value: "no", label: "No" },
                  { value: "some", label: "Yes, some of them were confusing" },
                  {
                    value: "most_all",
                    label: "Yes, most or all of them were confusing",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="relative">
                      <input
                        type="radio"
                        name="confusing"
                        value={option.value}
                        checked={formData.confusing === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confusing: e.target.value,
                          })
                        }
                        className="w-4 h-4 text-[#00665f] border-2 border-[#00665f] focus:ring-[#00665f]"
                      />
                    </div>
                    <span className="text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.confusing && (
                <p className="text-red-600 text-sm mt-2">{errors.confusing}</p>
              )}
            </div>

            {/* Question 3: Preferred Method */}
            <div className="mb-10">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="block text-black text-lg font-medium mb-4">
                3. If you had to do intake again, how would you prefer to do it?
              </label>

              <div className={`space-y-3 ${errors.method ? "border-2 border-red-500 rounded-lg p-3" : ""}`}>
                {[
                  {
                    value: "chatbot",
                    label:
                      "Typing on the computer to a chatbot (like you just did)",
                  },
                  {
                    value: "voice",
                    label:
                      "Talking into a microphone on the computer instead of typing",
                  },
                  {
                    value: "person",
                    label:
                      "Talking face-to-face with a person, like a case manager",
                  },
                  { value: "other", label: "Other" },
                ].map((option) => (
                  <div key={option.value}>
                    <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <div className="relative">
                        <input
                          type="radio"
                          name="method"
                          value={option.value}
                          checked={formData.method === option.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              method: e.target.value,
                              methodOther:
                                e.target.value !== "other"
                                  ? ""
                                  : formData.methodOther,
                            })
                          }
                          className="w-4 h-4 text-[#00665f] border-2 border-[#00665f] focus:ring-[#00665f]"
                        />
                      </div>
                      <span className="text-gray-900">{option.label}</span>
                    </label>

                    {option.value === "other" &&
                      formData.method === "other" && (
                        <div>
                          <textarea
                            value={formData.methodOther}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                methodOther: e.target.value,
                              })
                            }
                            placeholder="How would you prefer to do the intake?"
                            rows={3}
                            className={`w-full mt-2 ml-7 px-4 py-3 border rounded-lg focus:ring-2 outline-none resize-none ${
                              errors.methodOther
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-[#00665f] focus:ring-[#00665f]/20"
                            }`}
                          />
                          {errors.methodOther && (
                            <p className="text-red-600 text-sm mt-1 ml-7">
                              {errors.methodOther}
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ))}
              </div>
              {errors.method && (
                <p className="text-red-600 text-sm mt-2">{errors.method}</p>
              )}
            </div>

            {/* Question 4: Additional Feedback */}
            <div className="mb-10">
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="block text-black text-lg font-medium mb-4">
                4. Is there anything else you want to tell us that could help
                make this intake better or easier for others?
              </label>

              <textarea
                value={formData.feedback}
                onChange={(e) =>
                  setFormData({ ...formData, feedback: e.target.value })
                }
                placeholder="Let us know here"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-[#00665f] focus:ring-2 focus:ring-[#00665f]/20 outline-none resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center  md:px-48">
              <button
                type="submit"
                disabled={isSubmitting}
                className="hover:bg-gray-950 text-white rounded-full py-2 w-full disabled:opacity-50 bg-[#003331]"
              >
                {isSubmitting ? (
                  <svg
                    className="animate-spin h-5 w-5 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-labelledby="loading-title"
                    role="img"
                  >
                    <title id="loading-title">Loading</title>
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IntakeSurvey;

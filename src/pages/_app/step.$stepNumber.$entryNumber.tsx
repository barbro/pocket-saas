import { pb } from "@/lib/pocketbase";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, Home, Loader2, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  getStepEntriesCount,
  getAnswer,
  createAnswer,
  updateAnswer,
} from "@/lib/pbQuestions";

// Types for better type safety
interface BookEntry {
  id: string;
  step_number: number;
  entry_number: number;
  title?: string;
  content?:
    | string
    | {
        notes?: string;
        questions?: string | string[];
        [key: string]: any; // Allow for other properties
      };
  question?: string;
  created: string;
  updated: string;
}

interface Answer {
  id: string;
  question: string;
  answer_text: string;
  created: string;
  updated: string;
}

export const Route = createFileRoute("/_app/step/$stepNumber/$entryNumber")({
  component: StepSection,
});

function StepSection() {
  const { stepNumber, entryNumber } = Route.useParams();
  const navigate = useNavigate();

  // State management
  const [entry, setEntry] = useState<BookEntry | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Convert params to numbers for better type safety
  const currentStepNumber = parseInt(stepNumber);
  const currentEntryNumber = parseInt(entryNumber);

  // Fetch data on component mount and param changes
  useEffect(() => {
    const abortController = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Reset form state when changing entries
        setUserAnswer("");
        setAnswer(null);
        setSaveStatus("idle");

        // Fetch the book entry
        const entryRecord = await pb
          .collection("book_entries")
          .getFirstListItem<BookEntry>(
            `step_number=${currentStepNumber} && entry_number=${currentEntryNumber}`,
            {
              // Pass the abort signal to PocketBase
              requestKey: null,
              signal: abortController.signal,
            }
          );

        // Check if request was cancelled
        if (abortController.signal.aborted) return;

        setEntry(entryRecord);

        // Fetch the associated answer if it exists
        try {
          const answerRecord = await getAnswer(entryRecord.id);
          if (!abortController.signal.aborted) {
            setAnswer(answerRecord);
            setUserAnswer(answerRecord.answer_text || "");
          }
        } catch (answerError: any) {
          // Answer might not exist yet, which is fine (unless it's an abort)
          if (!abortController.signal.aborted) {
            setAnswer(null);
            setUserAnswer("");
          }
        }

        // Get total entries count for this step
        try {
          const count = await getStepEntriesCount(currentStepNumber);
          if (!abortController.signal.aborted) {
            setTotalEntries(count);
          }
        } catch (countError: any) {
          if (!abortController.signal.aborted) {
            console.error("Error fetching entries count:", countError);
          }
        }
      } catch (err: any) {
        // Don't show error if request was just cancelled
        if (!abortController.signal.aborted) {
          console.error("Error fetching data:", err);
          setError(err.message || "Failed to load content");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (stepNumber && entryNumber) {
      fetchData();
    }

    // Cleanup function to abort requests when component unmounts or deps change
    return () => {
      abortController.abort();
    };
  }, [stepNumber, entryNumber, currentStepNumber, currentEntryNumber]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  // Navigation functions
  const navigateToPrevious = async () => {
    await saveBeforeNavigation();
    const prevEntryNumber = currentEntryNumber - 1;
    if (prevEntryNumber >= 1) {
      navigate({
        to: "/step/$stepNumber/$entryNumber",
        params: {
          stepNumber: stepNumber,
          entryNumber: prevEntryNumber.toString(),
        },
      });
    }
  };

  const navigateToNext = async () => {
    await saveBeforeNavigation();
    const nextEntryNumber = currentEntryNumber + 1;
    navigate({
      to: "/step/$stepNumber/$entryNumber",
      params: {
        stepNumber: stepNumber,
        entryNumber: nextEntryNumber.toString(),
      },
    });
  };

  const navigateToHome = () => {
    navigate({ to: "/" });
  };

  // Handle answer submission
  const saveAnswer = useCallback(
    async (answerText: string) => {
      if (!entry || !answerText.trim()) {
        console.log("Save cancelled: missing entry or empty answer");
        return;
      }

      console.log("Saving answer:", {
        entryId: entry.id,
        hasExistingAnswer: !!answer,
        answerText,
      });
      setSaveStatus("saving");
      try {
        if (answer) {
          // Update existing answer
          console.log("Updating existing answer:", answer.id);
          const updatedAnswer = await updateAnswer(answer.id, answerText);
          setAnswer({
            ...answer,
            answer_text: answerText,
            updated: new Date().toISOString(),
          });
          console.log("Answer updated successfully");
        } else {
          // Create new answer
          console.log("Creating new answer for entry:", entry.id);
          const newAnswer = await createAnswer(entry.id, answerText);
          setAnswer(newAnswer);
          console.log("New answer created:", newAnswer);
        }
        setSaveStatus("saved");
        // Reset to idle after showing 'saved' status
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error saving answer:", error);
        setSaveStatus("idle");
      }
    },
    [entry, answer]
  );

  // Debounced save function
  const debouncedSave = useCallback(
    (answerText: string) => {
      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        saveAnswer(answerText);
      }, 5000); // 5 seconds debounce

      setDebounceTimeout(timeout);
    },
    [debounceTimeout, saveAnswer]
  );

  // Handle user input changes
  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    if (value.trim()) {
      debouncedSave(value);
    }
  };

  // Save before navigation
  const saveBeforeNavigation = async () => {
    if (userAnswer.trim() && userAnswer !== (answer?.answer_text || "")) {
      // Clear debounce timeout since we're saving immediately
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }
      await saveAnswer(userAnswer);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען תוכן...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        dir="rtl"
      >
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h2 className="text-red-800 font-semibold mb-2">
              שגיאה בטעינת התוכן
            </h2>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => navigate({ to: "/" })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            חזרה לעמוד הראשי
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <button
                onClick={navigateToHome}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="h-5 w-5 ml-1" />
                עמוד ראשי
              </button>
              <div className="text-gray-400">|</div>
              <div className="text-sm text-gray-600">
                צעד {currentStepNumber} • רשומה {currentEntryNumber} מתוך{" "}
                {totalEntries}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {entry && (
          <article className="bg-white rounded-lg shadow-sm border p-8">
            {/* Entry Header */}
            {entry.title && (
              <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {entry.title}
                </h1>
                <div className="text-sm text-gray-500">
                  צעד {entry.step_number}, רשומה {entry.entry_number}
                </div>
              </header>
            )}

            {/* Entry Content */}
            {entry.content && (
              <div className="prose max-w-none mb-8">
                {typeof entry.content === "string" ? (
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {entry.content}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Render notes if they exist */}
                    {entry.content.notes && (
                      <div className="bg-amber-50 border-r-4 border-amber-400 p-4 rounded">
                        <div className="space-y-2">
                          {Array.isArray(entry.content.notes) ? (
                            entry.content.notes.map(
                              (note: string, index: number) => (
                                <p
                                  key={index}
                                  className="text-amber-800 leading-relaxed"
                                >
                                  {note}
                                </p>
                              )
                            )
                          ) : (
                            <p className="text-amber-800 leading-relaxed">
                              {typeof entry.content.notes === "string"
                                ? entry.content.notes
                                : JSON.stringify(entry.content.notes, null, 2)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Render questions if they exist */}
                    {entry.content.questions && (
                      <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded">
                        {Array.isArray(entry.content.questions) ? (
                          <div className="space-y-3">
                            {entry.content.questions.map(
                              (question: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-blue-800 leading-relaxed"
                                >
                                  <span className="font-medium">
                                    שאלה {question.number || index + 1}:
                                  </span>
                                  <p className="mt-1">
                                    {typeof question === "string"
                                      ? question
                                      : question.text ||
                                        JSON.stringify(question, null, 2)}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="text-blue-800 leading-relaxed">
                            {typeof entry.content.questions === "string"
                              ? entry.content.questions
                              : JSON.stringify(
                                  entry.content.questions,
                                  null,
                                  2
                                )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Render any other properties */}
                    {Object.keys(entry.content)
                      .filter((key) => !["notes", "questions"].includes(key))
                      .map((key) => (
                        <div key={key}>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                            {key.replace(/_/g, " ")}
                          </h3>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {typeof entry.content[key] === "string"
                              ? entry.content[key]
                              : JSON.stringify(entry.content[key], null, 2)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Question Section */}
            {entry.question && (
              <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  שאלת הרפלקציה
                </h3>
                <p className="text-blue-800">{entry.question}</p>
              </div>
            )}

            {/* Answer Input/Display Section */}
            {(entry.content?.questions || entry.question) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  התשובה שלך
                </h3>

                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={userAnswer}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="כתוב כאן את התשובה שלך..."
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Save Status Indicator */}
                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      {saveStatus === "saving" && (
                        <div className="flex items-center text-yellow-600">
                          <Loader2 className="h-4 w-4 animate-spin ml-1" />
                          <span className="text-xs">שומר...</span>
                        </div>
                      )}
                      {saveStatus === "saved" && (
                        <div className="flex items-center text-green-600">
                          <Check className="h-4 w-4 ml-1" />
                          <span className="text-xs">נשמר</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {answer && (
                    <div className="text-sm text-gray-500 text-left">
                      עודכן לאחרונה:{" "}
                      {new Date(answer.updated).toLocaleDateString("he-IL")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>
        )}

        {/* Navigation Footer */}
        <nav className="mt-8 flex items-center justify-between">
          <button
            onClick={navigateToNext}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronRight className="h-5 w-5 ml-1" />
            רשומה הבאה
          </button>

          <div className="text-center text-sm text-gray-500">
            רשומה {currentEntryNumber} מתוך {totalEntries} בצעד{" "}
            {currentStepNumber}
          </div>

          <button
            onClick={navigateToPrevious}
            disabled={currentEntryNumber <= 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            רשומה קודמת
            <ChevronLeft className="h-5 w-5 mr-1" />
          </button>
        </nav>
      </main>
    </div>
  );
}

import { pb } from "@/lib/pocketbase";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_app/step/$stepNumber/$sectionNumber")({
  component: StepSection,
});

interface Question {
  number: number;
  text: string;
}

interface StepItem {
  type: string;
  step_number: number;
  raw_text: string;
  notes?: string[];
  questions?: Question[];
}

function StepSection() {
  const { stepNumber, sectionNumber } = Route.useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [stepsData, setStepsData] = useState<StepItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const record = await pb
      .collection("book_entries")
      .getFirstListItem('someField="test"', {
        expand: "relField1,relField2.subRelField",
      });

    const getAnswer = async (questionId: string) =>
      await pb
        .collection("answers")
        .getFirstListItem(`question="${questionId}"`);

    getAnswer("1").then((answer) => console.log(answer));
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Import dynamically to avoid potential circular reference issues
        const data = await import("@/data/steps-guide.json");
        setStepsData(data.default || data);
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("שגיאה בטעינת הנתונים");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-800 mb-4">{error}</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            חזרה לעמוד הראשי
          </Link>
        </div>
      </div>
    );
  }

  const stepNum = parseInt(stepNumber);
  const sectionNum = parseInt(sectionNumber);

  // Filter data by step number
  const stepData = stepsData.filter(
    (item: StepItem) => item.step_number === stepNum
  );

  // Check if step exists
  if (stepData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-800 mb-4">
            צעד לא נמצא
          </h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            חזרה לעמוד הראשי
          </Link>
        </div>
      </div>
    );
  }

  // Check if section exists (1-based indexing)
  const currentSection = stepData[sectionNum - 1];
  if (!currentSection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-gray-800 mb-4">
            קטע לא נמצא
          </h1>
          <p className="text-gray-600 mb-4">
            צעד {stepNum} כולל {stepData.length} קטעים
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            חזרה לעמוד הראשי
          </Link>
        </div>
      </div>
    );
  }

  const totalSections = stepData.length;
  const isFirstSection = sectionNum === 1;
  const isLastSection = sectionNum === totalSections;

  const prevSectionNum = sectionNum - 1;
  const nextSectionNum = sectionNum + 1;

  // Navigation functions
  const goToPrevSection = () => {
    if (isFirstSection) {
      navigate({ to: "/" });
    } else {
      navigate({
        to: "/step/$stepNumber/$sectionNumber",
        params: { stepNumber, sectionNumber: prevSectionNum.toString() },
      });
    }
  };

  const goToNextSection = () => {
    if (isLastSection) {
      navigate({ to: "/" });
    } else {
      navigate({
        to: "/step/$stepNumber/$sectionNumber",
        params: { stepNumber, sectionNumber: nextSectionNum.toString() },
      });
    }
  };

  // Get navigation button text
  const getPrevButtonText = () => {
    return isFirstSection ? "חזרה לרשימת הצעדים" : "קטע קודם";
  };

  const getNextButtonText = () => {
    return isLastSection ? "סיום הצעד" : "קטע הבא";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Navigation Buttons - Top */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12 gap-4">
            <button
              onClick={goToPrevSection}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 px-6 py-3 rounded-lg hover:bg-white hover:shadow-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <ChevronRight className="w-5 h-5" />
              <span className="font-medium">{getPrevButtonText()}</span>
            </button>

            <div className="text-xl font-medium text-gray-800 order-first sm:order-none">
              צעד {stepNum} - קטע {sectionNum}/{totalSections}
            </div>

            <button
              onClick={goToNextSection}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 px-6 py-3 rounded-lg hover:bg-white hover:shadow-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <span className="font-medium">{getNextButtonText()}</span>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Content Area */}
          <div className="space-y-8">
            {/* Notes Section */}
            {currentSection.notes && currentSection.notes.length > 0 && (
              <div className="space-y-8">
                {currentSection.notes.map((note, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border-r-4 border-gray-400 rounded-r-lg p-8"
                  >
                    <p
                      className="text-lg italic text-gray-700 leading-8"
                      dir="rtl"
                    >
                      {note}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Questions Section */}
            {currentSection.questions &&
              currentSection.questions.length > 0 && (
                <div className="space-y-8">
                  {currentSection.questions.map((question) => (
                    <div> {question.text} </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

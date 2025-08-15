import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import stepsData from "@/data/steps-guide.json";
import { pb } from "@/lib/pocketbase";
import { get } from "http";
import { getAnswer } from "@/lib/pbQuestions";
import { createStepEntriesSequential } from "@/lib/uploadEntries";
import stepsGuide from "@/data/steps-guide.json";

export const Route = createFileRoute("/_app/")({
  component: App,
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

function App() {
  // Group data by step number
  // useEffect(() => {
  //   createStepEntriesSequential(pb, stepsGuide).then(() => {
  //     console.log("entries created");
  //   });
  // }, []);

  const stepGroups = stepsData.reduce(
    (acc: Record<number, StepItem[]>, item: StepItem) => {
      if (!acc[item.step_number]) {
        acc[item.step_number] = [];
      }
      acc[item.step_number].push(item);
      return acc;
    },
    {}
  );

  const availableSteps = Object.keys(stepGroups)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              מדריך צעדי ההחלמה
            </h1>
            <p className="text-xl text-gray-600">מדריך לעבודת 12 הצעדים</p>
          </div>

          {/* Steps List */}
          <div className="space-y-4">
            {availableSteps.map((stepNum) => (
              <Link
                key={stepNum}
                to="/step/$stepNumber/$sectionNumber"
                params={{ stepNumber: stepNum.toString(), sectionNumber: "1" }}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                      צעד {stepNum}
                    </h3>
                    <p className="text-gray-600 mb-4">לחץ להתחלת העבודה</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

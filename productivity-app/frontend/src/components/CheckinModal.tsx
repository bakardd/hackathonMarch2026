import { useState } from "react";
import { CHECKIN_QUESTIONS } from "../hooks/useCheckins";

interface Props {
  onSubmit: (answers: Record<string, boolean>) => void;
}

export function CheckinModal({ onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const toggle = (id: string, val: boolean) =>
    setAnswers((prev) => ({ ...prev, [id]: val }));

  const allAnswered = CHECKIN_QUESTIONS.every((q) => q.id in answers);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-fg mb-6">Quick Check-in</h2>
        <div className="flex flex-col gap-4">
          {CHECKIN_QUESTIONS.map((q) => (
            <div key={q.id} className="flex items-center justify-between">
              <span className="text-muted-fg">{q.label}</span>
              <div className="flex gap-2">
                {["Yes", "No"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => toggle(q.id, opt === "Yes")}
                    className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
                      answers[q.id] === (opt === "Yes")
                        ? "bg-primary text-primary-fg"
                        : "bg-secondary text-muted-fg hover:opacity-80"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          disabled={!allAnswered}
          onClick={() => onSubmit(answers)}
          className="mt-8 w-full py-3 rounded-xl bg-primary text-primary-fg font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

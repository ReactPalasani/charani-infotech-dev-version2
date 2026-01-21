// "use client";

// import { useExam } from "@/context/ExamContext";
// import SubmitExamButton from "./SubmitExamButton";
// import { useEffect, useState, useRef, useCallback } from "react";

// export default function QuestionPalette() {
//   const {
//     questions,
//     currentIndex,
//     setCurrentIndex,
//     answers,
//     section,
//   } = useExam();

//   const sectionAnswers = answers[section] || {};

//   const TIME_PER_QUESTION = 1;
//   const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
//   const timerRef = useRef(null);

//   // ────────────────────────────────────────────────
//   // Track questions where time ran out (expired)
//   // ────────────────────────────────────────────────
//   const [timeExpiredQuestions, setTimeExpiredQuestions] = useState(new Set());

//   const handleTimeUp = useCallback(() => {
//     // Mark this question as time-expired
//     setTimeExpiredQuestions((prev) => {
//       const updated = new Set(prev);
//       updated.add(currentIndex);
//       return updated;
//     });

//     // Auto advance to next question if available
//     if (currentIndex < questions.length - 1) {
//       setCurrentIndex(currentIndex + 1);
//     }
//   }, [currentIndex, questions.length, setCurrentIndex]);

//   useEffect(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }

//     setTimeLeft(TIME_PER_QUESTION);

//     timerRef.current = setInterval(() => {
//       setTimeLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(timerRef.current);
//           timerRef.current = null;
//           handleTimeUp();
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [currentIndex, handleTimeUp]);

//   const progress = timeLeft / TIME_PER_QUESTION;
//   const isWarning = timeLeft <= 10 && timeLeft > 0; // last 10 seconds warning

//   return (
//     <div>
//       <h1 className="bg-black text-white flex justify-center p-2 font-bold">
//         Question Palette
//       </h1>

//       <div className="text-center py-2 font-medium">
//         Time left:{" "}
//         <span
//           className={`
//             ${isWarning ? "text-red-600 font-bold animate-pulse" : ""}
//             ${timeLeft === 0 ? "text-gray-500" : ""}
//           `}
//         >
//           {timeLeft}s
//         </span>
//       </div>

//       <div className="w-full bg-white p-6 shadow border rounded-xl">
//         <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 mt-3">
//           {questions.map((_, i) => {
//             const isCurrent = i === currentIndex;
//             const isAnswered = !!sectionAnswers[i];
//             const timeExpired = timeExpiredQuestions.has(i);
//             const timeIsUpNow = isCurrent && timeLeft === 0;

//             // Only current question is clickable
//             const isEnabled = isCurrent;

//             // ────────────────────────────────────────────────
//             // Color logic:
//             // 1. Answered → always green (priority)
//             // 2. Time expired and NOT answered → red
//             // 3. Current → white + ring + timer bar
//             // 4. Others → gray / disabled
//             // ────────────────────────────────────────────────
//             let bgColor = "bg-gray-100 border-gray-300 text-gray-600";
//             let textColor = "text-gray-600";
//             let borderColor = "border-gray-300";

//             if (isAnswered) {
//               bgColor = "bg-green-100 border-green-400 text-green-900 font-semibold";
//               textColor = "text-green-900";
//               borderColor = "border-green-400";
//             } else if (timeExpired || timeIsUpNow) {
//               bgColor = "bg-red-100 border-red-400 text-red-900 font-semibold";
//               textColor = "text-red-900";
//               borderColor = "border-red-400";
//             }

//             return (
//               <button
//                 key={i}
//                 onClick={() => isEnabled && setCurrentIndex(i)}
//                 disabled={!isEnabled}
//                 className={`
//                   relative w-10 h-10 flex items-center justify-center
//                   text-sm font-medium rounded-md border transition-all duration-200
//                   ${isEnabled
//                     ? "ring-2 ring-offset-2 ring-blue-600 scale-105 cursor-pointer bg-white"
//                     : "cursor-not-allowed opacity-65"}
//                   ${bgColor}
//                   ${textColor}
//                   ${borderColor}
//                   overflow-hidden
//                 `}
//               >
//                 {/* Depleting bar – color changes to red in last 10 seconds */}
//                 {isCurrent && timeLeft > 0 && (
//                   <div
//                     className={`absolute inset-0 origin-left pointer-events-none transition-colors ${
//                       isWarning ? "bg-red-500/30" : "bg-blue-500/25"
//                     }`}
//                     style={{
//                       transform: `scaleX(${1 - progress})`,
//                       transition: "transform 1s linear, background-color 0.4s",
//                     }}
//                   />
//                 )}

//                 {/* Time up overlay (semi-transparent red) */}
//                 {(timeIsUpNow || timeExpired) && !isAnswered && (
//                   <div className="absolute inset-0 bg-red-500/15 pointer-events-none" />
//                 )}

//                 <span className="relative z-10">{i + 1}</span>
//               </button>
//             );
//           })}
//         </div>

//         {/* Legend – updated colors */}
//         <div className="mt-6 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
//             <span>Answered</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 rounded ring-2 ring-blue-600 ring-offset-1 scale-110 bg-white" />
//             <span>Current</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 rounded bg-red-100 border border-red-400" />
//             <span>Time up (not answered)</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300 opacity-65" />
//             <span>Disabled</span>
//           </div>
//         </div>

//         <div className="mt-5 flex justify-center">
//           <SubmitExamButton />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useExam } from "@/context/ExamContext";
import SubmitExamButton from "./SubmitExamButton";
import { useEffect, useState, useRef, useCallback } from "react";

export default function QuestionPalette() {
  const {
    questions,
    currentIndex,
    setCurrentIndex,
    answers,
    section,
  } = useExam();

  const sectionAnswers = answers[section] || {};

  const TIME_PER_QUESTION = 1;

  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [timeExpiredQuestions, setTimeExpiredQuestions] = useState(new Set());

  const timerRef = useRef(null);

  // ────────────────────────────────────────────────
  // Reset expired tracking + timer when section changes
  // This prevents old red colors from appearing in new section
  // ────────────────────────────────────────────────
  useEffect(() => {
    // Clear previous expired questions
    setTimeExpiredQuestions(new Set());

    // Reset timer to full duration
    setTimeLeft(TIME_PER_QUESTION);

    // Stop any running timer from previous section
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [section]);

  // ────────────────────────────────────────────────
  // Timer logic – runs for current question
  // ────────────────────────────────────────────────
  const handleTimeUp = useCallback(() => {
    // Mark current question as expired (time ran out)
    setTimeExpiredQuestions((prev) => {
      const updated = new Set(prev);
      updated.add(currentIndex);
      return updated;
    });

    // Auto move to next question if not last
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length, setCurrentIndex]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Reset timer when current question changes
    setTimeLeft(TIME_PER_QUESTION);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentIndex, handleTimeUp]);

  const progress = timeLeft / TIME_PER_QUESTION;
  const isWarning = timeLeft <= 10 && timeLeft > 0; // red bar in last 10s

  return (
    <div>
      <h1 className="bg-black text-white flex justify-center p-2 font-bold">
        Question Palette
      </h1>

      <div className="text-center py-2 font-medium">
        Time left:{" "}
        <span className={`${isWarning ? "text-red-600 font-bold animate-pulse" : ""}`}>
          {timeLeft}s
        </span>
      </div>

      <div className="w-full bg-white p-6 shadow border rounded-xl">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 mt-3">
          {questions.map((_, i) => {
            const isCurrent = i === currentIndex;
            const isAnswered = !!sectionAnswers[i];
            const timeExpired = timeExpiredQuestions.has(i);
            const timeIsUpNow = isCurrent && timeLeft === 0;

            // Only current question is clickable
            const isEnabled = isCurrent;

            // ────────────────────────────────────────────────
            // Color priority:
            // 1. Answered → green (highest priority)
            // 2. Time expired + not answered → red
            // 3. Current → white + ring + timer bar
            // 4. Others → gray/disabled
            // ────────────────────────────────────────────────
            let bgColor = "bg-gray-100 border-gray-300 text-gray-600";
            let textColor = "text-gray-600";
            let borderColor = "border-gray-300";

            if (isAnswered) {
              bgColor = "bg-green-100 border-green-400 text-green-900 font-semibold";
              textColor = "text-green-900";
              borderColor = "border-green-400";
            } else if (timeExpired || timeIsUpNow) {
              bgColor = "bg-red-100 border-red-400 text-red-900 font-semibold";
              textColor = "text-red-900";
              borderColor = "border-red-400";
            }

            return (
              <button
                key={i}
                onClick={() => isEnabled && setCurrentIndex(i)}
                disabled={!isEnabled}
                className={`
                  relative w-10 h-10 flex items-center justify-center
                  text-sm font-medium rounded-md border transition-all duration-200
                  ${isEnabled
                    ? "ring-2 ring-offset-2 ring-blue-600 scale-105 cursor-pointer bg-white"
                    : "cursor-not-allowed opacity-65"}
                  ${bgColor}
                  ${textColor}
                  ${borderColor}
                  overflow-hidden
                `}
              >
                {/* Depleting bar – blue → red when low time */}
                {isCurrent && timeLeft > 0 && (
                  <div
                    className={`absolute inset-0 origin-left pointer-events-none transition-colors ${
                      isWarning ? "bg-red-500/30" : "bg-blue-500/25"
                    }`}
                    style={{
                      transform: `scaleX(${1 - progress})`,
                      transition: "transform 1s linear, background-color 0.4s",
                    }}
                  />
                )}

                {/* Extra red overlay when time expired / up and not answered */}
                {(timeIsUpNow || timeExpired) && !isAnswered && (
                  <div className="absolute inset-0 bg-red-500/15 pointer-events-none" />
                )}

                <span className="relative z-10">{i + 1}</span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 text-sm grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-400" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-blue-600 ring-offset-1 scale-110 bg-white" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-400" />
            <span>Time up (not answered)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300 opacity-65" />
            <span>Disabled</span>
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <SubmitExamButton />
        </div>
      </div>
    </div>
  );
}
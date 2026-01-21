// "use client";

// import { useExam } from "@/context/ExamContext";
// import { Users, Brain, MessageSquare } from "lucide-react";

// const SECTIONS = [
//   { key: "Aptitude", label: "Aptitude", icon: Users },
//   { key: "Reasoning", label: "Reasoning", icon: Brain },
//   { key: "Communication", label: "Communication", icon: MessageSquare },
// ];

// export default function SectionTabs() {
//   const { section, setSection } = useExam();

//   return (
//     <div className="flex border w-1/2 min-w-8/12 ">
//       {SECTIONS.map(({ key, label, icon: Icon }) => {
//         const isActive = section === key;

//         return (
//           <button
//             key={key}
//             onClick={() => setSection(key)}
//             className={`flex-1 py-3 font-semibold transition border shadow
//               flex items-center justify-center gap-2
//               ${isActive ? "bg-blue-900 text-white" : "bg-white"}
//             `}
//           >
//             <Icon className="w-4 h-4" />
//             {label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

"use client";

import { useExam } from "@/context/ExamContext";
import { Users, Brain, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
const SECTIONS = [
  { key: "Aptitude", label: "Aptitude", icon: Users },
  { key: "Reasoning", label: "Reasoning", icon: Brain },
  { key: "Communication", label: "Communication", icon: MessageSquare },
];

const SECTION_TIME = 900; // 900 seconds = 15 minutes

export default function SectionTabs() {
  const { section, setSection } = useExam();
  const [timeLeft, setTimeLeft] = useState(SECTION_TIME);

  /* ⏱ Timer logic */
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* 🔁 Change section when timer ends */
  useEffect(() => {
    if (timeLeft <= 0) {                      // changed === to <= (safer)
      const currentIndex = SECTIONS.findIndex((s) => s.key === section);

      // ────────────── Add this condition ───────────────
      if (currentIndex < SECTIONS.length - 1) {
        const nextIndex = currentIndex + 1;
        setSection(SECTIONS[nextIndex].key);
        setTimeLeft(SECTION_TIME);
      } else {
        // Last section → stop timer, don't cycle
        setTimeLeft(0);
        // You can add here: show finish message, submit exam, etc.
      }
    }
  }, [timeLeft, section, setSection]);

  /* ✅ Ensure valid section on load */
  useEffect(() => {
    if (!SECTIONS.some((s) => s.key === section)) {
      setSection(SECTIONS[0].key);
    }
  }, [section, setSection]);

  return (
    <div className="flex  w-1/2 min-w-8/12">
      {SECTIONS.map(({ key, label, icon: Icon }) => {
        const isActive = section === key;

        return (
          <button
            key={key}
            onClick={() => {
              // ────────────── Add this guard ───────────────
              if (key === section) {           // only allow clicking the current section
                setSection(key);
                setTimeLeft(SECTION_TIME);
              }
              // or stricter version:
              // if (key === section || timeLeft <= 0) { ... }   ← allow next only after time up
            }}
            className={`flex-1 py-3 font-semibold transition border shadow
            flex items-center justify-center gap-2
            ${isActive ? "bg-blue-900 text-white" : "bg-white"}
            // ────────────── Add visual feedback ───────────────
            ${key !== section ? "opacity-50 cursor-not-allowed" : ""}
          `}
            // ────────────── Add real disable attribute ───────────────
            disabled={key !== section}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}

      {/* Optional timer display */}
      <div className="ml-4 text-sm font-semibold opacity-0 pointer-events-none">
        ⏳ {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>
    </div>
  );
}

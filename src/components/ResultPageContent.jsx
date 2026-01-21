"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function ResultPageContent() {
  const [result, setResult] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem("StudentData"));
    console.log("Student local storage data", studentData);
    if (!studentData?.email) {
      router.replace("/registration");
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await fetch("/api/result");
        const data = await res.json();

        if (!data.success) return;

        let allResults = [];

        if (Array.isArray(data.data)) {
          allResults = data.data;
        } else {
          allResults = Object.values(data.data || {}).flatMap(college =>
            Object.values(college || {})
          );
        }

        const studentEmail = studentData.email.trim().toLowerCase();

        const studentResult = allResults
          .filter(
            r =>
              r &&
              typeof r === "object" &&
              r.studentEmail &&
              r.studentEmail.trim().toLowerCase() === studentEmail
          )
          .sort(
            (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
          )[0];

        setResult(studentResult || null);
      } catch (error) {
        console.error("Result fetch failed:", error);
      } finally {
        localStorage.clear();
      }
    };

    fetchResult();
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-medium">Loading your result...</div>
      </div>
    );
  }

  const handleBack = () => {
    localStorage.clear();
    router.replace("/registration");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      {/* Main content centered vertically and horizontally */}
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-xl text-center">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Exam Result</h1>

          <div className="space-y-3 mb-8">
            <p className="font-semibold text-lg">
              Name: <span className="font-normal">{result.studentName}</span>
            </p>
            <p className="font-semibold text-lg">
              Email: <span className="font-normal">{result.studentEmail}</span>
            </p>
            <p className="font-semibold text-lg">
              College: <span className="font-normal">{result.collegeName}</span>
            </p>
            <p className="font-semibold text-lg">
              College ID: <span className="font-normal">{result.studentId}</span>
            </p>
          </div>

          <hr className="my-6 border-gray-300" />

          <div className="space-y-4">
            <p className="text-2xl font-bold text-gray-800">
              Total Questions: {result.totalQuestions}
            </p>
            <p className="text-2xl font-bold text-green-600">
              Correct Answers: {result.correctAnswers}
            </p>
            <p className="text-2xl font-bold text-red-600">
              Wrong Answers: {result.totalQuestions - result.correctAnswers}
            </p>
          </div>

          <button
            onClick={handleBack}
            className="mt-10 flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-medium mx-auto transition-colors"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
        </div>
      </div>

      {/* Footer at bottom */}
      <footer className="mt-auto py-4 bg-gray-800 text-white text-center text-sm">
        © Copyright 2025 Charani Infotech Pvt Ltd. All Rights Reserved.
      </footer>
    </div>
  );
}
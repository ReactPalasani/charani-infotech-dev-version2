"use client";

import { useExam } from "@/context/ExamContext";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

const sections = ["Aptitude", "Reasoning", "Communication"];

export default function ExamPanel() {
  const {
    section,
    setSection,
    questions,
    currentIndex,
    setCurrentIndex,
    answers,
    setAnswers,
    response,
    setResponse
  } = useExam();

  // ALL HOOKS FIRST
  const tabViolationsRef = useRef(0);
  const keyViolationsRef = useRef(0);
  const maxViolations = 3;
  const isExamActiveRef = useRef(true);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  
  const [topAlert, setTopAlert] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('inactive');

  // 🔥 CAMERA START - When exam begins
  const startCameraMonitoring = async () => {
    try {
      setCameraStatus('starting');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' 
        },
        audio: true
      });

      videoRef.current.srcObject = stream;
      setCameraStatus('active');
      
      // Record video for proctor review
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.start(10000); // Record in 10s chunks
      console.log('📹 Camera monitoring STARTED');
      
    } catch (err) {
      console.error('Camera access denied:', err);
      setTopAlert({
        type: 'error',
        message: '🚫 Camera access required for exam',
        subtext: 'Please allow camera permissions',
        duration: 5000
      });
      isExamActiveRef.current = false;
    }
  };

  // 🔥 CAMERA STOP - Only when exam ends
  const stopCameraMonitoring = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      // Save recording for proctor review
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // TODO: Upload to server for proctor review
        console.log('📹 Recording saved:', blob);
      }
      
      setCameraStatus('stopped');
      console.log('📹 Camera monitoring STOPPED');
    }
  };

  // 🔥 KEYBOARD BLOCKER (F1-F12 + ESC)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isExamActiveRef.current) return;

      const blockedKeys = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
      
      if (blockedKeys.includes(event.key)) {
        event.preventDefault();
        keyViolationsRef.current += 1;
        console.log(`❌ ${event.key} BLOCKED! #${keyViolationsRef.current}`);

        if (keyViolationsRef.current >= maxViolations) {
          isExamActiveRef.current = false;
          stopCameraMonitoring();
          setTopAlert({
            type: 'error',
            message: '🚫 Exam terminated - Key violations',
            subtext: '4 violations detected',
            duration: 5000
          });
          setTimeout(() => window.location.href = "/result", 5000);
        } else {
          setTopAlert({
            type: 'warning',
            message: `⚠️ ${event.key} blocked!`,
            subtext: `${keyViolationsRef.current}/3 violations`,
            duration: 4000
          });
          setTimeout(() => setTopAlert(null), 4000);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🔥 TAB VIOLATION DETECTION
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isExamActiveRef.current) {
        tabViolationsRef.current += 1;
        if (tabViolationsRef.current >= maxViolations) {
          isExamActiveRef.current = false;
          stopCameraMonitoring();
          setTopAlert({
            type: 'error',
            message: '🚫 Exam terminated - Tab switching',
            subtext: '4 violations detected',
            duration: 3000
          });
          setTimeout(() => window.location.href = "/result", 3000);
        } else {
          setTopAlert({
            type: 'warning',
            message: `⚠️ Tab switch detected`,
            subtext: `${tabViolationsRef.current}/3 violations`,
            duration: 4000
          });
          setTimeout(() => setTopAlert(null), 4000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 🔥 START CAMERA WHEN EXAM MOUNTS
  useEffect(() => {
    startCameraMonitoring();
    
    return () => {
      stopCameraMonitoring();
    };
  }, []);

  const question = questions[currentIndex];
  if (!question) return null;

  const sectionAnswers = answers[section] || {};

  const handleSelect = (opt) => {
    if (!isExamActiveRef.current) return;
    setAnswers({
      ...answers,
      [section]: {
        ...sectionAnswers,
        [currentIndex]: opt,
      },
    });
  };

  const isLastQuestion = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!isExamActiveRef.current) return;

    if (!isLastQuestion) {
      setCurrentIndex(i => i + 1);
      return;
    }

    const currentSectionIndex = sections.indexOf(section);
    const nextSection = sections[currentSectionIndex + 1];

    if (nextSection) {
      setSection(nextSection);
      setCurrentIndex(0);
    } else {
      // 🔥 EXAM COMPLETED - STOP CAMERA
      isExamActiveRef.current = false;
      stopCameraMonitoring();
      setTopAlert({
        type: 'success',
        message: '🎉 Exam completed successfully!',
        subtext: 'Camera stopped. Redirecting to results...',
        duration: 3000
      });
      setTimeout(() => {
        window.location.href = "/result";
      }, 3000);
    }
  };

  return (
    <>
      {/* 🔥 TOP ALERT */}
      {topAlert && (
        <div className="fixed top-0 inset-x-0 z-[9999] animate-slideDown">
          <div
            className={`mx-1 mt-1 p-2 rounded-md shadow-lg text-sm text-white ${
              topAlert.type === "error" ? "bg-red-500" :
              topAlert.type === "warning" ? "bg-orange-500" :
              "bg-green-500"
            }`}
          >
            {topAlert.message} • {topAlert.subtext}
          </div>
        </div>
      )}

      {/* 🔥 CAMERA MONITORING STATUS */}
      <div className="fixed top-16 left-4 z-[9998] p-2 bg-gray-900 text-white rounded-lg text-xs flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${cameraStatus === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span>📹 {cameraStatus === 'active' ? 'LIVE' : 'ON'} Camera</span>
        <span>| {keyViolationsRef.current}/3 violations</span>
      </div>

      {/* 🔥 SMALL CAMERA FEED - TOP RIGHT */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="fixed top-4 right-4 z-[9997] w-32 h-24 rounded-lg shadow-lg border-2 border-red-400 object-cover"
        style={{ display: cameraStatus === 'active' ? 'block' : 'none' }}
      />

      {/* MAIN EXAM CONTENT */}
      <div className="bg-white w-1/2 min-w-8/12 p-4 rounded-lg shadow pt-20 mx-auto">
        <h3 className="font-bold mb-6">
          Q{currentIndex + 1}. {question.question1}
        </h3>

        <div className="mt-4 space-y-3">
          {["A", "B", "C", "D"].map((key) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={!isExamActiveRef.current}
              className={`w-full text-left px-4 py-2 rounded border transition-all duration-200 ${
                !isExamActiveRef.current
                  ? "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed"
                  : sectionAnswers[currentIndex] === key
                  ? "bg-green-800 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-blue-900 hover:text-white"
              }`}
            >
              <span className="font-semibold mr-2">{key}.</span>
              {question[key]}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-6">
          <button
            className="bg-black text-white px-4 py-2 rounded flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            onClick={() => {
              if (isExamActiveRef.current && currentIndex > 0) {
                setCurrentIndex(i => i - 1);
              }
            }}
            disabled={!isExamActiveRef.current || currentIndex === 0}
          >
            <ArrowLeft className="mr-2" /> Previous
          </button>

          <button
            className="bg-yellow-600 text-white px-4 py-2 rounded flex items-center hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed transition-all duration-200"
            onClick={handleNext}
            disabled={!isExamActiveRef.current}
          >
            {isLastQuestion ? "Next Section" : "Next"} <ArrowRight className="ml-2" />
          </button>
        </div>
      </div>
    </>
  );
}

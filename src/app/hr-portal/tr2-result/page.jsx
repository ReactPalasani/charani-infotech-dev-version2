"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { 
  CheckCircle, 
  Download, 
  UserPlus, 
  XCircle, 
  X, 
  NotepadText, 
  MessagesSquare, 
  UserCheck, 
  ListOrdered 
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

function HrPortal_Exam() {
  const [response, setResponse] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [studentIdSearch, setstudentIdSearch] = useState("");
  const [correctAnswersSearch, setCorrectAnswersSearch] = useState("");
  const [collgeNameSearch, setCollegeNameSearch] = useState("");
  const [percentageSearch, setPercentageSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);

  // ✅ MODAL & REVIEW STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [topic, setTopic] = useState("");
  const [selectorName, setSelectorName] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const [score, setScore] = useState("1");

  // ✅ COLLEGE DROPDOWN STATES
  const [collegeList, setCollegeList] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [tempColleges, setTempColleges] = useState([]);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);

  const router = useRouter();

  // 1. Auth & Hydration Check
  useEffect(() => {
    setHasMounted(true);
    const admin = JSON.parse(localStorage.getItem("AdminLogin"));
    if (!admin) {
      router.push("/admin");
    }
  }, [router]);

  // 2. Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/tr1-selected-candiates");
        const data = await res.json();

        if (data.success) {
          const flattened = Object.entries(data.data || {}).flatMap(
            ([studentId, collegeObj]) =>
              Object.entries(collegeObj).map(([resultId, value]) => ({
                id: resultId,
                studentId,
                ...value,
              }))
          );
          setStudentData(flattened);
        }
      } catch (error) {
        setResponse(
          <div className="flex justify-center text-red-800 font-bold mt-6">
            Error fetching users
          </div>
        );
      }
    };
    fetchStudents();
  }, []);

  // 3. Fetch Colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch("/api/add-colleges");
        const data = await res.json();
        if (data.success) {
          const names = data.data.map((c) => c.collegeName);
          setCollegeList(names);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    };
    fetchColleges();
  }, []);

  // ✅ OPEN MODAL LOGIC
  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setTopic(student.topic || "");
    setFeedback(student.feedback || "");
    setSelectorName(student.selectorName || "");
    setIsSelected(student.Aptitude_select || false);
    setScore(student.score || "1");
    setIsModalOpen(true);
  };

  // ✅ SUBMIT MODAL LOGIC - Sends to API if checkbox is enabled
  const handleSubmit = async () => {
    if (!selectorName) {
      alert("Please select an interviewer name.");
      return;
    }

    const payload = {
      ...selectedStudent,
      feedback: feedback,
      topic: topic,
      selectorName: selectorName,
      score: score,
      Aptitude_select: isSelected,
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.studentName,
      studentEmail: selectedStudent.studentEmail,
      collegeName: selectedStudent.collegeName, 
      phone: selectedStudent.phone, 
      submittedAt: selectedStudent.submittedAt,
      percentage: selectedStudent.percentage,
    };

    setResponse(
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-bold">
        Saving and Syncing...
      </div>
    );

    try {
      // Send to API only if the "Shortlist" checkbox is enabled
      if (isSelected) {
        const res = await fetch("/api/tr2-selected-candiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error("API Failed");
      }

      // Update local UI
      const updatedStudentData = studentData.map((item) => 
          item.id === selectedStudent.id ? payload : item
      );
      setStudentData(updatedStudentData);

      setResponse(
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-green-100 border-2 border-green-600 text-green-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <CheckCircle size={18} /> {isSelected ? "Shortlisted and Saved!" : "Review Saved Locally"}
        </div>
      );

      setTimeout(() => {
        setIsModalOpen(false);
        setResponse(null);
      }, 1500);

    } catch (error) {
      setResponse(
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-600 text-red-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <XCircle size={18} /> Error saving data to API.
        </div>
      );
      setTimeout(() => setResponse(null), 3000);
    }
  };

  // 4. Move Logic (Bulk)
  const handleMoveToTechnical = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one student.");
      return;
    }

    setResponse(
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded shadow-lg font-bold">
        Processing Move...
      </div>
    );

    let hasError = false;
    let successCount = 0;

    for (const student of selectedRows) {
      const payload = {
        ...student,
        feedback: student.feedback || " ",
        topic: student.topic || " ",
        selectorName: student.selectorName || " ",
        Aptitude_select: true,
        score: student.score || " ",
        studentId: student.studentId,
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        collegeName: student.collegeName, 
        phone: student.phone, 
        submittedAt: student.submittedAt,
        percentage: student.percentage,
      };

      try {
        const res = await fetch("/api/tr2-selected-candiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) successCount++;
        else hasError = true;
      } catch {
        hasError = true;
      }
    }

    if (!hasError) {
      setResponse(
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-green-100 border-2 border-green-600 text-green-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <CheckCircle size={18} /> {successCount} Students moved successfully!
        </div>
      );
      setSelectedRows([]);
    } else {
      setResponse(
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-600 text-red-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <XCircle size={18} /> Error moving some students.
        </div>
      );
    }

    setTimeout(() => setResponse(null), 3000);
  };

  const handleCheckboxChange = (student) => {
    setSelectedRows((prev) =>
      prev.find((s) => s.id === student.id)
        ? prev.filter((s) => s.id !== student.id)
        : [...prev, student]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedRows(filteredData);
    else setSelectedRows([]);
  };

  // 5. Filtering Logic
  const filteredData = useMemo(() => {
    return studentData.filter((student) => {
      const matchStudentId = studentIdSearch
        ? student.studentId?.toLowerCase().includes(studentIdSearch.toLowerCase())
        : true;

      const matchCollege =
        selectedColleges.length > 0
          ? selectedColleges.includes(student.collegeName)
          : true;

      const matchCorrectAnswers = correctAnswersSearch
        ? Number(student.correctAnswers) >= Number(correctAnswersSearch)
        : true;

      const matchPercentage = percentageSearch
        ? Number(student.percentage) >= Number(percentageSearch)
        : true;

      return (
        matchStudentId &&
        matchCollege &&
        matchCorrectAnswers &&
        matchPercentage
      );
    });
  }, [
    studentData,
    studentIdSearch,
    selectedColleges,
    correctAnswersSearch,
    percentageSearch,
  ]);

  // 6. Excel Download
  const downloadExcel = () => {
    if (!filteredData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "Technical_Round_Results.xlsx");
  };

  // 7. Columns
  const columns = [
    { name: "S.No", cell: (row, index) => index + 1, width: "70px" },
    { name: "Name", selector: (row) => row.studentName, sortable: true },
    { name: "Student ID", selector: (row) => row.studentId, sortable: true },
    { name: "Email", selector: (row) => row.studentEmail, sortable: true },
    { name: "Phone Number", selector: (row) => row.phone, sortable: true },
    { name: "College Name", selector: (row) => row.collegeName, sortable: true, width: "200px" },
    { name: "Correct Answers", selector: (row) => `${row.correctAnswers}/${row.totalQuestions}`, sortable: true, width: "90px" },
    { name: "Percent", selector: (row) => `${row.percentage}%`, sortable: true, width: "90px" },
    {
      name: "Review",
      cell: (row) => (
        <button 
          onClick={() => handleOpenModal(row)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
        >
          Review
        </button>
      ),
      width: "100px"
    },
    {
      name: (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 cursor-pointer"
            onChange={handleSelectAll}
            checked={selectedRows.length === filteredData.length && filteredData.length > 0}
          />
          <span className="text-xs">Select All</span>
        </div>
      ),
      width: "120px",
      cell: (row) => (
        <input
          type="checkbox"
          className="w-5 h-5 cursor-pointer accent-blue-600"
          checked={!!selectedRows.find((s) => s.id === row.id)}
          onChange={() => handleCheckboxChange(row)}
        />
      ),
    },
  ];

  if (!hasMounted) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 mt-4">
        Selected Candidates In Technical Round-2
      </h1>

      <div className="flex gap-4 mb-6 flex-wrap bg-white p-5 rounded-lg shadow-sm items-end border border-gray-100">
        <div className="relative">
          <button
            onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
            className="border px-4 py-2 rounded w-60 bg-white text-left text-sm"
          >
            {selectedColleges.length > 0
              ? selectedColleges.join(", ")
              : "Select College"}
          </button>

          {showCollegeDropdown && (
            <div className="absolute z-10 bg-white border rounded shadow-md p-3 w-60 max-h-60 overflow-auto">
              {collegeList.map((college) => (
                <label key={college} className="flex gap-2 mb-2 items-center text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempColleges.includes(college)}
                    onChange={(e) =>
                      setTempColleges((prev) =>
                        e.target.checked
                          ? [...prev, college]
                          : prev.filter((c) => c !== college)
                      )
                    }
                  />
                  {college}
                </label>
              ))}

              <button
                onClick={() => {
                  setSelectedColleges(tempColleges);
                  setShowCollegeDropdown(false);
                }}
                className="mt-2 w-full bg-blue-600 text-white py-1 rounded text-sm font-bold"
              >
                Apply Filter
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Student ID</label>
          <input
            type="text"
            placeholder="Search ID..."
            value={studentIdSearch}
            onChange={(e) => setstudentIdSearch(e.target.value)}
            className="border px-3 py-2 rounded w-44 text-sm"
          />
        </div>

        <div className="flex gap-3 ml-auto">
          <button
            onClick={handleMoveToTechnical}
            disabled={selectedRows.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded font-bold transition-all ${
              selectedRows.length > 0
                ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <UserPlus size={18} /> Move to HR Round ({selectedRows.length})
          </button>

          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded font-bold shadow-md transition-all"
          >
            <Download size={18} /> Download Excel
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        striped
        responsive
      />

      {/* ✅ MODAL COMPONENT */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Review Result - {selectedStudent.studentName}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full transition-colors">
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                <div>
                  <label className="font-bold flex items-center gap-2 mb-2 text-gray-700">
                    <UserCheck size={18} /> Interviewer Name
                  </label>
                  <select
                    value={selectorName}
                    onChange={(e) => setSelectorName(e.target.value)}
                    className="border-2 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none border-gray-200"
                  >
                    <option value="">Select Interviewer</option>
                    <option value="raja-sekhar">Raja Sekhar</option>
                    <option value="faruk">Faruk</option>
                    <option value="sathis">Sathis</option>
                    <option value="vanitha">Vanitha</option>
                    <option value="malika">Malika</option>
                    <option value="bindu">Bindu</option>
                    <option value="madhavi">Madhavi</option>
                    <option value="nagendra">Nagendra</option>
                    <option value="mohan-krishna">Mohan Krishna</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold flex items-center gap-2 mb-2 text-gray-700">
                    <ListOrdered size={18} /> Score
                  </label>
                  <select
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="border-2 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none border-gray-200"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shortlist"
                    checked={isSelected}
                    onChange={(e) => setIsSelected(e.target.checked)}
                    className="w-6 h-6 accent-blue-900 cursor-pointer"
                  />
                  <label htmlFor="shortlist" className="font-bold text-gray-700 select-none cursor-pointer">Shortlist for Next Round?</label>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="font-bold flex items-center gap-2 mb-2 text-gray-700">
                    <MessagesSquare size={18} /> Feedback
                  </label>
                  <textarea
                    rows={6}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="border-2 rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none border-gray-200"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-gray-50 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
                Discard
              </button>
              <button onClick={handleSubmit} className="px-8 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg transition-all">
                Submit & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {response}
    </div>
  );
}

export default HrPortal_Exam;
"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { CheckCircle, Download, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

function HrPortal_Exam() {
  const [response, setResponse] = useState(null);
  const [studentData, setStudentData] = useState([]);
  const [studentIdSearch, setstudentIdSearch] = useState("");
  const [correctAnswersSearch, setCorrectAnswersSearch] = useState("");
  const [percentageSearch, setPercentageSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);

  /* College Dropdown States */
  const [collegeList, setCollegeList] = useState([]);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [tempColleges, setTempColleges] = useState([]);

  const router = useRouter();

  // Auth Check
  useEffect(() => {
    setHasMounted(true);
    const admin = JSON.parse(localStorage.getItem("AdminLogin"));
    if (!admin) router.push("/admin");
  }, [router]);

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/tr2-selected-candiate");
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
      } catch {
        setResponse(
          <div className="flex justify-center text-red-800 font-bold mt-6">
            Error fetching users
          </div>
        );
      }
    };
    fetchStudents();
  }, []);

  // Fetch Colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch("/api/add-colleges");
        const data = await res.json();
        if (data.success) {
          const names = data.data.map(c => c.collegeName);
          setCollegeList(names);
        }
      } catch {
        console.error("Error fetching colleges");
      }
    };
    fetchColleges();
  }, []);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return studentData.filter(student => {
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

  // Move Students
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
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        studentId: student.studentId,
        collegeName: student.collegeName,
        totalQuestions: student.totalQuestions,
        correctAnswers: student.correctAnswers,
        submittedAt: student.submittedAt,
        percentage: student.percentage,
        feedback: "",
        phone: student.phone,
        topic: "",
        Interview_score: student.Interview_score,
        selectorName: "HR_Admin",
        Aptitude_select: true,
      };

      try {
        const res = await fetch("/api/finalSelectCandiates", {
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

    setResponse(
      !hasError ? (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-green-100 border-2 border-green-600 text-green-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <CheckCircle size={18} /> {successCount} Students moved successfully!
        </div>
      ) : (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-600 text-red-800 px-6 py-2 rounded shadow-lg font-bold flex items-center gap-2">
          <XCircle size={18} /> Error moving some students.
        </div>
      )
    );

    setTimeout(() => setResponse(null), 3000);
    setSelectedRows([]);
  };

  const handleCheckboxChange = student => {
    setSelectedRows(prev =>
      prev.find(s => s.id === student.id)
        ? prev.filter(s => s.id !== student.id)
        : [...prev, student]
    );
  };

  const handleSelectAll = e => {
    if (e.target.checked) setSelectedRows(filteredData);
    else setSelectedRows([]);
  };

  const downloadExcel = () => {
    if (!filteredData.length) return;
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "Technical_Round_Results.xlsx");
  };

  const columns = [
    { name: "S.No", cell: (_, i) => i + 1, width: "70px" },
    { name: "Name", selector: row => row.studentName },
    { name: "Email", selector: row => row.studentEmail, width: "220px" },
    { name: "Phone Number", selector: row => row.phone, width: "150px" },
    { name: "Student ID", selector: row => row.studentId },
    { name: "College Name", selector: row => row.collegeName, width: "200px" },
    { name: "Total Qns", selector: row => row.totalQuestions, width: "100px" },
    { name: "Correct Answers", selector: (row) => `${row.correctAnswers}/${row.totalQuestions}`, sortable: true, width: "90px" },
    { name: "Interviewer", selector: row => row.selectorName, width: "150px" },
    { name: "Interview score", selector: row => row.score, width: "150px" },
    {
      name: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={selectedRows.length === filteredData.length && filteredData.length > 0}
        />
      ),
      cell: row => (
        <input
          type="checkbox"
          checked={!!selectedRows.find(s => s.id === row.id)}
          onChange={() => handleCheckboxChange(row)}
        />
      ),
    },
  ];

  if (!hasMounted) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 mt-4">
        Interview Shortlisted Candidates
      </h1>

      {/* Filter & Actions Bar */}
      <div className="flex flex-wrap justify-between mb-6 bg-white p-5 rounded-lg shadow-sm items-end gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap gap-4 items-end">

            {/* College Dropdown */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-bold text-gray-500 uppercase">
              College Name
            </label>

            <button
              onClick={() => {
                setTempColleges(selectedColleges);
                setShowCollegeDropdown(!showCollegeDropdown);
              }}
              className="border px-3 py-2 rounded w-52 bg-white text-left"
            >
              {selectedColleges.length > 0
                ? selectedColleges.join(", ")
                : "Select College"}
            </button>

            {showCollegeDropdown && (
              <div className="absolute top-full mt-1 z-20 bg-white border rounded shadow-md p-3 w-52 max-h-60 overflow-auto">
                {collegeList.map(college => (
                  <label key={college} className="flex gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={tempColleges.includes(college)}
                      onChange={e =>
                        setTempColleges(prev =>
                          e.target.checked
                            ? [...prev, college]
                            : prev.filter(c => c !== college)
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
                  className="mt-2 w-full bg-blue-600 text-white py-1 rounded"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          {/* Student ID Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Student ID
            </label>
            <input
              type="text"
              value={studentIdSearch}
              onChange={e => setstudentIdSearch(e.target.value)}
              className="border px-3 py-2 rounded w-48"
              placeholder="Search by ID"
            />
          </div>

          {/* Percentage Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase">
              Min Percentage
            </label>
            <input
              type="number"
              value={percentageSearch}
              onChange={e => setPercentageSearch(e.target.value)}
              className="border px-3 py-2 rounded w-36"
              placeholder="%"
            />
          </div>

        
        </div>

        {/* Right Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleMoveToTechnical}
            disabled={selectedRows.length === 0}
             className={`flex items-center gap-2 px-6 py-2.5 rounded font-bold ${
              selectedRows.length > 0
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <UserPlus size={18} /> Move to Next Round  ({selectedRows.length})
          </button>

           <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-700 text-white px-6 py-2 rounded font-bold"
          >
            <Download size={18} /> Download Excel
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={filteredData} pagination />

      {response}
    </div>
  );
}

export default HrPortal_Exam;

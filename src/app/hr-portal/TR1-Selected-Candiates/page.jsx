"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import Header from "@/components/Header";
import { View, X, NotepadText, UserCheck, MessagesSquare, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

function HrPortal_Exam() {
  const [studentData, setStudentData] = useState([]);
  const [studentIdSearch, setstudentIdSearch] = useState("");
  const [selectSearch, setSelectSearch] = useState("");
  const [collegeNameSearch, setCollegeNameSearch] = useState("");
  const [correctAnswersSearch, setCorrectAnswersSearch] = useState("");
  const [response, setResponse] = useState(null);
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentId, setStudentId] = useState(null);

  // Form State for Popup
  const [feedback, setFeedback] = useState("");
  const [topic, setTopic] = useState("");
  const [selectorName, setSelectorName] = useState("");
  const [isSelected, setIsSelected] = useState(false);

  // 1. Auth Check
  useEffect(() => {
    const admin = JSON.parse(localStorage.getItem("AdminLogin"));
    if (!admin) {
      router.push("/admin");
    }
  }, [router]);

  // 2. Fetch Data
  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/tr1-Exam-Result");
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
        <div className="text-red-800 font-bold mt-6 text-center">Error fetching users</div>
      );
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 3. Modal Logic
  const handleOpenModal = (student) => {
    setSelectedStudent(student); // store clicked row
    setStudentId(student.studentId); // optional
    setFeedback(student.feedback || "");
    setTopic(student.topic || "");
    setSelectorName(student.selectorName || "");
    setIsSelected(student.Aptitude_select || false);
    setIsModalOpen(true); // open modal
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...selectedStudent,
        feedback,
        topic,
        selectorName,
        jam_selected: isSelected,
      };

      const res = await fetch("/api/tr1-Exam-Result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setResponse(
          <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded shadow-lg z-[60]">
            Update Successful!
          </div>
        );
        setIsModalOpen(false);
        fetchStudents();
        setTimeout(() => setResponse(null), 3000);
      }
    } catch (error) {
      alert("Error updating result");
    }
  };

  // 4. Excel Download
  const handleDownloadExcel = () => {
    if (filteredData.length === 0) {
      alert("No data available to download");
      return;
    }

    const excelData = filteredData.map((item, index) => ({
      "S.No": index + 1,
      "Student Name": item.studentName,
      "Email": item.studentEmail,
      "Student ID": item.studentId,
      "College": item.collegeName,
      "Score": item.score,
      "Correct Answers": item.correctAnswers,
      "Selected": item.Aptitude_select ? "Yes" : "No",
      "Invigilator": item.selectorName || "N/A",
      "Topic": item.topic || "N/A",
      "Feedback": item.feedback || "N/A",
      "Date": item.submittedAt || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "JAM Results");
    XLSX.writeFile(
      workbook,
      `Jam_Results_${new Date().toLocaleDateString()}.xlsx`
    );
  };

  // 5. Filtering
  const filteredData = useMemo(() => {
    return studentData.filter((student) => {
      const matchStudentId = studentIdSearch
        ? student.studentId?.toLowerCase().includes(studentIdSearch.toLowerCase())
        : true;

      const matchCollegeName = collegeNameSearch
        ? student.collegeName?.toLowerCase().includes(collegeNameSearch.toLowerCase())
        : true;

      const matchCorrectAnswers = correctAnswersSearch
        ? Number(student.correctAnswers) === Number(correctAnswersSearch)
        : true;

      const matchSelect =
        selectSearch === ""
          ? true
          : selectSearch === "yes"
          ? student.Aptitude_select === true
          : student.Aptitude_select === false;

      return matchStudentId && matchCollegeName && matchCorrectAnswers && matchSelect;
    });
  }, [
    studentData,
    studentIdSearch,
    collegeNameSearch,
    correctAnswersSearch,
    selectSearch,
  ]);

  // 6. Table Columns
  const columns = [
    { name: "S.No", cell: (row, index) => index + 1, width: "80px" },
    { name: "Name", selector: (row) => row.studentName, sortable: true },
    { name: "Email", selector: (row) => row.studentEmail, sortable: true, width: "220px" },
    { name: "Phone Number", selector: (row) => row.phone, sortable: true, width: "220px" },
    { name: "Student ID", selector: (row) => row.studentId, sortable: true },
    { name: "College", selector: (row) => row.collegeName, sortable: true, width: "250px" },
    { name: "Topic", selector: (row) => row.topic, sortable: true },
    { name: "Score", selector: (row) => row.score, sortable: true },
    { name: "Feedback", selector: (row) => row.feedback, sortable: true },
     {
      name: "View Details",
      cell: (row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className="bg-blue-900 text-white px-3 py-1 rounded text-sm hover:bg-blue-800 transition"
        >
          <View size={16} />
        </button>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Selected for Jam</h1>

     
      <div className="flex gap-4 mb-6 flex-wrap items-end">
      

        <div>
          <label className="block text-sm font-bold mb-1">Student ID</label>
          <input
            type="text"
            placeholder="Search ID..."
            value={studentIdSearch}
            onChange={(e) => setstudentIdSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-1">Shortlisted</label>
          <select
            value={selectSearch}
            onChange={(e) => setSelectSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64 outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        <button
          onClick={handleDownloadExcel}
          className="flex items-center justify-center gap-2 bg-green-700 text-white px-6 py-[9px] rounded font-bold hover:bg-green-800 transition shadow-sm"
        >
          <Download size={18} />
          Download Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          highlightOnHover
          striped
          responsive
        />
      </div>
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto flex flex-col">
            
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h2 className="text-xl font-bold text-blue-900">Details - {selectedStudent.studentName}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-100 rounded-full">
                <X size={24} />
              </button>
            </div>
             <div className="p-6 space-y-4 font-bold align-item-center">
                <div className="w-full flex ">
               <p className="w-1/2">Student Id </p> <span className="font-normal w-1/2"> :    {selectedStudent.studentId}</span>
                </div>

                                <div className="w-full flex ">
               <p className="w-1/2">Name</p> <span className="font-normal w-1/2">:  {selectedStudent.studentName}</span>
                </div>
 
                 <div className="w-full flex ">
               <p className="w-1/2">Email</p> <span className="font-normal w-1/2">:  {selectedStudent.studentEmail}</span>
                </div>
                <div className="w-full flex ">
                <p className="w-1/2">Phone </p> <span className="font-normal w-1/2">:  {selectedStudent.phone}</span>
                </div>
                <div className="w-full flex ">
                <p className="w-1/2">College Name </p> <span className="font-normal w-1/2"> :  {selectedStudent.collegeName}</span>
                </div>
                <div className="w-full flex ">
                <p className="w-1/2">Topic </p> <span className="font-normal w-1/2">:  {selectedStudent.topic}</span>
                </div>
                <div className="w-full flex ">
                <p className="w-1/2">Score </p> <span className="font-normal w-1/2"> :  {selectedStudent.score}</span>
                </div>
                <div className="w-full flex ">
                <p className="w-1/2">Feedback </p> <span className="font-normal w-1/2"> :  {selectedStudent.feedback}</span>
                </div   >
             </div>
          </div>
        </div>
      )}

      {response}
    </div>
  );
}

export default HrPortal_Exam;

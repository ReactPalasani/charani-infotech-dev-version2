"use client";

import { useEffect, useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Download, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

function HrPortal_Exam() {
  const [studentData, setStudentData] = useState([]);
  const [studentIdSearch, setstudentIdSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [hasMounted, setHasMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ✅ College Dropdown States */
  const [collegeList, setCollegeList] = useState([]);
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [tempColleges, setTempColleges] = useState([]);

  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
    const admin = JSON.parse(localStorage.getItem('AdminLogin'));
    if (!admin) router.push('/admin');
  }, [router]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch("/api/finalSelectCandiates");
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
        console.error("Error fetching users");
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch("/api/add-colleges");
        const data = await res.json();
        if (data.success) setCollegeList(data.data.map(c => c.collegeName));
      } catch {
        console.error("Error fetching colleges");
      }
    };
    fetchColleges();
  }, []);

  const filteredData = useMemo(() => {
    return studentData.filter(student => {
      const matchId = studentIdSearch ? student.studentId?.toLowerCase().includes(studentIdSearch.toLowerCase()) : true;
      const matchCollege = selectedColleges.length > 0 ? selectedColleges.includes(student.collegeName) : true;
      return matchId && matchCollege;
    });
  }, [studentData, studentIdSearch, selectedColleges]);

  // ✅ Send Bulk Mail Function (Backend API Call)
  const handleSendBulkMail = async () => {
    if (selectedRows.length === 0) return alert("Please select candidates first!");
    
    setLoading(true);
    try {
      const response = await fetch("/api/send-bulk-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: selectedRows }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Emails sent successfully to all selected candidates!");
      } else {
        alert("Failed to send emails: " + result.message);
      }
    } catch (error) {
      alert("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : filteredData;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "Candidates_List.xlsx");
  };

  const columns = [
    { name: "S.No", cell: (row, index) => index + 1, width: "70px" },
    { name: "Name", selector: row => row.studentName, sortable: true },
    { name: "Phone", selector: row => row.phone },
    { name: "Email", selector: row => row.studentEmail, width: "220px" },
    { name: "Student ID", selector: row => row.studentId },
    { name: "College", selector: row => row.collegeName, width: "200px" },
  ];

  if (!hasMounted) return null;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 mt-4">Final Select</h1>

      <div className="flex gap-4 mb-6 flex-wrap bg-white p-5 rounded-lg shadow-sm items-end border border-gray-100">
        <div className="flex flex-col gap-1 relative">
          <label className="text-xs font-bold text-gray-500 uppercase">College Name</label>
          <button onClick={() => setShowCollegeDropdown(!showCollegeDropdown)} className="border px-3 py-2 rounded w-52 bg-white text-left">
            {selectedColleges.length > 0 ? selectedColleges.join(", ") : "Select College"}
          </button>
          {showCollegeDropdown && (
            <div className="absolute top-full mt-1 z-20 bg-white border rounded shadow-md p-3 w-52 max-h-60 overflow-auto">
              {collegeList.map(c => (
                <label key={c} className="flex gap-2 mb-2 items-center">
                  <input type="checkbox" checked={tempColleges.includes(c)} onChange={(e) => setTempColleges(e.target.checked ? [...tempColleges, c] : tempColleges.filter(x => x !== c))} /> {c}
                </label>
              ))}
              <button onClick={() => { setSelectedColleges(tempColleges); setShowCollegeDropdown(false); }} className="mt-2 w-full bg-blue-600 text-white py-1 rounded">Apply</button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase">Student ID</label>
          <input type="text" placeholder="Search..." value={studentIdSearch} onChange={e => setstudentIdSearch(e.target.value)} className="border px-3 py-2 rounded w-44 outline-none" />
        </div>

        <div className="flex gap-3 ml-auto">
          <button onClick={handleSendBulkMail} disabled={loading || selectedRows.length === 0} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />} Send Bulk Mail ({selectedRows.length})
          </button>
          <button onClick={downloadExcel} className="flex items-center gap-2 bg-green-700 text-white px-6 py-2 rounded font-bold hover:bg-green-800">
            <Download size={18} /> Download Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          selectableRows
          onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
          highlightOnHover
        />
      </div>
    </div>
  );
}

export default HrPortal_Exam;
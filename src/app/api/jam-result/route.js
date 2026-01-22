import { NextResponse } from "next/server";
import { database } from "@/lib/firebase";
import { ref, push, set, get } from "firebase/database";

export async function POST(req) {
  try {
    const body = await req.json();
    const { studentId, ...resultData } = body;

    if (!studentId) {
      return NextResponse.json({ success: false, message: "Missing studentId" }, { status: 400 });
    }

    // 1. Reference to the student's specific location
    const studentRef = ref(database, `JamResult/${studentId}`);
    
    // 2. Check if student exists
    const snapshot = await get(studentRef);

    if (snapshot.exists()) {
      // IF EXISTS: Push a new result into a history list
      const historyRef = ref(database, `JamResult/${studentId}/history`);
      // const newResultRef = push(historyRef);
      
      await set(historyRef, {
        ...resultData,
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: "Updated Successfully" });
    } else {
      // IF NEW: Create the student record and push the first result
      const newResultRef = push(ref(database, `JamResult/${studentId}/history`));
      
      await set(studentRef, {
        studentDetails: { studentId }, // Initial profile info
        history: {
          [newResultRef.key]: {
            ...resultData,
            createdAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({ success: true, message: "Successfully created new student and result" });
    }
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dbRef = ref(database, "JamResult/");
    const snapshot = await get(dbRef);

    return NextResponse.json({
      success: true,
      data: snapshot.val() || {}, // Return empty object if no data
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
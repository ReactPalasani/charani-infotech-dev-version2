import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { candidates } = await req.json();

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: false, message: "No candidates selected" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "kishorvijjigiri0403@gmail.com",
        pass: "paszubsyqotlsjbh", // Your 16-digit App Password
      },
    });

    // Create a list of email tasks
    const emailPromises = candidates.map((student) => {
      return transporter.sendMail({
        from: '"Charani Infotech" <kishorvijjigiri0403@gmail.com>',
        to: student.studentEmail,
        subject: "Congratulations! Welcome to Charani Infotech",
        text: `Hi ${student.studentName},
 
Greetings from Charani Infotech !! 
 
Congratulations and welcome to Charani family … 
 
Your Point of Contact 
HR,
vanitha@charani.in

 
Thanks & Regards,
Team HR
CHARANI INFOTECH`,
      });
    });

    // Run all emails in parallel
    const results = await Promise.allSettled(emailPromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({ 
      success: true, 
      message: `Completed: ${successful} sent, ${failed} failed.` 
    });

  } catch (error) {
    console.error("Email Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
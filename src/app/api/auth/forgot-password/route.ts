import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json(
        { message: "If an account with that email exists, we've sent a reset link." },
        { status: 200 }
      );
    }

    const resetToken = await generatePasswordResetToken(email);
    
    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken.token}`;

    await sendEmail({
      to: email,
      subject: "Reset your password - Resolve",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
          <h2 style="color: #3b82f6;">Resolve Incident Management</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
          <p style="color: #71717a; font-size: 12px; margin-top: 40px;">&copy; 2026 Resolve Inc. | Enterprise Support System</p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: "If an account with that email exists, we've sent a reset link." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

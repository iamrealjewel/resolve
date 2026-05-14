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
      subject: "Action Required: Reset Your Resolve Password",
      html: `
        <div style="background-color: #F8F9FA; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1A1A1A;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
            <div style="background-color: #0176D3; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">RESOLVE</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Security Enforcement</p>
            </div>
            
            <div style="padding: 40px 35px;">
              <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; color: #111827;">Password Reset Request</h2>
              <p style="font-size: 15px; line-height: 1.6; color: #4B5563;">Hi <strong>${user.name}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.6; color: #4B5563;">We received a request to access your account via password reset. To proceed with establishing a new secure password, please click the button below:</p>
              
              <div style="margin: 35px 0; text-align: center;">
                <a href="${resetLink}" style="display: inline-block; background-color: #0176D3; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 4px 10px rgba(1, 118, 211, 0.25);">Reset My Password</a>
              </div>
              
              <div style="background-color: #F3F4F6; padding: 15px; border-radius: 6px; border-left: 4px solid #0176D3; margin-top: 30px;">
                <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.5;"><strong>Security Note:</strong> This link is only valid for the next 60 minutes. If you did not initiate this request, please ignore this email and ensure your account remains secure.</p>
              </div>
            </div>
            
            <div style="padding: 20px 35px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
              <p style="font-size: 12px; color: #9CA3AF; margin: 0;">&copy; 2026 Resolve Incident Management | Enterprise Support Portal</p>
              <p style="font-size: 11px; color: #D1D5DB; margin-top: 5px;">This is an automated security message, please do not reply.</p>
            </div>
          </div>
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

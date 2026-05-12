import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    const existingToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!existingToken) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      await prisma.passwordResetToken.delete({
        where: { id: existingToken.id },
      });
      return NextResponse.json({ message: "Token has expired" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: existingToken.email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

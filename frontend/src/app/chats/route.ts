import { NextResponse } from "next/server";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validatedData = messageSchema.parse(body);
    console.log(validatedData);

    // TODO: Process message, e.g. save to database

    return NextResponse.json(
      {
        success: true,
        message: "Message received successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

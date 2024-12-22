import { checkParticipantAvailableSlots } from "@/helper-functions/redis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { participant_ids, date_range } = await request.json();
    console.log("Request Data:", { participant_ids, date_range });
    const response = await checkParticipantAvailableSlots({
      participant_ids,
      date_range,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    return NextResponse.json(error, { status: 500 });
  }
}

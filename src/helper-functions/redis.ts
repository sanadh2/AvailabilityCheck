import { format, parse, addMinutes, isBefore, isEqual } from "date-fns";
import Redis from "ioredis";
const redis = new Redis();

export type Participant = {
  name: string;
  threshold: number;
};

type Availability = {
  [day: string]: { start: string; end: string }[];
};

type Schedule = {
  [date: string]: { start: string; end: string }[];
};

type Input = {
  participant_ids: number[];
  date_range: { start: string; end: string };
};

type Output = {
  [date: string]: string[];
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchFromCache(key: string): Promise<any> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error fetching key ${key} from Redis:`, error);
    return null;
  }
}

// export async function fetchFromCache(key: string): Promise<any> {
//   // Simulating fetching from Redis/Memcached
//   // Replace with actual fetching logic in your app
//   return await new Promise((resolve) => {
//     const mockCache: { [key: string]: any } = {
//       participants: {
//         1: { name: "Adam", threshold: 4 },
//         2: { name: "Bosco", threshold: 4 },
//         3: { name: "Catherine", threshold: 5 },
//       },
//       participantAvailability: {
//         1: {
//           Monday: [
//             { start: "09:00", end: "11:00" },
//             { start: "14:00", end: "16:30" },
//           ],
//           Tuesday: [{ start: "09:00", end: "18:00" }],
//         },
//         2: {
//           Monday: [{ start: "09:00", end: "18:00" }],
//           Tuesday: [{ start: "09:00", end: "11:30" }],
//         },
//         3: {
//           Monday: [{ start: "09:00", end: "18:00" }],
//           Tuesday: [{ start: "09:00", end: "18:00" }],
//         },
//       },
//       schedules: {
//         1: {
//           "28/10/2024": [
//             { start: "09:30", end: "10:30" },
//             { start: "15:00", end: "16:30" },
//           ],
//         },
//         2: {
//           "28/10/2024": [{ start: "13:00", end: "13:30" }],
//           "29/10/2024": [{ start: "09:00", end: "10:30" }],
//         },
//       },
//     };
//     resolve(mockCache[key]);
//   });
// }

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  let current = parse(start, "HH:mm", new Date());
  const endParsed = parse(end, "HH:mm", new Date());

  while (isBefore(current, endParsed) || isEqual(current, endParsed)) {
    const next = addMinutes(current, 30);
    if (isBefore(next, endParsed) || isEqual(next, endParsed)) {
      slots.push(`${format(current, "HH:mm")}-${format(next, "HH:mm")}`);
    }
    current = next;
  }

  return slots;
}

function getOverlappingSlots(slotsArray: string[][]): string[] {
  if (slotsArray.length === 0) return [];

  const commonSlots = slotsArray.reduce((acc, slots) => {
    return acc.filter((slot) => slots.includes(slot));
  });

  return commonSlots;
}

export async function checkParticipantAvailableSlots(
  input: Input
): Promise<Output> {
  console.log("Input received:", input);

  const participants: { [id: number]: Participant } = await fetchFromCache(
    "participants"
  );
  console.log("Participants fetched:", participants);

  const participantAvailability: { [id: number]: Availability } =
    await fetchFromCache("participantAvailability");
  console.log("Participant availability fetched:", participantAvailability);

  const schedules: { [id: number]: Schedule } = await fetchFromCache(
    "schedules"
  );
  console.log("Schedules fetched:", schedules);

  const output: Output = {};
  const { participant_ids, date_range } = input;
  const { start: startDate, end: endDate } = date_range;

  const dates = [];
  let currentDate = parse(startDate, "dd/MM/yyyy", new Date());
  const endParsed = parse(endDate, "dd/MM/yyyy", new Date());

  console.log("Start Date Parsed:", currentDate);
  console.log("End Date Parsed:", endParsed);

  while (isBefore(currentDate, endParsed) || isEqual(currentDate, endParsed)) {
    console.log("Current Date:", currentDate);
    dates.push(format(currentDate, "dd/MM/yyyy"));
    currentDate = addMinutes(currentDate, 1440); // Add one day
  }

  console.log("Dates to process:", dates);

  for (const date of dates) {
    const dayOfWeek = format(parse(date, "dd/MM/yyyy", new Date()), "EEEE");
    console.log(`Processing date: ${date}, Day of week: ${dayOfWeek}`);

    const dailySlots: string[][] = [];

    for (const participantId of participant_ids) {
      console.log(`Processing participant ID: ${participantId}`);

      const availability =
        participantAvailability[participantId]?.[dayOfWeek] || [];
      console.log(
        `Availability for participant ${participantId} on ${dayOfWeek}:`,
        availability
      );

      const scheduledMeetings = schedules[participantId]?.[date] || [];
      console.log(
        `Scheduled meetings for participant ${participantId} on ${date}:`,
        scheduledMeetings
      );

      const availableSlots: string[] = [];

      for (const { start, end } of availability) {
        availableSlots.push(...generateTimeSlots(start, end));
      }

      for (const { start, end } of scheduledMeetings) {
        const occupiedSlots = generateTimeSlots(start, end);
        for (const slot of occupiedSlots) {
          const index = availableSlots.indexOf(slot);
          if (index !== -1) {
            availableSlots.splice(index, 1);
          }
        }
      }

      console.log(
        `Available slots for participant ${participantId} on ${date}:`,
        availableSlots
      );

      dailySlots.push(availableSlots);
    }

    const commonSlots = getOverlappingSlots(dailySlots);
    console.log(`Common slots on ${date}:`, commonSlots);

    if (commonSlots.length > 0) {
      output[date] = commonSlots;
    }
  }

  console.log("Final output:", output);
  return output;
}

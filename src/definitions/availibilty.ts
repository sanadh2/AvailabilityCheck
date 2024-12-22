import { z } from "zod";
import { isSameDay, isBefore } from "date-fns";

export const availabilitySchema = z
  .object({
    participants: z
      .array(z.string())
      .nonempty("Select at least one participant"),
    startDate: z.date({
      required_error: "Start date is required",
      invalid_type_error: "Invalid start date",
    }),
    endDate: z.date({
      required_error: "End date is required",
      invalid_type_error: "Invalid end date",
    }),
  })
  .refine(
    (data) => {
      const { startDate, endDate } = data;
      return isBefore(startDate, endDate) && !isSameDay(endDate, startDate);
    },
    {
      message: "End date cannot be before start date or the same day",
      path: ["endDate"],
    }
  );

export type AvailabilityFormData = z.infer<typeof availabilitySchema>;

const timeSlotSchema = z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
const timeSlotsArraySchema = z.array(timeSlotSchema);

export const availabilityResponseSchema = z.record(
  z.string(),
  timeSlotsArraySchema
);

export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;

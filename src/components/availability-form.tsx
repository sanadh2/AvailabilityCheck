"use client";

import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MultiSelect } from "@/components/ui/multiple-selector";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  availabilitySchema,
  AvailabilityFormData,
  availabilityResponseSchema,
  AvailabilityResponse,
} from "@/definitions/availibilty";
import { format } from "date-fns";
import { useState } from "react";
import AvailabilityResults from "./availability-results";
interface Props {
  participantsList: { value: string; label: string }[];
}

export default function AvailabilityForm({ participantsList }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
  });
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null
  );

  const [availabilityKeys, setAvailabilityKeys] = useState<string[]>([]);

  const onSubmit = async (data: AvailabilityFormData) => {
    const { endDate, participants, startDate } = data;
    const startDateParsed = format(startDate, "dd/MM/yyyy");
    const endDateParsed = format(endDate, "dd/MM/yyyy");
    const participant_ids = participants.map((participant) =>
      parseInt(participant)
    );
    const response = await fetch("/api/redis", {
      body: JSON.stringify({
        participant_ids,
        date_range: { start: startDateParsed, end: endDateParsed },
      }),
      method: "POST",
    });
    const {
      success,
      data: res,
      error,
    } = availabilityResponseSchema.safeParse(await response.json());

    if (!success) {
      console.log("Error:", error);
      return;
    }

    setAvailability(res);
    setAvailabilityKeys(Object.keys(res));
  };

  return (
    <div className="">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid place-content-center gap-3"
      >
        <Controller
          name="participants"
          control={control}
          render={({ field }) => (
            <MultiSelect
              options={participantsList}
              onValueChange={field.onChange}
              defaultValue={field.value}
              placeholder="Select participants"
              variant="inverted"
              animation={0}
              maxCount={3}
            />
          )}
        />
        {errors.participants && (
          <p className="text-red-500 text-sm font-serif">
            {errors.participants.message}
          </p>
        )}
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>Start Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.startDate && (
          <p className="text-red-500 text-sm font-serif">
            {errors.startDate.message}
          </p>
        )}

        <Controller
          name="endDate"
          control={control}
          render={({ field }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? (
                    format(field.value, "PPP")
                  ) : (
                    <span>End Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        />
        {errors.endDate && (
          <p className="text-red-500 text-sm font-serif">
            {errors.endDate.message}
          </p>
        )}

        {errors.root && (
          <p className="text-red-500 text-sm font-serif">
            {errors.root.message}
          </p>
        )}
        <Button type="submit">Check Slots</Button>
      </form>
      {availability && availabilityKeys.length > 0 && (
        <AvailabilityResults
          availability={availability}
          availabilityKeys={availabilityKeys}
        />
      )}
    </div>
  );
}

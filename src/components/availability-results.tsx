import { AvailabilityResponse } from "@/definitions/availibilty";
import { AlarmCheckIcon } from "lucide-react";

interface Props {
  availability: AvailabilityResponse;
  availabilityKeys: string[];
}

export default function AvailabilityResults({
  availability,
  availabilityKeys,
}: Props) {
  return (
    <div className="mt-20 bg-green-300 max-w-[800px] place-self-center p-4 grid gap-10 rounded-2xl">
      {availabilityKeys.map((key) => (
        <div key={key} className="flex gap-4">
          <h6 className="font-bold p-3">{key}: </h6>
          <p className="gap-3 flex flex-wrap">
            {availability[key].map((participant: string) => (
              <span
                key={participant}
                className="whitespace-nowrap flex items-center gap-2 bg-purple-500 p-2 rounded-full text-white"
              >
                <AlarmCheckIcon /> {participant}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  );
}

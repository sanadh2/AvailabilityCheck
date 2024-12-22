import AvailabilityForm from "@/components/availability-form";
import { fetchFromCache, Participant } from "@/helper-functions/redis";
export default async function ParticipantAvailabilityPage() {
  const fetchedParticipants: { [id: number]: Participant } =
    await fetchFromCache("participants");
  const participantsList: { value: string; label: string }[] = [];
  for (let i = 0; i < Object.keys(fetchedParticipants).length; i++) {
    participantsList.push({
      value: Object.keys(fetchedParticipants)[i],
      label: Object.values(fetchedParticipants)[i].name,
    });
  }
  return (
    <div className="p-3 md:p-5 lg:p-10 grid">
      <h1 className="text-2xl font-bold text-center mb-10">
        Check Availibility
      </h1>
      <AvailabilityForm participantsList={participantsList} />
    </div>
  );
}

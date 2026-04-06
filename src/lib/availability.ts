type TimeSlot = {
  start: string;
  end: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  stepMinutes: number = 30
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  for (let current = start; current + durationMinutes <= end; current += stepMinutes) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + durationMinutes),
    });
  }

  return slots;
}
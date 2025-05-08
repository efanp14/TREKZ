import { Pin } from "@shared/schema";
import { format } from "date-fns";

interface TripTimelineProps {
  pins: Pin[];
}

const TripTimeline = ({ pins }: TripTimelineProps) => {
  const sortedPins = [...pins].sort((a, b) => a.order - b.order);

  return (
    <div className="relative pl-7">
      <div className="timeline-line"></div>
      
      {sortedPins.map((pin, index) => (
        <div key={pin.id} className="mb-3 last:mb-0">
          <div className="timeline-dot w-6 h-6 rounded-full border-2 border-primary-500 bg-white flex items-center justify-center mb-1">
            <span className="text-xs font-medium text-primary-500">{index + 1}</span>
          </div>
          <div className="text-sm font-medium text-neutral-800">{pin.title}</div>
          <div className="text-xs text-neutral-500">
            {format(new Date(pin.date), "MMMM d")} • {pin.activities?.join(", ")}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TripTimeline;

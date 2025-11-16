import Image from "next/image";
import { memo } from "react";

/* ------------------------- Types ------------------------- */
interface VehicleInfoProps {
  clientData: {
    booking?: {
      image_url?: string;
      vehicle_name?: string;
    };
  };
  navigateToBooking: () => void;
}

/**
 * VehicleInfo Component
 * ------------------------------------------------------------
 * Displays the selected vehicle image, name, and an edit button
 * allowing the user to navigate back to the booking step.
 */
const VehicleInfo = memo(function VehicleInfo({
  clientData,
  navigateToBooking,
}: VehicleInfoProps) {
  const booking = clientData?.booking || {};

  return (
    <article className="relative flex flex-col gap-4 px-3 py-4 sm:w-full rounded-box bg-base-300 shadow-md">
      {/* Vehicle Image */}
      <div className="flex justify-center">
        <Image
          src={booking?.image_url || "/images/vito.webp"}
          alt={booking?.vehicle_name || "Selected Vehicle"}
          width={300}
          height={200}
          className="rounded-lg object-cover md:w-96 lg:w-80"
          priority
        />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Selected Vehicle</h1>
        <button onClick={navigateToBooking} className="btn btn-primary">
          Edit
        </button>
      </header>

      <hr className="border-base-content/20" />

      {/* Vehicle Name */}
      <p className="text-md font-semibold">
        {booking?.vehicle_name || "—"}
      </p>
    </article>
  );
});

export default VehicleInfo;
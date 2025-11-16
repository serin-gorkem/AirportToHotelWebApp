"use client";
import { memo, useEffect, useState } from "react";
import { ReturnTripForm } from "./ReturnTripForm";

type Location = {
  name?: string;
  address?: string;
};

type ClientData = {
  pickup_location?: Location;
  drop_off_location?: Location;
  pickup_date?: string;
  pickup_hour?: string;
  passenger_count?: number;
  return_data?: {
    return_date?: string;
    return_hour?: string;
    return_count?: number;
    return_trip?: boolean;
  };
};

type TransferSummaryCardProps = {
  totalDistanceKM: string | undefined;
  drivingDuration: string;
  clientData: ClientData;
  updateClientData: (data: ClientData) => void;
};

const TransferSummaryCard = memo(function (props: TransferSummaryCardProps) {
  const [returnDate, setReturnDate] = useState(
    props.clientData?.return_data?.return_date ?? ""
  );
  const [returnHour, setReturnHour] = useState(
    props.clientData?.return_data?.return_hour ?? ""
  );
  const [returnPassengerCount, setReturnPassengerCount] = useState(
    props.clientData?.return_data?.return_count ?? 1
  );
  const [showReturnTrip, setShowReturnTrip] = useState(true);
  const [showDateSetError, setShowDateSetError] = useState(false);

  useEffect(() => {
    setShowReturnTrip(!!props.clientData?.return_data?.return_trip);
  }, [props.clientData]);

  function openReturnPanel() {
    const panel = document.getElementById("return-panel");
    if (!panel) return;
    document.body.classList.toggle("overflow-hidden");
    panel.classList.toggle("opacity-0");
    panel.classList.toggle("pointer-events-none");
  }

  function confirmReturn(e: any) {
    e.preventDefault();
    document.body.classList.remove("overflow-hidden");

    if (returnDate && returnHour && returnPassengerCount) {
      const updatedClientData = {
        ...props.clientData,
        return_data: {
          return_date: returnDate,
          return_hour: returnHour,
          return_count: returnPassengerCount,
          return_trip: true,
        },
      };
      props.updateClientData(updatedClientData);
      setShowReturnTrip(true);
      setShowDateSetError(false);
    } else {
      setShowDateSetError(true);
    }

    const panel = document.getElementById("return-panel");
    if (!panel) return;
    panel.classList.add("opacity-0", "pointer-events-none");
  }

  function cancelReturn() {
    setReturnDate("");
    setReturnHour("");
    setReturnPassengerCount(1);
    setShowReturnTrip(false);

    const updatedClientData = {
      ...props.clientData,
      return_data: {
        return_date: "",
        return_hour: "",
        return_count: 0,
        return_trip: false,
      },
    };
    props.updateClientData(updatedClientData);
  }

  return (
    <article className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-6 border border-gray-200">
      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900">Transfer Summary</h2>

      {/* --- OUTWARD JOURNEY --- */}
      <div className="rounded-xl bg-gray-50 p-5 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Outward Journey
        </h3>

        {/* Locations */}
        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-900">
              {props.clientData?.pickup_location?.name ?? ""}
            </p>
            <p className="text-gray-700">
              {props.clientData?.pickup_location?.address ?? ""}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              {props.clientData?.drop_off_location?.name ?? ""}
            </p>
            <p className="text-gray-700">
              {props.clientData?.drop_off_location?.address ?? ""}
            </p>
          </div>
        </div>

        {/* Date / Time / People */}
        <div className="mt-4 flex flex-col gap-3 text-sm text-gray-700">
          {/* Date */}
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span>{props.clientData?.pickup_date}</span>
          </div>

          {/* Time */}
          <div className="flex items-center gap-2">
            <ClockIcon />
            <span>{props.clientData?.pickup_hour}</span>
          </div>

          {/* People */}
          <div className="flex items-center gap-2">
            <PersonIcon />
            <span>{props.clientData?.passenger_count ?? 1} people</span>
          </div>
        </div>

        {/* Distance */}
        <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <RoadIcon />
            <span>{props.totalDistanceKM} km</span>
          </div>

          <div className="flex items-center gap-2">
            <TimerIcon />
            <span>{props.drivingDuration}</span>
          </div>
        </div>
      </div>

      {/* --- RETURN JOURNEY --- */}
      {showReturnTrip ? (
        <div className="rounded-xl bg-gray-50 p-5 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Return Journey
          </h3>
          <div className="flex flex-col gap-4 mb-4 text-sm">
            <div>
              <p className="font-semibold text-gray-900">
                {props.clientData?.drop_off_location?.name ?? ""}
              </p>
              <p className="text-gray-700">
                {props.clientData?.drop_off_location?.address ?? ""}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {props.clientData?.pickup_location?.name ?? ""}
              </p>
              <p className="text-gray-700">
                {props.clientData?.pickup_location?.address ?? ""}
              </p>
            </div>
          </div>
          {/* Date */}
          <div className="flex flex-col gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <CalendarIcon />
              <span>{returnDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <ClockIcon />
              <span>{returnHour}</span>
            </div>

            <div className="flex items-center gap-2">
              <PersonIcon />
              <span>{returnPassengerCount} people</span>
            </div>
          </div>

          {/* Distance */}
          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <RoadIcon />
              <span>{props.totalDistanceKM} km</span>
            </div>

            <div className="flex items-center gap-2">
              <TimerIcon />
              <span>{props.drivingDuration}</span>
            </div>
          </div>

          <button
            onClick={cancelReturn}
            className="btn btn-outline btn-primary mt-4 w-fit"
          >
            Cancel Return
          </button>
        </div>
      ) : (
        <button onClick={openReturnPanel} className="btn btn-primary w-fit">
          Add a Return
        </button>
      )}

      {/* Return Trip Panel */}
      <ReturnTripForm
        returnDate={returnDate}
        pickupDate={props.clientData?.pickup_date ?? ""}
        pickupHour={props.clientData?.pickup_hour ?? ""}
        handleReturnTrip={openReturnPanel}
        returnHour={returnHour}
        handleDaySelect={(d) => setReturnDate(d?.toString().slice(0, 15) ?? "")}
        returnPassengerCount={returnPassengerCount}
        handlePersonCount={(e) =>
          setReturnPassengerCount(Number(e.target.value))
        }
        handleTimeChange={(e) => setReturnHour(e.target.value)}
        confirmReturn={confirmReturn}
        showDateSetError={showDateSetError}
      />
    </article>
  );
});

/* --- Icons --- */
function CalendarIcon() {
  return (
    <svg
      className="size-5 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 6.75h15A1.5 1.5 0 0121 8.25v11.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.75v-11.5a1.5 1.5 0 011.5-1.5z"
      />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg
      className="size-5 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      className="size-5 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function RoadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className="size-6 "
    >
      <path
        fill="currentColor"
        d="M92.6 21c-32 0-64.04 24-64.04 72L92.6 221l64-128c0-48-32-72-64-72m282.3 39c-6.9.29-13.6 1.6-19.2 2.8l3.8 17.6c5.6-1.25 11.4-2.04 16.3-2.4zM92.6 61c17.7 0 32 14.33 32 32c0 17.7-14.3 32-32 32c-17.67 0-32-14.3-32-32c0-17.67 14.33-32 32-32m302.2.2l-3 17.7c4.9 1.03 9.8 2.32 14.1 4.9l8.7-15.8c-6.1-3.25-12.9-6.17-19.8-6.8m-57.5 6.7c-6.1 2.38-12.2 4.51-17.4 6.6L327 91c5.5-2.34 11.3-4.38 16.2-6.1zM431 81.3L417.3 93c3.6 4.12 6.4 9.2 8.6 13.3l16.1-8.1c-3.4-6.55-6.4-11.51-11-16.9m-127.8.9c-6.1 3.11-11.1 5.88-16.5 8.6l8.8 15.8c5.2-3 10.9-5.9 15.5-8.2zm-32.3 17.9c-5.3 3.1-10.5 6.2-15.6 9.6l9.8 15c4.9-3.2 10-6.2 15-9.2zM448.2 118c-5.9 1-11.9 1.7-17.8 2.4c.4 5 .1 10.4-.9 14.6l17.5 4.1c1-7.2 1.9-14.6 1.2-21.1m-208.1 1.7c-5 3.4-9.9 6.9-14.9 10.3l10.4 14.7c4.8-3.5 9.7-6.8 14.6-10.2zm-29.6 21.1c-5 3.6-10.2 7.6-14.5 10.9l10.9 14.3c5.5-4 9.3-7 14.3-10.7zm213 8c-3 4.6-6.5 9.2-10 12.7l13.1 12.5c4.3-5.1 8.9-10.3 12.1-15.5zm-241.8 14.1c-4.9 3.8-9.8 7.7-14.1 11.3l11.4 13.9c4.7-3.9 9.5-7.9 13.9-11.1zM401.1 173c-4.6 3.7-9.4 7.3-13.8 10.3l10.3 14.8c5.3-3.6 10.5-7.5 15-11.1zm-247.4 12.9c-4.7 3.8-9.2 7.8-13.8 11.7l11.7 13.7c4.5-3.9 9-7.8 13.6-11.6zm218.9 7c-5.1 3-10.4 6.1-15.2 8.7l8.6 15.9c5.4-3.3 11.5-6.2 16-9.2zm-246.4 16.6c-4.5 4-8.9 8-13.4 12.1l12.1 13.4c4.4-4 8.9-8 13.3-12zm215.5.4c-5.3 2.6-10.6 5.3-15.9 7.9l7.7 16.2c6.2-3 10.8-5.5 16.4-8.1zm-32 15.4c-5.5 2.5-10.8 4.9-16.4 7.2l7.3 16.5c5.5-2.4 11-4.9 16.5-7.4zM99.6 234c-5.1 4.5-8.65 8-13.3 12.5l12.7 13c4.7-4.5 8.5-8.4 12.9-12.2zm177.3 5.8c-5.5 2.3-11 4.7-16.5 7l7 16.7c5.6-2.3 11.1-4.7 16.6-7.1zm-33.1 14c-5.5 2.4-11 4.8-16.6 7l7 16.7c5.5-2.3 11.1-4.7 16.6-7zm184.8 7.2c-32 0-64 24-64 72l64 128l64-128c0-48-32-72-64-72m-218 6.8c-5.7 2.6-11.7 5-16.6 7.1l7.1 16.6c5.9-2.5 11.5-4.9 16.5-7.1zM177.4 282c-5.4 2.5-11.7 5.3-16.5 7.5l7.4 16.4c5.9-2.6 11.1-5.2 16.3-7.4zm-33 15c-5.6 2.7-11.4 5.5-16.4 8l8.1 16.1c5.4-2.8 11-5.4 15.9-7.8zm284.2 4c17.7 0 32 14.3 32 32s-14.3 32-32 32s-32-14.3-32-32s14.3-32 32-32m-316.8 12.3c-5.3 2.9-10.6 5.9-16 9l9 15.6c5.1-3 10.3-5.8 15.5-8.6zM80.1 332c-5.61 3.2-11.03 7.5-15.7 10.6L75.3 357c4.97-3.6 10.32-7.3 14.6-9.9zm-29.9 22.6c-4.8 4.4-9.53 9.5-13.2 13.8l13.7 11.7c3.85-4.7 7.2-8.2 11.7-12.2zm217.8 1.3l1.6 17.9c5.2-.9 10.4-.3 15.6.5l3.1-17.7c-6.6-1-13.6-1.7-20.3-.7m-37.2 10l6.8 16.7c5.2-2.3 10.6-4.1 16.1-5.8c-1.9-5.7-3.3-11.5-4.8-17.3c-6.3 1.8-12.6 4.2-18.1 6.4m77.5-.9l-10.2 14.8c4.2 3.1 8.3 6.4 11.6 10.5l13.6-11.8c-5.1-5.2-9-10.1-15-13.5m-94.5 9c-5.5 2.8-10.8 6-16.1 9.1l9.1 15.5c5.2-2.8 10.3-6.1 15.4-8.8zM26.01 385c-3.02 6.5-5.47 13.5-6.61 19.7l17.7 3.1c1.08-5.7 2.63-9.8 4.9-14.7c-5.49-2.4-10.73-5.3-15.99-8.1m156.09 7.8c-5.1 3.3-10.1 6.6-15.1 10l10 15c5-3.3 9.9-6.7 14.9-10zm152.7 1.2l-15.1 9.8c3.2 4.8 6.3 9.8 9.2 14.9l15.6-9c-3.5-5.6-6-10.6-9.7-15.7m-182.7 19c-5 3.3-10 6.5-14.9 10l10 15c4.8-3.5 9.9-6.8 15-10.2zm-114.8 9.5c-5.79 1.2-11.63 2.2-17.45 3.3c1.05 7 3.86 13.8 6.4 19.2l16.25-7.8c-2.17-5-4.23-10.2-5.2-14.7m316.1 2.8l-15.6 9c3.1 5.4 6.7 11.2 9.6 15.8l15.1-9.7c-3.4-5.3-6.3-10.3-9.1-15.1m-231 7.5c-5 3.1-9.9 6.1-15.1 9l8.9 15.7c5.3-3.1 10.6-6.2 15.7-9.5zm-71.3 16.3l-12.3 13.2c5.56 5.3 12.42 8.8 19.9 10.4l4-17.5c-4.44-.9-8.59-3.1-11.6-6.1m41 .3c-5.01 2.3-10.21 4.1-15.6 5.2l4.1 17.6c6.42-1.3 12.46-3.7 18.5-6.2zm280.3 4.8l-13.9 11.3c4.3 5.3 9.6 10.4 14.2 14l11.1-14.2c-4.4-3.4-8.2-7.5-11.4-11.1m24.1 17.5l-4.5 17.5c7.9 1.6 13.8 2.1 21.2 1.3l-2.2-17.9c-4.9.8-9.7.3-14.5-.9"
      ></path>
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
    >
      <path
        fill="currentColor"
        d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,20a9,9,0,1,1,9-9A9,9,0,0,1,12,21Z"
      ></path>
      <rect width={2} height={7} x={11} y={6} fill="currentColor" rx={1}>
        <animateTransform
          attributeName="transform"
          dur="35.1s"
          repeatCount="indefinite"
          type="rotate"
          values="0 12 12;360 12 12"
        ></animateTransform>
      </rect>
      <rect width={2} height={9} x={11} y={11} fill="currentColor" rx={1}>
        <animateTransform
          attributeName="transform"
          dur="2.925s"
          repeatCount="indefinite"
          type="rotate"
          values="0 12 12;360 12 12"
        ></animateTransform>
      </rect>
    </svg>
  );
}

export default TransferSummaryCard;
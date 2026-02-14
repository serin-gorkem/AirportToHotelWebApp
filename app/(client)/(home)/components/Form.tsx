"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { v4 as uuidv4 } from "uuid";
import LoadGoogleMaps from "@/components/LoadGoogleMaps";
import { getDrivingDistance } from "./CalculateDistance";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const AutocompleteInput = dynamic(() => import("./AutocompleteInput"), {
  ssr: false,
  loading: () => (
    <p className="text-sm text-base-content/60">Loading location input...</p>
  ),
});

interface Location {
  lat: number;
  lng: number;
  address: string;
  name: string;
  placeId: string;
}

export default function Form() {
  const [clientData, setClientData] = useState({});
  const [pickupLocation, setPickupLocation] = useState<any>("");
  const [isPickupLocationValid, setIsPickupLocationValid] = useState(false);
  const [dropOffLocation, setDropOffLocation] = useState<any>("");
  const [dropOffInput, setDropOffInput] = useState("");
  const [isDropOffLocationValid, setIsDropOffLocationValid] = useState(false);
  const [passengerCount, setPassengerCount] = useState(1);
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [pickupHour, setPickupHour] = useState("00:00");
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [message, setMessage] = useState("");

  const MIN_PREP_HOURS = 2;
  useEffect(() => {
    if (!pickupDate) return;
    setPickupHour("");
  }, [pickupDate]);
  const uuid = uuidv4();
  const router = useRouter();

  const airports = [
    { id: "IST", name: "Istanbul Airport", query: "Istanbul Airport, Turkey" },
    {
      id: "SAW",
      name: "Sabiha Gökçen International Airport",
      query: "Sabiha Gökçen International Airport, Turkey",
    },
    {
      id: "ADB",
      name: "Izmir Adnan Menderes Airport",
      query: "Izmir Adnan Menderes Airport, Turkey",
    },
    {
      id: "BJV",
      name: "Milas–Bodrum Airport",
      query: "Milas–Bodrum Airport, Turkey",
    },
    { id: "DLM", name: "Dalaman Airport", query: "Dalaman Airport, Turkey" },
    { id: "AYT", name: "Antalya Airport", query: "Antalya Airport, Turkey" },
    {
      id: "ASR",
      name: "Kayseri Erkilet Airport",
      query: "Kayseri Erkilet Airport, Turkey",
    },
    {
      id: "NAV",
      name: "Nevşehir Kapadokya Airport",
      query: "Nevşehir Kapadokya Airport, Turkey",
    },
    {
      id: "ESB",
      name: "Esenboğa International Airport",
      query: "Esenboğa International Airport, Ankara, Turkey",
    },
    {
      id: "DNZ",
      name: "Denizli Çardak Airport",
      query: "Denizli Çardak Airport, Turkey",
    },
    {
      id: "GAP",
      name: "Şanlıurfa GAP Airport",
      query: "Şanlıurfa GAP Airport, Turkey",
    },
    { id: "TZX", name: "Trabzon Airport", query: "Trabzon Airport, Turkey" },
  ];

  const airportRadiusKm: Record<string, number> = {
    "Istanbul International Airport": 70,
    "Istanbul Sabiha Gökçen International Airport": 70,
    "Izmir Adnan Menderes Airport": 180,
    "Milas–Bodrum Airport": 70,
    "Muğla Dalaman Airport": 70,
    "Antalya International Airport": 100,
    "Kayseri Erkilet Airport": 150,
    "Nevşehir Kapadokya Airport": 70,
    "Ankara Esenboğa International Airport": 70,
    "Denizli Çardak Airport": 100,
    "Şanlıurfa GAP Airport": 50,
    "Trabzon Airport": 50,
  };
  // ✅ TIME VALIDATION
  const handleTimeChange = (value: string) => {
    if (!pickupDate) {
      setMessage("Please select a pickup date first.");
      return;
    }

    const now = new Date();
    const selectedDate = new Date(pickupDate);
    const [h, m] = value.split(":").map(Number);

    const selectedFull = new Date(
      pickupDate.getFullYear(),
      pickupDate.getMonth(),
      pickupDate.getDate(),
      h,
      m,
      0,
      0
    );
    selectedFull.setHours(h, m, 0, 0);

    const isToday = selectedDate.toDateString() === now.toDateString();

    if (isToday) {
      // ✅ minimum hazırlık süresi: şu an + MIN_PREP_HOURS
      const earliestAllowed = new Date(
        now.getTime() + MIN_PREP_HOURS * 60 * 60 * 1000
      );

      if (selectedFull < earliestAllowed) {
        setMessage(`Minimum booking time is ${MIN_PREP_HOURS} hours from now.`);
        setPickupHour("");
        return;
      }
    }

    // ✅ Geçerli saat
    setMessage("");
    setPickupHour(value);
  };
  function validateForm() {
    if (
      !pickupLocation ||
      !dropOffLocation ||
      !pickupDate ||
      !pickupHour ||
      !passengerCount
    ) {
      setMessage("Please fill in all fields.");
      return false;
    }
    if (!isPickupLocationValid) {
      setMessage("Please select a valid pickup location.");
      return false;
    }
    if (!isDropOffLocationValid) {
      setMessage("Please select a valid drop-off location.");
      return false;
    }
    if (pickupLocation === "" || dropOffLocation === "") {
      setMessage("Please fill in location fields.");
      return false;
    }
    if (pickupLocation === dropOffLocation) {
      setMessage("Pickup and drop-off locations cannot be the same.");
      return false;
    }
    return true;
  }

  async function getFreshPlaceId(query: string): Promise<string | null> {
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );
      service.findPlaceFromQuery(
        { query, fields: ["place_id"] },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results?.length
          ) {
            resolve(results[0].place_id!);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async function fetchPlaceDetails(
    placeId: string,
    query: string
  ): Promise<Location | null> {
    return new Promise((resolve) => {
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );
      service.getDetails(
        { placeId, fields: ["geometry", "formatted_address", "name"] },
        async (place, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            place?.geometry?.location
          ) {
            resolve({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address || "",
              name: place.name || "",
              placeId,
            });
          } else if (
            status === google.maps.places.PlacesServiceStatus.INVALID_REQUEST
          ) {
            const newPlaceId = await getFreshPlaceId(query);
            if (newPlaceId) {
              const refreshed = await fetchPlaceDetails(newPlaceId, query);
              resolve(refreshed);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async function cleanupData() {
    await fetch("/api/cleanup");
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      pickup_location: pickupLocation,
      drop_off_location: dropOffLocation,
      pickup_date: pickupDate?.toDateString(),
      pickup_hour: pickupHour,
      passenger_count: passengerCount,
      uuid,
    };

    setClientData(data);
    setMessage("Form submitted successfully!");

    const response = await fetch("api/form-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json());

    if (response.status === 200) {
      router.push(`/booking?uuid=${uuid}`);
    }
    cleanupData();
  }

  const handlePickupChange = async (selectedId: string) => {
    const sel = airports.find((a) => a.id === selectedId);
    if (!sel) {
      setPickupLocation(null);
      setIsPickupLocationValid(false);
      return;
    }

    setDropOffLocation(null);
    setDropOffInput("");
    setIsDropOffLocationValid(false);

    const freshPlaceId = await getFreshPlaceId(sel.query);
    if (!freshPlaceId) {
      setMessage("Could not resolve Place ID for " + sel.name);
      setIsPickupLocationValid(false);
      return;
    }

    const info = await fetchPlaceDetails(freshPlaceId, sel.query);
    if (!info) {
      setMessage("Invalid airport selection.");
      setIsPickupLocationValid(false);
      return;
    }

    setPickupLocation({
      id: sel.id,
      name: sel.name,
      query: sel.query,
      placeId: freshPlaceId,
      lat: info.lat,
      lng: info.lng,
      address: info.address,
    });
    setIsPickupLocationValid(true);
    setMessage("");
  };

  return (
    <form
      className="bg-base-100 border border-base-300 rounded-2xl p-6 flex flex-col gap-5 shadow-lg transition-all duration-300 hover:shadow-xl"
      onSubmit={handleSubmit}
    >
      <LoadGoogleMaps />

      {message && (
        <p className="font-medium text-sm px-3 py-2 rounded-md bg-error/10 text-error border border-error/30 transition-all duration-300">
          {message}
        </p>
      )}

      {/* Pickup Location */}
      <fieldset className="fieldset">
        <label
          htmlFor="pickupAirport"
          className="font-semibold text-sm mb-1 text-base-content/80"
        >
          From (We only operate in Turkey)
        </label>
        <select
          id="pickupAirport"
          className="select select-bordered w-full bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
          value={pickupLocation?.id || ""}
          onChange={(e) => handlePickupChange(e.target.value)}
        >
          <option value="">Select airport</option>
          {airports.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.id}) 
            </option>
          ))}
        </select>
      </fieldset>

      {/* Drop Off Location */}
      <fieldset className="fieldset">
        <legend className="font-semibold text-sm mb-1 text-base-content/80">
          To (We only operate in Turkey)
        </legend>
        <label
          htmlFor="drop_off_location"
          className="input input-bordered flex items-center gap-2 bg-base-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 text-primary/70"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <AutocompleteInput
            value={dropOffInput}
            onChange={(val) => {
              setDropOffInput(val);
              setIsDropOffLocationValid(false);
            }}
            onPlaceSelected={async (place) => {
              if (!pickupLocation) {
                setMessage("Please select a pickup location first.");
                setDropOffLocation(null);
                setIsDropOffLocationValid(false);
                setDropOffInput("");
                return;
              }

              const result = await getDrivingDistance(
                { lat: pickupLocation.lat, lng: pickupLocation.lng },
                { lat: place.lat, lng: place.lng }
              );

              const maxRadius = airportRadiusKm[pickupLocation.name] || 50;
              if (!result) {
                setMessage("Could not calculate driving distance. Try again.");
                setDropOffLocation(null);
                setIsDropOffLocationValid(false);
                setDropOffInput("");
                return;
              }

              if (result.distanceKm > maxRadius) {
                setMessage(
                  `Selected drop-off (${
                    place.name
                  }) is ${result.distanceKm.toFixed(
                    1
                  )} km away. Max allowed: ${maxRadius} km from ${
                    pickupLocation.name
                  }.`
                );
                setDropOffLocation(null);
                setIsDropOffLocationValid(false);
                setDropOffInput("");
              } else {
                setDropOffLocation(place);
                setIsDropOffLocationValid(true);
                setDropOffInput(place.name ?? "");
                setMessage("");
              }
            }}
            placeholder="Select a hotel"
            locationType="lodging"
            bounds={
              pickupLocation
                ? new google.maps.Circle({
                    center: new google.maps.LatLng(
                      pickupLocation.lat,
                      pickupLocation.lng
                    ),
                    radius: (airportRadiusKm[pickupLocation.name] || 50) * 1000,
                  }).getBounds() || undefined
                : undefined
            }
          />
        </label>
      </fieldset>

      {/* Pickup Date & Time */}
      <fieldset className="fieldset gap-0 rounded-xl">
        <legend className="font-semibold text-sm mb-1 text-base-content/80">
          Pickup Date and Time
        </legend>
        <div
          className="collapse-title text-sm font-semibold bg-base-200 mb-0 rounded-t-xl cursor-pointer px-4 hover:bg-base-300 transition-all"
          onClick={() => setIsPickupOpen((prev) => !prev)}
        >
          {pickupDate
            ? `📅 ${pickupDate.toDateString()} — ⏰ ${pickupHour}`
            : "Select pickup date & time"}
        </div>

        <AnimatePresence>
          {isPickupOpen && (
            <motion.div
              className="bg-base-100 rounded-b-xl py-2 overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <DayPicker
                mode="single"
                required
                disabled={{ before: new Date() }}
                selected={pickupDate}
                onSelect={setPickupDate}
                className="bg-base-200 rounded-b-lg p-3 mb-4 w-full flex flex-col items-center"
                footer={
                  pickupDate
                    ? `Pickup Date: ${pickupDate.toString().slice(0, 15)}`
                    : ""
                }
              />
              {/* Desktop Quick Time Picker */}
              <div className="hidden md:block w-full mb-3">
                <p className="text-xs font-medium text-base-content/70 mb-2">
                  Quick Time Selection
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {[
                    "00:00",
                    "01:00",
                    "02:00",
                    "03:00",
                    "04:00",
                    "05:00",
                    "06:00",
                    "07:00",
                    "08:00",
                    "09:00",
                    "10:00",
                    "11:00",
                    "12:00",
                    "13:00",
                    "14:00",
                    "15:00",
                    "16:00",
                    "17:00",
                    "18:00",
                    "19:00",
                    "20:00",
                    "21:00",
                    "22:00",
                    "23:00",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleTimeChange(t)}
                      className={`
          py-2 rounded-lg border text-sm transition-all
          ${
            pickupHour === t
              ? "bg-primary text-primary-content border-primary"
              : "bg-base-200 border-base-300 hover:bg-base-300"
          }
        `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="time"
                name="pickupHour"
                required
                className="input focus:outline-none focus:ring-0 focus:border-primary w-full text-primary"
                value={pickupHour}
                min={
                  pickupDate &&
                  pickupDate.toDateString() === new Date().toDateString()
                    ? new Date(Date.now() + MIN_PREP_HOURS * 3600000)
                        .toTimeString()
                        .slice(0, 5) // → "HH:MM"
                    : undefined
                }
                onChange={(e) => handleTimeChange(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>

      {/* Passenger Count */}
      <fieldset className="fieldset flex flex-col gap-2">
        <legend className="font-semibold text-sm text-base-content/80">
          Passenger Count (Max - 45)
        </legend>
        <input
          type="number"
          className="input input-bordered w-full text-center"
          placeholder="Passengers (1–45)"
          min="1"
          max="45"
          value={passengerCount}
          onChange={(e) => setPassengerCount(parseInt(e.target.value))}
        />
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary w-full mt-2 text-base-100 hover:bg-primary/80 transition-all duration-300"
      >
        Search
      </button>
    </form>
  );
}

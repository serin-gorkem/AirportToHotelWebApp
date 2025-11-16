"use client";

import React, { useEffect, useRef } from "react";

export interface LocationInfo {
  lat: number;
  lng: number;
  address: string;
  name?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelected: (location: LocationInfo) => void;
  placeholder?: string;
  locationType?: "airport" | "lodging";
  bounds?: google.maps.LatLngBounds;
}

export default function AutocompleteInput({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Bir yer yazın...",
  locationType,
  bounds,
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    const options: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: "tr" },
      fields: ["geometry", "formatted_address", "name"],
      bounds: bounds,
      strictBounds: !!bounds,
    };

    const autocomplete = new google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    if (locationType === "airport") {
      autocomplete.setTypes(["airport"]);
    } else if (locationType === "lodging") {
      autocomplete.setTypes(["lodging"]);
    }

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || "";
        const name = place.name || "";

        onChange(name);
        onPlaceSelected({ lat, lng, address, name });
      }
    });

    autocompleteRef.current = autocomplete;
  }, [locationType, bounds, onChange, onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      type="text"
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="text-base input input-bordered w-full focus:outline-none focus:ring-0 focus:border-primary"
    />
  );
}

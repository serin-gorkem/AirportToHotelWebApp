"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../context/CurrencyContext";

function useFinalPrice(clientData: any) {
  const { convertPrice } = useCurrency();
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!clientData) return;

    const calculate = async () => {
      const basePrice = clientData?.booking?.total_price ?? clientData?.price;
      if (!basePrice) return;

      const converted = await convertPrice(basePrice);
      setFinalPrice(Math.round(converted));
    };

    calculate();
  }, [clientData, convertPrice]);

  return finalPrice;
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { symbol } = useCurrency();

  const [sending, setSending] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cardMailSent, setCardMailSent] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const orderId = searchParams.get("order") || searchParams.get("uuid");

  /** Fetch booking from backend */
  useEffect(() => {
    if (!orderId) return;

    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/get-booking?uuid=${orderId}`);
        if (!res.ok) throw new Error("Booking not found");
        const data = await res.json();
        setClientData(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [orderId]);

  const finalPrice = useFinalPrice(clientData);

  /** Prevent entering this page after booking is accepted */
  useEffect(() => {
    if (clientData?.status === "accepted") {
      router.push("/");
    }
  }, [clientData, router]);

  /** Auto-mail for card payments */
  const handleConfirmCard = async () => {
    try {
      const mailRes = await fetch("/api/send-booking-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientData, price: finalPrice, symbol }),
      });

      console.log("Auto mail:", await mailRes.json());

      // prevent refresh resend by marking accepted
      await fetch("/api/update-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: clientData.uuid, status: "accepted" }),
      });
    } catch (err) {
      console.error("Auto mail error:", err);
    }
  };

  /** Auto-mail + countdown redirect */
  useEffect(() => {
    if (!clientData) return;
    if (finalPrice == null) return;
    if (cardMailSent) return;

    if (clientData.status === "paid") {
      handleConfirmCard();
      setCardMailSent(true);

      // countdown redirect
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            router.push("/");
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [clientData, finalPrice, cardMailSent, router]);

  /** Cash payment confirm */
  const handleConfirm = async () => {
    setSending(true);

    try {
      await fetch("/api/send-booking-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientData, price: finalPrice, symbol }),
      });

      await fetch("/api/update-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: clientData.uuid, status: "accepted" }),
      });
    } catch (err) {
      console.error("Confirm error:", err);
    }

    router.push("/");
  };

  /** Loading screen */
  if (loading || !clientData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  const isCard =
    clientData.status === "paid" || clientData.payment_method === "card";

  /** Build extras list */
  const extrasList =
    clientData?.extras &&
    Object.entries(clientData.extras)
      .filter(([_, v]) => v && v !== 0)
      .map(([key, value]) => {
        if (key === "airportAssistance") return "Airport Assistance";
        if (key === "flowers") return "Flowers";
        if (key === "wait") return "Waiting Service";
        if (key === "childSeat") return `Child Seat (${value})`;
        return key;
      })
      .join(", ");

  return (
    <div className="min-h-[70vh] my-24 lg:m-0 flex flex-col items-center justify-center bg-base-200 rounded-box shadow-md p-8 text-center animate-fade-in">
      <h1 className="text-2xl font-semibold mb-4">
        Payment {isCard ? "Confirmed" : "Pending"}
      </h1>

      <p className="text-gray-700 mb-4 whitespace-pre-line">
        {isCard
          ? `Your credit card payment has been confirmed.\nRedirecting in ${countdown} seconds...`
          : "You chose cash payment. Click “Confirm & Send Mail” to finalize your booking."}
      </p>

      {/* Booking details (ALL details preserved exactly) */}
      <div className="w-full max-w-md bg-base-100 rounded-box shadow p-6 mt-4 text-left">
        <h2 className="text-lg font-semibold mb-4">Booking Details</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Name:</strong> {clientData.details?.name}{" "}
            {clientData.details?.lastName}
          </li>
          <li>
            <strong>Email:</strong> {clientData.details?.email}
          </li>
          <li>
            <strong>Phone:</strong> {clientData.details?.phone}
          </li>
          {clientData.details?.flightNumber && (
            <li>
              <strong>Flight Number:</strong> {clientData.details.flightNumber}
            </li>
          )}
          {clientData.details?.message && (
            <li>
              <strong>Message:</strong> {clientData.details.message}
            </li>
          )}
          <li>
            <strong>Passengers:</strong> {clientData.passenger_count}
          </li>
          <li>
            <strong>Pickup:</strong> {clientData.pickup_location?.name}
          </li>
          <li>
            <strong>Drop Off:</strong> {clientData.drop_off_location?.name}
          </li>
          <li>
            <strong>Pickup Date:</strong> {clientData.pickup_date}
          </li>
          <li>
            <strong>Pickup Hour:</strong> {clientData.pickup_hour}
          </li>
          <li>
            <strong>Vehicle:</strong> {clientData.booking?.vehicle_name}
          </li>
          {extrasList && (
            <li>
              <strong>Extras:</strong> {extrasList}
            </li>
          )}
          {clientData.return_data?.return_trip && (
            <li>
              <strong>Return Trip:</strong>{" "}
              {clientData.return_data.return_date || "N/A"}{" "}
              {clientData.return_data.return_hour
                ? `at ${clientData.return_data.return_hour}`
                : ""}
              {clientData.return_data.return_count
                ? ` — Passengers: ${clientData.return_data.return_count}`
                : ""}
            </li>
          )}
          <li>
            <strong>Payment:</strong> {isCard ? "Credit Card" : "Cash"}
          </li>
          <li>
            <strong>Price:</strong> {finalPrice} {symbol}
          </li>
        </ul>
      </div>

      {!isCard && (
        <button
          onClick={handleConfirm}
          className="btn btn-primary mt-8"
          disabled={sending}
        >
          {sending ? "Sending..." : "Confirm & Send Mail"}
        </button>
      )}
    </div>
  );
}

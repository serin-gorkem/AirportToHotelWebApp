"use client";

import { useSearchParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useCurrency } from "../../../context/CurrencyContext";

/**
 * Converts the base booking price client-side based on the selected currency.
 * Uses convertPrice() from CurrencyContext.
 */
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

  const orderId = searchParams.get("order") || searchParams.get("uuid");

  // If user reopens success page after accepted mail was already sent
  if (clientData?.status === "accepted") {
    alert("You already reserved.");
    router.push("/");
  }

  /**
   * Fetches booking details from backend
   */
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

  const isReady = !loading && clientData;
  const isCard = clientData?.status === "paid" || clientData?.payment_method === "card";

  /**
   * Manual confirmation: Used ONLY for Cash Payments
   */
  const handleConfirm = async () => {
    setSending(true);

    try {
      // 1. Send confirmation email
      await fetch("/api/send-booking-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientData, price: finalPrice, symbol }),
      });

      // 2. Update booking status to accepted
      await fetch("/api/update-payment-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uuid: clientData.uuid, status: "accepted" }),
      });
    } catch (err) {
      console.error("Cash confirmation error:", err);
    }

    router.push("/");
  };

  /**
   * Auto-confirmation: Used ONLY for Completed Card Payments (status = paid)
   */
  const handleConfirmCard = async () => {
    try {
      await fetch("/api/send-booking-mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clientData, price: finalPrice, symbol }),
      });

      console.log("Auto confirmation email sent.");
    } catch (err) {
      console.error("Auto mail error:", err);
    }
  };

  /**
   * If payment is completed with credit card, send email automatically
   */
  useEffect(() => {
    if (!clientData || !finalPrice) return;

    if (clientData.status === "paid") {
      handleConfirmCard();
    }
  }, [clientData, finalPrice]);

  /**
   * Prepare extras list for display
   */
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

  /**
   * Loading screen
   */
  if (!isReady) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] my-24 lg:m-0 flex flex-col items-center justify-center bg-base-200 rounded-box shadow-md p-8 text-center animate-fade-in">
      <h1 className="text-2xl font-semibold mb-4">
        Payment {isCard ? "Confirmed" : "Pending"}
      </h1>

      <p className="text-gray-700 mb-4 whitespace-pre-line">
        {isCard
          ? "Your credit card payment has been confirmed. Thank you for your trust."
          : "You chose cash payment. Please pay the driver or at the counter.\nClick “Confirm & Send Mail” below to finalize your booking."}
      </p>

      {/* Booking Details */}
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

      {/* Action Button */}
      {isCard ? (
        <button
          onClick={() => router.push("/")}
          className="btn btn-primary mt-8"
          disabled={sending}
        >
          Homepage
        </button>
      ) : (
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
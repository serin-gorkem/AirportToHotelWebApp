"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetData } from "@/app/(client)/components/GetData";
import { useCurrency } from "@/app/(client)/context/CurrencyContext";


const onlyDigits = (s: string) => s.replace(/\D/g, "");

export default function Payment() {
  const router = useRouter();
  const { clientData } = useGetData();
  const [selectedMethod, setSelectedMethod] = useState<
    "card" | "cash" | null
  >(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [cardData, setCardData] = useState({
    number: "",
    month: "",
    year: "",
    cvv: "",
  });
  const { symbol } = useCurrency();


  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 13 }, (_, i) => String(y + i).slice(-2));
  }, []);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    []
  );

  const formatCardNumber = (value: string) => {
    const digits = onlyDigits(value).slice(0, 19);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const validateCardInputs = () => {
    const digits = onlyDigits(cardData.number);
    return !(
      digits.length < 12 ||
      digits.length > 19 ||
      !cardData.month ||
      !cardData.year ||
      cardData.cvv.length < 3
    );
  };

  const navigateToFailed = (data: any) =>
    router.push(`/failed?data=${encodeURIComponent(JSON.stringify(data))}`);

const handlePayment = async () => {
  setMessage(null);
  if (!selectedMethod || !termsAccepted) {
    setMessage({
      type: "error",
      text: "Please select a payment method and accept terms.",
    });
    return;
  }

  if (!validateCardInputs() && selectedMethod === "card") {
    setMessage({ type: "error", text: "Please fill card fields correctly." });
    return;
  }

  try {
    const payload = {
      uuid: clientData.uuid,
      payment_method: selectedMethod,
      symbol: symbol,
      email: clientData.details.email,
      number: clientData.details.phone,
      cardData: {
        number: onlyDigits(cardData.number),
        month: cardData.month,
        year: cardData.year,
        cvv: cardData.cvv,
      },
    };

    const res = await fetch("/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Payment request failed");
      console.error("Payment route error:", errText);
      navigateToFailed(clientData);
      return;
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // ✅ Cash veya JSON dönen durum
      const json = await res.json();
      if (json.redirect) {
        router.push(json.redirect);
      } else {
        router.push(`/success?order=${clientData.uuid}&status=${selectedMethod}`);
      }
      return;
    }

    if (contentType.includes("text/html")) {
      // ✅ Kart ödemesi (Garanti 3D)
      const html = await res.text();
      document.open();
      document.write(html);
      document.close();

      setTimeout(() => {
        try {
          const form = document.forms?.[0];
          if (form) form.submit();
        } catch (e) {
          console.error("Auto-submit failed:", e);
        }
      }, 1000);
      return;
    }

    // 👇 Beklenmedik yanıt tipi
    console.warn("Unexpected response:", contentType);
    navigateToFailed(clientData);

  } catch (err) {
    console.error("Payment error:", err);
    navigateToFailed(clientData);
  }
};


  return (
    <div className="bg-base-300 border border-base-300 sm:w-full rounded-2xl shadow-lg flex flex-col gap-5 px-4 py-6 transition-all duration-300 hover:shadow-xl">
      <h1 className="text-lg font-semibold text-base-content">
        Payment Method
      </h1>

      {/* card */}
      <div
        onClick={() => setSelectedMethod("card")}
        className={`cursor-pointer flex justify-between items-center h-20 p-4 rounded-xl border transition-all duration-300 ${
          selectedMethod === "card"
            ? "bg-primary/10 border-primary text-primary"
            : "border-base-300 hover:bg-base-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <span className="font-medium">Credit / Debit Card</span>
        </div>
        {selectedMethod === "card" && <span className="text-xl">✅</span>}
      </div>

      {/* CASH */}
      <div
        onClick={() => setSelectedMethod("cash")}
        className={`cursor-pointer flex justify-between items-center h-20 p-4 rounded-xl border transition-all duration-300 ${
          selectedMethod === "cash"
            ? "bg-primary/10 border-primary text-primary"
            : "border-base-300 hover:bg-base-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💵</span>
          <span className="font-medium">Cash on Arrival</span>
        </div>
        {selectedMethod === "cash" && <span className="text-xl">✅</span>}
      </div>

      {/* Card inputs */}
      {selectedMethod === "card" && (
        <div className="mt-3 bg-base-200 p-4 rounded-xl border border-base-300">
          <label className="block text-sm font-semibold mb-1">
            Card Number
          </label>
          <input
            inputMode="numeric"
            autoComplete="cc-number"
            value={cardData.number}
            onChange={(e) =>
              setCardData((s) => ({
                ...s,
                number: formatCardNumber(e.target.value),
              }))
            }
            placeholder="1234 5678 9012 3456"
            className="input input-bordered w-full mb-3"
          />

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[100px]">
              <label className="block text-sm font-semibold mb-1">
                Expiry Month
              </label>
              <select
                value={cardData.month}
                onChange={(e) =>
                  setCardData((s) => ({ ...s, month: e.target.value }))
                }
                className="select select-bordered w-full focus:outline-none "
              >
                <option value="">MM</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[100px]">
              <label className="block text-sm font-semibold mb-1">
                Expiry Year
              </label>
              <select
                value={cardData.year}
                onChange={(e) =>
                  setCardData((s) => ({ ...s, year: e.target.value }))
                }
                className="select select-bordered w-full focus:outline-none"
              >
                <option value="">YY</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-[0.7] min-w-[90px]">
              <label className="block text-sm font-semibold mb-1">CVV</label>
              <input
                inputMode="numeric"
                value={cardData.cvv}
                onChange={(e) =>
                  setCardData((s) => ({
                    ...s,
                    cvv: onlyDigits(e.target.value).slice(0, 4),
                  }))
                }
                placeholder="CVV"
                maxLength={4}
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* TERMS */}
      <label className="flex items-start gap-2 mt-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="checkbox checkbox-primary mt-1"
        />
        <div className="text-sm leading-tight">
          I have read and agree to the <strong>Service Delivery</strong>,{" "}
          <strong>Pre-Information Form</strong>,{" "}
          <strong>Cancellation & Refund Policy</strong> and{" "}
          <strong>Distance Sales Agreement</strong>.
          <br />
          <a
            href="/policy"
            target="_blank"
            rel="noreferrer"
            className="text-xs underline text-primary"
          >
            View Terms & Policies
          </a>
        </div>
      </label>

      <button
        className="btn btn-primary w-full mt-3"
        disabled={!selectedMethod || !termsAccepted}
        onClick={handlePayment}
      >
        Confirm & Continue
      </button>

      {message && (
        <div
          className={`mt-3 text-center rounded-lg py-2 text-sm font-medium transition-all duration-300 ${
            message.type === "error"
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
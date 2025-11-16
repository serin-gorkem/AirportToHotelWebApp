import { NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "../../lib/db";
import { Converter } from "easy-currencies";

const converter = new Converter();

// --- Utils ---
const sha1HexUpper = (s: string) =>
  crypto
    .createHash("sha1")
    .update(Buffer.from(s, "utf8"))
    .digest("hex")
    .toUpperCase();

const sha512HexUpper = (s: string) =>
  crypto
    .createHash("sha512")
    .update(Buffer.from(s, "utf8"))
    .digest("hex")
    .toUpperCase();

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const pad2 = (v: string | number) => String(v).padStart(2, "0");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uuid, payment_method, symbol, cardData } = body || {};

    if (!payment_method)
      return new NextResponse("Missing payment_method", { status: 400 });

    if (!uuid) return new NextResponse("Missing uuid", { status: 400 });

    // --- Booking kontrolü ---
    const result = await query("SELECT price FROM bookings WHERE uuid = $1", [
      uuid,
    ]);
    if (!result.rows.length)
      return new NextResponse("Booking not found", { status: 404 });

    const dbPrice = result.rows[0].price;
    const usdPrice = Number(dbPrice);

    console.log("✅ Booking found:", { uuid, dbPrice });

    // --- Currency mapping ---
    const symbolToName: Record<string, string> = {
      $: "USD",
      "€": "EUR",
      "£": "GBP",
      "₺": "TRY",
    };

    const currencyCodeMap: Record<string, string> = {
      USD: "840",
      EUR: "978",
      GBP: "826",
      TRY: "949",
    };

    const symbolStr = String(symbol || "$");
    const targetCurrency = symbolToName[symbolStr] || "USD";

    // --- Price conversion (USD → Target) ---
    let finalPrice = usdPrice;
    try {
      finalPrice = await converter.convert(usdPrice, "USD", targetCurrency);
    } catch (err) {
      console.error("❌ Currency conversion failed:", err);
    }

    // Garanti kuruş formatı
    const amountKurus = Math.round(finalPrice * 100).toString();

    // Garanti currency code
    const currency = currencyCodeMap[targetCurrency];

    // --- payment_method güncelle ---
    await query("UPDATE bookings SET payment_method = $1 WHERE uuid = $2", [
      payment_method,
      uuid,
    ]);

    // --- CASH ---
    if (payment_method === "cash") {
      await query(
        "UPDATE bookings SET status = $1, paid_at = NOW() WHERE uuid = $2",
        ["pending", uuid]
      );

      return NextResponse.json({
        success: true,
        redirect: `${
          process.env.NEXT_PUBLIC_BASE_URL || "https://www.airporttohotels.com"
        }/success?order=${uuid}&status=cash`,
      });
    }

    // --- CREDIT CARD VALIDATION ---
    if (
      !cardData?.number ||
      !cardData?.month ||
      !cardData?.year ||
      !cardData?.cvv
    ) {
      return new NextResponse("Missing cardData", { status: 400 });
    }

    // --- ENV CONFIG ---
    const terminalId = process.env.GARANTI_TERMINAL_ID!;
    const merchantId = process.env.GARANTI_MERCHANT_ID!;
    const provUser = process.env.GARANTI_PROV_USER!;
    const provPass = process.env.GARANTI_PROV_PASS!;
    const storeKey = process.env.GARANTI_STORE_KEY!;
    const GARANTI_MODE = process.env.GARANTI_MODE || "TEST";
    const SUCCESS_URL = process.env.GARANTI_SUCCESS_URL!;
    const ERROR_URL = process.env.GARANTI_ERROR_URL!;

    // --- Transaction ---
    const orderId = uuid;
    const txntype = "sales";
    const installment = "";

    // --- HASH ---
    const hashedPassword = sha1HexUpper(provPass + "0" + terminalId);

    const plain =
      terminalId +
      orderId +
      amountKurus +
      currency +
      SUCCESS_URL +
      ERROR_URL +
      txntype +
      installment +
      storeKey +
      hashedPassword;

    const secure3dhash = sha512HexUpper(plain);

    const endpoint =
      GARANTI_MODE === "PROD"
        ? "https://sanalposprov.garanti.com.tr/servlet/gt3dengine"
        : "https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine";

    const clientIPRaw = req.headers.get("x-forwarded-for")?.split(",")[0] || "";
    const clientIP =
      clientIPRaw.match(/\b\d{1,3}(\.\d{1,3}){3}\b/)?.[0] || "176.41.63.106";

    // --- FORM FIELDS ---
    const formFields: Record<string, string> = {
      mode: GARANTI_MODE,
      apiversion: "512",
      secure3dsecuritylevel: "3D_PAY",
      terminalprovuserid: provUser,
      terminaluserid: provUser,
      terminalmerchantid: merchantId,
      terminalid: terminalId,
      orderid: orderId,
      successurl: SUCCESS_URL,
      errorurl: ERROR_URL,
      storetype: "3d_pay",
      secure3dhash,

      txnamount: amountKurus,
      txncurrencycode: currency,
      txntype,
      txninstallmentcount: installment,

      lang: "tr",
      cardnumber: cardData.number.replace(/\D/g, ""),
      cardexpiredatemonth: pad2(cardData.month),
      cardexpiredateyear: pad2(cardData.year).slice(-2),
      cardcvv2: String(cardData.cvv),

      customeremailaddress: body.email || "noreply@airporttohotels.com",
      customerphonenumber:
        body.number?.replace(/\D/g, "")?.slice(-10) || "0000000000",
      customeripaddress: clientIP,
    };

    // --- HTML REDIRECT ---
    const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Redirecting...</title></head>
<body onload="document.forms[0].submit();">
<form method="post" action="${endpoint}" enctype="application/x-www-form-urlencoded">
${Object.entries(formFields)
  .map(
    ([k, v]) => `<input type="hidden" name="${k}" value="${escapeHtml(v)}" />`
  )
  .join("\n")}
<noscript><button type="submit">Continue</button></noscript>
</form>
<script>setTimeout(()=>{try{document.forms[0].submit()}catch(e){}},1200)</script>
</body></html>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (err: any) {
    console.error("❌ Error in /api/payment:", err.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
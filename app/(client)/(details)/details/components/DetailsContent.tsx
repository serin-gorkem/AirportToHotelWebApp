"use client";

import { lazy, memo, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import { useGetData } from "../../../components/GetData";
import { UpdateData } from "../../../components/UpdateData";
import SessionExpiredFallback from "@/app/(client)/components/SessionExpiredFallback";
import FallbackLoader from "@/app/(client)/components/FallbackLoader";

/* Lazy-loaded components for better initial load performance */
const Steps = lazy(() => import("../../../components/Steps"));
const PageIndicator = lazy(() => import("../../../components/PageIndicator"));
const SummaryCard = lazy(() => import("../../../components/SummaryCard"));

/* ------------------------- Types ------------------------- */
type FormData = {
  name: string;
  lastName: string;
  phone: string;
  flightNumber?: string;
  email: string;
  message?: string;
};

/* ------------------------- Validation ------------------------- */
function validateForm(data: FormData) {
  const errors: Partial<Record<keyof FormData, string>> = {};

  const nameRegex = /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]{2,}$/;
  const phoneRegex = /^(\+?\d{10,15})$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const flightTrimmed = data.flightNumber?.trim() ?? "";
  const flightRegex = /^[A-Za-z]{1,3}\d{2,5}$/; 

  if (!data.name.trim()) errors.name = "First name is required.";
  else if (!nameRegex.test(data.name.trim()))
    errors.name = "First name must contain only letters and be at least 2 characters.";

  if (!data.lastName.trim()) errors.lastName = "Last name is required.";
  else if (!nameRegex.test(data.lastName.trim()))
    errors.lastName = "Last name must contain only letters and be at least 2 characters.";

  const sanitizedPhone = data.phone.replace(/\s+/g, "");
  if (!sanitizedPhone) errors.phone = "Phone number is required.";
  else if (!phoneRegex.test(sanitizedPhone)) errors.phone = "Invalid phone number format.";

  if (!data.email.trim()) errors.email = "Email is required.";
  else if (!emailRegex.test(data.email.trim())) errors.email = "Invalid email format.";

  if (!flightTrimmed) {
    errors.flightNumber = "Flight number is required.";
  } else if (!flightRegex.test(flightTrimmed)) {
    errors.flightNumber =
      "Flight number must start with letters and end with 2–5 digits. Example: TK234 or BA1023.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/* ------------------------- Component ------------------------- */
const Details = memo(function Details() {
  const { clientData, setClientData, error } = useGetData();
  const router = useRouter();

  /* Form states */
  const [form, setForm] = useState<FormData>({
    name: clientData?.details?.name || "",
    lastName: clientData?.details?.lastName || "",
    phone: clientData?.details?.phone || "",
    flightNumber: clientData?.details?.flightNumber || "",
    email: clientData?.details?.email || "",
    message: clientData?.details?.message || "",
  });

  const [formValidation, setFormValidation] = useState<{
    isValid: boolean;
    errors: Partial<Record<keyof FormData, string>>;
  }>({ isValid: true, errors: {} });

  /* ------------------------- Handlers ------------------------- */
  const handleChange = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validateForm(form);

    setFormValidation(validation);

    if (!validation.isValid) return;

    const updatedClient = {
      ...clientData,
      details: { ...form },
    };

    setClientData(updatedClient);
    UpdateData({ clientData: updatedClient });
    router.push(`/summary?uuid=${clientData.uuid}`);
  };

  const handleNavigateToExtras = () => {
    router.push(`/extras?uuid=${clientData.uuid}`);
  };

  /* ------------------------- Effects ------------------------- */
  useEffect(() => {
    if (clientData?.details) {
      setForm({
        name: clientData.details.name || "",
        lastName: clientData.details.lastName || "",
        phone: clientData.details.phone || "",
        flightNumber: clientData.details.flightNumber || "",
        email: clientData.details.email || "",
        message: clientData.details.message || "",
      });
    }
  }, [clientData]);

  useEffect(() => {
    if (clientData?.uuid) {
      UpdateData({ clientData });
    }
  }, [clientData]);

  /* ------------------------- Render ------------------------- */
  if (error || !clientData)
    return <SessionExpiredFallback error={error} clientData={clientData} />;

  return (
    <Suspense fallback={<FallbackLoader />}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="flex relative flex-col mt-20 sm:mt-24 justify-between lg:block xl:max-w-9/12 lg:max-w-11/12 mx-auto"
      >
        <section className="p-4 md:px-4 flex justify-between flex-col-reverse lg:flex-row-reverse gap-4 w-full lg:px-0">
          {/* Sidebar */}
          <aside className="flex flex-col gap-3 xl:w-4/12 lg:w-5/12">
            <SummaryCard clientData={clientData} />
            <div className="flex md:flex-wrap gap-2 justify-between w-full">
              <button
                onClick={handleNavigateToExtras}
                className="btn w-5/12 px-0 md:w-full btn-gray flex items-center justify-center gap-2"
              >
                Extras
              </button>
            </div>
          </aside>

          {/* Form Section */}
          <div className="lg:w-full flex flex-col gap-4">
            <div className="lg:flex lg:flex-col lg:gap-4">
              <PageIndicator activeStep="details" />
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                {/* First & Last Name */}
                <div className="md:flex md:justify-between gap-2">
                  {["name", "lastName"].map((field) => (
                    <fieldset
                      key={field}
                      className="fieldset w-full flex focus-within:outline-0"
                    >
                      <legend className="font-bold text-sm lg:text-base">
                        {field === "name" ? "First Name" : "Last Name"}{" "}
                        <span className="text-warning">*</span>
                      </legend>
                      <input
                        type="text"
                        className="bg-base-300 h-10 p-2 w-full shadow-sm lg:text-base"
                        placeholder={
                          field === "name" ? "First Name" : "Last Name"
                        }
                        required
                        value={form[field as keyof FormData]}
                        onChange={(e) =>
                          handleChange(field as keyof FormData, e.target.value)
                        }
                      />
                    </fieldset>
                  ))}
                </div>

                {/* Phone Number */}
                <fieldset className="fieldset flex focus-within:outline-0">
                  <legend className="font-bold text-sm lg:text-base">
                    Phone Number <span className="text-warning">*</span>
                  </legend>
                  <input
                    type="tel"
                    autoComplete="tel"
                    className="bg-base-300 h-10 p-2 w-full shadow-sm lg:text-base"
                    placeholder="+00 000 000 00 00"
                    required
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </fieldset>

                {/* Flight Number */}
                <fieldset className="fieldset flex focus-within:outline-0">
                  <legend className="font-bold text-sm lg:text-base">
                    Flight Number <span className="text-warning">*</span>
                  </legend>
                  <input
                    type="text"
                    className="bg-base-300 h-10 p-2 w-full shadow-sm lg:text-base"
                    placeholder="AA1234"
                    required
                    value={form.flightNumber}
                    onChange={(e) =>
                      handleChange("flightNumber", e.target.value)
                    }
                  />
                </fieldset>

                {/* Email */}
                <fieldset className="fieldset flex focus-within:outline-0">
                  <legend className="font-bold text-sm lg:text-base">
                    Email <span className="text-warning">*</span>
                  </legend>
                  <input
                    type="email"
                    className="bg-base-300 h-10 w-full p-2 shadow-sm lg:text-base"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </fieldset>

                {/* Message */}
                <fieldset>
                  <legend className="font-bold">Message</legend>
                  <textarea
                    className="bg-base-300 h-32 w-full p-2 shadow-sm lg:text-base"
                    placeholder="Leave us a message..."
                    value={form.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                  />
                </fieldset>

                <button
                  type="submit"
                  className="btn text-white btn-warning w-36 self-start"
                >
                  Submit
                </button>

                {/* Error List */}
                {!formValidation.isValid && (
                  <fieldset className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <legend className="font-bold text-sm mb-2">
                      Please fix the following:
                    </legend>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {Object.entries(formValidation.errors).map(
                        ([field, message]) => (
                          <li key={field}>{message}</li>
                        )
                      )}
                    </ul>
                  </fieldset>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Steps */}
        <div className="[&>section]:max-w-full">
          <Steps />
        </div>
      </motion.div>
    </Suspense>
  );
});

export default Details;
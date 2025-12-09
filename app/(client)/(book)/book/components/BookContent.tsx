"use client";

import Image from "next/image";
import Stars from "../../../(home)/components/Stars";
import Form from "../../../(home)/components/Form";
import CurrencyWrapper from "../../../components/CurrencyWrapper";
import { motion } from "framer-motion";

export default function BookContent() {
  return (
    <section
      id="home"
      aria-labelledby="booking-heading"
      className="relative flex flex-col overflow-hidden sm:gap-5 lg:gap-10"
    >
      {/* === Background Image === */}
      <Image
        src="/images/BookBackground.webp"
        width={2048}
        height={1556}
        priority
        className="object-center object-cover absolute w-full h-full brightness-40"
        alt="Passengers boarding airport transfer vehicle at sunset"
      />

      {/* === Foreground Content === */}
      <article
        id="above-the-fold"
        className="p-2 md:px-4 my-24 sm:my-48 lg:px-0 flex flex-col lg:flex-row gap-4 z-10 xl:max-w-9/12 lg:max-w-11/12 mx-auto"
      >
        {/* === Left Side: Text Block === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex flex-col w-fit gap-4"
        >
          <h1
            id="booking-heading"
            className="font-heading font-bold tracking-tight leading-snug text-2xl sm:w-full lg:leading-tight md:w-full lg:w-fit xl:w-9/12 sm:text-4xl xl:text-5xl text-base-100"
          >
            Reliable <span className="text-warning">Airport Travels.</span>
            <br />
            Travel with Confidence and Luxury at Great Prices.
          </h1>

          <h2 className="font-paragraph xl:pb-8 text-base font-light text-white opacity-80 sm:w-full md:w-full sm:text-sm xl:text-xl xl:w-8/12 w-fit leading-relaxed tracking-tighter">
            At Airport to Hotels, we specialize in providing seamless, reliable,
            and comfortable transfers directly from airports to your hotel. Our
            mission is to make your arrival and departure effortless, allowing
            you to start and end your trip with ease.
          </h2>
        </motion.div>

        {/* === Right Side: Booking Form === */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative sm:max-w-96 h-fit w-full"
        >
          <CurrencyWrapper>
            <Form />
          </CurrencyWrapper>

          {/* === Floating Tripadvisor Rating === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute bg-base-300 rounded-box shadow-xl h-16 w-10/12 left-1/2 -translate-x-1/2 -bottom-13 pt-2 px-2 -z-10 flex justify-between items-center"
          >
            <Image
              src="/images/Tripadvisor-Logo.webp"
              alt="Tripadvisor logo"
              loading="lazy"
              width={64}
              height={64}
              className="w-1/2 bg-cover bg-center"
            />
            <div className="flex">
              <Stars starCount={5} />
            </div>
          </motion.div>
        </motion.div>
      </article>
    </section>
  );
}

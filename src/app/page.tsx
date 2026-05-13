"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfoSection from "@/components/InfoSection";
import Footer from "@/components/Footer";
import AppBackground from "@/components/AppBackground";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e6f0ff] selection:bg-[#cdb4ff] selection:text-[#4a2e8c] relative overflow-x-hidden">
      <AppBackground />
      <Navbar />
      <Hero />
      <InfoSection />
      <Footer />
    </div>
  );
}

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import InfoSection from "@/components/InfoSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#e6f0ff] selection:bg-[#cdb4ff] selection:text-[#4a2e8c]">
      <Navbar />
      <Hero />
      <InfoSection />
      <Footer />
    </div>
  );
}

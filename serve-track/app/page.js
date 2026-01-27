"use client";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-800 flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-[#264E86] text-white">
        <h1 className="text-2xl font-semibold">ServeTrack</h1>
        <div className="space-x-4">
          <Link href="/register" className="bg-white text-[#264E86] px-4 py-2 rounded-lg font-medium">
            Register
          </Link>
          <Link href="/login" className="border border-white px-4 py-2 rounded-lg hover:bg-white hover:text-[#264E86] transition">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow text-center px-6 py-20 bg-gray-50">
        <h2 className="text-4xl font-bold mb-4 text-[#264E86]">
          Verified Volunteer Management System for University Community Service
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8">
          Streamline volunteering and track verified hours with ease.
        </p>
        <Link href="/register" className="bg-[#264E86] text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-900 transition">
          Get Started
        </Link>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6 px-8 py-16 bg-white">
        {[
          {
            title: "Verified Volunteer Tracking",
            desc: "Easily log and verify your community service hours.",
          },
          {
            title: "Admin Insights",
            desc: "Access and manage volunteer data with ease.",
          },
          {
            title: "Community Impact",
            desc: "See the positive difference your organization is making.",
          },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-gray-50 p-8 rounded-2xl shadow hover:shadow-lg transition text-center"
          >
            <h3 className="text-xl font-semibold text-[#264E86] mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Testimonials */}
      <section className="px-8 py-16 bg-gray-50 text-center">
        <h3 className="text-2xl font-bold text-[#264E86] mb-6">What Our Users Say</h3>
        <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-700 mb-4">
            “ServeTrack has made tracking and verifying my volunteer hours a breeze. 
            The platform is user-friendly and simplified the process for me.”
          </p>
          <p className="font-semibold text-[#264E86]">Jane Doe, Student</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#264E86] text-white text-center py-6 text-sm">
        <p>© {new Date().getFullYear()} ServeTrack | All rights reserved.</p>
      </footer>
    </main>
  );
}

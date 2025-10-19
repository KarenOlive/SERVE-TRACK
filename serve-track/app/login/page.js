"use client";
import { useForm } from "react-hook-form";
import Link from "next/link";

export default function LoginPage() {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log("Login Data:", data);
    // TODO: connect with API via axios.post("/api/login", data)
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#264E86] mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#264E86] outline-none"
              required
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#264E86] outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#264E86] text-white py-3 rounded-lg hover:bg-blue-900 transition"
          >
            Login
          </button>
        </form>

        <div className="text-center mt-4">
          <Link href="/forgot-password" className="text-sm text-[#264E86] hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </main>
  );
}

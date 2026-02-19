import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5faf9] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-4 text-center">

        <h1 className="text-2xl font-bold text-gray-900">
          Dev Navigation
        </h1>

        <p className="text-sm text-gray-500">
          Temporary links for testing auth flow
        </p>

        <div className="flex flex-col gap-3 mt-4">
          <Link
            href="/auth/login"
            className="py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition"
          >
            Login Page
          </Link>

          <Link
            href="/auth/otp"
            className="py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            OTP Page
          </Link>

          <Link
            href="/auth/user-register"
            className="py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            User Register Page
          </Link>

          <Link
            href="/auth/success"
            className="py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            Success Page
          </Link>

           <Link
            href="/Home"
            className="py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            Home
          </Link>

          <Link
            href="/auth/business-register"
            className="py-3 rounded-xl bg-gray-100 text-gray-900 font-medium hover:bg-gray-200 transition"
          >
            business-register page
          </Link>
        </div>
      </div>
    </div>
  );
}

import PhoneLogin from "@/components/auth/Login";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5faf9] px-4">
      {/* Auth Card Wrapper */}
      <div className="w-full flex justify-center">
        <PhoneLogin />
      </div>
    </main>
  );
}

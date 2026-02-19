import OtpVerify from "@/components/auth/OtpVerify";

export default function OtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5faf9]">
      <OtpVerify phone="8160026509" />
    </div>
  );
}

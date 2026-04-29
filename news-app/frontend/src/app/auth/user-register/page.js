// app/auth/user-register/page.jsx
import { Suspense } from 'react';
import CompleteProfileForm from '@/components/auth/CompleteProfile';

export default function UserRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg">Loading registration form...</p>
        </div>
      </div>
    }>
      <CompleteProfileForm />
    </Suspense>
  );
}
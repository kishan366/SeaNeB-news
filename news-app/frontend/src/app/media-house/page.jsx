"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function MediaHouse() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/media-house/profile');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-black animate-spin dark:text-white" />
    </div>
  );
}

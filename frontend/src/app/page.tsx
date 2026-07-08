"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard");
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <span className="text-[200px] font-bold">JUMPSCARE</span>
      <img
                src="/clown.svg"
                alt="Jumpscare!"
                className="h-[600px] w-[1200px]"
            />
    </div>
  );
}

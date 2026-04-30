"use client";

export default function MobileNetwork() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">

      {/* Base Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Glow Top Left */}
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px]
      bg-[#00f0ff]/10 blur-[120px] rounded-full animate-pulse" />

      {/* Glow Bottom Right */}
      <div className="absolute bottom-[-120px] right-[-80px] w-[280px] h-[280px]
      bg-[#48C6EF]/10 blur-[120px] rounded-full animate-pulse" />

      {/* Optional subtle center glow */}
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 
      w-[200px] h-[200px] bg-[#00f0ff]/5 blur-[100px] rounded-full" />

    </div>
  );
}
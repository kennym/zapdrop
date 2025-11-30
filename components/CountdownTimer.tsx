"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiry: number; // Unix timestamp in seconds
  onExpire?: () => void;
}

export function CountdownTimer({ expiry, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = expiry - now;

      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      return { hours, minutes, seconds, expired: false };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiry, onExpire]);

  if (timeLeft.expired) {
    return (
      <div className="text-center">
        <div className="text-4xl font-bold text-red-500">EXPIRED</div>
        <p className="text-gray-500 mt-2">This drop has ended</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
        Time Remaining
      </div>
      <div className="flex justify-center gap-4">
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <div className="text-4xl font-bold text-gray-300">:</div>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <div className="text-4xl font-bold text-gray-300">:</div>
        <TimeUnit value={timeLeft.seconds} label="Sec" />
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl font-bold tabular-nums bg-gray-900 px-4 py-2 rounded-lg min-w-[80px]">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="text-xs text-gray-500 mt-1 uppercase">{label}</div>
    </div>
  );
}

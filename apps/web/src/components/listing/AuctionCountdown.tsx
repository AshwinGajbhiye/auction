import React, { useEffect, useState } from 'react';
import { Clock, Flame } from 'lucide-react';

interface AuctionCountdownProps {
  endsAt: string;
  onEnd?: () => void;
  compact?: boolean;
}

export const AuctionCountdown: React.FC<AuctionCountdownProps> = ({
  endsAt,
  onEnd,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    ended: boolean;
    urgent: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: false,
    urgent: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(endsAt).getTime() - Date.now();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          ended: true,
          urgent: false,
        });
        if (onEnd) onEnd();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      const urgent = difference < 5 * 60 * 1000; // less than 5 mins

      setTimeLeft({ days, hours, minutes, seconds, ended: false, urgent });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (timeLeft.ended) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
        <Clock className="h-3.5 w-3.5" />
        Auction Ended
      </span>
    );
  }

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          timeLeft.urgent
            ? 'bg-rose-100 text-rose-700 animate-pulse font-bold'
            : 'bg-amber-100 text-amber-800'
        }`}
      >
        {timeLeft.urgent ? <Flame className="h-3 w-3 text-rose-600" /> : <Clock className="h-3 w-3 text-amber-600" />}
        {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
        {String(timeLeft.hours).padStart(2, '0')}:
        {String(timeLeft.minutes).padStart(2, '0')}:
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border ${
        timeLeft.urgent
          ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm animate-pulse'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}
    >
      {timeLeft.urgent ? (
        <Flame className="h-4 w-4 text-rose-600 shrink-0" />
      ) : (
        <Clock className="h-4 w-4 text-amber-600 shrink-0" />
      )}
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <span className="bg-white/80 px-1 rounded">{timeLeft.days}d</span>
            <span>:</span>
          </>
        )}
        <span className="bg-white/80 px-1 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span>:</span>
        <span className="bg-white/80 px-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span>:</span>
        <span className="bg-white/80 px-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
      {timeLeft.urgent && (
        <span className="ml-1 text-[10px] font-sans font-extrabold uppercase tracking-wider text-rose-600">
          Closing Soon!
        </span>
      )}
    </div>
  );
};

import { useEffect, useState } from 'react';

/**
 * `Friday, 14/08/2026 08:12:04` — weekday in English, date in Indonesian
 * order, as the header reads across the design board.
 */
export function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Rendered on the server too, so hold the space until the client ticks.
  if (!time) {
    return <div className="bg-muted h-4 w-44 animate-pulse" />;
  }

  const weekday = time.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = time.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const clock = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="text-ink-600 hidden text-[12.5px] tabular-nums sm:block">
      {weekday}, {date} {clock}
    </div>
  );
}

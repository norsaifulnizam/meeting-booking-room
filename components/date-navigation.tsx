"use client";

import { useRouter } from "next/navigation";

type DateNavigationProps = { date: string; today: string };

export function DateNavigation({ date, today }: DateNavigationProps) {
  const router = useRouter();
  const openDate = (value: string) => router.push(value === today ? "/" : `/?date=${encodeURIComponent(value)}`);

  return <div className="date-navigation">
    <input aria-label="Choose date" type="date" min={today} value={date} onChange={(event) => openDate(event.target.value)} />
    <button className="secondary" type="button" onClick={() => openDate(today)} disabled={date === today}>Today</button>
  </div>;
}
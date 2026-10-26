"use client";

import { useRouter } from "next/navigation";

type CalendarView = "day" | "week" | "month";
type DateNavigationProps = { date: string; today: string; view: CalendarView };

export function DateNavigation({ date, today, view }: DateNavigationProps) {
  const router = useRouter();
  const openDate = (value: string, nextView = view) => {
    const params = new URLSearchParams();
    if (value !== today) params.set("date", value);
    if (nextView !== "day") params.set("view", nextView);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return <div className="date-navigation">
    <div className="calendar-views" aria-label="Calendar view"><button className={view === "day" ? "active" : ""} type="button" onClick={() => openDate(date, "day")}>Day</button><button className={view === "week" ? "active" : ""} type="button" onClick={() => openDate(date, "week")}>Week</button><button className={view === "month" ? "active" : ""} type="button" onClick={() => openDate(date, "month")}>Month</button></div>
    <input aria-label="Choose date" type="date" min={today} value={date} onChange={(event) => openDate(event.target.value)} />
    <button className="secondary" type="button" onClick={() => openDate(today)} disabled={date === today}>Today</button>
  </div>;
}

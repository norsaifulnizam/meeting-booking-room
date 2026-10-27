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
  const shiftView = (direction: -1 | 1) => {
    const next = new Date(`${date}T00:00:00`);
    if (view === "week") next.setDate(next.getDate() + direction * 7);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    const nextDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    openDate(nextDate);
  };
  const isAtEarliestDate = date <= today;

  return <div className="date-navigation">
    <div className="calendar-views" aria-label="Calendar view"><button className={view === "day" ? "active" : ""} type="button" onClick={() => openDate(date, "day")}>Day</button><button className={view === "week" ? "active" : ""} type="button" onClick={() => openDate(date, "week")}>Week</button><button className={view === "month" ? "active" : ""} type="button" onClick={() => openDate(date, "month")}>Month</button></div>
    {view !== "day" && <div className="period-navigation"><button className="secondary" type="button" onClick={() => shiftView(-1)} disabled={isAtEarliestDate}>Previous {view}</button><button className="secondary" type="button" onClick={() => shiftView(1)}>Next {view}</button></div>}
    <input aria-label="Choose date" type="date" min={today} value={date} onChange={(event) => openDate(event.target.value)} />
    <button className="secondary" type="button" onClick={() => openDate(today)} disabled={date === today}>Today</button>
  </div>;
}

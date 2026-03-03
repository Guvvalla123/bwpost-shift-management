import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────────── */
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, "0");

const parse = (val) => {
    if (!val) return null;
    const [d = "", t = "09:00"] = val.split("T");
    const [year, month, day] = d.split("-").map(Number);
    const [hour = 9, min = 0] = t.split(":").map(Number);
    return { year, month: month - 1, day, hour, min };
};

const fmt = ({ year, month, day, hour, min }) =>
    `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(min)}`;

const buildGrid = (year, month) => {
    const firstDow = new Date(year, month, 1).getDay();
    const offset = firstDow === 0 ? 6 : firstDow - 1;
    const total = new Date(year, month + 1, 0).getDate();
    const cells = Array(offset).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

/* ─────────────────────────────────────────────────────────────────
   DATE TIME PICKER
───────────────────────────────────────────────────────────────── */
const DateTimePicker = ({ value, onChange, placeholder = "Select date & time", accentColor = "blue" }) => {
    const parsed = parse(value);
    const today = new Date();

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
    const [hour, setHour] = useState(parsed?.hour ?? 9);
    const [min, setMin] = useState(parsed?.min ?? 0);

    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    /* Sync local time state when value changes from outside */
    useEffect(() => {
        const p = parse(value);
        if (p) {
            setHour(p.hour);
            setMin(p.min);
            setViewYear(p.year);
            setViewMonth(p.month);
        }
    }, [value]);

    /* Close on outside click */
    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* Month navigation */
    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    /* Select a day to get the date, keep current time */
    const selectDay = (day) => {
        onChange(fmt({ year: viewYear, month: viewMonth, day, hour, min }));
    };

    /* Auto-apply time immediately when hour/min changes — if a date is already selected */
    const applyHour = (h) => {
        const clamped = Math.min(23, Math.max(0, isNaN(h) ? 0 : h));
        setHour(clamped);
        if (parsed) onChange(fmt({ ...parsed, hour: clamped, min }));
    };

    const applyMin = (m) => {
        const clamped = Math.min(59, Math.max(0, isNaN(m) ? 0 : m));
        setMin(clamped);
        if (parsed) onChange(fmt({ ...parsed, hour, min: clamped }));
    };

    /* Accent colours */
    const acc = accentColor === "amber"
        ? { sel: "bg-amber-500 text-white", ring: "focus:ring-amber-500/30 focus:border-amber-500" }
        : { sel: "bg-indigo-600 text-white", ring: "focus:ring-indigo-500/30 focus:border-indigo-500" };

    const label = parsed
        ? `${MONTHS[parsed.month].slice(0, 3)} ${pad(parsed.day)}, ${parsed.year}  ·  ${pad(parsed.hour)}:${pad(parsed.min)}`
        : null;

    const cells = buildGrid(viewYear, viewMonth);

    return (
        <div className="relative">
            {/* ── Trigger ───────────────────────────────────────────── */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`
          w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm text-left
          bg-slate-50 border transition-all duration-150
          hover:bg-white hover:border-slate-300
          focus:outline-none focus:ring-2 ${acc.ring}
          ${label ? "border-slate-200 text-slate-800 font-medium" : "border-slate-200 text-slate-400"}
        `}
            >
                <CalendarDays size={15} className={label ? "text-indigo-500 shrink-0" : "text-slate-400 shrink-0"} />
                <span className="flex-1 truncate">{label ?? placeholder}</span>
                {label && (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onChange(""); }}
                        className="text-slate-300 hover:text-slate-500 transition cursor-pointer text-base leading-none"
                    >
                        ×
                    </span>
                )}
            </button>

            {/* ── Dropdown ──────────────────────────────────────────── */}
            {open && (
                <div
                    ref={dropdownRef}
                    /* Use fixed so it's never clipped by a parent's overflow:hidden */
                    className="fixed z-[999] mt-1 w-68 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        /* Position below trigger via JS */
                        top: (triggerRef.current?.getBoundingClientRect().bottom ?? 0) + 6,
                        left: triggerRef.current?.getBoundingClientRect().left ?? 0,
                        width: 272,
                    }}
                >
                    {/* Month nav */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <button type="button" onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-bold text-slate-800">
                            {MONTHS[viewMonth]} {viewYear}
                        </span>
                        <button type="button" onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 px-4 mb-1">
                        {WEEKDAYS.map((d, i) => (
                            <div key={i} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 px-4 pb-3 gap-y-1">
                        {cells.map((day, idx) => {
                            if (!day) return <div key={idx} />;
                            const isSelected = parsed && parsed.day === day && parsed.month === viewMonth && parsed.year === viewYear;
                            const isToday = today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => selectDay(day)}
                                    className={`
                    mx-auto flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-100
                    ${isSelected ? acc.sel + " shadow-sm"
                                            : isToday ? "text-indigo-600 font-bold ring-2 ring-indigo-400 ring-offset-1"
                                                : "text-slate-700 hover:bg-slate-100"}
                  `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Time picker */}
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 rounded-b-2xl">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Time</p>
                        <div className="flex items-center gap-2">
                            {/* Hour */}
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 mb-1 text-center">Hour</p>
                                <input
                                    type="number" min={0} max={23}
                                    value={pad(hour)}
                                    onChange={(e) => applyHour(parseInt(e.target.value))}
                                    onBlur={(e) => applyHour(parseInt(e.target.value))}
                                    className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                                />
                            </div>
                            <span className="text-slate-400 font-bold text-xl mt-3">:</span>
                            {/* Minute */}
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 mb-1 text-center">Min</p>
                                <input
                                    type="number" min={0} max={59} step={5}
                                    value={pad(min)}
                                    onChange={(e) => applyMin(parseInt(e.target.value))}
                                    onBlur={(e) => applyMin(parseInt(e.target.value))}
                                    className="w-full text-center px-2 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition"
                                />
                            </div>
                            {/* Done */}
                            <div className="flex-1">
                                <p className="text-[10px] text-slate-400 mb-1 text-center opacity-0">-</p>
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="w-full py-2 rounded-xl text-sm font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                        {!parsed && (
                            <p className="text-[10px] text-amber-500 mt-2 text-center">
                                ↑ Select a date first to apply time
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateTimePicker;

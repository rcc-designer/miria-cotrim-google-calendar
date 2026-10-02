import type { SupabaseClient } from "@supabase/supabase-js";

export const BOOKING_TIME_ZONE =
  process.env.BOOKING_TIMEZONE || "America/New_York";

export type BookingService = {
  id?: string;
  slug: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  location_type: string;
  active: boolean;
  sort_order: number;
};

export type AvailabilitySlot = {
  id: string;
  date: string;
  start_iso: string;
  end_iso: string;
  start_label: string;
  end_label: string;
  time_zone: string;
};

export type BusyTime = {
  start: string;
  end: string;
};

type AvailabilityRule = {
  id?: string;
  service_id?: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type BlackoutDate = {
  service_id?: string | null;
  date: string;
  reason?: string | null;
};

const slotStepMinutes = 30;

export const seedServices: BookingService[] = [
  {
    slug: "bridal-trial",
    name: "Bridal Trial",
    description: "In-person one-on-one bridal preview appointment.",
    duration_minutes: 120,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 10,
  },
  {
    slug: "hair-makeup",
    name: "Hair + Makeup",
    description: "In-person one-on-one complete beauty appointment.",
    duration_minutes: 120,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 20,
  },
  {
    slug: "hair-treatment",
    name: "Hair Treatment",
    description: "In-person one-on-one hair care appointment.",
    duration_minutes: 60,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 30,
  },
  {
    slug: "haircut",
    name: "Haircut",
    description: "In-person one-on-one haircut appointment.",
    duration_minutes: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 40,
  },
  {
    slug: "special-events",
    name: "Special Events",
    description: "In-person one-on-one event hair and makeup appointment.",
    duration_minutes: 240,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 50,
  },
  {
    slug: "hair-styling",
    name: "Hair Styling",
    description: "In-person one-on-one styling appointment.",
    duration_minutes: 60,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 60,
  },
  {
    slug: "makeup",
    name: "Makeup",
    description: "In-person one-on-one makeup appointment.",
    duration_minutes: 60,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "in_person",
    active: true,
    sort_order: 70,
  },
  {
    slug: "bridal-consultation",
    name: "Bridal Consultation",
    description: "Ask-invitee consultation before confirming bridal details.",
    duration_minutes: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 15,
    location_type: "ask_invitee",
    active: true,
    sort_order: 80,
  },
];

const defaultAvailabilityRules: AvailabilityRule[] = Array.from(
  { length: 7 },
  (_, day) => ({
    day_of_week: day,
    start_time: "09:00:00",
    end_time: "17:00:00",
    active: true,
  }),
);

export function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hr` : `${hours.toFixed(1)} hr`;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

export function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayString() {
  return toDateString(new Date());
}

export function normalizeService(row: Record<string, unknown>): BookingService {
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    slug: String(row.slug),
    name: String(row.name),
    description: typeof row.description === "string" ? row.description : "",
    duration_minutes: Number(row.duration_minutes) || 60,
    buffer_before_minutes: Number(row.buffer_before_minutes) || 0,
    buffer_after_minutes: Number(row.buffer_after_minutes) || 0,
    location_type:
      typeof row.location_type === "string" ? row.location_type : "in_person",
    active: row.active !== false,
    sort_order: Number(row.sort_order) || 0,
  };
}

export async function listBookingServices(supabase: SupabaseClient | null) {
  if (!supabase) {
    return seedServices;
  }

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("services query failed, using seed services", error.message);
    return seedServices;
  }

  const services = (data || []).map(normalizeService);
  return services.length ? services : seedServices;
}

export async function findBookingService(
  supabase: SupabaseClient | null,
  slug: string,
) {
  const services = await listBookingServices(supabase);
  return services.find((service) => service.slug === slug) || null;
}

export async function buildAvailability({
  supabase,
  serviceSlug,
  startDate,
  endDate,
  busyTimes = [],
  timeZone = BOOKING_TIME_ZONE,
}: {
  supabase: SupabaseClient | null;
  serviceSlug: string;
  startDate: string;
  endDate: string;
  busyTimes?: BusyTime[];
  timeZone?: string;
}) {
  const service = await findBookingService(supabase, serviceSlug);

  if (!service) {
    throw new Error("Service not found.");
  }

  const [rules, blackoutDates] = await Promise.all([
    listAvailabilityRules(supabase, service),
    listBlackoutDates(supabase, service, startDate, endDate),
  ]);

  const blackoutSet = new Set(blackoutDates.map((blackout) => blackout.date));
  const busy = busyTimes.map((item) => ({
    start: new Date(item.start),
    end: new Date(item.end),
  }));
  const slots: AvailabilitySlot[] = [];

  for (const date of eachDate(startDate, endDate)) {
    if (blackoutSet.has(date)) {
      continue;
    }

    const dayOfWeek = dayOfWeekForDate(date, timeZone);
    const rulesForDay = rules.filter((rule) => rule.day_of_week === dayOfWeek);

    for (const rule of rulesForDay) {
      const startMinute = timeToMinutes(rule.start_time);
      const endMinute = timeToMinutes(rule.end_time);
      const lastStart =
        endMinute -
        service.duration_minutes -
        service.buffer_after_minutes;

      for (
        let minute = startMinute + service.buffer_before_minutes;
        minute <= lastStart;
        minute += slotStepMinutes
      ) {
        const appointmentStart = zonedDateTimeToUtc(
          date,
          minutesToTime(minute),
          timeZone,
        );
        const appointmentEnd = zonedDateTimeToUtc(
          date,
          minutesToTime(minute + service.duration_minutes),
          timeZone,
        );
        const blockedStart = new Date(
          appointmentStart.getTime() - service.buffer_before_minutes * 60000,
        );
        const blockedEnd = new Date(
          appointmentEnd.getTime() + service.buffer_after_minutes * 60000,
        );

        if (appointmentStart.getTime() < Date.now()) {
          continue;
        }

        if (overlapsBusy(blockedStart, blockedEnd, busy)) {
          continue;
        }

        slots.push({
          id: `${date}-${minutesToTime(minute).replace(":", "")}`,
          date,
          start_iso: appointmentStart.toISOString(),
          end_iso: appointmentEnd.toISOString(),
          start_label: formatTimeLabel(minute),
          end_label: formatTimeLabel(minute + service.duration_minutes),
          time_zone: timeZone,
        });
      }
    }
  }

  const dedupedSlots = Array.from(
    new Map(slots.map((slot) => [slot.start_iso, slot])).values(),
  ).sort((a, b) => a.start_iso.localeCompare(b.start_iso));

  return {
    service,
    slots: dedupedSlots,
    slotsByDate: dedupedSlots.reduce<Record<string, AvailabilitySlot[]>>(
      (dates, slot) => {
        dates[slot.date] = [...(dates[slot.date] || []), slot];
        return dates;
      },
      {},
    ),
  };
}

async function listAvailabilityRules(
  supabase: SupabaseClient | null,
  service: BookingService,
) {
  if (!supabase) {
    return defaultAvailabilityRules;
  }

  let query = supabase
    .from("availability_rules")
    .select("*")
    .eq("active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  query = service.id
    ? query.or(`service_id.is.null,service_id.eq.${service.id}`)
    : query.is("service_id", null);

  const { data, error } = await query;

  if (error) {
    console.warn(
      "availability_rules query failed, using seed availability",
      error.message,
    );
    return defaultAvailabilityRules;
  }

  const rows = (data || []) as AvailabilityRule[];
  const serviceSpecific = rows.filter((rule) => rule.service_id === service.id);
  const rules = serviceSpecific.length
    ? serviceSpecific
    : rows.filter((rule) => !rule.service_id);

  return rules.length ? rules : defaultAvailabilityRules;
}

async function listBlackoutDates(
  supabase: SupabaseClient | null,
  service: BookingService,
  startDate: string,
  endDate: string,
) {
  if (!supabase) {
    return [] as BlackoutDate[];
  }

  let query = supabase
    .from("blackout_dates")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);

  query = service.id
    ? query.or(`service_id.is.null,service_id.eq.${service.id}`)
    : query.is("service_id", null);

  const { data, error } = await query;

  if (error) {
    console.warn("blackout_dates query failed", error.message);
    return [] as BlackoutDate[];
  }

  return (data || []) as BlackoutDate[];
}

function eachDate(startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(toDateString(date));
  }

  return dates;
}

function dayOfWeekForDate(date: string, timeZone: string) {
  const utcNoon = new Date(`${date}T12:00:00.000Z`);
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
    })
      .formatToParts(utcNoon)
      .find((part) => part.type === "weekday")
      ?.value.replace("Sun", "0")
      .replace("Mon", "1")
      .replace("Tue", "2")
      .replace("Wed", "3")
      .replace("Thu", "4")
      .replace("Fri", "5")
      .replace("Sat", "6"),
  );
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatTimeLabel(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffset(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset * 60000);
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

function overlapsBusy(
  start: Date,
  end: Date,
  busy: { start: Date; end: Date }[],
) {
  return busy.some((item) => start < item.end && end > item.start);
}

import { BOOKING_TIME_ZONE, type BusyTime } from "@/lib/availability";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleEventArgs = {
  serviceName: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  startIso: string;
  endIso: string;
  timeZone?: string;
};

const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleCalendarBaseUrl = "https://www.googleapis.com/calendar/v3";

export function hasGoogleCalendarConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

export async function getCalendarBusyTimes({
  timeMin,
  timeMax,
  timeZone = BOOKING_TIME_ZONE,
}: {
  timeMin: string;
  timeMax: string;
  timeZone?: string;
}): Promise<{ busy: BusyTime[]; configured: boolean }> {
  if (!hasGoogleCalendarConfig()) {
    return { busy: [], configured: false };
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${googleCalendarBaseUrl}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone,
      items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof result.error?.message === "string"
        ? result.error.message
        : "Google Calendar FreeBusy request failed.",
    );
  }

  const calendar = result.calendars?.[process.env.GOOGLE_CALENDAR_ID || ""];
  return {
    busy: Array.isArray(calendar?.busy) ? calendar.busy : [],
    configured: true,
  };
}

export async function createPendingCalendarEvent({
  serviceName,
  name,
  email,
  phone,
  notes,
  startIso,
  endIso,
  timeZone = BOOKING_TIME_ZONE,
}: GoogleEventArgs) {
  if (!hasGoogleCalendarConfig()) {
    throw new Error("Google Calendar is not configured.");
  }

  const accessToken = await getAccessToken();
  const response = await fetch(
    `${googleCalendarBaseUrl}/calendars/${encodeURIComponent(
      process.env.GOOGLE_CALENDAR_ID || "",
    )}/events?sendUpdates=none`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Pending: ${serviceName} with ${name}`,
        description: [
          "Pending website booking request.",
          "",
          `Client: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Service: ${serviceName}`,
          notes ? `Notes: ${notes}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        status: "tentative",
        start: {
          dateTime: startIso,
          timeZone,
        },
        end: {
          dateTime: endIso,
          timeZone,
        },
        extendedProperties: {
          private: {
            source: "miria_website",
            confirmation_status: "pending",
          },
        },
      }),
    },
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof result.error?.message === "string"
        ? result.error.message
        : "Google Calendar event creation failed.",
    );
  }

  return {
    id: typeof result.id === "string" ? result.id : null,
    htmlLink: typeof result.htmlLink === "string" ? result.htmlLink : null,
  };
}

async function getAccessToken() {
  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || "",
      grant_type: "refresh_token",
    }),
  });

  const result = (await response.json().catch(() => ({}))) as TokenResponse;

  if (!response.ok || !result.access_token) {
    throw new Error(
      result.error_description ||
        result.error ||
        "Could not refresh Google Calendar access token.",
    );
  }

  return result.access_token;
}

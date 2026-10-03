import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

const REPORT_TIME_ZONE = "America/New_York";
const fallbackFromEmail = "Miriã Cotrim Website <onboarding@resend.dev>";

type ContactMessage = {
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string | null;
  created_at: string;
};

type BridalInquiry = {
  bride_name: string;
  email: string;
  phone: string;
  event_date: string;
  event_location: string;
  service_type: string;
  details: string;
  created_at: string;
};

type BookingRequest = {
  name: string;
  email: string;
  phone: string;
  requested_service: string;
  preferred_date: string | null;
  preferred_time: string | null;
  requested_start: string | null;
  requested_end: string | null;
  time_zone: string | null;
  status: string | null;
  google_event_link: string | null;
  notes: string | null;
  created_at: string;
};

type NewsletterSubscriber = {
  name: string | null;
  email: string;
  source: string | null;
  consent: boolean | null;
  created_at: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendReportEmail({
  subject,
  html,
  text,
}: {
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || fallbackFromEmail;

  if (!apiKey || !toEmail) {
    throw new Error(
      "Configure RESEND_API_KEY and ADMIN_NOTIFICATION_EMAIL before sending reports.",
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend report email failed: ${error.message}`);
  }
}

function getZonedParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function zonedMonthStartToUtc(year: number, monthIndex: number) {
  const guess = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0));
  const parts = getZonedParts(guess);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const offset = asUtc - guess.getTime();

  return new Date(guess.getTime() - offset);
}

function getPreviousMonthPeriod() {
  const nowParts = getZonedParts(new Date());
  const currentMonthStart = zonedMonthStartToUtc(
    nowParts.year,
    nowParts.month - 1,
  );
  const previousMonthStart = zonedMonthStartToUtc(
    nowParts.month === 1 ? nowParts.year - 1 : nowParts.year,
    nowParts.month === 1 ? 11 : nowParts.month - 2,
  );

  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: REPORT_TIME_ZONE,
  }).format(previousMonthStart);

  return {
    start: previousMonthStart,
    end: currentMonthStart,
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date(value));
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function summaryCard(label: string, value: number) {
  return `
    <td style="padding:12px;width:25%;">
      <div style="border:1px solid #eee4d8;background:#fffaf4;padding:16px;text-align:center;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#66513f;line-height:1;">${value}</div>
        <div style="margin-top:8px;font-size:12px;line-height:1.4;color:#75665b;">${escapeHtml(label)}</div>
      </div>
    </td>
  `;
}

function emptySection() {
  return `<p style="margin:0;color:#8a7967;font-size:14px;">Nenhum registro recebido neste período.</p>`;
}

function row(label: string, value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #eee4d8;color:#8a7967;font-size:12px;width:145px;">${escapeHtml(label)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #eee4d8;color:#332b27;font-size:13px;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function recordCard(title: string, rows: string) {
  return `
    <div style="border:1px solid #eee4d8;background:#fffaf4;margin:0 0 14px;">
      <h3 style="margin:0;padding:13px 14px;background:#f5efe5;color:#332b27;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;">${escapeHtml(title)}</h3>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
    </div>
  `;
}

function contactSection(items: ContactMessage[]) {
  if (!items.length) {
    return emptySection();
  }

  return items
    .map((item) =>
      recordCard(
        item.name,
        [
          row("Recebido em", formatDateTime(item.created_at)),
          row("E-mail", item.email),
          row("Telefone/WhatsApp", item.phone),
          row("Origem", item.source),
          row("Mensagem", item.message),
        ].join(""),
      ),
    )
    .join("");
}

function bridalSection(items: BridalInquiry[]) {
  if (!items.length) {
    return emptySection();
  }

  return items
    .map((item) =>
      recordCard(
        item.bride_name,
        [
          row("Recebido em", formatDateTime(item.created_at)),
          row("E-mail", item.email),
          row("Telefone/WhatsApp", item.phone),
          row("Data do evento", formatDate(item.event_date)),
          row("Local do evento", item.event_location),
          row("Serviço", item.service_type),
          row("Detalhes", item.details),
        ].join(""),
      ),
    )
    .join("");
}

function bookingSection(items: BookingRequest[]) {
  if (!items.length) {
    return emptySection();
  }

  return items
    .map((item) =>
      recordCard(
        item.name,
        [
          row("Recebido em", formatDateTime(item.created_at)),
          row("E-mail", item.email),
          row("Telefone/WhatsApp", item.phone),
          row("Serviço", item.requested_service),
          row("Data preferida", formatDate(item.preferred_date)),
          row("Horário preferido", item.preferred_time),
          row("Início solicitado", formatDateTime(item.requested_start)),
          row("Fim solicitado", formatDateTime(item.requested_end)),
          row("Fuso horário", item.time_zone),
          row("Status", item.status),
          row("Link do Google Calendar", item.google_event_link),
          row("Observações", item.notes),
        ].join(""),
      ),
    )
    .join("");
}

function newsletterSection(items: NewsletterSubscriber[]) {
  if (!items.length) {
    return emptySection();
  }

  return items
    .map((item) =>
      recordCard(
        item.name || item.email,
        [
          row("Recebido em", formatDateTime(item.created_at)),
          row("Nome", item.name),
          row("E-mail", item.email),
          row("Origem", item.source),
          row("Consentimento", item.consent ? "Sim" : "Não"),
        ].join(""),
      ),
    )
    .join("");
}

function section(title: string, content: string) {
  return `
    <div style="padding:26px 30px;border-top:1px solid #eee4d8;">
      <h2 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#332b27;">${escapeHtml(title)}</h2>
      ${content}
    </div>
  `;
}

function buildTextReport({
  label,
  contacts,
  bridal,
  bookings,
  newsletter,
}: {
  label: string;
  contacts: ContactMessage[];
  bridal: BridalInquiry[];
  bookings: BookingRequest[];
  newsletter: NewsletterSubscriber[];
}) {
  const lines = [
    `Relatório mensal de formulários - ${label}`,
    "",
    "Resumo:",
    `- Mensagens de contato: ${contacts.length}`,
    `- Consultas para noivas: ${bridal.length}`,
    `- Solicitações de agendamento: ${bookings.length}`,
    `- Inscritos na Beauty List: ${newsletter.length}`,
    "",
    "Este relatório inclui os formulários recebidos no mês anterior.",
  ];

  return lines.join("\n");
}

function buildHtmlReport({
  label,
  contacts,
  bridal,
  bookings,
  newsletter,
}: {
  label: string;
  contacts: ContactMessage[];
  bridal: BridalInquiry[];
  bookings: BookingRequest[];
  newsletter: NewsletterSubscriber[];
}) {
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: REPORT_TIME_ZONE,
  }).format(new Date());

  return `
    <div style="background:#faf8f4;padding:28px 18px;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #ded5ca;">
        <div style="padding:30px;background:#66513f;color:#fff;">
          <p style="margin:0 0 10px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e0c9aa;">Miriã Cotrim Bridal Beauty</p>
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:400;line-height:1.2;">Relatório mensal de formulários</h1>
          <p style="margin:14px 0 0;color:#ede3d7;font-size:15px;">Período: ${escapeHtml(label)} · Gerado em ${escapeHtml(generatedAt)}</p>
        </div>
        <div style="padding:24px 18px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              ${summaryCard("Mensagens de contato", contacts.length)}
              ${summaryCard("Consultas para noivas", bridal.length)}
              ${summaryCard("Solicitações de agendamento", bookings.length)}
              ${summaryCard("Inscritos na Beauty List", newsletter.length)}
            </tr>
          </table>
        </div>
        ${section("Contact", contactSection(contacts))}
        ${section("Bridal inquiry", bridalSection(bridal))}
        ${section("Book / agendamentos", bookingSection(bookings))}
        ${section("Join our Beauty List", newsletterSection(newsletter))}
        <div style="padding:22px 30px;background:#f5efe5;color:#75665b;font-size:12px;line-height:1.6;">
          Este e-mail foi gerado automaticamente a partir dos registros salvos no Supabase.
        </div>
      </div>
    </div>
  `;
}

async function fetchMonthlyData(startIso: string, endIso: string) {
  const supabase = getSupabaseAdmin();
  const baseQuery = {
    ascending: false,
  };

  const [contacts, bridal, bookings, newsletter] = await Promise.all([
    supabase
      .from("contact_messages")
      .select("name,email,phone,message,source,created_at")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", baseQuery),
    supabase
      .from("bridal_inquiries")
      .select(
        "bride_name,email,phone,event_date,event_location,service_type,details,created_at",
      )
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", baseQuery),
    supabase
      .from("booking_requests")
      .select(
        "name,email,phone,requested_service,preferred_date,preferred_time,requested_start,requested_end,time_zone,status,google_event_link,notes,created_at",
      )
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", baseQuery),
    supabase
      .from("newsletter_subscribers")
      .select("name,email,source,consent,created_at")
      .gte("created_at", startIso)
      .lt("created_at", endIso)
      .order("created_at", baseQuery),
  ]);

  const errors = [contacts.error, bridal.error, bookings.error, newsletter.error]
    .filter(Boolean)
    .map((error) => error?.message)
    .join("; ");

  if (errors) {
    throw new Error(errors);
  }

  return {
    contacts: (contacts.data || []) as ContactMessage[],
    bridal: (bridal.data || []) as BridalInquiry[],
    bookings: (bookings.data || []) as BookingRequest[],
    newsletter: (newsletter.data || []) as NewsletterSubscriber[],
  };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const period = getPreviousMonthPeriod();
    const data = await fetchMonthlyData(
      period.start.toISOString(),
      period.end.toISOString(),
    );

    await sendReportEmail({
      subject: `Relatório mensal de formulários - ${period.label}`,
      html: buildHtmlReport({ label: period.label, ...data }),
      text: buildTextReport({ label: period.label, ...data }),
    });

    return NextResponse.json({
      ok: true,
      period: period.label,
      counts: {
        contact_messages: data.contacts.length,
        bridal_inquiries: data.bridal.length,
        booking_requests: data.bookings.length,
        newsletter_subscribers: data.newsletter.length,
      },
    });
  } catch (error) {
    console.error("monthly report route failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not generate monthly report.",
      },
      { status: 500 },
    );
  }
}

import { Resend } from "resend";

type NotificationField = {
  label: string;
  value?: string | null;
};

type AdminNotification = {
  subject: string;
  title: string;
  intro: string;
  fields: NotificationField[];
};

const fallbackFromEmail = "Miriã Cotrim Website <onboarding@resend.dev>";

function getAdminEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    toEmail:
      process.env.ADMIN_NOTIFICATION_EMAIL || process.env.CONTACT_NOTIFICATION_EMAIL,
    fromEmail: process.env.RESEND_FROM_EMAIL || fallbackFromEmail,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildRows(fields: NotificationField[]) {
  return fields
    .filter((field) => field.value)
    .map(
      (field) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee4d8;color:#8a7967;font-size:13px;width:170px;">${escapeHtml(field.label)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee4d8;color:#332b27;font-size:14px;">${escapeHtml(field.value || "")}</td>
        </tr>
      `,
    )
    .join("");
}

function buildText(fields: NotificationField[]) {
  return fields
    .filter((field) => field.value)
    .map((field) => `${field.label}: ${field.value}`)
    .join("\n");
}

export async function sendAdminNotification({
  subject,
  title,
  intro,
  fields,
}: AdminNotification) {
  const { apiKey, toEmail, fromEmail } = getAdminEmailConfig();

  if (!apiKey || !toEmail) {
    console.warn(
      "Admin notification skipped. Configure RESEND_API_KEY and ADMIN_NOTIFICATION_EMAIL.",
    );
    return;
  }

  const resend = new Resend(apiKey);
  const receivedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date());

  const allFields = [
    { label: "Received at", value: `${receivedAt} ET` },
    ...fields,
  ];

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject,
    html: `
      <div style="background:#faf8f4;padding:28px 18px;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ded5ca;">
          <div style="padding:28px 30px 20px;background:#66513f;color:#fff;">
            <p style="margin:0 0 10px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#e0c9aa;">Miriã Cotrim Bridal Beauty</p>
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;line-height:1.2;">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:26px 30px 30px;">
            <p style="margin:0 0 22px;color:#75665b;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>
            <table style="width:100%;border-collapse:collapse;background:#fffaf4;border-top:1px solid #eee4d8;">
              ${buildRows(allFields)}
            </table>
          </div>
        </div>
      </div>
    `,
    text: `${intro}\n\n${buildText(allFields)}`,
  });

  if (error) {
    throw new Error(`Resend notification failed: ${error.message}`);
  }
}

export async function notifyAdminSafely(notification: AdminNotification) {
  try {
    await sendAdminNotification(notification);
  } catch (error) {
    console.error("admin notification failed", error);
  }
}

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const GENDERS = new Set(["co-ed", "boys", "girls"]);
const BOARDING = new Set(["day", "boarding", "day-and-boarding"]);

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

async function sendNotificationEmail(env: Cloudflare.Env, subject: string, text: string) {
  if (env.EMAIL_PROVIDER === "resend") {
    if (!env.RESEND_API_KEY) return; // not configured — skip silently, submission is already saved
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: env.EMAIL_TO,
        subject,
        text,
      }),
    });
    return;
  }

  if (env.EMAIL_PROVIDER === "mailchannels") {
    await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.EMAIL_TO }] }],
        from: { email: env.EMAIL_FROM, name: "UK Prep Schools" },
        subject,
        content: [{ type: "text/plain", value: text }],
      }),
    });
  }
}

export const POST: APIRoute = async ({ request }) => {
  let payload: Record<string, string>;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Invalid request body.");
  }

  // Honeypot: real users never see or fill this field.
  if (payload.companyWebsite) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const required = [
    "schoolName",
    "town",
    "county",
    "website",
    "ageRange",
    "gender",
    "boarding",
    "description",
    "submitterName",
    "submitterEmail",
  ];
  for (const field of required) {
    if (!payload[field] || typeof payload[field] !== "string" || !payload[field].trim()) {
      return jsonError(`Missing required field: ${field}`);
    }
  }

  if (!GENDERS.has(payload.gender)) return jsonError("Invalid gender value.");
  if (!BOARDING.has(payload.boarding)) return jsonError("Invalid boarding value.");

  try {
    new URL(payload.website);
  } catch {
    return jsonError("Please provide a valid website URL.");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(payload.submitterEmail)) {
    return jsonError("Please provide a valid email address.");
  }

  if (env.TURNSTILE_SECRET_KEY) {
    const token = payload.turnstileToken;
    if (!token) return jsonError("Please complete the verification challenge.");
    const ip = request.headers.get("CF-Connecting-IP");
    const verified = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip);
    if (!verified) return jsonError("Verification failed. Please try again.");
  }

  await env.DB.prepare(
    `INSERT INTO submissions
      (school_name, town, county, website, age_range, gender, boarding, description, submitter_name, submitter_email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
  )
    .bind(
      payload.schoolName.trim(),
      payload.town.trim(),
      payload.county.trim(),
      payload.website.trim(),
      payload.ageRange.trim(),
      payload.gender,
      payload.boarding,
      payload.description.trim(),
      payload.submitterName.trim(),
      payload.submitterEmail.trim()
    )
    .run();

  await sendNotificationEmail(
    env,
    `New school submission: ${payload.schoolName}`,
    `A new school was submitted for review.\n\n` +
      `School: ${payload.schoolName}\n` +
      `Location: ${payload.town}, ${payload.county}\n` +
      `Website: ${payload.website}\n` +
      `Age range: ${payload.ageRange}\n` +
      `Gender: ${payload.gender}\n` +
      `Day/boarding: ${payload.boarding}\n` +
      `Description: ${payload.description}\n\n` +
      `Submitted by: ${payload.submitterName} <${payload.submitterEmail}>\n\n` +
      `Review it in D1 (table: submissions) before publishing via Keystatic.`
  ).catch(() => {
    // Email is best-effort — the submission is already saved in D1.
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

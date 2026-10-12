/** A transactional email, ready to send. */
export interface Mail {
  to: string;
  subject: string;
  /** Opening line, in plain words. */
  intro: string;
  /** The one thing the email asks for. */
  action: { label: string; url: string };
  /** Small print under the button. */
  footnote: string;
}

const FROM = { name: "wewillfind.it", email: "noreply@wewillfind.it" };

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const isLocal = (env: Env) => new URL(env.SITE_URL).hostname === "localhost";

/** False on a deployed site whose email binding hasn't been set up yet — sign-up by email can't work there. */
export const canSendEmail = (env: Env) => Boolean(env.EMAIL) || isLocal(env);

export async function sendEmail(env: Env, mail: Mail): Promise<void> {
  const text = `${mail.intro}\n\n${mail.action.label}: ${mail.action.url}\n\n${mail.footnote}`;
  if (!env.EMAIL) {
    // Local development: print the email instead, so the link can be opened by hand.
    console.log(`[email] To: ${mail.to}\nSubject: ${mail.subject}\n\n${text}\n`);
    return;
  }
  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 16px;background:#f6f7fb;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#1b2440">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px">
      <p style="margin:0 0 24px;font-size:18px;font-weight:800;color:#ff3b5c">wewillfind.it</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escapeHtml(mail.intro)}</p>
      <p style="margin:0 0 24px">
        <a href="${escapeHtml(mail.action.url)}" style="display:inline-block;background:#ff3b5c;color:#ffffff;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:12px">${escapeHtml(mail.action.label)}</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.5;color:#5d6785">${escapeHtml(mail.footnote)}</p>
    </div>
  </body>
</html>`;
  try {
    await env.EMAIL.send({ from: FROM, to: mail.to, subject: mail.subject, text, html });
  } catch (err) {
    // Runs after the response has gone out (waitUntil), so the log is the only place this can surface.
    console.error(`[email] failed to send "${mail.subject}"`, err);
  }
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

export const verificationEmail = (user: { name: string; email: string }, url: string): Mail => ({
  to: user.email,
  subject: "Confirm your email for wewillfind.it",
  intro: `Hi ${firstName(user.name)}, welcome to wewillfind.it! Confirm your email address to finish creating your account.`,
  action: { label: "Confirm my email", url },
  footnote: "This link works for 1 hour. If you didn't create an account, you can ignore this email.",
});

export const resetPasswordEmail = (user: { name: string; email: string }, url: string): Mail => ({
  to: user.email,
  subject: "Reset your wewillfind.it password",
  intro: `Hi ${firstName(user.name)}, we got a request to reset the password for your wewillfind.it account.`,
  action: { label: "Choose a new password", url },
  footnote: "This link works for 1 hour. If you didn't ask for it, you can ignore this email — your password stays the same.",
});

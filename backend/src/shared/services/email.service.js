const nodemailer = require("nodemailer");
const logger = require("../../config/logger");
const env = require("../../config/env");

const transporter = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpSecure,
  auth: {
    user: env.smtpUser,
    pass: env.smtpPass,
  },
});

function getBaseHtml(title, body, buttonText, buttonLink) {
  const buttonHtml = (buttonText && buttonLink)
    ? `<div style="margin-top: 24px; margin-bottom: 24px;">
         <a href="${buttonLink}" class="button" style="display: inline-block; background-color: #3b82f6; color: #ffffff !important; font-weight: 600; font-size: 13px; text-decoration: none; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);">${buttonText}</a>
       </div>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f9fafb; color: #111827; margin: 0; padding: 40px 20px; }
          .container { max-width: 580px; background-color: #ffffff; padding: 36px; border-radius: 16px; border: 1px solid #f3f4f6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); margin: 0 auto; }
          .header { font-size: 18px; font-weight: 800; letter-spacing: -0.025em; color: #2563eb; margin-bottom: 24px; text-transform: uppercase; }
          .title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 16px; }
          .body { font-size: 14px; line-height: 1.6; color: #4b5563; }
          .footer { font-size: 11px; color: #9ca3af; margin-top: 36px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">Smart Portal</div>
          <div class="title">${title}</div>
          <div class="body">
            ${body}
            ${buttonHtml}
          </div>
          <div class="footer">
            This email was sent because you are a registered user on Smart Portal. You can manage your notification preferences anytime under My Profile settings.
          </div>
        </div>
      </body>
    </html>
  `;
}

function resolveClientLink(link) {
  if (!link) return link;
  if (link.startsWith("http")) return link;

  const clientUrl = (env.clientUrl || "http://localhost:5173").replace(/\/$/, "");
  const normalizedPath = link.startsWith("/") ? link : `/${link}`;

  return `${clientUrl}${normalizedPath}`;
}

class EmailService {
  async sendMail({ to, subject, html }) {
    console.log("\n========================================");
    console.log(`✉️  SIMULATED EMAIL SENT TO: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("========================================\n");

    if (env.smtpUser && env.smtpPass) {
      try {
        const info = await transporter.sendMail({
          from: env.smtpFrom,
          to,
          subject,
          html,
        });
        logger.info(`Email successfully delivered to ${to} via SMTP. Message ID: ${info.messageId}`);
        return info;
      } catch (err) {
        logger.error(`Failed to send email via SMTP to ${to}: ${err.message}`);
      }
    }
    return null;
  }

  async sendInviteEmail(email, orgName, role, inviteLink) {
    const title = `You have been invited to join ${orgName}`;
    const body = `<p>Hi there,</p>
                  <p>You have been invited to join the <strong>${orgName}</strong> organization as a <strong>${role}</strong> on Smart Portal.</p>
                  <p>Click the button below to accept your invitation and access your workspace.</p>`;
    
    const html = getBaseHtml(title, body, "Accept Invitation", inviteLink);
    return this.sendMail({
      to: email,
      subject: `Invitation to join ${orgName} on Smart Portal`,
      html,
    });
  }

  async sendTaskAssignmentEmail(email, userName, taskTitle, projectTitle, link) {
    const title = `New Task Assigned: ${taskTitle}`;
    const body = `<p>Hi ${userName || "there"},</p>
                  <p>You have been assigned a new task: <strong>"${taskTitle}"</strong> in the project <strong>"${projectTitle}"</strong>.</p>
                  <p>Click below to open the project board and start collaborating.</p>`;
    
    // Normalize URL link if it is relative
    const fullLink = resolveClientLink(link);

    const html = getBaseHtml(title, body, "View Task on Board", fullLink);
    return this.sendMail({
      to: email,
      subject: `[Assigned] ${taskTitle} - Smart Portal`,
      html,
    });
  }

  async sendCommentNotificationEmail(email, commentAuthor, taskTitle, commentContent, link) {
    const title = `New Comment on "${taskTitle}"`;
    const body = `<p>Hi there,</p>
                  <p><strong>${commentAuthor}</strong> commented on your task <strong>"${taskTitle}"</strong>:</p>
                  <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 4px solid #3b82f6; background-color: #f3f4f6; font-style: italic; border-radius: 4px;">
                    "${commentContent}"
                  </blockquote>
                  <p>Click below to jump directly to the task discussions.</p>`;

    const fullLink = resolveClientLink(link);

    const html = getBaseHtml(title, body, "Reply to Comment", fullLink);
    return this.sendMail({
      to: email,
      subject: `[Comment] ${taskTitle}`,
      html,
    });
  }

  async sendWikiUpdateEmail(email, wikiTitle, updaterName, orgName, link) {
    const title = `Wiki Page Updated: ${wikiTitle}`;
    const body = `<p>Hi there,</p>
                  <p>The wiki page <strong>"${wikiTitle}"</strong> in the organization <strong>"${orgName}"</strong> has been updated by <strong>${updaterName}</strong>.</p>
                  <p>Click below to read the latest version of the document.</p>`;

    const fullLink = resolveClientLink(link);

    const html = getBaseHtml(title, body, "View Document", fullLink);
    return this.sendMail({
      to: email,
      subject: `[Wiki Update] ${wikiTitle} - ${orgName}`,
      html,
    });
  }

  async sendDeadlineReminderEmail(email, userName, taskTitle, dueTime, link) {
    const title = `Deadline Warning: ${taskTitle}`;
    const body = `<p>Hi ${userName || "there"},</p>
                  <p>This is an automated reminder that your assigned task <strong>"${taskTitle}"</strong> is due soon.</p>
                  <p><strong>Due Date:</strong> ${new Date(dueTime).toLocaleString()}</p>
                  <p>Please update the task status on the project board once completed.</p>`;

    const fullLink = resolveClientLink(link);

    const html = getBaseHtml(title, body, "View Task Board", fullLink);
    return this.sendMail({
      to: email,
      subject: `[Urgent Reminder] ${taskTitle} - Due Soon`,
      html,
    });
  }
}

module.exports = new EmailService();

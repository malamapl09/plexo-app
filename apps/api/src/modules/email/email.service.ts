import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sesClient: SESv2Client | null;
  private readonly fromEmail: string | undefined;
  private readonly appUrl: string;
  private readonly appName: string;

  constructor(private readonly config: ConfigService) {
    this.fromEmail = this.config.get<string>('AWS_SES_FROM_EMAIL');
    this.appUrl = this.config.get<string>('APP_URL', 'http://localhost:3000');
    this.appName = this.config.get<string>('APP_NAME', 'Plexo');

    if (this.fromEmail) {
      const region = this.config.get<string>('AWS_SES_REGION', 'us-east-1');
      this.sesClient = new SESv2Client({ region });
      this.logger.log(`Email service initialized — from: ${this.fromEmail} (region: ${region})`);
    } else {
      this.sesClient = null;
      this.logger.warn('AWS_SES_FROM_EMAIL not set — email service running in mock mode');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.sesClient || !this.fromEmail) {
      this.logger.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
      this.logger.debug(`[EMAIL MOCK] HTML preview:\n${html.replace(/<[^>]+>/g, '').trim().slice(0, 300)}`);
      return;
    }

    const command = new SendEmailCommand({
      FromEmailAddress: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
        },
      },
    });

    await this.sesClient.send(command);
    this.logger.log(`Email sent to ${to} — subject: "${subject}"`);
  }

  async sendWelcome(
    email: string,
    orgName: string,
    tempPassword: string,
  ): Promise<void> {
    const safeOrg = escapeHtml(orgName);
    const safeEmail = escapeHtml(email);
    const safePwd = escapeHtml(tempPassword);
    const subject = `Welcome to ${this.appName} — ${orgName}`;
    const html = this.buildLayout(`
      <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Welcome to ${escapeHtml(this.appName)}</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">You have been added to <strong>${safeOrg}</strong>.</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;">Your temporary login credentials:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        <tr>
          <td style="padding:16px;background:#f3f4f6;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Email</p>
            <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">${safeEmail}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Temporary Password</p>
            <p style="margin:0;font-size:15px;color:#111827;font-weight:600;letter-spacing:1px;">${safePwd}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 24px;color:#6b7280;font-size:13px;">
        You will be prompted to change your password on first login. Keep this email safe.
      </p>
      <a href="${this.appUrl}/login"
         style="display:inline-block;padding:12px 28px;background:#111827;color:#ffffff;
                border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Log In Now
      </a>
    `);

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordReset(email: string, resetUrl: string): Promise<void> {
    const subject = `Reset your ${this.appName} password`;
    const html = this.buildLayout(`
      <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">Reset Your Password</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
        We received a request to reset the password for your ${this.appName} account.
        Click the button below to choose a new password.
      </p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 28px;background:#111827;color:#ffffff;
                border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Reset Password
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
        This link expires in 1 hour. If you did not request a password reset, you can safely
        ignore this email — your account will remain unchanged.
      </p>
    `);

    await this.sendEmail(email, subject, html);
  }

  async sendInvitation(
    email: string,
    orgName: string,
    inviterName: string,
    inviteUrl: string,
  ): Promise<void> {
    const safeInviter = escapeHtml(inviterName);
    const safeOrg = escapeHtml(orgName);
    const subject = `${inviterName} invited you to join ${orgName} on ${this.appName}`;
    const html = this.buildLayout(`
      <h1 style="margin:0 0 8px;font-size:24px;color:#111827;">You're Invited</h1>
      <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
        <strong>${safeInviter}</strong> has invited you to join <strong>${safeOrg}</strong>
        on ${escapeHtml(this.appName)}. Accept the invitation below to get started.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;padding:12px 28px;background:#111827;color:#ffffff;
                border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">
        Accept Invitation
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">
        This invitation link expires in 7 days. If you did not expect this invitation,
        you can safely ignore this email.
      </p>
    `);

    await this.sendEmail(email, subject, html);
  }

  private buildLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${this.appName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#f3f4f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
                ${this.appName}
              </span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;background:#ffffff;border-radius:12px;
                      box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:560px;">
          <tr>
            <td style="padding:24px 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${this.appName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

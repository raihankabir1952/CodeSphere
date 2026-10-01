import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationToken: string,
  ) {
    const verificationUrl = `http://localhost:3000/verify-email?token=${verificationToken}`;

    await this.resend.emails.send({
      from: 'CodeSphere <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your CodeSphere account',
      html: `
        <h2>Welcome to CodeSphere, ${name}!</h2>

        <p>Thanks for creating your account.</p>

        <p>Please click the button below to verify your email address:</p>

        <p>
          <a
            href="${verificationUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #000;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Verify Email
          </a>
        </p>

        <p>This verification link will expire in 15 minutes.</p>

        <p>If you did not create this account, you can ignore this email.</p>
      `,
    });
  }
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetToken: string,
  ) {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

    await this.resend.emails.send({
      from: 'CodeSphere <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your CodeSphere password',
      html: `
      <h2>Password Reset Request</h2>

      <p>Hello ${name},</p>

      <p>
        We received a request to reset your CodeSphere password.
      </p>

      <p>
        Click the button below to create a new password:
      </p>

      <p>
        <a
          href="${resetUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 6px;
          "
        >
          Reset Password
        </a>
      </p>

      <p>
        This password reset link will expire in 15 minutes.
      </p>

      <p>
        If you did not request a password reset, you can ignore this email.
      </p>
    `,
    });
  }
}
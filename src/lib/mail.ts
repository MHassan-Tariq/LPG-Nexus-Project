import nodemailer from "nodemailer";

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM = "LPG Management System <no-reply@lpgnexus.com>",
} = process.env;

// Check if email is properly configured
const isEmailConfigured = () => {
  return EMAIL_HOST && EMAIL_USER && EMAIL_PASSWORD && EMAIL_HOST !== "smtp.yourprovider.com";
};

// Create mail transport only if email is configured
const createMailTransport = () => {
  if (!isEmailConfigured()) {
    return null;
  }

const port = EMAIL_PORT ? Number(EMAIL_PORT) : 587;
  return nodemailer.createTransport({
  host: EMAIL_HOST,
  port,
  secure: port === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

export async function sendOtpEmail(email: string, code: string, username?: string | null): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: "Email service is not configured. Please contact your administrator or configure email settings in the environment variables.",
    };
  }

  try {
    const transport = createMailTransport();
    if (!transport) {
      return {
        success: false,
        error: "Failed to initialize email service. Please check your email configuration.",
      };
    }

    const usernameSection = username 
      ? `<div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #1c5bff; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: #1c5bff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 20px; font-weight: bold;">👤</span>
            </div>
            <div>
              <p style="color: #0369a1; font-size: 13px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Username</p>
              <p style="font-size: 20px; font-weight: bold; color: #0c4a6e; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 1px;">${username}</p>
            </div>
          </div>
          <p style="color: #0369a1; font-size: 13px; margin: 12px 0 0 0; line-height: 1.5;">
            Use this username along with your password to access your account.
          </p>
        </div>`
      : '';

    await transport.sendMail({
      to: email,
      from: EMAIL_FROM,
      subject: "LPG Management System: Password Reset Code",
      text: username 
        ? `Your password reset request has been received.\n\nYour Username: ${username}\n\nUse this username along with your password to log in.\n\nReset Code: ${code}\n\nThis code expires in 10 minutes.\n\nIf you did not request this password reset, please ignore this email.`
        : `Use the following one-time password to complete your action: ${code}\n\nThis code expires in 10 minutes.`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - LPG Management System</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1c5bff 0%, #1647c4 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">
                      LPG Management System
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 8px 0 0 0; font-weight: 400;">
                      Professional Cylinder Management Solution
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 16px 0; line-height: 1.3;">
                      Password Reset Request
                    </h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      We received a request to reset your password. Use the verification code below to complete the process. This code will expire in <strong>10 minutes</strong> for your security.
                    </p>
                    
                    ${usernameSection}
                    
                    <!-- OTP Code Box -->
                    <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px dashed #d1d5db; border-radius: 12px; padding: 32px 24px; margin: 32px 0; text-align: center;">
                      <p style="color: #6b7280; font-size: 13px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">
                        Your Verification Code
                      </p>
                      <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; display: inline-block; margin: 8px 0;">
                        <p style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #1c5bff; margin: 0; font-family: 'Courier New', monospace;">
                          ${code}
                        </p>
                      </div>
                      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; font-weight: 500;">
                        ⏱️ Expires in 10 minutes
                      </p>
                    </div>

                    <!-- Security Notice -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0;">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>🔒 Security Notice:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged and no changes will be made to your account.
                      </p>
                    </div>

                    <!-- Instructions -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                        What to do next:
                      </p>
                      <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Return to the password reset page</li>
                        <li>Enter the verification code shown above</li>
                        <li>Create your new secure password</li>
                        <li>Log in with your username and new password</li>
                      </ol>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                      This is an automated message from <strong>LPG Management System</strong>. Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 16px 0 0 0; text-align: center; line-height: 1.5;">
                      © ${new Date().getFullYear()} LPG Management System. All rights reserved.<br>
                      For support, please contact your system administrator.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email. Please check your email configuration.",
    };
  }
}

export async function sendFactoryResetOtpEmail(email: string, code: string, username?: string | null): Promise<{ success: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return {
      success: false,
      error: "Email service is not configured. Please contact your administrator or configure email settings in the environment variables.",
    };
  }

  try {
    const transport = createMailTransport();
    if (!transport) {
      return {
        success: false,
        error: "Failed to initialize email service. Please check your email configuration.",
      };
    }

    const usernameSection = username 
      ? `<div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #1c5bff; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: #1c5bff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="color: white; font-size: 20px; font-weight: bold;">👤</span>
            </div>
            <div>
              <p style="color: #0369a1; font-size: 13px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Username</p>
              <p style="font-size: 20px; font-weight: bold; color: #0c4a6e; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 1px;">${username}</p>
            </div>
          </div>
          <p style="color: #0369a1; font-size: 13px; margin: 12px 0 0 0; line-height: 1.5;">
            Use this username to access your account after the reset process.
          </p>
        </div>`
      : '';

    await transport.sendMail({
    to: email,
    from: EMAIL_FROM,
      subject: "LPG Management System: Factory Reset Verification Code",
      text: username
        ? `A factory reset has been requested for your LPG Management System.\n\nYour Username: ${username}\n\nUse this username to log in to your account.\n\nVerification Code: ${code}\n\n⚠️ WARNING: This code will permanently delete ALL data from your system, restoring it to a brand-new state.\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email and secure your account immediately.`
        : `A factory reset has been requested for your LPG Management System.\n\nVerification Code: ${code}\n\n⚠️ WARNING: This code will permanently delete ALL data from your system, restoring it to a brand-new state.\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email and secure your account immediately.`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Factory Reset Verification - LPG Management System</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with Warning Theme -->
                <tr>
                  <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 32px 40px; text-align: center;">
                    <div style="width: 60px; height: 60px; background-color: rgba(255, 255, 255, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                      <span style="color: #ffffff; font-size: 32px;">⚠️</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: -0.5px;">
                      Factory Reset Request
                    </h1>
                    <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0; font-weight: 400;">
                      Critical System Operation
                    </p>
                  </td>
                </tr>

                <!-- Main Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                      A <strong>factory reset</strong> has been requested for your <strong>LPG Management System</strong>. This is a critical operation that requires verification.
                    </p>
                    
                    ${usernameSection}
                    
                    <!-- Critical Warning Box -->
                    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #dc2626; border-radius: 12px; padding: 24px; margin: 32px 0;">
                      <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                        <div style="width: 32px; height: 32px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                          <span style="color: white; font-size: 18px; font-weight: bold;">!</span>
                        </div>
                        <div style="flex: 1;">
                          <p style="color: #991b1b; font-size: 15px; font-weight: 700; margin: 0 0 8px 0;">
                            ⚠️ CRITICAL WARNING: Irreversible Action
                          </p>
                          <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">
                            This action will <strong>permanently delete ALL data</strong> from your system, including:
                          </p>
                          <ul style="color: #7f1d1d; font-size: 13px; line-height: 1.8; margin: 12px 0 0 0; padding-left: 20px;">
                            <li>All customer records and information</li>
                            <li>Cylinder inventory and delivery records</li>
                            <li>Payment logs and billing information</li>
                            <li>Expense records and transactions</li>
                            <li>Daily notes and entries</li>
                            <li>System settings and user accounts (except Super Admin)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Verification Code Box -->
                    <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border: 2px dashed #d1d5db; border-radius: 12px; padding: 32px 24px; margin: 32px 0; text-align: center;">
                      <p style="color: #6b7280; font-size: 13px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1px;">
                        Verification Code
                      </p>
                      <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; display: inline-block; margin: 8px 0;">
                        <p style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #dc2626; margin: 0; font-family: 'Courier New', monospace;">
                          ${code}
                        </p>
                      </div>
                      <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0; font-weight: 500;">
                        ⏱️ Expires in 10 minutes
                      </p>
                    </div>

                    <!-- Security Alert -->
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 24px 0;">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>🔒 Security Alert:</strong> If you did not request this factory reset, please <strong>ignore this email immediately</strong> and contact your system administrator. Your account may be at risk.
                      </p>
                    </div>

                    <!-- Next Steps -->
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
                      <p style="color: #374151; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
                        Important Reminders:
                      </p>
                      <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li>Ensure you have created a recent backup before proceeding</li>
                        <li>All data will be permanently lost except the Super Admin account</li>
                        <li>The system will restart in a clean, fresh state</li>
                        <li>This action cannot be undone</li>
                      </ul>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                      This is a critical security notification from <strong>LPG Management System</strong>. Please do not reply to this email.
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 16px 0 0 0; text-align: center; line-height: 1.5;">
                      © ${new Date().getFullYear()} LPG Management System. All rights reserved.<br>
                      For support, please contact your system administrator immediately.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email. Please check your email configuration.",
    };
  }
}


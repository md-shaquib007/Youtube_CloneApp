import nodemailer from "nodemailer";

/**
 * Recommended provider: Resend (https://resend.com)
 * - Free: 3,000 emails/month (you need <100 — plenty of headroom)
 * - Signup: email or GitHub, no credit card
 * - Quick test: set RESEND_API_KEY only → uses onboarding@resend.dev
 * - Production: add your domain in Resend dashboard, set EMAIL_FROM
 *
 * One app account (RESEND_API_KEY) sends TO every new user's email address.
 */

const useResend = () => Boolean(process.env.RESEND_API_KEY);

const isEmailConfigured = () =>
    useResend() ||
    Boolean(
        process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS
    );

const getFromAddress = () => {
    if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
    if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
    if (useResend()) return '"ChaiTube" <onboarding@resend.dev>';
    return `"ChaiTube" <${process.env.SMTP_USER}>`;
};

const createTransporter = () => {
    if (useResend()) {
        return nodemailer.createTransport({
            host: "smtp.resend.com",
            port: 587,
            secure: false,
            auth: {
                user: "resend",
                pass: process.env.RESEND_API_KEY,
            },
        });
    }

    if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
    ) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendVerificationEmail = async (user, token) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const subject = "Verify your ChaiTube account";
    const html = `
        <div style="font-family: sans-serif; max-width: 480px;">
            <h2>Welcome to ChaiTube, ${user.fullName}!</h2>
            <p>Click the button below to verify your email address:</p>
            <p>
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:12px 24px;background:#ff0033;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
                    Verify Email
                </a>
            </p>
            <p style="color:#666;font-size:14px;">Or copy this link:<br>${verifyUrl}</p>
            <p style="color:#666;font-size:14px;">This link expires in 24 hours.</p>
        </div>
    `;

    const text = `Welcome to ChaiTube, ${user.fullName}!\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`;

    if (!isEmailConfigured()) {
        console.log("\n--- Email verification (dev mode — no Resend key) ---");
        console.log(`To:   ${user.email}`);
        console.log(`Link: ${verifyUrl}`);
        console.log("Tip: add RESEND_API_KEY to .env for real emails");
        console.log("---------------------------------------------------\n");
        return;
    }

    const transporter = createTransporter();

    try {
        await transporter.sendMail({
            from: getFromAddress(),
            to: user.email,
            replyTo: process.env.EMAIL_REPLY_TO || undefined,
            subject,
            text,
            html,
        });

        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error("Failed to send verification email:", error.message);

        if (useResend() && !process.env.EMAIL_FROM?.includes("@")) {
            console.error(
                "Resend tip: without a verified domain, use EMAIL_FROM with onboarding@resend.dev and register with the same email as your Resend account."
            );
        }

        throw error;
    }
};

export { sendVerificationEmail, isEmailConfigured, useResend };

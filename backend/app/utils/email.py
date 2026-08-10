import logging
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    plain_text: Optional[str] = None,
) -> bool:
    """Send an email via SMTP."""
    if not settings.SMTP_USER:
        logger.warning("SMTP not configured — email not sent")
        return False

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    message["To"] = to_email

    if plain_text:
        message.attach(MIMEText(plain_text, "plain"))
    message.attach(MIMEText(html_content, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_verification_email(email: str, full_name: str, token: str) -> bool:
    """Send email verification link."""
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html = f"""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #2563EB, #0EA5E9); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0;">🎯 AI Interview Portal</h1>
    </div>
    <h2>Welcome, {full_name}!</h2>
    <p>Thank you for registering. Please verify your email address to activate your account.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{verify_url}" style="background: #2563EB; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
    </body></html>
    """
    return await send_email(email, "Verify Your Email — AI Interview Portal", html)


async def send_password_reset_email(email: str, full_name: str, token: str) -> bool:
    """Send password reset link."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    html = f"""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #2563EB, #0EA5E9); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0;">🎯 AI Interview Portal</h1>
    </div>
    <h2>Password Reset Request</h2>
    <p>Hi {full_name}, we received a request to reset your password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{reset_url}" style="background: #EF4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </body></html>
    """
    return await send_email(email, "Reset Your Password — AI Interview Portal", html)


async def send_achievement_email(email: str, full_name: str, achievement_name: str, icon: str) -> bool:
    """Send achievement unlocked notification."""
    html = f"""
    <html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #F59E0B, #EF4444); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
      <div style="font-size: 64px; margin-bottom: 10px;">{icon}</div>
      <h1 style="color: white; margin: 0;">Achievement Unlocked!</h1>
    </div>
    <h2>Congratulations, {full_name}! 🎉</h2>
    <p>You've earned the <strong>{achievement_name}</strong> badge!</p>
    <p>Keep up the great work and continue your interview preparation journey.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{settings.FRONTEND_URL}/achievements" style="background: #2563EB; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
        View My Achievements
      </a>
    </div>
    </body></html>
    """
    return await send_email(email, f"🏆 Achievement Unlocked: {achievement_name}", html)

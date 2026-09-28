import asyncio
from datetime import date, timedelta
from typing import Any, Dict
from arq import cron
from arq.connections import RedisSettings
from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.operations import Warranty


async def send_transactional_email(ctx: Dict[str, Any], to_email: str, subject: str, content: str):
    print(f"📧 [Email Worker] Sending email to {to_email} | Subject: {subject}")
    # In production, integrate Resend or SendGrid API
    await asyncio.sleep(0.5)
    return {"status": "sent", "to": to_email}


async def check_warranty_expirations(ctx: Dict[str, Any]):
    print("⏰ [Cron Worker] Running daily warranty expiration scanner...")
    today = date.today()
    in_30_days = today + timedelta(days=30)
    in_7_days = today + timedelta(days=7)

    async with AsyncSessionLocal() as db:
        # Check 30-day alerts
        stmt_30 = select(Warranty).where(
            Warranty.end_date <= in_30_days,
            Warranty.alert_sent_30d == False,
        )
        res_30 = await db.execute(stmt_30)
        for w in res_30.scalars():
            print(f"⚠️ Warranty {w.contract_number} expires within 30 days! Sending alert...")
            w.alert_sent_30d = True

        # Check 7-day alerts
        stmt_7 = select(Warranty).where(
            Warranty.end_date <= in_7_days,
            Warranty.alert_sent_7d == False,
        )
        res_7 = await db.execute(stmt_7)
        for w in res_7.scalars():
            print(f"🚨 Warranty {w.contract_number} expires within 7 days! Sending critical alert...")
            w.alert_sent_7d = True

        await db.commit()


async def startup(ctx: Dict[str, Any]):
    print("🚀 ARQ Worker started and connected to Redis.")


async def shutdown(ctx: Dict[str, Any]):
    print("🛑 ARQ Worker shutting down cleanly.")


class WorkerSettings:
    functions = [send_transactional_email]
    cron_jobs = [
        cron(check_warranty_expirations, hour=1, minute=0),  # Runs daily at 01:00 UTC
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)

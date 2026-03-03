"""Production settings for EduAdmin."""
from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = [config("DOMAIN_NAME")]

# ─── Static + Media files via S3 ────────────────────────────────────────────
DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
STATICFILES_STORAGE = "storages.backends.s3boto3.S3StaticStorage"
AWS_ACCESS_KEY_ID = config("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = config("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = config("AWS_BUCKET_NAME")
AWS_S3_REGION_NAME = config("AWS_REGION")

# ─── Security ────────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# ─── Sentry ──────────────────────────────────────────────────────────────────
import sentry_sdk

sentry_sdk.init(dsn=config("SENTRY_DSN"), traces_sample_rate=0.1)

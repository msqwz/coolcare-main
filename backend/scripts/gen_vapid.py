#!/usr/bin/env python3
"""Generate VAPID keys for Web Push. Run: pip install py_vapid && python scripts/gen_vapid.py"""
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

try:
    from py_vapid import vapid
    k = vapid.Vapid()
    k.generate_keys()
    logger.info("Add to .env:")
    logger.info(f"VAPID_PUBLIC_KEY={k.public_key.decode()}")
    logger.info(f"VAPID_PRIVATE_KEY={k.private_key.decode()}")
except ImportError:
    logger.error("Install: pip install py_vapid")

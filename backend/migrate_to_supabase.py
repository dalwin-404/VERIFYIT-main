# migrate_to_supabase.py
# Migrates local JSON files (users, verifications, reports) to Supabase tables.

import os
import json
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

# Load .env variables
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file.")
    exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}")
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# File paths
USERS_FILE = os.path.join(BASE_DIR, "users.json")
VERIFICATIONS_FILE = os.path.join(BASE_DIR, "verifications.json")
REPORTS_FILE = os.path.join(BASE_DIR, "reports.json")

def migrate_users():
    if not os.path.exists(USERS_FILE):
        print("Warning: No users.json file found. Skipping user migration.")
        return {}

    print("Migrating users...")
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            users_data = json.load(f)
        except json.JSONDecodeError:
            print("Error: Failed to parse users.json.")
            return {}

    user_mapping = {}
    for username, data in users_data.items():
        user_record = {
            "username": data.get("username", username),
            "email": data.get("email"),
            "password_hash": data.get("password_hash"),
            "created_at": data.get("created_at", datetime.utcnow().isoformat())
        }

        try:
            # Upsert into Supabase
            response = supabase.table("verifyit_users").upsert([user_record], on_conflict="username").execute()
            print(f"  Migrated user: {user_record['username']}")
            user_mapping[username] = user_record["username"]
        except Exception as e:
            print(f"  Failed to migrate user {username}: {e}")

    return user_mapping

def migrate_verifications(user_mapping):
    if not os.path.exists(VERIFICATIONS_FILE):
        print("Warning: No verifications.json file found. Skipping verifications migration.")
        return

    print("Migrating verification logs...")
    with open(VERIFICATIONS_FILE, "r", encoding="utf-8") as f:
        try:
            verifications_data = json.load(f)
        except json.JSONDecodeError:
            print("Error: Failed to parse verifications.json.")
            return

    success_count = 0
    for idx, entry in enumerate(verifications_data):
        raw_user = entry.get("user")
        # Map local user username to migrated username
        mapped_user = user_mapping.get(raw_user, raw_user)

        # Convert timestamp to ISO with timezone if needed
        ts = entry.get("timestamp")
        if ts and "Z" not in ts and "+" not in ts:
            ts += "+00:00"

        verification_record = {
            "type": entry.get("type", "text"),
            "content": entry.get("content", ""),
            "score": float(entry.get("score", 0.0)),
            "verdict": entry.get("verdict", "Uncertain"),
            "user": mapped_user,
            "timestamp": ts,
            "metadata": entry.get("metadata", {})
        }

        try:
            supabase.table("verifyit_verifications").insert([verification_record]).execute()
            success_count += 1
        except Exception as e:
            print(f"  Failed to migrate verification ID {entry.get('id')}: {e}")

    print(f"Successfully migrated {success_count}/{len(verifications_data)} verifications.")

def migrate_reports():
    if not os.path.exists(REPORTS_FILE):
        print("Warning: No reports.json file found. Skipping reports migration.")
        return

    print("Migrating user reports...")
    with open(REPORTS_FILE, "r", encoding="utf-8") as f:
        try:
            reports_data = json.load(f)
        except json.JSONDecodeError:
            print("Error: Failed to parse reports.json.")
            return

    if not reports_data:
        print("Reports list is empty. Nothing to migrate.")
        return

    success_count = 0
    for entry in reports_data:
        # Convert timestamp to ISO with timezone if needed
        ts = entry.get("timestamp")
        if ts and "Z" not in ts and "+" not in ts:
            ts += "+00:00"

        report_record = {
            "content": entry.get("content", ""),
            "reason": entry.get("reason", ""),
            "source_url": entry.get("source_url"),
            "category": entry.get("category", "misinformation"),
            "user": entry.get("user"),
            "timestamp": ts
        }

        try:
            supabase.table("verifyit_reports").insert([report_record]).execute()
            success_count += 1
        except Exception as e:
            print(f"  Failed to migrate report: {e}")

    print(f"Successfully migrated {success_count}/{len(reports_data)} user reports.")

if __name__ == "__main__":
    print("Starting VerifyIt Supabase Migration...")
    user_map = migrate_users()
    migrate_verifications(user_map)
    migrate_reports()
    print("\nMigration completed successfully!")

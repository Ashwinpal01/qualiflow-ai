import sqlite3
from pathlib import Path


database_path = Path("data/sales_agent.db").resolve()

print(f"Updating database: {database_path}")

connection = sqlite3.connect(database_path)

try:
    existing_columns = {
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(leads)"
        ).fetchall()
    }

    required_columns = {
    "lead_score": "INTEGER",
    "qualification": "VARCHAR(50)",
    "recommended_action": "VARCHAR(255)",
    "detected_intent": "VARCHAR(100)",
    "email_subject": "VARCHAR(255)",
    "email_draft": "TEXT",
     }

    for column_name, column_type in required_columns.items():
        if column_name not in existing_columns:
            connection.execute(
                f"ALTER TABLE leads "
                f"ADD COLUMN {column_name} {column_type}"
            )
            print(f"Added column: {column_name}")
        else:
            print(f"Column already exists: {column_name}")

    connection.commit()

    final_columns = [
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(leads)"
        ).fetchall()
    ]

    print("\nCurrent columns:")
    print(final_columns)

finally:
    connection.close()
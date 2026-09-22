from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

# Enable foreign keys for SQLite
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def run_migrations():
    """
    Ensures missing columns added in schema updates are automatically applied
    to existing SQLite or PostgreSQL databases.
    """
    with engine.connect() as conn:
        if settings.DATABASE_URL.startswith("sqlite"):
            from sqlalchemy import text
            try:
                # Check columns in cases table
                res = conn.execute(text("PRAGMA table_info(cases)")).fetchall()
                existing_cols = {row[1] for row in res}
                
                new_columns = [
                    ("channel", "VARCHAR(50) DEFAULT 'PORTAL'"),
                    ("source_id", "VARCHAR(255)"),
                    ("citizen_name", "VARCHAR(255)"),
                    ("source_username", "VARCHAR(255)"),
                    ("source_url", "VARCHAR(500)"),
                    ("location_status", "VARCHAR(50) DEFAULT 'RESOLVED'"),
                    ("location_requested_at", "DATETIME"),
                    ("location_resolved_at", "DATETIME"),
                    ("location_confidence", "FLOAT DEFAULT 1.0"),
                    ("notification_sent", "BOOLEAN DEFAULT 0"),
                    ("last_notification_platform", "VARCHAR(50)"),
                    ("last_notification_at", "DATETIME"),
                    ("last_notification_status", "VARCHAR(50)"),
                ]
                for col_name, col_type in new_columns:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE cases ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception as e:
                # Table might not exist yet, Base.metadata.create_all will create it
                pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


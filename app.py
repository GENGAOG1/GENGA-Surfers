import os
import re
import json
import uuid
import secrets
import string
from datetime import datetime, timedelta
from functools import wraps

import bcrypt
import libsql
from flask import (
    Flask, render_template, request, jsonify, session,
    g, send_from_directory, make_response
)
from werkzeug.middleware.proxy_fix import ProxyFix

# ------------------------------------------------------------------
# App-Setup
# ------------------------------------------------------------------
app = Flask(__name__, static_folder="static", static_url_path="/static", template_folder="templates")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=90)
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True

TURSO_URL = os.environ.get("TURSO_DATABASE_URL", "")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", "")
OWNER_EMAIL = (os.environ.get("OWNER_EMAIL") or "").strip().lower()

USE_TURSO = bool(TURSO_URL and TURSO_TOKEN)


# ------------------------------------------------------------------
# Datenbank
# ------------------------------------------------------------------
def get_db():
    if "db" not in g:
        if USE_TURSO:
            g.db = libsql.connect(database=TURSO_URL, auth_token=TURSO_TOKEN)
        else:
            import sqlite3
            g.db = sqlite3.connect("genga.db")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        try:
            db.close()
        except Exception:
            pass


_schema_ready = False


def ensure_tables():
    """Legt Tabellen an. Wird lazy beim ersten Request ausgeführt."""
    global _schema_ready
    if _schema_ready:
        return
    db = get_db()
    try:
        db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT,
                display_name TEXT NOT NULL,
                role TEXT DEFAULT 'player',
                is_guest INTEGER DEFAULT 0,
                created_at INTEGER DEFAULT (unixepoch())
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS saves (
                user_id TEXT PRIMARY KEY,
                score INTEGER DEFAULT 0,
                coins INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                difficulty TEXT DEFAULT 'normal',
                upgrades TEXT DEFAULT '{}',
                updated_at INTEGER DEFAULT (unixepoch())
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT,
                created_at INTEGER DEFAULT (unixepoch()),
                expires_at INTEGER
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                display_name TEXT,
                score INTEGER,
                created_at INTEGER DEFAULT (unixepoch())
            )
        """)
        db.commit()
        _schema_ready = True
    except Exception as e:
        print(f"[WARN] ensure_tables: {e}")


@app.before_request
def _ensure():
    ensure_tables()


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def new_id():
    return str(uuid.uuid4())


def new_token():
    return secrets.token_hex(32)


def now_ts():
    return int(datetime.utcnow().timestamp())


def row_to_dict(cursor_row, columns=None):
    if cursor_row is None:
        return None
    if columns is None:
        return dict(cursor_row)
    return dict(zip(columns, cursor_row))


def fetch_user_by_id(uid):
    db = get_db()
    row = db.execute(
        "SELECT id, email, password_hash, display_name, role, is_guest, created_at "
        "FROM users WHERE id = ?",
        (uid,)
    ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "display_name": row[3],
        "role": row[4],
        "is_guest": row[5],
        "created_at": row[6],
    }


def fetch_user_by_email(email):
    db = get_db()
    row = db.execute(
        "SELECT id, email, password_hash, display_name, role, is_guest, created_at "
        "FROM users WHERE email = ?",
        (email,)
    ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "password_hash": row[2],
        "display_name": row[3],
        "role": row[4],
        "is_guest": row[5],
        "created_at": row[6],
    }


def fetch_save(user_id):
    db = get_db()
    row = db.execute(
        "SELECT user_id, score, coins, best_score, difficulty, upgrades, updated_at "
        "FROM saves WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    if not row:
        return None
    try:
        upgrades = json.loads(row[5] or "{}")
    except Exception:
        upgrades = {}
    return {
        "user_id": row[0],
        "score": row[1] or 0,
        "coins": row[2] or 0,
        "best_score": row[3] or 0,
        "difficulty": row[4] or "normal",
        "upgrades": upgrades,
        "updated_at": row[6],
    }


def get_user_from_session():
    token = request.cookies.get("session")
    if not token:
        return None
    db = get_db()
    row = db.execute(
        "SELECT u.id, u.email, u.display_name, u.role, u.is_guest "
        "FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ? AND s.expires_at > unixepoch()",
        (token,)
    ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "email": row[1],
        "display_name": row[2],
        "role": row[3],
        "is_guest": row[4],
    }


def create_session(user_id, days=90):
    token = new_token()
    expires = int((datetime.utcnow() + timedelta(days=days)).timestamp())
    db = get_db()
    db.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        (token, user_id, expires)
    )
    db.commit()
    return token


def set_session_cookie(resp, token, days=90):
    resp.set_cookie(
        "session", token,
        max_age=days * 24 * 60 * 60,
        httponly=True,
        samesite="Lax",
        secure=True,
        path="/",
    )
    return resp


def require_auth(role=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_user_from_session()
            if not user:
                return jsonify({"error": "Nicht eingeloggt"}), 401
            if role and user["role"] not in (role, "owner"):
                return jsonify({"error": "Kein Zugriff"}), 403
            request.user = user
            return fn(*args, **kwargs)
        return wrapper
    return decorator


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def valid_email(email):
    return bool(EMAIL_RE.match(email or ""))


# ------------------------------------------------------------------
# Pages
# ------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin_page():
    return render_template("admin.html")


@app.route("/manifest.json")
def manifest():
    return send_from_directory("static", "manifest.json", mimetype="application/manifest+json")


@app.route("/service-worker.js")
def service_worker():
    return send_from_directory("static", "service-worker.js", mimetype="application/javascript")


@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "icon.svg", mimetype="image/svg+xml")


@app.route("/health")
def health():
    try:
        db = get_db()
        db.execute("SELECT 1").fetchone()
        return jsonify({"status": "ok", "turso": "connected", "ts": now_ts()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
@app.route("/api/auth/guest", methods=["POST"])
def auth_guest():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if len(name) < 2:
        return jsonify({"error": "Name zu kurz"}), 400
    if len(name) > 24:
        return jsonify({"error": "Name zu lang"}), 400

    uid = new_id()
    db = get_db()
    db.execute(
        "INSERT INTO users (id, display_name, role, is_guest) VALUES (?, ?, 'guest', 1)",
        (uid, name)
    )
    db.execute("INSERT INTO saves (user_id) VALUES (?)", (uid,))
    db.commit()

    token = create_session(uid, days=365)
    resp = make_response(jsonify({
        "ok": True,
        "user": {"id": uid, "name": name, "role": "guest", "is_guest": True},
    }))
    return set_session_cookie(resp, token, days=365)


@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip() or (email.split("@")[0] if email else "Spieler")

    if not valid_email(email):
        return jsonify({"error": "Ungültige E-Mail"}), 400
    if len(password) < 6:
        return jsonify({"error": "Passwort zu kurz (min. 6)"}), 400
    if len(name) > 24:
        return jsonify({"error": "Name zu lang"}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({"error": "E-Mail existiert bereits"}), 409

    uid = new_id()
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    role = "owner" if email == OWNER_EMAIL else "player"

    db.execute(
        "INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)",
        (uid, email, pw_hash, name, role)
    )
    db.execute("INSERT INTO saves (user_id) VALUES (?)", (uid,))
    db.commit()

    token = create_session(uid, days=90)
    resp = make_response(jsonify({
        "ok": True,
        "user": {"id": uid, "name": name, "email": email, "role": role, "is_guest": False},
    }))
    return set_session_cookie(resp, token, days=90)


@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = fetch_user_by_email(email)
    if not user or not user["password_hash"]:
        return jsonify({"error": "Falsche Daten"}), 401
    try:
        ok = bcrypt.checkpw(password.encode(), user["password_hash"].encode())
    except Exception:
        ok = False
    if not ok:
        return jsonify({"error": "Falsche Daten"}), 401

    token = create_session(user["id"], days=90)
    resp = make_response(jsonify({
        "ok": True,
        "user": {
            "id": user["id"],
            "name": user["display_name"],
            "email": user["email"],
            "role": user["role"],
            "is_guest": False,
        },
    }))
    return set_session_cookie(resp, token, days=90)


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    token = request.cookies.get("session")
    if token:
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        db.commit()
    resp = make_response(jsonify({"ok": True}))
    resp.delete_cookie("session", path="/")
    return resp


@app.route("/api/me")
def me():
    user = get_user_from_session()
    if not user:
        return jsonify({"user": None})
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["display_name"],
            "email": user["email"],
            "role": user["role"],
            "is_guest": bool(user["is_guest"]),
        }
    })


# ------------------------------------------------------------------
# Save
# ------------------------------------------------------------------
@app.route("/api/save", methods=["GET"])
@require_auth()
def get_save():
    save = fetch_save(request.user["id"])
    if not save:
        return jsonify(None)
    return jsonify(save)


@app.route("/api/save", methods=["POST"])
@require_auth()
def post_save():
    d = request.get_json(silent=True) or {}
    upgrades = d.get("upgrades") or {}
    if isinstance(upgrades, dict):
        upgrades = json.dumps(upgrades)

    score = int(d.get("score", 0) or 0)
    coins = int(d.get("coins", 0) or 0)
    best = int(d.get("best_score", 0) or 0)
    difficulty = str(d.get("difficulty", "normal"))

    db = get_db()
    existing = db.execute("SELECT user_id FROM saves WHERE user_id = ?", (request.user["id"],)).fetchone()
    if existing:
        db.execute(
            "UPDATE saves SET score=?, coins=?, best_score=?, difficulty=?, upgrades=?, "
            "updated_at=unixepoch() WHERE user_id=?",
            (score, coins, best, difficulty, upgrades, request.user["id"])
        )
    else:
        db.execute(
            "INSERT INTO saves (user_id, score, coins, best_score, difficulty, upgrades) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (request.user["id"], score, coins, best, difficulty, upgrades)
        )

    if best > 0:
        db.execute(
            "INSERT INTO leaderboard (user_id, display_name, score) VALUES (?, ?, ?)",
            (request.user["id"], request.user["display_name"], best)
        )

    db.commit()
    return jsonify({"ok": True})


# ------------------------------------------------------------------
# Leaderboard
# ------------------------------------------------------------------
@app.route("/api/leaderboard")
def leaderboard():
    db = get_db()
    rows = db.execute("""
        SELECT display_name, MAX(score) AS score
        FROM leaderboard
        GROUP BY user_id
        ORDER BY score DESC
        LIMIT 50
    """).fetchall()
    return jsonify([{"display_name": r[0], "score": r[1]} for r in rows])


# ------------------------------------------------------------------
# Admin
# ------------------------------------------------------------------
@app.route("/api/admin/users")
@require_auth("admin")
def admin_users():
    db = get_db()
    rows = db.execute("""
        SELECT u.id, u.display_name, u.email, u.role, u.is_guest, u.created_at,
               s.best_score, s.coins, s.score
        FROM users u
        LEFT JOIN saves s ON s.user_id = u.id
        ORDER BY u.created_at DESC
    """).fetchall()
    return jsonify([
        {
            "id": r[0], "display_name": r[1], "email": r[2],
            "role": r[3], "is_guest": bool(r[4]), "created_at": r[5],
            "best_score": r[6] or 0, "coins": r[7] or 0, "score": r[8] or 0,
        }
        for r in rows
    ])


@app.route("/api/admin/users/<uid>/role", methods=["POST"])
@require_auth("owner")
def admin_set_role(uid):
    role = (request.get_json(silent=True) or {}).get("role")
    if role not in ("admin", "supporter", "player", "guest"):
        return jsonify({"error": "Ungültige Rolle"}), 400
    db = get_db()
    db.execute("UPDATE users SET role = ? WHERE id = ?", (role, uid))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/admin/users/<uid>", methods=["DELETE"])
@require_auth("owner")
def admin_delete_user(uid):
    db = get_db()
    db.execute("DELETE FROM sessions WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM saves WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM leaderboard WHERE user_id = ?", (uid,))
    db.execute("DELETE FROM users WHERE id = ?", (uid,))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/admin/stats")
@require_auth("admin")
def admin_stats():
    db = get_db()
    total = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    guests = db.execute("SELECT COUNT(*) FROM users WHERE is_guest = 1").fetchone()[0]
    plays = db.execute("SELECT COUNT(*) FROM leaderboard").fetchone()[0]
    return jsonify({
        "total_users": total,
        "guests": guests,
        "registered": total - guests,
        "total_runs": plays,
    })


# ------------------------------------------------------------------
# Start
# ------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

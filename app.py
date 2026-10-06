import os
import uuid
import secrets
import json
from datetime import datetime, timedelta, timezone

import bcrypt
from flask import (
    Flask, request, jsonify, render_template,
    make_response, send_from_directory, redirect
)
from libsql_client import create_client_sync
from werkzeug.middleware.proxy_fix import ProxyFix

# ------------------------------------------------------------------
# App-Setup
# ------------------------------------------------------------------
app = Flask(__name__, static_folder="static", template_folder="templates")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# ------------------------------------------------------------------
# Turso
# ------------------------------------------------------------------
TURSO_URL = os.environ.get("TURSO_DATABASE_URL")
TURSO_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")
OWNER_EMAIL = (os.environ.get("OWNER_EMAIL") or "").strip().lower()

if not TURSO_URL or not TURSO_TOKEN:
    raise RuntimeError("TURSO_DATABASE_URL und TURSO_AUTH_TOKEN müssen gesetzt sein.")

client = create_client_sync(url=TURSO_URL, auth_token=TURSO_TOKEN)


# ------------------------------------------------------------------
# Schema
# ------------------------------------------------------------------
def init_schema():
    client.execute("""
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
    client.execute("""
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
    client.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            expires_at INTEGER
        )
    """)
    client.execute("""
        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            display_name TEXT,
            score INTEGER,
            created_at INTEGER DEFAULT (unixepoch())
        )
    """)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def new_id():
    return str(uuid.uuid4())


def new_token():
    return secrets.token_hex(32)


def row_to_dict(result, row):
    return dict(zip(result.columns, row))


def get_user_from_request():
    token = request.cookies.get("session")
    if not token:
        return None
    r = client.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.token = ? AND s.expires_at > unixepoch()",
        [token],
    )
    if not r.rows:
        return None
    return row_to_dict(r, r.rows[0])


def require_auth(role=None):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            user = get_user_from_request()
            if not user:
                return jsonify({"error": "Nicht eingeloggt"}), 401
            if role and user["role"] not in (role, "owner"):
                return jsonify({"error": "Kein Zugriff"}), 403
            request.user = user
            return fn(*args, **kwargs)
        wrapper.__name__ = fn.__name__
        return wrapper
    return decorator


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


def create_session(user_id, days=90):
    token = new_token()
    expires = int((datetime.now(timezone.utc) + timedelta(days=days)).timestamp())
    client.execute(
        "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
        [token, user_id, expires],
    )
    return token


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
def sw():
    return send_from_directory("static", "service-worker.js", mimetype="application/javascript")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


@app.route("/favicon.ico")
def favicon():
    return send_from_directory("static", "icon.svg", mimetype="image/svg+xml")


@app.route("/health")
def health():
    try:
        client.execute("SELECT 1")
        return jsonify({"status": "ok", "turso": "connected", "ts": int(datetime.now().timestamp())})
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
    client.execute(
        "INSERT INTO users (id, display_name, role, is_guest) VALUES (?, ?, 'guest', 1)",
        [uid, name],
    )
    client.execute("INSERT INTO saves (user_id) VALUES (?)", [uid])

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
    name = (data.get("name") or "").strip() or email.split("@")[0]

    if not email or "@" not in email:
        return jsonify({"error": "Ungültige E-Mail"}), 400
    if len(password) < 6:
        return jsonify({"error": "Passwort zu kurz (min. 6)"}), 400
    if len(name) > 24:
        return jsonify({"error": "Name zu lang"}), 400

    existing = client.execute("SELECT id FROM users WHERE email = ?", [email])
    if existing.rows:
        return jsonify({"error": "E-Mail existiert bereits"}), 409

    uid = new_id()
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    role = "owner" if email == OWNER_EMAIL else "player"

    client.execute(
        "INSERT INTO users (id, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)",
        [uid, email, pw_hash, name, role],
    )
    client.execute("INSERT INTO saves (user_id) VALUES (?)", [uid])

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

    r = client.execute("SELECT * FROM users WHERE email = ?", [email])
    if not r.rows:
        return jsonify({"error": "Falsche Daten"}), 401

    user = row_to_dict(r, r.rows[0])
    if not user["password_hash"]:
        return jsonify({"error": "Falsche Daten"}), 401
    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
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
        client.execute("DELETE FROM sessions WHERE token = ?", [token])
    resp = make_response(jsonify({"ok": True}))
    resp.delete_cookie("session", path="/")
    return resp


@app.route("/api/me")
def me():
    user = get_user_from_request()
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
    r = client.execute("SELECT * FROM saves WHERE user_id = ?", [request.user["id"]])
    if not r.rows:
        return jsonify(None)
    save = row_to_dict(r, r.rows[0])
    try:
        save["upgrades"] = json.loads(save.get("upgrades") or "{}")
    except Exception:
        save["upgrades"] = {}
    return jsonify(save)


@app.route("/api/save", methods=["POST"])
@require_auth()
def post_save():
    d = request.get_json(silent=True) or {}
    upgrades = d.get("upgrades") or {}
    if isinstance(upgrades, dict):
        upgrades = json.dumps(upgrades)

    client.execute(
        "UPDATE saves SET score=?, coins=?, best_score=?, difficulty=?, upgrades=?, "
        "updated_at=unixepoch() WHERE user_id=?",
        [
            int(d.get("score", 0) or 0),
            int(d.get("coins", 0) or 0),
            int(d.get("best_score", 0) or 0),
            str(d.get("difficulty", "normal")),
            upgrades,
            request.user["id"],
        ],
    )

    best = int(d.get("best_score", 0) or 0)
    if best > 0:
        client.execute(
            "INSERT INTO leaderboard (user_id, display_name, score) VALUES (?, ?, ?)",
            [request.user["id"], request.user["display_name"], best],
        )

    return jsonify({"ok": True})


# ------------------------------------------------------------------
# Leaderboard
# ------------------------------------------------------------------
@app.route("/api/leaderboard")
def leaderboard():
    r = client.execute("""
        SELECT display_name, MAX(score) AS score
        FROM leaderboard
        GROUP BY user_id
        ORDER BY score DESC
        LIMIT 50
    """)
    return jsonify([row_to_dict(r, row) for row in r.rows])


# ------------------------------------------------------------------
# Admin
# ------------------------------------------------------------------
@app.route("/api/admin/users")
@require_auth("admin")
def admin_users():
    r = client.execute("""
        SELECT u.id, u.display_name, u.email, u.role, u.is_guest, u.created_at,
               s.best_score, s.coins, s.score
        FROM users u
        LEFT JOIN saves s ON s.user_id = u.id
        ORDER BY u.created_at DESC
    """)
    return jsonify([row_to_dict(r, row) for row in r.rows])


@app.route("/api/admin/users/<uid>/role", methods=["POST"])
@require_auth("owner")
def admin_set_role(uid):
    role = (request.get_json(silent=True) or {}).get("role")
    if role not in ("admin", "supporter", "player", "guest"):
        return jsonify({"error": "Ungültige Rolle"}), 400
    client.execute("UPDATE users SET role = ? WHERE id = ?", [role, uid])
    return jsonify({"ok": True})


@app.route("/api/admin/users/<uid>", methods=["DELETE"])
@require_auth("owner")
def admin_delete_user(uid):
    client.execute("DELETE FROM sessions WHERE user_id = ?", [uid])
    client.execute("DELETE FROM saves WHERE user_id = ?", [uid])
    client.execute("DELETE FROM leaderboard WHERE user_id = ?", [uid])
    client.execute("DELETE FROM users WHERE id = ?", [uid])
    return jsonify({"ok": True})


@app.route("/api/admin/stats")
@require_auth("admin")
def admin_stats():
    users = client.execute("SELECT COUNT(*) AS c FROM users").rows[0][0]
    guests = client.execute("SELECT COUNT(*) AS c FROM users WHERE is_guest = 1").rows[0][0]
    registered = users - guests
    plays = client.execute("SELECT COUNT(*) AS c FROM leaderboard").rows[0][0]
    return jsonify({
        "total_users": users,
        "guests": guests,
        "registered": registered,
        "total_runs": plays,
    })


# ------------------------------------------------------------------
# Start
# ------------------------------------------------------------------
init_schema()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

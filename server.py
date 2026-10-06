# ============================================================
# server.py — Subway Surfers Backend
# Turso (libSQL) + Flask + Flask-SocketIO + JWT
# Start auf Render: gunicorn server:app
# ============================================================

import eventlet
eventlet.monkey_patch()

import os
import json
import time
import jwt
import libsql
from functools import wraps
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory, render_template_string, redirect, make_response
from flask_socketio import SocketIO, emit, join_room
from werkzeug.security import generate_password_hash, check_password_hash

# ---------------- Konfiguration ----------------
TURSO_URL = os.environ.get("TURSO_URL", "libsql://genga-surfer-genga.aws-us-west-2.turso.io")
TURSO_TOKEN = os.environ.get("TURSO_TOKEN", "")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-render-env")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "change-me-admin-pw")
JWT_ALGO = "HS256"
JWT_EXP_DAYS = 30

app = Flask(__name__, static_folder="public", static_url_path="")
app.config["SECRET_KEY"] = JWT_SECRET
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="eventlet")

# ---------------- Turso Verbindung ----------------
def db():
    return libsql.connect(database=TURSO_URL, auth_token=TURSO_TOKEN)

def init_db():
    conn = db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            username TEXT NOT NULL,
            password_hash TEXT,
            is_guest INTEGER DEFAULT 1,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            last_login TEXT,
            last_seen TEXT,
            high_score INTEGER DEFAULT 0,
            total_coins INTEGER DEFAULT 0,
            selected_character TEXT DEFAULT 'jake',
            unlocked_characters TEXT DEFAULT 'jake'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            coins INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

# ---------------- JWT Helpers ----------------
def make_token(user_id, role):
    payload = {
        "uid": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXP_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def decode_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except Exception:
        return None

def get_current_user():
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    payload = decode_token(auth[7:])
    if not payload:
        return None
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = ?", (payload["uid"],))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    cols = ["id","email","username","password_hash","is_guest","role","is_active",
            "created_at","last_login","last_seen","high_score","total_coins",
            "selected_character","unlocked_characters"]
    return dict(zip(cols, row))

def require_auth(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user or not user["is_active"]:
            return jsonify({"error": "unauthorized"}), 401
        request.user = user
        return f(*args, **kwargs)
    return wrapper

def require_role(min_role):
    order = {"user": 0, "supporter": 1, "admin": 2, "owner": 3}
    def deco(f):
        @wraps(f)
        @require_auth
        def wrapper(*args, **kwargs):
            if order.get(request.user["role"], 0) < order.get(min_role, 0):
                return jsonify({"error": "forbidden"}), 403
            return f(*args, **kwargs)
        return wrapper
    return deco

# ---------------- Statische Dateien ----------------
@app.route("/")
def index():
    return send_from_directory("public", "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("public", path)

# ---------------- Auth Endpunkte ----------------
@app.route("/api/guest/register", methods=["POST"])
def guest_register():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if len(name) < 2 or len(name) > 16:
        return jsonify({"error": "Name muss 2 bis 16 Zeichen haben"}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = ?", (name,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Name bereits vergeben, bitte anderen wählen"}), 409

    now = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO users (email, username, password_hash, is_guest, role, is_active, created_at, last_login, last_seen) "
        "VALUES (NULL, ?, NULL, 1, 'user', 1, ?, ?, ?)",
        (name, now, now, now)
    )
    conn.commit()
    uid = cur.lastrowid
    conn.close()

    token = make_token(uid, "user")
    return jsonify({"ok": True, "token": token, "user": {"id": uid, "username": name, "role": "user", "is_guest": True}})

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    name = (data.get("username") or "").strip()
    pw = data.get("password") or ""

    if "@" not in email or "." not in email:
        return jsonify({"error": "Ungültige Email"}), 400
    if len(name) < 2 or len(name) > 16:
        return jsonify({"error": "Name muss 2 bis 16 Zeichen haben"}), 400
    if len(pw) < 6:
        return jsonify({"error": "Passwort muss mindestens 6 Zeichen haben"}), 400

    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Email bereits registriert"}), 409
    cur.execute("SELECT id FROM users WHERE username = ?", (name,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Name bereits vergeben"}), 409

    now = datetime.utcnow().isoformat()
    cur.execute(
        "INSERT INTO users (email, username, password_hash, is_guest, role, is_active, created_at, last_login, last_seen) "
        "VALUES (?, ?, ?, 0, 'user', 1, ?, ?, ?)",
        (email, name, generate_password_hash(pw, method="pbkdf2:sha256"), now, now, now)
    )
    conn.commit()
    uid = cur.lastrowid
    conn.close()

    token = make_token(uid, "user")
    return jsonify({"ok": True, "token": token, "user": {"id": uid, "username": name, "role": "user", "is_guest": False}})

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    pw = data.get("password") or ""

    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE email = ? AND is_guest = 0", (email,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Email oder Passwort falsch"}), 401

    cols = ["id","email","username","password_hash","is_guest","role","is_active",
            "created_at","last_login","last_seen","high_score","total_coins",
            "selected_character","unlocked_characters"]
    user = dict(zip(cols, row))

    if not user["is_active"]:
        conn.close()
        return jsonify({"error": "Account gesperrt"}), 403
    if not check_password_hash(user["password_hash"], pw):
        conn.close()
        return jsonify({"error": "Email oder Passwort falsch"}), 401

    now = datetime.utcnow().isoformat()
    cur.execute("UPDATE users SET last_login = ?, last_seen = ? WHERE id = ?", (now, now, user["id"]))
    conn.commit()
    conn.close()

    token = make_token(user["id"], user["role"])
    return jsonify({"ok": True, "token": token, "user": {
        "id": user["id"], "username": user["username"], "email": user["email"],
        "role": user["role"], "is_guest": False,
        "high_score": user["high_score"], "total_coins": user["total_coins"]
    }})

@app.route("/api/me")
@require_auth
def me():
    u = request.user
    return jsonify({
        "id": u["id"], "username": u["username"], "email": u["email"],
        "role": u["role"], "is_guest": bool(u["is_guest"]),
        "high_score": u["high_score"], "total_coins": u["total_coins"],
        "selected_character": u["selected_character"],
        "unlocked_characters": u["unlocked_characters"]
    })

# ---------------- Spielstand speichern ----------------
@app.route("/api/save", methods=["POST"])
@require_auth
def save():
    data = request.get_json() or {}
    score = int(data.get("score", 0))
    coins = int(data.get("coins", 0))
    char = data.get("character", "jake")
    unlocked = data.get("unlocked", "jake")

    conn = db()
    cur = conn.cursor()
    u = request.user
    new_high = max(u["high_score"], score)
    new_coins = u["total_coins"] + coins
    now = datetime.utcnow().isoformat()

    cur.execute(
        "UPDATE users SET high_score = ?, total_coins = ?, selected_character = ?, unlocked_characters = ?, last_seen = ? WHERE id = ?",
        (new_high, new_coins, char, unlocked, now, u["id"])
    )
    if score > 0:
        cur.execute(
            "INSERT INTO scores (user_id, score, coins, created_at) VALUES (?, ?, ?, ?)",
            (u["id"], score, coins, now)
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True, "high_score": new_high, "total_coins": new_coins})

@app.route("/api/heartbeat", methods=["POST"])
@require_auth
def heartbeat():
    conn = db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_seen = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), request.user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

@app.route("/api/leaderboard")
def leaderboard():
    conn = db()
    cur = conn.cursor()
    cur.execute("""
        SELECT u.username, MAX(s.score) as top_score
        FROM scores s JOIN users u ON u.id = s.user_id
        WHERE u.is_guest = 0
        GROUP BY u.id
        ORDER BY top_score DESC
        LIMIT 50
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify({"leaderboard": [{"name": r[0], "score": r[1]} for r in rows]})

# ---------------- Admin Panel ----------------
ADMIN_HTML = """
<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><title>Admin Panel</title>
<style>
body{background:#0a0a2a;color:#fff;font-family:monospace;padding:20px;}
h1{color:#ffcc00;}
table{width:100%;border-collapse:collapse;margin-top:20px;}
th,td{border:1px solid #444;padding:6px;font-size:13px;text-align:left;}
th{background:#222;}
tr:nth-child(even){background:#111;}
a{color:#0ff;}
button{background:#ffcc00;color:#000;border:none;padding:4px 8px;cursor:pointer;border-radius:4px;}
select,input{padding:3px;background:#111;color:#fff;border:1px solid #555;}
</style></head><body>
<h1>ADMIN PANEL</h1>
<p><a href="/admin/logout">Logout</a></p>

<h2>Benutzer ({{ users|length }})</h2>
<table>
<tr><th>ID</th><th>Name</th><th>Email</th><th>Gast</th><th>Rolle</th><th>Aktiv</th><th>High Score</th><th>Coins</th><th>Erstellt</th><th>Zuletzt gesehen</th><th>Aktion</th></tr>
{% for u in users %}
<tr>
<td>{{ u.id }}</td>
<td>{{ u.username }}</td>
<td>{{ u.email or '-' }}</td>
<td>{{ 'ja' if u.is_guest else 'nein' }}</td>
<td>
  <form method="post" action="/admin/set_role" style="display:inline;">
    <input type="hidden" name="uid" value="{{ u.id }}">
    <input type="hidden" name="player_token" value="{{ player_token }}">
    <select name="role">
      {% for r in ['user','supporter','admin','owner'] %}
        <option value="{{ r }}" {% if u.role == r %}selected{% endif %}>{{ r }}</option>
      {% endfor %}
    </select>
    <button type="submit">Setzen</button>
  </form>
</td>
<td>{{ 'ja' if u.is_active else 'nein' }}</td>
<td>{{ u.high_score }}</td>
<td>{{ u.total_coins }}</td>
<td>{{ u.created_at }}</td>
<td>{{ u.last_seen or '-' }}</td>
<td>
  <form method="post" action="/admin/toggle_active" style="display:inline;">
    <input type="hidden" name="uid" value="{{ u.id }}">
    <button type="submit">{{ 'Sperren' if u.is_active else 'Entsperren' }}</button>
  </form>
</td>
</tr>
{% endfor %}
</table>
</body></html>
"""

ADMIN_LOGIN_HTML = """
<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin Login</title>
<style>body{background:#0a0a2a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;height:100vh;}
form{background:#111;padding:30px;border:2px solid #ffcc00;border-radius:10px;display:flex;flex-direction:column;gap:12px;}
input{padding:10px;background:#000;color:#fff;border:1px solid #555;}
button{padding:10px;background:#ffcc00;color:#000;font-weight:bold;border:none;cursor:pointer;}
.err{color:#f55;font-size:13px;}
</style></head><body>
<form method="post">
<h2 style="color:#ffcc00;margin:0;">Admin Login</h2>
<input name="password" type="password" placeholder="Admin Passwort" required autofocus>
{% if error %}<div class="err">{{ error }}</div>{% endif %}
<button type="submit">Einloggen</button>
</form>
</body></html>
"""

def admin_authed():
    token = request.cookies.get("admin_token")
    if not token:
        return False
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload.get("admin") is True
    except Exception:
        return False

@app.route("/admin", methods=["GET", "POST"])
def admin():
    if not admin_authed():
        if request.method == "POST":
            pw = request.form.get("password") or ""
            if pw == ADMIN_PASSWORD:
                token = jwt.encode(
                    {"admin": True, "exp": datetime.utcnow() + timedelta(days=30)},
                    JWT_SECRET, algorithm=JWT_ALGO
                )
                resp = make_response(redirect("/admin"))
                resp.set_cookie("admin_token", token, httponly=True,
                                secure=True, samesite="Lax",
                                max_age=60*60*24*30)
                return resp
            return render_template_string(ADMIN_LOGIN_HTML, error="Falsches Passwort"), 401
        return render_template_string(ADMIN_LOGIN_HTML, error=""), 401

    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT id,username,email,is_guest,role,is_active,high_score,total_coins,created_at,last_seen FROM users ORDER BY created_at DESC")
    rows = cur.fetchall()
    conn.close()
    users = [{"id": r[0], "username": r[1], "email": r[2], "is_guest": r[3], "role": r[4],
              "is_active": r[5], "high_score": r[6], "total_coins": r[7],
              "created_at": r[8], "last_seen": r[9]} for r in rows]
    # player_token kommt aus dem Cookie "owner_player_token", den der Client setzt wenn er als Owner eingeloggt ist
    player_token = request.cookies.get("owner_player_token", "")
    return render_template_string(ADMIN_HTML, users=users, player_token=player_token)

@app.route("/admin/logout")
def admin_logout():
    resp = make_response(redirect("/admin"))
    resp.delete_cookie("admin_token")
    return resp

@app.route("/admin/set_role", methods=["POST"])
def admin_set_role():
    if not admin_authed():
        return redirect("/admin")
    player_token = request.form.get("player_token", "")
    payload = decode_token(player_token)
    if not payload:
        return "Kein Owner-Token vorhanden. Du musst im Spiel als Owner eingeloggt sein und das Admin-Panel aus dem Spiel heraus öffnen.", 403
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT role FROM users WHERE id = ?", (payload["uid"],))
    row = cur.fetchone()
    if not row or row[0] != "owner":
        conn.close()
        return "Nur der Owner darf Rollen ändern.", 403

    uid = int(request.form.get("uid"))
    new_role = request.form.get("role")
    if new_role not in ("user", "supporter", "admin", "owner"):
        conn.close()
        return redirect("/admin")
    cur.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, uid))
    conn.commit()
    conn.close()
    return redirect("/admin")

@app.route("/admin/toggle_active", methods=["POST"])
def admin_toggle_active():
    if not admin_authed():
        return redirect("/admin")
    uid = int(request.form.get("uid"))
    conn = db()
    cur = conn.cursor()
    cur.execute("SELECT is_active FROM users WHERE id = ?", (uid,))
    row = cur.fetchone()
    if row:
        cur.execute("UPDATE users SET is_active = ? WHERE id = ?", (0 if row[0] else 1, uid))
        conn.commit()
    conn.close()
    return redirect("/admin")

# ---------------- Multiplayer ----------------
rooms = {}

@socketio.on("connect")
def on_connect():
    print("CONNECT", request.sid)

@socketio.on("joinRoom")
def on_join(data):
    sid = request.sid
    room = data.get("room", "default")
    name = data.get("name", "Player")
    join_room(room)
    if room not in rooms:
        rooms[room] = {}
    rooms[room][sid] = {"id": sid, "name": name, "x": 0, "y": 0, "z": 0,
                       "score": 0, "lane": 1, "alive": True}
    emit("roomState", rooms[room], to=room)

@socketio.on("update")
def on_update(data):
    sid = request.sid
    room = data.get("room", "default")
    if room not in rooms or sid not in rooms[room]:
        return
    p = rooms[room][sid]
    p.update({k: data.get(k, p[k]) for k in ("x", "y", "z", "score", "lane", "alive")})
    emit("playerUpdate", p, to=room, skip_sid=sid)

@socketio.on("gameOver")
def on_gameover(data):
    sid = request.sid
    room = data.get("room", "default")
    emit("playerDead", {"id": sid, "score": data.get("score", 0)}, to=room)

@socketio.on("disconnect")
def on_disconnect():
    sid = request.sid
    for room in list(rooms.keys()):
        if sid in rooms[room]:
            del rooms[room][sid]
            emit("playerLeft", sid, to=room)
            emit("roomState", rooms[room], to=room)
            if not rooms[room]:
                del rooms[room]

# ---------------- Init ----------------
init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    socketio.run(app, host="0.0.0.0", port=port)

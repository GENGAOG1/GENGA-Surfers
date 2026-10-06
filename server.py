# ============================================================
# server.py — Flask + Flask-SocketIO (production-ready für Render)
# Start: gunicorn server:app
# ============================================================

import eventlet
eventlet.monkey_patch()

import os
from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__, static_folder='public', static_url_path='')
app.config['SECRET_KEY'] = 'subway-surfers-secret'

socketio = SocketIO(
    app,
    cors_allowed_origins='*',
    async_mode='eventlet',
    logger=False,
    engineio_logger=False
)

rooms = {}


@app.route('/')
def index():
    return send_from_directory('public', 'index.html')


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('public', path)


@socketio.on('connect')
def on_connect():
    print('CONNECT', request.sid)


@socketio.on('joinRoom')
def on_join(data):
    sid = request.sid
    room = data.get('room', 'default')
    name = data.get('name', 'Player')
    join_room(room)
    if room not in rooms:
        rooms[room] = {}
    rooms[room][sid] = {
        'id': sid,
        'name': name,
        'x': 0,
        'y': 0,
        'z': 0,
        'score': 0,
        'lane': 1,
        'alive': True
    }
    emit('roomState', rooms[room], to=room)


@socketio.on('update')
def on_update(data):
    sid = request.sid
    room = data.get('room', 'default')
    if room not in rooms or sid not in rooms[room]:
        return
    p = rooms[room][sid]
    p['x'] = data.get('x', 0)
    p['y'] = data.get('y', 0)
    p['z'] = data.get('z', 0)
    p['score'] = data.get('score', 0)
    p['lane'] = data.get('lane', 1)
    p['alive'] = data.get('alive', True)
    emit('playerUpdate', p, to=room, skip_sid=sid)


@socketio.on('gameOver')
def on_gameover(data):
    sid = request.sid
    room = data.get('room', 'default')
    emit('playerDead', {'id': sid, 'score': data.get('score', 0)}, to=room)


@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    for room in list(rooms.keys()):
        if sid in rooms[room]:
            del rooms[room][sid]
            emit('playerLeft', sid, to=room)
            emit('roomState', rooms[room], to=room)
            if not rooms[room]:
                del rooms[room]


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    socketio.run(app, host='0.0.0.0', port=port)

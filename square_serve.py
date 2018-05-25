from flask import Flask, render_template, send_from_directory
from flask_socketio import SocketIO, emit

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async_mode = None

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)


@app.route('/')
def index():
    logger.info('Serving root')
    return render_template('index.html', async_mode=socketio.async_mode)

# Static Routes
# TODO: get rid of them (should be served up some other way..)

@app.route('/js/<path:path>')
def send_js(path):
    return send_from_directory('static/js', path)


@app.route('/css/<path:path>')
def send_css(path):
    return send_from_directory('static/css', path)


@app.route('/spec/<path:path>')
def send_spec(path):
    return send_from_directory('static/spec', path)


@app.route('/img/<path:path>')
def send_img(path):
    return send_from_directory('static/img', path)



@socketio.on('command', namespace='/test')
def test_message(message):
    emit('server_response', {'data': message['data']})


@socketio.on('connect', namespace='/test')
def test_connect():
    emit('server_response', {'data': 'Connected'})


@socketio.on('my_ping', namespace='/test')
def ping_pong():
    emit('my_pong')


@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')


if __name__ == '__main__':
    logger.info('Running socket IO')
    socketio.run(app, port=9000)

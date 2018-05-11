#!/usr/bin/env python3
from tornado import websocket, web, ioloop, httpserver
import socket
import random
import json

game = None


class Player(object):
    def __init__(self, start_x, start_y, color):
        self.X = start_x
        self.Y = start_y
        self.color = color


class Game(object):
    def __init__(self):
        self.players = []
        self.top_id = 0

    @staticmethod
    def __random_color():
        color = '#{:02x}{:02x}{:02x}'.format(*map(lambda x: random.randint(0, 255), range(3)))

        return color

    def new_player(self, start_x, start_y):
        np_id = self.top_id
        self.top_id += 1

        color = self.__random_color()

        np = Player(start_x, start_y, color)
        self.players.append(np)

        assert(np is self.players[np_id])

        return np_id, color

    def move_player(self, pid, new_x, new_y):
        player = self.players[pid]

        player.X = new_x
        player.Y = new_y

    def disconnect_player(self):
        pass


class IndexHandler(web.RequestHandler):
    def get(self):
        self.render("index.html")


class WSHandler(websocket.WebSocketHandler):
    clients = []
    players = []

    def check_origin(self, origin):
        return True

    def broadcast_message(self, message):
        for client in self.clients:
            client.write_message(message)

    def open(self):
        self.clients.append(self)
        print('new connection')
        #import pdb; pdb.set_trace()

        #util.log("New player has connected: " + client.id);
        #client.on("disconnect", onClientDisconnect);
        #client.on("new player", onNewPlayer);
        #client.on("move player", onMovePlayer);

    def on_message(self, data):
        msg = json.loads(data)

        cmd = msg['cmd']

        if cmd == "new-player":
            print("new-player command")
            np_id, np_color = game.new_player(msg['x'], msg['y'])
            self.write_message(json.dumps({'type': 'set-id', 'id': np_id}))
            self.write_message(json.dumps({'type': 'set-color', 'id': np_id,
                                           'color': np_color}))
            self.broadcast_message(json.dumps({'type': 'new-player',
                                              'id': np_id, 'color': np_color,
                                              'x': msg['x'], 'y': msg['y']}))

            # send locations of existing players
            for pid, player in enumerate(game.players):
                self.write_message(json.dumps({'type': 'new-player',
                                               'id': pid, 'color': player.color,
                                               'x': player.X, 'y': player.Y}))

        if cmd == "move-player":
            print("move-player command")
            game.move_player(msg['id'], msg['x'], msg['y'])

            self.broadcast_message(json.dumps({'type': 'move-player',
                                               'id': msg['id'],
                                               'x': msg['x'], 'y': msg['y']}))


            #print 'message received:  %s' % message


        # Reverse Message and send it back
        #print 'sending back message: %s' % message[::-1]
        #self.write_message(message[::-1])

    def on_close(self):
        print('connection closed')
        self.clients.remove(self)


application = web.Application([
    (r'/', IndexHandler),
    (r'/ws', WSHandler),
    (r'/js/(.*)', web.StaticFileHandler, {'path': './js/'}),
    (r'/style/(.*)', web.StaticFileHandler, {'path': './style/'}),
])

if __name__ == "__main__":
    game = Game()

    http_server = httpserver.HTTPServer(application)
    http_server.listen(9000)
    myIP = socket.gethostbyname(socket.gethostname())
    print('*** Websocket Server Started at %s***' % myIP)
    ioloop.IOLoop.instance().start()


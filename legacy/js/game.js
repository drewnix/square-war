/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	remotePlayers,
	socket;         // Socket

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY);

	socket = new WebSocket("http://localhost:9000");

	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

	socket.onopen = function() {
    	console.log("Connected to socket server");
		//socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY()});
		socket.send(JSON.stringify({
			cmd: "new-player",
  			x: localPlayer.getX(),
			y: localPlayer.getY()
		}));
	};

    socket.onmessage = function(e) {
        onMessage(e);
    };

	/*
	socket.on("connect", onSocketConnected);
	socket.on("disconnect", onSocketDisconnect);
	socket.on("new player", onNewPlayer);
	socket.on("move player", onMovePlayer);
	socket.on("remove player", onRemovePlayer);
	*/
};

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	}
}

function onMessage(event) {
   console.log("Received a message: ", event);

   if(typeof event.data === "string"){
      //create a JSON object
      var jsonObject = JSON.parse(event.data);
      var username = jsonObject.name;
      var message = jsonObject.message;
      var msgtype = jsonObject.type;


      switch(msgtype){
          case "set-id":
              id = jsonObject.id;
              break;
		  case "set-color":
		      pid = jsonObject.id;
		      color = jsonObject.color;
		      onSetColor(pid, color);
		      break;
          case "move-player":
              mid = jsonObject.id;
              mx = jsonObject.x;
              my = jsonObject.y;
              onMovePlayer(mid, mx, my);
              break;
		  case "new-player":
              pid = jsonObject.id;
              px = jsonObject.x;
              py = jsonObject.y;

              // don't add entry for ourselves
              // TODO: THIS LINE IS BROKEN
			  // not really
           	  if (pid != id) {
                  console.log("new player: ", pid, px, py);
                  onNewPlayer(pid, px, py);
              }
              break;
      }

      console.log("Received data string");
      console.log("My id: ", id);
      console.log(jsonObject);
      console.log("msg type: ", msgtype);
   }
}


// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	}
}

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

function onSocketConnected() {
    console.log("Connected to socket server");
	socket.emit("new player", {x: localPlayer.getX(), y: localPlayer.getY()});
	//socket.send("new player", {x: localPlayer.getX(), y: localPlayer.getY()});
};

function onSocketDisconnect() {
    console.log("Disconnected from socket server");
};

function onNewPlayer(pid, px, py) {
    console.log("New player connected: " + pid);
	var newPlayer = new Player(px, py);
	newPlayer.id = pid;
	remotePlayers.push(newPlayer);
}

function onSetColor(pid, pcolor) {
    console.log("Setting color for" + pid);
    var colorPlayer = playerById(mid);

	if (!colorPlayer) {
        console.log("colorPlayer not found: " + mid);
        return;
    }

	var newPlayer = new Player(px, py);
	newPlayer.id = pid;
	remotePlayers.push(newPlayer);
}


function playerById(id) {
    var i;
    for (i = 0; i < remotePlayers.length; i++) {
        if (remotePlayers[i].id == id)
            return remotePlayers[i];
    }

    return false;
}

function onMovePlayer(mid, mx, my) {
    var movePlayer = playerById(mid);

    if (!movePlayer) {
        console.log("Player not found: " + mid);
        return;
    }

    movePlayer.setX(mx);
    movePlayer.setY(my);
}

function onRemovePlayer(data) {

};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
    if (localPlayer.update(keys)) {
    	socket.send(JSON.stringify({
			cmd: "move-player",
            id: id,
  			x: localPlayer.getX(),
			y: localPlayer.getY()
		}));
    }
}


/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Draw the local player
	localPlayer.draw(ctx);

	var i;
	for (i = 0; i < remotePlayers.length; i++) {
    	remotePlayers[i].draw(ctx);
	};
};
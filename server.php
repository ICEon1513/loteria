<?php
include_once('jugador.php');
/*
	Client -> Server:
		JOIN username
		QUIT
		TEXT text here
	
	Server -> Client:
		ONJOIN username
		ONQUIT username
		ONTEXT username text here
		USERS username1 username2
		SERVER text here
	
	USERS sends a list of space-separated usernames to a client when that client has joined.
	SERVER sends text to a client that is not chat text, for example: Username already taken
	QUIT does not need to take a username because the server stores usernames for clients in $users.
*/

// settings

// for other computers to connect, you will probably need to change this to your LAN IP or external IP,
// alternatively use: gethostbyaddr(gethostbyname($_SERVER['SERVER_NAME']))
define('CB_SERVER_BIND_HOST', '192.168.0.103');

// also change at top of main.js
define('CB_SERVER_BIND_PORT', 9300);

// also change at top of main.js
define('CB_MAX_USERNAME_LENGTH', 15);

define('INTERVALO', 4);

// prevent the server from timing out
set_time_limit(0);

// include the web sockets server script (the server is started at the far bottom of this file)
require 'ws-api.php';


// users are stored in this global array with syntax: $users[ integer ClientID ] = string Username
$users = array();
$mazo = array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54);
$actual = 0;
$revisando = false;
$repartirCarta = false;
$finalizado = false;
$nextFold = 0;


// when a client sends data to the server
function wsOnMessage($clientID, $message, $messageLength, $binary)
{
	// check if message length is 0
	if ($messageLength == 0) {
		wsClose($clientID);
		return;
	}
	// split the message by spaces into an array, and fetch the command
	$message = explode(' ', $message);
	$command = array_shift($message);
	echo "Command: " . $command . "\n";
	// check which command was received
	if ($command == 'TEXT') {
		// a client has sent chat text to the server
		if (!isUser($clientID)) {
			// the client has not yet sent a JOIN with a valid username, and is trying to send a TEXT
			wsClose($clientID);
			return;
		}
		// put the message back into a string
		$text = implode(' ', $message);
		if ($text == '') {
			// the text is blank
			wsSend($clientID, 'SERVER Message was blank.');
			return;
		}
		// fetch the client's username, and send the chat text to all clients
		// the text is actually also sent back to the client which sent the text, which sort of acts as a confirmation that the text worked
		$username = getUsername($clientID);
		sendChat($username, $text);
	} elseif ($command == 'UNIRSE') {
		// a client is joining loteria
		if (isUser($clientID)) {
			// the client has already sent a JOIN with a valid username
			wsClose($clientID);
			return;
		}
		// fetch username, and trim any whitespace before and after the username
		$username = trim($message[0]);
		if ($username == '') {
			// the username is blank
			wsClose($clientID);
			return;
		}
		if (strlen($username) > CB_MAX_USERNAME_LENGTH) {
			// username length is more than CB_MAX_USERNAME_LENGTH
			wsSend($clientID, 'SERVIDOR|El nombre del Usuario no puede ser mayor a ' . CB_MAX_USERNAME_LENGTH . ' caracteres.');
			wsClose($clientID);
			return;
		}
		if (isUsername($username)) {
			// username is already being used by another client
			wsSend($clientID, 'SERVIDOR|El nombrde del Usuario ya fue utilizado.');
			wsClose($clientID);
			return;
		}
		// add the user
		addUser($clientID, $username);
	} elseif ($command == 'QUIT') {
		// a client is leaving the chat
		if (!isUser($clientID)) {
			// the client has not yet sent a JOIN with a valid username, and is trying to send a QUIT
			wsClose($clientID);
			return;
		}
		// remove the user
		removeUser($clientID);
	} elseif ($command == 'LISTO') {
		global $users, $mazo, $actual, $repartirCarta;
		if (isUser($clientID)) {
			$username = trim($message[0]);
			//mensaje de listo recibido desde el cliente
			echo "El cliente: " . $username . " esta listo" . PHP_EOL;
			sendReady($clientID, $username);
			if (count($users) > 1 && todosListos()) {
				shuffle($mazo);
				$actual = 0;
				$repartirCarta = true;
			}
		}
	} elseif ($command == 'LOTERIA') {
		global $users, $revisando, $actual, $repartirCarta, $mazo, $nextFold;
		echo "*********************LOTERIA RECIBIDO*************************" . PHP_EOL;
		if (!$revisando) {
			$json_loteria = json_decode(trim($message[0]));
			//var_dump($json_loteria);
			$revisando = true;
			$username = getUsername($clientID);
			foreach ($users as $clientID2 => $user) {
				if ($clientID != $clientID2)
					wsSend($clientID2, 'ENREVISION|' . $username);
				else
					wsSend($clientID, 'ENREVISANDO|');
			}
			sleep(2);
			if ($actual < 11) {
				$revisando = false;
				$nextFold = 0;
				echo "no Ganador";
				aviso_ganador(0, $clientID);
			} else {
				if ($actual == 53) {
					$revisando = false;
					$repartirCarta = false;
					$actual = 0;
					echo "Ganador";
					aviso_ganador(1, $clientID);
				} else {
					$nuevo = array_slice($mazo, 0, $actual);
					$resultado =  array_diff($json_loteria, $nuevo);
					if (count($resultado) == 0) { // estan todas las cartas
						echo "Ganador";
						aviso_ganador(1, $clientID);
					} else { // no estan todas las cartas
						echo "no Ganador";
						$nextFold = 0;
						$revisando = false;
						aviso_ganador(0, $clientID);
					}
				}
			}
		}
	} elseif ($command == 'REWIND') {
		global $users, $revisando, $actual, $repartirCarta, $mazo, $nextFold, $finalizado;
		foreach ($users as $clientID => $user) {
			$user->listoJugador = false;
			wsSend($clientID, 'UNREADY');
		}
		$actual = 0;
		$nextFold = 0;
		$repartirCarta = false;
		$revisando = false;
		$finalizado = false;
	} else {
		// unknown command received, close connection
		wsClose($clientID);
	}
}

// when a client connects
function wsOnOpen($clientID)
{
	echo ("Open Client ID: " . $clientID . "\n");
}

// when a client closes or lost connection
function wsOnClose($clientID, $status)
{
	// check if the client has sent a JOIN with a valid username
	if (isUser($clientID)) {
		removeUser($clientID);
	}
}

function aviso_ganador($win, $quien)
{
	global $users;
	foreach ($users as $clientID2 => $user) {
		if ($quien == $clientID2)
			wsSend($quien, 'WINNER|' . $win);
		else
			wsSend($clientID2, 'WIN|' . $win);
	}
	sleep(3);
}

function avisar()
{
	global $users;
	foreach ($users as $clientID2 => $user) {
		wsSend($clientID2, 'AVISAR|');
	}
}

// user functions
function isUser($clientID)
{
	// checks if a user exists (if JOIN has previously been received from the client, with a valid username)
	global $users;
	return isset($users[$clientID]);
}

function addUser($clientID, $username)
{
	global $users;
	wsSend($clientID, 'BIENVENIDO|');

	// let all clients know about this user joining (not including the user joining)
	foreach ($users as $clientID2 => $user) {
		wsSend($clientID2, 'ENUNIDO|' . $username);
	}
	// send list of usernames to the user joining
	$usernames = getUsernames();
	$usuariosj =  getUsers();

	//var_dump($usernames);
	if (count($usernames) > 0) {
		wsSend($clientID, 'USUARIOS|' . implode(' ', $usuariosj));
	}
	// store the user's client ID and username
	$users[$clientID] = new Jugador($username);
}

function removeUser($clientID)
{
	global $users;
	// fetch username for the user leaving
	$username = getUsername($clientID);
	// remove data stored for the user leaving
	unset($users[$clientID]);
	// let all clients know about this user quitting (not including the user leaving)
	foreach ($users as $clientID2 => $user) {
		wsSend($clientID2, 'ENSALIR|' . $username);
	}
}

// username functions
function getUsername($clientID)
{
	// returns the username for a client
	global $users;
	return $users[$clientID]->nombreJugador;
}

function isUsername($username)
{
	// checks if the username is being used by any client
	global $users;
	foreach ($users as $user) {
		if ($username === $user->nombreJugador) return true;
	}
	return false;
}

function getUsernames()
{
	// returns an array of usernames
	global $users;

	$usernames = array();
	foreach ($users as $user) {
		$usernames[] = $user->nombreJugador;
	}
	return $usernames;
}

function getUsers()
{
	global $users;

	$usersj = array();
	foreach ($users as $user) {
		$usersj[] = $user->getJSON();
	}
	return $usersj;
}

function sendReady($clientID, $username)
{
	global $users;

	foreach ($users as $clientID2 => $user) {
		if ($clientID === $clientID2) {
			$user->listoJugador = true;
		}
		wsSend($clientID2, 'ENLISTO|' . $username);
	}
}

// chat functions
function sendChat($username, $text)
{
	// sends chat text to all clients
	global $users;
	foreach ($users as $clientID => $user) {
		wsSend($clientID, 'ONTEXT ' . $username . ' ' . $text);
	}
}

function todosListos()
{
	global $users;
	foreach ($users as $user) {
		if ($user->listoJugador == false)
			return false;
	}
	return true;
}

function checkForStopFlag()
{
	wsSend(1, "HOLA");
	return false;
}

function repartir()
{
	global $users, $actual, $mazo, $finalizado;

	foreach ($users as $clientID2 => $user) {
		wsSend($clientID2, 'CARTA|' . $mazo[$actual]);
	}
	echo $mazo[$actual] . PHP_EOL;
	$actual++;

	if ($actual >= count($mazo)) {
		$finalizado = true;
	}
}



// start the server
wsStartServer(CB_SERVER_BIND_HOST, CB_SERVER_BIND_PORT);

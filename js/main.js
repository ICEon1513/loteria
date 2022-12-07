let baraja = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54];

loteria = {
	serverHost: '192.168.1.101',
	serverPort: 9300,
	limiteNombreUsuario: 12,

	socket: false,
	conectado: false,

	clickConectar: function () {
		console.log(loteria.estaConectado());
		if (loteria.estaConectado()) {
			loteria.desconectar();
			return;
		}

		let nombreusuario = document.getElementById('txtnombre').value;
		nombreusuario = nombreusuario.trim();
		if (nombreusuario == '') {
			//shake
			loteria.mostrarMensaje('Debes escribir un nombre de usuario');
		} else if (nombreusuario.indexOf(' ') != -1) {
			//shake
			loteria.mostrarMensaje('Los nombres de usuario no deben contener espacios');
		} else if (nombreusuario.length > loteria.limiteNombreUsuario) {
			//shake
			loteria.mostrarMensaje('El nombre de usuario no puede ser de más de ' + loteria.limiteNombreUsuario + ' caracteres');
		} else {
			//conectando
			//deshabilitar boton solicitar
			loteria.deshabilitarElemento(document.getElementById('solicitar'), true);
			loteria.mostrarMensaje("Conectando...");
			loteria.conectar();
		}
	},
	clickLoteria: function () {
		//compliar arreglo baraja, send 'LOTERIA ' + baraja
	},
	estaConectado: function () {
		return loteria.conectado;
	},
	mostrarMensaje(mensaje) {
		const login_mensaje = document.getElementById('mensaje');
		login_mensaje.innerHTML = mensaje;
	},
	deshabilitarElemento: function (elemento, estado) {
		elemento.dissabled = estado;
	},
	conectar: function () {
		var Socket = new WebSocket('ws://' + loteria.serverHost + ':' + loteria.serverPort);
		loteria.setSocketEvents(Socket);
		loteria.socket = Socket;
	},
	desconectar: function () {
		loteria.socket.send('SALIR');
		loteria.socket.close();
	},
	//eventos socket
	setSocketEvents: function (Socket) {
		Socket.onopen = function () {
			loteria.conectado = true;
			loteria.mostrarMensaje("Conectado");
			let txtnombre = document.getElementById('txnombre').value;
			loteria.usuarios.agreagarUsuario(txtnombre);
			loteria.socket.send('UNIRSE ' + txtnombre);
		}
		Socket.onmessage = function (mensaje) {
			//recibir mensaje del servidor
			var datos = mensaje.data;
			var partes = datos.split('|');
			var codigo = partes.shift();

			switch (codigo) {
				case 'SERVIDOR':
					loteria.mostrarMensaje(partes.shift());
					break;
				case 'CARTA':
					break;
				case 'ENUNIRSE':
					var usuario = partes.shift();
					loteria.usuarios.agreagarUsuario(usuario);
					loteria.mostrarMensaje("Bienvenido");
					//mostrar la interfaz
					break;
				case 'ENSALIR':
					var usuario = partes.shift();
					loteria.usuarios.eliminarUsuario(usuario);
					loteria.mostrarMensaje("Adios");
					break;
				case 'USUARIOS':
					var usuarios = partes.shift().split(' ');
					loteria.usuarios.colocarUsuarios(usuarios);
					break;
				case 'ENGANADOR':
					//mensaje al ganador
					break;
				case 'ENREVISION':
					//pausar juego, deshabilitar interfaz
					break;
				case 'ENTERMINADO':
					//juego terminado
					break;				
				//molestar
			}
		}

		Socket.onclose = function () {
			if (loteria.estaConectado) {
				loteria.mostrarMensaje('Desconectado.');
			} else {
				loteria.mostrarMensaje('Error al conectar');
			}
			loteria.conectado = false;
			loteria.usuarios.limpiarUsuarios();
			loteria.deshabilitarElemento(document.getElementById('solicitar'), false);
		}

		Socket.onerror = function (e) {
			alert("Error al conectar al servidor");
		}
	},
	ordenarUsuarios: function () {
		var sort_by_name = function (a, b) {
			return a.innerHTML.toLowerCase().localeCompare(b.innerHTML.toLowerCase());
		}

		var items = document.querySelectorAll('.jugador');
		var listado = Array.from(items);
		listado.sort(sort_by_name);
		for (var i = 0; i < listado.length; i++) {
			listado[i].parentNode.appendChild(listado[i]);
		}
	},
	usuarios: {
		conteo: 0,
		agreagarUsuario: function (nombre) {
			let listado = document.getElementById('lista_jugadores');
			loteria.usuarios.conteo++;

			var list_item = Object.assign(document.createElement('li'), {
				innerHTML: nombre,
				className: 'jugador'
			});
			listado.appendChild(list_item);
			loteria.ordenarUsuarios();
		},
		eliminarUsuario: function (nombre) {
			loteria.usuarios.conteo--;

			let listado = document.getElementById('lista_jugadores');
			var items = listado.children;

			var i, j = itmes.length;
			for (i = 0; i < j; i++) {
				if (items[i].textContent == nombre) {
					listado.removeChild(items[i]);
					break;
				}
			}
		},
		colocarUsuarios: function (usuarios) {
			let listado = document.getElementById('lista_jugadores');

			var i, j = usuarios.length, list_item;

			for (i = 0; i < j; i++) {
				var list_item = Object.assign(document.createElement('li'), {
					innerHTML: usuarios[i],
					className: 'jugador'
				});

				listado.appendChild(list_item);
				//eventlistener click
				loteria.usuraios.conteo++;
			}
			loteria.ordenarUsuarios();
		},
		limpiarUsuarios: function () {
			loteria.usuarios.conteo = 0;
			let listado = document.getElementById('lista_jugadores');
			while (listado.firstChild) {
				listado.removeChild(listado.firstChild);
			}
		}
	} //usuarios


} //loteria

function shuffle(array) {
	array.sort(() => Math.random() - 0.5);
	const cartas = document.querySelectorAll(".carta");
	cartas.forEach((carta, index) => {
		carta.style.backgroundImage = `url('imagenes/${baraja[index]}.jpg')`;
	});
}

function toogleSeleccionar() {
	if (this.classList.contains('seleccionado')) {
		this.classList.remove('seleccionado');
	} else {
		this.classList.add('seleccionado');
	}
}

document.addEventListener("DOMContentLoaded", function (event) {
	const tablero = document.getElementById('tablero');
	const login = document.getElementById('login');
	const btn_jugar = document.getElementById('btn-jugar');
	const btn_aleatorio = document.getElementById('btn-aleatorio');
	btn_aleatorio.onclick = () =>{shuffle(baraja)};
	
	const btn_salir = document.getElementById('btn-salir');

	const btn_solicitar = document.getElementById('solicitar');
	btn_solicitar.addEventListener('click', loteria.clickConectar);

	const cartas_seleccionadas = document.querySelectorAll(".marcado");

	shuffle(baraja);

	

	cartas_seleccionadas.forEach(seleccion => {
		seleccion.addEventListener("click", toogleSeleccionar);
	});

});// DOMContenrLoaded
let baraja = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54];
let carton_revisar = [];
let carton_jugador = [];
let estilo, btn_loteria, btn_aleatorio, btn_jugar, btn_editar, pantalla_tablero, pantalla_login, txtnombre, btn_comenzar, carta, contador, modal_revisionall, modal_revision, fichas_tablero, cartas_seleccionadas, bandera;
let btn_jugar_habilitado = true;
let comenzar = false;
let jugando = false;
let editando = false;
let revisando = false;
let carta_cambio = null;
let tiempo = 2800;
const win = new Audio("sounds/win.wav");
const correct = new Audio("sounds/correct.wav");
const incorrect = new Audio("sounds/incorrect.wav");
const drop = new Audio("sounds/drop.wav");
const applauses = new Audio("sounds/applauses.wav");


const TIME_LIMIT = 3;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;

loteria = {
	serverHost: '192.168.0.103',
	serverPort: 9300,
	limiteNombreUsuario: 15,

	socket: false,
	conectado: false,

	clickConectar: function () {
		if (btn_jugar_habilitado) {
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
				btn_jugar_habilitado = false;
				loteria.mostrarMensaje("Conectando...");
				loteria.conectar();
			}
		} else {
			//console.log("no se dio click");
		}
	},
	registrarComenzar: function () {
		/* alert ("comenzar"); */
		btn_comenzar.style.display = 'none';

		// deshabilitar el boton de shuffle
		loteria.socket.send('LISTO ' + document.getElementById('nombre_jugador').innerHTML);
		if (editando == true) {
			toogleEditar();
		}
		comenzar = true;
		btn_editar.style.color = "transparent";
		btn_aleatorio.style.color = "transparent";
	},
	clickLoteria: function () {
		//compliar arreglo baraja, send 'LOTERIA ' + baraja
	},
	estaConectado: function () {
		return loteria.conectado;
	},
	mostrarMensaje(mensaje) {
		const login_mensaje = document.getElementById('login_bienvenida');
		login_mensaje.innerHTML = mensaje;
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
	verificarGanador: function () {
		//console.log(consultarcartas());
		//console.log(baraja);
		loteria.socket.send('LOTERIA ' + consultarcartas());
	},
	//eventos socket
	setSocketEvents: function (Socket) {
		Socket.onopen = function () {
			loteria.conectado = true;
			loteria.mostrarMensaje("Conectado");
			txtnombre = document.getElementById('txtnombre').value;
			loteria.socket.send('UNIRSE ' + txtnombre.trim());
			loteria.usuarios.agreagarUsuario(txtnombre.trim());
		}
		Socket.onmessage = function (mensaje) {
			//recibir mensaje del servidor
			var datos = mensaje.data;
			var partes = datos.split('|');
			//console.log(partes);

			var codigo = partes.shift();
			//console.log(codigo);
			//console.log(partes);
			switch (codigo) {
				case 'BIENVENIDO':
					document.getElementById('nombre_jugador').innerHTML = txtnombre;
					pantalla_login.style.display = 'none';
					pantalla_tablero.style.display = 'block';
					break;
				case 'SERVIDOR':
					loteria.mostrarMensaje(partes.shift());// constriur el msj
					break;
				case 'CARTA':
					carta = partes.shift()
					//console.log("CARTA REPARTIDA " + carta);
					mostrarCarta(carta);
					break;
				case 'ENUNIDO':
					var usuario = partes.shift();
					loteria.usuarios.agreagarUsuario(usuario);
					break;
				case 'ENSALIR':
					var usuario = partes.shift();
					loteria.usuarios.eliminarUsuario(usuario);
					loteria.mostrarMensaje("Hasta Pronto");
					break;
				case 'WIN':
					//mensaje a todos si gano el que canto o no
					tiempo = 2800;
					var resultado = partes.shift();
					if (resultado == 1) {
						document.getElementById('resultadoy').style.display = 'inline';
						correct.play();
						bandera = true;
						tiempo = 5000;
					} else {
						document.getElementById('resultadon').style.display = 'inline';
						incorrect.play();
					}
					setTimeout(() => {
						modal_revisionall.style.display = 'none';
						document.getElementById('resultadon').style.display = 'none';
						document.getElementById('resultadoy').style.display = 'none';
						if(bandera) {
							reiniciarinterfaz();
						}
					}, tiempo);

					break;
				case 'WINNER':
					//mensaje al que canto ***********************************
					tiempo = 2800;
					var resultado = partes.shift();
					if (resultado == 1) {
						let letras = document.querySelectorAll('.letras');
						letras.forEach(letra => {
							letra.classList.remove('letras-blancas');
							letra.classList.add('animar-letras');
						});
						document.getElementById('resultadosi').style.display = 'inline';
						win.play();
						bandera = true;
						tiempo = 5000;
					} else {
						document.getElementById('resultadono').style.display = 'inline';
						incorrect.play();
					}
					setTimeout(() => {
						modal_revision.style.display = 'none';
						document.getElementById('resultadono').style.display = 'none';
						document.getElementById('resultadosi').style.display = 'none';
						if(bandera) {
							reiniciarinterfaz();
						}
					}, tiempo);

					break;
				case 'ENREVISION':
					var usuario = partes.shift();
					//colocar el nombre del usuario y mostrar modal-revisionall
					modal_revisionall = document.getElementById('modal-revisionall');
					document.getElementById('quien').innerHTML = usuario;
					modal_revisionall.style.display = 'block';
					break;
				case 'ENREVISANDO':
					modal_revision = document.getElementById('modal-revision');
					modal_revision.style.display = 'block';
					break;
				case 'AVISAR':
					//console.log("Empezando en 3 segundos");
					mostrarConteo();
					//juego terminado
					break;
				case 'ENLISTO':
					var usuario = partes.shift();
					loteria.usuarios.usuariolisto(usuario);
					break;
				case 'USUARIOS':
					var usuariosj = partes.shift().split(' ');
					loteria.usuarios.colocarUsuariosJ(usuariosj);
					break;
				case 'UNREADY':
					var jugadores = document.querySelectorAll('.jugador');
					jugadores.forEach(jugador => {
						jugador.classList.remove('listo');
					});
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
			btn_jugar_habilitado = true;
			//loteria.deshabilitarElemento(document.getElementById('solicitar'), false);
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
		listos: 0,
		conteo: 0,
		agreagarUsuario: function (nombre) {
			//console.log("agregar");
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

			var listado = document.getElementById('lista_jugadores');
			var items = listado.children;

			var i, j = items.length;
			for (i = 0; i < j; i++) {
				if (items[i].textContent == nombre) {
					if (items[i].classList.contains('listo')) {
						loteria.usuarios.listos--;
					}
					listado.removeChild(items[i]);
					break;
				}
			}
		},
		colocarUsuariosJ: function (usuariosj) {
			let listado = document.getElementById('lista_jugadores');

			var i, j = usuariosj.length, list_item;

			for (i = 0; i < j; i++) {
				var usuarioj = JSON.parse(usuariosj[i]);
				var list_item = Object.assign(document.createElement('li'), {
					innerHTML: usuarioj.nombre,
					className: 'jugador'
				});
				if (usuarioj.estatus == 1) {
					list_item.classList.add('listo')
				}

				listado.appendChild(list_item);
				//addeventlistener click
				loteria.usuarios.conteo++;
			}
			loteria.ordenarUsuarios();
		},
		limpiarUsuarios: function () {
			loteria.usuarios.conteo = 0;
			let listado = document.getElementById('lista_jugadores');
			while (listado.firstChild) {
				listado.removeChild(listado.firstChild);
			}
		},
		usuariolisto: function (usuario) {
			loteria.usuarios.listos++;

			let listado = document.getElementById('lista_jugadores');
			var items = listado.children;

			var i, j = items.length;
			for (i = 0; i < j; i++) {
				if (items[i].textContent == usuario) {
					loteria.usuarios.listos++;
					items[i].classList.add('listo');
					break;
				}
			}
		}

	} //usuarios

} //loteria
function reiniciarinterfaz() {
	//reiniciar variables e interfaz
	loteria.socket.send('REWIND');
	comenzar = false;
	jugando = false;
	editando = false;
	revisando = false;
	carta_cambio = null;
	bandera = false;
	btn_loteria.style.display = 'none';
	btn_comenzar.style.display = 'block';

	document.getElementById('btn-editar').style.color = "#FEFEFE";
	document.getElementById('btn-aleatorio').style.color = "#FEFEFE";
	cartas_seleccionadas.forEach(carta => {
		carta.classList.remove('seleccionado');
	});
	document.getElementById('carta_actual').setAttribute('src', 'imagenes/back.png');
	shuffle(baraja);

}

function shuffle(array) {
	if (!jugando && !comenzar && !revisando) {
		array.sort(() => Math.random() - 0.5);
		const cartas = document.querySelectorAll(".carta");
		carton_jugador = baraja.slice(0, 12);
		cartas.forEach((carta, index) => {
			carta.style.backgroundImage = `url('imagenes/${carton_jugador[index]}.jpg')`;
		});
	}
}

function mostrarCarta(c) {
	document.getElementById('carta_actual').setAttribute('src', `imagenes/${c}.jpg`);
}

function toogleEditar() {
	if (!jugando && !comenzar && !revisando) {
		let cartas_editando = document.querySelectorAll('.carta');
		if (editando) {
			editando = false;
			document.getElementById('btn-editar').style.color = "#FEFEFE";
			cartas_editando.forEach(carta => {
				carta.classList.remove('editando');
			});
		} else {
			editando = true;
			document.getElementById('btn-editar').style.color = "#00ABBD";


			cartas_editando.forEach(carta => {
				carta.classList.add('editando');
			});
		}
	}
}

function toogleSeleccionar() {
	if (jugando) {
		if (this.classList.contains('seleccionado')) {
			this.classList.remove('seleccionado');
		} else {
			this.classList.add('seleccionado');
			drop.play();
		}
		revisarcarton();
	}
}

function cambiarCarta() {
	if (editando == true) {
		carta_cambio = this.getAttribute('id');
		presentar_seleccion();
	}
}

function presentar_seleccion() {
	let contenedor_seleccion = document.getElementById('listado_seleccion');
	while (contenedor_seleccion.firstChild) {
		contenedor_seleccion.removeChild(contenedor_seleccion.firstChild);
	}
	document.getElementById('modal-seleccion').style.display = "block";
	for (let x = 1; x <= baraja.length; x++) {
		let item_seleccion = Object.assign(document.createElement('li'), {
			className: 'item_carta',
			style:
				"background-image: url(imagenes/" + x + ".jpg);"
		});
		item_seleccion.dataset.numero = x;
		item_seleccion.addEventListener('click', seleccionar_carta);

		for (let y = 0; y < carton_jugador.length; y++) {
			if (x == carton_jugador[y]) {
				item_seleccion.style.filter = "grayscale(1)";
				item_seleccion.removeEventListener('click', seleccionar_carta);
			}
		}
		contenedor_seleccion.append(item_seleccion);

	}
	//console.log(carton_jugador);
}

function seleccionar_carta() {
	document.getElementById('modal-seleccion').style.display = "none";
	document.getElementById(carta_cambio).style.backgroundImage = `url('imagenes/${this.dataset.numero}.jpg')`;
	let posicion = (String(carta_cambio).slice(1)) - 1;
	carton_jugador[posicion] = Number(this.dataset.numero);
	//console.log(carton_jugador);
}

function seleccionarficha() {
	let ficha_seleccionada = this.getAttribute('src');
	estilo.setProperty('--ficha-juego', `url('../${ficha_seleccionada}')`);
	document.getElementById('btn_ficha_actual').setAttribute('src', ficha_seleccionada);
	fichas.style.display = "none";
}

function abandonarpartida() {
	let salir = confirm("¿Deseas anadonar la partida?");
	if (salir) {
		loteria.socket.send('QUIT');
		window.location.reload();
	}
}

function mostrarusuarios() {
	const area_usuarios = document.getElementById('jugadores');
	if (area_usuarios.classList.contains('crecer')) {
		area_usuarios.classList.add('decrecer');
		area_usuarios.classList.remove('crecer');
	} else {
		area_usuarios.classList.add('crecer');
		area_usuarios.classList.remove('decrecer');
	}
}

function revisarcarton() {
	const cartas_obtenidas = document.querySelectorAll('.seleccionado');
	if (cartas_obtenidas.length == 12) {
		btn_loteria.style.display = 'block';
	} else {
		btn_loteria.style.display = 'none';
	}
}

function consultarcartas() {
	carton_revisar = baraja.slice(0, 12);
	return JSON.stringify(carton_revisar);
}

function saludarusuario() {
	alert(this.innerHTML);
}

function mostrarConteo() {
	document.getElementById('modal-conteo').style.display = 'flex';
	contador.classList.add('animar_conteo');
	timerInterval = setInterval(() => {
		timePassed = timePassed += 1;
		timeLeft = TIME_LIMIT - timePassed;
		contador.innerHTML = timeLeft;
		if (timeLeft === 0) {
			contador.innerHTML = "";
			clearInterval(timerInterval);
			contador.classList.remove('animar_conteo');
			document.getElementById('modal-conteo').style.display = 'none';
			contador.innerHTML = '3';
		}
	}, 900);
	timePassed = 0;
	jugando = true;
}

document.addEventListener("DOMContentLoaded", function (event) {
	estilo = document.documentElement.style;

	let aleatoria_login = Math.floor(Math.random() * (54 - 1) + 1);
	const carta_login = document.getElementById('carta_login');
	carta_login.setAttribute('src', `imagenes/${aleatoria_login}.jpg`);

	pantalla_tablero = document.getElementById('tablero');
	pantalla_login = document.getElementById('login');

	pantalla_tablero.style.display = 'none';
	pantalla_login.style.display = 'block';

	document.getElementById('txtnombre').focus();

	btn_loteria = document.getElementById('btn_loteria');
	btn_loteria.style.display = 'none';
	btn_loteria.addEventListener('click', loteria.verificarGanador);

	btn_comenzar = document.getElementById('btn_comenzar');
	btn_comenzar.addEventListener('click', loteria.registrarComenzar);

	const fichas = document.getElementById('fichas');
	fichas.style.display = 'none';

	/* const jugadores = document.querySelectorAll('.jugador');
	jugadores.forEach(jugador => {
		jugador.addEventListener('click', saludarusuario);
	}); */

	const btn_usuarios = document.getElementById('btn-usuarios');
	btn_usuarios.addEventListener('click', mostrarusuarios);

	btn_editar = document.getElementById('btn-editar');
	btn_editar.addEventListener('click', toogleEditar)

	fichas_tablero = document.querySelectorAll(".ficha_carta");
	fichas_tablero.forEach(ficha => {
		ficha.addEventListener('click', seleccionarficha);
	});

	btn_aleatorio = document.getElementById('btn-aleatorio');
	btn_aleatorio.onclick = () => { shuffle(baraja) };

	const btn_salir = document.getElementById('btn-salir');
	btn_salir.addEventListener('click', abandonarpartida);

	const btn_fichas = document.getElementById('btn_ficha_actual');

	btn_fichas.addEventListener('click', () => {
		fichas.style.display = 'block';
	});

	const btn_solicitar = document.getElementById('btn_solicitar');
	btn_solicitar.addEventListener('click', loteria.clickConectar);

	contador = document.getElementById('contador');

	shuffle(baraja);
	cartas_seleccionadas = document.querySelectorAll(".marcado");
	cartas_seleccionadas.forEach(seleccion => {
		seleccion.addEventListener("click", toogleSeleccionar);
		seleccion.addEventListener("click", cambiarCarta);
	});

	win.addEventListener("ended", () => {
		applauses.play();
	});

});// DOMContenrLoaded
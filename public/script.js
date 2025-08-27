//const { text } = require("express");

// Conectar con el servidor
const socket = io();

//INICIEMOS VARIABLES QUE LLEVAN EL TRASCURSO DEL JUEGO
let miMano; //Inicio la mano del jugador
let numeroJugador;  //ESto es para tener el número de jugador

//ESTO ES PARA CONTROLAR LOS GRÁFICOS
//La frase de acción
const accion = document.getElementById("accion");
// El texto de la derecha:
const juegosA=document.getElementById("juegosA");
const juegosB=document.getElementById("juegosB");
const marcadorA=document.getElementById("puntosA");
const marcadorB=document.getElementById("puntosB");
const textoGrande=document.getElementById("textoGrande");
const textoChica=document.getElementById("textoChica");
const textoTienenPares=document.getElementById("textoTienenPares");
const textoPares=document.getElementById("textoPares");
const textoTienenJuego=document.getElementById("textoTienenJuego");
const textoJuego=document.getElementById("textoJuego");
//La mesa y mensajes superiores
// Selecciono la mesa
const mesa = document.getElementById("mesa");
// Creo un contenedor superior para los mensajes
const barraSuperior = document.createElement("div");
barraSuperior.style.position = "absolute";
barraSuperior.style.top = "10px";
barraSuperior.style.left = "0";
barraSuperior.style.width = "100%";
barraSuperior.style.display = "flex";
barraSuperior.style.justifyContent = "space-between";
barraSuperior.style.padding = "0 20px";
barraSuperior.style.color = "black";
barraSuperior.style.fontWeight = "bold";
mesa.appendChild(barraSuperior);
// Creo el mensaje izquierdo
const mensajeIzq = document.createElement("div");
barraSuperior.appendChild(mensajeIzq);
// Creo el mensaje derecho
const mensajeDer = document.createElement("div");
barraSuperior.appendChild(mensajeDer);

//Esto es el manejo de los botones
const BotonCorto = document.getElementById("botonCorto");
BotonCorto.addEventListener("click", () => {
socket.emit("cortandoMus2",(numeroJugador))
setTimeout(() => {
  socket.emit("cortoMus2");
},1500);
});
const BotonMus = document.getElementById("botonMus");
BotonMus.addEventListener("click", () => {
  socket.emit("Mus2");
});
const botonEnvido=document.getElementById("botonEnvido");
botonEnvido.addEventListener("click", () => {
  socket.emit("envite2",2);
});
const botonEnvido2=document.getElementById("botonEnvido2");
botonEnvido2.addEventListener("click", () => {
  socket.emit("envite2",2);
});
const botonQuiero=document.getElementById("botonQuiero");
botonQuiero.addEventListener("click", () => {
  socket.emit("quiero2");
});
const botonNoQuiero=document.getElementById("botonNoQuiero");
botonNoQuiero.addEventListener("click", () => {
  socket.emit("noQuiero2");
});
const BotonEnvidoMas= document.getElementById("botonEnvidoMas");
BotonEnvidoMas.addEventListener("click", () => {
  mostrarSet("setEnvido");
  activarBotones("setEnvido",numeroJugador);
});
const BotonEnvidoMas2= document.getElementById("botonEnvidoMas2");
BotonEnvidoMas2.addEventListener("click", () => {
  mostrarSet("setEnvido");
  activarBotones("setEnvido",numeroJugador);
});
const BotonEnvidoMas3= document.getElementById("botonEnvidoMas3");
BotonEnvidoMas3.addEventListener("click", () => {
  mostrarSet("setEnvido");
  activarBotones("setEnvido",numeroJugador);
});
const botonEnvido24=document.getElementById("botonEnvido24");
botonEnvido24.addEventListener("click", () => {
  socket.emit("envite2",2);
});
const botonEnvido5=document.getElementById("botonEnvido5");
botonEnvido5.addEventListener("click", () => {
  socket.emit("envite2",5);
});
const botonOrdago=document.getElementById("botonOrdago");
botonOrdago.addEventListener("click", () => {
  socket.emit("ordago2");
});
const botonPaso= document.getElementById("botonPaso");
botonPaso.addEventListener("click", () => {
  socket.emit("paso");
});
const botonDescarte=document.getElementById("botonDescarte")
botonDescarte.addEventListener("click",() =>{
  // Seleccionamos todas las cartas que estén seleccionadas
  const cartasSeleccionadas = document.querySelectorAll(".carta.seleccionada");
  const descartes = Array.from(cartasSeleccionadas).map(carta => ({
    palo: carta.dataset.palo,
    numero: Number(carta.dataset.numero),
  }));
  if (descartes.length>0){
  socket.emit("descarte2",descartes);
  }
})
const botonSiguienteMano=document.getElementById("botonSiguienteMano")
botonSiguienteMano.addEventListener("click",() =>{
  socket.emit("siguienteMano2",numeroJugador);
})
const inputNumero = document.getElementById("numero-apuesta");
inputNumero.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {   // Si la tecla pulsada es Enter
    let valor = parseInt(inputNumero.value);
    socket.emit("envite2",valor)
  }
});
//FUNCIONES AUXILIARES
// Para mostrar la mano del jugador
function mostrarMano() {
  //Muestro mi mano
  const divMano = document.getElementById(`cartas-jugador${numeroJugador}`);
  divMano.innerHTML = ""; // limpiar

  miMano.forEach((carta, indice) => {
    const img = document.createElement("img");
    img.src = `imagenes/${carta.numero}-${carta.palo}.jpg`;
    img.style.width = "60px";
    img.className="carta";

    img.dataset.numero=carta.numero;
    img.dataset.palo=carta.palo;
    img.dataset.indice=indice;
    divMano.appendChild(img);
  });

  //Y cartas en reverso para el resto 
  for (let i = 1; i < 5; i++) {
    if (i!=numeroJugador){
      const divMano = document.getElementById(`cartas-jugador${i}`);
      divMano.innerHTML = ""; // limpiar
      for (let j = 1; j < 5; j++) {
        const img = document.createElement("img");
        img.src = `imagenes/reverso.jpg`;
        img.style.width = "60px";
        img.className="carta";
        divMano.appendChild(img);
      }
    }
  }
}
// Para actualizar turno
function actualizarTurno(turno){
  if (turno==numeroJugador){
    mensajeIzq.textContent = `TU TURNO`;
  } else{
    mensajeIzq.textContent=`Turno jugador ${turno}`
  }
}
// Colocar baraja
function colocarBaraja(mano){
  //Borro todas las barajas
  for (let i = 1; i <= 4; i++) {
  const baraja = document.getElementById(`baraja-${i}`);
    baraja.style.display = "none";
  }
  const baraja = document.getElementById(`baraja-${mano}`);
  baraja.style.display="block";
}
//Mostrar sets de botones
function mostrarSet(setId) {
  // Ocultamos todos los sets
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });

  // Mostramos el que toca
  const set = document.getElementById(setId);
  if (set) {
    set.style.display = "flex";
  }
}
//Activar botones
function activarBotones(setId, turno) {
  // Desactivo todos los botones con class="boton"
  document.querySelectorAll(".boton").forEach(boton => {
  boton.disabled = true;
  })
  // Desactivo las cartas
  for (k=1; k<5; k++){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.removeEventListener("click",marcarcartas);
    })
  }
  // comprobamos que el turno coincide con este jugador
  if (turno === numeroJugador) {
    // seleccionamos todos los botones dentro del set
    const botones = document.querySelectorAll(`#${setId} .boton`);
    // activamos los botones
    botones.forEach(boton => {
        boton.disabled = false;   
    });
    //En el caso de que haya que descartar también tengo que hacer clickables las cartas
    if (setId=="setDescartes"){
      //Tengo que seleccionar las cartas del jugador
      const divMano = document.getElementById(`cartas-jugador${turno}`);
      Array.from(divMano.children).forEach(carta => {
        carta.addEventListener("click",marcarcartas);
      })
    }
  }
  
}
function marcarcartas(event) {
  const carta = event.currentTarget; // la carta clicada
  carta.classList.toggle("seleccionada"); // marca/desmarca
}

//LLAMADAS DEL SERVIDOR
//ANTES DE INICIAR EL JUEGO
//Guardo el número de este jugador
socket.on("NumeroJugador", (num) =>{
  numeroJugador=num;
});
//Cuando se ha obtenido un nuevo jugador
socket.on("NuevoJugador", (num) => {
  for (let i = 1; i < num+1; i++) {
    const miJugador = document.getElementById(`jugador-${i}`);
    miJugador.style.display="block";
    if (i==numeroJugador){
        const nombreJugador = document.querySelector(`#jugador-${i} span`);
        nombreJugador.textContent = `Jugador ${i} (Tú)`;
    }
  }
});
//Recibimos el comienzo
socket.on("ComienzoJuego",()=>{
  accion.textContent=`Comencemos el juego`;
});
socket.on("TurnoInicial",(mano)=>{
  if (mano==numeroJugador){
    accion.textContent=`Comienzas tú`
  } else{
    accion.textContent=`Comienza el jugador ${mano}`
  }
});
socket.on("juegoComenzado",()=>{
  accion.style.display="none";
  accion.style.fontSize="12px";
})
// Recibir la mano inicial
socket.on("muestreMano", (manos) => {
  miMano = manos;
  mostrarMano();
});
//EMPECEMOS EL JUEGO
socket.on("colocarBaraja",(mano) =>{
  colocarBaraja(mano);
});
socket.on("cortoMusEnvite",()=>{
  mensajeDer.textContent = "Grande";
});
socket.on("turno",(setId,turno,fase,punto)=>{
  if (fase==0){
      mensajeDer.textContent = "Mus";
  }else if (fase==1){
    mensajeDer.textContent = "Grande";
  }else if (fase==2){
    mensajeDer.textContent = "Chica";
  }else if (fase==3){
    mensajeDer.textContent = "Pares";
  }else if (fase==4){
    if (punto==1){
      mensajeDer.textContent = "Punto";
    } else{
      mensajeDer.textContent = "Juego";
    }
  }
  actualizarTurno(turno);
  mostrarSet(setId);
  activarBotones(setId,turno);
  accion.style.display="none";
});
socket.on("cortandoMus1",(turno) =>{
  mensajeIzq.textContent = `Jugador ${turno} ha cortado`;
});
socket.on("envite1",(envite,turno,jugadorQueEnvida,fase2) =>{
  let fase="";
  if (fase2==1){
    fase="grande"
  }else if (fase2==2){
    fase="chica"
  }else if (fase2==3){
    fase="pares"
  }else if (fase2==4){
    fase="juego"
  }
  accion.style.fontSize="12px";
  accion.textContent=`El jugador ${jugadorQueEnvida} ha envidado ${envite} a ${fase}`
  accion.style.display="block";
  actualizarTurno(turno);
  mostrarSet("setCerrarApuestas");
  activarBotones("setCerrarApuestas",turno);
});
socket.on("ordago1",(turno,jugadorQueEnvida,fase2) =>{
  let fase="";
  if (fase2==1){
    fase="grande"
  }else if (fase2==2){
    fase="chica"
  }else if (fase2==3){
    fase="pares"
  }else if (fase2==4){
    fase="juego"
  }
  accion.style.fontSize="12px";
  accion.textContent=`El jugador ${jugadorQueEnvida} ha echado un órdago a ${fase}`
  accion.style.display="block";
  actualizarTurno(turno);
  mostrarSet("setCerrarApuestas");
  activarBotones("setCerrarApuestas",turno);
});
socket.on("noQuiero3",(turno) =>{
  actualizarTurno(turno);
  mostrarSet("setCerrarApuestas");
  activarBotones("setCerrarApuestas",turno);
});
socket.on("noParesNoJuego",()=>{
  // Muestro las cartas normales
  for (k=1; k<5; k++){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.style.opacity="1"
    })
  }
});
socket.on("pares",(siPares)=>{
  mensajeDer.textContent="Pares";
  let sinPares=0;
  let texto="";
  for (let j=1; j<5; j++){
    if (siPares[j-1]==1){
      texto += `${j}`;
    } else{
      sinPares=sinPares+1;
    }
  } 
  if (sinPares==4){
    texto="Nadie";
  }
  textoTienenPares.textContent=texto;
  textoTienenPares.style.display="block";
  console.log("Se deberían quitar algunos pares")
  for (k=1; k<5; k++){
    if (siPares[k-1]>0){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.style.opacity="1"
    })
    } else {
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.style.opacity="0.3"
    })
    }
  }
});
socket.on("juego",(siJuego)=>{
  mensajeDer.textContent="Juego";
  let sinJuego=0;
  let texto="";
  for (let j=1; j<5; j++){
    if (siJuego[j-1]==1){
      texto += `${j}`;
    } else{
      sinJuego=sinJuego+1;
    }
  }
  if (sinJuego==4){
    texto="Nadie";
  }
  textoTienenJuego.textContent=texto;
  textoTienenJuego.style.display="block";
  for (k=1; k<5; k++){
    if (siJuego[k-1]==1){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.style.opacity="1"
    })
    } else {
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.style.opacity="0.3"
    })
    }
  }

});
socket.on("sinPares",()=>{
  console.log("nadie tiene pares");
  accion.style.fontSize="24px";
  accion.textContent="Nadie tiene pares";
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
})

socket.on("sinJuego",()=>{
  console.log("nadie tiene juego");
  accion.style.fontSize="24px";
  accion.textContent="Nadie tiene juego";
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
})
socket.on("pares1Jugador",(turno)=>{
  console.log("solo tiene pares el jugador",turno);
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  accion.style.fontSize="24px";
  accion.textContent=`Solo tiene pares el jugador ${turno}`;
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
})
socket.on("juego1Jugador",(turno)=>{
  console.log("solo tiene juego el jugador",turno);
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  accion.style.fontSize="24px";
  accion.textContent=`Solo tiene juego el jugador ${turno}`;
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
})
socket.on("pares1Equipo",(equipo)=>{
  console.log("solo tiene pares el equipo",equipo);
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  if (equipo==1){
    accion.textContent=`Solo tiene pares el equipo A`;
  } else if (equipo==2){
    accion.textContent=`Solo tiene pares el equipo B`;
  }
  accion.style.fontSize="24px";
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
})
socket.on("juego1Equipo",(equipo)=>{
  console.log("solo tiene pjuego el equipo",equipo);
  // Ocultamos todos los sets de botones
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  if (equipo==1){
    accion.textContent=`Solo tiene juego el equipo A`;
  } else if (equipo==2){
    accion.textContent=`Solo tiene juego el equipo B`;
  }
  accion.style.fontSize="24px";
  accion.style.display="block";
  mensajeIzq.textContent="Esperen 2 segundos";
})
//Resultado vale 0 si se deja al paso 1 si se conoce ganador, 2 si se ha cerrado apuesta, 
// y 3 si el ganador se conoce al final. Extras es para sumar más en caso de pares o juego
socket.on("textoDerecha",(resultado,fase,envidado,ganador,extras)=>{
  let  texto=`a`;
  if (resultado==1){
    if (ganador==1){
      texto=`${envidado}A`;
    } else if (ganador==2){
      texto=`${envidado}B`;
    }
  } else if(resultado==0){
    texto='en paso'
  } else if(resultado==2){
    texto=`${envidado}`
  } else if(resultado==3){
    if (ganador==1){
      texto=`${envidado}(A)`;
    } else if (ganador==2){
      texto=`${envidado}(B)`;
    }
  }

  //Ahora sumo extras
  if (extras[0]>0){
    texto=texto+"+"+extras[0];
  }
  if (extras[1]>0){
    texto=texto+"+"+extras[1];
  }

  if (fase==1){
  textoGrande.textContent=texto;
  textoGrande.style.display="block";
  } else if (fase==2){
  textoChica.textContent=texto;
  textoChica.style.display="block";
  } else if (fase==3){
  textoPares.textContent=texto;
  textoPares.style.display="block";
  } else if (fase==4){
  textoJuego.textContent=texto;
  textoJuego.style.display="block";
  }
})
socket.on("punto1",()=>{
  mensajeDer.textContent = "Punto";
})
socket.on("marcadorA",(puntos)=>{
  marcadorA.textContent=puntos;
})
socket.on("marcadorB",(puntos)=>{
  marcadorB.textContent=puntos;
})
socket.on("juegosA",(juegos)=>{
  juegosA.textContent=juegos;
})
socket.on("juegosB",(juegos)=>{
  juegosB.textContent=juegos;
})
socket.on("ganadorOrdago",(ganador,fase2)  =>{
  siguienteMano=[0,0,0,0];
  let textGanador="B";
  if (ganador==1){
    textGanador="A"
  }
  let fase="";
  if (fase2==1){
    fase="grande"
  }else if (fase2==2){
    fase="chica"
  }else if (fase2==3){
    fase="pares"
  }else if (fase2==4){
    fase="juego"
  }
  accion.textContent="El equipo ganador del órdago a " + fase + " es el equipo " + textGanador;
  // Desactivo todos los botones con class="boton"
  document.querySelectorAll(".boton").forEach(boton => {
  boton.disabled = true;
  })
  // Desactivo las cartas
  for (k=1; k<5; k++){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.removeEventListener("click",marcarcartas);
    })
  }
  // Ocultamos todos los sets
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  // Mostramos el que toca
  const set = document.getElementById("setSiguienteMano");
  if (set) {
    set.style.display = "flex";
  }
  if (siguienteMano[numeroJugador-1]==0){
    mensajeIzq.textContent="TU TURNO";
    const boton = document.getElementById("botonSiguienteMano");
    // activamos los botones
    boton.disabled=false;
  } else{
    mensajeIzq.textContent="Esperando al resto de jugadores";
  }
})
socket.on("siguienteMano1",(siguienteMano,ganador)  =>{
  mensajeDer.textContent="mano completada";
  // Desactivo todos los botones con class="boton"
  document.querySelectorAll(".boton").forEach(boton => {
  boton.disabled = true;
  })
  // Desactivo las cartas
  for (k=1; k<5; k++){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.removeEventListener("click",marcarcartas);
    })
  }
  // Ocultamos todos los sets
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  // Mostramos el que toca
  const set = document.getElementById("setSiguienteMano");
  if (set) {
    set.style.display = "flex";
  }
  if (ganador==0){
    accion.textContent="Pasemos a la siguiente mano";
  }else if(ganador==1){
    accion.textContent="El equipo A ha ganado el juego";
  }else if(ganador==2){
    accion.textContent="El equipo B ha ganado el juego";
  }
  if (siguienteMano[numeroJugador-1]==0){
    mensajeIzq.textContent="TU TURNO";
    const boton = document.getElementById("botonSiguienteMano");
    // activamos los botones
    boton.disabled=false;
  } else{
    mensajeIzq.textContent="Esperando al resto de jugadores";
  }
})
socket.on("juegoTerminado",(ganador) =>{
  //oculto todos los botones
  mensajeDer.style.display="none";
  mensajeIzq.style.display="none";
  // Desactivo todos los botones con class="boton"
  document.querySelectorAll(".boton").forEach(boton => {
  boton.disabled = true;
  })
  // Desactivo las cartas
  for (k=1; k<5; k++){
    const divMano = document.getElementById(`cartas-jugador${k}`);
    divMano.querySelectorAll(".carta").forEach(carta => {
      carta.removeEventListener("click",marcarcartas);
    })
  }
  // Ocultamos todos los sets
  document.querySelectorAll(".botones-set").forEach(div => {
    div.style.display = "none";
  });
  let textGanador="B";
  if (ganador==1){
    textGanador="A"
  }
  accion.textContent="EL EQUIPO" + textGanador + "HA GANADO";
  accion.style.fontSize="30px";
})
socket.on("mostrarManos",(manos)  =>{
  console.log("Se deberían mostrar las manos de todos los jugadores");
  claves = Object.keys(manos);
  //Muestro mi mano
  for (let j=1; j<5; j++){
  const divMano = document.getElementById(`cartas-jugador${j}`);
  divMano.innerHTML = ""; // limpiar
  const mano=manos[claves[j-1]];
  mano.forEach((carta, indice) => {
    const img = document.createElement("img");
    img.src = `imagenes/${carta.numero}-${carta.palo}.jpg`;
    img.style.width = "60px";
    img.className="carta";

    img.dataset.numero=carta.numero;
    img.dataset.palo=carta.palo;
    img.dataset.indice=indice;
    divMano.appendChild(img);
  });
  }
})
socket.on("borrarTextoDerecha",()=>{
  textoGrande.textContent="";
  textoChica.textContent="";
  textoTienenPares.textContent="";
  textoPares.textContent="";
  textoTienenJuego.textContent="";
  textoJuego.textContent="";
})
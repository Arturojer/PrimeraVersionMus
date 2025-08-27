const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);  // <--- esta línea es crucial
const io = new Server(server);

app.use(express.static("public"));


// Palos y números de las cartas del Mus
const palos = ["oros", "copas", "espadas", "bastos"];
const numeros = [1,2,3,4,5,6,7,10,11,12];

// Esto es para crear el juego para 4 usuarios
let contturno=0;
let jugadores = []; // lista de sockets
let manos = {};     // {socket.id: [cartas]}
let turno = 0;
let baraja=crearBaraja();
let mano=0;  //Para guardar quién es la mano
let Mus1=1; //Establece si es el primer mus
let fase=0; //Fase 0 es mus, 1 es grande, 2 es chica, 3 pares, 4 juego, 5 resultados
let descartes=new Array(4);
let cartasDescartadas=[];
let envites=[0, 0,  0, 0];  //0 indicará al paso, 1 envites no aceptados y los demás números 
// las cantidades del envite
let ganadorEnvites=[0, 0, 0, 0];  //1 indica ganan 1,3 y 2 indica ganan 2,4.  0 es ganador por definir
let jugadorQueEnvida=0; 
let envidando=false; //Indica si se está envidando
let noquieros=0;
let marcadorA=0;
let marcadorB=0;
let paresAnalizados=[];
let juegosAnalizados=[];
let siPares=[];
let siJuego=[];
let numConPares=0; 
let numConParesA=0;
let numConJuego=0;
let numConJuegoA=0;
let punto=0;
let siguienteMano=[0,0,0,0];
let enviteAnterior=[1,1,1,1];
let ordago=0;
let juegosA=0;
let juegosB=0;
let juegoAcabado=0; 
let sumarFase=0;

// Crear baraja completa
function crearBaraja() {
  const baraja = [];
  for (let palo of palos) {
    for (let numero of numeros) {
      baraja.push({ palo, numero });
    }
  }
  return baraja;
}
// Mezclar la baraja
function mezclarBaraja(baraja) {
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  return baraja;
}
//Repartir cartas
function repartirCartas(){
  baraja=crearBaraja()
  baraja=mezclarBaraja(baraja);
  jugadores.forEach((socket) => {
    manos[socket.id] = baraja.splice(0,4);  //Esto reparte y elimina las cartas de la baraja
    socket.emit("muestreMano", manos[socket.id]);
  });
  cartasDescartadas=[];
  return baraja
}
//Pasar turno 
function siguienteturno(turnoAc){
  if (turnoAc==4){
    turnoAc=1;
  } else{
    turnoAc=turnoAc+1;
  }
  return turnoAc
}
//Pasar fase 
function siguientefase(fase){
  contturno=0;
  fase=fase+1;
  if (fase==5){
    io.emit("noParesNoJuego");
    console.log("Los envites son",envites);
    console.log("Los ganadores de envites son",ganadorEnvites);
    //Ahora toca analizar la mano
    resultadomano(manos,envites,ganadorEnvites,mano);
    io.emit("siguienteMano1",siguienteMano,juegoAcabado);
    io.emit("mostrarManos",manos);
  } else{
    if (fase<3){
      turno=mano;
      io.emit("turno","setApuestas",turno,fase,punto);
      io.emit("noParesNoJuego");
    } else if (fase==3){
      paresAnalizados=analisispares(manos);
      siPares=[0, 0, 0, 0]
      for (let j=1; j<5;j++){
        if (paresAnalizados[j-1]>0){
          siPares[j-1]=1;
        }      
      }
      io.emit("pares",siPares);
      // Hay que separar casos
      numConPares=0; 
      numConParesA=0;
      turno=mano;
      let turnoBucle=turno;
      for (let j=1; j<5; j++){
        if (siPares[turnoBucle-1]==1){
          numConPares=numConPares+1;
          if (turnoBucle==1 || turnoBucle==3){
            numConParesA=numConParesA+1;
          }
        } else if (numConPares==0){
          contturno=contturno+1;
          turno=siguienteturno(turno);
        }
        turnoBucle=siguienteturno(turnoBucle);
      }
      // Primer caso: nadie tiene pares
      if (numConPares==0){
        io.emit("sinPares")
        io.emit("textoDerecha",2,fase,0,ganadorEnvites[fase-1],[0,0])
        enviteAnterior[fase-1]=0;
        sumarFase=sumarFase+1;
        console.log("Esta es la fase antes del tiempo de espera",fase)
        setTimeout(() => {
          fase=fase-1;
          console.log("Esta es la fase dentro del tiempo de espera",fase)
        fase=siguientefase(fase);
        },2000);
        console.log("Esta es la fase después del tiempo de espera",fase)
      } else if(numConPares==1){
        io.emit("pares1Jugador",turno);
        enviteAnterior[fase-1]=0;
        //Hay que añadir como vencedor de pares al equipo que tiene
        if (numConParesA==1){
          ganadorEnvites[fase-1]=1;
        } else{
          ganadorEnvites[fase-1]=2;
        }
        io.emit("textoDerecha",1,fase,0,ganadorEnvites[fase-1],[0,0])
        sumarFase=sumarFase+1;
        console.log("Esta es la fase antes del tiempo de espera",fase)
        setTimeout(() => {
          fase=fase-1;
          console.log("Esta es la fase dentro del tiempo de espera",fase)
        fase=siguientefase(fase);
        },2000);
        console.log("Esta es la fase después del tiempo de espera",fase)
      } else{
        //Si los jugadores con pares son del mismo equipo
        if (numConPares==2 && (numConParesA==0 || numConParesA==2)){
          enviteAnterior[fase-1]=0;
          if (numConParesA==2){
          ganadorEnvites[fase-1]=1;
          } else{
          ganadorEnvites[fase-1]=2;
          }
          io.emit("textoDerecha",1,fase,0,ganadorEnvites[fase-1],[0,0])
          io.emit("pares1Equipo",ganaEnvites(siguienteturno(turno)));
          sumarFase=sumarFase+1;
          console.log("Esta es la fase antes del tiempo de espera",fase)
        setTimeout(() => {
          fase=fase-1;
          console.log("Esta es la fase dentro del tiempo de espera",fase)
        fase=siguientefase(fase);
        },2000);
        console.log("Esta es la fase después del tiempo de espera",fase)
        } else{
          io.emit("turno","setApuestas",turno,fase,punto);
        }
      }
    } else if (fase==4) {
      juegosAnalizados=analisisjuego(manos);
      siJuego=[0,0,0,0];
      for (let j=1; j<5;j++){
        if (juegosAnalizados[j-1]>30){
          siJuego[j-1]=1;
        }      
      }
      io.emit("juego",siJuego);
      //Debo contar los jugadores con juego
      numConJuego=0; 
      numConJuegoA=0;
      turno=mano;
      let turnoBucle=turno;
      for (let j=1; j<5; j++){
        if (siJuego[turnoBucle-1]==1){
          numConJuego=numConJuego+1;
          if (turnoBucle==1 || turnoBucle==3){
            numConJuegoA=numConJuegoA+1;
          }
        } else if (numConJuego==0){
          contturno=contturno+1;
          turno=siguienteturno(turno);
        }
        turnoBucle=siguienteturno(turnoBucle);
      }
      // Primer caso: nadie tiene juego
      if (numConJuego==0){
        enviteAnterior[fase-1]=0;
        punto=1;
        io.emit("sinJuego")
        setTimeout(() => {
          io.emit("punto1");
          io.emit("noParesNoJuego");
          mano=turno;
          io.emit("turno","setApuestas",turno,fase,punto);
        },2000);
      } else if(numConJuego==1){
        enviteAnterior[fase-1]=0;
        //Hay que añadir como vencedor de juego al equipo que tiene
        if (numConJuegoA==1){
          ganadorEnvites[fase-1]=1;
        } else{
          ganadorEnvites[fase-1]=2;
        }
        io.emit("textoDerecha",1,fase,0,ganadorEnvites[fase-1],[0,0])
        io.emit("juego1Jugador",turno);
        sumarFase=sumarFase+1;
        setTimeout(() => {
          fase=fase-1;
          fase=siguientefase(fase);
        },2000);
      } else{
        //Si los jugadores con juego son del mismo equipo
        if (numConJuego==2 && (numConJuegoA==0 || numConJuegoA==2)){
          enviteAnterior[fase-1]=0;
          io.emit("juego1Equipo",ganaEnvites(turno));
          //Hay que añadir como vencedor de juego al equipo que tiene
          if (numConJuegoA==2){
            ganadorEnvites[fase-1]=1;
          } else{
            ganadorEnvites[fase-1]=2;
          }
          io.emit("textoDerecha",1,fase,0,ganadorEnvites[fase-1],[0,0])
          sumarFase=sumarFase+1;
          setTimeout(() => {
            fase=fase-1;
            fase=siguientefase(fase);
          },2000);
        } else{
          io.emit("turno","setApuestas",turno,fase,punto);
        }
      }
    }
  }
  console.log("Esta es la fase antes de sumar fase",fase)
  fase=fase+sumarFase;
  sumarFase=0;
  console.log("Esta es la fase después de sumar fase",fase);
  return fase
}
//Para descartar
function funcdescartes(turno,manos,descartes){
  //Obtengo cartas descartadas
  console.log("estas son las cartas descartadas",descartes);
  for (let i=1; i<5; i++){
    cartasDescartadas.push(...descartes[i-1]);
  }
  console.log("Así queda el conjunto de cartas descartadas",cartasDescartadas);
  //Esto es para acceder a las manos 
  const claves = Object.keys(manos);
  // Recorro todos los turnos
  for (let i=1; i<5; i++){
    let mano=manos[claves[turno-1]];
    let descarte=descartes[turno-1];
    //Recorro las cartas de la mano y cambio las que coincidan con descartes
    for (let j=1; j<5; j++){
      let carta=mano[j-1];
      let coincidencia = descarte.some(
        d => d.palo === carta.palo && d.numero === carta.numero
      );
      if (coincidencia){
        if (baraja.length>0){
          mano[j-1]=baraja.splice(0,1)[0];
        } else{
          baraja=cartasDescartadas;
          console.log("Así queda la nueva baraja",baraja);
          baraja=mezclarBaraja(baraja);
          console.log("Así queda la nueva baraja después de barajar",baraja);
          cartasDescartadas=[];
        }
      }
    }
    manos[claves[turno-1]]=mano;
    turno=siguienteturno(turno);
  }
  //Y finalmente envio las cartas
  jugadores.forEach((socket) => {
    socket.emit("muestreMano", manos[socket.id]);
  });

}
//Analizar pares
function analisispares(manos){
  //Esto es para acceder a las manos 
  const claves = Object.keys(manos);
  for (let i=1; i<5; i++) {  //Barro las manos
    let mano=manos[claves[i-1]]
    //Cambio 3 por 12 y  2 por 1
    for (let j=1; j<5; j++){
      if (mano[j-1].numero==3){
        mano[j-1].numero=12
      } else if(mano[j-1].numero==2){
        mano[j-1].numero=1
      }
    }
    let contpares=0;
    //Barro todas las cartas
    for (let j=1; j<4; j++){
      for (let k=j+1; k<5; k++){
        if (mano[j-1].numero==mano[k-1].numero){
          contpares=contpares+1;
        }
      }
    }
    if (contpares==2){
      contpares=6;
    } 
    if(contpares==3){
      contpares=2;
    }
    if(contpares==6){
      contpares=3;
    }
    paresAnalizados[i-1]=contpares;  // dúplex se identifica con 3, medias con 2 y pares con 1
  }
  return paresAnalizados
}
//Analizar juego
function analisisjuego(manos){
  let juegosAnalizados=[];
  //Esto es para acceder a las manos 
  const claves = Object.keys(manos);
  for (let i=1; i<5; i++) {  //Barro las manos
    let mano=manos[claves[i-1]]
    //Cambio 3 por 12 y  2 por 1
    for (let j=1; j<5; j++){
      if (mano[j-1].numero==3){
        mano[j-1].numero=12
      } else if(mano[j-1].numero==2){
        mano[j-1].numero=1
      }
    }
    let contjuego=0;
    //Barro todas las cartas
    for (let j=1; j<5; j++){
      if (mano[j-1].numero>9){
        contjuego=contjuego+10;
      } else{
        contjuego=contjuego+mano[j-1].numero;
      }

    }
    juegosAnalizados[i-1]=contjuego;  
  }
  return juegosAnalizados
}
function ganaEnvites(turno){  //Ojo, está preparado para 
// recibir el turno del que no quiere el envite
  let gana=1;
  if (turno==3 || turno==1){
    gana=2;
  }
  return gana
}
//Es una función auxiliar para la posterior
function cambioChica(k){
  if (k==1){
    k=4;
  }else if (k==2){
    k=3;
  }else if (k==3){
    k=2;
  }else if (k==4){
    k=1;
  }
  return k
}
//Esta función calcula los puntos en cada juego y los suma
function resultadomano(manos,envites,ganadorEnvites,mano1){
//Aquí mano es el jugador mano
console.log("Los juegos son",juegosAnalizados);
console.log("los pares son",paresAnalizados)
  //Lo primero que vamos a hacer es procesar las manos. Vamos a 
  // sustituir 3 por 12 y 2 por 1. Además, vamos a ordenar las 
  // cartas por índice según su número, de mayor a menor.
  const claves = Object.keys(manos);
  for (let i=1; i<5; i++) {  //Barro las manos
    let mano=manos[claves[i-1]];
    //Cambio 3 por 12 y  2 por 1
    for (let j=1; j<5; j++){
      if (mano[j-1].numero==3){
        mano[j-1].numero=12
      } else if(mano[j-1].numero==2){
        mano[j-1].numero=1
      }
    }
    //Ahora ordeno las cartas
    for (let j=1; j<4; j++){  //Los dos bucles for son  para comparar las 
    // cartas con las que se encuentran a su derecha
      for (let k=j+1; k<5; k++){ 
        if (mano[j-1].numero<mano[k-1].numero){
        const cartaInf=mano[k-1];
        mano[k-1]=mano[j-1];
        mano[j-1]=cartaInf;
        }
      }
    }
    manos[claves[i-1]]=mano;
  }
  console.log("Estas son las manos procesadas",manos)

  for (let j=1; j<5; j++){  //Vamos a barrer las fases del juego
    if (envites[j-1]!=0){ //Esto es al paso o en envite
      console.log("Hay que decidir ganador en fase",j);
      let numComb=2;
      let ganador=1;  //Inicialmente supongo que el ganador es el primero.
      let mejorCarta=1;
      let combatientes=[1, 1, 1, 1];  //Estos son los que compiten por los puntos
      let mejoresCarta=[1, 1, 1, 1];
      for (let k=1; k<5; k++){  //k recorre las cartas o criterios de
      //  decisión para pares y juego
        if (j==2){
          k=cambioChica(k);   //Esto es para recorrer las cartas al revés
        }
        if (numComb>1){
        if (j<3){  //Esto es para analizar grande y chica
        for (let l=1; l<5; l++){  //l recorre los jugadores
        const mano=manos[claves[l-1]];
        mejoresCarta[l-1]=mano[k-1].numero;
        if (j==2){
          mejoresCarta[l-1]=-mano[k-1].numero;
        }
        }
        } else if (j==3){
          if (k==1){
          mejoresCarta=paresAnalizados;
          } else if (mejorCarta==3){ //Estamos en el caso de empate de dúplex 
          // //Como están colocadas la segunda carta es la pareja más alta y la 
          // tercera la pareja más baja, no hay que modificar más
            for (let l=1; l<5; l++){  //l recorre los jugadores
              const mano=manos[claves[l-1]];
              mejoresCarta[l-1]=mano[k-1].numero;
              if (j==2){
                mejoresCarta[l-1]=-mano[k-1].numero;
              }
            }
            if (k==3){
              k=4;  //Para que se acabe el bucle.
            }
          } else if (mejorCarta==2){ //Estamos en el caso de medias
            //Como busca la segunda carta, ya está, repito el procedimiento de 
            // grande
            for (let l=1; l<5; l++){  //l recorre los jugadores
              const mano=manos[claves[l-1]];
              mejoresCarta[l-1]=mano[k-1].numero;
              if (j==2){
                mejoresCarta[l-1]=-mano[k-1].numero;
              }
            }
            k=4; //Para que se acabe el bucle
          } else if (mejorCarta==1){ //en el caso de pares hay que buscar 
          // la pareja más alta
          console.log("Tenemos que buscar la pareja más alta");
            for (let l=1; l<5; l++){  //l recorre los jugadores
              let ParejaHallada=0;
              const mano=manos[claves[l-1]];
              console.log("Estas son las manos");
              for (m=1; m<4; m++){
                for (n=m+1; n<5; n++){
                  if (ParejaHallada==0 && mano[m-1].numero==mano[n-1].numero){
                    mejoresCarta[l-1]=mano[m-1].numero;
                    ParejaHallada=1;
                  }
                }
              }
            }
            k=4; //Para que se acabe el bucle
          }
        } else if (j==4){
          mejoresCarta=juegosAnalizados;
          k=4;  //Esto es para que se acabe el bucle
        }
        mejorCarta=mejoresCarta[ganador-1]; //fijo que la mejor carta es la primera
        //y comparo con el resto de jugadores
        console.log("En principio estas son las mejores cartas",mejoresCarta,"y esta la mejor carta",mejorCarta)
        for (let l=2; l<5; l++){  //l recorre los jugadores
        if (mejoresCarta[l-1]>mejorCarta && combatientes[l-1]==1){
          mejorCarta=mejoresCarta[l-1];
          combatientes.fill(0,0,l-1); //Entonces las anteriores no han sido las mejores cartas
        } else if (mejoresCarta[l-1]<mejorCarta){
          combatientes[l-1]=0;
        }
        }
        console.log("Vamos a ver cómo van los combatientes",combatientes)
        //Actualizo número de combatientes y la primera carta a mirar
        numComb=0;
        for (let l=4; l>0; l--){
          if (combatientes[l-1]==1){
            numComb=numComb+1;
            ganador=l;
          }
        }
        console.log("el número de combatientes es",numComb)
        }
        //Hay que deshacer el cambio para chica para no alterar el bucle
        if (j==2){
          k=cambioChica(k);   //Esto es para recorrer las cartas al revés
        }
      }
      //Lo normal sería que tuviéramos ganador, pero en ocasiones ocurre que 
      // dos jugadores tienen la misma mano y toca desempatar. Analicemos esta situación
      if (numComb>1){
        console.log("Hay que decidir ganador en la fase",j,"por mano");
        //El ganador es el más cercano a la mano, necesito barrer mínimo 3 veces
        ganador=mano1;
        for (let l=1; l<5; l++){
          if (combatientes[ganador-1]==1 && numComb>1){
            numComb=1;
          } else if (numComb>1){
            ganador=siguienteturno(ganador);
          }
        }
        console.log("El ganador es",ganador);
      }
      ganadorEnvites[j-1]=ganaEnvites(siguienteturno(ganador));
      console.log("El ganador es",ganador,"y el equipo ganador es",ganadorEnvites[j-1]);
      enviteAnterior[j-1]=envites[j-1];
      //Lo sumo al marcador
      if (ganadorEnvites[j-1]==1){
        marcadorA=marcadorA+envites[j-1];
        io.emit("marcadorA",marcadorA);
      } else if (ganadorEnvites[j-1]==2){
        marcadorB=marcadorB+envites[j-1];
        io.emit("marcadorB",marcadorB);
      }
      console.log("En la fase",j,"el marcadorA es", marcadorA)
      console.log("En la fase",j,"el marcadorB es", marcadorB)
      analizarMarcador(marcadorA,marcadorB)
      //Y ahora lo cambio en el panel de la derecha
      io.emit("textoDerecha",1,j,envites[j-1],ganadorEnvites[j-1],[0,0]);
    } else{
      console.log("sin disputa a",j);
    }
    if (j==3){  //TOCA SUMAR POR PARES Y JUEGO
      if (ganadorEnvites[j-1]==1){
        marcadorA=marcadorA+paresAnalizados[0]+paresAnalizados[2];
        io.emit("marcadorA",marcadorA);
        //Actualizo la información de la derecha
        io.emit("textoDerecha",1,3,enviteAnterior[j-1],1,[paresAnalizados[0],paresAnalizados[2]])
      } else if (ganadorEnvites[j-1]==2){
        marcadorB=marcadorB+paresAnalizados[1]+paresAnalizados[3];
        io.emit("marcadorB",marcadorB);
        io.emit("textoDerecha",1,3,enviteAnterior[j-1],2,[paresAnalizados[1],paresAnalizados[3]])
      }
      console.log("En la fase",j,"el marcadorA es", marcadorA)
      console.log("En la fase",j,"el marcadorB es", marcadorB)
      analizarMarcador(marcadorA,marcadorB)
    }
    else if (j==4){
      console.log("Los juegos analizados son",juegosAnalizados)
      if (ganadorEnvites[j-1]==1){
        let extras=[0,0];
        if (juegosAnalizados[0]==31){
          marcadorA=marcadorA+3;
          extras[0]=3;
        } else if (juegosAnalizados[0]>31){
          marcadorA=marcadorA+2;
          extras[0]=2;
        }
        if (juegosAnalizados[2]==31){
          marcadorA=marcadorA+3;
          extras[1]=3;
        } else if (juegosAnalizados[2]>31){
          marcadorA=marcadorA+2;
          extras[1]=2;
        }
        if (juegosAnalizados[0]<31 && juegosAnalizados[2]<31){
          marcadorA=marcadorA+1;
          extras[0]=1;
        }
        io.emit("marcadorA",marcadorA);
        //Actualizo la información de la derecha
        io.emit("textoDerecha",1,4,enviteAnterior[j-1],1,extras)
      }
      else if (ganadorEnvites[j-1]==2){
        let extras=[0,0];
        if (juegosAnalizados[1]==31){
          marcadorB=marcadorB+3;
          extras[0]=3;
        } else if (juegosAnalizados[1]>31){
          marcadorB=marcadorB+2;
          extras[0]=2;
        }
        if (juegosAnalizados[3]==31){
          marcadorB=marcadorB+3;
          extras[1]=3;
        } else if (juegosAnalizados[3]>31){
          marcadorB=marcadorB+2;
          extras[1]=2;
        }
        if (juegosAnalizados[1]<31 && juegosAnalizados[3]<31){
          marcadorB=marcadorB+1;
          extras[0]=1;
        }
        io.emit("marcadorB",marcadorB);
        //Actualizo la información de la derecha
        io.emit("textoDerecha",1,4,enviteAnterior[j-1],2,extras)
      }
      console.log("En la fase",j,"el marcadorA es", marcadorA)
      console.log("En la fase",j,"el marcadorB es", marcadorB)
      analizarMarcador(marcadorA,marcadorB)
    }
  }

}
//Esto es para calcular ganador de un órdago
function ganadorOrdago(manos,fase,mano1){
juegoAcabado=1;
//Aquí mano es el jugador mano
console.log("Los juegos son",juegosAnalizados);
console.log("los pares son",paresAnalizados)
  //Lo primero que vamos a hacer es procesar las manos. Vamos a 
  // sustituir 3 por 12 y 2 por 1. Además, vamos a ordenar las 
  // cartas por índice según su número, de mayor a menor.
  const claves = Object.keys(manos);
  for (let i=1; i<5; i++) {  //Barro las manos
    let mano=manos[claves[i-1]];
    //Cambio 3 por 12 y  2 por 1
    for (let j=1; j<5; j++){
      if (mano[j-1].numero==3){
        mano[j-1].numero=12
      } else if(mano[j-1].numero==2){
        mano[j-1].numero=1
      }
    }
    //Ahora ordeno las cartas
    for (let j=1; j<4; j++){  //Los dos bucles for son  para comparar las 
    // cartas con las que se encuentran a su derecha
      for (let k=j+1; k<5; k++){ 
        if (mano[j-1].numero<mano[k-1].numero){
        const cartaInf=mano[k-1];
        mano[k-1]=mano[j-1];
        mano[j-1]=cartaInf;
        }
      }
    }
    manos[claves[i-1]]=mano;
  }
  console.log("Estas son las manos procesadas",manos)
  j=fase;
      console.log("Hay que decidir ganador en fase",j);
      let numComb=2;
      let ganador=1;  //Inicialmente supongo que el ganador es el primero.
      let mejorCarta=1;
      let combatientes=[1, 1, 1, 1];  //Estos son los que compiten por los puntos
      let mejoresCarta=[1, 1, 1, 1];
      for (let k=1; k<5; k++){  //k recorre las cartas
        if (j==2){
          k=cambioChica(k);   //Esto es para recorrer las cartas al revés
        }
        if (numComb>1){
        if (j<3){  //Esto es para analizar grande y chica
        for (let l=1; l<5; l++){  //l recorre los jugadores
        const mano=manos[claves[l-1]];
        mejoresCarta[l-1]=mano[k-1].numero;
        if (j==2){
          mejoresCarta[l-1]=-mano[k-1].numero;
        }
        }
        } else if (j==3){
          if (k==1){
          mejoresCarta=paresAnalizados;
          } else if (mejorCarta==3){ //Estamos en el caso de empate de dúplex 
          // //Como están colocadas la segunda carta es la pareja más alta y la 
          // tercera la pareja más baja, no hay que modificar más
            for (let l=1; l<5; l++){  //l recorre los jugadores
              const mano=manos[claves[l-1]];
              mejoresCarta[l-1]=mano[k-1].numero;
              if (j==2){
                mejoresCarta[l-1]=-mano[k-1].numero;
              }
            }
            if (k==3){
              k=4;  //Para que se acabe el bucle.
            }
          } else if (mejorCarta==2){ //Estamos en el caso de medias
            //Como busca la segunda carta, ya está, repito el procedimiento de 
            // grande
            for (let l=1; l<5; l++){  //l recorre los jugadores
              const mano=manos[claves[l-1]];
              mejoresCarta[l-1]=mano[k-1].numero;
              if (j==2){
                mejoresCarta[l-1]=-mano[k-1].numero;
              }
            }
            k=4; //Para que se acabe el bucle
          } else if (mejorCarta==1){ //en el caso de pares hay que buscar la pareja
            let ParejaHallada=0;
              for (m=1; m<4; m++){
                for (n=m+1; n<5; n++){
                  if (ParejaHallada==0 && mano[m-1].numero==mano[n-1].numero){
                    mejoresCarta[l-1]=mano[m-1].numero;
                    ParejaHallada=1;
                  }
                }
              }
            k=4; //Para que se acabe el bucle
          }
        } else if (j==4){
          mejoresCarta=juegosAnalizados;
          k=4;  //Esto es para que se acabe el bucle
        }
        mejorCarta=mejoresCarta[ganador-1]; //fijo que la mejor carta es la primera
        //y comparo con el resto de jugadores
        console.log("En principio estas son las mejores cartas",mejoresCarta,"y esta la mejor carta",mejorCarta)
        for (let l=2; l<5; l++){  //l recorre los jugadores
        if (mejoresCarta[l-1]>mejorCarta && combatientes[l-1]==1){
          mejorCarta=mejoresCarta[l-1];
          combatientes.fill(0,0,l-1); //Entonces las anteriores no han sido las mejores cartas
        } else if (mejoresCarta[l-1]<mejorCarta){
          combatientes[l-1]=0;
        }
        }
        console.log("Vamos a ver cómo van los combatientes",combatientes)
        //Actualizo número de combatientes y la primera carta a mirar
        numComb=0;
        for (let l=4; l>0; l--){
          if (combatientes[l-1]==1){
            numComb=numComb+1;
            ganador=l;
          }
        }
        console.log("el número de combatientes es",numComb)
        }
        //Hay que deshacer el cambio para chica para no alterar el bucle
        if (j==2){
          k=cambioChica(k);   //Esto es para recorrer las cartas al revés
        }
      }
      //Lo normal sería que tuviéramos ganador, pero en ocasiones ocurre que 
      // dos jugadores tienen la misma mano y toca desempatar. Analicemos esta situación
      if (numComb>1){
        console.log("Hay que decidir ganador en la fase",j,"por mano");
        //El ganador es el más cercano a la mano, necesito barrer mínimo 3 veces
        ganador=mano1;
        for (let l=1; l<5; l++){
          if (combatientes[ganador-1]==1 && numComb>1){
            numComb=1;
          } else if (numComb>1){
            ganador=siguienteturno(ganador);
          }
        }
        console.log("El ganador es",ganador);
      }
      ganadorEnvites[j-1]=ganaEnvites(siguienteturno(ganador));
      console.log("El ganador es",ganador,"y el equipo ganador es",ganadorEnvites[j-1]);
      io.emit("ganadorOrdago",ganadorEnvites[j-1],fase)
      io.emit("mostrarManos",manos);
      if (ganadorEnvites[j-1]==1){
        juegosA=juegosA+1;
        io.emit("juegosA",juegosA);
        if (juegosA==3){
          io.emit("JuegoTerminado",1);
        }
      } else if (ganadorEnvites[j-1]==2){
        juegosB=juegosB+1;
        io.emit("juegosB",juegosB);
        if (juegosB==3){
          io.emit("JuegoTerminado",2);
        }
      }
}
function analizarMarcador(marcadorA,marcadorB){
  if (marcadorA>39){
    console.log("Ha ganado el juego el equipo A");
    juegoAcabado=1;
  } else if (marcadorB>39){
    console.log("Ha ganado el juego el equipo B");
    juegoAcabado=2;
  }
  if (marcadorA>39 || marcadorB>39){
  siguienteMano=[0,0,0,0];
  io.emit("mostrarManos".manos);
  io.emit("siguienteMano1",siguienteMano,juegoAcabado);
  if (ganadorEnvites[j-1]==1){
        juegosA=juegosA+1;
        io.emit("juegosA",juegosA);
        if (juegosA==3){
          io.emit("juegoTerminado",1);
        }
      } else if (ganadorEnvites[j-1]==1){
        juegosB=juegosB+1;
        io.emit("juegosB",juegosB);
        if (juegosB==3){
          io.emit("juegoTerminado",2);
        }
      }
  }
}

io.on("connection", (socket) => {
  console.log("¡Jugador conectado!", socket.id);
  const numeroJugador = jugadores.length + 1;
  socket.emit("NumeroJugador",numeroJugador);
  io.emit("NuevoJugador", numeroJugador);
  //Necesitamos 4 jugadores
  if (jugadores.length < 4) {
    jugadores.push(socket);
  }

  if (jugadores.length === 4) {
    console.log("Ya somos 4 jugadores");
    io.emit("ComienzoJuego")
    setTimeout(() => {  //Esto es para establecer un tiempo
      //Ahora se escoje aleatoriamente el jugador que empieza
      mano=Math.floor(Math.random()*4)+1;
      //Envio el mensaje a los usuarios
      turno=mano;
      io.emit("TurnoInicial",turno);
      //Reparto las cartas
      baraja=repartirCartas();
      io.emit("colocarBaraja",mano);
      setTimeout(() => {
        io.emit("juegoComenzado")
        io.emit("turno","setMus",turno,fase,punto);
        io.emit("colocarBaraja",mano);
      },1500);
    }, 1500); // espera 1.5 segundos
  }

  socket.on("Mus2",() =>{
    contturno=contturno+1;
    turno=siguienteturno(turno)
    if (contturno<4){
    io.emit("turno","setMus",turno,fase,punto);
    io.emit("Mus1",turno);
    if (Mus1==1){
      mano=turno;
      io.emit("colocarBaraja",mano);
    }
    } else{
      contturno=0;
      if (Mus1==1){
        mano=siguienteturno(turno);
        turno=mano;
        io.emit("colocarBaraja",mano);
      }
      io.emit("turno","setDescartes",turno,fase,punto)
    }
  });

  socket.on("cortandoMus2",(turno) => {
    Mus1=0;
    io.emit("cortandoMus1",turno);
  });

  socket.on("cortoMus2",() =>{
    Mus1=0;
    fase=siguientefase(fase);
  });
  socket.on("paso",()=>{
    contturno=contturno+1;
    turno=siguienteturno(turno);
    if (fase==3 && siPares[turno-1]==0){
      contturno=contturno+1;
      turno=siguienteturno(turno);
      if (siPares[turno-1]==0){
        contturno=contturno+1;
        turno=siguienteturno(turno);
      }
    }
    if (fase==4 && siJuego[turno-1]==0){
      contturno=contturno+1;
      turno=siguienteturno(turno);
      if (siJuego[turno-1]==0){
        contturno=contturno+1;
        turno=siguienteturno(turno);
      }
    }
    io.emit("turno","setApuestas",turno,fase,punto)
    if (contturno==4){
      contturno=0;
      if (fase>0){
        envites[fase-1]=1;  
        ganadorEnvites[fase-1]=0
      }
      io.emit("textoDerecha",0,fase,envites[fase-1],ganadorEnvites[fase-1],[0,0])
      fase=siguientefase(fase);
    }
  });

  socket.on("descarte2",(descarte)=>{
    contturno=contturno+1;
    descartes[turno-1]=descarte;
    turno=siguienteturno(turno);
    if (contturno==4){
      contturno=0;
      funcdescartes(turno,manos,descartes);
      io.emit("turno","setMus",turno,fase,punto)
    }else{
      io.emit("turno","setDescartes",turno,fase,punto)
    }
  });

  socket.on("envite2",(envite1) =>{
    Mus1=0;
    envidando=envidando+1;
    jugadorQueEnvida=turno;
    if (fase==0){
      fase=1;
      io.emit("cortoMusEnvite");
    }
    if (envidando>1){
      enviteAnterior[fase-1]=envites[fase-1];
    }
    console.log("Es la fase",fase);
    envite1=envites[fase-1]+envite1;
    envites[fase-1]=envite1;
    if (fase<3){
      turno=siguienteturno(turno);
    } else if (fase==3){ //Este es el caso de pares
      turno=siguienteturno(turno);
      if (siPares[turno-1]==0){
        noquieros=noquieros+1;
        turno=siguienteturno(turno);
        turno=siguienteturno(turno);
      }
    } else{
      turno=siguienteturno(turno);
      if (punto==0 && siJuego[turno-1]==0){
        noquieros=noquieros+1;
        turno=siguienteturno(turno);
        turno=siguienteturno(turno);
      }
    }
    io.emit("envite1",envite1,turno,jugadorQueEnvida,fase)
  });
  
  socket.on("ordago2",() =>{
    Mus1=0;
    envidando=envidando+1;
    jugadorQueEnvida=turno;
    if (fase==0){
      fase=1;
      io.emit("cortoMusEnvite");
    }
    if (envidando>2){
      enviteAnterior[fase-1]=envites[fase-1];
    }
    envite1=envites[fase-1]+40;
    envites[fase-1]=40;
    if (fase<3){
      turno=siguienteturno(turno);
    } else if (fase==3){ //Este es el caso de pares
      turno=siguienteturno(turno);
      if (siPares[turno-1]==0){
        noquieros=noquieros+1;
        turno=siguienteturno(turno);
        turno=siguienteturno(turno);
      }
    } else{
      turno=siguienteturno(turno);
      if (punto==0 && siJuego[turno-1]==0){
        noquieros=noquieros+1;
        turno=siguienteturno(turno);
        turno=siguienteturno(turno);
      }
    }
    ordago=1;
    io.emit("ordago1",turno,jugadorQueEnvida,fase)
  });

  socket.on("quiero2",()=>{
    envidando=0;
    noquieros=0;
    if (ordago==1){
      console.log("Órdago aceptado");
      ganadorOrdago(manos,fase,mano);
    } else{
    ganadorEnvites[fase-1]=0;
    io.emit("textoDerecha",2,fase,envites[fase-1],ganadorEnvites[fase-1],[0,0])
    fase=siguientefase(fase);
    }
  })

  socket.on("noQuiero2",() =>{
    noquieros=noquieros+1;
    //En el caso de pares o juego puede que el otro compañero no tenga,
    //así que sumo un noquiero
    turno=siguienteturno(turno);
    turno=siguienteturno(turno);
    if (fase==3 && siPares[turno-1]==0){
      noquieros=noquieros+1;
    } else if (fase==4 && punto==0 && siJuego[turno-1]==0){
      noquieros=noquieros+1;
    }
    if (noquieros>1){
      ordago=0;
      ganadorEnvites[fase-1]=ganaEnvites(turno);
      noquieros=0;
      envidando=0;
      io.emit("textoDerecha",1,fase,enviteAnterior[fase-1],ganadorEnvites[fase-1],[0,0]);
      //Ahora sumo el punto del envite al equipo correspondiente
      if (ganadorEnvites[fase-1]==1){
        marcadorA=marcadorA+enviteAnterior[fase-1];
        io.emit("marcadorA",marcadorA);
      } else{
        marcadorB=marcadorB+enviteAnterior[fase-1];
        io.emit("marcadorB",marcadorB);
      }
      analizarMarcador(marcadorA,marcadorB)
      //Ya he sumado el resultado al marcador, por  lo que
      envites[fase-1]=0;
      fase=siguientefase(fase);
    } else{
      io.emit("noQuiero3",turno)
    }
  })
  socket.on("siguienteMano2",(jugador)  =>{
    siguienteMano[jugador-1]=1
    let contManos=0;
    for (let i=1; i<5; i++){
      if (siguienteMano[i-1]==1){
        contManos=contManos+1;
      }
    }
    if (contManos==4){
      if (juegoAcabado>0){
        juegoAcabado=0;
        marcadorA=0;
        io.emit("marcadorA",marcadorA);
        marcadorB=0;
        io.emit("marcadorB",marcadorB);
      }
      //Comenzamos nueva mano
      repartirCartas();
      fase=0;
      mano=siguienteturno(mano);
      io.emit("colocarBaraja",mano);
      turno=mano;
      contturno=0;
      siPares=[0,0,0,0];
      siJuego=[0,0,0,0];
      punto=0;
      siguienteMano=[0,0,0,0];
      paresAnalizados=[1,1,1,1];
      enviteAnterior=[1,1,1,1];
      //Al comenzar nueva mano debo borrar el texto de la derecha
      io.emit("borrarTextoDerecha");
      io.emit("turno","setMus",turno,fase,punto);
    } else{
      io.emit("siguienteMano1",siguienteMano,juegoAcabado);
      io.emit("mostrarManos",manos);
    }
  })
  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
    jugadores = jugadores.filter(j => j.id !== socket.id);
    delete manos[socket.id];
  });
})



server.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
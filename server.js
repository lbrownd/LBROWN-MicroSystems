const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir la carpeta "public" como estática (donde estará el index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Guardamos el último estado reportado de las rutas en memoria
let estadoRutas = {};

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado:', socket.id);

    // 1. Escuchar cuando el conductor envía coordenadas
    socket.on('conductor_envia_coordenadas', (data) => {
        // data contiene: { rutaId, lat, lng, velocidad, precision }
        
        // Agregar la hora del servidor en formato legible
        data.ultimaActualizacion = new Date().toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            timeZone: 'America/Managua' // Configurado para la hora de Nicaragua
        });

        // Guardar el estado
        estadoRutas[data.rutaId] = data;

        // Reenviar las coordenadas a todos los pasajeros conectados
        io.emit(`usuario_recibe_ruta_${data.rutaId}`, data);
    });

    // 2. Escuchar cuando el conductor finaliza el turno
    socket.on('finalizar_viaje_limpiar_bitacora', () => {
        console.log('Turno finalizado. Limpiando mapas de pasajeros.');
        estadoRutas = {};
        // Ordenar a todos los pasajeros limpiar el mapa
        io.emit('limpiar_mapa_pasajeros');
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Render define el puerto dinámicamente en process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

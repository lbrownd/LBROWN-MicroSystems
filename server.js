process.env.TZ = 'America/Managua'; // Forzar horario de Nicaragua en la nube
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = process.env.PORT || 3000;

// PARCHE DE SEGURIDAD GLOBAL: Desarma el cortafuegos de Render para permitir mapas y sockets libres
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src 'self' * wss://* ws://*;"
    );
    next();
});

app.use(express.json());

// Servir la interfaz web unificada
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// CANALES DE COMUNICACIÓN EN TIEMPO REAL DIRECTOS
io.on('connection', (socket) => {
    console.log(`📡 Dispositivo conectado: ${socket.id}`);

    // Escuchar coordenadas del conductor y retransmitirlas al instante
    socket.on('conductor_envia_coordenadas', (data) => {
        data.ultimaActualizacion = new Date().toLocaleTimeString();
        
        // Log limpio en la consola de Render para monitoreo en vivo
        console.log(`🚗 [${data.rutaId}] Lat: ${data.lat}, Lng: ${data.lng} | Precisión: ${data.precision}m`);
        
        // Retransmisión masiva inmediata a todos los pasajeros/oficinas
        io.emit(`usuario_recibe_ruta_${data.rutaId}`, data);
    });

    socket.on('finalizar_viaje_limpiar_bitacora', () => {
        io.emit('limpiar_mapa_pasajeros');
    });

    socket.on('disconnect', () => console.log(`❌ Dispositivo desconectado: ${socket.id}`));
});

// Levantar el servicio en la red de Render
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de tracking corriendo en el puerto ${PORT}`);
});

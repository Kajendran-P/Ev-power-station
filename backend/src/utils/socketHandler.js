const SosRequest = require('../models/SosRequest');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Technician sends location updates
    socket.on('sos:location-update', async (data) => {
      try {
        const { sosId, lat, lng } = data;
        const sos = await SosRequest.findOne({ sosId });
        if (sos && sos.status === 'on_the_way') {
          sos.techLat = lat;
          sos.techLng = lng;
          sos.updatedAt = Date.now();
          await sos.save();
          // Broadcast to all clients
          io.emit('sos:updated', sos);
        }
      } catch (err) {
        console.error('Socket location update error:', err);
      }
    });

    // Status change broadcast
    socket.on('sos:status-change', async (data) => {
      try {
        const { sosId, status } = data;
        const sos = await SosRequest.findOne({ sosId });
        if (sos) {
          sos.status = status;
          sos.updatedAt = Date.now();
          await sos.save();
          io.emit('sos:updated', sos);
        }
      } catch (err) {
        console.error('Socket status change error:', err);
      }
    });

    // Join SOS tracking room
    socket.on('sos:track', (sosId) => {
      socket.join(`sos-${sosId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

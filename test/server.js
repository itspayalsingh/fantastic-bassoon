const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');

// Create an HTTP server
const app = express();
const server = http.createServer(app);

// Create a Socket.IO server
const io = socketio(server);

// Serve the client-side files
app.use(express.static('public'));

// Listen for Socket.IO connections
io.on('connection', (socket) => {
	console.log('Socket.IO connection established');

	// Create a writable stream
	let outputStream = null;

	// Listen for frame data from the client
	socket.on('frame', (data) => {
		if (outputStream) {
			outputStream.write(Buffer.from(data.replace(/^data:image\/\w+;base64,/, ''), 'base64'));
		}
	});

	// Listen for video data from the client
	socket.on('video', (data) => {
		const videoFilePath = 'recordings/' + Date.now() + '.webm';
		const fileStream = fs.createWriteStream(videoFilePath);
		fileStream.on('finish', () => {
			console.log('Video file saved:', videoFilePath);

			// Use FFmpeg to convert the video file to MP4 format
			const mp4FilePath = videoFilePath.replace('.webm', '.mp4');
			ffmpeg(videoFilePath)
				.on('error', (err) => {
					console.log('An error occurred while converting the video to MP4:', err.message);
				})
				.on('end', () => {
					console.log('Video file converted to MP4:', mp4FilePath);

					// Delete the original WebM file
					fs.unlink(videoFilePath, (err) => {
						if (err) {
							console.log('An error occurred while deleting the WebM file:', err.message);
						} else {
							console.log('WebM file deleted:', videoFilePath);
						}
					});
				})
				.outputOptions('-c:v', 'libx264')
				.outputOptions('-preset', 'medium')
				.outputOptions('-crf', '22')
				.outputOptions('-c:a', 'aac')
				.outputOptions('-b:a', '128k')
				.save(mp4FilePath);
		});
		outputStream = fileStream;
	});

	// Listen for Socket.IO disconnections
	socket.on('disconnect', () => {
		console.log('Socket.IO connection closed');

		// Close the output stream
		if (outputStream) {
			outputStream.end();
			outputStream = null;
		}
	});
});

// Start the server
server.listen(8080, () => {
	console.log('Web server listening on port 8080');
});

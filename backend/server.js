const http = require("http")
const express = require("express")
const WebSocket = require("ws")
const { createVerify } = require("crypto")

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const port = process.env.PORT || 5241

const baseASCII = 10240
const power2 = [1, 2, 4, 8, 16, 32, 64, 128]

wss.on("connection", ws => {
	ws.onmessage = async (message) => {
		const { data } = message
		const [task, payload] = JSON.parse(data)
		switch(task) {
			case "grayscale": {
				let width = payload.width
				let height = payload.height
				let pixels = payload.pixels

				let imageData = []
				for(let row = 0; row < height; row ++) {
					for(let col = 0; col < width; col ++) {
						let pos = (row * width + col) * 4
						if(pixels[pos.toString()] === 255) {
							imageData.push(0)
						}
						else {
							imageData.push(1)
						}
					}
				}

				let asciiCodes = []
				let rh = Math.floor(height / 4)
				let rw = Math.floor(width / 2)
				for(let row = 0; row < rh; row ++) {
					for(let col = 0; col < rw; col ++) {
						let hashVal = 0
						let baseRow = row * 4
						let baseCol = col * 2
						for(let i = 0; i < 3; i ++) {
							hashVal += imageData[(baseRow + i) * width + baseCol] * power2[i]
							hashVal += imageData[(baseRow + i) * width + baseCol + 1] * power2[3 + i]
						}
						hashVal += imageData[(baseRow + 3) * width + baseCol] * power2[6]
						hashVal += imageData[(baseRow + 3) * width + baseCol + 1] * power2[7]
						asciiCodes.push(baseASCII + hashVal)
					}
				}
				ws.send(JSON.stringify(["ascii", { width: rw, height: rh, asciiCodes: asciiCodes }]))

				
			}
			default: {
				break
			}
		}
	}
})

server.listen(port, () => {
	console.log(`Listening on port ${port}`)
})

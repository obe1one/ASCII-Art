import './App.css'
import React, { useEffect, useState } from 'react'

const client = new WebSocket('ws://localhost:4000')


function App() {
  const [image, setImage] = useState("")
  const [grayscaleImage, setGrayscaleImage] = useState("")
  const [thres, setThres] = useState(128)

  client.onmessage = (message) => {
    const [task, payload] = JSON.parse(message.data)
    switch(task) {
      case "ascii": {
        let width = payload.width
        let height = payload.height
        let asciiCodes = payload.asciiCodes
        let target = document.getElementById("ascii-functional")
        
        while(target.firstChild) {
          target.removeChild(target.lastChild)
        }

        for(let row = 0; row < height; row ++) {
          let newContent = ""
          let basePos = row * width
          for(let col = 0; col < width; col ++) {
            newContent += String.fromCharCode(asciiCodes[basePos + col])
          }
          let content = document.createTextNode(newContent)
          target.appendChild(content)
          target.appendChild(document.createElement("br"))
        }
      }
      default: {
        break
      }
    }
  }

  const handleImageInput = (e) => {
    let imgURL = URL.createObjectURL(e.target.files[0])
    setImage(imgURL)
  }

  const handleThresholding = () => {
    let target = document.getElementById("upload-image")
    let width = target.width
    let height = target.height

    let canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    let context = canvas.getContext('2d')
    context.drawImage(target, 0, 0, width, height)
    let imageData = context.getImageData(0, 0, width, height).data

    let buffer = new Uint8ClampedArray(width * height * 4)
    for(let row = 0; row < height; row ++) {
      for(let col = 0; col < width; col ++) {
        let pos = (row * width + col) * 4
        let grayscale = Math.floor((imageData[pos] + imageData[pos + 1] + imageData[pos + 2]) / 3)
        grayscale = (grayscale >= thres)? 255 : 0
        buffer[pos] = grayscale
        buffer[pos + 1] = grayscale
        buffer[pos + 2] = grayscale
        buffer[pos + 3] = 255
      }
    }
    let newImage = context.createImageData(width, height)
    newImage.data.set(buffer)
    context.putImageData(newImage, 0, 0)

    let newImageURL = canvas.toDataURL()
    setGrayscaleImage(newImageURL)

    imageData = context.getImageData(0, 0, width, height).data
    client.send(JSON.stringify(["grayscale", { width: width, height: height, pixels: imageData }]))
  }

  const handleThresAdd = () => {
    if(thres >= 255) return
    setThres(thres + 1)
  }

  const handleThresMinus = () => {
    if(thres <= 0) return
    setThres(thres - 1)
  }

  useEffect(() => {
    if(image !== "") {
      handleThresholding()
    }
  }, [thres])

  return (
    <div className="App">
      <header> ChoCho ASCII ART </header>
      <div className="upload-functional">
        <div className="thres-panel">
          threshold:
          <button type="submit" onClick={handleThresMinus}> &#8249; </button>
          {thres}
          <button type="submit" onClick={handleThresAdd}> &#8250; </button>
        </div>
        <input type="file" id="image-input" accept="image/*" onChange={handleImageInput}/>
        <label htmlFor="image-input"> Upload Image </label>
      </div>
      <div className="image-display">
        <div className="upload-image">
          <div className="origin-image">
            <p> Origin picture: </p>
            <img src={image} id="upload-image" onLoad={handleThresholding}/>
          </div>
          <div className="grayscale-image">
            <p> Binarized picture: </p>
            <img src={grayscaleImage} id="grayscale-image"></img>
          </div>
        </div>
        <div className="ascii-functional" id="ascii-functional">
        </div>
      </div>
    </div>
  );
}

export default App;

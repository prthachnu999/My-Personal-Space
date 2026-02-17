// ไฟล์: main.jsx (หรือ index.js)
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './image_downloader' // อ้างอิงไปที่ไฟล์ image_downloader.jsx ของคุณ
import './index.css' // ไฟล์นี้ต้องมีการ import Tailwind CSS ไว้

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
// เปลี่ยนชื่อเวอร์ชัน Cache เป็น v27 (LinkStart-Hub) เพื่อให้ระบบรู้ว่าเปลี่ยนโครงสร้างไฟล์ใหม่แล้ว
const CACHE_NAME = 'personal-space-hub-v27';

// รายชื่อไฟล์ที่ต้องการให้โหลดเก็บไว้ในเครื่อง
const ASSETS = [
    './',
    './index.html',              // หน้าหลัก (เดิมคือ My-Personal-Space.html)
    './DARK REPULSER.html',      // เครื่องมือ 1
    './ELUCIDATOR.html',         // เครื่องมือ 2
    './WATERMARK MASTER.html',   // เครื่องมือ 3
    './manifest.json',
    './คิรโตะธีมดำ.jpg',          // รูปไอคอน 1
    './คิริโตะ.jpg',              // รูปไอคอน 2
    
    // External Libraries (CDN) - สำคัญสำหรับการใช้งาน Offline
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Sarabun:wght@300;400;600&display=swap'
];

// 1. ติดตั้ง Service Worker
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Installed');
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all assets');
            return cache.addAll(ASSETS);
        })
    );
});

// 2. ควบคุมการดึงข้อมูล (Cache First)
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request).catch(() => {
                console.log('Offline: Cannot load ' + e.request.url);
            });
        })
    );
});

// 3. ลบ Cache เวอร์ชันเก่าทิ้ง
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});
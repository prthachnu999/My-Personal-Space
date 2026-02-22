// ==========================================
// KIRITO PULL SYSTEM - FULL GITHUB EDITION
// ==========================================
(function() {
    // 1. ลบระบบเก่าออกถ้ามีการเปิดค้างไว้
    if(document.getElementById('krt-sys-wrapper')) {
        document.getElementById('krt-sys-wrapper').remove();
    }

    // 2. ฟังก์ชันคัดกรองและดึงขนาดรูปภาพ
    const cleanK = function(u) {
        try {
            let p = u.split('?')[0].split('#')[0];
            p = p.replace(/[-_]\d+x\d+(?=\.[a-zA-Z0-9]+$)/i, '');
            return p;
        } catch(e) { return u; }
    };
    
    const getSc = function(u) {
        try {
            let m = u.split('?')[0].match(/[-_](\d+)x(\d+)(?=\.[a-zA-Z0-9]+$)/i);
            return m ? parseInt(m[1]) * parseInt(m[2]) : 0;
        } catch(e) { return 0; }
    };

    const uMap = new Map();
    const addImg = function(s) {
        if(!s || typeof s !== 'string' || s.startsWith('data:')) return;
        if(s.startsWith('//')) s = 'https:' + s;
        else if(s.startsWith('/')) s = location.origin + s;
        
        try {
            let u = new URL(decodeURIComponent(s), 'http://d').searchParams.get('url');
            if(u) s = u;
        } catch(e) {}
        
        let uL = s.toLowerCase().split('?')[0];
        if(uL.match(/\.(js|css|html|php|json|xml|txt)$/i)) return;
        if(!uL.match(/\.(jpg|jpeg|png|webp|gif|svg|tiff|heic|ico)$/i)) return;
        
        let k = cleanK(s);
        let ex = uMap.get(k);
        if(!ex || getSc(s) > getSc(ex)) {
            uMap.set(k, s);
        } else if(getSc(s) === getSc(ex) && !s.includes('?') && ex.includes('?')) {
            uMap.set(k, s);
        }
    };

    // 3. สแกนหาดึงรูปภาพจากหน้าเว็บ
    Array.from(document.images).forEach(e => addImg(e.src));
    Array.from(document.querySelectorAll('img, a, link, div, span, section')).forEach(e => {
        ['data-src', 'data-original', 'data-lazy-src', 'data-srcset'].forEach(attr => {
            let ds = e.getAttribute(attr);
            if(ds) ds.split(',').forEach(p => addImg(p.trim().split(' ')[0]));
        });
        if((e.tagName === 'A' || e.tagName === 'LINK') && e.href) addImg(e.href);
        let bg = window.getComputedStyle(e).backgroundImage;
        let m = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if(m) addImg(m[1]);
    });

    if(uMap.size === 0) {
        alert('ไม่พบรูปภาพ (KIRITO SYSTEM)');
        return;
    }

    // 4. สร้าง UI ด้วย Shadow DOM (ป้องกัน CSS ตีกัน)
    const wrapper = document.createElement('div');
    wrapper.id = 'krt-sys-wrapper';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(wrapper);

    const shadow = wrapper.attachShadow({mode: 'open'});
    shadow.innerHTML = `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: #111; overflow-y: auto; padding: 20px; color: #fff; pointer-events: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f03; padding-bottom: 10px; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
            h1 { color: #f03; margin: 0; text-shadow: 0 0 10px #f03; font-size: 24px; }
            .btn-group { display: flex; gap: 10px; }
            button { border: none; padding: 10px 20px; cursor: pointer; border-radius: 5px; font-weight: bold; color: #fff; transition: opacity 0.2s; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            .btn-zip { background: #28a745; }
            .btn-close { background: #f03; }
            .btn-dl { background: #f03; width: 100%; padding: 8px; margin-top: auto; font-size: 12px; }
            .info-text { color: #aaa; font-size: 14px; margin-bottom: 15px; display: flex; justify-content: space-between; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; }
            .card { background: #222; border: 1px solid #333; border-radius: 6px; padding: 10px; display: flex; flex-direction: column; text-align: center; }
            .card img { width: 100%; height: 120px; object-fit: contain; margin-bottom: 10px; background: #000; cursor: zoom-in; border-radius: 4px; }
            .card .filename { color: #aaa; font-size: 10px; margin-bottom: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            /* Lightbox & ทัชสกรีน */
            .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10; align-items: center; justify-content: center; touch-action: none; pointer-events: auto; }
            .lb-close { position: absolute; top: 20px; right: 20px; color: #f03; font-size: 40px; cursor: pointer; z-index: 11; width: 50px; height: 50px; text-align: center; line-height: 50px; background: rgba(0,0,0,0.5); border-radius: 50%; }
            .lb-img { max-width: 95%; max-height: 95%; transition: transform 0.1s ease-out; cursor: grab; user-select: none; -webkit-user-drag: none; }
            .lb-img:active { cursor: grabbing; }
            .lb-hint { position: absolute; bottom: 20px; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 20px; display: flex; gap: 15px; color: #fff; font-size: 12px; z-index: 11; pointer-events: none; }
        </style>
        
        <div class="container">
            <div class="header">
                <h1>KIRITO PULL</h1>
                <div class="btn-group">
                    <button id="btn-zip" class="btn-zip">โหลด ZIP</button>
                    <button id="btn-close" class="btn-close">ปิดหน้าต่าง</button>
                </div>
            </div>
            <div class="info-text">
                <span id="status-text">พบรูปภาพทั้งหมด ${uMap.size} รูป</span>
            </div>
            <div id="gallery" class="grid"></div>
        </div>
        
        <div id="lightbox" class="lightbox">
            <div id="lb-close" class="lb-close">&times;</div>
            <img id="lb-img" class="lb-img">
            <div class="lb-hint">
                <span>เมาส์: ซูม</span>
                <span>ลาก/ทัชสกรีน: เลื่อน</span>
            </div>
        </div>
    `;

    const gallery = shadow.getElementById('gallery');
    const lightbox = shadow.getElementById('lightbox');
    const lbImg = shadow.getElementById('lb-img');
    const statusText = shadow.getElementById('status-text');

    // 5. ระบบดึงรูปภาพ (มี Proxy สำรองเผื่อโดนบล็อก)
    const fetchImg = async (url) => {
        const proxies = ['', 'https://api.codetabs.com/v1/proxy?quest=', 'https://corsproxy.io/?'];
        for(let p of proxies) {
            try {
                let target = p ? p + encodeURIComponent(url) : url;
                let ctrl = new AbortController();
                let tid = setTimeout(() => ctrl.abort(), 6000);
                let r = await fetch(target, {signal: ctrl.signal});
                clearTimeout(tid);
                if(r.ok) {
                    let b = await r.blob();
                    if(b.size > 150 && !b.type.includes('text/html')) return b;
                }
            } catch(e) {}
        }
        return null;
    };

    // 6. แสดงผลแกลเลอรี
    let sc = 1, tx = 0, ty = 0; // ตัวแปรสำหรับ Lightbox
    const updateTransform = () => lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;

    Array.from(uMap.values()).forEach((s, idx) => {
        let card = document.createElement('div');
        card.className = 'card';
        
        let img = document.createElement('img');
        img.src = s;
        img.onerror = function() {
            if(!this.retried) {
                this.retried = true;
                this.src = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(s);
            } else {
                this.style.opacity = '0.3';
            }
        };
        img.onclick = () => {
            lightbox.style.display = 'flex';
            lbImg.src = s;
            sc = 1; tx = 0; ty = 0; updateTransform();
        };

        let fname = s.split('/').pop().split('?')[0];
        try { fname = decodeURIComponent(fname); } catch(e) {}
        let info = document.createElement('div');
        info.className = 'filename';
        info.innerText = fname || 'image';

        let btn = document.createElement('button');
        btn.className = 'btn-dl';
        btn.innerText = 'ดาวน์โหลด';
        btn.onclick = async () => {
            let og = btn.innerText;
            btn.innerText = 'กำลังโหลด...';
            btn.style.pointerEvents = 'none';
            let b = await fetchImg(s);
            if(b) {
                let u2 = URL.createObjectURL(b);
                let a2 = document.createElement('a');
                a2.href = u2;
                a2.download = 'KIRITO_' + Date.now() + '.jpg';
                a2.click();
                URL.revokeObjectURL(u2);
                btn.innerText = 'สำเร็จ!';
                btn.style.background = '#28a745';
            } else {
                window.open(s, '_blank');
                btn.innerText = 'หน้าใหม่';
            }
            setTimeout(() => {
                btn.innerText = og;
                btn.style.background = '#f03';
                btn.style.pointerEvents = 'auto';
            }, 2000);
        };

        card.append(img, info, btn);
        gallery.append(card);
    });

    // 7. Event Listeners (ปุ่มปิด และ ระบบเลื่อนรูป)
    shadow.getElementById('btn-close').onclick = () => wrapper.remove();
    shadow.getElementById('lb-close').onclick = () => lightbox.style.display = 'none';

    let isDragging = false, startX, startY;
    
    // สำหรับเมาส์
    lbImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        sc += e.deltaY * -0.001;
        sc = Math.min(Math.max(0.5, sc), 8);
        updateTransform();
    }, {passive: false});
    
    lbImg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - tx;
        startY = e.clientY - ty;
    });
    
    lightbox.addEventListener('mouseup', () => isDragging = false);
    lightbox.addEventListener('mousemove', (e) => {
        if(!isDragging) return;
        e.preventDefault();
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        updateTransform();
    });

    // สำหรับทัชสกรีน
    lbImg.addEventListener('touchstart', (e) => {
        if(e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX - tx;
            startY = e.touches[0].clientY - ty;
        }
    }, {passive: false});
    
    lightbox.addEventListener('touchend', () => isDragging = false);
    lightbox.addEventListener('touchmove', (e) => {
        if(!isDragging || e.touches.length !== 1) return;
        e.preventDefault();
        tx = e.touches[0].clientX - startX;
        ty = e.touches[0].clientY - startY;
        updateTransform();
    }, {passive: false});

    // 8. ระบบสร้างไฟล์ ZIP
    shadow.getElementById('btn-zip').onclick = function() {
        let btn = this;
        btn.disabled = true;
        statusText.innerText = 'กำลังเตรียมระบบ ZIP...';
        statusText.style.color = '#fff';

        const doZip = async () => {
            statusText.innerText = 'กำลังโหลดข้อมูลรูปภาพ...';
            let zip = new JSZip();
            let urls = Array.from(uMap.values());
            let total = urls.length;
            let count = 0;

            for(let i=0; i<total; i++) {
                let s = urls[i];
                let b = await fetchImg(s);
                if(b) {
                    let fname = s.split('/').pop().split('?')[0];
                    try { fname = decodeURIComponent(fname); } catch(e) {}
                    let ext = fname.split('.').pop().toLowerCase();
                    if(ext.length > 4 || ext === fname.toLowerCase() || !ext) ext = 'jpg';
                    let base = fname.substring(0, fname.lastIndexOf('.')) || 'KIRITO_IMAGE';
                    let padIdx = String(i+1).padStart(3, '0');
                    zip.file(`${base}_${padIdx}.${ext}`, b);
                    count++;
                }
                statusText.innerText = `กำลังแพ็กไฟล์ ${count}/${total} ...`;
            }

            if(count === 0) {
                statusText.innerText = 'ล้มเหลว: โดนบล็อกการดึงรูป';
                statusText.style.color = '#f03';
                btn.disabled = false;
                return;
            }

            statusText.innerText = 'กำลังสร้างไฟล์ ZIP กรุณารอ...';
            try {
                let content = await zip.generateAsync({type: 'blob'});
                let u2 = URL.createObjectURL(content);
                let a2 = document.createElement('a');
                a2.href = u2;
                a2.download = 'KIRITO_PACK_' + Date.now() + '.zip';
                a2.click();
                URL.revokeObjectURL(u2);
                statusText.innerText = `ดาวน์โหลด ZIP สำเร็จ (${count} รูป)`;
                statusText.style.color = '#28a745';
                btn.innerText = 'สำเร็จ';
            } catch(e) {
                statusText.innerText = 'เกิดข้อผิดพลาดในการสร้าง ZIP';
                statusText.style.color = '#f03';
                btn.disabled = false;
            }
        };

        if(typeof JSZip === 'undefined') {
            statusText.innerText = 'กำลังโหลดไลบรารี JSZip...';
            let script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = doZip;
            document.head.appendChild(script);
        } else {
            doZip();
        }
    };

})();

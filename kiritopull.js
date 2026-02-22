// ==========================================
// KIRITO PULL SYSTEM - ULTIMATE GITHUB EDITION
// ==========================================
(function() {
    if(document.getElementById('krt-sys-wrapper')) {
        document.getElementById('krt-sys-wrapper').remove();
    }

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

    const wrapper = document.createElement('div');
    wrapper.id = 'krt-sys-wrapper';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(wrapper);

    const shadow = wrapper.attachShadow({mode: 'open'});
    shadow.innerHTML = `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            
            /* Glassmorphism Background */
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(15, 15, 15, 0.75); overflow-y: auto; padding: 25px; color: #fff; pointer-events: auto; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
            
            /* Custom Scrollbar */
            .container::-webkit-scrollbar { width: 8px; }
            .container::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
            .container::-webkit-scrollbar-thumb { background: rgba(255, 0, 51, 0.5); border-radius: 10px; }
            .container::-webkit-scrollbar-thumb:hover { background: rgba(255, 0, 51, 0.8); }

            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 15px; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
            h1 { color: #ff3333; margin: 0; text-shadow: 0 2px 10px rgba(255, 51, 51, 0.3); font-size: 26px; font-weight: 800; letter-spacing: 1px; }
            .btn-group { display: flex; gap: 12px; }
            
            button { border: none; padding: 10px 22px; cursor: pointer; border-radius: 8px; font-weight: 600; color: #fff; transition: all 0.2s ease; font-size: 14px; display: flex; align-items: center; justify-content: center; }
            button:active { transform: scale(0.95); }
            button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
            
            .btn-zip { background: linear-gradient(135deg, #28a745, #208838); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
            .btn-zip:hover { background: linear-gradient(135deg, #218838, #1e7e34); box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4); }
            
            .btn-close { background: rgba(255, 255, 255, 0.1); color: #fff; border: 1px solid rgba(255, 255, 255, 0.2); backdrop-filter: blur(5px); }
            .btn-close:hover { background: rgba(255, 51, 51, 0.8); border-color: transparent; }
            
            .info-text { color: #ccc; font-size: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .status-badge { background: rgba(255, 51, 51, 0.2); color: #ff3333; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; border: 1px solid rgba(255, 51, 51, 0.3); }
            
            /* Grid & Cards */
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }
            .card { background: rgba(30, 30, 30, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.2); transition: transform 0.3s ease, box-shadow 0.3s ease; }
            .card:hover { transform: translateY(-5px); box-shadow: 0 12px 25px rgba(0,0,0,0.4); border-color: rgba(255, 51, 51, 0.3); }
            
            .img-container { width: 100%; height: 130px; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; }
            .card img { max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in; transition: transform 0.3s ease; }
            .card:hover img { transform: scale(1.05); }
            
            .filename { color: #fff; font-size: 11px; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
            .dimensions { color: #888; font-size: 10px; margin-bottom: 12px; font-weight: 400; background: rgba(0,0,0,0.3); padding: 3px 0; border-radius: 4px; }
            
            .btn-dl { background: rgba(255, 51, 51, 0.8); width: 100%; padding: 8px; margin-top: auto; font-size: 12px; border-radius: 6px; }
            .btn-dl:hover { background: #ff3333; }
            
            /* Lightbox */
            .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10; align-items: center; justify-content: center; touch-action: none; pointer-events: auto; backdrop-filter: blur(5px); }
            .lb-close { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 30px; cursor: pointer; z-index: 11; width: 44px; height: 44px; text-align: center; line-height: 44px; background: rgba(255,255,255,0.1); border-radius: 50%; transition: all 0.2s; }
            .lb-close:hover { background: #ff3333; transform: rotate(90deg); }
            .lb-img { max-width: 95%; max-height: 95%; transition: transform 0.1s ease-out; cursor: grab; user-select: none; -webkit-user-drag: none; filter: drop-shadow(0 0 20px rgba(0,0,0,0.5)); }
            .lb-img:active { cursor: grabbing; }
            .lb-hint { position: absolute; bottom: 25px; background: rgba(0,0,0,0.6); padding: 10px 20px; border-radius: 30px; display: flex; gap: 20px; color: #ddd; font-size: 13px; z-index: 11; pointer-events: none; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(4px); }
        </style>
        
        <div class="container">
            <div class="header">
                <h1>KIRITO SYSTEM</h1>
                <div class="btn-group">
                    <button id="btn-zip" class="btn-zip">ดาวน์โหลด ZIP</button>
                    <button id="btn-close" class="btn-close">ปิดหน้าต่าง</button>
                </div>
            </div>
            <div class="info-text">
                <span id="status-text">พร้อมใช้งาน</span>
                <span class="status-badge">ดึงมาได้ ${uMap.size} รูป</span>
            </div>
            <div id="gallery" class="grid"></div>
        </div>
        
        <div id="lightbox" class="lightbox">
            <div id="lb-close" class="lb-close">&times;</div>
            <img id="lb-img" class="lb-img">
            <div class="lb-hint">
                <span>🖱️ กลิ้งเมาส์: ซูม</span>
                <span>👆 ลาก/ทัช: เลื่อน</span>
            </div>
        </div>
    `;

    const gallery = shadow.getElementById('gallery');
    const lightbox = shadow.getElementById('lightbox');
    const lbImg = shadow.getElementById('lb-img');
    const statusText = shadow.getElementById('status-text');

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

    let sc = 1, tx = 0, ty = 0;
    const updateTransform = () => lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;

    Array.from(uMap.values()).forEach((s, idx) => {
        let card = document.createElement('div');
        card.className = 'card';
        
        let imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        
        let img = document.createElement('img');
        img.src = s;
        
        let dimInfo = document.createElement('div');
        dimInfo.className = 'dimensions';
        dimInfo.innerText = 'กำลังคำนวณขนาด...';

        img.onload = function() {
            // ดึงค่าความกว้าง และ ความยาวของรูปภาพมาแสดงผล
            if(this.naturalWidth && this.naturalHeight) {
                dimInfo.innerText = `กว้าง: ${this.naturalWidth}px | ยาว: ${this.naturalHeight}px`;
            } else {
                dimInfo.innerText = 'ไม่ทราบขนาด';
            }
        };

        img.onerror = function() {
            if(!this.retried) {
                this.retried = true;
                this.src = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(s);
            } else {
                this.style.opacity = '0.3';
                dimInfo.innerText = 'โหลดล้มเหลว';
            }
        };

        img.onclick = () => {
            lightbox.style.display = 'flex';
            lbImg.src = s;
            sc = 1; tx = 0; ty = 0; updateTransform();
        };

        imgContainer.appendChild(img);

        let fname = s.split('/').pop().split('?')[0];
        try { fname = decodeURIComponent(fname); } catch(e) {}
        let info = document.createElement('div');
        info.className = 'filename';
        info.innerText = fname || `image_${idx+1}.jpg`;

        let btn = document.createElement('button');
        btn.className = 'btn-dl';
        btn.innerText = 'ดาวน์โหลดรูปนี้';
        btn.onclick = async () => {
            let og = btn.innerText;
            btn.innerText = 'กำลังโหลด...';
            btn.style.pointerEvents = 'none';
            let b = await fetchImg(s);
            if(b) {
                let u2 = URL.createObjectURL(b);
                let a2 = document.createElement('a');
                a2.href = u2;
                a2.download = 'KIRITO_' + Date.now() + '_' + idx + '.jpg';
                a2.click();
                URL.revokeObjectURL(u2);
                btn.innerText = 'โหลดสำเร็จ!';
                btn.style.background = '#28a745';
            } else {
                window.open(s, '_blank');
                btn.innerText = 'เปิดหน้าใหม่';
            }
            setTimeout(() => {
                btn.innerText = og;
                btn.style.background = 'rgba(255, 51, 51, 0.8)';
                btn.style.pointerEvents = 'auto';
            }, 2000);
        };

        card.append(imgContainer, info, dimInfo, btn);
        gallery.append(card);
    });

    shadow.getElementById('btn-close').onclick = () => wrapper.remove();
    shadow.getElementById('lb-close').onclick = () => lightbox.style.display = 'none';

    let isDragging = false, startX, startY;
    
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
                statusText.style.color = '#ff3333';
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
                statusText.style.color = '#ff3333';
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

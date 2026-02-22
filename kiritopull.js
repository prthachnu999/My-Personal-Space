// ==========================================
// KIRITO PULL SYSTEM - MASTERPIECE EDITION 
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

    const imgArray = Array.from(uMap.values());
    let currentLbIndex = 0;

    const wrapper = document.createElement('div');
    wrapper.id = 'krt-sys-wrapper';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(wrapper);

    const shadow = wrapper.attachShadow({mode: 'open'});
    shadow.innerHTML = `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            
            @keyframes krtFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            
            /* ปรับความใสของพื้นหลัง (0.55) และความเบลอ (15px) */
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.55); overflow-y: auto; padding: 25px; color: #fff; pointer-events: auto; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: krtFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            
            .container::-webkit-scrollbar { width: 8px; }
            .container::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); }
            .container::-webkit-scrollbar-thumb { background: rgba(255, 0, 51, 0.6); border-radius: 10px; }
            .container::-webkit-scrollbar-thumb:hover { background: rgba(255, 0, 51, 0.9); }

            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 15px; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
            h1 { color: #ff3333; margin: 0; text-shadow: 0 2px 15px rgba(255, 51, 51, 0.4); font-size: 28px; font-weight: 800; letter-spacing: 1px; }
            .btn-group { display: flex; gap: 10px; flex-wrap: wrap; }
            
            button { border: none; padding: 10px 20px; cursor: pointer; border-radius: 8px; font-weight: 600; color: #fff; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 6px; }
            button:active { transform: scale(0.95); }
            button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; filter: grayscale(100%); }
            
            .btn-zip { background: linear-gradient(135deg, #28a745, #208838); box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3); }
            .btn-zip:hover:not(:disabled) { background: linear-gradient(135deg, #218838, #1e7e34); box-shadow: 0 6px 20px rgba(40, 167, 69, 0.5); transform: translateY(-2px); }
            
            .btn-select { background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.2); }
            .btn-select:hover { background: rgba(255, 255, 255, 0.25); }
            
            .btn-close { background: rgba(255, 51, 51, 0.15); color: #ff3333; border: 1px solid rgba(255, 51, 51, 0.3); }
            .btn-close:hover { background: #ff3333; color: #fff; }
            
            .info-text { color: #eee; font-size: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .status-badge { background: rgba(255, 51, 51, 0.2); color: #ffbbbb; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 51, 51, 0.3); }
            
            /* Grid & Cards */
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
            .card { position: relative; background: rgba(30, 30, 30, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; text-align: center; box-shadow: 0 8px 25px rgba(0,0,0,0.25); transition: all 0.3s ease; }
            .card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); border-color: rgba(255, 51, 51, 0.4); background: rgba(40, 40, 40, 0.8); }
            
            .card-checkbox { position: absolute; top: 15px; left: 15px; z-index: 2; width: 22px; height: 22px; cursor: pointer; accent-color: #ff3333; }
            .card-copy { position: absolute; top: 15px; right: 15px; z-index: 2; background: rgba(0,0,0,0.6); color: #fff; border: none; border-radius: 6px; padding: 4px 8px; font-size: 10px; cursor: pointer; backdrop-filter: blur(4px); transition: 0.2s; }
            .card-copy:hover { background: #ff3333; }

            .img-container { width: 100%; height: 140px; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; position: relative; }
            .card img { max-width: 100%; max-height: 100%; object-fit: contain; cursor: zoom-in; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .card:hover img { transform: scale(1.08); }
            
            .filename { color: #fff; font-size: 11px; margin-bottom: 5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; padding: 0 5px; }
            .dimensions { color: #aaa; font-size: 10px; margin-bottom: 12px; font-weight: 400; background: rgba(0,0,0,0.4); padding: 4px 0; border-radius: 6px; }
            
            .btn-dl { background: rgba(255, 51, 51, 0.8); width: 100%; padding: 10px; margin-top: auto; font-size: 12px; border-radius: 6px; font-weight: 600; }
            .btn-dl:hover { background: #ff3333; }
            
            /* Lightbox & Navigation */
            .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); z-index: 10; align-items: center; justify-content: center; touch-action: none; pointer-events: auto; backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.3s; }
            .lightbox.active { opacity: 1; display: flex; }
            
            .lb-close { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 32px; cursor: pointer; z-index: 12; width: 48px; height: 48px; text-align: center; line-height: 48px; background: rgba(255,255,255,0.1); border-radius: 50%; transition: all 0.2s; }
            .lb-close:hover { background: #ff3333; transform: rotate(90deg); }
            
            .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); color: #fff; font-size: 40px; cursor: pointer; z-index: 11; width: 50px; height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: 0.2s; }
            .lb-nav:hover { background: rgba(255,51,51,0.6); }
            .lb-prev { left: 10px; border-radius: 0 10px 10px 0; }
            .lb-next { right: 10px; border-radius: 10px 0 0 10px; }

            .lb-img { max-width: 90%; max-height: 90%; transition: transform 0.15s ease-out; cursor: grab; user-select: none; -webkit-user-drag: none; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.8)); transform-origin: center; }
            .lb-img.grabbing { cursor: grabbing; transition: none; }
            
            .lb-hint { position: absolute; bottom: 25px; background: rgba(0,0,0,0.7); padding: 10px 25px; border-radius: 30px; display: flex; gap: 20px; color: #eee; font-size: 13px; z-index: 11; pointer-events: none; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(5px); }
        </style>
        
        <div class="container">
            <div class="header">
                <h1>KIRITO SYSTEM</h1>
                <div class="btn-group">
                    <button id="btn-select-all" class="btn-select">☑️ เลือกทั้งหมด / ยกเลิก</button>
                    <button id="btn-zip" class="btn-zip">📦 ดาวน์โหลด ZIP ที่เลือก</button>
                    <button id="btn-close" class="btn-close">✖ ปิดระบบ</button>
                </div>
            </div>
            <div class="info-text">
                <span id="status-text">พร้อมใช้งาน</span>
                <span class="status-badge" id="count-badge">ดึงมาได้ ${imgArray.length} รูป</span>
            </div>
            <div id="gallery" class="grid"></div>
        </div>
        
        <div id="lightbox" class="lightbox">
            <div id="lb-close" class="lb-close">&times;</div>
            <div id="lb-prev" class="lb-nav lb-prev">&#10094;</div>
            <img id="lb-img" class="lb-img">
            <div id="lb-next" class="lb-nav lb-next">&#10095;</div>
            <div class="lb-hint">
                <span>🖱️ ซูม/ลากรูป</span>
                <span>↔️ เปลี่ยนรูป</span>
            </div>
        </div>
    `;

    const gallery = shadow.getElementById('gallery');
    const lightbox = shadow.getElementById('lightbox');
    const lbImg = shadow.getElementById('lb-img');
    const statusText = shadow.getElementById('status-text');
    const countBadge = shadow.getElementById('count-badge');

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

    const openLightbox = (index) => {
        currentLbIndex = index;
        lbImg.src = imgArray[index];
        sc = 1; tx = 0; ty = 0; 
        updateTransform();
        lightbox.classList.add('active');
    };

    const updateSelectionCount = () => {
        const checked = shadow.querySelectorAll('.chk-select:checked').length;
        countBadge.innerText = `เลือกไว้ ${checked}/${imgArray.length} รูป`;
    };

    imgArray.forEach((s, idx) => {
        let card = document.createElement('div');
        card.className = 'card';
        
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'card-checkbox chk-select';
        checkbox.checked = true;
        checkbox.onchange = updateSelectionCount;
        checkbox.setAttribute('data-url', s);

        let copyBtn = document.createElement('button');
        copyBtn.className = 'card-copy';
        copyBtn.innerText = '🔗 Copy';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(s);
            copyBtn.innerText = '✔ Copied';
            setTimeout(() => copyBtn.innerText = '🔗 Copy', 2000);
        };
        
        let imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        
        let img = document.createElement('img');
        img.src = s;
        
        let dimInfo = document.createElement('div');
        dimInfo.className = 'dimensions';
        dimInfo.innerText = 'กำลังคำนวณ...';

        img.onload = function() {
            if(this.naturalWidth && this.naturalHeight) {
                dimInfo.innerText = `กว้าง: ${this.naturalWidth}px | ยาว: ${this.naturalHeight}px`;
            } else dimInfo.innerText = 'ไม่ทราบขนาด';
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

        img.onclick = () => openLightbox(idx);
        imgContainer.appendChild(img);

        let fname = s.split('/').pop().split('?')[0];
        try { fname = decodeURIComponent(fname); } catch(e) {}
        let info = document.createElement('div');
        info.className = 'filename';
        info.innerText = fname || `image_${idx+1}.jpg`;

        let btn = document.createElement('button');
        btn.className = 'btn-dl';
        btn.innerText = '💾 โหลดรูปนี้';
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
                btn.innerText = '✔ สำเร็จ!';
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

        card.append(checkbox, copyBtn, imgContainer, info, dimInfo, btn);
        gallery.append(card);
    });

    updateSelectionCount();

    // Event Listeners UI หลัก
    shadow.getElementById('btn-close').onclick = () => {
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'opacity 0.3s';
        setTimeout(() => wrapper.remove(), 300);
    };

    let allSelected = true;
    shadow.getElementById('btn-select-all').onclick = () => {
        allSelected = !allSelected;
        shadow.querySelectorAll('.chk-select').forEach(chk => chk.checked = allSelected);
        updateSelectionCount();
    };

    // === ระบบเปลี่ยนรูปใน Lightbox ===
    shadow.getElementById('lb-close').onclick = () => lightbox.classList.remove('active');
    
    const navLb = (dir) => {
        currentLbIndex += dir;
        if(currentLbIndex < 0) currentLbIndex = imgArray.length - 1;
        if(currentLbIndex >= imgArray.length) currentLbIndex = 0;
        openLightbox(currentLbIndex);
    };
    shadow.getElementById('lb-prev').onclick = () => navLb(-1);
    shadow.getElementById('lb-next').onclick = () => navLb(1);

    // === อัปเกรดระบบ Touch & Zoom & Swipe ===
    let isDragging = false, startX, startY, initDist = 0, initScale = 1;
    const getDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    
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
        lbImg.classList.add('grabbing');
    });
    
    lightbox.addEventListener('mouseup', (e) => {
        if(!isDragging) return;
        isDragging = false;
        lbImg.classList.remove('grabbing');
        // ตรวจจับการ Swipe บนเมาส์ถ้ารูปขนาดปกติ
        if(sc === 1) {
            let endX = e.clientX - startX;
            if(endX < -50) navLb(1);
            else if(endX > 50) navLb(-1);
            else { tx = 0; ty = 0; updateTransform(); }
        }
    });
    
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
            lbImg.classList.add('grabbing');
        } else if (e.touches.length === 2) {
            isDragging = false; 
            initDist = getDist(e.touches);
            initScale = sc;
        }
    }, {passive: false});
    
    lightbox.addEventListener('touchend', (e) => {
        lbImg.classList.remove('grabbing');
        if(e.touches.length === 0 && isDragging && sc === 1) {
            // ตรวจจับ Swipe บนมือถือ
            if(tx < -60) navLb(1);
            else if(tx > 60) navLb(-1);
            else { tx = 0; ty = 0; updateTransform(); }
        }
        isDragging = false;
    });
    
    lightbox.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
        if(isDragging && e.touches.length === 1) {
            tx = e.touches[0].clientX - startX;
            ty = e.touches[0].clientY - startY;
            updateTransform();
        } else if (e.touches.length === 2) {
            let currDist = getDist(e.touches);
            if (initDist > 0) {
                let nScale = initScale * (currDist / initDist);
                sc = Math.min(Math.max(0.5, nScale), 8); 
                updateTransform();
            }
        }
    }, {passive: false});

    // === ระบบแพ็ก ZIP ล่าสุด (เฉพาะรูปที่เลือก) ===
    shadow.getElementById('btn-zip').onclick = function() {
        let btn = this;
        let selectedCheckboxes = shadow.querySelectorAll('.chk-select:checked');
        if(selectedCheckboxes.length === 0) return alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');

        btn.disabled = true;
        statusText.innerText = 'กำลังเตรียมระบบ ZIP...';
        statusText.style.color = '#fff';

        const doZip = async () => {
            statusText.innerText = 'กำลังโหลดข้อมูลรูปภาพ...';
            let zip = new JSZip();
            let total = selectedCheckboxes.length;
            let count = 0;

            for(let i=0; i<total; i++) {
                let s = selectedCheckboxes[i].getAttribute('data-url');
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
                statusText.innerText = `โหลด ZIP สำเร็จ (${count} รูป)`;
                statusText.style.color = '#28a745';
                btn.innerText = 'สำเร็จ';
            } catch(e) {
                statusText.innerText = 'เกิดข้อผิดพลาดในการสร้าง ZIP';
                statusText.style.color = '#ff3333';
                btn.disabled = false;
            }
        };

        if(typeof JSZip === 'undefined') {
            statusText.innerText = 'กำลังโหลด JSZip...';
            let script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = doZip;
            document.head.appendChild(script);
        } else {
            doZip();
        }
    };
})();

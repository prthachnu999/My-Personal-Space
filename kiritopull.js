// ==========================================
// KIRITO PULL SYSTEM - ULTIMATE GITHUB EDITION v4 (SVG Icons Fix)
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
        
        s = s.trim().replace(/\\u002F/g, '/').replace(/\\/g, '');
        if(s.startsWith('//')) s = 'https:' + s;
        else if(s.startsWith('/')) s = location.origin + s;
        else if(!s.startsWith('http')) s = new URL(s, location.href).href;
        
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
    
    Array.from(document.querySelectorAll('*')).forEach(e => {
        ['data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'src', 'href', 'srcset', 'content', 'poster'].forEach(attr => {
            let ds = e.getAttribute(attr);
            if(ds) {
                if(ds.includes(',')) ds.split(',').forEach(p => addImg(p.trim().split(/\s+/)[0]));
                else addImg(ds);
            }
        });
        let bg = window.getComputedStyle(e).backgroundImage;
        let m = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if(m) addImg(m[1]);
    });
    
    const htmlCode = document.documentElement.innerHTML;
    const urlRegex = /(?:https?:|\\\/\\\/|\/\/)[^\s"'<>;&\\]+\.(?:jpg|jpeg|png|gif|webp|svg|ico)(?:\?[^\s"'<>\\]*)?/gi;
    let match;
    while ((match = urlRegex.exec(htmlCode)) !== null) {
        addImg(match[0]);
    }

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
    
    // --- ฝัง SVG Icons โดยตรง แก้ปัญหา CSP Blocked ---
    const SVGs = {
        dl: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        link: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
        copy: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        checkSq: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
        box: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
        times: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        check: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        spin: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" class="icon-spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>'
    };

    shadow.innerHTML += `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            @keyframes krtFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            @keyframes krtSpin { 100% { transform: rotate(360deg); } }
            
            svg { display: block; }
            .icon-spin { animation: krtSpin 1s linear infinite; }
            
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.65); overflow-y: auto; padding: 25px; color: #fff; pointer-events: auto; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: krtFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
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
            
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
            .card { position: relative; background: rgba(30, 30, 30, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 8px 25px rgba(0,0,0,0.25); transition: all 0.3s ease; overflow: hidden;}
            .card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); border-color: rgba(255, 51, 51, 0.4); }
            
            .card-checkbox { position: absolute; top: 12px; left: 12px; z-index: 5; width: 22px; height: 22px; cursor: pointer; accent-color: #ff3333; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5)); }

            .img-container { width: 100%; height: 160px; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; cursor: zoom-in; overflow: hidden; }
            .card img { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .card:hover img { transform: scale(1.08); }
            
            .img-info { width: 100%; padding: 12px 10px; background: rgba(0,0,0,0.5); color: #ccc; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
            .filename { color: #fff; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; flex: 1; margin-right: 5px;}
            .dimensions { color: #ffbbbb; font-size: 10px; font-weight: bold; background: rgba(255,51,51,0.1); padding: 3px 6px; border-radius: 4px; white-space: nowrap; }
            
            .img-actions { padding: 10px; background: rgba(10,10,10,0.8); display: flex; justify-content: center; gap: 8px; border-top: 1px solid rgba(255,51,51,0.2); }
            .btn-icon { flex: 1; height: 36px; border-radius: 6px; border: none; cursor: pointer; color: white; font-size: 0.95rem; transition: 0.2s; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); }
            .btn-icon:hover { transform: translateY(-3px); }
            .btn-dl { background: rgba(255,51,51,0.7); } .btn-dl:hover { background: #ff3333; box-shadow: 0 0 10px rgba(255,51,51,0.5); }
            .btn-copy-link { background: rgba(0,123,255,0.7); } .btn-copy-link:hover { background: #007bff; box-shadow: 0 0 10px rgba(0,123,255,0.5); }
            .btn-copy-img { background: rgba(40,167,69,0.7); } .btn-copy-img:hover { background: #28a745; box-shadow: 0 0 10px rgba(40,167,69,0.5); }
            
            /* Lightbox & Navigation */
            .lightbox { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.92); z-index: 10; align-items: center; justify-content: center; touch-action: none; pointer-events: auto; backdrop-filter: blur(8px); opacity: 0; transition: opacity 0.3s; }
            .lightbox.active { opacity: 1; display: flex; }
            .lb-close { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 32px; cursor: pointer; z-index: 12; width: 48px; height: 48px; text-align: center; line-height: 48px; background: rgba(255,255,255,0.1); border-radius: 50%; transition: all 0.2s; }
            .lb-close:hover { background: #ff3333; transform: rotate(90deg); }
            .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 40px; cursor: pointer; z-index: 11; width: 50px; height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: 0.2s; }
            .lb-nav:hover { background: rgba(255,51,51,0.6); color: white; }
            .lb-prev { left: 0; border-radius: 0 10px 10px 0; }
            .lb-next { right: 0; border-radius: 10px 0 0 10px; }
            .lb-img { max-width: 90%; max-height: 90%; transition: transform 0.15s ease-out; cursor: grab; user-select: none; -webkit-user-drag: none; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.8)); transform-origin: center; }
            .lb-img.grabbing { cursor: grabbing; transition: none; }
            .lb-hint { position: absolute; bottom: 25px; background: rgba(0,0,0,0.7); padding: 10px 25px; border-radius: 30px; display: flex; gap: 20px; color: #eee; font-size: 13px; z-index: 11; pointer-events: none; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(5px); }
        </style>
        
        <div class="container">
            <div class="header">
                <h1>KIRITO SYSTEM</h1>
                <div class="btn-group">
                    <button id="btn-select-all" class="btn-select">${SVGs.checkSq} เลือกทั้งหมด</button>
                    <button id="btn-zip" class="btn-zip">${SVGs.box} ดาวน์โหลด ZIP</button>
                    <button id="btn-close" class="btn-close">${SVGs.times} ปิดระบบ</button>
                </div>
            </div>
            <div class="info-text">
                <span id="status-text">กำลังรวบรวมข้อมูล...</span>
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
                <span>↔️ ปัดเพื่อเปลี่ยน</span>
            </div>
        </div>
    `;

    const gallery = shadow.getElementById('gallery');
    const lightbox = shadow.getElementById('lightbox');
    const lbImg = shadow.getElementById('lb-img');
    const statusText = shadow.getElementById('status-text');
    const countBadge = shadow.getElementById('count-badge');

    // UI Helper Functions (เปลี่ยนมารองรับ SVG)
    const showTempIcon = (btn, tempSvg, origSvg) => {
        btn.innerHTML = tempSvg;
        btn.style.background = '#28a745';
        setTimeout(() => { 
            btn.innerHTML = origSvg; 
            btn.style.background = ''; 
        }, 2000);
    };

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
    const updateTransform = () => {
        if(sc <= 1) { sc = 1; tx = 0; ty = 0; }
        lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
    }

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

        let imgContainer = document.createElement('div');
        imgContainer.className = 'img-container';
        let img = document.createElement('img');
        img.src = s;
        img.loading = "lazy";
        
        let infoContainer = document.createElement('div');
        infoContainer.className = 'img-info';
        let filenameSpan = document.createElement('span');
        filenameSpan.className = 'filename';
        let dimSpan = document.createElement('span');
        dimSpan.className = 'dimensions';
        dimSpan.innerText = 'คำนวณ...';

        img.onload = function() {
            if(this.naturalWidth && this.naturalHeight) {
                dimSpan.innerText = `${this.naturalWidth}x${this.naturalHeight}`;
            } else dimSpan.innerText = 'ไม่ทราบ';
        };
        img.onerror = function() {
            if(!this.retried) {
                this.retried = true;
                this.src = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(s);
            } else {
                card.style.display = 'none';
            }
        };

        img.onclick = () => openLightbox(idx);
        imgContainer.appendChild(img);

        let rawName = s.split('/').pop().split('?')[0];
        try { rawName = decodeURIComponent(rawName); } catch(e) {}
        filenameSpan.innerText = rawName || `image_${idx+1}.jpg`;
        infoContainer.append(filenameSpan, dimSpan);

        let actions = document.createElement('div');
        actions.className = 'img-actions';
        
        let btnDl = document.createElement('button');
        btnDl.className = 'btn-icon btn-dl'; btnDl.title = 'ดาวน์โหลด';
        btnDl.innerHTML = SVGs.dl;
        btnDl.onclick = async () => {
            let b = await fetchImg(s);
            if(b) {
                let u2 = URL.createObjectURL(b);
                let a2 = document.createElement('a'); a2.href = u2; a2.download = 'KIRITO_' + Date.now() + '.jpg';
                a2.click(); URL.revokeObjectURL(u2);
                showTempIcon(btnDl, SVGs.check, SVGs.dl);
            } else window.open(s, '_blank');
        };

        let btnCopyLink = document.createElement('button');
        btnCopyLink.className = 'btn-icon btn-copy-link'; btnCopyLink.title = 'คัดลอกลิงก์';
        btnCopyLink.innerHTML = SVGs.link;
        btnCopyLink.onclick = () => {
            navigator.clipboard.writeText(s).then(() => showTempIcon(btnCopyLink, SVGs.check, SVGs.link))
            .catch(()=>{
                let t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
                showTempIcon(btnCopyLink, SVGs.check, SVGs.link);
            });
        };

        let btnCopyImg = document.createElement('button');
        btnCopyImg.className = 'btn-icon btn-copy-img'; btnCopyImg.title = 'คัดลอกรูปภาพ';
        btnCopyImg.innerHTML = SVGs.copy;
        btnCopyImg.onclick = async () => {
            try {
                let b = await fetchImg(s);
                if(b) {
                    await navigator.clipboard.write([new ClipboardItem({[b.type]: b})]);
                    showTempIcon(btnCopyImg, SVGs.check, SVGs.copy);
                } else alert("โดนบล็อกการดึงข้อมูลรูปภาพ");
            } catch(e) { alert("เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพโดยตรง"); }
        };

        actions.append(btnDl, btnCopyLink, btnCopyImg);
        card.append(checkbox, imgContainer, infoContainer, actions);
        gallery.append(card);
    });

    statusText.innerText = 'ระบบพร้อมใช้งาน 100%';
    updateSelectionCount();

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

    // === Lightbox ===
    shadow.getElementById('lb-close').onclick = () => lightbox.classList.remove('active');
    
    const navLb = (dir) => {
        currentLbIndex += dir;
        if(currentLbIndex < 0) currentLbIndex = imgArray.length - 1;
        if(currentLbIndex >= imgArray.length) currentLbIndex = 0;
        openLightbox(currentLbIndex);
    };
    shadow.getElementById('lb-prev').onclick = () => navLb(-1);
    shadow.getElementById('lb-next').onclick = () => navLb(1);

    // === Touch & Mouse ===
    let isDragging = false, startX, startY, initDist = 0, initScale = 1;
    let startTouchX = 0, isSwiping = false;
    const getDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    
    lbImg.addEventListener('wheel', (e) => {
        e.preventDefault();
        sc += e.deltaY * -0.002;
        updateTransform();
    }, {passive: false});
    
    lbImg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if(sc > 1) {
            isDragging = true;
            startX = e.clientX - tx;
            startY = e.clientY - ty;
            lbImg.classList.add('grabbing');
        } else {
            startTouchX = e.clientX;
            isSwiping = true;
        }
    });
    
    lightbox.addEventListener('mouseup', (e) => {
        isDragging = false;
        lbImg.classList.remove('grabbing');
        if(sc === 1 && isSwiping) {
            let endX = e.clientX - startTouchX;
            if(endX < -60) navLb(1);
            else if(endX > 60) navLb(-1);
            isSwiping = false;
        }
    });
    
    lightbox.addEventListener('mousemove', (e) => {
        if(!isDragging || sc <= 1) return;
        e.preventDefault();
        tx = e.clientX - startX;
        ty = e.clientY - startY;
        updateTransform();
    });

    lbImg.addEventListener('touchstart', (e) => {
        if(e.touches.length === 1) {
            if(sc > 1) {
                isDragging = true;
                isSwiping = false;
                startX = e.touches[0].clientX - tx;
                startY = e.touches[0].clientY - ty;
            } else {
                startTouchX = e.touches[0].clientX;
                isSwiping = true;
                isDragging = false;
            }
        } else if (e.touches.length === 2) {
            isDragging = false; isSwiping = false;
            initDist = getDist(e.touches);
            initScale = sc;
        }
    }, {passive: false});
    
    lightbox.addEventListener('touchend', (e) => {
        if(e.touches.length < 2) initDist = null;
        if(e.touches.length === 0) {
            if (sc === 1 && isSwiping) {
                let diffX = e.changedTouches[0].clientX - startTouchX;
                if(diffX < -50) navLb(1);
                else if(diffX > 50) navLb(-1);
            }
            isDragging = false;
            isSwiping = false;
        }
    });
    
    lightbox.addEventListener('touchmove', (e) => {
        if(e.touches.length === 2 && initDist) {
            e.preventDefault(); 
            let currDist = getDist(e.touches);
            sc = initScale * (currDist / initDist);
            updateTransform();
        } else if (e.touches.length === 1) {
            if (sc > 1 && isDragging) {
                e.preventDefault();
                tx = e.touches[0].clientX - startX;
                ty = e.touches[0].clientY - startY;
                updateTransform();
            } else if (sc === 1 && isSwiping) {
                e.preventDefault(); 
            }
        }
    }, {passive: false});

    // === ZIP ===
    shadow.getElementById('btn-zip').onclick = function() {
        let btn = this;
        let selectedCheckboxes = shadow.querySelectorAll('.chk-select:checked');
        if(selectedCheckboxes.length === 0) return alert('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');

        btn.disabled = true;
        let origBtnText = btn.innerHTML;
        btn.innerHTML = `${SVGs.spin} เตรียมแพ็ก ZIP...`;
        statusText.style.color = '#fff';

        const doZip = async () => {
            statusText.innerText = 'กำลังโหลดข้อมูลรูปภาพ...';
            let zip = new JSZip();
            let total = selectedCheckboxes.length;
            let successCount = 0;

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
                    successCount++;
                }
                statusText.innerText = `กำลังแพ็กไฟล์ ${successCount}/${total} ...`;
            }

            if(successCount === 0) {
                statusText.innerText = 'ล้มเหลว: โดนบล็อกการดึงรูป';
                statusText.style.color = '#ff3333';
                btn.disabled = false;
                btn.innerHTML = origBtnText;
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
                statusText.innerText = `โหลด ZIP สำเร็จ (${successCount} รูป)`;
                statusText.style.color = '#28a745';
                btn.innerHTML = `${SVGs.check} สำเร็จ!`;
            } catch(e) {
                statusText.innerText = 'เกิดข้อผิดพลาดในการสร้าง ZIP';
                statusText.style.color = '#ff3333';
                btn.disabled = false;
            }
            
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = origBtnText;
            }, 3000);
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

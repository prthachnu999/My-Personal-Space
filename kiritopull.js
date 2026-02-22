// ==========================================
// KIRITO PULL SYSTEM - ULTIMATE MEDIA EDITION v8 (Facebook Native + Social Deep Scan)
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
            let p = u.split('?')[0];
            let m1 = p.match(/[-_](\d+)x(\d+)(?=\.[a-zA-Z0-9]+$)/i);
            if(m1) return parseInt(m1[1])*parseInt(m1[2]);
            return 0;
        } catch(e) { return 0; }
    };

    const uMap = new Map();
    
    // อัปเกรดระบบเดาประเภทไฟล์ ให้รู้จัก Social Media Links
    const guessType = (u) => {
        const ext = u.split('.').pop().split('?')[0].toLowerCase();
        if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'heic', 'ico', 'bmp'].includes(ext)) return 'image';
        
        // ตรวจจับลิงก์โซเชียลมีเดีย
        if (u.match(/(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i)) return 'youtube';
        if (u.match(/(facebook\.com\/.*\/videos\/|tiktok\.com\/|instagram\.com\/reel\/|instagram\.com\/p\/)/i)) return 'social_video';
        if (u.startsWith('data:image/')) return 'image';
        return null; 
    };

    // ฟังก์ชันดึงสื่อแบบดั้งเดิม (ที่เสถียรกับ FB) + อัปเกรด
    const addMedia = function(s, forceType = null, altThumb = null, altTitle = null) {
        if(!s || typeof s !== 'string') return;
        
        const isDataUrl = s.startsWith('data:image/');
        if(s.startsWith('data:') && !isDataUrl) return; // บล็อก data ประเภทอื่นที่ไม่ใช่รูปภาพ
        
        if(!isDataUrl) {
            if(s.startsWith('//')) s = 'https:' + s;
            else if(s.startsWith('/')) s = location.origin + s;
            else if(!s.startsWith('http') && !s.startsWith('blob:')) s = new URL(s, location.href).href;
            
            try {
                s = decodeURIComponent(s);
                let d = new URL(s, 'http://d');
                let inr = d.searchParams.get('url');
                if(inr) s = inr;
            } catch(e) {}
        }
        
        let uL = s.toLowerCase().split('?')[0].split('#')[0];
        
        // ป้องกันดึงไฟล์ขยะ (เหมือนเวอร์ชันดั้งเดิม)
        if(uL.endsWith('.js') || uL.endsWith('.css') || uL.endsWith('.html') || uL.endsWith('.php') || uL.endsWith('.json') || uL.endsWith('.xml') || uL.endsWith('.txt')) return;
        
        let type = forceType || guessType(uL);
        // อนุโลมให้ดึงถ้าเป็นนามสกุลรูปปกติ หรือเป็นประเภทที่บังคับมา (เพื่อให้ FB ที่เข้ารหัสหลุดรอดมาได้บ้าง)
        if(!type && !uL.match(/\.(jpg|jpeg|png|webp|gif|svg|tiff|heic|ico)$/i)) return;
        if(!type) type = 'image'; // Default to image if still unknown but passed the regex
        
        let k = isDataUrl ? (s.substring(0, 60) + s.length) : cleanK(s);
        let ex = uMap.get(k);
        
        if(!ex) {
            uMap.set(k, { url: s, type: type, thumb: altThumb, title: altTitle });
        } else {
            if(!isDataUrl && getSc(s) > getSc(ex.url)) {
                uMap.set(k, { url: s, type: type, thumb: altThumb, title: altTitle });
            } else if(!isDataUrl && getSc(s) === getSc(ex.url) && !s.includes('?') && ex.url.includes('?')) {
                uMap.set(k, { url: s, type: type, thumb: altThumb, title: altTitle });
            }
        }
    };

    // 1. ดึงจากแท็กมาตรฐาน (แบบดั้งเดิม)
    Array.from(document.images).forEach(e => addMedia(e.src, 'image', null, e.alt));
    
    Array.from(document.querySelectorAll('video')).forEach(e => {
        addMedia(e.src, 'video'); 
        if(e.poster) addMedia(e.poster, 'image'); 
        Array.from(e.querySelectorAll('source')).forEach(src => addMedia(src.src, 'video'));
    });
    
    Array.from(document.querySelectorAll('audio')).forEach(e => {
        addMedia(e.src, 'audio');
        Array.from(e.querySelectorAll('source')).forEach(src => addMedia(src.src, 'audio'));
    });
    
    // 2. ดึงจาก Attributes ทุกรูปแบบ (แบบดั้งเดิม)
    Array.from(document.querySelectorAll('img, a, link, source, div, span, bg')).forEach(e => {
        var tag = e.tagName.toLowerCase();
        var ds = e.getAttribute('data-src') || e.getAttribute('data-original') || e.getAttribute('data-lazy-src') || e.getAttribute('data-srcset') || e.getAttribute('srcset') || e.getAttribute('content');
        
        if(ds) {
            if(ds.includes(',') && !ds.startsWith('data:')) {
                ds.split(',').forEach(p => addMedia(p.trim().split(' ')[0]));
            } else {
                addMedia(ds);
            }
        }
        
        if(tag === 'a' || tag === 'link') {
            var h = e.getAttribute('href');
            if(h) {
                let type = guessType(h.toLowerCase());
                if (type === 'youtube' || type === 'social_video') {
                    let img = e.querySelector('img');
                    let thumb = img ? img.src : null;
                    let title = e.innerText.trim().split('\n')[0] || null;
                    addMedia(h, type, thumb, title);
                } else {
                    addMedia(h); // ดึงรูปที่ซ่อนในลิงก์แบบธรรมดา
                }
            }
        }
        
        var b = window.getComputedStyle(e).backgroundImage;
        var m = b.match(/url\(['"]?(.*?)['"]?\)/);
        if(m) addMedia(m[1], 'image'); 
    });
    
    // 3. ทะลวง Source Code / JSON (สำหรับลิงก์ที่ถูกซ่อนมากๆ)
    const htmlCode = document.documentElement.innerHTML;
    const urlRegex = /(?:https?:|\\\/\\\/|\/\/)[^\s"'<>;&\\]+\.(?:jpg|jpeg|png|gif|webp|svg|ico|mp4|webm|ogg|mov|m4v|mp3|wav|m4a)(?:\?[^\s"'<>\\]*)?/gi;
    let match;
    while ((match = urlRegex.exec(htmlCode)) !== null) { addMedia(match[0]); }
    
    const b64Regex = /data:image\/(jpeg|png|gif|webp);base64,[a-zA-Z0-9+/=]+/gi;
    let b64Match;
    while ((b64Match = b64Regex.exec(htmlCode)) !== null) { addMedia(b64Match[0], 'image'); }

    if(uMap.size === 0) {
        alert('ไม่พบไฟล์มีเดียใดๆ (KIRITO SYSTEM)');
        return;
    }

    const mediaArray = Array.from(uMap.values()); 
    let currentLbIndex = 0;

    const wrapper = document.createElement('div');
    wrapper.id = 'krt-sys-wrapper';
    wrapper.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
    document.body.appendChild(wrapper);

    const shadow = wrapper.attachShadow({mode: 'open'});
    
    const SVGs = {
        dl: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
        link: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
        copy: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
        checkSq: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>',
        box: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
        times: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        check: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        spin: '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" class="icon-spin"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>',
        rocket: '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2l.5-.5a10.4 10.4 0 0 0 7.7-7.7A10.4 10.4 0 0 0 16.5 4.5l-.5.5A10.4 10.4 0 0 0 4.5 16.5z"></path></svg>'
    };

    shadow.innerHTML += `
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            @keyframes krtFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
            @keyframes krtSpin { 100% { transform: rotate(360deg); } }
            @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            
            svg { display: block; }
            .icon-spin { animation: krtSpin 1s linear infinite; }
            
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.85); overflow-y: auto; padding: 25px; color: #fff; pointer-events: auto; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: krtFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            .container::-webkit-scrollbar { width: 8px; }
            .container::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.1); }
            .container::-webkit-scrollbar-thumb { background: rgba(255, 0, 51, 0.6); border-radius: 10px; }
            .container::-webkit-scrollbar-thumb:hover { background: rgba(255, 0, 51, 0.9); }

            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.15); padding-bottom: 15px; margin-bottom: 25px; flex-wrap: wrap; gap: 15px; }
            h1 { color: #ff3333; margin: 0; text-shadow: 0 2px 15px rgba(255, 51, 51, 0.4); font-size: 28px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
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
            
            /* --- Filters UI --- */
            .filter-section { margin-bottom: 25px; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
            .filter-label { font-size: 0.85rem; color: #ddd; margin-bottom: 10px; font-weight: bold; }
            .filter-group { display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
            .filter-btn { padding: 6px 14px; font-size: 0.85rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; color: #ccc; cursor: pointer; transition: 0.2s; }
            .filter-btn:hover { background: rgba(255, 255, 255, 0.2); color: white; }
            .filter-btn.active { background: #ff3333; color: white; border-color: #ff3333; box-shadow: 0 0 12px rgba(255, 51, 51, 0.4); }

            .sub-filter-container { display: none; padding: 10px 15px; background: rgba(255,255,255,0.05); border-left: 3px solid #ff3333; border-radius: 0 8px 8px 0; margin-bottom: 15px; animation: fadeInDown 0.2s ease-out; }
            .sub-group { display: none; gap: 8px; flex-wrap: wrap; margin: 0; }

            .info-text { color: #eee; font-size: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .status-badge { background: rgba(255, 51, 51, 0.2); color: #ffbbbb; padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid rgba(255, 51, 51, 0.3); }
            
            /* --- Grid & Cards --- */
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; padding-bottom: 60px; }
            .media-card { position: relative; background: rgba(30, 30, 30, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 8px 25px rgba(0,0,0,0.25); transition: all 0.3s ease; overflow: hidden; }
            .media-card.hidden-by-filter { display: none !important; }
            .media-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.4); border-color: rgba(255, 51, 51, 0.4); background: rgba(40,40,40,0.8); }
            
            .card-checkbox { position: absolute; top: 12px; left: 12px; z-index: 5; width: 22px; height: 22px; cursor: pointer; accent-color: #ff3333; filter: drop-shadow(0 0 5px rgba(0,0,0,0.5)); }
            .type-badge { position: absolute; top: 12px; right: 12px; z-index: 5; background: rgba(0,0,0,0.7); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; border: 1px solid rgba(255,255,255,0.2); pointer-events: none; font-weight: bold; }

            .media-container { width: 100%; height: 160px; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; position: relative; }
            .media-card img, .media-card video { max-width: 100%; max-height: 100%; object-fit: contain; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
            .media-card:hover .media-container img, .media-card:hover .media-container video { transform: scale(1.08); }
            
            .play-overlay { position: absolute; font-size: 2.5rem; color: rgba(255,255,255,0.7); pointer-events: none; text-shadow: 0 0 10px rgba(0,0,0,0.8); transition: 0.3s; opacity: 1; }
            .media-card:hover .play-overlay { color: #ff3333; transform: scale(1.1); }
            
            .media-info { width: 100%; padding: 12px 10px; background: rgba(0,0,0,0.5); color: #ccc; font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
            .filename { color: #fff; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; flex: 1; margin-right: 5px;}
            .dimensions { color: #ffbbbb; font-size: 10px; font-weight: bold; background: rgba(255,51,51,0.1); padding: 3px 6px; border-radius: 4px; white-space: nowrap; }
            
            .media-actions { padding: 10px; background: rgba(10,10,10,0.8); display: flex; justify-content: center; gap: 8px; border-top: 1px solid rgba(255,51,51,0.2); }
            .btn-icon { flex: 1; height: 36px; border-radius: 6px; border: none; cursor: pointer; color: white; font-size: 0.95rem; transition: 0.2s; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); }
            .btn-icon:hover { transform: translateY(-3px); }
            .btn-dl { background: rgba(255,51,51,0.7); } .btn-dl:hover { background: #ff3333; box-shadow: 0 0 10px rgba(255,51,51,0.5); }
            .btn-copy-link { background: rgba(0,123,255,0.7); } .btn-copy-link:hover { background: #007bff; box-shadow: 0 0 10px rgba(0,123,255,0.5); }
            .btn-copy-img { background: rgba(40,167,69,0.7); } .btn-copy-img:hover { background: #28a745; box-shadow: 0 0 10px rgba(40,167,69,0.5); }
            
            /* --- Lightbox --- */
            .lightbox { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.92); z-index: 2000; flex-direction: column; justify-content: center; align-items: center; overflow: hidden; touch-action: none; pointer-events: auto; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); opacity: 0; transition: opacity 0.3s; }
            .lightbox.active { opacity: 1; display: flex; }
            .lb-content-wrapper { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
            
            .lb-media { max-width: 90%; max-height: 85%; transition: transform 0.15s ease-out; filter: drop-shadow(0 10px 30px rgba(0,0,0,0.8)); outline: none; }
            .lb-media.grabbing { cursor: grabbing; transition: none; }
            img.lb-media { cursor: grab; user-select: none; -webkit-user-drag: none; }
            
            .lb-close { position: absolute; top: 20px; right: 20px; color: #fff; font-size: 32px; cursor: pointer; z-index: 2005; width: 48px; height: 48px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.1); border-radius: 50%; transition: all 0.2s; }
            .lb-close:hover { background: #ff3333; transform: rotate(90deg); }
            .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.5); font-size: 40px; cursor: pointer; z-index: 2002; width: 50px; height: 80px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.3); transition: 0.2s; }
            .lb-nav:hover { background: rgba(255,51,51,0.6); color: white; }
            .lb-prev { left: 0; border-radius: 0 10px 10px 0; }
            .lb-next { right: 0; border-radius: 10px 0 0 10px; }
            .lb-hint { position: absolute; bottom: 25px; background: rgba(0,0,0,0.7); padding: 10px 25px; border-radius: 30px; display: flex; gap: 20px; color: #eee; font-size: 13px; z-index: 2003; pointer-events: none; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(5px); }

            /* --- Scroll To Top --- */
            #scrollTopBtn { display: none; position: fixed; bottom: 30px; right: 30px; z-index: 99; border: none; background-color: #ff3333; color: white; cursor: pointer; padding: 15px; border-radius: 50%; box-shadow: 0 4px 15px rgba(255,51,51,0.5); transition: 0.3s; width: 50px; height: 50px; align-items: center; justify-content: center; }
            #scrollTopBtn:hover { background-color: #ff4d4d; transform: translateY(-5px); box-shadow: 0 6px 20px rgba(255,51,51,0.7); }
        </style>
        
        <div class="container" id="scroll-container">
            <div class="header">
                <h1>KIRITO SYSTEM</h1>
                <div class="btn-group">
                    <button id="btn-select-all" class="btn-select">${SVGs.checkSq} เลือกทั้งหมดบนจอ</button>
                    <button id="btn-zip" class="btn-zip">${SVGs.box} โหลด ZIP ที่เลือก</button>
                    <button id="btn-close" class="btn-close">${SVGs.times} ปิดระบบ</button>
                </div>
            </div>

            <!-- Filters Section -->
            <div class="filter-section">
                <div class="filter-label">🗂 หมวดหมู่หลัก (Category):</div>
                <div class="filter-group" id="mainTypeFilters">
                    <button class="filter-btn active" data-type="all">📦 ทั้งหมด (All)</button>
                    <button class="filter-btn" data-type="image">🖼️ รูปภาพ (Image)</button>
                    <button class="filter-btn" data-type="video">🎥 วิดีโอ/โซเชียล (Video)</button>
                    <button class="filter-btn" data-type="audio">🎵 เสียง (Audio)</button>
                </div>

                <div id="subFiltersContainer" class="sub-filter-container">
                    <div class="sub-group" id="subType_image">
                        <button class="filter-btn active" data-subtype="all">รูปทั้งหมด</button>
                        <button class="filter-btn" data-subtype="jpg">JPG</button>
                        <button class="filter-btn" data-subtype="png">PNG</button>
                        <button class="filter-btn" data-subtype="gif">GIF</button>
                        <button class="filter-btn" data-subtype="webp">WebP</button>
                        <button class="filter-btn" data-subtype="svg">SVG</button>
                        <button class="filter-btn" data-subtype="other_img">อื่นๆ</button>
                    </div>
                    <div class="sub-group" id="subType_video">
                        <button class="filter-btn active" data-subtype="all">วิดีโอทั้งหมด</button>
                        <button class="filter-btn" data-subtype="youtube">YouTube</button>
                        <button class="filter-btn" data-subtype="social_video">Social อื่นๆ</button>
                        <button class="filter-btn" data-subtype="mp4">MP4</button>
                        <button class="filter-btn" data-subtype="webm">WebM</button>
                        <button class="filter-btn" data-subtype="other_vid">อื่นๆ (MOV, OGG...)</button>
                    </div>
                    <div class="sub-group" id="subType_audio">
                        <button class="filter-btn active" data-subtype="all">เสียงทั้งหมด</button>
                        <button class="filter-btn" data-subtype="mp3">MP3</button>
                        <button class="filter-btn" data-subtype="wav">WAV</button>
                        <button class="filter-btn" data-subtype="other_aud">อื่นๆ (M4A, AAC...)</button>
                    </div>
                </div>

                <div class="filter-label">📏 ขนาดไฟล์ (Size) *เฉพาะรูป/คลิปปกติ:</div>
                <div class="filter-group" id="sizeFilters">
                    <button class="filter-btn active" data-size="all">ทั้งหมด</button>
                    <button class="filter-btn" data-size="small">เล็ก (&lt;500px)</button>
                    <button class="filter-btn" data-size="medium">กลาง (500-1200px)</button>
                    <button class="filter-btn" data-size="large">ใหญ่ (&gt;1200px)</button>
                </div>

                <div class="filter-label">⏱ ระยะเวลา (Duration) *เฉพาะคลิป/เสียง:</div>
                <div class="filter-group" id="durationFilters">
                    <button class="filter-btn active" data-duration="all">ทั้งหมด</button>
                    <button class="filter-btn" data-duration="short">สั้น (&lt; 30 วิ)</button>
                    <button class="filter-btn" data-duration="medium">กลาง (30 วิ - 3 นาที)</button>
                    <button class="filter-btn" data-duration="long">ยาว (&gt; 3 นาที)</button>
                </div>
            </div>

            <div class="info-text">
                <span id="status-text">กำลังรวบรวมข้อมูล...</span>
                <span class="status-badge" id="count-badge">ดึงมาได้ ${mediaArray.length} ไฟล์</span>
            </div>
            <div id="gallery" class="grid"></div>
        </div>
        
        <!-- Scroll to Top Button -->
        <button id="scrollTopBtn" title="ขึ้นบนสุด">${SVGs.rocket}</button>

        <div id="lightbox" class="lightbox">
            <div id="lb-close" class="lb-close">${SVGs.times}</div>
            <div id="lb-prev" class="lb-nav lb-prev">&#10094;</div>
            <div id="lb-content-wrapper" class="lb-content-wrapper">
                <img id="lb-img" class="lb-media" style="display:none;" src="">
                <video id="lb-vid" class="lb-media" style="display:none; max-width:90%; max-height:85%;" controls></video>
                <audio id="lb-aud" class="lb-media" style="display:none; width:80%;" controls></audio>
                <iframe id="lb-iframe" class="lb-media" style="display:none; width:90%; height:85%; border:none; border-radius:12px; background:#000;" allowfullscreen allow="autoplay"></iframe>
            </div>
            <div id="lb-next" class="lb-nav lb-next">&#10095;</div>
            <div class="lb-hint">
                <span>🖱️ ซูม/ลากรูป</span>
                <span>↔️ ปัดเพื่อเปลี่ยน</span>
            </div>
        </div>
    `;

    const gallery = shadow.getElementById('gallery');
    const lightbox = shadow.getElementById('lightbox');
    const statusText = shadow.getElementById('status-text');
    const countBadge = shadow.getElementById('count-badge');
    const scrollContainer = shadow.getElementById('scroll-container');
    const topBtn = shadow.getElementById('scrollTopBtn');

    const showTempIcon = (btn, tempSvg, origSvg) => {
        btn.innerHTML = tempSvg; btn.style.background = '#28a745';
        setTimeout(() => { btn.innerHTML = origSvg; btn.style.background = ''; }, 2000);
    };

    const fetchMedia = async (url) => {
        const proxies = ['', 'https://api.codetabs.com/v1/proxy?quest=', 'https://corsproxy.io/?', 'https://api.allorigins.win/raw?url='];
        for(let p of proxies) {
            try {
                let target = p ? p + encodeURIComponent(url) : url;
                let ctrl = new AbortController();
                let tid = setTimeout(() => ctrl.abort(), 10000);
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

    const b64toBlob = (b64Data) => {
        try {
            let parts = b64Data.split(',');
            let contentType = parts[0].match(/:(.*?);/)[1];
            let raw = atob(parts[1]);
            let rawL = raw.length;
            let uInt8Array = new Uint8Array(rawL);
            for (let i = 0; i < rawL; ++i) uInt8Array[i] = raw.charCodeAt(i);
            return new Blob([uInt8Array], { type: contentType });
        } catch(e) { return null; }
    };

    const formatTime = (seconds) => {
        if(!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const cleanFilename = (url, title = null) => {
        if (title) {
            if (title.length > 25) return title.substring(0, 25) + '...';
            return title;
        }
        let raw = url.split('/').pop().split(/[#?]/)[0];
        try{ raw = decodeURIComponent(raw); }catch(e){}
        if(raw.length > 20) raw = raw.substring(0, 10) + '...' + raw.substring(raw.length - 7);
        if(raw.startsWith('data:')) return 'Base64 Image';
        return raw || 'media_file';
    };

    let currentMainType = 'all';
    let currentSubType = 'all';
    let currentSizeFilter = 'all';
    let currentDurationFilter = 'all';

    const applyVisualFilters = () => {
        const cards = shadow.querySelectorAll('.media-card');
        cards.forEach(card => {
            const width = parseInt(card.getAttribute('data-width') || 0);
            const duration = parseFloat(card.getAttribute('data-duration') || 0);
            const mediaType = card.getAttribute('data-type'); 
            const url = card.querySelector('.chk-select').getAttribute('data-url').toLowerCase();
            const ext = url.split('.').pop().split('?')[0];
            
            let show = true;
            let isVidCategory = ['video', 'youtube', 'social_video'].includes(mediaType);

            if (currentMainType !== 'all') {
                if (currentMainType === 'video' && !isVidCategory) show = false;
                else if (currentMainType === 'image' && mediaType !== 'image') show = false;
                else if (currentMainType === 'audio' && mediaType !== 'audio') show = false;
            }

            if (show && currentSubType !== 'all') {
                if (currentSubType === 'youtube' && mediaType !== 'youtube') show = false;
                else if (currentSubType === 'social_video' && mediaType !== 'social_video') show = false;
                else if (currentSubType === 'jpg' && !['jpg', 'jpeg'].includes(ext)) show = false;
                else if (['png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(currentSubType) && ext !== currentSubType) show = false;
                else if (currentSubType === 'other_img' && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) show = false;
                else if (currentSubType === 'other_vid' && ['mp4', 'webm', 'youtube', 'social_video'].includes(mediaType)) show = false;
                else if (currentSubType === 'other_aud' && ['mp3', 'wav'].includes(ext)) show = false;
            }

            if (show && currentSizeFilter !== 'all') {
                if (mediaType === 'audio' || mediaType === 'youtube' || mediaType === 'social_video') show = false; 
                else {
                    if (currentSizeFilter === 'small' && width >= 500) show = false;
                    if (currentSizeFilter === 'medium' && (width < 500 || width > 1200)) show = false;
                    if (currentSizeFilter === 'large' && width <= 1200) show = false;
                }
            }

            if (show && currentDurationFilter !== 'all') {
                if (mediaType === 'image') show = false;
                else {
                    if (currentDurationFilter === 'short' && duration >= 30) show = false;
                    if (currentDurationFilter === 'medium' && (duration < 30 || duration > 180)) show = false;
                    if (currentDurationFilter === 'long' && duration <= 180) show = false;
                }
            }
            
            if (show) card.classList.remove('hidden-by-filter');
            else card.classList.add('hidden-by-filter');
        });
        
        const visibleCount = shadow.querySelectorAll('.media-card:not(.hidden-by-filter)').length;
        statusText.innerText = `พร้อมแสดงผล ${visibleCount} ไฟล์บนหน้าจอ`;
        updateSelectionCount();
    };

    const updateSelectionCount = () => {
        const checked = shadow.querySelectorAll('.media-card:not(.hidden-by-filter) .chk-select:checked').length;
        const visible = shadow.querySelectorAll('.media-card:not(.hidden-by-filter)').length;
        countBadge.innerText = `เลือกไว้ ${checked}/${visible} ไฟล์`;
    };

    shadow.querySelectorAll('#mainTypeFilters .filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentMainType = btn.getAttribute('data-type'); currentSubType = 'all';
            shadow.querySelectorAll('#mainTypeFilters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const subContainer = shadow.getElementById('subFiltersContainer');
            shadow.querySelectorAll('.sub-group').forEach(el => el.style.display = 'none');

            if(currentMainType === 'all') {
                subContainer.style.display = 'none';
            } else {
                subContainer.style.display = 'block';
                const subGrp = shadow.getElementById('subType_' + currentMainType);
                if(subGrp) {
                    subGrp.style.display = 'flex';
                    subGrp.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    subGrp.querySelector('.filter-btn').classList.add('active');
                }
            }
            applyVisualFilters();
        };
    });

    shadow.querySelectorAll('.sub-group .filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentSubType = btn.getAttribute('data-subtype');
            btn.parentElement.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyVisualFilters();
        };
    });

    shadow.querySelectorAll('#sizeFilters .filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentSizeFilter = btn.getAttribute('data-size');
            shadow.querySelectorAll('#sizeFilters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyVisualFilters();
        };
    });

    shadow.querySelectorAll('#durationFilters .filter-btn').forEach(btn => {
        btn.onclick = () => {
            currentDurationFilter = btn.getAttribute('data-duration');
            shadow.querySelectorAll('#durationFilters .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyVisualFilters();
        };
    });

    // --- Render Gallery ---
    // Chunk Rendering เพื่อป้องกันจอค้างเวลาดึงจาก FB (ไฟล์เยอะมาก)
    let cIdx = 0;
    const chnk = 30;

    function renderLoop() {
        var end = Math.min(cIdx + chnk, mediaArray.length);
        var frag = document.createDocumentFragment();

        for (; cIdx < end; cIdx++) {
            const item = mediaArray[cIdx];
            const s = item.url;
            const mediaType = item.type;
            const isDataUrl = s.startsWith('data:image/');
            
            let card = document.createElement('div');
            card.className = 'media-card';
            card.setAttribute('data-type', mediaType);
            
            let checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'card-checkbox chk-select';
            checkbox.checked = true;
            checkbox.onchange = updateSelectionCount;
            checkbox.setAttribute('data-url', s);
            checkbox.setAttribute('data-type', mediaType);

            let typeBadge = document.createElement('div');
            typeBadge.className = 'type-badge';

            let imgContainer = document.createElement('div');
            imgContainer.className = 'media-container';
            // ป้องกันการเกิด Closure Loop ใน Event
            let currentIdx = cIdx; 
            imgContainer.onclick = () => openLightbox(currentIdx);
            
            let infoContainer = document.createElement('div');
            infoContainer.className = 'media-info';
            let fname = cleanFilename(s, item.title);

            if (mediaType === 'youtube' || mediaType === 'social_video') {
                typeBadge.innerText = mediaType === 'youtube' ? 'YOUTUBE' : 'SOCIAL';
                typeBadge.style.background = '#ff0000';
                
                let thumbUrl = item.thumb;
                if(mediaType === 'youtube') {
                    let vidId = s.match(/[?&]v=([^&]+)/) || s.match(/youtu\.be\/([^?]+)/) || s.match(/shorts\/([^?]+)/);
                    if(vidId && vidId[1]) thumbUrl = `https://img.youtube.com/vi/${vidId[1]}/hqdefault.jpg`;
                }
                
                let img = document.createElement('img');
                img.src = thumbUrl || 'https://via.placeholder.com/300x160/1a1a1a/ff3333?text=Video+Link';
                img.style.opacity = '0.8';
                
                let playIcon = document.createElement('div');
                playIcon.className = "play-overlay";
                playIcon.innerHTML = "▶️";

                infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">Link</span>`;
                imgContainer.append(img, playIcon);

            } else if (mediaType === 'video') {
                typeBadge.innerText = 'VIDEO';
                let vid = document.createElement('video');
                vid.src = s; vid.preload = 'metadata'; vid.muted = true;
                
                let playIcon = document.createElement('div');
                playIcon.className = "play-overlay";
                playIcon.innerHTML = "▶️";

                vid.onloadedmetadata = function() {
                    card.setAttribute('data-width', this.videoWidth);
                    card.setAttribute('data-duration', this.duration);
                    infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">${this.videoWidth}x${this.videoHeight} | ${formatTime(this.duration)}</span>`;
                    applyVisualFilters();
                };
                vid.onerror = function() { infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions" style="color:#ff3333">Stream Protected</span>`; };
                
                card.onmouseenter = () => { let p = vid.play(); if(p!==undefined) p.then(()=>playIcon.style.opacity='0').catch(e=>{}); };
                card.onmouseleave = () => { vid.pause(); playIcon.style.opacity='1'; };

                infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">Video...</span>`;
                imgContainer.append(vid, playIcon);

            } else if (mediaType === 'audio') {
                typeBadge.innerText = 'AUDIO'; typeBadge.style.background = 'rgba(0, 123, 255, 0.7)';
                let aud = document.createElement('audio');
                aud.src = s; aud.preload = 'metadata';
                
                let musicIcon = document.createElement('div');
                musicIcon.innerHTML = "🎵"; musicIcon.style.fontSize = "4rem"; musicIcon.style.transition = "0.3s";
                
                aud.onloadedmetadata = function() {
                    card.setAttribute('data-width', 0);
                    card.setAttribute('data-duration', this.duration);
                    infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">${formatTime(this.duration)}</span>`;
                    applyVisualFilters();
                };
                aud.onerror = function() { card.style.display = 'none'; };

                infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">Audio...</span>`;
                card.appendChild(aud);
                imgContainer.appendChild(musicIcon);
                card.onmouseenter = () => musicIcon.style.transform = 'scale(1.2)';
                card.onmouseleave = () => musicIcon.style.transform = 'scale(1)';

            } else {
                typeBadge.innerText = isDataUrl ? 'B64 IMG' : 'IMG'; 
                typeBadge.style.background = 'rgba(40, 167, 69, 0.7)';
                let img = document.createElement('img');
                img.src = s; img.loading = "lazy";
                
                img.setAttribute('data-rts', '0');
                img.onerror = function() {
                    if(isDataUrl) return;
                    let rts = parseInt(this.getAttribute('data-rts'));
                    let pxs = ['https://api.codetabs.com/v1/proxy?quest=', 'https://corsproxy.io/?'];
                    if (rts < pxs.length) {
                        this.setAttribute('data-rts', rts + 1);
                        this.src = pxs[rts] + encodeURIComponent(s);
                    } else {
                        card.style.display = 'none'; // ซ่อนถ้าดึงไม่ได้จริงๆ
                    }
                };
                
                img.onload = function() {
                    if(this.naturalWidth < 30 && !isDataUrl) { this.onerror(); return; }
                    card.setAttribute('data-width', this.naturalWidth);
                    infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">${this.naturalWidth}x${this.naturalHeight}</span>`;
                    applyVisualFilters();
                };
                
                infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions">Image...</span>`;
                imgContainer.appendChild(img);
            }

            let actions = document.createElement('div');
            actions.className = 'media-actions';
            
            let btnDl = document.createElement('button');
            btnDl.className = 'btn-icon btn-dl'; btnDl.title = 'ดาวน์โหลด'; btnDl.innerHTML = SVGs.dl;
            btnDl.onclick = async () => {
                if (s.startsWith('blob:') || mediaType === 'youtube' || mediaType === 'social_video') return window.open(s, '_blank'); 
                
                let b = null;
                if (isDataUrl) b = b64toBlob(s);
                else b = await fetchMedia(s);

                if(b) {
                    let u2 = URL.createObjectURL(b);
                    let a2 = document.createElement('a'); a2.href = u2; 
                    let e = 'jpg';
                    if (!isDataUrl) {
                        e = s.split('.').pop().split('?')[0].toLowerCase();
                        if(e.length > 4) e = mediaType === 'video' ? 'mp4' : (mediaType === 'audio' ? 'mp3' : 'jpg');
                    } else {
                        e = s.substring(11, s.indexOf(';')).replace('jpeg', 'jpg');
                    }
                    a2.download = `KIRITO_MEDIA_${Date.now()}.${e}`;
                    a2.click(); 
                    setTimeout(()=>URL.revokeObjectURL(u2), 1000);
                    showTempIcon(btnDl, SVGs.check, SVGs.dl);
                } else window.open(s, '_blank');
            };

            let btnCopyLink = document.createElement('button');
            btnCopyLink.className = 'btn-icon btn-copy-link'; btnCopyLink.title = 'คัดลอกลิงก์'; btnCopyLink.innerHTML = SVGs.link;
            btnCopyLink.onclick = () => {
                let copyTextData = isDataUrl ? "ภาพแบบ Base64 (ไม่สามารถก๊อปเป็นลิงก์ได้)" : s;
                navigator.clipboard.writeText(copyTextData).then(() => showTempIcon(btnCopyLink, SVGs.check, SVGs.link))
                .catch(()=>{
                    let t = document.createElement('textarea'); t.value = copyTextData; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
                    showTempIcon(btnCopyLink, SVGs.check, SVGs.link);
                });
            };

            let btnCopyImg = document.createElement('button');
            btnCopyImg.className = 'btn-icon btn-copy-img'; btnCopyImg.title = 'คัดลอกรูปลงคลิปบอร์ด'; btnCopyImg.innerHTML = SVGs.copy;
            btnCopyImg.onclick = async () => {
                if(mediaType !== 'image') return alert("คลิปวิดีโอและเสียงไม่สามารถก๊อปปี้ลงคลิปบอร์ดได้ กรุณากดโหลดแทนครับ");
                try {
                    if (!navigator.clipboard || !navigator.clipboard.write) throw new Error("Blocked");
                    let b = isDataUrl ? b64toBlob(s) : await fetchMedia(s);
                    if(b) {
                        await navigator.clipboard.write([new ClipboardItem({[b.type]: b})]);
                        showTempIcon(btnCopyImg, SVGs.check, SVGs.copy);
                    } else alert("โดนบล็อกการดึงข้อมูลรูปภาพ");
                } catch(e) { alert("เบราว์เซอร์ไม่รองรับการคัดลอกรูปนี้"); }
            };

            actions.append(btnDl, btnCopyLink, btnCopyImg);
            card.append(checkbox, typeBadge, imgContainer, infoContainer, actions);
            frag.appendChild(card);
        }

        gallery.appendChild(frag);

        if (cIdx < mediaArray.length) {
            statusText.innerText = `กำลังสร้างการ์ดแสดงผล... ${Math.round((cIdx/mediaArray.length)*100)}%`;
            requestAnimationFrame(renderLoop);
        } else {
            setTimeout(applyVisualFilters, 300);
        }
    }
    
    // เริ่มการวาด
    requestAnimationFrame(renderLoop);

    shadow.getElementById('btn-close').onclick = () => {
        wrapper.style.opacity = '0';
        wrapper.style.transition = 'opacity 0.3s';
        setTimeout(() => wrapper.remove(), 300);
    };

    let allSelected = true;
    shadow.getElementById('btn-select-all').onclick = () => {
        allSelected = !allSelected;
        shadow.querySelectorAll('.media-card:not(.hidden-by-filter) .chk-select').forEach(chk => chk.checked = allSelected);
        updateSelectionCount();
    };

    scrollContainer.onscroll = () => {
        if(scrollContainer.scrollTop > 300) topBtn.style.display = 'flex';
        else topBtn.style.display = 'none';
    };
    topBtn.onclick = () => scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });

    // === Lightbox ===
    let sc = 1, tx = 0, ty = 0, isDragging = false, startX, startY, initDist = 0, initScale = 1, startTouchX = 0, isSwiping = false;
    const lbContentWrapper = shadow.getElementById('lb-content-wrapper');
    const lbImg = shadow.getElementById('lb-img');
    const lbVid = shadow.getElementById('lb-vid');
    const lbAud = shadow.getElementById('lb-aud');
    const lbIframe = shadow.getElementById('lb-iframe');
    let activeLbElement = null;

    shadow.getElementById('lb-close').onclick = () => {
        lightbox.classList.remove('active');
        lbVid.pause(); lbAud.pause();
        lbIframe.src = ''; 
    };
    
    const updateTransform = () => {
        if(sc <= 1) { sc = 1; tx = 0; ty = 0; }
        if(activeLbElement) {
            if(activeLbElement === lbAud || activeLbElement === lbIframe) activeLbElement.style.transform = `translate(0px, 0px) scale(1)`;
            else activeLbElement.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
        }
    }

    const openLightbox = (index) => {
        let visibleCards = shadow.querySelectorAll('.media-card:not(.hidden-by-filter)');
        if(visibleCards.length === 0) return;
        
        let targetCard = null;
        if(index < visibleCards.length && index >= 0) {
           // ถ้าเรียกจากปุ่มลูกศร index จะเป็นตำแหน่งของ visibleCards
           targetCard = visibleCards[index];
           currentLbIndex = index; // อัปเดตให้จำว่าอยู่การ์ดที่เท่าไหร่ของหน้าจอ
        } else {
           // ถ้าเรียกจากคลิกที่รูปตรงๆ index คือตำแหน่งจริงจาก mediaArray
           let targetUrl = mediaArray[index].url;
           targetCard = Array.from(visibleCards).find(c => c.querySelector('.chk-select').getAttribute('data-url') === targetUrl);
           if(!targetCard) return; 
           currentLbIndex = Array.from(visibleCards).indexOf(targetCard);
        }

        const src = targetCard.querySelector('.chk-select').getAttribute('data-url');
        const type = targetCard.getAttribute('data-type');
        
        // หา Item จริงเพื่อเอา Thumb (กรณี Social)
        let item = mediaArray.find(m => m.url === src) || {url: src, type: type, thumb: null};

        lbImg.style.display = 'none'; lbVid.style.display = 'none'; lbAud.style.display = 'none'; lbIframe.style.display = 'none';
        lbVid.pause(); lbVid.src = ''; lbAud.pause(); lbAud.src = ''; lbIframe.src = '';
        sc = 1; tx = 0; ty = 0; 

        if (type === 'youtube') {
            let vidId = src.match(/[?&]v=([^&]+)/) || src.match(/youtu\.be\/([^?]+)/) || src.match(/shorts\/([^?]+)/);
            if(vidId && vidId[1]) {
                lbIframe.src = `https://www.youtube.com/embed/${vidId[1]}?autoplay=1`;
                lbIframe.style.display = 'block'; 
                activeLbElement = lbIframe;
            } else {
                window.open(src, '_blank'); return; 
            }
        } else if (type === 'social_video') {
            lbImg.src = item.thumb || 'https://via.placeholder.com/600x400/1a1a1a/ff3333?text=Click+to+Open+Social+Video'; 
            lbImg.style.display = 'block'; 
            activeLbElement = lbImg;
            lbImg.onclick = () => window.open(src, '_blank');
        } else if (type === 'video') {
            lbVid.src = src; lbVid.style.display = 'block'; lbVid.play().catch(e=>{}); activeLbElement = lbVid;
        } else if (type === 'audio') {
            lbAud.src = src; lbAud.style.display = 'block'; lbAud.play().catch(e=>{}); activeLbElement = lbAud;
        } else {
            lbImg.src = src; lbImg.style.display = 'block'; activeLbElement = lbImg;
            lbImg.onclick = null; 
        }

        updateTransform();
        lightbox.classList.add('active');
    };

    const navLb = (dir) => {
        let visibleCards = Array.from(shadow.querySelectorAll('.media-card:not(.hidden-by-filter)'));
        if(visibleCards.length === 0) return;
        
        let newIndex = currentLbIndex + dir;
        if(newIndex < 0) newIndex = visibleCards.length - 1;
        if(newIndex >= visibleCards.length) newIndex = 0;
        
        openLightbox(newIndex);
    };
    
    shadow.getElementById('lb-prev').onclick = () => navLb(-1);
    shadow.getElementById('lb-next').onclick = () => navLb(1);

    const getDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    
    lbContentWrapper.addEventListener('wheel', (e) => {
        if(activeLbElement === lbAud || activeLbElement === lbIframe) return;
        e.preventDefault(); sc += e.deltaY * -0.002; updateTransform();
    }, {passive: false});
    
    lbContentWrapper.addEventListener('mousedown', (e) => {
        if(e.target === lbVid || e.target === lbAud || e.target === lbIframe) return;
        e.preventDefault();
        if(sc > 1) {
            isDragging = true; startX = e.clientX - tx; startY = e.clientY - ty;
            if(activeLbElement) activeLbElement.classList.add('grabbing');
        } else {
            startTouchX = e.clientX; isSwiping = true;
        }
    });
    
    lightbox.addEventListener('mouseup', (e) => {
        isDragging = false;
        if(activeLbElement) activeLbElement.classList.remove('grabbing');
        if(sc === 1 && isSwiping) {
            let endX = e.clientX - startTouchX;
            if(endX < -60) navLb(1); else if(endX > 60) navLb(-1);
            isSwiping = false;
        }
    });
    
    lightbox.addEventListener('mousemove', (e) => {
        if(!isDragging || sc <= 1) return;
        e.preventDefault(); tx = e.clientX - startX; ty = e.clientY - startY; updateTransform();
    });

    lbContentWrapper.addEventListener('touchstart', (e) => {
        if(e.target === lbVid || e.target === lbAud || e.target === lbIframe) return;
        if(e.touches.length === 1) {
            if(sc > 1) {
                isDragging = true; isSwiping = false;
                startX = e.touches[0].clientX - tx; startY = e.touches[0].clientY - ty;
            } else {
                startTouchX = e.touches[0].clientX; isSwiping = true; isDragging = false;
            }
        } else if (e.touches.length === 2 && activeLbElement !== lbAud && activeLbElement !== lbIframe) {
            isDragging = false; isSwiping = false;
            initDist = getDist(e.touches); initScale = sc;
        }
    }, {passive: false});
    
    lightbox.addEventListener('touchend', (e) => {
        if(e.touches.length < 2) initDist = null;
        if(e.touches.length === 0) {
            if (sc === 1 && isSwiping) {
                let diffX = e.changedTouches[0].clientX - startTouchX;
                if(diffX < -50) navLb(1); else if(diffX > 50) navLb(-1);
            }
            isDragging = false; isSwiping = false;
        }
    });
    
    lightbox.addEventListener('touchmove', (e) => {
        if(e.touches.length === 2 && initDist) {
            e.preventDefault(); 
            sc = initScale * (getDist(e.touches) / initDist); updateTransform();
        } else if (e.touches.length === 1) {
            if (sc > 1 && isDragging) {
                e.preventDefault(); tx = e.touches[0].clientX - startX; ty = e.touches[0].clientY - startY; updateTransform();
            }
        }
    }, {passive: false});

    // === ZIP (ดึงภาพปกสำหรับวิดีโอโซเชียลแทน) ===
    shadow.getElementById('btn-zip').onclick = function() {
        let btn = this;
        let selectedCheckboxes = shadow.querySelectorAll('.media-card:not(.hidden-by-filter) .chk-select:checked');
        if(selectedCheckboxes.length === 0) return alert('กรุณาเลือกไฟล์บนหน้าจออย่างน้อย 1 ไฟล์');

        btn.disabled = true;
        let origBtnText = btn.innerHTML;
        btn.innerHTML = `${SVGs.spin} เตรียมแพ็ก ZIP...`;
        statusText.style.color = '#fff';

        const doZip = async () => {
            let zip = new JSZip();
            let total = selectedCheckboxes.length;
            let successCount = 0;

            for(let i=0; i<total; i++) {
                let s = selectedCheckboxes[i].getAttribute('data-url');
                let type = selectedCheckboxes[i].getAttribute('data-type');
                let isDataUrl = s.startsWith('data:image/');
                let isSocial = type === 'youtube' || type === 'social_video';
                
                if(s.startsWith('blob:')) continue; // ข้ามสตรีมมิ่งสด

                let b = null;
                let ext = 'jpg';

                if (isDataUrl) {
                    b = b64toBlob(s);
                    ext = s.substring(11, s.indexOf(';')).replace('jpeg', 'jpg');
                } else if (isSocial) {
                    let thumbUrl = null;
                    let targetItem = mediaArray.find(m => m.url === s);
                    if(targetItem && targetItem.thumb) thumbUrl = targetItem.thumb;
                    if(type === 'youtube') {
                        let vidId = s.match(/[?&]v=([^&]+)/) || s.match(/youtu\.be\/([^?]+)/) || s.match(/shorts\/([^?]+)/);
                        if(vidId && vidId[1]) thumbUrl = `https://img.youtube.com/vi/${vidId[1]}/hqdefault.jpg`;
                    }
                    if(thumbUrl && !thumbUrl.startsWith('data:')) b = await fetchMedia(thumbUrl);
                    else if(thumbUrl && thumbUrl.startsWith('data:')) b = b64toBlob(thumbUrl);
                    ext = 'jpg';
                } else {
                    b = await fetchMedia(s);
                    if(b) {
                        ext = s.split('.').pop().split('?')[0].toLowerCase();
                        if(!['jpg','jpeg','png','gif','webp','svg','mp4','webm','ogg','mov','m4v','mp3','wav','m4a'].includes(ext)) {
                            ext = type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'jpg');
                        }
                    }
                }

                if(b) {
                    let base = 'KIRITO_MEDIA';
                    let padIdx = String(i+1).padStart(3, '0');
                    zip.file(`${base}_${type.toUpperCase()}_${padIdx}.${ext}`, b);
                    successCount++;
                }
                statusText.innerText = `กำลังแพ็กไฟล์ ${successCount}/${total} ...`;
            }

            if(successCount === 0) {
                statusText.innerText = 'ล้มเหลว: โดนบล็อก หรือเป็นไฟล์ติดลิขสิทธิ์เข้ารหัส (Blob)';
                statusText.style.color = '#ff3333';
                btn.disabled = false; btn.innerHTML = origBtnText;
                return;
            }

            statusText.innerText = 'กำลังสร้างไฟล์ ZIP ขั้นสุดท้าย...';
            try {
                let content = await zip.generateAsync({type: 'blob'});
                let u2 = URL.createObjectURL(content);
                let a2 = document.createElement('a'); a2.href = u2; a2.download = 'KIRITO_PACK_' + Date.now() + '.zip';
                a2.click(); 
                setTimeout(()=>URL.revokeObjectURL(u2), 2000); 
                statusText.innerText = `โหลด ZIP สำเร็จ (${successCount} ไฟล์)`;
                statusText.style.color = '#28a745';
                btn.innerHTML = `${SVGs.check} สำเร็จ!`;
            } catch(e) {
                statusText.innerText = 'ZIP Error: แรมอาจเต็ม แนะนำให้โหลดแยกทีละคลิป';
                statusText.style.color = '#ff3333';
                btn.disabled = false;
            }
            setTimeout(() => { btn.disabled = false; btn.innerHTML = origBtnText; }, 3000);
        };

        if(typeof JSZip === 'undefined') {
            statusText.innerText = 'กำลังโหลด JSZip...';
            let script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = doZip; document.head.appendChild(script);
        } else doZip();
    };
})();

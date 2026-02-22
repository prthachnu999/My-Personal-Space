// ==========================================
// KIRITO PULL SYSTEM - ULTIMATE MEDIA EDITION v6 (Deep Media Finder)
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
    
    // ทายประเภทไฟล์จากนามสกุล (เผื่อกรณีดึงจาก string ตรงๆ)
    const guessType = (u) => {
        const ext = u.split('.').pop().split('?')[0].toLowerCase();
        if (['mp4', 'webm', 'ogg', 'mov', 'm4v'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
        if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tiff', 'heic', 'ico', 'bmp'].includes(ext)) return 'image';
        return null; 
    };

    // --- ระบบดึง Media ขั้นสูง (ไม่สนนามสกุล ถ้าบังคับ Type มา) ---
    const addMedia = function(s, forceType = null) {
        if(!s || typeof s !== 'string' || s.startsWith('data:')) return;
        
        s = s.trim().replace(/\\u002F/g, '/').replace(/\\/g, '');
        if(s.startsWith('//')) s = 'https:' + s;
        else if(s.startsWith('/')) s = location.origin + s;
        else if(!s.startsWith('http') && !s.startsWith('blob:')) s = new URL(s, location.href).href;
        
        try {
            let u = new URL(decodeURIComponent(s), 'http://d').searchParams.get('url');
            if(u) s = u;
        } catch(e) {}
        
        let uL = s.toLowerCase().split('?')[0];
        if(uL.match(/\.(js|css|html|php|json|xml|txt)$/i)) return;
        
        // ถ้าเป็นไฟล์ที่ไม่รู้นามสกุล (เช่น Blob หรือ API) ระบบจะยึดตามที่ส่งมา (forceType)
        let type = forceType || guessType(uL);
        if(!type) return; // ถ้าไม่ใช่นามสกุลสื่อมีเดีย และไม่ได้บังคับมา ให้ข้ามไป
        
        let k = cleanK(s);
        let ex = uMap.get(k);
        if(!ex || getSc(s) > getSc(ex.url)) {
            uMap.set(k, { url: s, type: type });
        } else if(getSc(s) === getSc(ex.url) && !s.includes('?') && ex.url.includes('?')) {
            uMap.set(k, { url: s, type: type });
        }
    };

    // 1. ดึงจากแท็กมาตรฐานแบบเจาะจงประเภท (แก้ปัญหาหา Video ไม่เจอ)
    Array.from(document.images).forEach(e => addMedia(e.src, 'image'));
    Array.from(document.querySelectorAll('video')).forEach(e => {
        addMedia(e.src, 'video'); // ดึงตัวคลิปหลัก (แม้จะเป็น blob)
        if(e.poster) addMedia(e.poster, 'image'); // ดึงหน้าปกคลิป
        Array.from(e.querySelectorAll('source')).forEach(src => addMedia(src.src, 'video'));
    });
    Array.from(document.querySelectorAll('audio')).forEach(e => {
        addMedia(e.src, 'audio');
        Array.from(e.querySelectorAll('source')).forEach(src => addMedia(src.src, 'audio'));
    });
    
    // 2. ดึงจาก Attributes ทุกรูปแบบ (คาดเดาประเภทจากนามสกุล)
    Array.from(document.querySelectorAll('*')).forEach(e => {
        ['data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'src', 'href', 'srcset', 'content'].forEach(attr => {
            let ds = e.getAttribute(attr);
            if(ds) {
                if(ds.includes(',')) ds.split(',').forEach(p => addMedia(p.trim().split(/\s+/)[0]));
                else addMedia(ds);
            }
        });
        let bg = window.getComputedStyle(e).backgroundImage;
        let m = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if(m) addMedia(m[1], 'image'); // พื้นหลังต้องเป็นรูปภาพเท่านั้น
    });
    
    // 3. ทะลวง Source Code / JSON (ครอบคลุมสื่อทุกชนิด)
    const htmlCode = document.documentElement.innerHTML;
    const urlRegex = /(?:https?:|\\\/\\\/|\/\/)[^\s"'<>;&\\]+\.(?:jpg|jpeg|png|gif|webp|svg|ico|mp4|webm|ogg|mov|m4v|mp3|wav|m4a)(?:\?[^\s"'<>\\]*)?/gi;
    let match;
    while ((match = urlRegex.exec(htmlCode)) !== null) {
        addMedia(match[0]);
    }

    if(uMap.size === 0) {
        alert('ไม่พบไฟล์มีเดียใดๆ (หากเป็นคลิปที่เข้ารหัสป้องกันสูง อาจจะไม่สามารถดูดได้ครับ)');
        return;
    }

    const mediaArray = Array.from(uMap.values()); // เป็น Array ของ Object: {url: '...', type: 'video'}
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
            
            .container { position: absolute; top:0; left:0; width: 100%; height: 100%; background: rgba(10, 10, 10, 0.65); overflow-y: auto; padding: 25px; color: #fff; pointer-events: auto; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: krtFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
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
                    <button class="filter-btn" data-type="video">🎥 วิดีโอ (Video)</button>
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

                <div class="filter-label">📏 ขนาดไฟล์ (Size) *เฉพาะรูป/คลิป:</div>
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

    const formatTime = (seconds) => {
        if(!seconds || isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const cleanFilename = (url) => {
        let raw = url.split('/').pop().split(/[#?]/)[0];
        try{ raw = decodeURIComponent(raw); }catch(e){}
        if(raw.length > 20) raw = raw.substring(0, 10) + '...' + raw.substring(raw.length - 7);
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

            if (currentMainType !== 'all' && mediaType !== currentMainType) show = false;

            if (show && currentSubType !== 'all') {
                if (currentSubType === 'jpg' && !['jpg', 'jpeg'].includes(ext)) show = false;
                else if (['png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav'].includes(currentSubType) && ext !== currentSubType) show = false;
                else if (currentSubType === 'other_img' && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) show = false;
                else if (currentSubType === 'other_vid' && ['mp4', 'webm'].includes(ext)) show = false;
                else if (currentSubType === 'other_aud' && ['mp3', 'wav'].includes(ext)) show = false;
            }

            if (show && currentSizeFilter !== 'all') {
                if (mediaType === 'audio') show = false; 
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
    mediaArray.forEach((item, idx) => {
        const s = item.url;
        const mediaType = item.type;
        
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
        imgContainer.onclick = () => openLightbox(idx);
        
        let infoContainer = document.createElement('div');
        infoContainer.className = 'media-info';
        let fname = cleanFilename(s);

        if (mediaType === 'video') {
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
            vid.onerror = function() { 
                // หากดึงวิดีโอ (เช่น blob จาก YouTube) ไม่ขึ้น ให้แสดงข้อความแทนพัง
                infoContainer.innerHTML = `<span class="filename" title="${fname}">${fname}</span><span class="dimensions" style="color:#ff3333">Stream Protected</span>`; 
            };
            
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
            typeBadge.innerText = 'IMG'; typeBadge.style.background = 'rgba(40, 167, 69, 0.7)';
            let img = document.createElement('img');
            img.src = s; img.loading = "lazy";
            img.onerror = function() {
                if(!this.retried) { this.retried = true; this.src = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(s); }
                else { card.style.display = 'none'; }
            };
            img.onload = function() {
                if(this.naturalWidth < 30) { this.onerror(); return; }
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
            if (s.startsWith('blob:')) return window.open(s, '_blank'); // ไฟล์สตรีมมิ่งมักจะโหลดตรงไม่ได้
            let b = await fetchMedia(s);
            if(b) {
                let u2 = URL.createObjectURL(b);
                let a2 = document.createElement('a'); a2.href = u2; 
                let e = s.split('.').pop().split('?')[0].toLowerCase();
                if(e.length > 4) e = mediaType === 'video' ? 'mp4' : (mediaType === 'audio' ? 'mp3' : 'jpg');
                a2.download = `KIRITO_MEDIA_${Date.now()}.${e}`;
                a2.click(); 
                setTimeout(()=>URL.revokeObjectURL(u2), 1000);
                showTempIcon(btnDl, SVGs.check, SVGs.dl);
            } else window.open(s, '_blank');
        };

        let btnCopyLink = document.createElement('button');
        btnCopyLink.className = 'btn-icon btn-copy-link'; btnCopyLink.title = 'คัดลอกลิงก์'; btnCopyLink.innerHTML = SVGs.link;
        btnCopyLink.onclick = () => {
            navigator.clipboard.writeText(s).then(() => showTempIcon(btnCopyLink, SVGs.check, SVGs.link))
            .catch(()=>{
                let t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
                showTempIcon(btnCopyLink, SVGs.check, SVGs.link);
            });
        };

        let btnCopyImg = document.createElement('button');
        btnCopyImg.className = 'btn-icon btn-copy-img'; btnCopyImg.title = 'คัดลอกลงคลิปบอร์ด'; btnCopyImg.innerHTML = SVGs.copy;
        btnCopyImg.onclick = async () => {
            if(mediaType !== 'image') return alert("คลิปวิดีโอและเสียงไม่สามารถก็อปปี้ลงคลิปบอร์ดได้ กรุณากดโหลดแทนครับ");
            try {
                if (!navigator.clipboard || !navigator.clipboard.write) throw new Error("Blocked");
                let b = await fetchMedia(s);
                if(b) {
                    await navigator.clipboard.write([new ClipboardItem({[b.type]: b})]);
                    showTempIcon(btnCopyImg, SVGs.check, SVGs.copy);
                } else alert("โดนบล็อกการดึงข้อมูล");
            } catch(e) { alert("เบราว์เซอร์ไม่รองรับการคัดลอกรูปนี้"); }
        };

        actions.append(btnDl, btnCopyLink, btnCopyImg);
        card.append(checkbox, typeBadge, imgContainer, infoContainer, actions);
        gallery.append(card);
    });

    setTimeout(applyVisualFilters, 300);

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
    let activeLbElement = null;

    shadow.getElementById('lb-close').onclick = () => {
        lightbox.classList.remove('active');
        lbVid.pause(); lbAud.pause();
    };
    
    const updateTransform = () => {
        if(sc <= 1) { sc = 1; tx = 0; ty = 0; }
        if(activeLbElement) {
            if(activeLbElement === lbAud) activeLbElement.style.transform = `translate(0px, 0px) scale(1)`;
            else activeLbElement.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
        }
    }

    const openLightbox = (index) => {
        let visibleCards = shadow.querySelectorAll('.media-card:not(.hidden-by-filter)');
        if(visibleCards.length === 0) return;
        
        const targetUrl = visibleCards[index].querySelector('.chk-select').getAttribute('data-url');
        currentLbIndex = mediaArray.findIndex(m => m.url === targetUrl);
        
        const src = mediaArray[currentLbIndex].url;
        const type = mediaArray[currentLbIndex].type;

        lbImg.style.display = 'none'; lbVid.style.display = 'none'; lbAud.style.display = 'none';
        lbVid.pause(); lbVid.src = ''; lbAud.pause(); lbAud.src = '';
        sc = 1; tx = 0; ty = 0; 

        if (type === 'video') {
            lbVid.src = src; lbVid.style.display = 'block'; lbVid.play().catch(e=>{}); activeLbElement = lbVid;
        } else if (type === 'audio') {
            lbAud.src = src; lbAud.style.display = 'block'; lbAud.play().catch(e=>{}); activeLbElement = lbAud;
        } else {
            lbImg.src = src; lbImg.style.display = 'block'; activeLbElement = lbImg;
        }

        updateTransform();
        lightbox.classList.add('active');
    };

    const navLb = (dir) => {
        let visibleCards = Array.from(shadow.querySelectorAll('.media-card:not(.hidden-by-filter)'));
        if(visibleCards.length === 0) return;
        const currentUrl = mediaArray[currentLbIndex].url;
        let visibleIndex = visibleCards.findIndex(card => card.querySelector('.chk-select').getAttribute('data-url') === currentUrl);
        
        if(visibleIndex === -1) visibleIndex = 0;
        visibleIndex += dir;
        if(visibleIndex < 0) visibleIndex = visibleCards.length - 1;
        if(visibleIndex >= visibleCards.length) visibleIndex = 0;
        
        openLightbox(visibleIndex);
    };
    shadow.getElementById('lb-prev').onclick = () => navLb(-1);
    shadow.getElementById('lb-next').onclick = () => navLb(1);

    const getDist = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    
    lbContentWrapper.addEventListener('wheel', (e) => {
        if(activeLbElement === lbAud) return;
        e.preventDefault(); sc += e.deltaY * -0.002; updateTransform();
    }, {passive: false});
    
    lbContentWrapper.addEventListener('mousedown', (e) => {
        if(e.target === lbVid || e.target === lbAud) return;
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
        if(e.target === lbVid || e.target === lbAud) return;
        if(e.touches.length === 1) {
            if(sc > 1) {
                isDragging = true; isSwiping = false;
                startX = e.touches[0].clientX - tx; startY = e.touches[0].clientY - ty;
            } else {
                startTouchX = e.touches[0].clientX; isSwiping = true; isDragging = false;
            }
        } else if (e.touches.length === 2 && activeLbElement !== lbAud) {
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

    // === ZIP ===
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
                
                // ข้ามไฟล์ blob: เพราะ fetch บนสตรีมมิ่งมักจะพังและเปลืองแรม
                if(s.startsWith('blob:')) continue;

                let b = await fetchMedia(s);
                if(b) {
                    let fname = s.split('/').pop().split('?')[0];
                    try { fname = decodeURIComponent(fname); } catch(e) {}
                    let ext = fname.split('.').pop().toLowerCase();
                    if(!['jpg','jpeg','png','gif','webp','svg','mp4','webm','ogg','mov','m4v','mp3','wav','m4a'].includes(ext)) {
                        ext = type === 'video' ? 'mp4' : (type === 'audio' ? 'mp3' : 'jpg');
                    }
                    let base = fname.substring(0, fname.lastIndexOf('.')) || 'KIRITO_MEDIA';
                    let padIdx = String(i+1).padStart(3, '0');
                    zip.file(`${base}_${padIdx}.${ext}`, b);
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

            statusText.innerText = 'กำลังสร้างไฟล์ ZIP ขั้นสุดท้าย (อาจใช้เวลาถ้าวิดีโอใหญ่)...';
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

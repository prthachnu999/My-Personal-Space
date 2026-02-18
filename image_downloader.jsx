import React, { useState, useRef, useEffect } from 'react';
import { Download, Search, Image as ImageIcon, Trash2, Loader2, AlertCircle, CheckCircle2, ScanSearch, Filter, XCircle, Link as LinkIcon, ClipboardCopy, CheckSquare, X, Maximize2, ChevronLeft, ChevronRight, FileType, ZoomIn, ZoomOut, RotateCcw, Flame, ArrowLeft, ShieldCheck, Database } from 'lucide-react';

const App = () => {
  const [url, setUrl] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  
  const [minSize, setMinSize] = useState(10); 
  const [filterSocial, setFilterSocial] = useState(true);
  const [fileTypeFilter, setFileTypeFilter] = useState('all');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isDownloadingGroup, setIsDownloadingGroup] = useState(false);
  
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef({ x: 0, y: 0 });
  const isDragActionRef = useRef(false);
  const containerRef = useRef(null);

  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (previewImage) {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh'; 
      if (containerRef.current) {
        containerRef.current.addEventListener('wheel', (e) => {
           if(e.ctrlKey) return; 
           e.preventDefault(); 
        }, { passive: false });
      }
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      isDragActionRef.current = false;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.height = 'auto';
    };
  }, [previewImage]);

  const getExtension = (url) => {
    try {
      const cleanUrl = url.split(/[?#]/)[0];
      return cleanUrl.split('.').pop().toLowerCase();
    } catch (e) { return ''; }
  };

  const getReadableFilename = (imgUrl) => {
    try {
      const cleanUrl = imgUrl.split(/[?#]/)[0];
      const filenameEncoded = cleanUrl.split('/').pop();
      return decodeURIComponent(filenameEncoded);
    } catch (e) {
      return 'image.jpg';
    }
  };

  const getBaseFilename = (url) => {
    try {
      const cleanUrl = url.split(/[?#]/)[0];
      const filename = cleanUrl.split('/').pop();
      let base = filename.replace(/\.(jpg|jpeg|png|webp|avif|gif|svg|ico|bmp|tiff)$/i, '');
      base = base.replace(/[-_]\d+x\d+$/i, '');
      base = base.replace(/[-_](scaled|rotated|copy|crop|cropped|optimized|resize|thumb|thumbnail|medium|large|small)/gi, '');
      return decodeURIComponent(base).trim().toLowerCase();
    } catch (e) {
      return '';
    }
  };

  const checkImageSize = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const width = img.naturalWidth || 0;
        const height = img.naturalHeight || 0;
        const ext = getExtension(url);

        const effectiveMin = minSize === 0 ? 1 : minSize;
        const isBigEnough = (width >= effectiveMin || height >= effectiveMin);

        let typePass = true;
        if (fileTypeFilter !== 'all') {
          if (fileTypeFilter === 'jpg' && !['jpg', 'jpeg'].includes(ext)) typePass = false;
          else if (fileTypeFilter !== 'jpg' && ext !== fileTypeFilter) typePass = false;
        }
        
        resolve({ valid: isBigEnough && typePass, width, height, url });
      };
      img.onerror = () => { resolve({ valid: false, url }); };
      setTimeout(() => resolve({ valid: false, url }), 8000); 
    });
  };

  const convertToPng = (blob) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) resolve(pngBlob);
          else reject(new Error('Conversion failed'));
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      img.src = url;
    });
  };

  // --- V4 Logic: Robust URL Resolution ---
  const resolveUrl = (path, baseUrl) => {
    try {
      if (!path || typeof path !== 'string') return null;
      path = path.trim();
      
      // Remove escaping backslashes from JSON
      path = path.replace(/\\/g, ''); 
      
      // Decode recursively if needed
      if (path.includes('%3A') || path.includes('%2F')) {
          try { path = decodeURIComponent(path); } catch(e){}
      }

      if (path.startsWith('data:')) return null;
      
      // Fix Next.js specific paths
      if (path.startsWith('/_next/image?url=')) {
          const params = new URLSearchParams(path.split('?')[1]);
          const realUrl = params.get('url');
          if (realUrl) return resolveUrl(realUrl, baseUrl); // Recurse
      }

      if (path.startsWith('//')) return 'https:' + path;
      if (path.startsWith('http')) return path;
      
      return new URL(path, baseUrl).href;
    } catch (e) {
      return null;
    }
  };

  const extractRealUrl = (rawSrc) => {
    try {
        if (!rawSrc || typeof rawSrc !== 'string') return null;
        let candidate = rawSrc;

        // Extract from proxy/nextjs params like ?url=...
        if (candidate.includes('url=') || candidate.includes('img=') || candidate.includes('src=')) {
            try {
                // Check if it's a relative path starting with /
                const base = candidate.startsWith('/') ? 'http://fake.com' : '';
                const urlObj = new URL(base + candidate);
                const realUrl = urlObj.searchParams.get('url') || urlObj.searchParams.get('img') || urlObj.searchParams.get('src');
                if (realUrl) candidate = realUrl;
            } catch(e) {}
        }
        return candidate;
    } catch (e) {
        return rawSrc;
    }
  };

  // --- V4 Logic: Recursive JSON Walker ---
  const findUrlsInObject = (obj, foundUrls) => {
      if (!obj) return;
      
      if (typeof obj === 'string') {
          // Check if string looks like an image URL
          if (/\.(jpg|jpeg|png|webp|avif|svg|gif)$/i.test(obj.split('?')[0]) || obj.includes('/_next/image')) {
              foundUrls.add(obj);
          }
          // Check for URL encoded strings inside JSON
          if (obj.includes('%3A%2F%2F')) {
              try { foundUrls.add(decodeURIComponent(obj)); } catch(e){}
          }
          return;
      }

      if (typeof obj === 'object') {
          for (const key in obj) {
              findUrlsInObject(obj[key], foundUrls);
          }
      }
  };

  const fetchHtmlWithFallback = async (targetUrl, signal) => {
     const proxies = [
         `https://corsproxy.io/?${targetUrl}`,
         `https://api.allorigins.win/get?url=${targetUrl}`
     ];

     for (const proxy of proxies) {
         try {
             if (signal.aborted) throw new Error('Aborted');
             const response = await fetch(proxy, { signal });
             if (!response.ok) continue;
             
             if (proxy.includes('allorigins')) {
                 const data = await response.json();
                 return data.contents;
             } else {
                 return await response.text();
             }
         } catch (e) {
             if (e.name === 'AbortError') throw e;
         }
     }
     throw new Error('ไม่สามารถเข้าถึงหน้าเว็บได้ (ทุก Proxy ล้มเหลว)');
  };

  // --- Main Fetch Logic ---
  const fetchImages = async () => {
    if (!url) {
      showStatus('error', 'กรุณากรอก URL ก่อนครับ');
      return;
    }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setImages([]);
    setSelectedImages(new Set());
    setIsSelectionMode(false);
    setPreviewImage(null);
    setStatus({ type: '', message: 'กำลังเจาะระบบ (JSON Mining)...' });
    setProgress({ current: 0, total: 0 });

    try {
      const cleanInputUrl = url.trim();
      const encodedTargetUrl = encodeURIComponent(cleanInputUrl);
      
      const htmlContent = await fetchHtmlWithFallback(encodedTargetUrl, abortControllerRef.current.signal);

      setStatus({ type: '', message: 'กำลังถอดรหัสโครงสร้างเว็บ (V4)...' });

      const rawUrls = new Set();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // --- STRATEGY 1: Next.js Data Extraction (The GOLD MINE) ---
      const nextDataScript = doc.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
          try {
              const jsonData = JSON.parse(nextDataScript.textContent);
              findUrlsInObject(jsonData, rawUrls);
              console.log("Found URLs in Next Data:", rawUrls.size);
          } catch(e) {
              console.warn("Failed to parse NEXT_DATA", e);
          }
      }

      // --- STRATEGY 2: Brute Force JSON/Text Scanning ---
      // Find anything that looks like http.....jpg
      const regexBroad = /(?:https?:\/\/|\/|www\.)[\w\-\._~:/?#[\]@!$&'()*+,;=]+(?:\.(?:jpg|jpeg|png|webp|avif|svg))/gi;
      const allTextMatches = htmlContent.match(regexBroad) || [];
      allTextMatches.forEach(m => rawUrls.add(m.replace(/\\/g, '')));

      // Find anything encoded
      const regexEncoded = /(?:https?%3A%2F%2F)[^"'\s\\]+/gi;
      const encodedMatches = htmlContent.match(regexEncoded) || [];
      encodedMatches.forEach(m => {
          try { rawUrls.add(decodeURIComponent(m)); } catch(e){}
      });

      // --- STRATEGY 3: Standard DOM & Srcset ---
      doc.querySelectorAll('img, source, video').forEach(el => {
          ['src', 'data-src', 'srcset', 'data-srcset'].forEach(attr => {
              const val = el.getAttribute(attr);
              if (!val) return;

              if (attr.includes('srcset')) {
                  // Split srcset by comma, but handle commas inside URLs? Usually space separates url/size
                  // Simple split:
                  val.split(',').forEach(part => {
                      const urlPart = part.trim().split(' ')[0];
                      if(urlPart) rawUrls.add(urlPart);
                  });
              } else {
                  rawUrls.add(val);
              }
          });
      });

      // --- PROCESS ---
      const candidates = [];
      rawUrls.forEach(raw => {
        const extracted = extractRealUrl(raw); // Handle /_next/image?url=...
        const absolute = resolveUrl(extracted, cleanInputUrl);
        if (absolute) candidates.push(absolute);
      });

      // Filter & Group
      const imageGroups = new Map();
      candidates.forEach(imgUrl => {
        const lower = imgUrl.toLowerCase();
        // Strict Filter for junk
        if (filterSocial && (
            lower.includes('facebook.com/tr') || 
            lower.includes('google-analytics') || 
            lower.includes('pixel') || 
            lower.includes('favicon') || 
            !/\.(jpg|jpeg|png|webp|avif|svg)/.test(lower) // Must have extension in V4 to reduce trash
        )) return;
        
        const baseName = getBaseFilename(imgUrl);
        const key = (baseName && baseName.length > 2) ? baseName : imgUrl;
        
        if (!imageGroups.has(key)) imageGroups.set(key, []);
        imageGroups.get(key).push(imgUrl);
      });

      const uniqueCandidates = [];
      imageGroups.forEach((group) => {
        // Sort: Prefer Cleanest > Longest (params) > Shortest
        // For Next.js, longest usually has query params for quality.
        group.sort((a, b) => b.length - a.length);
        uniqueCandidates.push(group[0]); 
      });

      setStatus({ type: '', message: `เจอ ${uniqueCandidates.length} ลิงก์ (กำลังเช็ครูปจริง)...` });
      setProgress({ current: 0, total: uniqueCandidates.length });

      const verifiedImages = [];
      const batchSize = 12;
      for (let i = 0; i < uniqueCandidates.length; i += batchSize) {
        if (abortControllerRef.current.signal.aborted) break;
        const batch = uniqueCandidates.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(url => checkImageSize(url)));
        const goodBatch = results.filter(r => r.valid).map(r => r.url);
        verifiedImages.push(...goodBatch);
        setImages(prev => [...prev, ...goodBatch]); 
        setProgress({ current: Math.min(i + batchSize, uniqueCandidates.length), total: uniqueCandidates.length });
      }

      if (verifiedImages.length === 0) showStatus('warning', 'ไม่พบรูป (เว็บอาจเข้ารหัสขั้นสูง)');
      else showStatus('success', `เสร็จสิ้น! ดูดมาได้ ${verifiedImages.length} รูป`);
    } catch (error) {
      if (error.name !== 'AbortError') showStatus('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, msg) => {
    setStatus({ type, message: msg });
    if (type === 'success') setTimeout(() => setStatus({ type: '', message: '' }), 4000);
  };

  const downloadImage = async (imgUrl) => {
    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(imgUrl)}`);
      if (!response.ok) throw new Error('Proxy failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getReadableFilename(imgUrl);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(imgUrl, '_blank');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showStatus('success', 'คัดลอกลิงก์แล้ว');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showStatus('success', 'คัดลอกลิงก์แล้ว');
    }
  };

  const copyImageToClipboard = async (imgUrl) => {
    setStatus({ type: 'info', message: 'กำลังเตรียมรูป...' });
    try {
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(imgUrl)}`);
      const blob = await response.blob();
      const pngBlob = await convertToPng(blob);
      await navigator.clipboard.write([new ClipboardItem({ [pngBlob.type]: pngBlob })]);
      showStatus('success', 'คัดลอกรูปแล้ว! (วางได้เลย)');
    } catch (e) {
      copyToClipboard(imgUrl);
      showStatus('warning', 'ก๊อปรูปไม่ได้ -> ก๊อปลิงก์ให้แทน');
    }
  };

  const toggleSelect = (img) => {
    const newSet = new Set(selectedImages);
    if (newSet.has(img)) newSet.delete(img);
    else newSet.add(img);
    setSelectedImages(newSet);
  };

  const downloadSelected = async () => {
    setIsDownloadingGroup(true);
    const list = Array.from(selectedImages);
    showStatus('info', 'กำลังเริ่มโหลด... (กด Allow หาก Browser ถาม)');
    for (let i = 0; i < list.length; i++) {
      await downloadImage(list[i]);
      await new Promise(r => setTimeout(r, 600)); 
    }
    setIsDownloadingGroup(false);
    showStatus('success', 'โหลดเสร็จสิ้น');
  };

  const copySelectedLinks = () => {
    const links = Array.from(selectedImages).join('\n');
    copyToClipboard(links);
    showStatus('success', `คัดลอกลิงก์ ${selectedImages.size} รูปแล้ว`);
  };

  const handleWheel = (e) => {
    const delta = e.deltaY * -0.002; 
    const newZoom = Math.min(Math.max(1, zoom + delta), 5);
    setZoom(newZoom);
    if (newZoom === 1) setOffset({ x: 0, y: 0 }); 
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      isDragActionRef.current = false; 
      dragStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    if (Math.abs(newX - offset.x) > 2 || Math.abs(newY - offset.y) > 2) {
        isDragActionRef.current = true;
    }
    setOffset({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setTimeout(() => { isDragActionRef.current = false; }, 200);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => {
      setZoom(prev => {
          const next = Math.max(1, prev - 0.5);
          if (next === 1) setOffset({ x: 0, y: 0 });
          return next;
      });
  };
  const handleResetZoom = () => {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
  };
  const handleDoubleClick = () => {
      if (zoom > 1) handleResetZoom();
      else setZoom(2);
  };

  const openPreview = (img) => setPreviewImage(img);
  const closePreview = () => setPreviewImage(null);
  const nextPreview = () => {
    const idx = images.indexOf(previewImage);
    if (idx !== -1 && idx < images.length - 1) setPreviewImage(images[idx + 1]);
  };
  const prevPreview = () => {
    const idx = images.indexOf(previewImage);
    if (idx !== -1 && idx > 0) setPreviewImage(images[idx - 1]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!previewImage) return;
      if (e.key === 'Escape') closePreview();
      if (e.key === 'ArrowRight') nextPreview();
      if (e.key === 'ArrowLeft') prevPreview();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') handleResetZoom();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, images, zoom]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-4 font-sans selection:bg-red-500/30">
      <a href="https://prthachnu999.github.io/My-Personal-Space/" className="fixed bottom-5 left-5 z-40 flex items-center gap-2 bg-black/60 hover:bg-red-600 text-white/80 hover:text-white px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-2xl transition-all hover:scale-105 group text-sm">
         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
         <span className="font-medium">Home</span>
      </a>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <div className="inline-flex items-center justify-center gap-3 mb-2 animate-in fade-in zoom-in duration-500">
            <div className="relative">
               <div className="absolute inset-0 bg-red-600 blur-lg opacity-50 rounded-full"></div>
               <Flame className="relative text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" size={40} />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
              KIRITO <span className="text-red-500">DOWNLOADER</span>
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm tracking-widest uppercase opacity-80 mt-1">
             <Database size={14} className="text-blue-500"/>
             <span>System Level: Administrator (V4 JSON Hunter)</span>
          </div>
        </div>

        <div className="bg-[#121212] border border-gray-800 p-5 rounded-2xl shadow-2xl mb-8 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-900 to-transparent opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-900 to-transparent opacity-50"></div>

          <div className="flex flex-col md:flex-row gap-3 relative z-10">
            <div className="relative flex-1 group/input">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-gray-500 group-focus-within/input:text-red-500 transition-colors" size={20} />
              </div>
              <input
                type="text"
                placeholder="วางลิงก์เว็บไซต์ที่นี่..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0f0f0f] border border-gray-700 text-white placeholder-gray-600 focus:ring-2 focus:ring-red-900 focus:border-red-700 outline-none transition-all shadow-inner"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchImages()}
              />
            </div>
            <button
              onClick={fetchImages}
              disabled={loading}
              className="bg-gradient-to-br from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(220,38,38,0.3)] transition-all active:scale-95 border border-red-800"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <ScanSearch size={20} />}
              <span>ค้นหา</span>
            </button>
            <button 
              onClick={() => { setImages([]); setUrl(''); setStatus({type:'',message:''}); }} 
              className="p-3 text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-red-900/20 border border-gray-700 hover:border-red-900 rounded-xl transition-all" 
              title="ล้างค่าทั้งหมด"
            >
              <Trash2 size={22} />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-5 pt-4 border-t border-gray-800/50">
             <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-gray-800">
                   <Filter size={14} className="text-blue-500"/>
                   <span className="text-xs text-gray-500 uppercase font-bold">ขนาด</span>
                   <select 
                      value={minSize} 
                      onChange={e => setMinSize(Number(e.target.value))} 
                      className="bg-transparent text-gray-300 text-sm border-none outline-none cursor-pointer hover:text-white appearance-none pr-4"
                   >
                      <option value="0" className="bg-[#121212] text-white">ทั้งหมด (0px+)</option>
                      <option value="10" className="bg-[#121212] text-white">เล็ก (&gt;10px)</option>
                      <option value="200" className="bg-[#121212] text-white">ปานกลาง (&gt;200px)</option>
                      <option value="500" className="bg-[#121212] text-white">ใหญ่ (&gt;500px)</option>
                   </select>
                </div>
                <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-gray-800">
                   <FileType size={14} className="text-blue-500"/>
                   <span className="text-xs text-gray-500 uppercase font-bold">ไฟล์</span>
                   <select 
                      value={fileTypeFilter} 
                      onChange={e => setFileTypeFilter(e.target.value)} 
                      className="bg-transparent text-gray-300 text-sm border-none outline-none cursor-pointer hover:text-white appearance-none pr-4"
                   >
                      <option value="all" className="bg-[#121212] text-white">ทั้งหมด</option>
                      <option value="jpg" className="bg-[#121212] text-white">JPG</option>
                      <option value="png" className="bg-[#121212] text-white">PNG</option>
                      <option value="webp" className="bg-[#121212] text-white">WEBP</option>
                      <option value="svg" className="bg-[#121212] text-white">SVG</option>
                   </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none group/chk">
                   <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${filterSocial ? 'bg-red-900 border-red-700' : 'bg-transparent border-gray-600'}`}>
                      {filterSocial && <CheckSquare size={10} className="text-white"/>}
                   </div>
                   <input type="checkbox" checked={filterSocial} onChange={e => setFilterSocial(e.target.checked)} className="hidden" />
                   <span className="text-sm text-gray-400 group-hover/chk:text-gray-200">กรองขยะ</span>
                </label>
             </div>
             
             {images.length > 0 && (
               <div className="flex items-center gap-2">
                 {!isSelectionMode ? (
                   <button onClick={() => setIsSelectionMode(true)} className="flex items-center gap-2 px-4 py-1.5 bg-[#0a0a0a] hover:bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm transition-all">
                     <CheckSquare size={16} /> เลือกหลายรูป
                   </button>
                 ) : (
                   <div className="flex items-center gap-2 bg-blue-900/10 px-2 py-1 rounded-lg border border-blue-900/30 animate-in slide-in-from-right-5">
                      <span className="text-blue-400 font-bold text-xs px-2">เลือกแล้ว {selectedImages.size}</span>
                      
                      <button onClick={() => setSelectedImages(selectedImages.size === images.length ? new Set() : new Set(images))} className="text-gray-400 hover:text-white text-xs px-2 hover:bg-white/5 rounded py-1">
                        {selectedImages.size === images.length ? 'ไม่เลือก' : 'เลือกหมด'}
                      </button>

                      <div className="w-px h-4 bg-gray-700 mx-1"></div>

                      <button onClick={copySelectedLinks} disabled={selectedImages.size===0} className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-blue-900/30 disabled:opacity-30" title="คัดลอกลิงก์">
                         <LinkIcon size={16} />
                      </button>

                      <button onClick={downloadSelected} disabled={selectedImages.size===0 || isDownloadingGroup} className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1 rounded-md disabled:opacity-50 flex items-center gap-1 shadow-lg text-xs font-bold">
                        {isDownloadingGroup ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} โหลด
                      </button>
                      <button onClick={() => {setIsSelectionMode(false); setSelectedImages(new Set())}} className="text-gray-500 hover:text-red-500 ml-1"><XCircle size={16}/></button>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>

        {loading && progress.total > 0 && (
          <div className="mb-6 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300 shadow-[0_0_10px_red]" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
          </div>
        )}

        {status.message && !loading && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            status.type === 'error' ? 'bg-red-900/20 border-red-900/50 text-red-200' :
            status.type === 'warning' ? 'bg-amber-900/20 border-amber-900/50 text-amber-200' :
            status.type === 'info' ? 'bg-blue-900/20 border-blue-900/50 text-blue-200' :
            'bg-green-900/20 border-green-900/50 text-green-200'
          }`}>
             {status.type === 'error' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
             {status.message}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-24">
          {images.map((img, idx) => {
            const isSelected = selectedImages.has(img);
            return (
              <div 
                key={idx} 
                className={`group relative bg-[#121212] rounded-xl border overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-red-900/20 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-800 hover:border-gray-600'}`}
                onClick={() => isSelectionMode ? toggleSelect(img) : openPreview(img)}
              >
                <div className="aspect-square bg-[#050505] relative flex items-center justify-center p-2 pattern-grid">
                  <img src={img} alt="" className="max-w-full max-h-full object-contain" loading="lazy" />
                  
                  {isSelectionMode && (
                    <div className={`absolute top-2 left-2 w-6 h-6 rounded border flex items-center justify-center shadow-lg ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/50 border-gray-500'}`}>
                      {isSelected && <CheckSquare size={14} />}
                    </div>
                  )}

                  {!isSelectionMode && (
                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                      <div className="flex gap-2">
                        <button onClick={(e) => {e.stopPropagation(); downloadImage(img)}} className="p-3 bg-white/10 hover:bg-red-600 rounded-full text-white transition-all hover:scale-110 shadow-[0_0_15px_black]" title="ดาวน์โหลด">
                          <Download size={20} />
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); openPreview(img)}} className="p-3 bg-white/10 hover:bg-blue-600 rounded-full text-white transition-all hover:scale-110 shadow-[0_0_15px_black]" title="ดูรูป">
                          <Maximize2 size={20} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e)=>{e.stopPropagation(); copyToClipboard(img)}} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1 border border-white/5">
                          <LinkIcon size={12}/> ลิงก์
                        </button>
                        <button onClick={(e)=>{e.stopPropagation(); copyImageToClipboard(img)}} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1 border border-white/5">
                          <ClipboardCopy size={12}/> ก๊อป
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="px-3 py-2 bg-[#1a1a1a] border-t border-gray-800 flex justify-between items-center">
                   <span className="text-[10px] text-gray-400 truncate font-mono flex-1 opacity-70 group-hover:opacity-100 transition-opacity">{getReadableFilename(img)}</span>
                   <span className="text-[9px] text-gray-500 bg-black px-1.5 py-0.5 rounded ml-2 border border-gray-800 font-bold">{getExtension(img).toUpperCase()}</span>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && images.length === 0 && !status.message && (
          <div className="text-center py-32 opacity-30 flex flex-col items-center">
            <ImageIcon size={80} className="mb-4 text-gray-600" />
            <p className="text-xl font-light tracking-widest uppercase">ระบบพร้อมใช้งาน</p>
            <p className="text-sm mt-2 font-mono text-gray-500">รอรับลิงก์เพื่อเริ่มค้นหา...</p>
          </div>
        )}
      </div>

      {previewImage && (
        <div 
           className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center overflow-hidden animate-in fade-in duration-300" 
           onClick={closePreview}
           onMouseMove={handleMouseMove}
           onMouseUp={handleMouseUp}
           onMouseLeave={handleMouseUp}
        >
           <div className="absolute top-6 right-6 z-50 flex gap-4">
              <div className="bg-black/50 backdrop-blur-xl rounded-full flex items-center p-1.5 text-gray-300 gap-2 border border-white/10 shadow-2xl">
                  <button onClick={(e)=>{e.stopPropagation(); handleZoomOut()}} className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors"><ZoomOut size={18}/></button>
                  <span className="text-xs w-12 text-center font-mono text-blue-400 font-bold">{Math.round(zoom * 100)}%</span>
                  <button onClick={(e)=>{e.stopPropagation(); handleZoomIn()}} className="p-2 hover:bg-white/10 rounded-full hover:text-white transition-colors"><ZoomIn size={18}/></button>
                  <div className="w-px h-4 bg-white/20"></div>
                  <button onClick={(e)=>{e.stopPropagation(); handleResetZoom()}} className="p-2 hover:bg-white/10 rounded-full hover:text-red-400 transition-colors"><RotateCcw size={16}/></button>
              </div>
              <button className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all hover:rotate-90 duration-300" onClick={closePreview}>
                <X size={32} />
              </button>
           </div>
           
           <button className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white p-4 rounded-full hover:bg-white/5 z-50 hidden md:block transition-all hover:scale-110" onClick={(e) => {e.stopPropagation(); prevPreview()}}>
             <ChevronLeft size={48} />
           </button>
           <button className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white p-4 rounded-full hover:bg-white/5 z-50 hidden md:block transition-all hover:scale-110" onClick={(e) => {e.stopPropagation(); nextPreview()}}>
             <ChevronRight size={48} />
           </button>

           <div 
             className="w-full h-full flex items-center justify-center overflow-hidden cursor-move"
             ref={containerRef}
             onWheel={handleWheel}
             onMouseDown={handleMouseDown}
             onClick={(e) => {
               if (e.target.tagName === 'IMG' || isDragActionRef.current) {
                 e.stopPropagation();
               }
             }}
           >
             <img 
               src={previewImage} 
               alt="Preview" 
               className="max-w-none transition-transform duration-75 ease-out select-none drop-shadow-2xl"
               style={{ 
                 transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                 cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
                 maxHeight: zoom === 1 ? '85vh' : 'none',
                 maxWidth: zoom === 1 ? '85vw' : 'none'
               }}
               draggable={false}
               onDoubleClick={(e) => {e.stopPropagation(); handleDoubleClick()}}
             />
           </div>
           
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-4">
             <div className="flex gap-4">
                <button onClick={(e) => {e.stopPropagation(); downloadImage(previewImage)}} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:scale-105 transition-transform border border-red-500">
                  <Download size={20} /> ดาวน์โหลด
                </button>
                <button onClick={(e) => {e.stopPropagation(); copyImageToClipboard(previewImage)}} className="flex items-center gap-2 bg-black/60 hover:bg-white/20 text-white px-8 py-3 rounded-full font-bold backdrop-blur-md border border-white/20 hover:border-white/40 transition-colors">
                  <ClipboardCopy size={20} /> ก๊อปปี้
                </button>
             </div>
             <div className="text-gray-500 text-xs font-mono bg-black/80 px-4 py-1.5 rounded-full border border-gray-800">
               {getReadableFilename(previewImage)}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
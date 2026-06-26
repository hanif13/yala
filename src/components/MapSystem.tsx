import React, { useState, useEffect } from 'react';
import { 
  MapPin, Shield, Map as MapIcon, Layers, ShieldCheck, EyeOff, 
  Info, User, Phone, CheckCircle, RefreshCw, ChevronUp, ChevronDown, 
  Calendar, AlertCircle, FileText, Lock, Plus, Minus, Move 
} from 'lucide-react';
import { Case, CaseStatus } from '../types';

interface MapSystemProps {
  cases: Case[];
  role: 'public' | 'official';
  lang: 'th' | 'en';
  onSelectCase?: (c: Case) => void;
  selectedCaseId?: string | null;
  onStatusUpdate?: (
    id: string,
    newStatus?: CaseStatus,
    newDisease?: string,
    newPriority?: string,
    personalInfo?: any,
    clinicalInfo?: any
  ) => Promise<void>;
}

export default function MapSystem({
  cases,
  role,
  lang,
  onSelectCase,
  selectedCaseId,
  onStatusUpdate
}: MapSystemProps) {
  const [selectedPin, setSelectedPin] = useState<Case | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Interactive Map Pan & Zoom states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Two maps requested: One for public citizens and one for official staff. Both must use GIS.
  const [activeMapRole, setActiveMapRole] = useState<'public' | 'official'>(role);

  // Sync role prop updates
  useEffect(() => {
    setActiveMapRole(role);
  }, [role]);

  // Handle selected pin sync
  useEffect(() => {
    if (selectedCaseId) {
      const activeCase = cases.find(c => c.id === selectedCaseId);
      if (activeCase) {
        setSelectedPin(activeCase);
      }
    }
  }, [selectedCaseId, cases]);

  // Geographic bounds mapping Yala Municipality coordinates precisely on the SVG Canvas
  const minLat = 6.4900;
  const maxLat = 6.6000;
  const minLng = 101.2350;
  const maxLng = 101.3150;

  const width = 800;
  const height = 480;

  // Convert real Lat/Lng to SVG coordinate values
  const getXY = (lat: number, lng: number) => {
    const clampedLat = Math.min(Math.max(lat, minLat), maxLat);
    const clampedLng = Math.min(Math.max(lng, minLng), maxLng);
    const x = ((clampedLng - minLng) / (maxLng - minLng)) * width;
    const y = height - ((clampedLat - minLat) / (maxLat - minLat)) * height;
    return { x, y };
  };

  // GeoJSON Vectors from user specifications (Municipal Border, Rivers, Canals)
  const borderCoords = [
    [6.565, 101.255], [6.575, 101.265], [6.570, 101.285], [6.560, 101.300],
    [6.545, 101.305], [6.525, 101.305], [6.510, 101.295], [6.510, 101.275],
    [6.525, 101.260], [6.545, 101.250], [6.555, 101.252], [6.565, 101.255]
  ];

  const riverCoords = [
    [6.495, 101.270], [6.512, 101.268], [6.525, 101.260], [6.535, 101.258],
    [6.548, 101.262], [6.560, 101.264], [6.568, 101.263], [6.582, 101.250],
    [6.595, 101.240]
  ];

  const bamawCoords = [
    [6.530, 101.285], [6.535, 101.276], [6.538, 101.274], [6.542, 101.268],
    [6.548, 101.262]
  ];

  const weluwanCoords = [
    [6.522, 101.295], [6.535, 101.292], [6.547, 101.278], [6.554, 101.265]
  ];

  const getPathD = (coords: number[][]) => {
    return coords.map((pt, i) => {
      const { x, y } = getXY(pt[0], pt[1]);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  const handlePinClick = (c: Case) => {
    setSelectedPin(c);
    if (onSelectCase) {
      onSelectCase(c);
    }
  };

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const zoomIn = () => {
    setZoom(z => Math.min(z + 0.2, 4));
  };

  const zoomOut = () => {
    setZoom(z => Math.max(z - 0.2, 0.5));
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleStatusChange = async (id: string, newStatus: CaseStatus) => {
    setActionLoading(`${id}_${newStatus}`);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(id, newStatus);
        if (selectedPin && selectedPin.id === id) {
          setSelectedPin(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Safe translations helper for diseases
  const translateDisease = (d: string) => {
    const norm = d.toLowerCase();
    if (norm.includes('dengue') || norm.includes('ไข้เลือดออก')) {
      return lang === 'th' ? 'โรคไข้เลือดออก' : 'Dengue Fever';
    }
    if (norm.includes('covid') || norm.includes('โควิด')) {
      return lang === 'th' ? 'โรคโควิด-19' : 'COVID-19';
    }
    if (norm.includes('mouth') || norm.includes('มือ เท้า ปาก')) {
      return lang === 'th' ? 'โรคมือ เท้า ปาก' : 'Hand, Foot, & Mouth';
    }
    if (norm.includes('flu') || norm.includes('ไข้หวัดใหญ่') || norm.includes('influenza')) {
      return lang === 'th' ? 'โรคไข้หวัดใหญ่' : 'Influenza';
    }
    if (norm.includes('leptospirosis') || norm.includes('ฉี่หนู')) {
      return lang === 'th' ? 'โรคฉี่หนู' : 'Leptospirosis';
    }
    if (norm.includes('cholera') || norm.includes('อหิวา')) {
      return lang === 'th' ? 'โรคอหิวาตกโรค' : 'Cholera';
    }
    if (norm.includes('diarrhea') || norm.includes('อุจจาระร่วง') || norm.includes('ท้องร่วง')) {
      return lang === 'th' ? 'โรคอุจจาระร่วงเฉียบพลัน' : 'Diarrhea';
    }
    if (norm.includes('skin') || norm.includes('น้ำกัดเท้า') || norm.includes('ผิวหนัง')) {
      return lang === 'th' ? 'โรคผิวหนังและน้ำกัดเท้า' : 'Skin Infections';
    }
    return d;
  };

  const translateStatus = (s: CaseStatus) => {
    if (s === 'New') return lang === 'th' ? 'รายงานใหม่' : 'New Intake';
    if (s === 'Accepted') return lang === 'th' ? 'รับกักตัวแล้ว' : 'Quarantined';
    if (s === 'Waiting') return lang === 'th' ? 'รอผลตรวจ' : 'Waiting Test';
    return lang === 'th' ? 'เสร็จสิ้นภารกิจ' : 'Completed';
  };

  const translateArea = (a: string) => {
    if (a.includes('Center')) return lang === 'th' ? 'สะเตงกลาง (เขตเมือง)' : 'Sateng Center';
    if (a.includes('Nok')) return lang === 'th' ? 'สะเตงนอก' : 'Sateng Nok';
    if (a.includes('Sap')) return lang === 'th' ? 'ท่าสาป' : 'Tha Sap';
    return a;
  };

  // Returns color category for risk levels
  const getSeverityLabel = (sev: string) => {
    if (sev === 'high') return lang === 'th' ? 'เสี่ยงสูง (สีแดง)' : 'High Risk (Red)';
    if (sev === 'medium') return lang === 'th' ? 'เสี่ยงปานกลาง (สีเหลือง)' : 'Medium Risk (Yellow)';
    return lang === 'th' ? 'เฝ้าระวัง (สีเขียว)' : 'Low Risk (Green)';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950" id="map_system_fullbleed">
      
      {/* Map Control Top Bar (Left overlay sidebar look) */}
      <div className="flex border-b border-slate-800 bg-slate-900/95 backdrop-blur-md p-3.5 gap-3 justify-between items-center z-10 shrink-0">
        <div className="flex items-center space-x-3.5">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <MapIcon size={16} />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-100 text-xs uppercase tracking-tight flex items-center space-x-2">
              <span>{lang === 'th' ? 'ระบบภูมิสารสนเทศภัยพิบัติและโรคระบาด GIS เทศบาลยะลา' : 'Yala GIS Epidemic Disaster Portal'}</span>
            </h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              {lang === 'th' ? 'ระบุรัศมีความเสี่ยงทางสถิติตามพิกัดจีพีเอส ดึงพฤติการณ์รายงานแบบเรียลไทม์' : 'Interactive Map panning, multi-level vectors, and localized outbreak circles'}
            </p>
          </div>
        </div>

        {/* Map Switcher (Citizen vs Official Map) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveMapRole('public')}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeMapRole === 'public'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <EyeOff size={11} />
            <span>{lang === 'th' ? 'ประชาชน' : 'Public Map'}</span>
          </button>
          <button
            onClick={() => setActiveMapRole('official')}
            type="button"
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
              activeMapRole === 'official'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <ShieldCheck size={11} />
            <span>{lang === 'th' ? 'เจ้าหน้าที่' : 'Official Map'}</span>
          </button>
        </div>
      </div>

      {/* Fully Draggable & Pannable Map Container */}
      <div 
        className="relative flex-1 w-full bg-slate-950 overflow-hidden select-none animate-fade-in" 
        id="gis_map_canvas_container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Vector SVG layers */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="gis_grid" width="45" height="45" patternUnits="userSpaceOnUse">
              <path d="M 45 0 L 0 0 0 45" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" />
            </pattern>
            <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          
          {/* Flat deep dark matrix background */}
          <rect width="100%" height="100%" fill="#070a12" />
          <rect width="100%" height="100%" fill="url(#gis_grid)" />

          {/* DRAGGABLE & ZOOMABLE GRAPHICS LAYER */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: 'center center' }}>
            
            {/* Municipal Outline Boundary (Polygon) */}
            <path 
              d={getPathD(borderCoords)} 
              fill="rgba(14, 165, 233, 0.05)" 
              stroke="#0ea5e9" 
              strokeWidth="2.5" 
              strokeDasharray="6,4"
              opacity="0.8"
            />

            {/* Geographical labels */}
            <text x="360" y="240" fill="rgba(14, 165, 233, 0.22)" fontSize="11" className="font-sans font-black uppercase tracking-widest pointer-events-none">
              {lang === 'th' ? 'เขตเทศบาลนครยะลา (GIS)' : 'YALA MUNICIPALITY BOUNDS'}
            </text>
            <text x="120" y="370" fill="rgba(16, 185, 129, 0.16)" fontSize="9" className="font-sans font-extrabold uppercase tracking-widest pointer-events-none">
              {lang === 'th' ? 'ตำบลท่าสาป (เวกเตอร์)' : 'THA SAP DISTRICT SECTOR'}
            </text>

            {/* Pattani River */}
            <path 
              d={getPathD(riverCoords)} 
              fill="none" 
              stroke="url(#riverGrad)" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity="0.85"
            />
            <text x="210" y="260" fill="#0284c7" fontSize="8" className="font-sans italic font-extrabold opacity-70 tracking-wider pointer-events-none">
              {lang === 'th' ? 'แม่น้ำปัตตานี' : 'Pattani River'}
            </text>

            {/* Canals */}
            <path d={getPathD(bamawCoords)} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            <path d={getPathD(weluwanCoords)} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" opacity="0.75" />

            {/* Landmark Markers */}
            <g transform="translate(420, 210)" className="opacity-75">
              <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#ef4444" />
              <path d="M 0,-5 L 0,5 M -5,0 L 5,0" stroke="#fff" strokeWidth="2" />
              <text x="12" y="3" fill="rgba(255,255,255,0.7)" fontSize="7" className="font-sans font-black uppercase tracking-wider pointer-events-none">Hospital</text>
            </g>

            {/* 1. Outbreak Circles (Radar radius based on disease strength) */}
            {cases.map((c) => {
              const { x, y } = getXY(c.gps.lat, c.gps.lng);
              
              const circleColor = 
                c.severity === 'high' ? 'rgba(239, 68, 68, 0.12)' : 
                c.severity === 'medium' ? 'rgba(234, 179, 8, 0.12)' : 
                'rgba(16, 185, 129, 0.12)';

              const strokeColor = 
                c.severity === 'high' ? 'rgba(239, 68, 68, 0.5)' : 
                c.severity === 'medium' ? 'rgba(234, 179, 8, 0.5)' : 
                'rgba(16, 185, 129, 0.5)';

              // Calculate custom contagion radius size based on epidemiologic metadata
              const diseaseLower = c.disease.toLowerCase();
              let radiusSize = 25;
              if (diseaseLower.includes('dengue') || diseaseLower.includes('ไข้เลือดออก')) radiusSize = 35;
              else if (diseaseLower.includes('covid') || diseaseLower.includes('โควิด')) radiusSize = 50;
              else if (diseaseLower.includes('mouth') || diseaseLower.includes('มือ เท้า ปาก')) radiusSize = 20;
              else if (diseaseLower.includes('flu') || diseaseLower.includes('ไข้หวัดใหญ่')) radiusSize = 40;
              else if (diseaseLower.includes('leptospirosis') || diseaseLower.includes('ฉี่หนู')) radiusSize = 60;
              else if (diseaseLower.includes('cholera') || diseaseLower.includes('อหิวา')) radiusSize = 50;

              const isSelected = selectedPin?.id === c.id;

              return (
                <circle 
                  key={`circle_${c.id}`}
                  cx={x} 
                  cy={y} 
                  r={radiusSize} 
                  fill={circleColor} 
                  stroke={strokeColor} 
                  strokeWidth={isSelected ? '2' : '1'} 
                  strokeDasharray="4,4"
                  className="pointer-events-none transition-all duration-150"
                />
              );
            })}

            {/* 2. Disease Isolation Pins (Fully stable and centered) */}
            {cases.map((c) => {
              const { x, y } = getXY(c.gps.lat, c.gps.lng);
              const isSelected = selectedPin?.id === c.id;

              const pinColor = 
                c.severity === 'high' ? '#f43f5e' : 
                c.severity === 'medium' ? '#fbbf24' : 
                '#10b981';

              return (
                <g 
                  key={`node_${c.id}`} 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinClick(c);
                  }}
                >
                  {/* Stable pulse overlay */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="15" 
                    fill="none" 
                    stroke={pinColor} 
                    strokeWidth="1.5" 
                    opacity="0.65"
                    className="animate-pulse"
                  />

                  {/* Core Pin Anchor */}
                  <circle 
                    cx={x} 
                    cy={y} 
                    r={isSelected ? '9' : '6.5'} 
                    fill={pinColor} 
                    stroke="#ffffff" 
                    strokeWidth="2" 
                    className="transition-all duration-150"
                  />

                  {/* Hover visual tag */}
                  <g className="opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                    <rect x={x + 10} y={y - 18} width="110" height="20" rx="4" fill="#0b0f19" stroke="#334155" strokeWidth="1" />
                    <text x={x + 16} y={y - 5} fill="#ffffff" fontSize="8" className="font-bold">
                      {translateDisease(c.disease)}
                    </text>
                  </g>
                </g>
              );
            })}

          </g>
        </svg>

        {/* Floating Instruction Overlay (Guide users how to drag & zoom) */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg flex items-center space-x-2 text-[10px] text-slate-300 font-extrabold shadow-lg">
          <Move size={12} className="text-blue-500" />
          <span>{lang === 'th' ? 'คลิกลากเมาส์ / ใช้นิ้วเลื่อนแผนที่ได้อย่างอิสระ' : 'Click & Drag to pan map, zoom via controls'}</span>
        </div>

        {/* Floating Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-1.5 z-10">
          <button 
            onClick={zoomIn} 
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition shadow-lg"
            title="Zoom In"
            type="button"
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={zoomOut} 
            className="w-8 h-8 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-lg flex items-center justify-center cursor-pointer transition shadow-lg"
            title="Zoom Out"
            type="button"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={resetView} 
            className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer transition shadow-lg"
            title="Reset View"
            type="button"
          >
            Reset
          </button>
        </div>

        {/* Float Connection Indicator */}
        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg flex items-center space-x-2 text-[9px] text-slate-300 font-bold tracking-wider uppercase font-mono shadow-md">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <span>{lang === 'th' ? `ตรวจพิกัดเฝ้าระวังสีผิวในยะลา ${cases.length} จุด` : `DETECTING ${cases.length} CONTAGIOUS SITES`}</span>
        </div>

      </div>

      {/* Node Click Context popover drawer */}
      {selectedPin && (
        <div className="p-5 bg-slate-900 border-t border-slate-800 animate-fade-in shrink-0 text-slate-300" id="map_node_details_panel">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
            
            {/* Left side info */}
            <div className="space-y-3 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                  selectedPin.severity === 'high' ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                  selectedPin.severity === 'medium' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                  'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}>
                  {translateDisease(selectedPin.disease)}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-black px-2 py-1 rounded-md uppercase tracking-wider font-mono">
                  {getSeverityLabel(selectedPin.severity)}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
                  GPS: {selectedPin.gps.lat.toFixed(5)}, {selectedPin.gps.lng.toFixed(5)} ({translateArea(selectedPin.areaName)})
                </span>
              </div>

              {activeMapRole === 'official' ? (
                /* OFFICIAL VIEW: Show Personal Info & Ingestion Data (LINE Chatbot details) */
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="font-extrabold text-slate-100 flex items-center space-x-2 text-xs uppercase tracking-tight pt-1">
                    <User size={14} className="text-blue-400" />
                    <span>
                      {lang === 'th' ? `ประวัติแบบเจาะลึกผู้ป่วย (ข้อมูลรายงานพิกัดระบาดวิทยา)` : `Epidemiological Patient Clinical Parameters`}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
                    <div className="space-y-1.5 text-slate-300">
                      <div className="font-extrabold text-blue-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <User size={12} />
                        <span>{lang === 'th' ? 'ข้อมูลส่วนบุคคลของผู้ป่วย' : 'Demographics Profile'}</span>
                      </div>
                      <div><strong>{lang === 'th' ? 'ชื่อ-นามสกุล:' : 'Full Name:'}</strong> {selectedPin.personalInfo?.name || 'N/A'}</div>
                      <div><strong>{lang === 'th' ? 'อายุ:' : 'Age:'}</strong> {selectedPin.personalInfo?.age || 'N/A'} {lang === 'th' ? 'ปี' : 'years old'}</div>
                      <div><strong>{lang === 'th' ? 'เพศ:' : 'Gender:'}</strong> {selectedPin.personalInfo?.gender === 'Male' ? (lang === 'th' ? 'ชาย' : 'Male') : (lang === 'th' ? 'หญิง' : 'Female')}</div>
                      <div><strong>{lang === 'th' ? 'เบอร์ติดต่อ:' : 'Phone Contact:'}</strong> {selectedPin.personalInfo?.phone || 'N/A'}</div>
                      <div><strong>{lang === 'th' ? 'ความต้องการช่วยเหลือ:' : 'Special Demands:'}</strong> {selectedPin.personalInfo?.demands || (lang === 'th' ? 'ไม่มีความต้องการพิเศษ' : 'None')}</div>
                    </div>

                    <div className="space-y-1.5 text-slate-300">
                      <div className="font-extrabold text-rose-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <FileText size={12} />
                        <span>{lang === 'th' ? 'ข้อมูลทางคลินิกและการสัมผัสโรค' : 'Clinical Diagnosis'}</span>
                      </div>
                      <div><strong>{lang === 'th' ? 'อาการสำคัญ:' : 'Chief Symptoms:'}</strong> {selectedPin.clinicalInfo?.symptoms?.join(', ') || '-'}</div>
                      <div><strong>{lang === 'th' ? 'จำนวนวันป่วย:' : 'Duration of Illness:'}</strong> {selectedPin.clinicalInfo?.days || '3'} {lang === 'th' ? 'วัน' : 'days'}</div>
                      <div><strong>{lang === 'th' ? 'ประวัติสัมผัสโรค/สถานที่:' : 'Contact History:'}</strong> {selectedPin.clinicalInfo?.contactHistory || '-'}</div>
                      <div><strong>{lang === 'th' ? 'ระดับความด่วน:' : 'Clinical Urgency:'}</strong> <span className="text-rose-400 font-bold uppercase">{selectedPin.priorityTh || selectedPin.priority || 'NORMAL'}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                /* PUBLIC VIEW: All identification data (PII) is completely hidden. Tells how many people and color risk */
                <div className="space-y-3">
                  <div className="p-4 bg-blue-950/50 border border-blue-900/60 rounded-xl space-y-2 max-w-2xl text-slate-300">
                    <div className="flex items-start space-x-1.5 text-blue-200 font-black uppercase tracking-wider text-[10px]">
                      <ShieldCheck size={14} className="flex-shrink-0 text-blue-400 mt-0.5" />
                      <span>{lang === 'th' ? 'ประกาศมาตรการความปลอดภัยข้อมูลสุขภาพบุคคล (PDPA Compliance)' : 'Confidential Sanitary Compliance'}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-semibold">
                      {lang === 'th' 
                        ? 'ทางส่วนเทศบาลนครยะลาได้ปิดบังชื่อ เบอร์โทร และรายละเอียดที่ระบุตัวตนได้จริงของผู้ป่วยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล แผนที่เฝ้าระวังระบาดนี้แสดงเฉพาะจุดวงกลมรัศมีความเสี่ยงเพื่อเตือนผู้สัญจรผ่านจุดปนเปื้อนเท่านั้น' 
                        : 'To protect personal privacy (PDPA), all names and telephone details are strictly hidden for public citizens. Outbreak bounds are displayed purely to guide commuters away from contamination sites.'}
                    </p>
                  </div>

                  {/* Displaying general counts only: "สีอะไร กี่คน" */}
                  <div className="grid grid-cols-2 gap-4 max-w-md pt-1 text-slate-200">
                    <div className="bg-slate-900 p-3 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{lang === 'th' ? 'ระดับความเสี่ยง' : 'Risk Index'}</span>
                      <span className="text-xs font-black flex items-center gap-1.5 mt-1">
                        <span className={`w-3 h-3 rounded-full ${selectedPin.severity === 'high' ? 'bg-red-500' : selectedPin.severity === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                        {getSeverityLabel(selectedPin.severity)}
                      </span>
                    </div>
                    <div className="bg-slate-900 p-3 border border-slate-800 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{lang === 'th' ? 'จำนวนผู้ติดโรคพิกัดนี้' : 'Active Cases Count'}</span>
                      <span className="text-sm font-black text-slate-100 mt-1 block">
                        1 {lang === 'th' ? 'ราย' : 'active case'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Case Workflow Actions (Officials Only) */}
            <div className="flex flex-col items-end gap-2.5 flex-shrink-0 self-stretch justify-between">
              {activeMapRole === 'official' && onStatusUpdate ? (
                <div className="space-y-2 text-right">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider mb-1">
                    {lang === 'th' ? 'เครื่องมืออัพเดทสถานะกักกันผู้ป่วย (Official Controls):' : 'Official Containment Workflow:'}
                  </span>
                  
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    {/* Status Badge */}
                    <span className="text-[10px] bg-slate-800 text-slate-200 font-mono font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {translateStatus(selectedPin.status)}
                    </span>

                    {/* Step 1: Accept / Quarantine */}
                    {selectedPin.status === 'New' && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Accepted')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-amber-500 hover:bg-amber-600 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Accepted` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'รับกักกันโรค' : 'Admit & Quarantine'}</span>
                        )}
                      </button>
                    )}

                    {/* Step 2: Wait results */}
                    {(selectedPin.status === 'New' || selectedPin.status === 'Accepted') && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Waiting')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Waiting` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'รอผลตรวจ' : 'Await Test Results'}</span>
                        )}
                      </button>
                    )}

                    {/* Step 3: Complete / Archive */}
                    {selectedPin.status !== 'Completed' && (
                      <button
                        onClick={() => handleStatusChange(selectedPin.id, 'Completed')}
                        disabled={Boolean(actionLoading)}
                        type="button"
                        className="bg-green-600 hover:bg-green-700 text-white font-black px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `${selectedPin.id}_Completed` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <span>{lang === 'th' ? 'พ้นระยะโรคแล้ว' : 'Complete Mission'}</span>
                        )}
                      </button>
                    )}
                  </div>

                  {selectedPin.status === 'Completed' && (
                    <p className="text-[10px] text-green-400 font-extrabold italic mt-1 bg-green-950/40 border border-green-900/60 p-2 rounded">
                      {lang === 'th' ? '✓ บันทึกเคสผู้ป่วยนี้พ้นระยะติดต่อและเก็บสถิติเรียบร้อย' 
                                    : '✓ Case compiled and closed in GIS system.'}
                    </p>
                  )}
                </div>
              ) : (
                activeMapRole === 'official' && (
                  <div className="text-[10px] text-slate-500 font-bold bg-slate-800 p-2 rounded">
                    {lang === 'th' ? 'ติดต่อแอดมินสาธารณสุขเพื่อปรับปรุงสถานะ' : 'Updates managed via Municipal Admins'}
                  </div>
                )
              )}

              {/* Close pin detail trigger */}
              <button
                onClick={() => setSelectedPin(null)}
                className="text-blue-400 hover:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition pt-4"
                type="button"
              >
                {lang === 'th' ? '✕ ปิดแผงข้อมูล' : '✕ Close Detail Panel'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState } from 'react';
import { Play, SkipForward, ArrowRight, ArrowLeft, CheckCircle, HelpCircle, Shield, Award, MapPin, TrendingUp, BookOpen } from 'lucide-react';
import YalaEpidemicLogo from './YalaEpidemicLogo';

interface UserTutorialProps {
  lang: 'th' | 'en';
  onClose: () => void;
}

export default function UserTutorial({ lang, onClose }: UserTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      titleTh: 'ยินดีต้อนรับสู่พอร์ทัล Yala Epidemic Surveillance Portal',
      titleEn: 'Welcome to Yala Epidemic Surveillance Portal',
      descriptionTh: 'ยินดีต้อนรับเข้าสู่ระบบเฝ้าระวังและรับมือโรคระบาดอัจฉริยะแบบ GIS สำหรับเทศบาลนครยะลา ระบบนี้รวบรวมข้อมูลสาธารณสุขและประสานงานกู้ภัยอย่างเป็นส่วนตัวและแม่นยำ',
      descriptionEn: 'Welcome to the GIS-based epidemic surveillance portal for Yala City Municipality. This portal provides sanitary monitoring, live alerts, and official coordinate tracking.',
      icon: <YalaEpidemicLogo size={70} />,
      highlightId: 'left_sidebar'
    },
    {
      titleTh: 'หน้าหลัก: แผงควบคุมและแถบข่าวด่วน (Marquee)',
      titleEn: 'Home: Dashboard & Breaking News Ticker',
      descriptionTh: 'หน้าหลักแสดงสถิติสรุปภาพรวมทั้งหมด มีแถบข่าวด่วน (Marquee Ticker) วิ่งแจ้งเตือนข่าวด่วนของวันนั้นๆ โดยดึงข้อมูลมาจากระบบแจ้งเตือนโดยตรงเพื่อแจ้งเหตุรวดเร็ว',
      descriptionEn: 'The homepage displays consolidated epidemic analytics and features a marquee breaking news ticker synced directly from active bell alerts.',
      icon: <Shield size={48} className="text-blue-500" />,
      highlightId: 'marquee_news_ticker'
    },
    {
      titleTh: 'แผนที่ระบาดวิทยา GIS และข้อมูลจากไลน์บอท',
      titleEn: 'GIS Map: Double Maps & Line Chatbot',
      descriptionTh: 'แผนที่ใช้ระบบ GIS แยกแผนที่สาธารณะ (ปกปิดข้อมูลผู้ป่วย) และแผนที่เจ้าหน้าที่ (รู้พิกัดและรายละเอียดทั้งหมด มีปุ่ม "รับผู้ป่วย ➔ รอผลตรวจ ➔ เสร็จภารกิจ" เพื่อความปลอดภัยระดับสูงสุด)',
      descriptionEn: 'Features separate Public (anonymized summary) and Official GIS Maps (PII-enabled with Patient Admission workflows: Accept ➔ Wait Results ➔ Complete). Data is ingested directly from the LINE Chatbot reports.',
      icon: <MapPin size={48} className="text-rose-500 animate-bounce" />,
      highlightId: 'gis_map_canvas_container'
    },
    {
      titleTh: 'สถิติรายงานและการวิเคราะห์โรคระบาด',
      titleEn: 'Statistics & Dynamic Disease Selection',
      descriptionTh: 'วิเคราะห์อัตราส่วนผู้ป่วยตาม เพศ อายุ และช่วงเวลาได้อย่างสะดวกผ่านตัวเลือกชนิดโรคที่ปรับปรุงใหม่ (แก้ไขบัคให้คลิกเลือกเปลี่ยนโรคได้อย่างเสถียร 100%)',
      descriptionEn: 'Explore demographic proportions, age bands, and disease curves with the revamped interactive select menu (fixing the selection bug to work seamlessly on all devices).',
      icon: <TrendingUp size={48} className="text-emerald-500" />,
      highlightId: 'stats_dashboard_section'
    },
    {
      titleTh: 'คู่มือการป้องกันและคลังความรู้แบบรวมศูนย์',
      titleEn: 'Unified Prevention & Surveillance Intelligence',
      descriptionTh: 'รวบรวมระบบ "คู่มือป้องกันโรคระบาด" และ "คลังสมองเฝ้าระวังภัย" เข้าไว้เป็นหน้าเดียว เพื่อให้ทั้งชาวนครยะลาและบุคลากรทางการแพทย์สามารถศึกษาวิธีดูแลตนเอง ค้นหาสารเคมีป้องกัน และวิธีปฐมพยาบาลในที่เดียว',
      descriptionEn: 'Combines the Prevention Guidelines and Surveillance Brain Bank (Disease Intelligence) into a single unified directory for instant lookup of protection tips, symptoms, and sanitation protocols.',
      icon: <BookOpen size={48} className="text-purple-500" />,
      highlightId: 'prevention_guides_section'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('surveillance_tutorial_completed', 'true');
    onClose();
  };

  const activeStep = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="user_tutorial_overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-fade-in flex flex-col">
        {/* Top visual accent */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
              {lang === 'th' ? 'แนะนำการใช้งานระบบเบื้องต้น' : 'Interactive System Walkthrough'}
            </h4>
          </div>
          <button 
            onClick={handleComplete}
            className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 bg-slate-800 px-2 py-1 rounded transition uppercase cursor-pointer"
            type="button"
          >
            <SkipForward size={12} />
            <span>{lang === 'th' ? 'ข้ามสอน' : 'Skip Tour'}</span>
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4 flex-1">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center shadow-2xs h-24 w-24">
            {activeStep.icon}
          </div>

          <div className="space-y-2">
            <h3 className="font-extrabold text-slate-900 text-base md:text-lg leading-tight tracking-tight">
              {lang === 'th' ? activeStep.titleTh : activeStep.titleEn}
            </h3>
            <p className="text-slate-600 text-xs md:text-sm font-semibold leading-relaxed max-w-sm mx-auto">
              {lang === 'th' ? activeStep.descriptionTh : activeStep.descriptionEn}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center space-x-2 pt-2">
            {steps.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`text-slate-600 hover:text-slate-950 text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-lg transition border border-slate-200 bg-white ${
              currentStep === 0 ? 'opacity-30 pointer-events-none' : 'cursor-pointer'
            }`}
            type="button"
          >
            <ArrowLeft size={14} />
            <span>{lang === 'th' ? 'ย้อนกลับ' : 'Back'}</span>
          </button>

          <button
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-lg transition shadow-md shadow-blue-500/15 cursor-pointer uppercase tracking-wider"
            type="button"
          >
            <span>{currentStep === steps.length - 1 ? (lang === 'th' ? 'เสร็จสิ้น' : 'Finish') : (lang === 'th' ? 'ถัดไป' : 'Next')}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

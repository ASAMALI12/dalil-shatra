import React from 'react';
import { PhoneCall, Shield, Flame, HeartPulse, Zap, Building2, Phone } from 'lucide-react';

interface DistrictEmergencySectionProps {
  districtName: string;
  governorateName: string;
}

export const DistrictEmergencySection: React.FC<DistrictEmergencySectionProps> = ({
  districtName,
  governorateName,
}) => {
  const displayDistrict = districtName && districtName !== 'all' ? districtName : governorateName;

  const emergencyContacts = [
    {
      id: 'police',
      title: `شرطة نجدة ${displayDistrict}`,
      number: '104',
      desc: 'دوريات النجدة والأمن السريع على مدار 24 ساعة',
      icon: '🚓',
      bgColor: 'bg-rose-50 hover:bg-rose-100/90 text-rose-900 border-rose-200',
      badgeColor: 'bg-rose-600 text-white',
      tel: 'tel:104',
    },
    {
      id: 'fire',
      title: `الدفاع المدني والإطفاء`,
      number: '115',
      desc: `مركز إطفاء وإنقاذ ${displayDistrict}`,
      icon: '🚒',
      bgColor: 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-200',
      badgeColor: 'bg-amber-600 text-white',
      tel: 'tel:115',
    },
    {
      id: 'ambulance',
      title: `الإسعاف الفوري وطوارئ المستشفى`,
      number: '122',
      desc: `طوارئ وإسعاف مستشفيات ${displayDistrict}`,
      icon: '🚑',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      tel: 'tel:122',
    },
    {
      id: 'security',
      title: 'جهاز الأمن الوطني العراقي',
      number: '131',
      desc: 'الخط الساخن للأمن ومكافحة التهديدات',
      icon: '🛡️',
      bgColor: 'bg-sky-50 hover:bg-sky-100/90 text-sky-900 border-sky-200',
      badgeColor: 'bg-sky-600 text-white',
      tel: 'tel:131',
    },
    {
      id: 'electric',
      title: `طوارئ وصيانة الكهرباء`,
      number: '159',
      desc: `صيانة شبكة وأعطال كهرباء ${displayDistrict}`,
      icon: '⚡',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100/90 text-yellow-900 border-yellow-200',
      badgeColor: 'bg-amber-500 text-white',
      tel: 'tel:159',
    },
    {
      id: 'municipality',
      title: `شكاوى واستعلامات البلدية والخدمات`,
      number: '5666',
      desc: `استعلامات وبلدية ${displayDistrict}`,
      icon: '🏢',
      bgColor: 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200',
      badgeColor: 'bg-slate-800 text-white',
      tel: 'tel:5666',
    },
  ];

  return (
    <div className="rounded-3xl border-2 border-rose-200/80 bg-white p-4 sm:p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-rose-100 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-600/20 text-xl flex-shrink-0">
            🚨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm sm:text-base font-black text-slate-900">
                أرقام الطوارئ والخدمات في {displayDistrict}
              </h3>
              <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-800">
                مباشر 24/7
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              اتصال فوري ومجاني بخطوط النجدة والإسعاف والإطفاء لخدمة أهالي {displayDistrict} ({governorateName})
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {emergencyContacts.map((contact) => (
          <a
            key={contact.id}
            href={contact.tel}
            className={`flex items-center justify-between p-3 rounded-2xl border transition-all active:scale-98 cursor-pointer shadow-2xs ${contact.bgColor}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl flex-shrink-0">{contact.icon}</span>
              <div className="min-w-0">
                <div className="font-display text-xs font-black text-slate-900 truncate">
                  {contact.title}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {contact.desc}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0 mr-2">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shadow-2xs flex items-center gap-1 ${contact.badgeColor}`}>
                <Phone className="h-3 w-3" />
                <span>{contact.number}</span>
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Footer Info */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-2.5 text-center text-[11px] text-slate-600 font-medium">
        💡 جميع خطوط الطوارئ أعلاه مركزية وتوجه الاتصال تلقائياً إلى أقرب مركز شرطة وإسعاف وإطفاء داخل <strong>{displayDistrict}</strong>.
      </div>
    </div>
  );
};

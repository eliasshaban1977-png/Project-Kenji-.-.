import React, { useState, useMemo } from 'react';
import { QURAN_REFERENCES } from '../data/quranReferences';
import { cartographyBases, calculateTerminatorBarrier } from '../utils/solarEngine';
import { Target, Compass, Globe, Sparkles, Navigation, Sun, Moon, ArrowRight } from 'lucide-react';

interface QuranReferenceSectionProps {
  onHighlightNode: (nodeId: string | null) => void;
  highlightedNodeId: string | null;
  onSelectBase?: (lat: number, lng: number, baseName: string) => void;
  dayOfYear?: number;
}

export const QuranReferenceSection: React.FC<QuranReferenceSectionProps> = ({
  onHighlightNode,
  highlightedNodeId,
  onSelectBase,
  dayOfYear = 79,
}) => {
  const [showArabic, setShowArabic] = useState(true);
  const [activeBaseId, setActiveBaseId] = useState<string>('base_1');

  // Compute live dawn/dusk barrier alignment across the 4 bases
  const barrierAlignments = useMemo(() => {
    return calculateTerminatorBarrier(Date.now(), dayOfYear);
  }, [dayOfYear]);

  return (
    <div className="quran-reference-section w-full my-6 text-left space-y-4">
      {/* Quranic Reference Overlay Card (Surah Al-Baqarah 2:260) */}
      <div
        id="quran-reference"
        className="card bg-[#0b0f0e] border-2 border-[#b87333] rounded p-4 text-left shadow-[0_0_15px_rgba(184,115,51,0.25)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ffaa]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a2a2a] pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#00ffaa]" />
            <h3 className="text-base font-bold font-mono tracking-wide text-[#ffaa00]">
              Surah Al-Baqarah (2:260)
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-[#14231c] text-[#00ffaa] border border-[#00ffaa]/40 rounded">
            4 DISTANT PEAKS & GEODESIC ANCHORS
          </span>
        </div>

        {/* Verse Arabic & English Citation */}
        <div className="space-y-2 mb-4">
          {showArabic && (
            <p
              className="text-right text-[#00ffaa] text-lg leading-relaxed font-serif"
              style={{ fontFamily: "'Amiri', serif", direction: 'rtl' }}
            >
              وَإِذْ قَالَ إِبْرَٰهِـۧمُ رَبِّ أَرِنِى كَيْفَ تُحْىِ ٱلْمَوْتَىٰ ۖ قَالَ أَوَلَمْ تُؤْمِن ۖ قَالَ بَلَىٰ وَلَـٰكِن لِّيَطْمَئِنَّ قَلْبِى ۖ قَالَ فَخُذْ أَرْبَعَةًۭ مِّنَ ٱلطَّيْرِ فَصُرْهُنَّ إِلَيْكَ ثُمَّ ٱجْعَلْ عَلَىٰ كُلِّ جَبَلٍۢ مِّنْهُنَّ جُزْءًۭا ثُمَّ ٱدْعُهُنَّ يَأْتِينَكَ سَعْيًۭا ۚ وَٱعْلَمْ أَنَّ ٱللَّهَ عَزِيزٌ حَكِيمٌ
            </p>
          )}
          <p className="text-gray-200 text-sm italic font-serif leading-relaxed bg-[#111614] border-l-2 border-[#00ffaa] p-3 rounded-r">
            "My Lord, show me how You give life to the dead... Take four birds and incline them to yourself. Then put on each hill a portion of them; then call them—they will come to you in haste."
          </p>
          <div className="text-[11px] font-mono text-gray-400">
            * Established divine cartography: 4 distant hills/peaks as calculation bases for global dawn and dusk barrier tracking, radiating from the central sanctuary of the Ka'aba.
          </div>
        </div>

        {/* The 4 Global Geographic Coordinates (Bases) Configuration */}
        <div className="mt-4 pt-3 border-t border-[#222]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold font-mono text-[#00ffaa] uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={14} />
              <span>The 4 Global Calculation Bases (Terminator Barrier Tracking)</span>
            </h4>
            <span className="text-[9px] font-mono text-gray-400">
              Live Sun Elevation & Horizon Aligned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {barrierAlignments.map((alignment) => {
              const base = alignment.base;
              const isCurrent = activeBaseId === base.id;
              const statusColor =
                alignment.status === 'DAYLIGHT'
                  ? 'text-[#ffff00] border-[#ffff00]/50'
                  : alignment.status === 'DAWN'
                  ? 'text-[#ffaa00] border-[#ffaa00]/50'
                  : alignment.status === 'DUSK'
                  ? 'text-[#cc88ff] border-[#cc88ff]/50'
                  : 'text-[#88ccff] border-[#88ccff]/50';

              return (
                <div
                  key={base.id}
                  onClick={() => {
                    setActiveBaseId(base.id);
                    onSelectBase?.(base.lat, base.lng, base.name);
                  }}
                  className={`p-2.5 rounded border transition-all cursor-pointer font-mono text-[10px] ${
                    isCurrent
                      ? 'bg-[#18261e] border-[#00ffaa] shadow-[0_0_10px_rgba(0,255,170,0.2)]'
                      : 'bg-[#111] border-[#333] hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-[11px] truncate" title={base.name}>
                      {base.name.split(':')[0]}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${statusColor}`}>
                      {alignment.status}
                    </span>
                  </div>

                  <div className="text-[#00ffaa] text-[10px] font-semibold truncate mb-1">
                    {base.name.split(':')[1]?.trim() || base.name}
                  </div>

                  <div className="text-gray-400 space-y-0.5 text-[9px] mb-2">
                    <div>
                      Coords: <strong className="text-white">{base.lat.toFixed(4)}°, {base.lng.toFixed(4)}°</strong>
                    </div>
                    <div>
                      Solar Alt: <strong className={alignment.solarAltitudeDeg >= 0 ? 'text-[#ffff00]' : 'text-gray-300'}>
                        {alignment.solarAltitudeDeg.toFixed(1)}°
                      </strong>
                    </div>
                    <div>
                      To Ka'aba: <strong className="text-[#88ccff]">{alignment.distanceToKaabaKm.toFixed(0)} km</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBaseId(base.id);
                      onSelectBase?.(base.lat, base.lng, base.name);
                    }}
                    className="w-full mt-1 py-1 px-2 bg-[#1a2f24] hover:bg-[#00ffaa] hover:text-black text-[#00ffaa] border border-[#00ffaa]/50 rounded text-[9px] font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span>ALIGN OBSERVER</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scriptural References Table Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold tracking-wider uppercase text-[#b87333] flex items-center gap-2">
          <Compass size={16} className="text-[#00ffaa]" />
          Scriptural References & Celestial Signs
        </h3>
        <button
          onClick={() => setShowArabic(!showArabic)}
          className="text-[10px] px-2 py-1 bg-[#111] hover:bg-[#222] text-[#00ffaa] border border-[#4a4a4a] rounded font-mono transition-colors"
        >
          {showArabic ? 'HIDE ARABIC SCRIPT' : 'SHOW ARABIC SCRIPT'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table
          className="quran-table w-full border-collapse bg-black border border-[#4a4a4a] text-[11px]"
          style={{ fontFamily: "'Courier New', monospace" }}
        >
          <thead>
            <tr className="bg-[#111]">
              <th className="w-[20%] text-[#00ffaa] border border-[#4a4a4a] p-2.5 text-left uppercase text-[10px] tracking-wider">
                Surah & Ayah
              </th>
              <th className="w-[25%] text-[#00ffaa] border border-[#4a4a4a] p-2.5 text-left uppercase text-[10px] tracking-wider">
                Cartographic Theme
              </th>
              <th className="w-[55%] text-[#00ffaa] border border-[#4a4a4a] p-2.5 text-left uppercase text-[10px] tracking-wider">
                Quranic Text & Standard Translation
              </th>
            </tr>
          </thead>
          <tbody>
            {QURAN_REFERENCES.map((item, idx) => {
              const isSelected = highlightedNodeId === item.associatedNodeId;
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-[#182818] border-l-4 border-l-[#ffff00]'
                      : idx % 2 === 0
                      ? 'bg-[#000]'
                      : 'bg-[#050505]'
                  } hover:bg-[#111611]`}
                >
                  <td className="ayah-ref border border-[#4a4a4a] p-2.5 text-[#b87333] font-bold align-top">
                    <div>{item.surah}</div>
                    <div className="text-gray-400 font-normal">({item.ayah})</div>
                    {item.associatedNodeId && (
                      <button
                        onClick={() =>
                          onHighlightNode(isSelected ? null : item.associatedNodeId!)
                        }
                        className={`mt-2 flex items-center gap-1 text-[9px] px-2 py-0.5 border rounded ${
                          isSelected
                            ? 'bg-[#ffff00] text-black border-[#ffff00] font-bold'
                            : 'bg-[#111] text-[#00ffaa] border-[#00ffaa]/50 hover:bg-[#00ffaa]/20'
                        }`}
                      >
                        <Target size={10} />
                        {isSelected ? 'LOCKED' : 'LOCATE'}
                      </button>
                    )}
                  </td>
                  <td className="border border-[#4a4a4a] p-2.5 text-[#d1d5db] align-top font-semibold">
                    {item.theme}
                  </td>
                  <td className="border border-[#4a4a4a] p-2.5 text-[#d1d5db] align-top">
                    {showArabic && item.arabicText && (
                      <div
                        className="text-right text-[#00ffaa] text-base mb-2 leading-relaxed"
                        style={{ fontFamily: "'Amiri', serif", direction: 'rtl' }}
                      >
                        {item.arabicText}
                      </div>
                    )}
                    <div className="italic text-[#88ccff] text-[10px] mb-1.5 leading-relaxed">
                      "{item.transliteration}"
                    </div>
                    <div className="text-gray-300 leading-relaxed">
                      "{item.translation}"
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { QURAN_REFERENCES } from '../data/quranReferences';
import { Target, Compass } from 'lucide-react';

interface QuranReferenceSectionProps {
  onHighlightNode: (nodeId: string | null) => void;
  highlightedNodeId: string | null;
}

export const QuranReferenceSection: React.FC<QuranReferenceSectionProps> = ({
  onHighlightNode,
  highlightedNodeId,
}) => {
  const [showArabic, setShowArabic] = useState(true);

  return (
    <div className="quran-reference-section w-full my-6 text-left">
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

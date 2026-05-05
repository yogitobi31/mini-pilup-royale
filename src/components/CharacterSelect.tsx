'use client';
import { useState } from 'react';
import { CHARACTERS } from '@/game/characters';
import { CharacterId } from '@/game/types';

function FallbackToken({ id, nameKo, motif, color }: { id: CharacterId; nameKo: string; motif: string; color: string }) {
  const short = nameKo.slice(0, 2);
  return (
    <div className={`token token-${id}`} style={{ ['--token-color' as string]: color }}>
      <div className='token-head'>• •</div>
      <div className='token-body'>{short}</div>
      <div className='token-motif'>{motif}</div>
    </div>
  );
}

export function CharacterSelect({ onStart }: { onStart: (id: CharacterId) => void }) {
  const [sel, setSel] = useState<CharacterId | undefined>();
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  return (
    <div className='screen select-screen'>
      <div className='screen-content'>
      <h1 className='menu-title'>필업 아레나: 마지막 종</h1>
      <p className='menu-subtitle'>Mini Pilup Royale · 캐릭터를 선택하세요</p>
      <div className='character-grid'>
        {CHARACTERS.map((c) => {
          const selected = sel === c.id;
          const imageBroken = broken[c.id];
          return (
            <button
              key={c.id}
              className={`character-card ${selected ? 'sel' : ''}`}
              onClick={() => setSel(c.id)}
              style={{ ['--card-color' as string]: c.fallbackColor }}
            >
              {!imageBroken ? (
                <img
                  src={c.portraitPath}
                  alt={c.nameEn}
                  className='portrait'
                  onError={() => setBroken((prev) => ({ ...prev, [c.id]: true }))}
                />
              ) : (
                <FallbackToken id={c.id} nameKo={c.nameKo} motif={c.motif} color={c.fallbackColor} />
              )}
              <b>{c.nameKo}</b>
              <small className='pill'>{c.role}</small>
              <small>{c.skillNameKorean}</small>
              <small className='tap-hint'>탭하여 선택</small>
            </button>
          );
        })}
      </div>
      <button className='start-btn' disabled={!sel} onClick={() => sel && onStart(sel)}>
        시작하기
      </button>
      </div>
    </div>
  );
}

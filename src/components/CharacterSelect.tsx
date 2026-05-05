'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function CharacterSelect({ onStart, onBack }: { onStart: (id: CharacterId) => void; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const wheelCooldown = useRef<number>(0);

  const selected = CHARACTERS[index];
  const imageBroken = broken[selected.id];

  const statView = useMemo(
    () => [
      { label: '속도', value: Math.min(5, Math.max(1, Math.round((selected.speed - 90) / 14))) },
      { label: '체력', value: Math.min(5, Math.max(1, Math.round((selected.maxHp - 95) / 12))) },
      { label: '집중력', value: Math.min(5, Math.max(1, Math.round((65 - selected.attackCooldown * 50) / 10))) },
      { label: '특수', value: Math.min(5, Math.max(1, Math.round((12 - selected.skillCooldown) / 1.5))) },
    ],
    [selected],
  );

  const goPrev = useCallback(() => setIndex((v) => (v - 1 + CHARACTERS.length) % CHARACTERS.length), []);
  const goNext = useCallback(() => setIndex((v) => (v + 1) % CHARACTERS.length), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStart(selected.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onBack, onStart, selected.id]);

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const now = performance.now();
    if (now - wheelCooldown.current < 180) return;
    wheelCooldown.current = now;
    if (event.deltaY > 0) goNext();
    if (event.deltaY < 0) goPrev();
  };

  return (
    <div className='screen select-screen game-screen' onWheel={onWheel}>
      <div className='screen-content character-select-layout'>
        <header className='screen-header'>
          <h1 className='menu-title'>필업 아레나: 마지막 종</h1>
          <p className='menu-subtitle'>Mini Pilup Royale · 캐릭터를 선택하세요</p>
        </header>

        <section
          className='selector-main'
          onTouchStart={(e) => setTouchStartX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            if (touchStartX == null) return;
            const delta = (e.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
            if (Math.abs(delta) > 44) {
              if (delta > 0) goPrev();
              else goNext();
            }
            setTouchStartX(null);
          }}
        >
          <button className='nav-btn prev' onClick={goPrev} aria-label='이전 캐릭터'>◀</button>

          <article className='focus-card' style={{ ['--card-color' as string]: selected.fallbackColor }}>
            {!imageBroken ? (
              <img
                src={selected.portraitPath}
                alt={selected.nameEn}
                className='focus-portrait'
                onError={() => setBroken((prev) => ({ ...prev, [selected.id]: true }))}
              />
            ) : (
              <FallbackToken id={selected.id} nameKo={selected.nameKo} motif={selected.motif} color={selected.fallbackColor} />
            )}
            <div className='focus-info'>
              <h2>{selected.nameKo}</h2>
              <p className='role'>{selected.role}</p>
              <p className='desc'>{selected.skillDescription}</p>
              <div className='stat-grid'>
                {statView.map((s) => (
                  <div key={s.label} className='stat-row'>
                    <span>{s.label}</span>
                    <i>
                      <b style={{ width: `${s.value * 20}%` }} />
                    </i>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <button className='nav-btn next' onClick={goNext} aria-label='다음 캐릭터'>▶</button>
        </section>

        <div className='thumbnail-row'>
          {CHARACTERS.map((c, idx) => (
            <button
              key={c.id}
              className={`thumb ${idx === index ? 'active' : ''}`}
              style={{ ['--thumb-color' as string]: c.fallbackColor }}
              onClick={() => setIndex(idx)}
              aria-label={c.nameKo}
            >
              <span>{c.nameKo.slice(0, 2)}</span>
            </button>
          ))}
        </div>

        <div className='select-actions'>
          <button className='ghost-btn' onClick={onBack}>타이틀로</button>
          <button className='start-btn' onClick={() => onStart(selected.id)}>이 캐릭터로 시작</button>
        </div>
      </div>
    </div>
  );
}

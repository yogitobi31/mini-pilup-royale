'use client';

import { useEffect, useState } from 'react';
import { CharacterId } from '@/game/types';
import { TitleScreen } from '@/components/TitleScreen';
import { CharacterSelect } from '@/components/CharacterSelect';
import { GameCanvas } from '@/components/GameCanvas';
import { ResultScreen } from '@/components/ResultScreen';

type GamePhase = 'title' | 'characterSelect' | 'playing' | 'gameOver';

export default function Page() {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [pick, setPick] = useState<CharacterId>('juwon');
  const [result, setResult] = useState<'victory' | 'defeat'>('defeat');
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    if (phase === 'playing') {
      document.body.classList.add('game-playing');
    } else {
      document.body.classList.remove('game-playing');
    }
    return () => document.body.classList.remove('game-playing');
  }, [phase]);

  if (phase === 'title') return <main className='app-shell phase-transition'><TitleScreen onStart={() => setPhase('characterSelect')} /></main>;
  if (phase === 'characterSelect') {
    return (
      <main className='app-shell phase-transition'>
        <CharacterSelect
          onBack={() => setPhase('title')}
          onStart={(id) => {
            setPick(id);
            setSeed((v) => v + 1);
            setPhase('playing');
          }}
        />
      </main>
    );
  }
  if (phase === 'playing') {
    return (
      <main className='app-shell'>
        <GameCanvas
          key={seed}
          character={pick}
          onResult={(r) => {
            setResult(r);
            setPhase('gameOver');
          }}
        />
      </main>
    );
  }
  return <main className='app-shell phase-transition'><ResultScreen result={result} onAgain={() => { setSeed((v) => v + 1); setPhase('playing'); }} onBack={() => setPhase('characterSelect')} /></main>;
}

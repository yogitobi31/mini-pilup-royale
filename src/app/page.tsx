'use client';
import { useEffect, useState } from 'react';
import { CharacterId } from '@/game/types';
import { TitleScreen } from '@/components/TitleScreen';
import { CharacterSelect } from '@/components/CharacterSelect';
import { GameCanvas } from '@/components/GameCanvas';
import { ResultScreen } from '@/components/ResultScreen';

type Phase='title'|'select'|'match'|'result';
export default function Page(){const [phase,setPhase]=useState<Phase>('title');const [pick,setPick]=useState<CharacterId>('juwon');const [result,setResult]=useState<'victory'|'defeat'>('defeat');const [seed,setSeed]=useState(0);
useEffect(()=>{if(phase==='match'){document.body.classList.add('game-playing');}else{document.body.classList.remove('game-playing');}return()=>document.body.classList.remove('game-playing');},[phase]);
if(phase==='title')return <main className='app-shell'><TitleScreen onStart={()=>setPhase('select')}/></main>;
if(phase==='select')return <main className='app-shell'><CharacterSelect onStart={(id)=>{setPick(id);setSeed(v=>v+1);setPhase('match')}}/></main>;
if(phase==='match')return <main className='app-shell'><GameCanvas key={seed} character={pick} onResult={(r)=>{setResult(r);setPhase('result')}}/></main>;
return <main className='app-shell'><ResultScreen result={result} onAgain={()=>{setSeed(v=>v+1);setPhase('match')}} onBack={()=>setPhase('select')}/></main>;
}

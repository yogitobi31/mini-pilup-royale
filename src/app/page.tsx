'use client';
import { useState } from 'react';
import { CharacterId } from '@/game/types';
import { TitleScreen } from '@/components/TitleScreen';
import { CharacterSelect } from '@/components/CharacterSelect';
import { GameCanvas } from '@/components/GameCanvas';
import { ResultScreen } from '@/components/ResultScreen';

type Phase='title'|'select'|'match'|'result';
export default function Page(){const [phase,setPhase]=useState<Phase>('title');const [pick,setPick]=useState<CharacterId>('juwon');const [result,setResult]=useState<'victory'|'defeat'>('defeat');const [seed,setSeed]=useState(0);
if(phase==='title')return <TitleScreen onStart={()=>setPhase('select')}/>;
if(phase==='select')return <CharacterSelect onStart={(id)=>{setPick(id);setSeed(v=>v+1);setPhase('match')}}/>;
if(phase==='match')return <GameCanvas key={seed} character={pick} onResult={(r)=>{setResult(r);setPhase('result')}}/>;
return <ResultScreen result={result} onAgain={()=>{setSeed(v=>v+1);setPhase('match')}} onBack={()=>setPhase('select')}/>;
}

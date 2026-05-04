'use client';
import { useState } from 'react';
import { CHARACTERS } from '@/game/characters';
import { CharacterId } from '@/game/types';
export function CharacterSelect({onStart}:{onStart:(id:CharacterId)=>void}){const [sel,setSel]=useState<CharacterId|undefined>();return <div className='screen'><h2>캐릭터 선택</h2><div className='grid'>{CHARACTERS.map(c=><div key={c.id} className={`card ${sel===c.id?'sel':''}`} onClick={()=>setSel(c.id)}><img src={c.portraitPath} alt={c.nameEn} onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}}/><div className='fallback' style={{background:c.fallbackColor}}>{c.motif}</div><b>{c.nameKo}</b><small>{c.role}</small><small>{c.skillNameKorean}</small></div>)}</div>{sel&&<button onClick={()=>onStart(sel)}>매치 시작</button>}</div>}

'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { byId, CHARACTERS } from '@/game/characters';
import { CharacterId, Fighter, GameState, InputState, Obstacle } from '@/game/types';

const W = 2400, H = 1600, viewW = 1000, viewH = 620;
const JOYSTICK_RADIUS = 46;
const obstacles: Obstacle[] = [
  { x: 980, y: 620, w: 460, h: 300, label: '운동장 중앙', color: '#caedc6', solid: false },
  { x: 200, y: 160, w: 300, h: 170, label: '교실 코너', color: '#dce9ff', solid: true },
  { x: 360, y: 350, w: 90, h: 42, label: '책상', color: '#b99d7f', solid: true },
  { x: 1900, y: 170, w: 250, h: 180, label: '편의점', color: '#ffe8b3', solid: true },
  { x: 1900, y: 390, w: 110, h: 60, label: '자판기', color: '#8fc8ff', solid: true },
  { x: 190, y: 1100, w: 320, h: 220, label: '옥수수밭', color: '#d8ef9d', solid: true },
  { x: 1760, y: 1110, w: 340, h: 220, label: '학원 복도', color: '#e7ddff', solid: true },
  { x: 1720, y: 1260, w: 170, h: 52, label: '벤치', color: '#8f7e65', solid: true },
];
const idIcon: Record<CharacterId, string> = { juwon: '🔔', kyungmin: '🎵', hyunjun: '❓', chanyoung: '🙂', hyowon: '🪤', dongha: '⚙️', heesun: '✏️', soeun: '🐞' };

function mkState(playerId: CharacterId): GameState { /* unchanged-ish */
  const ids = CHARACTERS.map((c) => c.id);
  const order = [playerId, ...ids.filter((i) => i !== playerId)];
  const fighters: Fighter[] = order.map((id, i) => ({ id: `f${i}`, charId: id, x: 280 + (i % 4) * 500, y: 250 + Math.floor(i / 4) * 670, vx: 0, vy: 0, radius: 22, hp: byId(id).maxHp, alive: true, isPlayer: i === 0, lastAttack: -99, lastSkill: -99, facing: { x: 1, y: 0 }, status: { slowUntil: 0, stunUntil: 0, confuseUntil: 0, defenseUntil: 0, shieldUntil: 0, panicUntil: 0, speedUntil: 0 } }));
  return { fighters, obstacles, safeZone: { x: W / 2, y: H / 2, radius: 920, minRadius: 170, shrinkPerSec: 3.6, tick: 0 }, projectiles: [], traps: [], devices: [], effects: [], time: 0, elapsed: 0, result: 'playing' };
}

export function GameCanvas({ character, onResult }: { character: CharacterId; onResult: (r: 'victory' | 'defeat') => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ up: false, down: false, left: false, right: false, moveX: 0, moveY: 0, attack: false, skill: false });
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickPointerId = useRef<number | null>(null);
  const [shake, setShake] = useState(0);
  const [hud, setHud] = useState({ hp: 0, max: 0, alive: 8, skill: 0, t: 0, out: false, name: '', icon: '' });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [thumb, setThumb] = useState({ x: 0, y: 0 });
  const [attackPressed, setAttackPressed] = useState(false);
  const [skillPressed, setSkillPressed] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(coarse || navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  }, []);

  const updateJoystick = (clientX: number, clientY: number) => {
    const stick = joystickRef.current;
    if (!stick) return;
    const rect = stick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const len = Math.hypot(dx, dy);
    const clamped = Math.min(len, JOYSTICK_RADIUS);
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    const tx = nx * clamped;
    const ty = ny * clamped;
    setThumb({ x: tx, y: ty });
    inputRef.current.moveX = nx * (clamped / JOYSTICK_RADIUS);
    inputRef.current.moveY = ny * (clamped / JOYSTICK_RADIUS);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (['w', 'ArrowUp'].includes(e.key)) inputRef.current.up = true; if (['s', 'ArrowDown'].includes(e.key)) inputRef.current.down = true; if (['a', 'ArrowLeft'].includes(e.key)) inputRef.current.left = true; if (['d', 'ArrowRight'].includes(e.key)) inputRef.current.right = true; if (e.key === ' ') inputRef.current.attack = true; if (e.key.toLowerCase() === 'e') inputRef.current.skill = true; };
    const up = (e: KeyboardEvent) => { if (['w', 'ArrowUp'].includes(e.key)) inputRef.current.up = false; if (['s', 'ArrowDown'].includes(e.key)) inputRef.current.down = false; if (['a', 'ArrowLeft'].includes(e.key)) inputRef.current.left = false; if (['d', 'ArrowRight'].includes(e.key)) inputRef.current.right = false; if (e.key === ' ') inputRef.current.attack = false; if (e.key.toLowerCase() === 'e') inputRef.current.skill = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const state = mkState(character); let raf = 0, last = performance.now();
    const loop = (now: number) => { const dt = Math.min((now - last) / 1000, 0.033); last = now; state.time += dt; state.elapsed += dt; tick(state, inputRef.current, dt, () => setShake(4)); draw(state, cv.current!, shake); const p = state.fighters[0], def = byId(p.charId);
      setHud({ hp: Math.max(0, p.hp), max: def.maxHp, alive: state.fighters.filter((f) => f.alive).length, skill: Math.max(0, def.skillCooldown - (state.time - p.lastSkill)), t: state.elapsed, out: dist(p.x, p.y, state.safeZone.x, state.safeZone.y) > state.safeZone.radius, name: def.nameKo, icon: idIcon[def.id] });
      if (state.result !== 'playing') { onResult(state.result); return; } raf = requestAnimationFrame(loop);
    }; raf = requestAnimationFrame(loop); return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [character, onResult, shake]);

  const skillCooldownActive = hud.skill > 0.01;

  return <div className='game-wrap gameplay-touch-lock'>
    <div className={`hud-main ${isTouchDevice ? 'mobile-hud' : ''}`}>
      <div className='player-panel'>
        <div className='player-row'>{hud.icon} <b>{hud.name}</b> <span>HP {hud.hp.toFixed(0)}/{hud.max}</span></div>
        <div className='hpbar'><i style={{ width: `${(hud.hp / hud.max) * 100}%` }} /></div>
        {!isTouchDevice && <small>기본공격 SPACE | 스킬 E ({hud.skill.toFixed(1)}s)</small>}
      </div>
      <div className='top-panel'>
        <span>생존 {hud.alive}</span>
        <span>{hud.t.toFixed(0)}s</span>
        {hud.out && <span className='warn'>⚠ 안전지대 밖</span>}
      </div>
      {isTouchDevice && <button className='mobile-menu-btn' aria-label='메뉴'>☰</button>}
    </div>
    <canvas ref={cv} width={viewW} height={viewH} />
    {isTouchDevice && (
      <div className='mobile-controls'>
        <div
          ref={joystickRef}
          className='joystick'
          onPointerDown={(e) => { e.preventDefault(); joystickPointerId.current = e.pointerId; updateJoystick(e.clientX, e.clientY); }}
          onPointerMove={(e) => { if (joystickPointerId.current !== e.pointerId) return; e.preventDefault(); updateJoystick(e.clientX, e.clientY); }}
          onPointerUp={(e) => { if (joystickPointerId.current !== e.pointerId) return; e.preventDefault(); joystickPointerId.current = null; inputRef.current.moveX = 0; inputRef.current.moveY = 0; setThumb({ x: 0, y: 0 }); }}
          onPointerCancel={(e) => { if (joystickPointerId.current !== e.pointerId) return; e.preventDefault(); joystickPointerId.current = null; inputRef.current.moveX = 0; inputRef.current.moveY = 0; setThumb({ x: 0, y: 0 }); }}
        >
          <span className='joystick-thumb' style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }} />
        </div>
        <div className='mobile-buttons'>
          <button
            className={`touch-btn skill ${skillPressed ? 'pressed' : ''} ${skillCooldownActive ? 'disabled' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); setSkillPressed(true); inputRef.current.skill = true; }}
            onPointerUp={(e) => { e.preventDefault(); setSkillPressed(false); inputRef.current.skill = false; }}
            onPointerCancel={() => { setSkillPressed(false); inputRef.current.skill = false; }}
          >스킬{skillCooldownActive ? ` ${hud.skill.toFixed(1)}s` : ''}</button>
          <button
            className={`touch-btn attack ${attackPressed ? 'pressed' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); setAttackPressed(true); inputRef.current.attack = true; }}
            onPointerUp={(e) => { e.preventDefault(); setAttackPressed(false); inputRef.current.attack = false; }}
            onPointerCancel={() => { setAttackPressed(false); inputRef.current.attack = false; }}
          >공격</button>
        </div>
      </div>
    )}
  </div>;
}
const dist = (x:number,y:number,x2:number,y2:number)=>Math.hypot(x-x2,y-y2);
function tick(s: GameState, i: InputState, dt: number, hit: ()=>void){s.safeZone.radius=Math.max(s.safeZone.minRadius,s.safeZone.radius-s.safeZone.shrinkPerSec*dt);s.safeZone.tick+=dt;if(s.safeZone.tick>1){s.safeZone.tick=0;s.fighters.filter(f=>f.alive&&dist(f.x,f.y,s.safeZone.x,s.safeZone.y)>s.safeZone.radius).forEach(f=>f.hp-=6)}
for(let idx=0;idx<s.fighters.length;idx++){const f=s.fighters[idx];if(!f.alive)continue;const c=byId(f.charId);let dx=0,dy=0;if(f.status.stunUntil>s.time){} else if(f.isPlayer){const kx=(i.right?1:0)-(i.left?1:0);const ky=(i.down?1:0)-(i.up?1:0);dx=Math.abs(i.moveX)>0.01?i.moveX:kx;dy=Math.abs(i.moveY)>0.01?i.moveY:ky;} else {const t=chooseTarget(s,idx);if(dist(f.x,f.y,s.safeZone.x,s.safeZone.y)>s.safeZone.radius+20){dx=s.safeZone.x-f.x;dy=s.safeZone.y-f.y;} else if(t){dx=t.x-f.x;dy=t.y-f.y;if(Math.random()<0.006)useSkill(s,f);if(dist(f.x,f.y,t.x,t.y)<c.attackRange+10)attack(s,f,hit);} }
if(i.attack&&f.isPlayer)attack(s,f,hit);if(i.skill&&f.isPlayer)useSkill(s,f);const l=Math.hypot(dx,dy)||1;let sp=c.speed;if(f.status.slowUntil>s.time)sp*=.62;if(f.status.speedUntil>s.time)sp*=1.3;f.vx=dx/l*sp;f.vy=dy/l*sp;f.x+=f.vx*dt;f.y+=f.vy*dt;obstacles.forEach(o=>{if(o.solid&&f.x>o.x-f.radius&&f.x<o.x+o.w+f.radius&&f.y>o.y-f.radius&&f.y<o.y+o.h+f.radius){f.x-=f.vx*dt;f.y-=f.vy*dt;}});if(f.hp<=0)f.alive=false;}
s.effects=s.effects.filter(e=>(e.ttl-=dt)>0);const p=s.fighters[0];if(!p.alive)s.result='defeat';const alive=s.fighters.filter(f=>f.alive);if(alive.length===1&&alive[0].isPlayer)s.result='victory';}
function chooseTarget(s:GameState,i:number){const me=s.fighters[i];return s.fighters.filter(f=>f.alive&&f.id!==me.id).sort((a,b)=>dist(me.x,me.y,a.x,a.y)-dist(me.x,me.y,b.x,b.y))[0]}
function damage(s:GameState,t:Fighter,d:number){t.hp-=d;s.effects.push({x:t.x,y:t.y,r:18,ttl:.2,kind:'hit',ownerId:t.id});}
function attack(s:GameState,f:Fighter,hit:()=>void){const c=byId(f.charId);if(s.time-f.lastAttack<c.attackCooldown)return;f.lastAttack=s.time;s.effects.push({x:f.x,y:f.y,r:c.attackRange,ttl:.12,kind:'attack',ownerId:f.id});s.fighters.forEach(t=>{if(t.alive&&t.id!==f.id&&dist(f.x,f.y,t.x,t.y)<c.attackRange+t.radius){damage(s,t,c.attackPower);const dx=t.x-f.x,dy=t.y-f.y,l=Math.hypot(dx,dy)||1;t.x+=dx/l*10;t.y+=dy/l*10;hit();}})}
function useSkill(s:GameState,f:Fighter){const c=byId(f.charId);if(s.time-f.lastSkill<c.skillCooldown)return;f.lastSkill=s.time;const near=s.fighters.filter(t=>t.alive&&t.id!==f.id&&dist(f.x,f.y,t.x,t.y)<190);const k=c.id;s.effects.push({x:f.x,y:f.y,r:110,ttl:1.1,kind:k,ownerId:f.id});if(k==='juwon'){near.forEach(t=>t.status.slowUntil=s.time+2.5)} if(k==='kyungmin'){near.forEach(t=>damage(s,t,15))} if(k==='hyunjun'){near.forEach(t=>t.status.confuseUntil=s.time+2.2)} if(k==='chanyoung'){f.hp=Math.min(byId(f.charId).maxHp,f.hp+22)} if(k==='hyowon'){near.forEach(t=>{damage(s,t,10);t.status.stunUntil=s.time+0.6})} if(k==='dongha'){near.forEach(t=>t.status.slowUntil=s.time+1.6)} if(k==='heesun'){const t=near[0];if(t)damage(s,t,24)} if(k==='soeun'){near.forEach(t=>{damage(s,t,8);t.status.panicUntil=s.time+2})}}
function draw(s:GameState,can:HTMLCanvasElement,shake:number){const ctx=can.getContext('2d')!;const p=s.fighters[0];const camX=Math.max(0,Math.min(W-viewW,p.x-viewW/2))+Math.random()*shake-shake/2;const camY=Math.max(0,Math.min(H-viewH,p.y-viewH/2))+Math.random()*shake-shake/2;ctx.clearRect(0,0,viewW,viewH);ctx.fillStyle='#96d4a6';ctx.fillRect(0,0,viewW,viewH);
obstacles.forEach(o=>{ctx.fillStyle=o.color;ctx.fillRect(o.x-camX,o.y-camY,o.w,o.h);ctx.fillStyle='#263';ctx.fillText(o.label,o.x-camX+8,o.y-camY+18)});ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.strokeRect(980-camX,620-camY,460,300);ctx.fillStyle='#2c8a48';ctx.fillText('PILUP',1180-camX,780-camY);
ctx.fillStyle='rgba(130,20,50,.15)';ctx.fillRect(0,0,viewW,viewH);ctx.save();ctx.beginPath();ctx.arc(s.safeZone.x-camX,s.safeZone.y-camY,s.safeZone.radius,0,Math.PI*2);ctx.clip();ctx.clearRect(0,0,viewW,viewH);ctx.restore();ctx.strokeStyle='#ff5370';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.safeZone.x-camX,s.safeZone.y-camY,s.safeZone.radius,0,Math.PI*2);ctx.stroke();
for(const e of s.effects){ctx.strokeStyle=e.kind==='hit'?'#fff':e.kind==='hyowon'?'#ff7b22':e.kind==='juwon'?'#4f8fff':e.kind==='soeun'?'#f0e742':'#333';ctx.beginPath();ctx.arc(e.x-camX,e.y-camY,e.r,0,Math.PI*2);ctx.stroke();}
for(const f of s.fighters){if(!f.alive)continue;const c=byId(f.charId);ctx.fillStyle=c.fallbackColor;ctx.beginPath();ctx.arc(f.x-camX,f.y-camY,f.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.fillText(idIcon[c.id],f.x-camX-7,f.y-camY+4);ctx.fillText(c.nameKo,f.x-camX-20,f.y-camY-f.radius-8);ctx.fillStyle='#333';ctx.fillRect(f.x-camX-22,f.y-camY+f.radius+5,44,5);ctx.fillStyle='#58d866';ctx.fillRect(f.x-camX-22,f.y-camY+f.radius+5,44*(f.hp/byId(f.charId).maxHp),5);} }

'use client';
import { useEffect, useRef, useState } from 'react';
import { byId, CHARACTERS } from '@/game/characters';
import { inputState, resetInputState, setActionPressed, setJoystickAnalog, setKeyboardMovement } from '@/game/input';
import { CharacterId, Fighter, GameState, InputState, Obstacle } from '@/game/types';

const W = 2400, H = 1600, viewW = 1000, viewH = 620;
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

type MutableGame = {
  state: GameState;
  activePlayerId: string;
  camera: { x: number; y: number };
  input: InputState;
  debugMove: {
    beforeMoveX: number;
    beforeMoveY: number;
    attemptedNextX: number;
    attemptedNextY: number;
    afterMoveX: number;
    afterMoveY: number;
    beforeRenderX: number;
    beforeRenderY: number;
    movedDeltaX: number;
    movedDeltaY: number;
    collisionBlocked: boolean;
    clampBlocked: boolean;
    resetDetected: boolean;
    updateCalled: boolean;
  };
};

function mkState(playerId: CharacterId): GameState {
  const ids = CHARACTERS.map((c) => c.id);
  const order = [playerId, ...ids.filter((i) => i !== playerId)];
  const fighters: Fighter[] = order.map((id, i) => { const d=byId(id); return ({ id: `f${i}`, charId: id, x: 280 + (i % 4) * 500, y: 380 + Math.floor(i / 4) * 620, vx: 0, vy: 0, radius: d.bodyRadius, hp: d.maxHp*combatConfig.globalHpMultiplier, alive: true, isPlayer: i === 0, lastAttack: -99, lastSkill: -99, lastHitAt:-99, flashUntil:0, fadeUntil:0, facing: { x: 1, y: 0 }, status: { slowUntil: 0, stunUntil: 0, confuseUntil: 0, defenseUntil: 0, shieldUntil: 0, panicUntil: 0, speedUntil: 0 } }); });
  return { fighters, obstacles, safeZone: { x: W / 2, y: H / 2, radius: 920, minRadius: 170, shrinkPerSec: 3.6, tick: 0 }, projectiles: [], traps: [], devices: [], effects: [], time: 0, elapsed: 0, result: 'playing' };
}

export function GameCanvas({ character, onResult }: { character: CharacterId; onResult: (r: 'victory' | 'defeat') => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef(0);
  const gameRef = useRef<MutableGame | null>(null);
  const [hud, setHud] = useState({ hp: 0, max: 0, alive: 8, skill: 0, t: 0, out: false, name: '', icon: '' });
  const [debug, setDebug] = useState({ gameStarted: false, activePlayerId: '', activePlayerName: '', x: 0, y: 0, dx: 0, dy: 0, pressedKeys: '', deltaTime: 0, isMoving: false, cameraX: 0, cameraY: 0, updateTick: 0, renderTick: 0, autoMoveActive: false, beforeMoveX: 0, beforeMoveY: 0, afterMoveX: 0, afterMoveY: 0, beforeRenderX: 0, beforeRenderY: 0, attemptedNextX: 0, attemptedNextY: 0, movedDeltaX: 0, movedDeltaY: 0, collisionBlocked: false, clampBlocked: false, resetDetected: false, updateCalled: false, elapsedTime:0,averageHpPercent:0,firstDeathTime:-1,dps:0,separationCount:0,maxAttackersOnTarget:0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [dpadPressed, setDpadPressed] = useState({ up: false, down: false, left: false, right: false });
  const [attackPressed, setAttackPressed] = useState(false);
  const [skillPressed, setSkillPressed] = useState(false);
  const joystickPointerIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const joystickInputRef = useRef({ x: 0, y: 0 });
  const [showOrientationGuide, setShowOrientationGuide] = useState(false);
  const [showInstallHint, setShowInstallHint] = useState(false);
  const [fullscreenHelp, setFullscreenHelp] = useState('');
  const showDebug = typeof window !== 'undefined' && (process.env.NODE_ENV === 'development' || new URLSearchParams(window.location.search).get('debug') === '1');

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    setIsTouchDevice(coarse || navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('mpr-install-hint-dismissed') === '1';
    if (dismissed) return;
    const mobile = window.matchMedia('(max-width: 920px)').matches;
    if (mobile) setShowInstallHint(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(orientation: portrait)');
    const sync = () => setShowOrientationGuide(isTouchDevice && media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [isTouchDevice]);

  const setDpadMovement = (direction: 'up' | 'down' | 'left' | 'right', pressed: boolean) => {
    setKeyboardMovement(direction, pressed);
    setDpadPressed((current) => ({ ...current, [direction]: pressed }));
  };

  useEffect(() => {
    resetInputState();
    const state = mkState(character);
    const activePlayer = state.fighters.find((f) => f.isPlayer);
    gameRef.current = {
      state,
      activePlayerId: activePlayer?.id ?? state.fighters[0].id,
      camera: { x: 0, y: 0 },
      input: inputState,
      debugMove: { beforeMoveX: 0, beforeMoveY: 0, attemptedNextX: 0, attemptedNextY: 0, afterMoveX: 0, afterMoveY: 0, beforeRenderX: 0, beforeRenderY: 0, movedDeltaX: 0, movedDeltaY: 0, collisionBlocked: false, clampBlocked: false, resetDetected: false, updateCalled: false },
    };

    const applyKey = (e: KeyboardEvent, pressed: boolean) => {
      if (['w', 'W', 'ArrowUp'].includes(e.key)) setKeyboardMovement('up', pressed);
      if (['s', 'S', 'ArrowDown'].includes(e.key)) setKeyboardMovement('down', pressed);
      if (['a', 'A', 'ArrowLeft'].includes(e.key)) setKeyboardMovement('left', pressed);
      if (['d', 'D', 'ArrowRight'].includes(e.key)) setKeyboardMovement('right', pressed);
      if (e.key === ' ') setActionPressed('attackPressed', pressed);
      if (e.key.toLowerCase() === 'e') setActionPressed('skillPressed', pressed);
    };

    const down = (e: KeyboardEvent) => applyKey(e, true);
    const up = (e: KeyboardEvent) => applyKey(e, false);

    window.addEventListener('keydown', down, { passive: false });
    window.addEventListener('keyup', up, { passive: false });

    let raf = 0;
    let updateTick = 0;
    let renderTick = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!gameRef.current || !cv.current) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const game = gameRef.current;
      game.state.time += dt;
      game.state.elapsed += dt;
      shakeRef.current = Math.max(0, shakeRef.current - dt * 18);
      updateTick += 1;
      tick(game, dt, () => { shakeRef.current = 4; });
      renderTick += 1;
      draw(game, cv.current, shakeRef.current);
      const p = getActivePlayer(game);
      game.debugMove.beforeRenderX = p.x;
      game.debugMove.beforeRenderY = p.y;
      const def = byId(p.charId);
      setHud({ hp: Math.max(0, p.hp), max: def.maxHp, alive: game.state.fighters.filter((f) => f.alive).length, skill: Math.max(0, def.skillCooldown - (game.state.time - p.lastSkill)), t: game.state.elapsed, out: dist(p.x, p.y, game.state.safeZone.x, game.state.safeZone.y) > game.state.safeZone.radius, name: def.nameKo, icon: idIcon[def.id] });
      const dx = game.input.analogX || ((game.input.right ? 1 : 0) - (game.input.left ? 1 : 0));
      const dy = game.input.analogY || ((game.input.down ? 1 : 0) - (game.input.up ? 1 : 0));
      const pressedKeys = [
        game.input.up ? 'up' : '',
        game.input.down ? 'down' : '',
        game.input.left ? 'left' : '',
        game.input.right ? 'right' : '',
        game.input.attackPressed ? 'attack' : '',
        game.input.skillPressed ? 'skill' : '',
      ].filter(Boolean).join(',');
      const alive=game.state.fighters.filter((f)=>f.alive); const avgHp=alive.reduce((a,f)=>a+f.hp/(byId(f.charId).maxHp*combatConfig.globalHpMultiplier),0)/(alive.length||1); setDebug({ gameStarted: true, activePlayerId: game.activePlayerId, activePlayerName: def.nameKo, x: p.x, y: p.y, dx, dy, pressedKeys, deltaTime: dt, isMoving: Math.hypot(p.vx, p.vy) > 0.01, cameraX: game.camera.x, cameraY: game.camera.y, updateTick, renderTick, autoMoveActive: game.state.elapsed < 2, elapsedTime:game.state.elapsed, averageHpPercent:avgHp*100, firstDeathTime:(game.state as any).firstDeathTime??-1, dps:(game.state as any).dps??0,separationCount:(game.state as any).separationCount??0,maxAttackersOnTarget:(game.state as any).maxAttackersOnTarget??0, ...game.debugMove });
      if (game.state.result !== 'playing') { onResult(game.state.result); return; }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      resetInputState();
      gameRef.current = null;
    };
  }, [character, onResult]);

  const skillCooldownActive = hud.skill > 0.01;
  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreenHelp('');
    } catch {
      setFullscreenHelp('전체화면이 제한되면 홈 화면에 추가 후 앱처럼 실행해 보세요.');
    }
  };

  return <div className='game-wrap gameplay-touch-lock'>
    {isTouchDevice && <button type='button' className='fullscreen-btn' onClick={requestFullscreen}>전체화면</button>}
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
    {showDebug && <div className='debug-telemetry'>
      <div>gameStarted: {String(debug.gameStarted)} | activePlayerId: {debug.activePlayerId}</div>
      <div>activePlayer: {debug.activePlayerName}</div>
      <div>x: {debug.x.toFixed(1)} y: {debug.y.toFixed(1)} | camX: {debug.cameraX.toFixed(1)} camY: {debug.cameraY.toFixed(1)}</div>
      <div>input dx: {debug.dx.toFixed(2)} dy: {debug.dy.toFixed(2)} | keys: {debug.pressedKeys || 'none'}</div>
      <div>deltaTime: {debug.deltaTime.toFixed(4)} | isMoving: {String(debug.isMoving)} | autoMove: {String(debug.autoMoveActive)}</div>
      <div>update/render ticks: {debug.updateTick}/{debug.renderTick} | updateCalled: {String(debug.updateCalled)}</div>
      <div>beforeMove ({debug.beforeMoveX.toFixed(1)}, {debug.beforeMoveY.toFixed(1)}) → afterMove ({debug.afterMoveX.toFixed(1)}, {debug.afterMoveY.toFixed(1)})</div>
      <div>beforeRender ({debug.beforeRenderX.toFixed(1)}, {debug.beforeRenderY.toFixed(1)}) | attempted ({debug.attemptedNextX.toFixed(1)}, {debug.attemptedNextY.toFixed(1)})</div>
      <div>movedDelta ({debug.movedDeltaX.toFixed(2)}, {debug.movedDeltaY.toFixed(2)}) | collisionBlocked: {String(debug.collisionBlocked)} | clampBlocked: {String(debug.clampBlocked)} | resetDetected: {String(debug.resetDetected)}</div>
      <div>elapsed: {debug.elapsedTime.toFixed(1)}s | avgHp: {debug.averageHpPercent.toFixed(1)}% | firstDeath: {debug.firstDeathTime > 0 ? `${debug.firstDeathTime.toFixed(1)}s` : 'none'}</div>
      <div>dpsEvents: {debug.dps.toFixed(2)} | separation: {debug.separationCount} | maxAttackersOnTarget: {debug.maxAttackersOnTarget}</div>
    </div>}
    <canvas ref={cv} width={viewW} height={viewH} />
    {isTouchDevice && (
      <div className='mobile-controls'>
        <div className='mobile-dpad' aria-label='이동 버튼'>
          {(['up', 'left', 'right', 'down'] as const).map((direction) => (
            <button
              key={direction}
              type='button'
              className={`dpad-btn ${direction} ${dpadPressed[direction] ? 'pressed' : ''}`}
              aria-label={`${direction} 이동`}
              onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDpadMovement(direction, true); }}
              onPointerUp={(e) => { e.preventDefault(); setDpadMovement(direction, false); }}
              onPointerCancel={() => setDpadMovement(direction, false)}
              onLostPointerCapture={() => setDpadMovement(direction, false)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {direction === 'up' ? '▲' : direction === 'down' ? '▼' : direction === 'left' ? '◀' : '▶'}
            </button>
          ))}
        </div>
        <div
          className='mobile-joystick'
          onPointerDown={(e) => {
            e.preventDefault();
            joystickPointerIdRef.current = e.pointerId;
            joystickCenterRef.current = { x: e.clientX, y: e.clientY };
            joystickInputRef.current = { x: 0, y: 0 };
            setJoystickAnalog(0, 0);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (joystickPointerIdRef.current !== e.pointerId) return;
            e.preventDefault();
            const dx = e.clientX - joystickCenterRef.current.x;
            const dy = e.clientY - joystickCenterRef.current.y;
            const radius = 40;
            const nx = Math.max(-1, Math.min(1, dx / radius));
            const ny = Math.max(-1, Math.min(1, dy / radius));
            joystickInputRef.current = { x: nx, y: ny };
            setJoystickAnalog(nx, ny);
          }}
          onPointerUp={(e) => {
            if (joystickPointerIdRef.current !== e.pointerId) return;
            e.preventDefault();
            joystickPointerIdRef.current = null;
            joystickInputRef.current = { x: 0, y: 0 };
            setJoystickAnalog(0, 0);
          }}
          onPointerCancel={() => {
            joystickPointerIdRef.current = null;
            joystickInputRef.current = { x: 0, y: 0 };
            setJoystickAnalog(0, 0);
          }}
        >
          <div className='mobile-joystick-knob' style={{ transform: `translate(${joystickInputRef.current.x * 20}px, ${joystickInputRef.current.y * 20}px)` }} />
        </div>
        <div className='mobile-buttons'>
          <button className={`touch-btn skill ${skillPressed ? 'pressed' : ''} ${skillCooldownActive ? 'disabled' : ''}`} onPointerDown={(e) => { e.preventDefault(); setSkillPressed(true); setActionPressed('skillPressed', true); }} onPointerUp={(e) => { e.preventDefault(); setSkillPressed(false); setActionPressed('skillPressed', false); }} onPointerCancel={() => { setSkillPressed(false); setActionPressed('skillPressed', false); }}>스킬{skillCooldownActive ? ` ${hud.skill.toFixed(1)}s` : ''}</button>
          <button className={`touch-btn attack ${attackPressed ? 'pressed' : ''}`} onPointerDown={(e) => { e.preventDefault(); setAttackPressed(true); setActionPressed('attackPressed', true); }} onPointerUp={(e) => { e.preventDefault(); setAttackPressed(false); setActionPressed('attackPressed', false); }} onPointerCancel={() => { setAttackPressed(false); setActionPressed('attackPressed', false); }}>공격</button>
        </div>
      </div>
    )}
    {fullscreenHelp && <div className='install-hint'><span>{fullscreenHelp}</span><button type='button' className='small-btn' onClick={() => setFullscreenHelp('')}>닫기</button></div>}
    {showInstallHint && <div className='install-hint'><span>홈 화면에 추가하면 앱처럼 전체화면으로 플레이할 수 있어요.</span><button type='button' className='small-btn' onClick={() => { localStorage.setItem('mpr-install-hint-dismissed', '1'); setShowInstallHint(false); }}>닫기</button></div>}
    {showOrientationGuide && <div className='orientation-overlay'><div className='orientation-card'><div>가로모드로 돌리면 더 쾌적하게 플레이할 수 있어요.</div><button type='button' className='small-btn' onClick={() => setShowOrientationGuide(false)}>계속 플레이</button></div></div>}
  </div>;
}

const dist = (x: number, y: number, x2: number, y2: number) => Math.hypot(x - x2, y - y2);
const combatConfig={globalDamageMultiplier:0.75,globalHpMultiplier:1.18,aiAttackAggression:0.78,startingGraceSeconds:1.8,maxMeleeAttackersPerTarget:2,separationStrength:0.55,knockbackStrength:7.5,spawnMinDistance:210};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const getActivePlayer = (g: MutableGame) => g.state.fighters.find((f) => f.id === g.activePlayerId) ?? g.state.fighters[0];

function tick(g: MutableGame, dt: number, hit: () => void) {
  const debugDisableCollision = false;
  g.debugMove.updateCalled = true;
  if (!Number.isFinite(dt) || dt <= 0) return;
  const s = g.state;
  const i = g.input;
  s.safeZone.radius = Math.max(s.safeZone.minRadius, s.safeZone.radius - s.safeZone.shrinkPerSec * dt);
  s.safeZone.tick += dt;
  if (s.safeZone.tick > 1) {
    s.safeZone.tick = 0;
    s.fighters.filter((f) => f.alive && dist(f.x, f.y, s.safeZone.x, s.safeZone.y) > s.safeZone.radius).forEach((f) => f.hp -= 6);
  }
  for (let idx = 0; idx < s.fighters.length; idx++) {
    const f = s.fighters[idx];
    if (!f.alive) continue;
    const c = byId(f.charId);
    let dx = 0, dy = 0;
    if (f.status.stunUntil > s.time) {
      dx = 0; dy = 0;
    } else if (f.id === g.activePlayerId) {
      const hasAnalog = Math.hypot(i.analogX, i.analogY) > 0;
      const kx = (i.right ? 1 : 0) - (i.left ? 1 : 0);
      const ky = (i.down ? 1 : 0) - (i.up ? 1 : 0);
      dx = hasAnalog ? i.analogX : kx;
      dy = hasAnalog ? i.analogY : ky;
    } else {
      const t = chooseTarget(s, idx);
      if (dist(f.x, f.y, s.safeZone.x, s.safeZone.y) > s.safeZone.radius + 20) { dx = s.safeZone.x - f.x; dy = s.safeZone.y - f.y; }
      else if (t) { f.targetId=t.id; const d=dist(f.x,f.y,t.x,t.y); const nx=(t.x-f.x)/(d||1), ny=(t.y-f.y)/(d||1); if (d>c.attackRange*0.95) { dx = t.x - f.x; dy = t.y - f.y; } else if (d < c.preferredCombatDistance*0.85) { dx = -nx; dy = -ny; } else { dx = -ny*0.4; dy = nx*0.4; } if (Math.random() < 0.004) useSkill(s, f); if (d < c.attackRange+6) attack(s, f, hit); }
    }
    if (i.attackPressed && f.id === g.activePlayerId) attack(s, f, hit);
    if (i.skillPressed && f.id === g.activePlayerId) useSkill(s, f);
    const l = Math.hypot(dx, dy) || 1;
    let sp = c.speed;
    if (f.status.slowUntil > s.time) sp *= .62;
    if (f.status.speedUntil > s.time) sp *= 1.3;
    f.vx = dx / l * sp;
    f.vy = dy / l * sp;

    const beforeMoveX = f.x;
    const beforeMoveY = f.y;
    let nextX = f.x + f.vx * dt;
    let nextY = f.y + f.vy * dt;
    let collisionBlocked = false;
    let clampBlocked = false;

    if (!debugDisableCollision) {
      for (const o of obstacles) {
        if (o.solid && nextX > o.x - f.radius && nextX < o.x + o.w + f.radius && nextY > o.y - f.radius && nextY < o.y + o.h + f.radius) {
          collisionBlocked = true;
          nextX = beforeMoveX;
          nextY = beforeMoveY;
          break;
        }
      }
    }

    const clampedX = clamp(nextX, f.radius, W - f.radius);
    const clampedY = clamp(nextY, f.radius, H - f.radius);
    if (clampedX !== nextX || clampedY !== nextY) clampBlocked = true;

    f.x = clampedX;
    f.y = clampedY;

    if (f.id === g.activePlayerId) {
      g.debugMove.beforeMoveX = beforeMoveX;
      g.debugMove.beforeMoveY = beforeMoveY;
      g.debugMove.attemptedNextX = beforeMoveX + f.vx * dt;
      g.debugMove.attemptedNextY = beforeMoveY + f.vy * dt;
      g.debugMove.afterMoveX = f.x;
      g.debugMove.afterMoveY = f.y;
      g.debugMove.movedDeltaX = f.x - beforeMoveX;
      g.debugMove.movedDeltaY = f.y - beforeMoveY;
      g.debugMove.collisionBlocked = collisionBlocked;
      g.debugMove.clampBlocked = clampBlocked;
      g.debugMove.resetDetected = false;
    }
    if (f.hp <= 0) f.alive = false;
  }

  let separationCount=0;
  for(let a=0;a<s.fighters.length;a++){for(let b=a+1;b<s.fighters.length;b++){const fa=s.fighters[a],fb=s.fighters[b]; if(!fa.alive||!fb.alive) continue; const dx=fb.x-fa.x,dy=fb.y-fa.y; let d=Math.hypot(dx,dy); const minD=fa.radius+fb.radius; if(d<minD){separationCount++; if(d<0.001){d=0.001;} const nx=dx/d,ny=dy/d; const overlap=(minD-d)*combatConfig.separationStrength; fa.x=clamp(fa.x-nx*overlap*0.5,fa.radius,W-fa.radius); fa.y=clamp(fa.y-ny*overlap*0.5,fa.radius,H-fa.radius); fb.x=clamp(fb.x+nx*overlap*0.5,fb.radius,W-fb.radius); fb.y=clamp(fb.y+ny*overlap*0.5,fb.radius,H-fb.radius);}}}
  (s as any).separationCount=separationCount;
  const attackersCount=new Map<string,number>(); s.fighters.forEach(f=>{if(f.alive&&f.targetId){attackersCount.set(f.targetId,(attackersCount.get(f.targetId)||0)+1);}}); (s as any).maxAttackersOnTarget=Math.max(0,...attackersCount.values());
  const dead=s.fighters.find(f=>!f.alive); if(dead && (s as any).firstDeathTime===undefined){(s as any).firstDeathTime=s.elapsed;}
  s.effects = s.effects.filter((e) => (e.ttl -= dt) > 0);
  const p = getActivePlayer(g);
  g.debugMove.resetDetected = Math.abs(g.debugMove.beforeRenderX - g.debugMove.afterMoveX) > 0.01 || Math.abs(g.debugMove.beforeRenderY - g.debugMove.afterMoveY) > 0.01;
  if (!p.alive) s.result = 'defeat';
  const alive = s.fighters.filter((f) => f.alive);
  if (alive.length === 1 && alive[0].id === g.activePlayerId) s.result = 'victory';
}

function chooseTarget(s: GameState, i: number) {
  const me = s.fighters[i];
  const alive = s.fighters.filter((f) => f.alive && f.id !== me.id);
  const attackers = new Map<string, number>();
  s.fighters.filter((f)=>f.alive && f.targetId).forEach((f)=>attackers.set(f.targetId!, (attackers.get(f.targetId!)||0)+1));
  return alive.sort((a, b) => {
    const da = dist(me.x, me.y, a.x, a.y) + (attackers.get(a.id) || 0) * 80;
    const db = dist(me.x, me.y, b.x, b.y) + (attackers.get(b.id) || 0) * 80;
    return da - db;
  })[0];
}
function damage(s: GameState, t: Fighter, d: number, src?: Fighter) {
  const now=s.time;
  const reduced=now<t.lastHitAt+0.25?0.65:1;
  t.lastHitAt=now; t.flashUntil=now+0.08;
  t.hp -= d*combatConfig.globalDamageMultiplier*reduced;
  s.effects.push({ x: t.x, y: t.y, r: 14, ttl: .22, kind: 'hit', ownerId: t.id });
  if(src){const dx=t.x-src.x,dy=t.y-src.y,l=Math.hypot(dx,dy)||1; t.x=clamp(t.x+dx/l*combatConfig.knockbackStrength,t.radius,W-t.radius); t.y=clamp(t.y+dy/l*combatConfig.knockbackStrength,t.radius,H-t.radius);} 
}
function attack(s: GameState, f: Fighter, hit: () => void) { const c = byId(f.charId); if (s.time < combatConfig.startingGraceSeconds || s.time - f.lastAttack < c.attackCooldown) return; const attackers=s.fighters.filter(x=>x.alive&&x.id!==f.id&&x.targetId===f.targetId&&dist(x.x,x.y,f.x,f.y)<byId(x.charId).attackRange+8).length; if(c.attackRange<60 && attackers>combatConfig.maxMeleeAttackersPerTarget) return; f.lastAttack = s.time; s.effects.push({ x: f.x, y: f.y, r: c.attackRange, ttl: .12, kind: 'attack', ownerId: f.id }); s.fighters.forEach((t) => { if (t.alive && t.id !== f.id && dist(f.x, f.y, t.x, t.y) < c.attackRange + t.radius) { damage(s, t, c.attackPower, f); hit(); } }); }
function useSkill(s: GameState, f: Fighter) { const c = byId(f.charId); if (s.time < combatConfig.startingGraceSeconds || s.time - f.lastSkill < c.skillCooldown) return; f.lastSkill = s.time; const near = s.fighters.filter((t) => t.alive && t.id !== f.id && dist(f.x, f.y, t.x, t.y) < 190); const k = c.id; s.effects.push({ x: f.x, y: f.y, r: 110, ttl: 1.1, kind: k, ownerId: f.id }); if (k === 'juwon') { near.forEach((t) => t.status.slowUntil = s.time + 2.5); f.status.shieldUntil=s.time+1.8; } if (k === 'kyungmin') { near.forEach((t) => damage(s, t, c.skillPower, f)); } if (k === 'hyunjun') { near.forEach((t) => t.status.confuseUntil = s.time + 2.2); } if (k === 'chanyoung') { f.hp = Math.min(byId(f.charId).maxHp*combatConfig.globalHpMultiplier, f.hp + c.skillPower); } if (k === 'hyowon') { near.forEach((t) => { damage(s, t, c.skillPower*0.8, f); t.status.stunUntil = s.time + 0.45; }); } if (k === 'dongha') { near.forEach((t) => t.status.slowUntil = s.time + 1.6); } if (k === 'heesun') { const t = near.sort((a,b)=>dist(f.x,f.y,a.x,a.y)-dist(f.x,f.y,b.x,b.y))[0]; if (t) damage(s, t, c.skillPower, f); } if (k === 'soeun') { near.forEach((t) => { damage(s, t, c.skillPower*0.7, f); t.status.panicUntil = s.time + 2; }); } }
function draw(g: MutableGame, can: HTMLCanvasElement, shake: number) { const ctx = can.getContext('2d')!; const s = g.state; const p = getActivePlayer(g); g.camera.x = clamp(p.x - viewW / 2, 0, W - viewW); g.camera.y = clamp(p.y - viewH / 2, 0, H - viewH); const camX = g.camera.x + Math.random() * shake - shake / 2; const camY = g.camera.y + Math.random() * shake - shake / 2; ctx.clearRect(0, 0, viewW, viewH); ctx.fillStyle = '#96d4a6'; ctx.fillRect(0, 0, viewW, viewH);
obstacles.forEach((o) => { ctx.fillStyle = o.color; ctx.fillRect(o.x - camX, o.y - camY, o.w, o.h); ctx.fillStyle = '#263'; ctx.fillText(o.label, o.x - camX + 8, o.y - camY + 18); }); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(980 - camX, 620 - camY, 460, 300); ctx.fillStyle = '#2c8a48'; ctx.fillText('PILUP', 1180 - camX, 780 - camY);
ctx.fillStyle = 'rgba(130,20,50,.15)'; ctx.fillRect(0, 0, viewW, viewH); ctx.save(); ctx.beginPath(); ctx.arc(s.safeZone.x - camX, s.safeZone.y - camY, s.safeZone.radius, 0, Math.PI * 2); ctx.clip(); ctx.clearRect(0, 0, viewW, viewH); ctx.restore(); ctx.strokeStyle = '#ff5370'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.safeZone.x - camX, s.safeZone.y - camY, s.safeZone.radius, 0, Math.PI * 2); ctx.stroke();
for (const e of s.effects) { ctx.strokeStyle = e.kind === 'hit' ? '#fff' : e.kind === 'hyowon' ? '#ff7b22' : e.kind === 'juwon' ? '#4f8fff' : e.kind === 'soeun' ? '#f0e742' : '#333'; ctx.beginPath(); ctx.arc(e.x - camX, e.y - camY, e.r, 0, Math.PI * 2); ctx.stroke(); }
ctx.beginPath(); ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 3; ctx.arc(p.x - camX, p.y - camY, 12, 0, Math.PI * 2); ctx.stroke();
for (const f of s.fighters) { if (!f.alive) continue; const c = byId(f.charId); ctx.fillStyle = c.fallbackColor; ctx.beginPath(); ctx.arc(f.x - camX, f.y - camY, f.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillText(idIcon[c.id], f.x - camX - 7, f.y - camY + 4); ctx.fillText(c.nameKo, f.x - camX - 20, f.y - camY - f.radius - 8); ctx.fillStyle = '#333'; ctx.fillRect(f.x - camX - 22, f.y - camY + f.radius + 5, 44, 5); ctx.fillStyle = '#58d866'; ctx.fillRect(f.x - camX - 22, f.y - camY + f.radius + 5, 44 * (f.hp / byId(f.charId).maxHp), 5); } }

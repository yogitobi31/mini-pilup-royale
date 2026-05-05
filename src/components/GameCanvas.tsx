'use client';
import { useEffect, useRef, useState } from 'react';
import { byId, CHARACTERS } from '@/game/characters';
import { inputState, resetInputState, setActionPressed, setJoystickAnalog, setKeyboardMovement } from '@/game/input';
import { CharacterId, Fighter, GameState, InputState, Obstacle } from '@/game/types';

const W = 2400, H = 1600, viewW = 1000, viewH = 620;
const MAX_FLOATING_TEXT = 42;
type ArenaZone = { id: string; x: number; y: number; w: number; h: number; label: string; tone: string };
type ArenaObstacle = Obstacle & { id: string; type: 'wall' | 'desk' | 'locker' | 'pillar' | 'bench' | 'board' | 'chairCluster' | 'teacherDesk' | 'bookshelf' | 'partition'; blocks: boolean };
const arenaZones: ArenaZone[] = [
  { id: 'hallway-north', x: 260, y: 160, w: 1880, h: 280, label: '북측 복도', tone: '#273956' },
  { id: 'classroom-center', x: 860, y: 470, w: 680, h: 470, label: '중앙 교실', tone: '#1f3046' },
  { id: 'hallway-south', x: 220, y: 1030, w: 1960, h: 360, label: '남측 복도', tone: '#293850' },
  { id: 'safe-core', x: 980, y: 600, w: 380, h: 220, label: '안전지대 코어', tone: '#244661' },
];
const arenaDecorations: { id: string; x: number; y: number; w: number; h: number; color: string; label?: string }[] = [
  { id:'tile-north', x: 300, y: 300, w: 1800, h: 4, color: 'rgba(180,209,255,0.08)' },
  { id:'tile-south', x: 300, y: 1120, w: 1800, h: 4, color: 'rgba(180,209,255,0.08)' },
  { id:'safe-core-mark', x: 1050, y: 560, w: 300, h: 2, color: 'rgba(255,255,255,0.11)' },
  { id:'poster-east', x: 1930, y: 520, w: 80, h: 30, color: 'rgba(255,245,200,0.22)', label:'POSTER' },
  { id:'mat-lounge', x: 520, y: 1240, w: 200, h: 60, color: 'rgba(105,145,188,0.18)', label:'LOUNGE' },
];
const obstacles: ArenaObstacle[] = [
  { id: 'wall-north', x: 330, y: 240, w: 520, h: 30, label: '복도 벽', color: '#3f4f68', solid: true, type: 'wall', blocks: true },
  { id: 'wall-west', x: 330, y: 240, w: 30, h: 350, label: '복도 벽', color: '#3f4f68', solid: true, type: 'wall', blocks: true },
  { id: 'locker-a', x: 430, y: 325, w: 130, h: 72, label: '사물함', color: '#576a88', solid: true, type: 'locker', blocks: true },
  { id: 'desk-a', x: 1030, y: 575, w: 95, h: 48, label: '책상', color: '#8a7056', solid: true, type: 'desk', blocks: true },
  { id: 'desk-b', x: 1165, y: 575, w: 95, h: 48, label: '책상', color: '#8a7056', solid: true, type: 'desk', blocks: true },
  { id: 'desk-c', x: 1300, y: 575, w: 95, h: 48, label: '책상', color: '#8a7056', solid: true, type: 'desk', blocks: true },
  { id: 'bench-a', x: 1770, y: 350, w: 112, h: 56, label: '벤치', color: '#856a54', solid: true, type: 'bench', blocks: true },
  { id: 'board-a', x: 1760, y: 1145, w: 132, h: 58, label: '칠판', color: '#2e5a43', solid: true, type: 'board', blocks: true },
  { id: 'pillar-a', x: 760, y: 1115, w: 124, h: 124, label: '기둥', color: '#4e5a6c', solid: true, type: 'pillar', blocks: true },
  { id: 'desk-d', x: 1260, y: 1110, w: 150, h: 98, label: '책상', color: '#8a7056', solid: true, type: 'desk', blocks: true },
  { id: 'chairs-north', x: 1430, y: 338, w: 120, h: 56, label: '의자 묶음', color: '#6f7f92', solid: true, type: 'chairCluster', blocks: true },
  { id: 'teacher-desk', x: 1630, y: 1140, w: 130, h: 70, label: '교탁', color: '#7a624e', solid: true, type: 'teacherDesk', blocks: true },
  { id: 'bookshelf-east', x: 2000, y: 700, w: 120, h: 180, label: '책장', color: '#615b4f', solid: true, type: 'bookshelf', blocks: true },
  { id: 'partition-south', x: 900, y: 1220, w: 190, h: 34, label: '파티션', color: '#556170', solid: true, type: 'partition', blocks: true },
];
const idIcon: Record<CharacterId, string> = { juwon: '🔔', kyungmin: '🎵', hyunjun: '❓', chanyoung: '🙂', hyowon: '🪤', dongha: '⚙️', heesun: '✏️', soeun: '🐞' };

type SpawnChecks = { insideSafeZone: boolean; notInsideObstacle: boolean; distanceFromOtherPlayers: boolean; distanceFromObstacles: boolean; insideMapBounds: boolean };

type MutableGame = {
  state: GameState;
  activePlayerId: string;
  camera: { x: number; y: number };
  input: InputState;
  spawnDebug: {
    points: { id: string; x: number; y: number }[];
    assignments: { fighterId: string; charId: CharacterId; pointId: string; x: number; y: number; isPlayer: boolean; checks: SpawnChecks; spawnRejectedReason: string | null }[];
    activePlayerPointId: string;
  };
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
    collisionObstacleId: string;
    lastBlockedReason: string;
    blockedX: boolean;
    blockedY: boolean;
    clampBlocked: boolean;
    resetDetected: boolean;
    updateCalled: boolean;
  };
  outsideZoneOverlayAlpha: number;
};

function mkState(playerId: CharacterId): GameState {
  const ids = CHARACTERS.map((c) => c.id);
  const order = [playerId, ...ids.filter((i) => i !== playerId)];
  const safeZone = { x: W / 2, y: H / 2, radius: 920, minRadius: 170, shrinkPerSec: 3.6, tick: 0 };
  const candidateSpawnPoints = [
    { id: 'center-nw', x: 930, y: 640 }, { id: 'center-ne', x: 1470, y: 640 }, { id: 'center-sw', x: 930, y: 950 }, { id: 'center-se', x: 1470, y: 950 },
    { id: 'north-west', x: 620, y: 460 }, { id: 'north-east', x: 1780, y: 460 }, { id: 'south-west', x: 620, y: 1160 }, { id: 'south-east', x: 1780, y: 1160 },
  ];
  const fighters: Fighter[] = [];
  const assignments: MutableGame['spawnDebug']['assignments'] = [];
  const available = [...candidateSpawnPoints];
  for (let i = 0; i < order.length; i += 1) {
    const id = order[i];
    const d = byId(id);
    let chosen = available[0];
    let chosenChecks: SpawnChecks = { insideSafeZone: false, notInsideObstacle: false, distanceFromOtherPlayers: false, distanceFromObstacles: false, insideMapBounds: false };
    let chosenReason: string | null = 'noCandidate';
    for (const point of available) {
      const insideSafeZone = dist(point.x, point.y, safeZone.x, safeZone.y) + d.bodyRadius <= safeZone.radius;
      const notInsideObstacle = obstacles.every((o) => !circleIntersectsRect(point.x, point.y, d.bodyRadius + 2, o));
      const distanceFromOtherPlayers = fighters.every((f) => dist(point.x, point.y, f.x, f.y) >= d.bodyRadius + f.radius + combatConfig.spawnMinDistance);
      const distanceFromObstacles = obstacles.every((o) => circleRectDistance(point.x, point.y, o) >= d.bodyRadius + 26);
      const insideMapBounds = point.x - d.bodyRadius >= 0 && point.x + d.bodyRadius <= W && point.y - d.bodyRadius >= 0 && point.y + d.bodyRadius <= H;
      const checks = { insideSafeZone, notInsideObstacle, distanceFromOtherPlayers, distanceFromObstacles, insideMapBounds };
      const ok = insideSafeZone && notInsideObstacle && distanceFromOtherPlayers && distanceFromObstacles && insideMapBounds;
      if (ok) { chosen = point; chosenChecks = checks; chosenReason = null; break; }
      if (chosenReason === 'noCandidate') { chosen = point; chosenChecks = checks; chosenReason = !insideSafeZone ? 'outsideSafeZone' : !insideMapBounds ? 'outsideMapBounds' : !notInsideObstacle ? 'insideObstacleCollision' : !distanceFromObstacles ? 'tooCloseToObstacle' : 'tooCloseToOtherPlayer'; }
    }
    const f: Fighter = { id: `f${i}`, charId: id, x: chosen.x, y: chosen.y, vx: 0, vy: 0, radius: d.bodyRadius, hp: d.maxHp * combatConfig.globalHpMultiplier, alive: true, isPlayer: i === 0, lastAttack: -99, lastSkill: -99, lastHitAt: -99, flashUntil: 0, fadeUntil: 0, facing: { x: 1, y: 0 }, status: { slowUntil: 0, stunUntil: 0, confuseUntil: 0, defenseUntil: 0, shieldUntil: 0, panicUntil: 0, speedUntil: 0 } };
    fighters.push(f);
    assignments.push({ fighterId: f.id, charId: f.charId, pointId: chosen.id, x: chosen.x, y: chosen.y, isPlayer: f.isPlayer, checks: chosenChecks, spawnRejectedReason: chosenReason });
    available.splice(available.findIndex((p) => p.id === chosen.id), 1);
  }
  (mkState as any).lastSpawnDebug = { points: candidateSpawnPoints, assignments, activePlayerPointId: assignments.find((a) => a.isPlayer)?.pointId ?? '' };
  return { fighters, obstacles, safeZone, projectiles: [], traps: [], devices: [], effects: [], time: 0, elapsed: 0, result: 'playing' };
}

export function GameCanvas({ character, onResult }: { character: CharacterId; onResult: (r: 'victory' | 'defeat') => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef(0);
  const gameRef = useRef<MutableGame | null>(null);
  const [hud, setHud] = useState({ hp: 0, max: 0, alive: 8, skill: 0, t: 0, out: false, name: '', icon: '' });
  const [debug, setDebug] = useState({ gameStarted: false, activePlayerId: '', activePlayerName: '', x: 0, y: 0, dx: 0, dy: 0, pressedKeys: '', deltaTime: 0, isMoving: false, cameraX: 0, cameraY: 0, updateTick: 0, renderTick: 0, autoMoveActive: false, beforeMoveX: 0, beforeMoveY: 0, afterMoveX: 0, afterMoveY: 0, beforeRenderX: 0, beforeRenderY: 0, attemptedNextX: 0, attemptedNextY: 0, movedDeltaX: 0, movedDeltaY: 0, collisionBlocked: false, collisionObstacleId: '', lastBlockedReason: '', blockedX: false, blockedY: false, clampBlocked: false, resetDetected: false, updateCalled: false, elapsedTime:0,averageHpPercent:0,firstDeathTime:-1,dps:0,separationCount:0,maxAttackersOnTarget:0,safeZoneRadius:0,safeZoneCenterX:0,safeZoneCenterY:0,outsideZoneOverlayAlpha:0,shrinkState:'shrinking' });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
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


  useEffect(() => {
    resetInputState();
    const state = mkState(character);
    const activePlayer = state.fighters.find((f) => f.isPlayer);
    gameRef.current = {
      state,
      activePlayerId: activePlayer?.id ?? state.fighters[0].id,
      camera: { x: 0, y: 0 },
      input: inputState,
      spawnDebug: (mkState as any).lastSpawnDebug,
      outsideZoneOverlayAlpha: 0,
      debugMove: { beforeMoveX: 0, beforeMoveY: 0, attemptedNextX: 0, attemptedNextY: 0, afterMoveX: 0, afterMoveY: 0, beforeRenderX: 0, beforeRenderY: 0, movedDeltaX: 0, movedDeltaY: 0, collisionBlocked: false, collisionObstacleId: '', lastBlockedReason: '', blockedX: false, blockedY: false, clampBlocked: false, resetDetected: false, updateCalled: false },
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
      const alive=game.state.fighters.filter((f)=>f.alive); const avgHp=alive.reduce((a,f)=>a+f.hp/(byId(f.charId).maxHp*combatConfig.globalHpMultiplier),0)/(alive.length||1); setDebug({ gameStarted: true, activePlayerId: game.activePlayerId, activePlayerName: def.nameKo, x: p.x, y: p.y, dx, dy, pressedKeys, deltaTime: dt, isMoving: Math.hypot(p.vx, p.vy) > 0.01, cameraX: game.camera.x, cameraY: game.camera.y, updateTick, renderTick, autoMoveActive: game.state.elapsed < 2, elapsedTime:game.state.elapsed, averageHpPercent:avgHp*100, firstDeathTime:(game.state as any).firstDeathTime??-1, dps:(game.state as any).dps??0,separationCount:(game.state as any).separationCount??0,maxAttackersOnTarget:(game.state as any).maxAttackersOnTarget??0,safeZoneRadius:game.state.safeZone.radius,safeZoneCenterX:game.state.safeZone.x,safeZoneCenterY:game.state.safeZone.y,outsideZoneOverlayAlpha:game.outsideZoneOverlayAlpha,shrinkState:game.state.safeZone.radius<=game.state.safeZone.minRadius?'minRadiusLocked':'shrinking', ...game.debugMove });
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
      <div>movedDelta ({debug.movedDeltaX.toFixed(2)}, {debug.movedDeltaY.toFixed(2)}) | collisionBlocked: {String(debug.collisionBlocked)} | obstacleId: {debug.collisionObstacleId || 'none'}</div>
      <div>lastBlockedReason: {debug.lastBlockedReason || 'none'} | blockedX: {String(debug.blockedX)} | blockedY: {String(debug.blockedY)} | clampBlocked: {String(debug.clampBlocked)} | resetDetected: {String(debug.resetDetected)}</div>
      <div>elapsed: {debug.elapsedTime.toFixed(1)}s | avgHp: {debug.averageHpPercent.toFixed(1)}% | firstDeath: {debug.firstDeathTime > 0 ? `${debug.firstDeathTime.toFixed(1)}s` : 'none'}</div>
      <div>dpsEvents: {debug.dps.toFixed(2)} | separation: {debug.separationCount} | maxAttackersOnTarget: {debug.maxAttackersOnTarget}</div>
      <div>safeZone center: ({debug.safeZoneCenterX.toFixed(1)}, {debug.safeZoneCenterY.toFixed(1)}) | radius: {debug.safeZoneRadius.toFixed(1)}</div>
      <div>outsideZone overlay alpha: {debug.outsideZoneOverlayAlpha.toFixed(3)} | shrinkState: {debug.shrinkState}</div>
      <div>spawn points: {gameRef.current?.spawnDebug.points.map((p) => `${p.id}(${p.x},${p.y})`).join(' | ')}</div>
      <div>activePlayer spawn point: {gameRef.current?.spawnDebug.activePlayerPointId}</div>
      {gameRef.current?.spawnDebug.assignments.map((a) => <div key={a.fighterId}>{a.fighterId}/{a.charId} @({a.x},{a.y}) checks safe={String(a.checks.insideSafeZone)} obstacle={String(a.checks.notInsideObstacle)} distPlayers={String(a.checks.distanceFromOtherPlayers)} distObs={String(a.checks.distanceFromObstacles)} insideMap={String(a.checks.insideMapBounds)} tooCloseToOthers={String(!a.checks.distanceFromOtherPlayers)} rejected={a.spawnRejectedReason ?? 'none'}</div>)}
    </div>}
    <canvas ref={cv} width={viewW} height={viewH} />
    {isTouchDevice && (
      <div className='mobile-controls'>
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
const combatConfig={globalDamageMultiplier:0.75,globalHpMultiplier:1.18,aiAttackAggression:0.78,startingGraceSeconds:1.8,maxMeleeAttackersPerTarget:2,separationStrength:0.55,knockbackStrength:7.5,spawnMinDistance:210,hitFlashDuration:0.15,basicKnockback:8.5,skillKnockback:13};
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
      else if (t) { f.targetId=t.id; const d=dist(f.x,f.y,t.x,t.y); const nx=(t.x-f.x)/(d||1), ny=(t.y-f.y)/(d||1); if (c.attackType === 'melee') {
          if (d>c.attackRange*0.95) { dx = t.x - f.x; dy = t.y - f.y; } else if (d < c.preferredCombatDistance*0.8) { dx = -nx*0.25; dy = -ny*0.25; } else { dx = -ny*0.45; dy = nx*0.45; }
        } else {
          if (d > c.preferredCombatDistance*1.15) { dx = t.x - f.x; dy = t.y - f.y; }
          else if (d < c.preferredCombatDistance*0.85) { dx = -nx; dy = -ny; }
          else { dx = -ny*0.5; dy = nx*0.5; }
        } if (Math.random() < 0.004) useSkill(s, f); if (d < c.attackRange+6) attack(s, f, hit); }
    }
    if (i.attackPressed && f.id === g.activePlayerId) attack(s, f, hit);
    if (i.skillPressed && f.id === g.activePlayerId) useSkill(s, f);
    const l = Math.hypot(dx, dy) || 1;
    let sp = c.baseMoveSpeed;
    if (f.status.slowUntil > s.time) sp *= .62;
    if (f.status.speedUntil > s.time) sp *= 1.3;
    f.vx = dx / l * sp;
    f.vy = dy / l * sp;

    const beforeMoveX = f.x;
    const beforeMoveY = f.y;
    let nextX = f.x + f.vx * dt;
    let nextY = f.y + f.vy * dt;
    let collisionBlocked = false;
    let blockedX = false;
    let blockedY = false;
    let blockedObstacleId = '';
    let clampBlocked = false;

    if (!debugDisableCollision) {
      for (const o of obstacles) {
        if (!o.solid) continue;
        const hitX = nextX > o.x - f.radius && nextX < o.x + o.w + f.radius && beforeMoveY > o.y - f.radius && beforeMoveY < o.y + o.h + f.radius;
        if (hitX) {
          blockedX = true;
          collisionBlocked = true;
          blockedObstacleId = blockedObstacleId || o.id;
          nextX = beforeMoveX;
        }
        const hitY = beforeMoveX > o.x - f.radius && beforeMoveX < o.x + o.w + f.radius && nextY > o.y - f.radius && nextY < o.y + o.h + f.radius;
        if (hitY) {
          blockedY = true;
          collisionBlocked = true;
          blockedObstacleId = blockedObstacleId || o.id;
          nextY = beforeMoveY;
        }
      }
    }

    const clampedX = clamp(nextX, f.radius, W - f.radius);
    const clampedY = clamp(nextY, f.radius, H - f.radius);
    if (clampedX !== nextX || clampedY !== nextY) clampBlocked = true;

    f.x = clampedX;
    f.y = clampedY;
    const intendedMove = Math.hypot(f.vx * dt, f.vy * dt);
    const actualMove = Math.hypot(f.x - beforeMoveX, f.y - beforeMoveY);
    if (collisionBlocked && intendedMove > 0.5 && actualMove < 0.1) {
      (f as any).stuckTimer = ((f as any).stuckTimer ?? 0) + dt;
      if ((f as any).stuckTimer > 0.55) {
        const push = 6;
        const jitterX = (Math.random() - 0.5) * push;
        const jitterY = (Math.random() - 0.5) * push;
        f.x = clamp(f.x + jitterX, f.radius, W - f.radius);
        f.y = clamp(f.y + jitterY, f.radius, H - f.radius);
        (f as any).recoveryApplied = true;
        (f as any).nearestValidPosition = { x: f.x, y: f.y };
        (f as any).stuckTimer = 0;
      }
    } else {
      (f as any).stuckTimer = 0;
      (f as any).recoveryApplied = false;
    }

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
      g.debugMove.collisionObstacleId = blockedObstacleId;
      g.debugMove.blockedX = blockedX;
      g.debugMove.blockedY = blockedY;
      g.debugMove.lastBlockedReason = collisionBlocked ? `obstacle:${blockedObstacleId || 'unknown'}` : (clampBlocked ? 'world-boundary' : 'none');
      g.debugMove.clampBlocked = clampBlocked;
      g.debugMove.resetDetected = false;
    }
    if (f.hp <= 0 && f.alive) { f.alive = false; f.fadeUntil=s.time+0.35; s.effects.push({x:f.x,y:f.y,r:24,ttl:0.35,kind:'death',ownerId:f.id}); }
  }

  let separationCount=0;
  for(let a=0;a<s.fighters.length;a++){for(let b=a+1;b<s.fighters.length;b++){const fa=s.fighters[a],fb=s.fighters[b]; if(!fa.alive||!fb.alive) continue; const dx=fb.x-fa.x,dy=fb.y-fa.y; let d=Math.hypot(dx,dy); const minD=fa.radius+fb.radius; if(d<minD){separationCount++; if(d<0.001){d=0.001;} const nx=dx/d,ny=dy/d; const overlap=(minD-d)*combatConfig.separationStrength; fa.x=clamp(fa.x-nx*overlap*0.5,fa.radius,W-fa.radius); fa.y=clamp(fa.y-ny*overlap*0.5,fa.radius,H-fa.radius); fb.x=clamp(fb.x+nx*overlap*0.5,fb.radius,W-fb.radius); fb.y=clamp(fb.y+ny*overlap*0.5,fb.radius,H-fb.radius);}}}
  (s as any).separationCount=separationCount;
  const attackersCount=new Map<string,number>(); s.fighters.forEach(f=>{if(f.alive&&f.targetId){attackersCount.set(f.targetId,(attackersCount.get(f.targetId)||0)+1);}}); (s as any).maxAttackersOnTarget=Math.max(0,...attackersCount.values());
  const dead=s.fighters.find(f=>!f.alive); if(dead && (s as any).firstDeathTime===undefined){(s as any).firstDeathTime=s.elapsed;}
  s.effects = s.effects.filter((e:any) => { e.ttl -= dt; if(e.kind==='dmg'){e.y += (e.vy||-14)*dt;} return e.ttl>0; });
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
  t.lastHitAt=now; t.flashUntil=now+combatConfig.hitFlashDuration;
  const finalDamage=d*combatConfig.globalDamageMultiplier*reduced;
  t.hp -= finalDamage;
  if (t.hp <= 0 && src) {
    (src as any).killCount = ((src as any).killCount ?? 0) + 1;
    const kills = (src as any).killCount;
    (src as any).damageMultiplier = Math.min(1.28, 1 + kills * 0.04);
    (src as any).level = 1 + Math.floor(kills / 2);
    src.hp = Math.min(byId(src.charId).maxHp * combatConfig.globalHpMultiplier, src.hp + 14);
    src.lastSkill -= Math.min(0.18, kills * 0.03);
  }
  s.effects.push({ x: t.x, y: t.y, r: 14, ttl: .22, kind: 'hit', ownerId: t.id });
  (s.effects as any).push({x:t.x+(Math.random()-0.5)*18,y:t.y-12,r:0,ttl:0.65,kind:'dmg',ownerId:t.id,text:`${Math.round(finalDamage)}`,crit:finalDamage>20,vy:-18});
  if((s.effects as any).length>MAX_FLOATING_TEXT){(s.effects as any).splice(0,(s.effects as any).length-MAX_FLOATING_TEXT);}
  if(src){const dx=t.x-src.x,dy=t.y-src.y,l=Math.hypot(dx,dy)||1; const kb=(d>byId(src.charId).attackPower*1.15?combatConfig.skillKnockback:combatConfig.basicKnockback); t.x=clamp(t.x+dx/l*kb,t.radius,W-t.radius); t.y=clamp(t.y+dy/l*kb,t.radius,H-t.radius);} 
}
function attack(s: GameState, f: Fighter, hit: () => void) { const c = byId(f.charId); if (s.time < combatConfig.startingGraceSeconds || s.time - f.lastAttack < c.attackCooldown) return; const attackers=s.fighters.filter(x=>x.alive&&x.id!==f.id&&x.targetId===f.targetId&&dist(x.x,x.y,f.x,f.y)<byId(x.charId).attackRange+8).length; if(c.attackType==='melee' && attackers>combatConfig.maxMeleeAttackersPerTarget) return; f.lastAttack = s.time; s.effects.push({ x: f.x, y: f.y, r: c.attackRange, ttl: .12, kind: 'attack', ownerId: f.id }); const dmg = c.attackPower * ((f as any).damageMultiplier ?? 1); s.fighters.forEach((t) => { if (t.alive && t.id !== f.id && dist(f.x, f.y, t.x, t.y) < c.attackRange + t.radius) { damage(s, t, dmg, f); hit(); } }); }
function useSkill(s: GameState, f: Fighter) { const c = byId(f.charId); if (s.time < combatConfig.startingGraceSeconds || s.time - f.lastSkill < c.skillCooldown) return; f.lastSkill = s.time; const near = s.fighters.filter((t) => t.alive && t.id !== f.id && dist(f.x, f.y, t.x, t.y) < 190); const k = c.id; s.effects.push({ x: f.x, y: f.y, r: 110, ttl: 1.1, kind: k, ownerId: f.id }); if (k === 'juwon') { near.forEach((t) => t.status.slowUntil = s.time + 2.5); f.status.shieldUntil=s.time+1.8; } if (k === 'kyungmin') { near.forEach((t) => damage(s, t, c.skillPower, f)); } if (k === 'hyunjun') { near.forEach((t) => t.status.confuseUntil = s.time + 2.2); } if (k === 'chanyoung') { f.hp = Math.min(byId(f.charId).maxHp*combatConfig.globalHpMultiplier, f.hp + c.skillPower); } if (k === 'hyowon') { near.forEach((t) => { damage(s, t, c.skillPower*0.8, f); t.status.stunUntil = s.time + 0.45; }); } if (k === 'dongha') { near.forEach((t) => t.status.slowUntil = s.time + 1.6); } if (k === 'heesun') { const t = near.sort((a,b)=>dist(f.x,f.y,a.x,a.y)-dist(f.x,f.y,b.x,b.y))[0]; if (t) damage(s, t, c.skillPower, f); } if (k === 'soeun') { near.forEach((t) => { damage(s, t, c.skillPower*0.7, f); t.status.panicUntil = s.time + 2; }); } }
function draw(g: MutableGame, can: HTMLCanvasElement, shake: number) { const ctx = can.getContext('2d')!; const s = g.state; const p = getActivePlayer(g); const targetCamX = clamp(p.x - viewW / 2, 0, W - viewW); const targetCamY = clamp(p.y - viewH / 2, 0, H - viewH); g.camera.x += (targetCamX-g.camera.x)*0.14; g.camera.y += (targetCamY-g.camera.y)*0.14; const camX = g.camera.x + Math.random() * shake - shake / 2; const camY = g.camera.y + Math.random() * shake - shake / 2; ctx.clearRect(0, 0, viewW, viewH); const grad=ctx.createLinearGradient(0,0,0,viewH); grad.addColorStop(0,'#1a2436'); grad.addColorStop(1,'#141c2d'); ctx.fillStyle = grad; ctx.fillRect(0,0,viewW,viewH);
for(let gx=-Math.floor(camX%80);gx<viewW;gx+=80){ctx.strokeStyle='rgba(255,255,255,.04)';ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,viewH);ctx.stroke();}
arenaZones.forEach((z)=>{const zx=z.x-camX,zy=z.y-camY;ctx.fillStyle=z.tone;ctx.fillRect(zx,zy,z.w,z.h);ctx.strokeStyle='rgba(255,255,255,.08)';ctx.strokeRect(zx,zy,z.w,z.h);ctx.fillStyle='rgba(223,237,255,.35)';ctx.fillText(z.label,zx+10,zy+20);});
arenaDecorations.forEach((d)=>{ctx.fillStyle=d.color;ctx.fillRect(d.x-camX,d.y-camY,d.w,d.h);});
obstacles.forEach((o) => { const ox=o.x-camX, oy=o.y-camY; ctx.fillStyle = o.color; ctx.fillRect(ox, oy, o.w, o.h); ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(ox+4,oy+4,o.w-8,Math.min(10,o.h*0.25)); ctx.strokeStyle='rgba(0,0,0,.42)'; ctx.strokeRect(ox,oy,o.w,o.h); ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=8;ctx.strokeRect(ox+1,oy+1,o.w-2,o.h-2);ctx.shadowBlur=0; });
const zoneX = s.safeZone.x - camX;
const zoneY = s.safeZone.y - camY;
const maxZoneDist = Math.max(viewW, viewH) * 1.25;
const outsideOverlay = ctx.createRadialGradient(zoneX, zoneY, s.safeZone.radius * 0.82, zoneX, zoneY, s.safeZone.radius + maxZoneDist);
outsideOverlay.addColorStop(0, 'rgba(14,23,38,0)');
outsideOverlay.addColorStop(0.08, 'rgba(14,23,38,0.02)');
outsideOverlay.addColorStop(0.23, 'rgba(16,26,45,0.08)');
outsideOverlay.addColorStop(0.48, 'rgba(16,29,53,0.16)');
outsideOverlay.addColorStop(1, 'rgba(11,18,33,0.24)');
ctx.fillStyle = outsideOverlay;
ctx.fillRect(0, 0, viewW, viewH);
g.outsideZoneOverlayAlpha = 0.24;
const pulse = 0.82 + Math.sin(s.time * 3.2) * 0.18;
ctx.strokeStyle = '#8fd6ff';
ctx.shadowColor='rgba(99,188,255,0.95)';
ctx.shadowBlur=18 * pulse;
ctx.lineWidth = 3.2;
ctx.beginPath();
ctx.arc(zoneX, zoneY, s.safeZone.radius, 0, Math.PI * 2);
ctx.stroke();
ctx.strokeStyle = 'rgba(185,232,255,0.5)';
ctx.shadowBlur = 8 * pulse;
ctx.lineWidth = 1.4;
ctx.beginPath();
ctx.arc(zoneX, zoneY, s.safeZone.radius + 4, 0, Math.PI * 2);
ctx.stroke();
ctx.shadowBlur=0;
for (const e of s.effects as any[]) { if(e.kind==='dmg'){ctx.globalAlpha=Math.max(0,e.ttl/0.65); ctx.fillStyle=e.crit?'#ffd55c':'#ffffff'; ctx.font=e.crit?'bold 17px Inter':'bold 14px Inter'; ctx.fillText(e.text,e.x-camX,e.y-camY); ctx.globalAlpha=1; continue;} ctx.strokeStyle = e.kind === 'hit' ? '#fff' : e.kind === 'death' ? '#ffd0c0' : '#73b8ff'; ctx.globalAlpha=Math.max(0,e.ttl); ctx.beginPath(); ctx.arc(e.x - camX, e.y - camY, e.r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha=1; }
for (const f of s.fighters) { if (!f.alive) continue; const c = byId(f.charId); const hpRate=Math.max(0,f.hp/(byId(f.charId).maxHp*combatConfig.globalHpMultiplier)); if(s.time<f.flashUntil){ctx.fillStyle='rgba(255,140,140,.95)';}else{ctx.fillStyle = c.fallbackColor;} ctx.beginPath(); ctx.arc(f.x - camX, f.y - camY, f.radius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#111'; ctx.fillText(idIcon[c.id], f.x - camX - 7, f.y - camY + 4); ctx.fillStyle='#dbe5ff'; ctx.fillText(c.nameKo, f.x - camX - 20, f.y - camY - f.radius - 10); ctx.fillStyle = '#1e2230'; ctx.fillRect(f.x - camX - 24, f.y - camY + f.radius + 6, 48, 6); ctx.fillStyle='#5e667d'; ctx.fillRect(f.x - camX - 24, f.y - camY + f.radius + 6, 48*Math.min(1,(f as any).trailHpRate??hpRate),6); (f as any).trailHpRate=((f as any).trailHpRate??hpRate)+(hpRate-((f as any).trailHpRate??hpRate))*0.15; ctx.fillStyle = hpRate<0.3?'#ff5d5d':'#59de72'; ctx.fillRect(f.x - camX - 24, f.y - camY + f.radius + 6, 48 * hpRate, 6); }
ctx.beginPath(); ctx.strokeStyle = '#ffcf5e'; ctx.lineWidth = 2; ctx.arc(p.x - camX, p.y - camY, p.radius+4, 0, Math.PI * 2); ctx.stroke(); const debugMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1'; if (debugMode) {ctx.strokeStyle='rgba(255,80,80,.75)';ctx.lineWidth=2;obstacles.filter(o=>o.solid).forEach((o)=>ctx.strokeRect(o.x-camX,o.y-camY,o.w,o.h));ctx.strokeStyle='rgba(80,220,255,.85)';ctx.beginPath();ctx.arc(p.x-camX,p.y-camY,p.radius,0,Math.PI*2);ctx.stroke();} }

function circleRectDistance(cx:number,cy:number,r:Obstacle){const nx=clamp(cx,r.x,r.x+r.w); const ny=clamp(cy,r.y,r.y+r.h); return dist(cx,cy,nx,ny);}

function circleIntersectsRect(cx:number,cy:number,r:number,rect:Obstacle){return circleRectDistance(cx,cy,rect)<r;}

'use client';
import { useEffect, useRef, useState } from 'react';
import { byId } from '@/game/characters';
import { inputState, resetInputState, setActionPressed, setKeyboardMovement } from '@/game/input';
import { CharacterId } from '@/game/types';
import { draw, getLocalPlayer, idIcon, mkState, MutableGame, tick , dist } from '@/game/core';
import { WORLD } from '@/game/world';

export function GameCanvas({ character, onResult }: { character: CharacterId; onResult: (r: 'victory' | 'defeat') => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const shakeRef = useRef(0);
  const gameRef = useRef<MutableGame | null>(null);
  const [hud, setHud] = useState({ hp: 0, max: 0, alive: 8, skill: 0, t: 0, out: false, name: '', icon: '' });

  useEffect(() => {
    resetInputState();
    const state = mkState(character);
    const local = state.fighters.find((f) => f.isPlayer);
    gameRef.current = { state, localPlayerId: local?.id ?? state.fighters[0].id, camera: { x: 0, y: 0 }, input: inputState, outsideZoneOverlayAlpha: 0, debugMove: {}, spawnDebug: {} };

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
    let last = performance.now();
    const loop = (now: number) => {
      if (!gameRef.current || !cv.current) return;
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const game = gameRef.current;
      game.state.time += dt;
      game.state.elapsed += dt;
      tick(game, dt, () => { shakeRef.current = 4; });
      draw(game, cv.current, shakeRef.current);
      const p = getLocalPlayer(game);
      const def = byId(p.charId);
      setHud({ hp: Math.max(0, p.hp), max: def.maxHp, alive: game.state.fighters.filter((f) => f.alive).length, skill: Math.max(0, def.skillCooldown - (game.state.time - p.lastSkill)), t: game.state.elapsed, out: dist(p.x, p.y, game.state.safeZone.x, game.state.safeZone.y) > game.state.safeZone.radius, name: def.nameKo, icon: idIcon[def.id] });
      if (game.state.result !== 'playing') { onResult(game.state.result); return; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); resetInputState(); gameRef.current = null; };
  }, [character, onResult]);

  return <div className='game-wrap gameplay-touch-lock'>
    <div className='hud-main'>
      <div className='player-panel'>
        <div className='player-row'>{hud.icon} <b>{hud.name}</b> <span>HP {hud.hp.toFixed(0)}/{hud.max}</span></div>
        <div className='hpbar'><i style={{ width: `${(hud.hp / hud.max) * 100}%` }} /></div>
        <small>기본공격 SPACE | 스킬 E ({hud.skill.toFixed(1)}s)</small>
      </div>
      <div className='top-panel'><span>생존 {hud.alive}</span><span>{hud.t.toFixed(0)}s</span>{hud.out && <span className='warn'>⚠ 안전지대 밖</span>}</div>
    </div>
    <canvas ref={cv} width={WORLD.viewWidth} height={WORLD.viewHeight} />
  </div>;
}

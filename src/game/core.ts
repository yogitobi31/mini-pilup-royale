import { byId, CHARACTERS } from './characters';
import { CharacterId, Fighter, GameState, InputState, Obstacle } from './types';
import { arenaDecorations, arenaZones, obstacles, WORLD } from './world';

export const idIcon: Record<CharacterId, string> = { juwon: '🔔', kyungmin: '🎵', hyunjun: '❓', chanyoung: '🙂', hyowon: '🪤', dongha: '⚙️', heesun: '✏️', soeun: '🐞' };
const MAX_FLOATING_TEXT = 42;
export const combatConfig={globalDamageMultiplier:0.75,globalHpMultiplier:1.18,aiAttackAggression:0.78,startingGraceSeconds:1.8,maxMeleeAttackersPerTarget:2,separationStrength:0.55,knockbackStrength:7.5,spawnMinDistance:210,hitFlashDuration:0.15,basicKnockback:8.5,skillKnockback:13};
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const dist = (x: number, y: number, x2: number, y2: number) => Math.hypot(x - x2, y - y2);

export type MutableGame = { state: GameState; localPlayerId: string; camera:{x:number;y:number}; input: InputState; outsideZoneOverlayAlpha:number; debugMove:any; spawnDebug:any; };

export const getLocalPlayer = (g: MutableGame) => g.state.fighters.find((f) => f.id === g.localPlayerId) ?? g.state.fighters[0];

export function mkState(playerId: CharacterId): GameState { /* simplified from existing */
 const ids=CHARACTERS.map(c=>c.id); const order=[playerId,...ids.filter(i=>i!==playerId)]; const safeZone={x:WORLD.width/2,y:WORLD.height/2,radius:920,minRadius:170,shrinkPerSec:3.6,tick:0};
 const points=[{id:'center-nw',x:930,y:640},{id:'center-ne',x:1470,y:640},{id:'center-sw',x:930,y:950},{id:'center-se',x:1470,y:950},{id:'north-west',x:620,y:460},{id:'north-east',x:1780,y:460},{id:'south-west',x:620,y:1160},{id:'south-east',x:1780,y:1160}];
 const fighters:Fighter[]=[]; const available=[...points];
 for(let i=0;i<order.length;i++){const id=order[i];const d=byId(id);const chosen=available[0];const f:Fighter={id:`f${i}`,charId:id,x:chosen.x,y:chosen.y,vx:0,vy:0,radius:d.bodyRadius,hp:d.maxHp*combatConfig.globalHpMultiplier,alive:true,isPlayer:i===0,playerType:i===0?'local-human':'ai',lastAttack:-99,lastSkill:-99,lastHitAt:-99,flashUntil:0,fadeUntil:0,facing:{x:1,y:0},status:{slowUntil:0,stunUntil:0,confuseUntil:0,defenseUntil:0,shieldUntil:0,panicUntil:0,speedUntil:0}};fighters.push(f);available.splice(0,1);} return {fighters,obstacles,safeZone,projectiles:[],traps:[],devices:[],effects:[],time:0,elapsed:0,result:'playing'};
}
function pickTarget(s: GameState, actor: Fighter) {
 const alive=s.fighters.filter(p=>p.alive&&p.id!==actor.id);
 if(!alive.length) return undefined;
 const focusedCount:Record<string,number>={};
 for(const f of s.fighters){ if(!f.alive||f.id===actor.id||!f.targetId) continue; focusedCount[f.targetId]=(focusedCount[f.targetId]??0)+1; }
 return alive.sort((a,b)=> (dist(actor.x,actor.y,a.x,a.y)+((focusedCount[a.id]??0)*40))-(dist(actor.x,actor.y,b.x,b.y)+((focusedCount[b.id]??0)*40)))[0];
}

export function tick(g: MutableGame, dt: number, hit: () => void) { /* keep behavior mostly same */
 const s=g.state,i=g.input; if(!Number.isFinite(dt)||dt<=0) return; s.safeZone.radius=Math.max(s.safeZone.minRadius,s.safeZone.radius-s.safeZone.shrinkPerSec*dt); s.safeZone.tick+=dt;
 g.debugMove={...(g.debugMove??{}),gameMode:'singleplayer',localPlayerId:g.localPlayerId,damageEvents:g.debugMove?.damageEvents??[],aiVsAiDamage:g.debugMove?.aiVsAiDamage??0,aiVsLocalDamage:g.debugMove?.aiVsLocalDamage??0};
 for(let idx=0;idx<s.fighters.length;idx++){const f=s.fighters[idx];if(!f.alive)continue;const c=byId(f.charId);let dx=0,dy=0;if(f.id===g.localPlayerId){const hasAnalog=Math.hypot(i.analogX,i.analogY)>0;dx=hasAnalog?i.analogX:(i.right?1:0)-(i.left?1:0);dy=hasAnalog?i.analogY:(i.down?1:0)-(i.up?1:0);} else {
 const needRetarget=!f.targetId || (Math.floor(s.time*2)%2===0);
 if(needRetarget){ f.targetId=pickTarget(s,f)?.id; }
 const t=s.fighters.find(x=>x.id===f.targetId&&x.alive) ?? pickTarget(s,f);
 if(t){f.targetId=t.id; const d=dist(f.x,f.y,t.x,t.y); const desired=c.preferredCombatDistance; const isRanged=c.attackType==='ranged';
 if(d>desired){dx=t.x-f.x;dy=t.y-f.y;} else if(isRanged&&d<Math.max(28,desired-10)){dx=f.x-t.x;dy=f.y-t.y;}
 if(d<c.attackRange+6) attack(g,s,f,t,hit);}
 }
 if(i.attackPressed&&f.id===g.localPlayerId) attack(g,s,f,undefined,hit); if(i.skillPressed&&f.id===g.localPlayerId) useSkill(s,f); const l=Math.hypot(dx,dy)||1; f.vx=dx/l*c.baseMoveSpeed; f.vy=dy/l*c.baseMoveSpeed; f.x=clamp(f.x+f.vx*dt,f.radius,WORLD.width-f.radius); f.y=clamp(f.y+f.vy*dt,f.radius,WORLD.height-f.radius); if(f.hp<=0&&f.alive){f.alive=false;}}
 g.debugMove.aiCount=s.fighters.filter(f=>f.alive&&f.id!==g.localPlayerId).length;
 g.debugMove.aliveCount=s.fighters.filter(f=>f.alive).length;
 g.debugMove.aiStates=s.fighters.filter(f=>f.alive&&f.id!==g.localPlayerId).map(f=>({id:f.id,targetId:f.targetId,state:f.targetId?'chase':'idle'}));
 g.debugMove.moveSpeeds=s.fighters.map(f=>({id:f.id,moveSpeed:byId(f.charId).baseMoveSpeed}));
 const p=getLocalPlayer(g); if(!p.alive) s.result='defeat'; const alive=s.fighters.filter(f=>f.alive); if(alive.length===1&&alive[0].id===g.localPlayerId) s.result='victory';
}
function damage(s: GameState, t: Fighter, d: number) { t.hp -= d*combatConfig.globalDamageMultiplier; s.effects.push({x:t.x,y:t.y,r:14,ttl:.22,kind:'hit',ownerId:t.id}); if((s.effects as any).length>MAX_FLOATING_TEXT){(s.effects as any).splice(0,1);} }
function attack(g: MutableGame, s: GameState, f: Fighter, preferredTarget: Fighter|undefined, hit:()=>void) { const c=byId(f.charId); if(s.time-f.lastAttack<c.attackCooldown) return; f.lastAttack=s.time; s.fighters.forEach(t=>{ if(t.alive&&t.id!==f.id&&dist(f.x,f.y,t.x,t.y)<c.attackRange+t.radius && (!preferredTarget || preferredTarget.id===t.id || c.attackType==='melee')){damage(s,t,c.attackPower); const aiAttacker=f.id!==g.localPlayerId; const vsLocal=t.id===g.localPlayerId; if(aiAttacker&&vsLocal) g.debugMove.aiVsLocalDamage+=1; if(aiAttacker&&!vsLocal) g.debugMove.aiVsAiDamage+=1; g.debugMove.damageEvents.push({time:s.time,from:f.id,to:t.id,amount:c.attackPower}); if(g.debugMove.damageEvents.length>30) g.debugMove.damageEvents.shift(); hit();}}); }
function useSkill(s: GameState, f: Fighter) { const c=byId(f.charId); if(s.time-f.lastSkill<c.skillCooldown) return; f.lastSkill=s.time; s.fighters.forEach(t=>{ if(t.alive&&t.id!==f.id&&dist(f.x,f.y,t.x,t.y)<190) damage(s,t,c.skillPower*0.7);}); }

export function draw(g: MutableGame, can: HTMLCanvasElement, shake: number) { const ctx=can.getContext('2d')!; const s=g.state; const p=getLocalPlayer(g); const camX=clamp(p.x-WORLD.viewWidth/2,0,WORLD.width-WORLD.viewWidth); const camY=clamp(p.y-WORLD.viewHeight/2,0,WORLD.height-WORLD.viewHeight); g.camera.x=camX; g.camera.y=camY; ctx.clearRect(0,0,WORLD.viewWidth,WORLD.viewHeight); ctx.fillStyle='#141c2d'; ctx.fillRect(0,0,WORLD.viewWidth,WORLD.viewHeight); arenaZones.forEach(z=>{ctx.fillStyle=z.tone;ctx.fillRect(z.x-camX,z.y-camY,z.w,z.h)}); arenaDecorations.forEach(d=>{ctx.fillStyle=d.color;ctx.fillRect(d.x-camX,d.y-camY,d.w,d.h)}); obstacles.forEach(o=>{ctx.fillStyle=o.color;ctx.fillRect(o.x-camX,o.y-camY,o.w,o.h)}); for(const f of s.fighters){if(!f.alive)continue; const c=byId(f.charId); ctx.fillStyle=c.fallbackColor; ctx.beginPath(); ctx.arc(f.x-camX,f.y-camY,f.radius,0,Math.PI*2); ctx.fill(); ctx.fillText(idIcon[c.id],f.x-camX-7,f.y-camY+4);} ctx.strokeStyle='#ffcf5e';ctx.beginPath();ctx.arc(p.x-camX,p.y-camY,p.radius+4,0,Math.PI*2);ctx.stroke(); }

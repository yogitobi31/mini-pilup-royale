export type CharacterId = 'juwon'|'kyungmin'|'hyunjun'|'chanyoung'|'hyowon'|'dongha'|'heesun'|'soeun';
export interface CharacterDefinition {id: CharacterId; nameKo:string; nameEn:string; role:string; maxHp:number; speed:number; attackPower:number; attackRange:number; attackCooldown:number; skillNameKorean:string; skillNameEnglish:string; skillCooldown:number; skillDescription:string; gameplayEffect:string; fallbackColor:string; spritePath:string; portraitPath:string; motif:string; }
export interface Fighter {id:string; charId:CharacterId; x:number;y:number;vx:number;vy:number;radius:number;hp:number;alive:boolean;isPlayer:boolean;lastAttack:number;lastSkill:number;facing:{x:number;y:number};status:{slowUntil:number;stunUntil:number;confuseUntil:number;defenseUntil:number;shieldUntil:number;panicUntil:number;speedUntil:number};}
export interface Obstacle {x:number;y:number;w:number;h:number;label:string;color:string;solid:boolean;}
export interface SafeZone {x:number;y:number;radius:number;minRadius:number;shrinkPerSec:number;tick:number;}
export interface Projectile {x:number;y:number;vx:number;vy:number;r:number;ownerId:string;ttl:number;dmg:number;color:string;}
export interface Trap {x:number;y:number;r:number;ownerId:string;ttl:number;}
export interface Device {x:number;y:number;r:number;ownerId:string;kind:'spring'|'slow'|'snack'|'drone';ttl:number;}
export interface SkillEffect {x:number;y:number;r:number;ttl:number;kind:string;ownerId:string;}
export interface InputState {
  up:boolean;
  down:boolean;
  left:boolean;
  right:boolean;
  analogX:number;
  analogY:number;
  attackPressed:boolean;
  skillPressed:boolean;
}
export interface GameState {fighters:Fighter[];obstacles:Obstacle[];safeZone:SafeZone;projectiles:Projectile[];traps:Trap[];devices:Device[];effects:SkillEffect[];time:number;elapsed:number;result:'playing'|'victory'|'defeat';}

import { Obstacle } from './types';

export const WORLD = { width: 2400, height: 1600, viewWidth: 1000, viewHeight: 620 };

export type ArenaZone = { id: string; x: number; y: number; w: number; h: number; label: string; tone: string };
export type ArenaObstacle = Obstacle & { id: string; type: 'wall' | 'desk' | 'locker' | 'pillar' | 'bench' | 'board' | 'chairCluster' | 'teacherDesk' | 'bookshelf' | 'partition'; blocks: boolean };

export const arenaZones: ArenaZone[] = [
  { id: 'hallway-north', x: 260, y: 160, w: 1880, h: 280, label: '북측 복도', tone: '#273956' },
  { id: 'classroom-center', x: 860, y: 470, w: 680, h: 470, label: '중앙 교실', tone: '#1f3046' },
  { id: 'hallway-south', x: 220, y: 1030, w: 1960, h: 360, label: '남측 복도', tone: '#293850' },
  { id: 'safe-core', x: 980, y: 600, w: 380, h: 220, label: '안전지대 코어', tone: '#244661' },
];

export const arenaDecorations = [
  { id:'tile-north', x: 300, y: 300, w: 1800, h: 4, color: 'rgba(180,209,255,0.08)' },
  { id:'tile-south', x: 300, y: 1120, w: 1800, h: 4, color: 'rgba(180,209,255,0.08)' },
  { id:'safe-core-mark', x: 1050, y: 560, w: 300, h: 2, color: 'rgba(255,255,255,0.11)' },
  { id:'poster-east', x: 1930, y: 520, w: 80, h: 30, color: 'rgba(255,245,200,0.22)', label:'POSTER' },
  { id:'mat-lounge', x: 520, y: 1240, w: 200, h: 60, color: 'rgba(105,145,188,0.18)', label:'LOUNGE' },
];

export const obstacles: ArenaObstacle[] = [
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

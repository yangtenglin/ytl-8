import {
  Production,
  Scene,
  Role,
  Prop,
  Actor,
  AvailabilitySlot,
  RehearsalRoom,
} from '../types';
import { generateId } from '../utils/time';

const prodId1 = generateId();
const prodId2 = generateId();

export const sampleProductions: Production[] = [
  {
    id: prodId1,
    title: '雷雨',
    description: '曹禺经典四幕悲剧，讲述周公馆两代人的恩怨纠葛',
    createdAt: new Date().toISOString(),
  },
  {
    id: prodId2,
    title: '茶馆',
    description: '老舍经典三幕话剧，展现裕泰茶馆的时代变迁',
    createdAt: new Date().toISOString(),
  },
];

const role1 = generateId();
const role2 = generateId();
const role3 = generateId();
const role4 = generateId();
const role5 = generateId();
const role6 = generateId();

export const sampleRoles: Role[] = [
  { id: role1, productionId: prodId1, name: '周朴园', description: '55岁，煤矿公司董事长' },
  { id: role2, productionId: prodId1, name: '繁漪', description: '35岁，周朴园之妻' },
  { id: role3, productionId: prodId1, name: '周萍', description: '28岁，周朴园长子' },
  { id: role4, productionId: prodId1, name: '四凤', description: '18岁，侍女' },
  { id: role5, productionId: prodId1, name: '鲁侍萍', description: '47岁，鲁贵之妻' },
  { id: role6, productionId: prodId1, name: '鲁大海', description: '27岁，煤矿工人代表' },
];

const prop1 = generateId();
const prop2 = generateId();
const prop3 = generateId();
const prop4 = generateId();

export const sampleProps: Prop[] = [
  { id: prop1, productionId: prodId1, name: '真皮沙发', totalQuantity: 1, barcode: 'PROP-001', location: '道具仓A区', description: '欧式古典真皮三人沙发', createdAt: new Date().toISOString() },
  { id: prop2, productionId: prodId1, name: '紫檀木桌', totalQuantity: 1, barcode: 'PROP-002', location: '道具仓A区', description: '民国风紫檀木八仙桌', createdAt: new Date().toISOString() },
  { id: prop3, productionId: prodId1, name: '台灯', totalQuantity: 4, barcode: 'PROP-003', location: '道具仓B区', description: '复古绿玻璃罩台灯', createdAt: new Date().toISOString() },
  { id: prop4, productionId: prodId1, name: '折扇', totalQuantity: 6, barcode: 'PROP-004', location: '道具仓C区', description: '素白纸折扇', createdAt: new Date().toISOString() },
];

const scene1 = generateId();
const scene2 = generateId();
const scene3 = generateId();
const scene4 = generateId();

export const sampleScenes: Scene[] = [
  {
    id: scene1,
    productionId: prodId1,
    name: '第一幕',
    durationMinutes: 45,
    sequence: 1,
    roleIds: [role1, role2, role3, role4],
    propIds: [prop1, prop2, prop3],
    dependsOnSceneIds: [],
  },
  {
    id: scene2,
    productionId: prodId1,
    name: '第二幕',
    durationMinutes: 50,
    sequence: 2,
    roleIds: [role2, role3, role5, role4],
    propIds: [prop1, prop3],
    dependsOnSceneIds: [scene1],
  },
  {
    id: scene3,
    productionId: prodId1,
    name: '第三幕',
    durationMinutes: 40,
    sequence: 3,
    roleIds: [role4, role5, role6, role3],
    propIds: [prop2, prop4],
    dependsOnSceneIds: [scene2],
  },
  {
    id: scene4,
    productionId: prodId1,
    name: '第四幕',
    durationMinutes: 55,
    sequence: 4,
    roleIds: [role1, role2, role3, role5, role4, role6],
    propIds: [prop1, prop2, prop3, prop4],
    dependsOnSceneIds: [scene3],
  },
];

const actor1 = generateId();
const actor2 = generateId();
const actor3 = generateId();
const actor4 = generateId();
const actor5 = generateId();
const actor6 = generateId();

export const sampleActors: Actor[] = [
  {
    id: actor1,
    name: '张建国',
    contact: '13800138001',
    roleAssignments: [{ roleId: role1, productionId: prodId1 }],
  },
  {
    id: actor2,
    name: '李玉梅',
    contact: '13800138002',
    roleAssignments: [{ roleId: role2, productionId: prodId1 }],
  },
  {
    id: actor3,
    name: '王海涛',
    contact: '13800138003',
    roleAssignments: [{ roleId: role3, productionId: prodId1 }],
  },
  {
    id: actor4,
    name: '陈小雨',
    contact: '13800138004',
    roleAssignments: [{ roleId: role4, productionId: prodId1 }],
  },
  {
    id: actor5,
    name: '刘芳',
    contact: '13800138005',
    roleAssignments: [{ roleId: role5, productionId: prodId1 }],
  },
  {
    id: actor6,
    name: '赵强',
    contact: '13800138006',
    roleAssignments: [{ roleId: role6, productionId: prodId1 }],
  },
];

function createAvailabilitySlot(
  actorId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  type: 'available' | 'unavailable' | 'preferred' = 'available'
): AvailabilitySlot {
  return {
    id: generateId(),
    actorId,
    dayOfWeek: dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    startTime,
    endTime,
    type,
  };
}

export const sampleAvailability: AvailabilitySlot[] = [
  ...[actor1, actor2, actor3, actor4, actor5, actor6].flatMap((actorId) => [
    createAvailabilitySlot(actorId, 1, '18:00', '22:00', 'preferred'),
    createAvailabilitySlot(actorId, 2, '18:00', '22:00', 'preferred'),
    createAvailabilitySlot(actorId, 3, '18:00', '22:00', 'available'),
    createAvailabilitySlot(actorId, 4, '18:00', '22:00', 'preferred'),
    createAvailabilitySlot(actorId, 5, '18:00', '22:00', 'available'),
    createAvailabilitySlot(actorId, 6, '10:00', '12:00', 'available'),
    createAvailabilitySlot(actorId, 6, '14:00', '18:00', 'preferred'),
    createAvailabilitySlot(actorId, 0, '14:00', '18:00', 'available'),
  ]),
  createAvailabilitySlot(actor3, 2, '18:00', '22:00', 'unavailable'),
  createAvailabilitySlot(actor4, 4, '18:00', '20:00', 'unavailable'),
];

const room1 = generateId();
const room2 = generateId();

export const sampleRooms: RehearsalRoom[] = [
  { id: room1, name: 'A排练厅', capacity: 20 },
  { id: room2, name: 'B排练厅', capacity: 10 },
];

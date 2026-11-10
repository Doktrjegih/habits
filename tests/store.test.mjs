import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, setEntry, getEntry, dailyStats, removeHabit, shiftDate, validateState } from '../src/store.js';
const fixture=()=>({...emptyState(),habits:[{id:'one',name:'Read',emoji:'📖',goal:20,created:'2026-01-01'}]});
test('completion and time are independent and isolated by date',()=>{const s=fixture();setEntry(s,'2026-01-02','one',{minutes:35});assert.equal(getEntry(s,'2026-01-02','one').done,false);setEntry(s,'2026-01-02','one',{done:true});assert.deepEqual(dailyStats(s,'2026-01-02'),{total:1,done:1,minutes:35});assert.deepEqual(dailyStats(s,'2026-01-03'),{total:1,done:0,minutes:0});setEntry(s,'2026-01-02','one',{done:false});assert.equal(getEntry(s,'2026-01-02','one').minutes,35);});
test('days before a habit was created exclude it',()=>assert.equal(dailyStats(fixture(),'2025-12-31').total,0));
test('deleting removes associated history',()=>{const s=fixture();setEntry(s,'2026-01-02','one',{done:true,minutes:10});removeHabit(s,'one');assert.equal(s.habits.length,0);assert.deepEqual(s.entries['2026-01-02'],{});});
test('date navigation handles year boundaries and leap days',()=>{assert.equal(shiftDate('2026-01-01',-1),'2025-12-31');assert.equal(shiftDate('2024-02-28',1),'2024-02-29');});
test('saved data validation rejects corrupt records',()=>{assert.deepEqual(validateState(fixture()),fixture());const s=fixture();setEntry(s,'2026-01-02','one',{minutes:-1});assert.throws(()=>validateState(s));assert.throws(()=>validateState({}));});

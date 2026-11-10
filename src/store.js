export const STORAGE_KEY = 'habits-v1';
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const shiftDate = (date, days) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate()+days); return localDate(d); };
export const emptyState = () => ({ version: 1, habits: [], entries: {} });
export function validateState(value) {
  if (value?.version !== 1 || !Array.isArray(value.habits) || !value.entries || typeof value.entries !== 'object') throw new Error('Invalid saved data');
  const ids = new Set();
  for (const h of value.habits) {
    if (typeof h.id !== 'string' || ids.has(h.id) || typeof h.name !== 'string' || !h.name.trim() || typeof h.emoji !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(h.created) || !Number.isInteger(h.goal) || h.goal < 0 || h.goal > 1440) throw new Error('Invalid habit');
    ids.add(h.id);
  }
  for (const [day, entries] of Object.entries(value.entries)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !entries || typeof entries !== 'object') throw new Error('Invalid day');
    for (const entry of Object.values(entries)) if (typeof entry.done !== 'boolean' || !Number.isInteger(entry.minutes) || entry.minutes < 0 || entry.minutes > 1440) throw new Error('Invalid entry');
  }
  return value;
}
export function getEntry(state, date, id) { return state.entries[date]?.[id] ?? { done: false, minutes: 0 }; }
export function setEntry(state, date, id, patch) { state.entries[date] ??= {}; state.entries[date][id] = { ...getEntry(state,date,id), ...patch }; }
export function removeHabit(state, id) { state.habits = state.habits.filter(h => h.id !== id); for (const day of Object.values(state.entries)) delete day[id]; }
export function dailyStats(state, date) {
  const habits = state.habits.filter(h=>h.created<=date);
  return { total: habits.length, done: habits.filter(h=>getEntry(state,date,h.id).done).length, minutes: habits.reduce((sum,h)=>sum+getEntry(state,date,h.id).minutes,0) };
}

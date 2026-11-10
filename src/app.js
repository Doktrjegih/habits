import { STORAGE_KEY, localDate, shiftDate, emptyState, validateState, getEntry, setEntry, removeHabit, dailyStats } from './store.js';
const $ = s => document.querySelector(s);
let state = emptyState(), selected = localDate(), filter = 'all', editing = null, timeId = null, deleting = null, emoji = '🌱', installPrompt;
let storageHealthy = true;
try { const saved = localStorage.getItem(STORAGE_KEY); if(saved) state=validateState(JSON.parse(saved)); } catch { storageHealthy=false; }
function toast(message) { $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),4500); }
function mutate(action) {
  if(!storageHealthy) { toast('Saved data could not be read. Export it before changing anything.'); return false; }
  const next=structuredClone(state); action(next);
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(next)); state=next; render(); return true; } catch { toast('Could not save. Your device storage may be full. Please export your data.'); return false; }
}
const esc = text => String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const niceDate = (d, opts) => new Date(`${d}T12:00:00`).toLocaleDateString(undefined,opts);
function render() {
  const today=localDate(), stats=dailyStats(state,selected), percent=stats.total?Math.round(stats.done/stats.total*100):0;
  $('#today-label').textContent=niceDate(selected,{weekday:'long',month:'long',day:'numeric',year:'numeric'}).toUpperCase();
  $('#completed-count').textContent=stats.done; $('#habit-total').textContent=`/ ${stats.total}`; $('#time-total').textContent=stats.minutes;
  $('#progress-fill').style.width=`${percent}%`; $('#progress-caption').textContent=stats.total?`${stats.total-stats.done} remaining`:'No habits yet.';
  $('#list-count').textContent=stats.total; $('#daily-percent').textContent=`${percent}% complete`;
  $('#date-label').textContent=selected===today?'Today':niceDate(selected,{month:'short',day:'numeric'}); $('#date-picker').value=selected; $('#date-picker').max=today; $('#next-day').disabled=selected>=today;
  $('#selected-label').textContent=selected===today?'Today’s habits.':`Your habits on ${niceDate(selected,{month:'long',day:'numeric'})}.`;
  const weekday=new Date(`${selected}T12:00:00`).getDay(); const monday=shiftDate(selected,-((weekday+6)%7));
  $('#week').innerHTML=Array.from({length:7},(_,i)=>{const date=shiftDate(monday,i), s=dailyStats(state,date), future=date>today;return `<button class="day ${date===selected?'chosen':''} ${date===today?'is-today':''}" data-date="${date}" ${future?'disabled':''} aria-label="${niceDate(date,{weekday:'long',month:'long',day:'numeric'})}" aria-pressed="${date===selected}"><span>${niceDate(date,{weekday:'short'})}</span><strong>${new Date(`${date}T12:00:00`).getDate()}</strong><i class="${s.total&&s.done===s.total?'full':s.done?'partial':''}"></i></button>`;}).join('');
  const habits=state.habits.filter(h=>h.created<=selected).filter(h=>filter==='all'||getEntry(state,selected,h.id).done===(filter==='done'));
  $('#habit-list').innerHTML=habits.length?habits.map((h,i)=>{const entry=getEntry(state,selected,h.id);return `<article class="habit-row ${entry.done?'is-done':''}"><button class="complete-button ${entry.done?'checked':''}" data-action="complete" data-id="${h.id}" aria-label="${entry.done?'Undo completion of':'Mark as passed:'} ${esc(h.name)}" aria-pressed="${entry.done}">${entry.done?'✓':''}</button><div class="habit-emoji color-${i%4}" aria-hidden="true">${esc(h.emoji)}</div><div class="habit-info"><h3>${esc(h.name)}</h3><span>${h.goal?`${h.goal} min daily goal`:'No time goal'} ${entry.done?'<b>· Completed</b>':''}</span></div><button class="time-button ${entry.minutes?'has-time':''}" data-action="time" data-id="${h.id}" aria-label="Log time for ${esc(h.name)}">◷ <span>${entry.minutes?`${entry.minutes} min`:'Log time'}</span><span class="time-plus">＋</span></button><button class="row-action" data-action="edit" data-id="${h.id}" aria-label="Edit ${esc(h.name)}">✎</button><button class="row-action delete" data-action="delete" data-id="${h.id}" aria-label="Delete ${esc(h.name)}">×</button></article>`;}).join(''):`<div class="empty-state"><h3>${state.habits.length?'No matching habits.':'No habits yet.'}</h3><p>${state.habits.length?'No habits in this view. Choose another filter or day.':'Add a habit to track its completion and time spent.'}</p>${!state.habits.length?'<button class="primary" id="empty-add">＋ Create your first habit</button><div class="starter-label">QUICK ADD</div><div class="starters"><button data-starter="Read a few pages" data-emoji="📖">📖 Read a few pages ＋</button><button data-starter="Move my body" data-emoji="🏃">🏃 Move my body ＋</button><button data-starter="A mindful moment" data-emoji="🌿">🌿 A mindful moment ＋</button></div>':''}</div>`;
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('selected',b.dataset.filter===filter);b.setAttribute('aria-pressed',b.dataset.filter===filter);});
}
function openHabit(habit=null, starter=null) {
  editing=habit?.id??null; emoji=habit?.emoji??starter?.emoji??'🌱'; $('#habit-form').reset(); $('#dialog-title').textContent=habit?'Edit your habit':'New habit'; $('#habit-name').value=habit?.name??starter?.name??''; $('#habit-goal').value=habit?.goal||''; renderEmojis(); $('#habit-dialog').showModal(); $('#habit-name').focus();
}
function renderEmojis(){ $('#emoji-picker').innerHTML=['🌱','📖','🏃','🌿','💧','✍️','🎨','💪','🧘','🎵','💻','🌙'].map(e=>`<button type="button" aria-label="Choose ${e}" aria-pressed="${e===emoji}" class="${e===emoji?'picked':''}" data-emoji="${e}">${e}</button>`).join(''); }
$('#add-habit').onclick=()=>openHabit();
$('#habit-form').onsubmit=e=>{e.preventDefault(); const name=$('#habit-name').value.trim(), goal=Number($('#habit-goal').value)||0; if(!name){$('#habit-name').setCustomValidity('Please enter a habit name.');$('#habit-name').reportValidity();return;} if(mutate(s=>{if(editing) Object.assign(s.habits.find(h=>h.id===editing),{name,goal,emoji});else s.habits.push({id:crypto.randomUUID(),name,goal,emoji,created:selected});})) {$('#habit-dialog').close(); toast(editing?'Habit updated.':'Habit added.');}};
$('#habit-name').oninput=()=>$('#habit-name').setCustomValidity('');
$('#emoji-picker').onclick=e=>{const b=e.target.closest('[data-emoji]');if(b){emoji=b.dataset.emoji;renderEmojis();}};
$('#habit-list').onclick=e=>{
  const starter=e.target.closest('[data-starter]'); if(starter){openHabit(null,{name:starter.dataset.starter,emoji:starter.dataset.emoji});return;}
  if(e.target.closest('#empty-add')){openHabit();return;}
  const b=e.target.closest('[data-action]');if(!b)return; const h=state.habits.find(h=>h.id===b.dataset.id);
  if(b.dataset.action==='complete')mutate(s=>setEntry(s,selected,h.id,{done:!getEntry(s,selected,h.id).done}));
  if(b.dataset.action==='edit')openHabit(h);
  if(b.dataset.action==='time'){timeId=h.id;$('#time-habit-name').textContent=`${h.emoji} ${h.name} · ${niceDate(selected,{month:'short',day:'numeric'})}`;$('#time-minutes').value=getEntry(state,selected,h.id).minutes;$('#time-dialog').showModal();$('#time-minutes').select();}
  if(b.dataset.action==='delete'){deleting=h.id;$('#delete-dialog').showModal();}
};
$('#time-form').onsubmit=e=>{e.preventDefault();if(mutate(s=>setEntry(s,selected,timeId,{minutes:Number($('#time-minutes').value)}))){$('#time-dialog').close();toast('Time saved.');}};
$('.quick-times').onclick=e=>{if(e.target.dataset.minutes)$('#time-minutes').value=e.target.dataset.minutes;};
$('#delete-form').onsubmit=e=>{e.preventDefault();if(mutate(s=>removeHabit(s,deleting))){$('#delete-dialog').close();toast('Habit deleted.');}};
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
$('.tabs').onclick=e=>{if(e.target.dataset.filter){filter=e.target.dataset.filter;render();}};
function selectDate(date){if(date&&date<=localDate()){selected=date;render();}}
$('#week').onclick=e=>{const b=e.target.closest('[data-date]');if(b)selectDate(b.dataset.date);};
$('#previous-day').onclick=()=>selectDate(shiftDate(selected,-1));$('#next-day').onclick=()=>selectDate(shiftDate(selected,1));$('#date-label').onclick=()=>selectDate(localDate());$('#date-picker').onchange=e=>selectDate(e.target.value);
$('#daily-nav').onclick=()=>{selectDate(localDate());filter='all';render();};$('#history-nav').onclick=()=>{$('#date-picker').focus();$('#date-picker').showPicker?.();};
$('#export').onclick=()=>{const raw=storageHealthy?JSON.stringify(state,null,2):localStorage.getItem(STORAGE_KEY)||'{}';const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`habits-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});$('#install').onclick=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else $('#install-dialog').showModal();};
function network(){ $('#network-status').textContent=navigator.onLine?'Online':'You’re offline'; }window.addEventListener('online',network);window.addEventListener('offline',network);
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY){try{state=e.newValue?validateState(JSON.parse(e.newValue)):emptyState();storageHealthy=true;render();}catch{storageHealthy=false;toast('Saved data could not be read. Please export your data.');}}});
let lastDay=localDate();document.addEventListener('visibilitychange',()=>{if(!document.hidden){const today=localDate();if(selected===lastDay)selected=today;lastDay=today;render();}});
render();network();if(!storageHealthy)toast('Saved data could not be read. Export it to keep a backup.');
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>toast('Offline setup failed. Reload while online to try again.'));

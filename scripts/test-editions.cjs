const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'../docs'),source=f=>fs.readFileSync(path.join(root,f),'utf8');
function app(edition,storage=new Map(),hash='#home'){
 const events={},win={},els=new Map(),downloads=[];let blob;
 const element=id=>{if(!els.has(id))els.set(id,{innerHTML:'',textContent:'',style:{},value:'',focus(){},scrollIntoView(){},showModal(){},close(){}});return els.get(id);};
 const location={hash};
 const ctx={window:{addEventListener:(t,h)=>win[t]=h,scrollTo(){},innerWidth:1400},location,document:{getElementById:element,querySelector:()=>({focus(){}}),addEventListener:(t,h)=>events[t]=h,createElement:()=>{const a={click(){downloads.push(a.download);}};return a;}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},setTimeout:()=>1,clearTimeout(){},Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:backup';},revokeObjectURL(){}},history:{replaceState(_s,_t,url){location.hash=url;}}};
 vm.createContext(ctx);const run=f=>vm.runInContext(source(f),ctx,{filename:f});
 run('exam-logic.js');run('study-planner.js');
 if(edition===2){run('exam2/exam-data.js');run('exam2/planner.js');}
 else {run('exam-data.js');run('calendar-data.js');}
 if(edition===2){run('exam2/logic.js');run('exam2/labs.js');}
 run('app.js');
 return {storage,data:ctx.window.EXAM,planner:ctx.window.StudyPlanner,html:()=>element('app').innerHTML,element,downloads,
  state:()=>JSON.parse(storage.get(`ml4t-exam${edition}-v2`)),
  nav(hash){location.hash=hash;win.hashchange();},
  click(action,data={}){events.click({target:{closest:()=>({dataset:{action,...data}})}});win.hashchange();},
  change(target){events.change({target:{dataset:{},...target}});},
  input(target){events.input({target:{dataset:{},...target}});},
  async import(value){events.change({target:{id:'import-file',dataset:{},files:[{size:100,text:()=>Promise.resolve(JSON.stringify(value))}]}});await new Promise(r=>setImmediate(r));},
  async backup(){return JSON.parse(await blob.text());}
 };
}
async function main(){
 const storage=new Map(),one=app(1,storage),two=app(2,storage);
 assert.match(one.html(),/<strong>Exam 1<\/strong>/);assert.match(two.html(),/<strong>Exam 2<\/strong>/,'The second entry must render its own exam');
 two.nav('#audit');assert.match(two.html(),/ML2-D10G2Q3/,'The known reverse-key contradiction must be visible in the default source notes');
 one.click('quick-start');one.click('check');two.click('quick-start');two.click('check');
 const old=storage.get('ml4t-exam1-v2'),second=two.state();assert.equal(second.exam,2);assert.equal(one.state().exam,1);
 two.click('export');assert.equal(two.downloads[0],'ml4t-exam2-progress.json');const backup=await two.backup();
 await one.import(backup);assert.equal(storage.get('ml4t-exam1-v2'),old,'Reject other-exam import without changing progress');
 await two.import(one.state());assert.deepEqual(two.state(),second);
 two.click('confirm-reset');assert.equal(Object.keys(two.state().records).length,0);assert.equal(storage.get('ml4t-exam1-v2'),old);
 await two.import(backup);assert.deepEqual(two.state().records,backup.records);
 const reload=app(2,storage,'#practice');assert.equal(Object.keys(reload.state().records).length,1);
 two.nav('#formulas');assert.match(two.element('lab-output').innerHTML,/3\.3000/);
 two.input({dataset:{labInput:'alpha'},value:'2'});assert.match(two.element('lab-output').innerHTML,/between 0 and 1/);
 two.input({dataset:{labInput:'alpha'},value:'.5'});
 if(two.planner.editable){
  two.nav('#calendar');two.element('plan-target-date').value='2027-01-04';two.click('plan-set-date');assert.equal(two.state().planner.targetDate,'2027-01-04');
  const days=two.planner.buildDays(two.data);two.change({dataset:{planCheck:days[0].tasks[0].id},checked:true});
  two.click('plan-practice',{task:days[0].tasks[1].id});assert.equal(two.state().session.calendarDate,'2026-12-26');
  two.click('check');two.element('plan-target-date').value='2027-02-30';two.click('plan-set-date');assert.equal(two.state().planner.targetDate,'2027-01-04');
  two.click('plan-practice',{task:days[3].tasks[1].id});assert.equal(two.state().session.calendarDate,'2026-12-29');
  two.element('plan-target-date').value='2027-01-05';two.click('plan-set-date');assert.equal(two.state().planner.checks[days[0].tasks[0].id],true);
  assert.equal(two.state().session.calendarDate,'2026-12-30','Rescheduling preserves the assigned study session, not the old absolute date');
  const after=app(2,storage,'#calendar');assert.equal(after.planner.DEADLINE,'2027-01-05');assert.match(after.html(),/December 2026/);after.nav('#calendar/2027-01-05');assert.match(after.html(),/January 2027/);
 }
 console.log('PASS: both editions render, separate storage/reset, cross-exam backup rejection, reload/export/import, calculators, rescheduling and practice links');
}
main().catch(e=>{console.error(e);process.exitCode=1;});

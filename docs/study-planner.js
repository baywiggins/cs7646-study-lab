(function(root){'use strict';
const START='2026-10-09',DEADLINE='2026-10-18';
const localDate=(now=new Date())=>[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
const utcDay=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d);};
const daysBetween=(a,b)=>Math.round((utcDay(b)-utcDay(a))/86400000);
const currentDate=(today=localDate())=>today<START?START:today>DEADLINE?DEADLINE:today;
const formatDate=(date,options={month:'long',day:'numeric',weekday:'long'})=>{const [y,m,d]=date.split('-').map(Number);return new Date(y,m-1,d,12).toLocaleDateString(undefined,options);};
function buildDays(exam){
 const byDomain=Object.fromEntries(exam.domains.map(d=>[d.id,d]));
 const used=new Set(),days=root.STUDY_PLAN.days.map(raw=>{
  const day={...raw,phase:raw.date<'2026-10-16'?'Learn':raw.date<'2026-10-18'?'Review':'Exam day',tasks:[]};
  if(raw.domains.length){
   const ids=[...raw.representativeQuestionIds];for(const id of raw.domains)if(!byDomain[id])throw Error('Unknown planner domain '+id);for(const id of ids)used.add(id);
   day.tasks=[
    {id:raw.date+':read',type:'manual',title:'Read & explain the topic rules',text:raw.readGoal,domains:raw.domains},
    {id:raw.date+':practice',type:'practice',title:`Check ${ids.length} focus questions`,text:`One selected question from each of today's ${ids.length} topic groups. Judge all five statements, then read the explanations. These questions form a focused first pass through the pool.`,ids},
    {id:raw.date+':recall',type:'manual',title:'Retrieve without looking',text:raw.recallGoal,lab:raw.lab||null,pdfPage:raw.pdfPage||null},
    {id:raw.date+':repair',type:'manual',title:'Repair mistakes & revisit earlier material',text:raw.reviewGoal||'Explain each missed claim in your own words. Revisit a few earlier mistakes, and save anything that still feels uncertain.',review:true}
   ];
  }
  return day;
 });
 const mixed=days.find(d=>d.date==='2026-10-16');
 const mixedIds=exam.domains.map(d=>exam.questions.find(q=>q.domainId===d.id&&!used.has(q.id)).id);
 mixed.tasks=[
  {id:mixed.date+':recall',type:'manual',title:'Rebuild the formula sheet from memory',text:mixed.readGoal,pdfPage:4},
  {id:mixed.date+':practice',type:'practice',title:'Complete a 20-domain mixed round',text:mixed.practiceGoal,ids:mixedIds},
  {id:mixed.date+':repair',type:'manual',title:'Explain every miss or guess',text:mixed.recallGoal,review:true},
  {id:mixed.date+':audit',type:'manual',title:'Review the source-key cautions',text:mixed.reviewGoal||'Review the flagged KNN, tree, probability, PCA, and negation cases. Keep the supplied labels separate from the conceptual rule.',href:'#audit',linkLabel:'Open key & conventions'}
 ];
 const final=days.find(d=>d.date==='2026-10-17');
 final.tasks=[
  {id:final.date+':selftest',type:'manual',title:'Attempt all 24 printed self-tests',text:final.practiceGoal,pdfPage:30},
  {id:final.date+':check',type:'manual',title:'Check the separate answers',text:'Use pages 33–35 only after your first attempt. Explain each error, then redo it without the answer in view.',pdfPage:33},
  {id:final.date+':repair',type:'manual',title:'Revisit your weakest questions',text:final.recallGoal,review:true},
  {id:final.date+':ready',type:'manual',title:'Make a one-page recall sheet & confirm logistics',text:final.readGoal,pdfPage:4}
 ];
 const examDay=days.find(d=>d.date===DEADLINE);
 examDay.tasks=[
  {id:examDay.date+':warmup',type:'manual',title:'Do a short, familiar warm-up',text:examDay.recallGoal,pdfPage:4},
  {id:examDay.date+':setup',type:'manual',title:'Check the exam setup',text:examDay.readGoal},
  {id:examDay.date+':exam',type:'manual',title:'Take the exam by the course deadline',text:'Reserve enough time to finish before the official cutoff. October 18 is the date you supplied; the course specifies the exact time and allowed duration.'}
 ];
 return days;
}
function validateState(raw,days){
 const checks={};for(const day of days)for(const t of day.tasks)if(t.type==='manual'&&raw?.checks?.[t.id]===true)checks[t.id]=true;
 return {checks};
}
function taskProgress(task,state){
 if(task.type==='practice'){const n=task.ids.filter(id=>state.records?.[id]).length;return {n,total:task.ids.length,done:n===task.ids.length};}
 const done=state.planner?.checks?.[task.id]===true;return {n:done?1:0,total:1,done};
}
function dayProgress(day,state){const n=day.tasks.filter(t=>taskProgress(t,state).done).length;return {n,total:day.tasks.length,done:n===day.tasks.length};}
function summarize(days,state,today=localDate()){
 const tasks=days.flatMap(d=>d.tasks);const completed=tasks.filter(t=>taskProgress(t,state).done).length;
 return {completed,total:tasks.length,daysComplete:days.filter(d=>dayProgress(d,state).done).length,overdue:days.filter(d=>d.date<today&&!dayProgress(d,state).done),remainingDays:daysBetween(today,DEADLINE)};
}
function calendarCells(days){
 const first=new Date(Date.UTC(2026,9,1)),byDate=Object.fromEntries(days.map(d=>[d.date,d]));const cells=Array(first.getUTCDay()).fill(null);
 for(let n=1;n<=31;n++){const date='2026-10-'+String(n).padStart(2,'0');cells.push({date,number:n,day:byDate[date]||null});}
 while(cells.length%7)cells.push(null);return cells;
}
root.StudyPlanner={START,DEADLINE,localDate,daysBetween,currentDate,formatDate,buildDays,validateState,taskProgress,dayProgress,summarize,calendarCells};
})(typeof window!=='undefined'?window:globalThis);

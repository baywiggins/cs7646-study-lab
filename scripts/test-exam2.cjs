const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'../docs');
assert(fs.existsSync(path.join(root,'exam2/logic.js')),'Exam 2 calculators must be available');
const ctx={window:{},Date,console};vm.createContext(ctx);
const run=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx);
run('exam2/logic.js');const L=ctx.window.Exam2Logic;
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
near(L.qUpdate(2,1,.9,4,.5,false).updated,3.3);
near(L.qUpdate(2,1,.9,4,.5,true).updated,1.5);
near(L.epsilonGreedy(.2,4,1).greedyEach,.85);
near(L.epsilonGreedy(.2,4,2).greedyEach,.45);
near(L.epsilonGreedy(.2,4,2).otherEach,.05);
near(L.fundamentalLaw(.05,100,.8,.1).ir,.4);
near(L.fundamentalLaw(.05,100,.8,.1).activeReturn,.04);
near(L.tradingCosts(1000000,.4,10,0,.0003).net,-100);
near(L.option(110,100,4,'call','long').profit,6);
near(L.option(90,100,4,'put','short').profit,-6);
near(L.indicators([100,102,104],3).sma,102);
near(L.indicators([100,102,104],3).momentum,.04);
near(L.indicators([100,102,104],3).sd,Math.sqrt(8/3));
assert.throws(()=>L.qUpdate(2,1,1.1,4,.5,false));
assert.throws(()=>L.epsilonGreedy(.2,4,5));
assert.throws(()=>L.fundamentalLaw(.5,-1,1,.1));
assert.throws(()=>L.indicators([100],3));
assert.throws(()=>L.indicators([0,100],2));
assert.throws(()=>L.option(100,100,-1,'call','long'));
console.log('PASS: Exam 2 numerical examples, terminal updates, exploration ties, indicator conventions, costs, option direction, invalid inputs');
assert(fs.existsSync(path.join(root,'exam2/planner.js')),'Exam 2 calendar must be available');
run('study-planner.js');run('exam2/planner.js');const P=ctx.window.StudyPlanner;
P.configure('2027-01-04');assert.equal(P.START,'2026-12-26');assert.equal(P.DEADLINE,'2027-01-04');
assert.throws(()=>P.configure('2027-02-30'));assert.equal(P.DEADLINE,'2027-01-04');
const exam={domains:[],questions:[],issues:[]};
for(const sub of ['ML','QF'])for(let d=1;d<=10;d++){const id=`${sub}2-D${d}`,groups=[];for(let g=1;g<=7;g++){const ids=[];for(let q=1;q<=3;q++){const qid=`${id}G${g}Q${q}`;ids.push(qid);exam.questions.push({id:qid,domainId:id,group:g});}groups.push({number:g,ids});}exam.domains.push({id,title:id,groups,guidePage:6+d});}
const days=P.buildDays(exam);assert.equal(days.length,10);assert.equal(days[0].date,'2026-12-26');assert.equal(days[9].date,'2027-01-04');
const firstIds=days.slice(0,7).flatMap(d=>d.tasks.find(t=>t.type==='practice').ids);
assert.equal(firstIds.length,140);assert.equal(new Set(firstIds).size,140);
const mixed=days[7].tasks.find(t=>t.type==='practice').ids;assert.equal(mixed.length,20);assert(mixed.every(id=>!firstIds.includes(id)));
assert.equal(P.calendarCells(days,'2027-01-04').filter(c=>c?.day).length,4);
const task=days[0].tasks[0],state={records:{},planner:{checks:{[task.id]:true},targetDate:'2027-01-04'}};
P.configure('2027-02-01');const next=P.buildDays(exam);state.planner=P.validateState(state.planner,next);assert(P.taskProgress(next[0].tasks[0],state).done,'Rescheduling retains completed session goals');
assert.equal(P.summarize(next,state,'2027-01-31').remainingDays,1);
console.log('PASS: ten sessions, complete first-pass coverage, fresh mixed questions, year/month rollover, invalid dates and stable rescheduled checks');

run('exam-logic.js');run('exam2/exam-data.js');
const E=ctx.window.EXAM,grade=ctx.window.ExamLogic.grade,letters=['A','B','C','D','E'];
const expectedDomains=[],expectedIds=[];
for(const subject of ['ML','QF'])for(let d=1;d<=10;d++){
 const domainId=`${subject}2-D${d}`;expectedDomains.push(domainId);
 for(let g=1;g<=7;g++)for(let q=1;q<=3;q++)expectedIds.push(`${domainId}G${g}Q${q}`);
}
assert.equal(E.revision,'081020261230');
assert.equal(E.questions.length,420);assert.equal(new Set(E.questions.map(q=>q.id)).size,420);
assert.equal(E.questions.map(q=>q.id).sort().join('\n'),expectedIds.sort().join('\n'),'Every supplied Exam 2 question ID appears exactly once');
assert.equal(E.domains.length,20);
assert.equal(E.domains.map(d=>d.id).sort().join('\n'),expectedDomains.sort().join('\n'));
assert.equal(E.domains.reduce((n,d)=>n+d.groups.length,0),140);
const productionById=Object.fromEntries(E.questions.map(q=>[q.id,q])),groupedIds=[];
for(const d of E.domains){
 assert.equal(d.groups.length,7,d.id);assert.equal(d.count,21,d.id);
 assert.equal(d.groups.map(g=>g.number).sort((a,b)=>a-b).join(','),'1,2,3,4,5,6,7',d.id);
 for(const g of d.groups){
  assert.equal(g.ids.length,3,`${d.id}G${g.number}`);
  const expected=[1,2,3].map(n=>`${d.id}G${g.number}Q${n}`);
  assert.equal([...g.ids].sort().join(','),expected.join(','));
  assert.equal(g.page,productionById[expected[0]].page,'Group source link points to its first question');
  groupedIds.push(...g.ids);
 }
}
assert.equal(new Set(groupedIds).size,420,'Every question belongs to exactly one topic group');

let maskChecks=0,reverseCount=0,negatedCount=0;
for(const q of E.questions){
 const [,subject,domainNumber,groupNumber,questionNumber]=q.id.match(/^(ML|QF)2-D(\d+)G(\d+)Q(\d+)$/);
 assert.equal(q.subject,subject);assert.equal(q.domain,Number(domainNumber));
 assert.equal(q.domainId,`${subject}2-D${domainNumber}`);assert.equal(q.group,Number(groupNumber));assert.equal(q.number,Number(questionNumber));
 const [firstPage,lastPage]=subject==='ML'?[421,581]:[582,753];
 assert(Number.isInteger(q.page)&&q.page>=firstPage&&q.page<=lastPage,`${q.id} must link within its Exam 2 source section`);
 assert.equal(Object.keys(q.statements).sort().join(''),'ABCDE',q.id);
 assert.equal(Object.keys(q.key).sort().join(''),'ABCDE',q.id);
 for(const letter of letters){assert.equal(typeof q.key[letter].selected,'boolean',`${q.id} ${letter}`);assert(q.statements[letter]&&q.key[letter].explanation);}
 const directReversal=/mark each statement True when the stated claim is incorrect and False when it is correct\./.test(q.stem);
 const alreadyNegated=letters.every(letter=>q.statements[letter].startsWith('The following statement is incorrect:'));
 assert.equal(q.reverse,directReversal,`${q.id} direct-reversal metadata`);
 assert.equal(q.negatedItems,alreadyNegated,`${q.id} already-negated-item metadata`);
 assert(!(q.reverse&&q.negatedItems),`${q.id} must not invert an already-negated item twice`);
 reverseCount+=Number(q.reverse);negatedCount+=Number(q.negatedItems);
 const publishedMask=letters.reduce((mask,letter,i)=>mask|(Number(q.key[letter].selected)<<i),0);
 for(let mask=0;mask<32;mask++){
  const picks=Object.fromEntries(letters.map((letter,i)=>[letter,Boolean(mask&(1<<i))]));
  const expectedCorrect=5-(mask^publishedMask).toString(2).replace(/0/g,'').length;
  const result=grade(q,picks);
  assert.equal(result.correct,expectedCorrect,`${q.id}, answer mask ${mask}`);
  assert.equal(result.exact,mask===publishedMask,`${q.id}, answer mask ${mask}`);
  maskChecks++;
 }
}
assert.equal(maskChecks,13440);assert.equal(reverseCount,90);assert.equal(negatedCount,99);
// Pinned from all 2,100 published labels in pool revision 081020261230,
// independently audited against the PDF; excludes explanations and display cleanup.
const publishedLabels=E.questions.map(q=>q.id+':'+letters.map(l=>q.key[l].selected?'1':'0').join('')).sort().join('\n');
assert.equal(crypto.createHash('sha256').update(publishedLabels).digest('hex'),'3b7e295e88b46d5e6e857eabf941de2f8534a2fabc5d3dceed27ad373eaa1d56','All published selection labels must remain unchanged');
const contradiction=productionById['ML2-D10G2Q3'];
assert.equal(letters.map(l=>Number(contradiction.key[l].selected)).join(''),'00011');
assert.equal(contradiction.reverse,true);assert.equal(contradiction.page,571);
const caveat=E.issues.find(issue=>issue.id===contradiction.id&&issue.letter==='E');
assert(caveat,'The contradictory published label needs a visible source caveat');
assert.equal(caveat.official,true);assert.equal(caveat.statement,contradiction.statements.E);assert.equal(caveat.page,contradiction.page);
console.log('PASS: production Exam 2 data, 420 IDs/20 domains/140 groups, 13440 answer masks, 90 reversed/99 already-negated items, all official labels, flagged contradiction and source-page bounds');

(function(root){'use strict';
const base=root.StudyPlanner;
const addDays=(date,n)=>{const [y,m,d]=date.split('-').map(Number),v=new Date(Date.UTC(y,m-1,d+n));return v.toISOString().slice(0,10);};
function validDate(date){if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;const [y,m,d]=date.split('-').map(Number);return y>=2000&&y<=2100&&new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===date;}
const planner={...base,editable:true};
planner.configure=(date)=>{const end=date||addDays(base.localDate(),9);if(!validDate(end))throw Error('Choose a valid study finish date between 2000 and 2100.');planner.DEADLINE=end;planner.START=addDays(end,-9);};
planner.configure();
planner.currentDate=(today=base.localDate())=>today<planner.START?planner.START:today>planner.DEADLINE?planner.DEADLINE:today;
const sessions=[
 {title:'Frame the sequential decision',domains:['ML2-D1','ML2-D2'],focus:'Agents, rewards, states, policies, and value',recall:'Define a state, action, reward, policy, and return. Explain the Markov assumption and distinguish V(s) from Q(s,a).',lab:'qlearning'},
 {title:'Update, explore, and plan',domains:['ML2-D3','ML2-D4','ML2-D5'],focus:'Q-learning, exploration, and Dyna',recall:'Compute a Q-update, including a terminal transition. Explain epsilon-greedy action probabilities and why simulated Dyna experience can inherit model errors.',lab:'qlearning'},
 {title:'Build and compare trading agents',domains:['ML2-D6','ML2-D7','ML2-D8'],focus:'State design, trading rewards, and strategy learners',recall:'Design a state that includes holdings, map target positions to trades, and compare a rule strategy, supervised learner, and RL policy on the same cost-aware timeline.',lab:'costs'},
 {title:'Model sequences without leakage',domains:['ML2-D9','ML2-D10','QF2-D1'],focus:'Neural networks, responsible AI, and time series',recall:'Explain backpropagation, regularization, sequence order, temporal splits, and why generated output is not verified evidence. Distinguish autocorrelation from causation.',lab:'epsilon'},
 {title:'Turn signals into active skill',domains:['QF2-D2','QF2-D3','QF2-D4'],focus:'Indicators, alpha signals, and the Fundamental Law',recall:'Compute a rolling signal with an explicit window, explain cross-sectional ranking, and calculate IR from skill, independent breadth, and transfer coefficient.',lab:'fundamental'},
 {title:'Construct and evaluate after costs',domains:['QF2-D5','QF2-D6','QF2-D7'],focus:'Portfolio constraints, honest evaluation, and trading frictions',recall:'Explain how constraints affect implementation, compare like-for-like benchmarks, and compute a gross-to-net result with turnover and costs on a consistent base.',lab:'costs'},
 {title:'Execute, hedge, and govern',domains:['QF2-D8','QF2-D9','QF2-D10'],focus:'Order-book execution, options, and AI-enabled workflows',recall:'Compare VWAP, TWAP, and participation execution; compute long/short call and put profits; explain the controls required before acting on an AI-generated proposal.',lab:'options'}
];
planner.buildDays=exam=>{
 const byDomain=Object.fromEntries(exam.domains.map(d=>[d.id,d])),flagged=new Set(exam.issues.map(i=>i.id)),used=new Set();
 const days=sessions.map((raw,i)=>{
  const ids=raw.domains.flatMap(id=>byDomain[id].groups.map(g=>g.ids.find(q=>!flagged.has(q))||g.ids[0]));ids.forEach(id=>used.add(id));
  const prefix=`session-${i+1}`,date=addDays(planner.START,i);
  return {...raw,date,phase:'Learn',minutes:i?120:90,note:'Judge each complete statement, including its negation. A checked answer counts as attempted, not mastered. Explain every miss before moving on.',tasks:[
   {id:prefix+':read',type:'manual',title:'Read & explain the topic rules',text:'Read the core notes, formulas, and every topic group in these domains. State each rule in your own words.',domains:raw.domains},
   {id:prefix+':practice',type:'practice',title:`Check ${ids.length} focus questions`,text:'One question per topic group. Work out numerical claims before checking, then read all five explanations.',ids},
   {id:prefix+':recall',type:'manual',title:'Retrieve without looking',text:raw.recall,lab:raw.lab,pdfPage:byDomain[raw.domains[0]].guidePage},
   {id:prefix+':repair',type:'manual',title:'Repair mistakes & revisit earlier material',text:'Explain each missed claim, then revisit a few earlier mistakes. Save anything that still feels uncertain.',review:true}
  ]};
 });
 const mixed=exam.domains.map(d=>exam.questions.find(q=>q.domainId===d.id&&!used.has(q.id)&&!flagged.has(q.id)).id);
 days.push({date:addDays(planner.START,7),title:'Run a mixed rehearsal',phase:'Review',domains:[],focus:'Retrieve across all 20 domains',minutes:120,note:'A fresh mixed round checks whether you can switch topics and interpret the direction without relying on memorized letters.',tasks:[
  {id:'session-8:recall',type:'manual',title:'Rebuild the formula sheet from memory',text:'Write the Q-update, discounted return, exploration probabilities, indicator conventions, Fundamental Law, trading-cost calculation, and option payoffs. Check units and assumptions.',pdfPage:3},
  {id:'session-8:practice',type:'practice',title:'Complete a 20-domain mixed round',text:'Use one new question from each domain. Attempt it without notes, then check every statement.',ids:mixed},
  {id:'session-8:repair',type:'manual',title:'Explain every miss or guess',text:'Separate missing concepts, arithmetic errors, and negation mistakes; repair the controlling rule and retry.',review:true},
  {id:'session-8:audit',type:'manual',title:'Review the source-key cautions',text:'Read the direction and convention notes. Keep the published selection label separate from any flagged conceptual contradiction.',href:'#audit',linkLabel:'Open key & conventions'}
 ]});
 days.push({date:addDays(planner.START,8),title:'Repair the weak spots',phase:'Review',domains:[],focus:'Self-tests, targeted practice, and recall',minutes:90,note:'Attempt self-tests before viewing answers. If a calculation is weak, redo it with different inputs in the formula lab.',tasks:[
  {id:'session-9:selftest',type:'manual',title:'Attempt all 20 printed self-tests',text:'Work through one recall problem per domain, including the numerical examples.',pdfPage:exam.meta?.selfTestPage||45},
  {id:'session-9:check',type:'manual',title:'Check the separate answers',text:'Explain each error and redo the problem without the solution in view.',pdfPage:exam.meta?.answerPage||47},
  {id:'session-9:repair',type:'manual',title:'Revisit your weakest questions',text:'Review up to 10 missed or saved questions and explain all five decisions.',review:true},
  {id:'session-9:ready',type:'manual',title:'Confirm the exam logistics',text:'Check Canvas for your actual exam date, cutoff, allowed materials, duration, and proctoring requirements. The calendar finish date is your study target.'}
 ]});
 days.push({date:planner.DEADLINE,title:'Complete your readiness check',phase:'Final review',domains:[],focus:'Light recall and course logistics',minutes:30,note:'This is the finish date you chose for studying, not a claim about the official exam deadline. Follow the course instructions.',tasks:[
  {id:'session-10:warmup',type:'manual',title:'Do a short, familiar warm-up',text:'Review formulas and one familiar calculation. Explain a reversed question and an item that contains its own negation.',pdfPage:3},
  {id:'session-10:setup',type:'manual',title:'Check the exam setup',text:'Confirm your exam window and technical setup in Canvas. Leave enough time before the official cutoff.'},
  {id:'session-10:ready',type:'manual',title:'Assess readiness honestly',text:'Can you explain the rules, perform the calculations, and answer mixed questions without looking? Use any remaining time for the specific gaps.'}
 ]});return days;
};
planner.validateState=(raw,days)=>({...base.validateState(raw,days),targetDate:planner.DEADLINE});
planner.summarize=(days,state,today=base.localDate())=>({...base.summarize(days,state,today),remainingDays:base.daysBetween(today,planner.DEADLINE)});
planner.calendarCells=(days,selected=planner.START)=>{const [y,m]=selected.split('-').map(Number),byDate=Object.fromEntries(days.map(d=>[d.date,d])),cells=Array(new Date(Date.UTC(y,m-1,1)).getUTCDay()).fill(null),count=new Date(Date.UTC(y,m,0)).getUTCDate();for(let n=1;n<=count;n++){const date=`${y}-${String(m).padStart(2,'0')}-${String(n).padStart(2,'0')}`;cells.push({date,number:n,day:byDate[date]||null});}while(cells.length%7)cells.push(null);return cells;};
root.StudyPlanner=planner;
})(typeof window!=='undefined'?window:globalThis);

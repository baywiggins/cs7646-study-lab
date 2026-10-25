"""Assemble audited Exam 2 questions, teaching notes, and print navigation."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
WORK=ROOT/'.work/exam2'
qs=json.loads((WORK/'questions.json').read_text())
byid={q['id']:q for q in qs}
for c in json.loads((ROOT/'content/exam2/text-corrections.json').read_text()):
    obj=byid[c['id']];parts=c['field'].split('.')
    for part in parts[:-1]:obj=obj[part]
    assert obj[parts[-1]] in [c['original'],c['replacement']], (c['id'],c['field'])
    obj[parts[-1]]=c['replacement']
domains=[];issues=[];selftests=[]
for subject in ['ml','qf']:
    data=json.loads((ROOT/f'content/exam2/{subject}.json').read_text())
    domains.extend(data['domains']);issues.extend(data['issues']);selftests.extend(data['selfTests'])
mapping=json.loads((ROOT/'content/exam2/pdf-page-map.json').read_text())
for d in domains:
    items=[q for q in qs if q['domainId']==d['id']]
    d['page']=items[0]['page'];d['count']=len(items)
    d['guidePage']=mapping.get('domains',{}).get(d['id'],{}).get('page',1)
    for g in d['groups']:
        expected=[q['id'] for q in items if q['group']==g['number']]
        assert g['ids']==expected,(d['id'],g['number'])
        g['page']=byid[g['ids'][0]]['page']
    for e in d['examples']:
        if e.get('id') in byid:e['page']=byid[e['id']]['page']
    assert d['core'] and len(d['groups'])==7 and len(d['examples'])>=2
for issue in issues:issue['page']=byid[issue['id']]['page']
figures={
    'ML2-D3':('clip_341_0299.jpg','Lecture clip 341, 4:59: the Q-learning update rule.'),
    'ML2-D5':('clip_355_0210.jpg','Lecture clip 355, 3:30: the Dyna-Q learning loop.'),
    'QF2-D2':('clip_219_0188.jpg','Lecture clip 219, 3:08: Bollinger Bands.'),
    'QF2-D4':('clip_259_0079.jpg','Lecture clip 259, 1:19: the Fundamental Law.')
}
for d in domains:
    if d['id'] in figures:
        filename,caption=figures[d['id']]
        dest=ROOT/'docs/figures'/filename
        assert dest.exists(),dest
        d['figure']={'src':'../figures/'+filename,'caption':caption}
meta={'number':2,'storageKey':'ml4t-exam2-v2','pdf':'../assets/CS7646_Exam2_Study_Guide.pdf','pool':'../assets/ML4T_Exam_Question_Pool.pdf','poolStart':421,'defaultLab':'qlearning',
      'scope':'the supplied question pool, Exam 2 Machine Learning (pp. 421–581) and Quantitative Finance (pp. 582–753). Notes are grounded in the Exam 2 pool and the applicable recorded lectures; Exam 1 material appears only where it is a prerequisite.',
      'conventions':'Distinguish a reversed stem from an option that already says “the following statement is incorrect.” Q-learning terminal targets, exploration tie-breaking, rolling-window definitions, effective independent breadth, one-way versus round-trip costs, and option payoff versus profit all require explicit conventions.',
      'selfTestPage':mapping.get('selfTestPage',1),'answerPage':mapping.get('answerPage',1)}
result={'revision':'081020261230','meta':meta,'questions':qs,'domains':domains,'issues':issues,'selfTests':selftests}
assert len(qs)==420 and len(domains)==20 and len(selftests)==20
assert len(byid)==420 and sum(q['reverse'] for q in qs)==90 and sum(q['negatedItems'] for q in qs)==99
assert sum(len(d['groups']) for d in domains)==140
assert all(len(q['key'])==len(q['statements'])==5 for q in qs)
(ROOT/'docs/exam2/exam-data.js').write_text('window.EXAM = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'questions':len(qs),'groups':140,'domains':len(domains),'examples':sum(len(d['examples']) for d in domains),'sourceNotes':len(issues),'reverse':90,'negatedItems':99,'printMapping':bool(mapping)}))

"""Extract Exam 2 only from the supplied pool, keeping the published key."""
from pathlib import Path
import json, re, unicodedata
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.work' / 'exam2'
WORK.mkdir(parents=True, exist_ok=True)
reader = PdfReader(ROOT / 'docs/assets/ML4T_Exam_Question_Pool.pdf')
def clean(text):
    text = unicodedata.normalize('NFKC', text).replace('Ư', 'ff')
    return text.replace('\u00ad', '')

pages = []
bounds = []
full = ''
for i in range(420, len(reader.pages)):
    text = clean(reader.pages[i].extract_text())
    text = re.sub(r'^\s*\d+\s+Rev:081020261230\s*$', '', text, flags=re.M)
    pages.append({'page': i+1, 'text': text})
    bounds.append((len(full), i+1))
    full += text + '\n'
(WORK/'pages.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2))
matches = list(re.finditer(r'^[ \t]*\[((?:ML2|QF2)-D(\d+)G(\d+)Q(\d+))\][ \t]*$', full, re.M))
questions = []
for i, match in enumerate(matches):
    end = matches[i+1].start() if i+1 < len(matches) else len(full)
    raw = full[match.end():end].strip()
    page = max(page for offset, page in bounds if offset <= match.start())
    parts = re.split(r'Answer Key\s*(\([^\n]*\))?\s*:', raw, maxsplit=1)
    assert len(parts) == 3, match[1]
    main, note, keytext = parts
    statement_matches = list(re.finditer(r'^\s*([A-E])\.\s+', main, re.M))
    statements = {}
    for n, sm in enumerate(statement_matches):
        se = statement_matches[n+1].start() if n+1 < len(statement_matches) else len(main)
        statements[sm[1]] = ' '.join(main[sm.end():se].split())
    stem = ' '.join(main[:statement_matches[0].start()].split())
    km = list(re.finditer(r'^\s*([A-E])\.\s+(True|False)\s*[–—-]\s*', keytext, re.M))
    key = {}
    for n, k in enumerate(km):
        explanation = keytext[k.end():km[n+1].start() if n+1 < len(km) else len(keytext)].strip()
        explanation = re.split(r'\n\s*(?:G\d+:|Domain \d+:|Machine Learning|Quantitative Finance|Topic Groups|Domain Summary|Chapter Introduction)', explanation, maxsplit=1)[0]
        key[k[1]] = {'selected': k[2]=='True', 'explanation':' '.join(explanation.split())}
    subject = 'ML' if match[1].startswith('ML2') else 'QF'
    reverse = bool(note) or bool(re.search(r'mark each statement\s+True\s+(?:when|if)\s+(?:the stated claim|it)\s+is incorrect', stem, re.I))
    q = {'id':match[1], 'subject':subject, 'domain':int(match[2]), 'group':int(match[3]), 'number':int(match[4]), 'page':page, 'stem':stem, 'statements':statements, 'key_note':note or '', 'key':key, 'reverse':reverse, 'negatedItems':'each item asserts that its quoted statement is incorrect' in stem, 'domainId':match[1].split('G')[0]}
    assert set(statements) == set(key) == set('ABCDE'), (q['id'], statements, key)
    questions.append(q)
assert len({q['id'] for q in questions}) == len(questions)
(WORK/'questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2))
for subject in ['ML','QF']:
    (WORK/(subject.lower()+'-questions.json')).write_text(json.dumps([q for q in questions if q['subject']==subject],ensure_ascii=False,indent=2))
print(json.dumps({'questions':len(questions),'ML':sum(q['subject']=='ML' for q in questions),'QF':sum(q['subject']=='QF' for q in questions),'reverse':sum(q['reverse'] for q in questions),'groups':len({(q['domainId'],q['group']) for q in questions})}))

#!/usr/bin/env python3
"""Build the printable Exam 2 companion from the reviewed content JSON.

Run with the bundled Python runtime (reportlab and pypdf). The initial build
reads reviewed working JSON; a clean checkout can rebuild from exam-data.js.
Question start pages come from the question records, never copied annotations.
"""
from pathlib import Path
import html
import json
import re
from collections import Counter

from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, NextPageTemplate, KeepTogether,
)

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / '.work/exam2'
QA = WORK / 'pdfqa'
OUT = ROOT / 'docs/assets/CS7646_Exam2_Study_Guide.pdf'
QA.mkdir(parents=True, exist_ok=True)
FONT = Path('/Users/bay/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for name, filename in [('Body', 'DejaVuSans.ttf'), ('Bold', 'DejaVuSans-Bold.ttf'), ('Italic', 'DejaVuSans-Oblique.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='Bold', italic='Italic', boldItalic='Bold')
for name, filename in [('Serif', 'Georgia.ttf'), ('SerifBold', 'Georgia Bold.ttf')]:
    p = Path('/System/Library/Fonts/Supplemental') / filename
    if not p.exists():
        p = FONT / ('DejaVuSerif-Bold.ttf' if name == 'SerifBold' else 'DejaVuSerif.ttf')
    pdfmetrics.registerFont(TTFont(name, str(p)))

NAVY = colors.HexColor('#12314b')
TEAL = colors.HexColor('#107c80')
GRAY = colors.HexColor('#526372')
PALE = colors.HexColor('#edf5f6')
LINE = colors.HexColor('#d7e1e6')
GOLD = colors.HexColor('#a47424')
INK = colors.HexColor('#182b3a')
W = 524
COL = 252
styles = {
    'body': ParagraphStyle('body', fontName='Body', fontSize=9.25, leading=12.25, textColor=INK, spaceAfter=6),
    'small': ParagraphStyle('small', fontName='Body', fontSize=7.8, leading=10.2, textColor=GRAY, spaceAfter=4),
    'ref': ParagraphStyle('ref', fontName='Body', fontSize=7.3, leading=9.1, textColor=GRAY, spaceAfter=4),
    'h1': ParagraphStyle('h1', fontName='SerifBold', fontSize=20, leading=23, textColor=NAVY, spaceAfter=10, keepWithNext=True),
    'h2': ParagraphStyle('h2', fontName='SerifBold', fontSize=11.2, leading=14.1, textColor=TEAL, spaceBefore=5, spaceAfter=5, keepWithNext=True),
    'h3': ParagraphStyle('h3', fontName='Bold', fontSize=9.25, leading=12.2, textColor=NAVY, spaceBefore=4, spaceAfter=3, keepWithNext=True),
    'eyebrow': ParagraphStyle('eyebrow', fontName='Bold', fontSize=7.7, leading=10.5, textColor=TEAL, spaceAfter=6, keepWithNext=True),
    'formula': ParagraphStyle('formula', fontName='Body', fontSize=9.05, leading=12.2, textColor=INK, spaceAfter=4),
    'trap': ParagraphStyle('trap', fontName='Body', fontSize=8.5, leading=11.2, textColor=GOLD, spaceAfter=6),
    'cover': ParagraphStyle('cover', fontName='SerifBold', fontSize=37, leading=44, textColor=NAVY, spaceAfter=18),
    'coverbody': ParagraphStyle('coverbody', fontName='Body', fontSize=11.1, leading=15.4, textColor=INK, spaceAfter=10),
    'nav': ParagraphStyle('nav', fontName='Body', fontSize=8.2, leading=11.3, textColor=INK, spaceAfter=0),
    'tablehead': ParagraphStyle('tablehead', fontName='Bold', fontSize=8.3, leading=11.3, textColor=colors.white),
}

def norm(value):
    s = str(value)
    for c in ['–', '—', '‑', '−']:
        s = s.replace(c, '-')
    return s.replace('\u00a0', ' ').replace('ﬁ', 'fi').replace('ﬀ', 'ff').replace('ﬂ', 'fl')

def P(value, style='body', raw=False):
    s = norm(value)
    s = re.sub(r'&(?!#?\w+;)', '&amp;', s) if raw else html.escape(s)
    return Paragraph(s.replace('\n', '<br/>'), styles[style])

def rich(label, value, style='body'):
    return P(f'<b>{html.escape(norm(label))}</b> {html.escape(norm(value))}', style, True)

class Heading(Paragraph):
    def __init__(self, title, key):
        super().__init__(html.escape(norm(title)), styles['h1'])
        self.bookkey, self.booktitle = key, norm(title)

def box(title, text, width=W):
    t = Table([[P(title, 'h3')], [P(text)]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), PALE), ('BOX', (0, 0), (-1, -1), .4, LINE),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 5), ('BOTTOMPADDING', (0, -1), (-1, -1), 4),
    ]))
    return t

if all((WORK / filename).exists() for filename in ('ml-content.json', 'qf-content.json', 'questions.json')):
    ml = json.loads((WORK / 'ml-content.json').read_text())
    qf = json.loads((WORK / 'qf-content.json').read_text())
    questions = json.loads((WORK / 'questions.json').read_text())
    domains = ml['domains'] + qf['domains']
    tests = ml['selfTests'] + qf['selfTests']
    issues = ml['issues'] + qf['issues']
else:
    source = (ROOT / 'docs/exam2/exam-data.js').read_text()
    payload = re.fullmatch(r'\s*window\.EXAM\s*=\s*(\{.*\})\s*;?\s*', source, re.DOTALL)
    if not payload:
        raise ValueError('Expected the JSON assignment window.EXAM in docs/exam2/exam-data.js')
    exam = json.loads(payload.group(1))
    questions, domains, tests, issues = (exam[key] for key in ('questions', 'domains', 'selfTests', 'issues'))
Q = {q['id']: q for q in questions}
assert len(Q) == 420 and len(domains) == 20 and len(tests) == 20
assert sum(len(d['groups']) for d in domains) == 140
assert all(e['id'] in Q for d in domains for e in d['examples'])
rev = sum(bool(q['reverse']) for q in questions)
def qref(qid):
    return f"{qid} / pool p. {Q[qid]['page']}"

def groupref(group):
    return ' / '.join(f"{qid} p. {Q[qid]['page']}" for qid in group['ids'])

flow = []
def start(key, title, eyebrow='CS7646 / EXAM 2', columns=True, first=False):
    if not first:
        flow.extend([NextPageTemplate('columns' if columns else 'full'), PageBreak()])
    flow.extend([P(eyebrow, 'eyebrow'), Heading(title, key)])

# The first two pages are fixed so planner links can target the formula sheet at p. 3.
start('cover', 'Exam 2 study guide', columns=False, first=True)
flow[:] = [Spacer(1, 37), P('CS7646 / MACHINE LEARNING FOR TRADING', 'eyebrow'),
    P('Make decisions.\nMeasure the edge.\nPrice the trade.', 'cover'),
    P('Exam 2 | Machine learning + quantitative finance', 'h2'),
    P('A printable companion to the Study Lab: sequential decision-making, reinforcement learning, trading signals, evaluation, execution, portfolio construction, and options.', 'coverbody'),
    Spacer(1, 23)]
cover_rows = [
    ('420 questions', '210 machine learning + 210 quantitative finance'),
    ('140 groups', '70 ML groups + 70 quantitative finance groups'),
    ('20 domains', '10 ML chapters + 10 quantitative finance chapters'),
    ('Source scope', 'ML Part 2: pool pp. 421-581 / QF Part 2: pp. 582-753'),
]
t = Table([[P(a, 'h3'), P(b)] for a, b in cover_rows], colWidths=[143, 381])
t.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LINEBELOW', (0, 0), (-1, -1), .45, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 6)]))
flow.extend([t, Spacer(1, 22), box('The study objective', 'Explain the mechanism, perform the calculation, and interpret the result under the stated assumptions. Then check whether the item uses ordinary or reversed True/False labels.'), Spacer(1, 17), P('Built around the supplied ML4T Exam Question Pool, Rev081020261230. All source references use 1-based PDF pages. This is a teaching synthesis; coverage counts do not predict exam frequency. No official exam deadline was supplied.', 'small')])

start('navigation', 'How to use this guide', columns=False)
flow.extend([
    P('Read a domain, close the guide, and explain its rules from memory. Reproduce the worked calculations before looking at the result. Use the final mixed self-test to locate weak concepts, then return to the linked source question IDs.'),
    rich('Read the stem first.', f'{rev} of the 420 source items explicitly reverse the convention: mark True when the claim is incorrect and False when it is correct. Evaluate the underlying claim before translating it into the requested label.'),
    rich('Track the assumptions.', 'Use the stated reward timing, terminal-state treatment, exploration rule, return horizon, fee convention, cost base, and payoff-versus-profit definition. Nested negation requires evaluating both the claim and its wrapper.'),
    rich('Source cautions.', 'Published labels are retained in the Study Lab. A flagged contradiction is not silently corrected: learn the defensible concept and record the published selection separately. The caveat section identifies known conflicts and qualifications.'),
    P('Domain directory', 'h2')])
navrows = [[P('MACHINE LEARNING', 'tablehead'), P('QUANTITATIVE FINANCE', 'tablehead')]]
for left, right in zip(domains[:10], domains[10:]):
    cells = []
    for d in [left, right]:
        cells.append(P(f"<link href='#{d['id']}' color='#107c80'><b>{d['id']}</b> {html.escape(norm(d['title']))}</link>", 'nav', True))
    navrows.append(cells)
nav = Table(navrows, colWidths=[262, 262])
nav.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('LINEBELOW', (0, 0), (-1, -1), .45, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
flow.extend([nav, Spacer(1, 8), P("<link href='#formulas-ml' color='#107c80'>Formula sheets (start p. 3)</link> / <link href='#self-test' color='#107c80'>20-question self-test</link> / <link href='#answers' color='#107c80'>Separate answers</link> / <link href='#cautions' color='#107c80'>Source cautions</link>", 'small', True)])

ML_FORMULAS = [
 ('Discounted return', 'G_t = r_(t+1) + γr_(t+2) + γ²r_(t+3) + ...', 'γ controls discounting of later rewards; it is not the learning rate.'),
 ('One-step Q-learning', 'target = r + γ max_a Q(s′, a)\nQ_new(s,a) = Q_old(s,a) + α[target - Q_old(s,a)]', 'Use the next-state maximum, not the current-state maximum. Only the visited state-action entry is directly updated.'),
 ('Terminal update', 'target = r; Q_new = (1-α)Q_old + αr', 'A true terminal transition has no continuation value. Artificial truncation and true termination need not be equivalent.'),
 ('Epsilon-greedy', 'P(a_greedy) = 1-ε+ε/k\nP(a_other) = ε/k', 'Assumes one greedy action and uniform exploration over all k legal actions. If random exploration excludes the greedy action, probabilities differ.'),
 ('Exploration decay', 'ε_n = ε_0 × d^n', 'Counts n decay applications. Declining exploration changes action selection; it does not itself reduce the Q-learning step size.'),
 ('Dyna planning', 'real experience + model updates + simulated Q updates', 'The same temporal-difference rule can update real and simulated transitions. More planning improves reuse but can amplify model error.'),
 ('Discrete state space', 'N_states = ∏ b_j; N_Q_entries = N_states × N_actions', 'Multiply state-variable cardinalities. Include holdings or time when they change reward or feasible future actions.'),
 ('Target position to trade', 'trade_t = target_holdings_t - current_holdings_t', 'Moving from +L to -L trades -2L. A target of zero liquidates an existing holding; it is not automatically “do nothing.”'),
 ('Returns and sample evaluation', 'r_t = V_t/V_(t-1) - 1\nR = ∏(1+r_t) - 1', 'Use aligned dates, capital, execution, leverage, and costs. Repeated historical episodes are not independent new market samples.'),
 ('Neural layer', 'h = activation(Wx+b)', 'Nonlinear activations allow nonlinear compositions. Extra parameters or channels do not establish causality or generalization.'),
]
QF_FORMULAS = [
 ('Trailing indicators', 'SMA(n) = mean(last n prices)\nMomentum(L) = P_t/P_(t-L) - 1\nEMA_t = αP_t + (1-α)EMA_(t-1)', 'A common EMA convention uses α=2/(n+1). Specify initialization, window, and information timestamp.'),
 ('Bands and normalized position', 'Upper / Lower = μ ± kσ\nz = (P-μ)/σ\n%B = (P-Lower)/(Upper-Lower)', 'A band breach is an observation. %B can exceed [0,1]; neither a band touch nor “overbought” guarantees reversal.'),
 ('Information coefficient', 'IC = Corr(forecast, subsequent outcome)', 'Align observations, horizon, and information time. Rank IC measures rank agreement; magnitude and economic value are different questions.'),
 ('Fundamental Law', 'IR ≈ IC × sqrt(BR)\nConstrained extension: IR ≈ TC × IC × sqrt(BR)', 'BR is effective independent breadth, not raw correlated trade count. TC represents implementation fidelity under the stated extension.'),
 ('Sharpe and information ratio', 'Sharpe = mean(r_p-r_f)/sd(r_p-r_f)\nIR = mean(r_p-r_b)/sd(r_p-r_b)', 'Use matched periodicity. Under suitable assumptions, annualize a periodic ratio by sqrt(periods/year). Denominators differ.'),
 ('Trading costs', 'cost = traded notional × bps/10,000\nnet profit = gross profit - all modeled costs', 'Check one-way versus round-trip quotes and turnover convention. Spread, commission, impact, delay, and opportunity cost can overlap if carelessly combined.'),
 ('Option expiration payoff', 'Call = max(S_T-K, 0)\nPut = max(K-S_T, 0)', 'Long-option profit subtracts the premium paid; short-option profit is the premium received minus its payoff obligation.'),
 ('Option breakeven', 'Long call: K + call premium\nLong put: K - put premium', 'Simple expiration profit, per share, before financing, dividends, fees, and contract multiplier effects.'),
 ('Put-call parity', 'C - P = S_0 - PV(K)', 'Same strike and expiration, European exercise, and stated no-dividend/no-friction assumptions. Adjust the identity when assumptions change.'),
 ('Active portfolio construction', 'active weights a = w-b\nvariance = wᵀΣw; TE² = aᵀΣa\ngross = Σ|w_i|; net = Σw_i', 'Underweight is not necessarily short. Net neutrality does not guarantee beta neutrality or low gross exposure.'),
]
for key, title, rows in [('formulas-ml', 'Formula sheet | Machine learning', ML_FORMULAS), ('formulas-qf', 'Formula sheet | Quantitative finance', QF_FORMULAS)]:
    start(key, title, columns=False)
    formula_rows = [[P('CONCEPT', 'tablehead'), P('FORMULA AND CONDITIONS', 'tablehead')]]
    for name, formula, condition in rows:
        formula_rows.append([P(name, 'h3'), [P(formula, 'formula'), P(condition, 'small')]])
    table = Table(formula_rows, colWidths=[133, 391], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('LINEBELOW', (0, 0), (-1, -1), .45, LINE), ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8), ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5)]))
    flow.append(table)

for d in domains:
    start(d['id'], d['title'], f"{d['id']} / {'MACHINE LEARNING' if d['subject']=='ML' else 'QUANTITATIVE FINANCE'} / 21 QUESTIONS")
    flow.append(P('Core understanding', 'h2'))
    for core in d['core']:
        flow.append(rich(core['title'] + '.', core['text']))
    flow.append(P('Every source group', 'h2'))
    for g in d['groups']:
        flow.extend([P(f"G{g['number']} | {g['title']}", 'h3'), P(groupref(g), 'ref'), P(' '.join(g['rules']))])
        if g['traps']:
            flow.append(rich('Watch the wording:', ' '.join(g['traps']), 'trap'))
    if d['formulas']:
        flow.append(P('Formulas and conditions', 'h2'))
        for f in d['formulas']:
            flow.extend([P(f['name'], 'h3'), P(f['formula'], 'formula'), P(f['conditions'], 'small')])
    flow.append(P('Work it through', 'h2'))
    for e in d['examples']:
        flow.extend([P(e['title'], 'h3'), P(qref(e['id']), 'ref'), P(e['prompt']), P(e['work']), rich('Result:', e['result'])])

for n, test in enumerate(tests, 1):
    if n in (1, 11):
        start('self-test' if n == 1 else 'self-test-2', f'Mixed self-test | Questions {n}-{n+9}', columns=False)
        flow.append(P('Answer without notes. Show your calculation and state the controlling assumption. The separate answer section explains the result.'))
    flow.extend([P(f"{n:02d} / {test['domainId']}", 'h3'), P(test['prompt']), Spacer(1, 10)])

for n, test in enumerate(tests, 1):
    if n in (1, 11):
        start('answers' if n == 1 else 'answers-2', f'Self-test answers | {n}-{n+9}', columns=False)
        flow.append(P('Compare the reasoning as well as the number. Check the horizon, denominator, information timing, and selection convention.'))
    flow.extend([P(f"{n:02d} / {test['domainId']}", 'h3'), P(test['answer'])])

start('cautions', 'Source-key cautions and interpretation', columns=False)
flow.extend([P('The published key is evidence about the supplied pool, not a guarantee that every label and rationale agree. The Study Lab preserves published selections. The cases below distinguish those selections from the conceptual rule.'), P('Known source conflicts', 'h2')])
for issue in issues:
    qid = issue['id']
    flow.extend([P(f"{qid} {issue.get('letter', '')} | {issue['kind']}", 'h3'), P(qref(qid), 'ref')])
    if 'statement' in issue:
        flow.append(rich('Source statement:', issue['statement']))
    if 'official' in issue:
        flow.append(rich('Published selection:', str(issue['official'])))
    flow.append(P(issue['detail']))
    for source in issue.get('sources', []):
        if isinstance(source, dict) and source.get('url'):
            flow.append(P(f"<link href='{html.escape(source['url'])}' color='#107c80'>{html.escape(source.get('title', source['url']))}</link>", 'small', True))

flow.extend([P('Conventions to keep explicit', 'h2')])
for label, text in [
    ('Q-learning and episodes.', 'A true terminal state has no bootstrapped continuation value. A time limit used to cut a continuing simulation may need a different treatment. Repeated episodes reuse experience; they do not manufacture independent market histories.'),
    ('Exploration.', 'Uniform exploration can include the greedy action. Compute action probabilities from the actual sampling rule, the number of legal actions, and any tie-breaking rule.'),
    ('Breadth and transfer.', 'The Fundamental Law is an approximate framework. Count effective independent decisions, align the evaluation horizon, and distinguish forecast skill from the ability to implement it under costs and constraints.'),
    ('Costs and turnover.', 'A cost quoted in basis points applies to a stated notional base. One-way turnover, total traded dollars, and complete round trips are different conventions. Avoid double-counting a spread already embedded in execution prices.'),
    ('Options.', 'Separate payoff from profit, strike from premium, and moneyness from profitability. State exercise style, dividends, financing, contract multiplier, and expiry assumptions before using parity or breakeven.'),
    ('Source pages.', 'A source question can continue onto later pages. The group and example citations identify its actual 1-based PDF start page, including the page corrections made during extraction review.'),
]:
    flow.append(rich(label, text))

start('sources', 'Coverage and final readiness check', columns=False)
flow.extend([
    P('Scope and evidence', 'h2'),
    P('This companion covers ML Part 2 and quantitative finance Part 2 in the supplied ML4T Exam Question Pool, Rev081020261230: 420 question IDs, 140 groups, and 20 domains. Every group and every worked example in the reviewed Exam 2 teaching data appears in the domain chapters. Source scope is pp. 421-581 for ML2 and pp. 582-753 for QF2.'),
    P('Question references', 'h2'),
    P('ML2-D3G2Q1 means machine learning, Part 2, domain 3, group 2, question 1. QF2 uses the same structure for quantitative finance. “Pool p.” refers to the original source PDF, not this guide. The chapter directory, PDF bookmarks, and footer provide navigation within this guide.'),
    P('How this guide relates to practice', 'h2'),
    P('The chapters explain mechanisms and common distractors. Worked examples adapt or illustrate cited scenarios; they are teaching exercises rather than reproductions of every option in the source. The 20 self-test questions are derived retrieval practice, one per domain. Use the full Study Lab question bank to practice exact wording and the retained published labels.'),
    P('Six calculation areas', 'h2'),
    P('The Study Lab’s calculator practice covers Q-learning updates, epsilon-greedy action probabilities, technical indicators, the Fundamental Law, trading costs, and option payoff/profit. Reproduce each calculation on paper and explain its assumptions before relying on a calculator output.'),
    P('Ready when you can explain all four', 'h2'),
    rich('1. Mechanism.', 'Describe what changes after the action, why a signal might work, or which contract right creates the payoff.'),
    rich('2. Arithmetic.', 'Write the formula with units, dates, sign, horizon, and denominator before substituting.'),
    rich('3. Qualification.', 'State what the result does not prove: convergence, causality, independent breadth, executable fills, or positive net performance.'),
    rich('4. Wording.', 'Translate the evaluated claim into the requested True/False convention and recognize the flagged source-key conflicts.'),
    P('No official exam deadline is asserted here. The guide and planner are preparation tools, not course scheduling announcements.', 'small'),
])

page_map = {}
class Doc(BaseDocTemplate):
    def afterFlowable(self, f):
        if isinstance(f, Heading):
            self.canv.bookmarkPage(f.bookkey)
            self.canv.addOutlineEntry(f.booktitle, f.bookkey, level=0, closed=False)
            page_map[f.bookkey] = self.page

def footer(c, doc):
    c.saveState()
    c.setStrokeColor(LINE)
    c.setLineWidth(.5)
    c.line(44, 37, 568, 37)
    c.setFont('Body', 7.4)
    c.setFillColor(GRAY)
    c.drawString(44, 24, 'CS7646 / EXAM 2 / Rev081020261230')
    c.drawRightString(568, 24, str(doc.page))
    c.setFillColor(TEAL)
    c.drawCentredString(306, 24, 'Contents')
    c.linkRect('', 'navigation', (278, 17, 334, 31), relative=0, thickness=0)
    if doc.page > 1:
        c.setFont('Body', 7)
        c.setFillColor(GRAY)
        c.drawString(44, 772, 'MACHINE LEARNING + QUANTITATIVE FINANCE')
        c.setStrokeColor(GOLD)
        c.line(44, 762, 568, 762)
    c.restoreState()

doc = Doc(str(OUT), pagesize=(612, 792), leftMargin=44, rightMargin=44, topMargin=47, bottomMargin=45,
          title='CS7646 Exam 2 - Study Guide', author='Prepared for Bay',
          subject='ML4T Exam 2: reinforcement learning and quantitative finance', pageCompression=1)
doc.addPageTemplates([
    PageTemplate(id='full', frames=[Frame(44, 45, W, 704, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer),
    PageTemplate(id='columns', frames=[Frame(44, 45, COL, 704, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0), Frame(316, 45, COL, 704, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=footer),
])
doc.build(flow)
reader = PdfReader(str(OUT))
actual = len(reader.pages)
assert page_map['navigation'] == 2, page_map
assert page_map['formulas-ml'] == 3, page_map
mapping = {
    'pdf': str(OUT), 'page_count': actual,
    'domains': {d['id']: {'page': page_map[d['id']], 'title': d['title']} for d in domains},
    'selfTestPage': page_map['self-test'], 'answerPage': page_map['answers'],
    'formulaPage': 3, 'sections': page_map,
    'scope': {'questions': len(Q), 'groups': 140, 'domains': 20, 'workedExamples': sum(len(d['examples']) for d in domains), 'selfTests': len(tests)},
}
(WORK / 'pdf-page-map.json').write_text(json.dumps(mapping, indent=2))
text_pages = [p.extract_text() for p in reader.pages]
alltext = '\n'.join(text_pages)
missing_ids = [qid for qid in Q if qid not in alltext]
assert not missing_ids, missing_ids
check = {
    'page_count': actual, 'missing_question_ids': missing_ids,
    'page_text_lengths': [len(t) for t in text_pages],
    'domain_page_spans': {d['id']: ((page_map[domains[i+1]['id']] if i+1 < len(domains) else page_map['self-test']) - page_map[d['id']]) for i,d in enumerate(domains)},
    'formula_page': page_map['formulas-ml'], 'source_issues': len(issues),
}
(QA / 'checks.json').write_text(json.dumps(check, indent=2))
print(json.dumps(mapping, indent=2))

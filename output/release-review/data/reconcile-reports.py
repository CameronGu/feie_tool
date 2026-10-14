from pathlib import Path
from datetime import date,timedelta
import re,json
base=Path(__file__).resolve().parents[1]
def each(a,b):
 a=date.fromisoformat(a) if isinstance(a,str) else a;b=date.fromisoformat(b) if isinstance(b,str) else b
 while a<=b:
  yield a;a+=timedelta(days=1)
rows=[]
for p in sorted(base.joinpath('reports').glob('*.txt')):
 if p.name.endswith('.pdf-text.txt'):continue
 t=p.read_text();y=int(re.search(r'Calendar tax year: (\d+)',t)[1]);ys=date(y,1,1);ye=date(y,12,31)
 foreign=set();unknown=set();recorded=set();assumed=set();projected=set()
 for s,e,kind,basis,flag in re.findall(r'^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}) \| (foreign|us|nonqualifying|unknown) \| (recorded|assumed|unrecorded) \| (projected|completed/unknown) \| source ',t,re.M):
  ds=set(each(s,e))
  if kind=='unknown':unknown|=ds
  if kind=='foreign':
   foreign|=ds
   if basis=='recorded' and flag!='projected':recorded|=ds
   if basis=='assumed':assumed|=ds
   if flag=='projected':projected|=ds
 union=set();passing=0;maxupper=0
 for s in each(date(y-1,1,1),ye):
  if (s.month,s.day)==(2,29):continue
  e=date(s.year+1,s.month,s.day)-timedelta(days=1)
  if e<ys:continue
  ds=set(each(s,e));maxupper=max(maxupper,len(ds&(foreign|unknown)))
  if len(ds&foreign)>=330:passing+=1;union|=set(each(max(s,ys),min(e,ye)))
 n,d,decimal=re.search(r'^(\d+) / (\d+) = ([0-9.]+)',t,re.M).groups()
 issues=[]
 if (int(n),int(d))!=(len(union),(ye-ys).days+1):issues.append('union/fraction')
 if abs(float(decimal)-int(n)/int(d))>0.00000051:issues.append('rounded fraction')
 if passing!=int(re.search(r'Passing ordinary-date periods: (\d+)',t)[1]):issues.append('passing count')
 for s,e,calendar,f,r,a,pr,u,overlap in re.findall(r'(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2}) \((\d+) calendar days\)\nFull foreign days: (\d+) / 330 required; recorded completed: (\d+); assumed: (\d+); projected foreign: (\d+); unknown: (\d+).*?\nTax-year intersection: (\d+) days\.',t):
  ds=set(each(s,e));expected=[len(ds),len(ds&foreign),len(ds&recorded),len(ds&assumed),len(ds&projected),len(ds&unknown),len(ds&set(each(ys,ye)))]
  if expected!=list(map(int,[calendar,f,r,a,pr,u,overlap])):issues.append('period evidence')
 extracted=p.with_suffix('.pdf-text.txt').read_text()
 for line in t.splitlines()[2:]:
  if re.sub(r'\s+','',line) not in re.sub(r'\s+','',extracted):issues.append('PDF text omission: '+line[:50])
 rows.append(dict(report=p.stem,days=int(n),denominator=int(d),passing=passing,maximum_possible_foreign_days_if_all_unknown_were_foreign=maxupper,issues=issues))
base.joinpath('data/report-reconciliation.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))

// Lineare Bedingungen werden als a*x + b*y + c > 0 normalisiert.
// Die Koordinatentoleranz EPS zählt den Rand und eine schmale Rundungszone als 0.
export const EPS = 1e-9;
const LIMIT = 1e12;
const syntax = (kind) => `Die Eingabe ist noch keine gültige lineare ${kind}. Prüfe Zahlen, Variablen und genau ein Vergleichszeichen.`;
export const STRICT_MESSAGE = 'Eine Feuerhalbebene braucht hier ein strenges > oder <. Bei Gleichheit ist die Ausgabe 0.';
export const EQUALITY_MESSAGE = 'Für die Trennlinie brauchst du eine Gleichung mit =; die Ungleichung beschreibt eine Seite.';
export const DEGENERATE_MESSAGE = 'Die Bedingung enthält keine Trennlinie. Mindestens ein Koeffizient vor x oder y muss ungleich 0 sein.';

function tokenize(source) {
  const input = source.replaceAll('−', '-').replaceAll('–', '-').replaceAll('·', '*').replaceAll('₁','1').replaceAll('₂','2');
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    if (/\s/.test(input[i])) { i++; continue; }
    const rest = input.slice(i);
    const number = /^(?:\d+(?:[.,]\d+)?|[.,]\d+)/.exec(rest);
    const variable = /^(?:x1|x2|x|y)(?![a-z\d])/i.exec(rest);
    const comparison = /^(?:>=|<=|>|<|=)/.exec(rest);
    if (number) { tokens.push({ type: 'number', value: Number(number[0].replace(',', '.')) }); i += number[0].length; }
    else if (variable) { tokens.push({ type: 'variable', value: variable[0].toLowerCase() }); i += variable[0].length; }
    else if (comparison) { tokens.push({ type: 'comparison', value: comparison[0] }); i += comparison[0].length; }
    else if ('+-*()'.includes(input[i])) { tokens.push({ type: input[i] }); i++; }
    else throw new Error('syntax');
  }
  return tokens;
}
const add = (p,q) => [p[0]+q[0],p[1]+q[1],p[2]+q[2]];
const neg = (p) => p.map(v => -v);
function multiply(p,q) {
  if ((p[0] || p[1]) && (q[0] || q[1])) throw new Error('nonlinear');
  if (p[0] || p[1]) return p.map(v => v*q[2]);
  return q.map(v => v*p[2]);
}
function parseTerm(tokens) {
  let at = 0;
  function atom() {
    const token = tokens[at++];
    if (!token) throw new Error('syntax');
    if (token.type === '+') return atom();
    if (token.type === '-') return neg(atom());
    if (token.type === 'number') return [0,0,token.value];
    if (token.type === 'variable') return token.value === 'x' || token.value === 'x1' ? [1,0,0] : [0,1,0];
    if (token.type === '(') { const value=expression(); if (tokens[at++]?.type !== ')') throw new Error('syntax'); return value; }
    throw new Error('syntax');
  }
  function product() {
    let value=atom();
    while (at < tokens.length) {
      if (tokens[at].type === '*') { at++; value=multiply(value,atom()); }
      else if (['number','variable','('].includes(tokens[at].type)) {
        if (tokens[at].type === 'number' && tokens[at-1]?.type === 'number') throw new Error('syntax');
        value=multiply(value,atom());
      }
      else break;
    }
    return value;
  }
  function expression() {
    let value=product();
    while (tokens[at]?.type === '+' || tokens[at]?.type === '-') {
      const operator=tokens[at++].type;
      const next=product(); value=add(value,operator==='+'?next:neg(next));
    }
    return value;
  }
  const value=expression();
  if (at !== tokens.length) throw new Error('syntax');
  return value;
}

export function parseLinearRelation(source, { kind='Ungleichung', variables='both' }={}) {
  const fail=(code,message)=>({ok:false,code,message});
  if (typeof source !== 'string' || source.length > 250) return fail('syntax',syntax(kind));
  let tokens;
  try { tokens=tokenize(source); } catch { return fail('syntax',syntax(kind)); }
  const matches=tokens.map((token,index)=>token.type==='comparison'?index:-1).filter(index=>index>=0);
  if (matches.length!==1) return fail('syntax',syntax(kind));
  const index=matches[0], sign=tokens[index].value;
  if (kind==='Ungleichung' && ['=','>=','<='].includes(sign)) return fail('strict',STRICT_MESSAGE);
  if (kind==='Gleichung' && sign!=='=') return fail('equality',EQUALITY_MESSAGE);
  const names=tokens.filter(token=>token.type==='variable').map(token=>token.value);
  if ((variables==='input' && names.some(name=>!['x1','x2'].includes(name))) || (variables==='diagram' && names.some(name=>!['x','y'].includes(name)))) return fail('syntax',syntax(kind));
  try {
    let left=parseTerm(tokens.slice(0,index));
    let right=parseTerm(tokens.slice(index+1));
    let values=add(left,neg(right));
    if (sign==='<') values=neg(values);
    const [a,b,c]=values, length=Math.hypot(a,b);
    if (!Number.isFinite(length) || length===0) return fail('degenerate',DEGENERATE_MESSAGE);
    if (![a,b,c].every(v=>Number.isFinite(v) && Math.abs(v)<=LIMIT)) return fail('syntax',syntax(kind));
    const normalized=values.map(v=>v/length);
    if (!normalized.every(Number.isFinite)) return fail('syntax',syntax(kind));
    return {ok:true,kind,sign,a,b,c,normalized,source};
  } catch { return fail('syntax',syntax(kind)); }
}

export function equivalent(first,second,{line=false}={}) {
  if (!first?.ok || !second?.ok) return false;
  const u=first.normalized,v=second.normalized;
  const same=u.every((value,index)=>Math.abs(value-v[index])<=EPS);
  return same || (line && u.every((value,index)=>Math.abs(value+v[index])<=EPS));
}
export function sameBoundary(first,second) { return equivalent(first,second,{line:true}); }
export function classify(relation,x,y) {
  if (!relation?.ok || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  const [a,b,c]=relation.normalized;
  return a*x+b*y+c>EPS ? 1 : 0;
}
export function countMatching(relation,rows) {
  const details=rows.map(row=>({...row,output:classify(relation,row.x,row.y)}));
  return {count:details.filter(row=>row.output===row.target).length,details};
}

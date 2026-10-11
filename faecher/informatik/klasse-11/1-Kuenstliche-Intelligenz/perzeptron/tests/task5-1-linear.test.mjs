import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLinearRelation as parse,equivalent,sameBoundary,classify,countMatching} from '../logic/linear-inequality.mjs';
const target=parse('4x1+2x2>3');
const rows=[{x:0,y:0,target:0},{x:0,y:1,target:0},{x:1,y:0,target:1},{x:1,y:1,target:1}];

test('äquivalente Schreibweisen und positive Skalierung',()=>{
  for(const text of ['y > -2x + 1,5','4*x + 2*y > 3','3 < 4x + 2y','-4x - 2y < -3','y + 2x > 1,5','8x1+4x2>6','2(x1+x2)+2x1>3']) assert.equal(equivalent(parse(text),target),true,text);
  assert.equal(equivalent(parse('-4x-2y>-3'),target),false);
  assert.equal(equivalent(parse('y<-2x+1,5'),target),false);
  assert.equal(sameBoundary(parse('y<-2x+1,5'),target),true);
});
test('strenge Grenze und andere Trennungen',()=>{
  assert.equal(classify(target,.25,1),0);
  assert.equal(classify(target,.25,1+1e-10),0);
  assert.equal(classify(target,.25,1.5),1);
  for(const text of ['x>0,5','x>0,25','x+0,1y>0,5']) assert.equal(countMatching(parse(text),rows).count,4,text);
  assert.equal(equivalent(parse('x>0,5'),target),false);
  assert.equal(parse('x>0,5').ok,true);
  assert.equal(parse('y>0,5').ok,true);
});
test('falsche Vergleichsarten und Syntax werden gezielt abgewiesen',()=>{
  for(const text of ['x=y','x>=y','x<=y']) assert.equal(parse(text).code,'strict');
  assert.equal(parse('y=-2x+1,5',{kind:'Gleichung'}).ok,true);
  assert.equal(parse('y>-2x+1,5',{kind:'Gleichung'}).code,'equality');
  for(const text of ['xy>1','x²>1','x/2>1','z>1','x>1>0','x>','NaN>x','Infinity>x','1,2,3>x','x*>1','x>0.']) assert.equal(parse(text).ok,false,text);
  assert.equal(parse('1>0').code,'degenerate');
  assert.equal(parse('x-x>0').code,'degenerate');
  assert.equal(parse('x+1>0',{variables:'input'}).ok,false);
  assert.equal(parse('x1+1>0',{variables:'input'}).ok,true);
});

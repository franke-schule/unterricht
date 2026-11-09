import test from 'node:test';
import assert from 'node:assert/strict';
import { G, INITIAL, distance, force, validState, setDistance, moveBody, parseQuantity, checkQuantity } from '../gravitation-model.mjs';

test('Startwert und kontrollierte Kraftverhältnisse',()=>{
  const base=force(INITIAL);
  assert.equal(G,6.67430e-11);
  assert.ok(Math.abs(base*1e6-21.45311)<0.001);
  assert.ok(Math.abs(force({...INITIAL,m1:7})/base-2)<1e-12);
  assert.ok(Math.abs(force({...INITIAL,m1:7,m2:9})/base-4)<1e-12);
  assert.equal(setDistance(INITIAL,14),null); // 14 m is rejected by the 12 m control.
  const half=force(setDistance(INITIAL,12))/base;
  assert.ok(Math.abs(half-(7/12)**2)<1e-12);
});
test('Mittelpunktabstand, Richtungen, Nullmasse und Reset',()=>{
  assert.equal(distance(INITIAL),7);
  const up=moveBody(INITIAL,2,INITIAL.x1,INITIAL.y1+5.5);
  assert.ok(validState(up));assert.ok(Math.abs(distance(up)-5.5)<1e-12);
  const verticalTwelve=setDistance(up,12);
  assert.ok(validState(verticalTwelve));assert.ok(Math.abs(distance(verticalTwelve)-12)<1e-12);
  assert.equal(force({...INITIAL,m1:0}),0);
  const reset={...INITIAL};assert.deepEqual(reset,INITIAL);
  assert.equal(setDistance(INITIAL,0),null);
  assert.ok(distance(moveBody(INITIAL,2,INITIAL.x1,INITIAL.y1))>=0.5);
});
test('Messreihen stimmen mit lokalem G gerundet überein',()=>{
  const a=[3.5,4,4.5,5].map(m1=>+(force({...INITIAL,m1})*1e6).toFixed(2));
  assert.deepEqual(a,[21.45,24.52,27.58,30.65]);
  const b=[3.5,4,4.5,5].map(m2=>+(force({...INITIAL,m1:5,m2})*1e6).toFixed(2));
  assert.deepEqual(b,[23.84,27.24,30.65,34.05]);
  const c=[5.5,6,7,7.5].map(r=>+(force(setDistance({...INITIAL,m1:3,m2:3},r))*1e6).toFixed(2));
  assert.deepEqual(c,[19.86,16.69,12.26,10.68]);
});
test('M2-Vergleichsmessungen liefern 4F und ein Viertel F',()=>{
  const reference={...INITIAL,m1:2,m2:3,x1:0,y1:0,x2:4,y2:0};
  const doubled={...reference,m1:4,m2:6};
  const distant={...reference,x2:8};
  assert.ok(Math.abs(force(doubled)/force(reference)-4)<1e-12);
  assert.ok(Math.abs(force(distant)/force(reference)-0.25)<1e-12);
  assert.deepEqual([reference,doubled,distant].map(s=>+(force(s)*1e6).toFixed(2)),[25.03,100.11,6.26]);
});
test('Zahlenschreibweisen, SI-Umrechnung und gültige Ziffern',()=>{
  assert.deepEqual(parseQuantity('6,67·10^-11'),{value:6.67e-11,digits:3,ambiguous:false});
  assert.equal(checkQuantity('1,5','N',{target:1.473951985,digits:2,units:{N:1,'µN':1e-6}}),'correct');
  assert.equal(checkQuantity('1500000','µN',{target:1.473951985,digits:2,units:{N:1,'µN':1e-6}}),'precision');
  assert.equal(checkQuantity('3,4·10^3','km',{target:3402264,digits:2,units:{km:1000,m:1}}),'correct');
  assert.equal(checkQuantity('3400','km',{target:3402264,digits:2,units:{km:1000,m:1}}),'precision');
  assert.equal(checkQuantity('6,8e-11','N',{target:6.75496e-11,digits:2,units:{N:NaN,'N·m²/kg²':1}}),'wrong');
});
test('Gespeicherter Simulationsstand wird nur im gültigen Bereich angenommen',()=>{
  assert.ok(validState(JSON.parse(JSON.stringify(INITIAL))));
  assert.equal(validState({...INITIAL,m1:9}),false);
  assert.equal(validState({...INITIAL,x2:NaN}),false);
  assert.equal(validState({...INITIAL,x2:INITIAL.x1}),false);
});

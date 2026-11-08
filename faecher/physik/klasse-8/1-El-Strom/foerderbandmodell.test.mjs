import test from "node:test";
import assert from "node:assert/strict";
import { deriveModel, chainSpeed, sampledClosedPath, positionAtDistance } from "./foerderbandmodell.mjs";
import { createPhysicsTaskProgress } from "../../klasse-11/1-Kreisbewegungen/components/physics-task-progress.mjs";

test("all three circuits conserve voltage and current exactly", () => {
  for (let u=2;u<=12;u++) for(let tenths=2;tenths<=20;tenths++) {
    const i=tenths/10;
    const simple=deriveModel("simple",u,i);
    const series=deriveModel("series",u,i);
    const parallel=deriveModel("parallel",u,i);
    assert.deepEqual(simple.branchVoltages,[u]);
    assert.deepEqual(simple.branchCurrents,[i]);
    assert.equal(series.branchVoltages[0]+series.branchVoltages[1],u);
    assert.deepEqual(series.branchCurrents,[i,i]);
    assert.deepEqual(parallel.branchVoltages,[u,u]);
    assert.equal(Math.round((parallel.branchCurrents[0]+parallel.branchCurrents[1])*100),Math.round(i*100));
    assert.equal(simple.lower,series.lower);
    assert.equal(series.lower,parallel.lower);
    assert.equal(series.middle,(series.lower+series.top)/2);
    assert.equal(simple.ballsPerChain,series.ballsPerChain);
    assert.equal(series.ballsPerChain,parallel.ballsPerChain);
  }
});

test("arc-length speed preserves throughput when height changes", () => {
  const makePath=height=>sampledClosedPath([
    {x:0,y:0,z:0},{x:1,y:height,z:0},{x:4,y:height,z:0},
    {x:5,y:0,z:0},{x:0,y:0,z:0},
  ]);
  const low=makePath(1),high=makePath(3);
  assert.ok(high.length>low.length);
  for(const path of [low,high]) {
    const model=deriveModel("parallel",6,1.1);
    const speed=chainSpeed(path.length,model.chainCurrents[0],model.ballsPerChain);
    assert.ok(Math.abs(model.ballsPerChain*speed/path.length - model.chainCurrents[0]*.72)<1e-10);
    assert.equal(model.chains,2);
    assert.equal(positionAtDistance(path,0).distanceTo(positionAtDistance(path,path.length)),0);
  }
});

test("invalid state cannot enter the model", () => {
  assert.throws(()=>deriveModel("unknown",6,1),RangeError);
  assert.throws(()=>deriveModel("simple",0,1),RangeError);
  assert.throws(()=>deriveModel("series",6,2.1),RangeError);
  assert.throws(()=>deriveModel("parallel",6,.25),RangeError);
});

test("progress namespace defaults to the old Physik 11 key", () => {
  const originalDocument=globalThis.document,originalStorage=globalThis.localStorage;
  const entries=new Map();
  globalThis.document={addEventListener(){},querySelectorAll(){return [];}};
  globalThis.localStorage={getItem(key){return entries.get(key)||null;},setItem(key,value){entries.set(key,value);},removeItem(key){entries.delete(key);}};
  try {
    const old=createPhysicsTaskProgress("aufgabe8");
    const next=createPhysicsTaskProgress("aufgabe1","physik8-foerderbandmodell");
    assert.equal(old.storageKey,"physik11-kreisbewegungen-aufgabe8-v1");
    assert.equal(next.storageKey,"physik8-foerderbandmodell-aufgabe1-v1");
    old.restore();next.restore();
    assert.ok(entries.has(old.storageKey));
    assert.ok(entries.has(next.storageKey));
  } finally {
    globalThis.document=originalDocument;globalThis.localStorage=originalStorage;
  }
});

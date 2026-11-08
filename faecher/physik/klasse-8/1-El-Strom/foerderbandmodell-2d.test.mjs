import test from "node:test";
import assert from "node:assert/strict";
import { deriveModel, chainSpeed, fmtVoltage, fmtCurrent, readoutHtml, equationsHtml } from "./foerderbandmodell-core.mjs";
import { geometry } from "./foerderbandmodell-2d.mjs";

test("all voltages and currents keep their branch sums and one fixed ball count",()=>{
  for(let voltage=2;voltage<=12;voltage++)for(let tenths=2;tenths<=20;tenths++){
    const current=tenths/10;
    for(const mode of ["simple","series","parallel"]){
      const m=deriveModel(mode,voltage,current);
      assert.equal(m.ballsPerChain,24);
      assert.equal(m.chains,mode==="parallel"?2:1);
      assert.ok(Math.abs((m.top-m.lower)-voltage*.22)<1e-12);
      assert.equal(m.middle,(m.top+m.lower)/2);
      assert.equal(m.branchVoltages.length,mode==="simple"?1:2);
      assert.equal(m.branchCurrents.length,mode==="simple"?1:2);
      if(mode==="series")assert.equal(m.branchVoltages[0]+m.branchVoltages[1],voltage);
      if(mode==="parallel")assert.equal(Math.round((m.branchCurrents[0]+m.branchCurrents[1])*100),tenths*10);
      const passage=24*chainSpeed(1373,m.chainCurrents[0],24)/1373;
      assert.ok(Math.abs(passage-m.chainCurrents[0]*.72)<1e-12);
    }
  }
});

test("visible halves and sums use decimal commas and exact two-place values",()=>{
  const series=deriveModel("series",7,1.1),parallel=deriveModel("parallel",7,1.1);
  assert.equal(fmtVoltage(series.branchVoltages[0]),"3,5 V");
  assert.equal(fmtCurrent(parallel.branchCurrents[0]),"0,55 A");
  assert.match(readoutHtml(parallel),/I<sub>1<\/sub> = 0,55 A/);
  assert.match(equationsHtml(series),/3,5 V \+ 3,5 V = 7 V/);
  assert.match(equationsHtml(parallel),/0,55 A \+ 0,55 A = 1,1 A/);
  assert.doesNotMatch(equationsHtml(parallel),/I\/2/);
});

test("invalid state is rejected by the shared core",()=>{
  for(const args of [["other",6,1],["simple",1,1],["series",13,1],["parallel",6,.25],["parallel",6,2.1]])assert.throws(()=>deriveModel(...args),RangeError);
});

test("parallel chains run right together before branching in the right-hand area",()=>{
  for(const compact of [false,true])for(let voltage=2;voltage<=12;voltage++){
    const g=geometry(deriveModel("parallel",voltage,1),compact);
    assert.ok(g.beltShape.geometry.a.x<g.width*.25,"conveyor starts on the left");
    const leads=g.paths.map(d=>{
      const match=d.match(/^M([\d.]+) ([\d.]+)L([\d.]+) (-?[\d.]+)H([\d.]+)/);
      assert.ok(match,"closed chain starts with conveyor and upper lead");
      const [,bottomX,bottomY,topX,topY,turnX]=match.map(Number);
      assert.ok(turnX>topX,"both upper leads run to the right");
      assert.equal(bottomY,g.low);
      assert.equal(topY,g.top);
      return {bottomX,topX,turnX};
    });
    assert.ok(Math.min(...leads.map(l=>l.turnX))-Math.max(...leads.map(l=>l.topX))>g.width*.18,"long shared upper corridor");
    assert.ok(g.gates.every(gate=>gate.x>g.width*.55),"both consumers are on the right");
  }
});

test("consumer paths only descend and gates fit every voltage step",()=>{
  for(const compact of [false,true])for(let voltage=2;voltage<=12;voltage++)for(const mode of ["simple","series","parallel"]){
    const g=geometry(deriveModel(mode,voltage,1),compact);
    for(const d of g.paths){
      const commands=[...d.matchAll(/([MLHQVZ])([^MLHQVZ]*)/g)];
      let y=NaN, afterConveyor=false;
      for(const [,command,raw] of commands){
        const values=(raw.match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
        if(command==="M")y=values[1];
        if(command==="L"){y=values[1];afterConveyor=true;}
        if(command==="Q"){
          assert.ok(afterConveyor && values[1]>=y-1e-9 && values[3]>=values[1]-1e-9,`${mode} ${voltage} V: corner rises`);
          y=values[3];
        }
        if(command==="V"){
          assert.ok(values[0]>=y-1e-9,`${mode} ${voltage} V: straight section rises`);
          y=values[0];
        }
      }
    }
    g.gates.forEach((gate,index)=>{
      const stageTop=mode==="series"&&index===1?(g.top+g.low)/2:g.top;
      const stageBottom=mode==="series"&&index===0?(g.top+g.low)/2:g.low;
      assert.ok(gate.y-gate.radius>=stageTop-1e-9,`${mode} ${voltage} V: gate crosses upper level`);
      assert.ok(gate.y+gate.radius<=stageBottom+1e-9,`${mode} ${voltage} V: gate crosses lower level`);
    });
  }
});

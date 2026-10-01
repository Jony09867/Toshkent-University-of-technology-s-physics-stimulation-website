import test from 'node:test';import assert from 'node:assert/strict';
import * as physics from '../src/physics/engine.js';
import {EnergyConservationBar} from '../src/components/EnergyConservationBar.js';
import {simulationChallenges,createParameterChallenge} from '../src/components/ChallengeMode.js';
import {allConfigs,defaults} from '../src/data/configs.js';
import {reportCSV} from '../src/components/LabReportModal.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('CSV hisobotida birlik masshtabi va qo‘shtirnoqlar saqlanadi',()=>{
 const config={results:[{key:'flux',unit:'mWb',scale:1000}]};
 const csv=reportCSV(config,{p:{custom:'x,"y"'},s:{flux:.012}},[{focusKey:'custom',focusValue:2,results:{flux:.02}}]);
 assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"12"/);assert.match(csv,/"20"/);assert.ok(csv.includes('x,""y""'));
});
test('Katta burchakda mayatnik energiyasi saqlanadi va davr uzayadi',()=>{
 for(const g of [1.6,9.8,20]) for(const angle of [5,20,45]){
  const p={mass:2,length:1.3,angle,g}, initial=physics.pendulum(p,0);
  assert.ok(initial.period>2*Math.PI*Math.sqrt(p.length/g));
  for(let i=0;i<=40;i++){const s=physics.pendulum(p,initial.period*i/40);close(s.energyKinetic+s.energyPotential,s.energyTotal);}
  close(physics.pendulum(p,initial.period).theta,angle);
 }
});
test('RLC kontur uch so‘nish rejimida boshlang‘ich shart va energiya balansini saqlaydi',()=>{
 const base={inductance:1,capacitance:50,voltage0:20};
 for(const resistance of [0,1,2*Math.sqrt(.001/50e-6),50]){
  const p={...base,resistance},initial=physics.circuitOsc(p,0);close(initial.current,0);close(initial.charge,1000);
  let previous=initial.totalEnergy;
  for(let i=0;i<=50;i++){const s=physics.circuitOsc(p,i*initial.period/1000/50);close(s.totalEnergy+s.energyHeat,initial.energyInitial);assert.ok(s.totalEnergy<=previous+1e-7);previous=s.totalEnergy;}
  const quarter=physics.circuitOsc(p,initial.period/4000);if(!resistance)close(quarter.energyCap,0);
 }
});
test('Energiya datchigi fazali prujina va boshqa gravitatsiyani hisobga oladi',()=>{
 const bar=new EnergyConservationBar(null),p={m:2,k:30,amplitude:.4,phase:1.2,damping:.3};
 const initial=bar.computeEnergy('spring',p,physics.spring(p,0),0);close(initial.Q,0);
 for(const t of [.1,.5,2])close(bar.computeEnergy('spring',p,physics.spring(p,t),t).total,initial.total);
 const q={mass:2,length:1,angle:45,g:1.6},s=physics.pendulum(q,.7);close(bar.computeEnergy('pendulum',q,s,.7).total,s.energyTotal);
});
test('Vazifa shartlari va richagning yechimi boshqaruv diapazonida tekshiriladi',()=>{
 const lever=allConfigs.find(c=>c.key==='lever'),challenge=simulationChallenges.lever[0];
 const p={...defaults(lever),...challenge.initialParams,l2:3};assert.ok(lever.params.find(p=>p.key==='l2').max>=3);assert.equal(challenge.check(p,physics.lever(p)).passed,true);
 assert.equal(challenge.check({...p,m1:2},physics.lever({...p,m1:2,l2:1.5})).passed,false);
 const spring=simulationChallenges.spring[0];assert.equal(spring.check({k:10,m:.25,damping:0},physics.spring({k:10,m:.25,damping:0,amplitude:.4})).passed,false);
 const config=allConfigs.find(c=>c.key==='motion'),auto=createParameterChallenge(config),base=defaults(config),wrong={...base,[config.params[0].key]:config.params[0].min};assert.equal(auto.check(wrong,config.calculate(wrong,0)).passed,false);
});
test('Radioaktiv faollik yarim davr va yadrolar soni bilan bog‘langan',()=>{
 const p={halfLife:5,initialN:500}, start=physics.radioactive(p,0), halfway=physics.radioactive(p,5);
 close(start.rate,Math.LN2*p.initialN/p.halfLife);
 close(halfway.rate,start.rate/2);
 assert.equal(halfway.remaining,250);
 const config=allConfigs.find(c=>c.key==='radioactive');
 assert.equal(config.results.find(r=>r.key==='rate').unit,'Bq');
 assert.ok(!config.params.some(param=>param.key==='activity'));
});
test('Sun’iy yo‘ldosh sekunddagi burchak tezlik bilan aylanadi',()=>{
 const p={altitude:1000,satelliteMass:800,planet:0},start=physics.gravitation(p,0),after=physics.gravitation(p,10);
 close(after.angle,start.omega*10);
 close(after.orbitalPeriod,2*Math.PI/start.omega/60);
});
test('Elektroliz qoplamasi massa, zichlik va katod yuziga mos',()=>{
 const p={current:5,voltage:12,metal:0,cathodeArea:100},s=physics.electrolysis(p,10);
 close(s.layer,s.mass/(8.96*100)*10000);
 close(physics.electrolysis({...p,cathodeArea:200},10).layer,s.layer/2);
 assert.ok(allConfigs.find(c=>c.key==='electrolysis').params.some(param=>param.key==='cathodeArea'));
});

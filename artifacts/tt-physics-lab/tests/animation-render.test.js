import test from 'node:test';
import assert from 'node:assert/strict';
import {allConfigs, defaults} from '../src/data/configs.js';
import {renderCatalog} from '../src/simulations/catalog-render.js';
import {models} from '../src/physics/catalog-engine.js';
const theme={ink:'#fff',muted:'#999',line:'#555',floor:'#111'};
function geometry(key,t,override={}) {
 const config=allConfigs.find(c=>c.key===key), p={...defaults(config),...override}, calls=[];
 const ctx=new Proxy({}, {get:(_,name)=> (...args)=>{if(['arc','moveTo','lineTo','fillRect'].includes(name))calls.push([name,...args]);},set:()=>true});
 renderCatalog(ctx,{config,p,s:config.calculate(p,t),t},theme);
 return calls;
}
test('Lift, kuchlar va oqim chizmasi vaqt bilan harakatlanadi',()=>{
 for(const key of ['elevator','vectors','bernoulli']) assert.notDeepEqual(geometry(key,0),geometry(key,2.371),key);
});
test('Tinch lift va nol tezlikdagi oqim sun’iy harakat qilmaydi',()=>{
 assert.deepEqual(geometry('elevator',0,{a:0}),geometry('elevator',2,{a:0}));
 assert.deepEqual(geometry('bernoulli',0,{velocity:0}),geometry('bernoulli',2,{velocity:0}));
});
test('Vaznsizlikda tayanch kuchi nol, ko‘chish va tezlik erkin tushishga mos',()=>{
 const s=models.elevator({m:5,a:-9.8},2);
 assert.equal(s.normal,0);assert.equal(s.y,-19.6);assert.equal(s.velocity,-19.6);
});

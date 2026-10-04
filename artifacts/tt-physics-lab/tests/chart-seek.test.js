import test from 'node:test';
import assert from 'node:assert/strict';
import { LiveChart } from '../src/components/LiveChart.js';
test('Mikrosoniyali grafikda orqaga siljish kelajakdagi nuqtalarni olib tashlaydi',()=>{
 const snapshot={snapshot:true,data:[{x:1.5e-6,y:2}]};
 const series={key:'x',data:[{x:0,y:0},{x:2e-7,y:1},{x:1e-6,y:2}]};
 const chart={data:{datasets:[series,snapshot]}};
 const graph=Object.create(LiveChart.prototype);
 Object.assign(graph,{static:false,destroyed:false,config:{duration:2e-6},charts:[chart],setCursor(){},updateChart(){}});
 graph.seek(2e-7,{x:1});
 assert.deepEqual(series.data,[{x:0,y:0},{x:2e-7,y:1}]);
 assert.deepEqual(snapshot.data,[{x:1.5e-6,y:2}]);
 assert.equal(graph.last,2e-7);
});

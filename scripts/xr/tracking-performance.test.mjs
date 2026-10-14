import test from 'node:test';
import assert from 'node:assert/strict';
import {statistics,summarizeWindow} from './tracking-performance-observers.mjs';

const fixture=()=>({q:{timeOrigin:10000,frames:[],video:[],raf:[],longTasks:[],tracking:[],inference:[],maxInFlight:1},p:{events:[],render:[],commits:[]}});
test('performance report retains p99/max and never substitutes the median for a spike',()=>{
  assert.deepEqual(statistics([1,2,3,800]),{n:4,p50:3,p95:800,p99:800,max:800});
});
test('empty windows and silence at the trailing edge cannot pass continuity',()=>{
  const t=fixture();let s=summarizeWindow(t,0,15000);
  assert.equal(s.pass,false);assert.equal(s.sampleGapMs.max,15000);
  t.q.frames=Array.from({length:250},(_,i)=>({time:i*50,sampleTime:i*50,hands:1,currentTime:i/20,dropped:0}));
  s=summarizeWindow(t,0,15000);assert.equal(s.pass,false);assert.equal(s.sampleGapMs.max,2550);
});
test('worker clocks align by timeOrigin without modifying product sample timestamps',()=>{
  const t=fixture();t.q.frames=[{time:0,sampleTime:0,hands:1},{time:400,sampleTime:50,hands:1}];
  t.q.video=[{kind:'send',time:50,sampleTime:50}];
  t.q.inference=[{sampleTime:50,timeOrigin:10040,received:12,start:15,end:355}];
  const s=summarizeWindow(t,0,400);
  assert.equal(s.workerQueueMs.max,2);assert.equal(s.resultDeliveryMs.max,5);assert.equal(s.inferenceMs.max,340);
  assert.equal(s.interruptions[0].category,'MEDIAPIPE_INFERENCE');assert.equal(t.q.inference[0].start,15);
});
test('unexplained gaps remain UNKNOWN rather than being attributed to the OS',()=>{
  const t=fixture();t.q.frames=[{time:0,hands:1},{time:400,hands:1}];
  const s=summarizeWindow(t,0,400);assert.equal(s.interruptions[0].category,'UNKNOWN');
});
test('valid frames without controller observations cannot certify acceptance',()=>{
  const t=fixture();t.q.frames=Array.from({length:300},(_,i)=>({time:i*50,sampleTime:i*50,hands:1}));
  assert.equal(summarizeWindow(t,0,15000).pass,false);
  t.q.tracking=[{time:100,state:'tracking'}];
  assert.equal(summarizeWindow(t,0,15000).pass,true);
});
test('overlapping long inference and main-thread blocks keep causal ambiguity',()=>{
  const t=fixture();t.q.frames=[{time:0,sampleTime:0,hands:1},{time:400,sampleTime:50,hands:1}];
  t.q.inference=[{sampleTime:50,timeOrigin:10000,received:50,start:50,end:390}];
  t.q.longTasks=[{time:50,duration:340}];
  const s=summarizeWindow(t,0,400);
  assert.equal(s.interruptions[0].category,'UNKNOWN');assert.equal(s.interruptions[0].ambiguousConcurrentBlocks,true);
});

import {test} from "node:test";
import assert from "node:assert/strict";
import {narrate,stopNarration} from "../src/narration.ts";
test("narrator preserves transcript volume and queues automatic readings without interrupting",()=>{
  const globals=globalThis as any;
  const keys=["window","speechSynthesis","SpeechSynthesisUtterance"];
  const saved=keys.map(key=>Object.getOwnPropertyDescriptor(globals,key));
  const spoken:any[]=[];let current:any;let cancels=0;const errors:string[]=[];
  const synth={getVoices:()=>[],speak:(u:any)=>{spoken.push(u);current=u;},cancel:()=>{cancels++;current?.onerror?.({error:"interrupted"});}};
  globals.window={speechSynthesis:synth};globals.speechSynthesis=synth;
  globals.SpeechSynthesisUtterance=class {constructor(public text:string){} };
  try{
    narrate("A quiet transcript.",false,message=>errors.push(message),.2);
    assert.equal(spoken[0].volume,.2);
    const count=cancels;
    narrate("An outdated objective.",true);
    narrate("The latest objective.",true);
    assert.equal(cancels,count);assert.equal(spoken.length,1);
    spoken[0].onend();
    assert.equal(spoken[1].text,"The latest objective.");assert.equal(spoken[1].volume,1);
    stopNarration();assert.deepEqual(errors,[]);
  }finally{stopNarration();keys.forEach((key,i)=>{if(saved[i])Object.defineProperty(globals,key,saved[i]!);else delete globals[key];});}
});

import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const server=spawn('npm',['run','dev','--','--host','127.0.0.1','--port','4326'],{stdio:'ignore'});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
fs.mkdirSync('verification/archive-evidence',{recursive:true});
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4326/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const width of [320,390,844,1320]){
  const page=await browser.newPage({viewport:{width,height:width===844?390:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message) && console.error(e.message));
  await page.goto('http://127.0.0.1:4326/verification/debrief-fixture.html');
  const archive=page.getByRole('button',{name:'Archive & Resume Mission'});await archive.waitFor();
  await page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('synthetic quota')};});
  await archive.click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/not saved/);
  assert(await archive.isVisible());await archive.scrollIntoViewIfNeeded();
  assert(await page.getByRole('alert').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`verification/archive-evidence/failure-${width}.png`});
  await page.evaluate(()=>Storage.prototype.setItem=window.originalSet);
  await archive.click();await page.locator('.session-debrief-overlay').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.telemetry_history).length),1);
  assert.equal(errors.length,0);console.log('PASS synthetic rendered debrief failure/retry',width);await page.close();
 }
}finally{await browser.close();server.kill();await new Promise(r=>server.once('exit',r));}

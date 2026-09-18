import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.argv[2] || 'http://127.0.0.1:8081';
const out = 'artifacts/qa';
mkdirSync(out, {recursive:true});
const browser = await chromium.launch({headless:true});
const report = [];
try {
 for (const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]) {
  const context = await browser.newContext({viewport:{width,height},permissions:['clipboard-read','clipboard-write'],timezoneId:'America/New_York'});
  await context.addInitScript(() => { Object.defineProperty(navigator, 'geolocation', {value:{getCurrentPosition(_ok,fail){fail({code:1});}}}); });
  const page = await context.newPage();
  const errors=[], forbidden=[], badAssets=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
  page.on('request',r=>{if(/grok\.(me|com)|grok-sandbox|\/__grok|extensions\.js|\/api\/auth/.test(r.url())) forbidden.push(r.url());});
  page.on('response',r=>{if(/\.(js|css)(\?|$)/.test(r.url()) && (r.status()>=400 || /text\/html/.test(r.headers()['content-type']||''))) badAssets.push(r.url());});
  assert.equal((await page.goto(base)).status(),200);
  const map=page.locator('svg[aria-label^="Gleason polar map"]');
  await map.waitFor();
  assert.ok(await page.locator('svg path[aria-label]').count()>150);
  await page.getByRole('button',{name:'About this map',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  assert.equal(await page.getByRole('dialog').count(),0);
  for(const tab of await page.getByRole('tab').all()) {await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');}
  await page.getByRole('tab',{name:'HDI',exact:true}).click();
  for(const view of ['From the pole','From the rim','Transverse','Overhead']) {
   await page.getByRole('radio',{name:view,exact:true}).click();
   assert.equal(await page.getByRole('radio',{name:view,exact:true}).getAttribute('aria-checked'),'true');
  }
  const search=page.getByRole('textbox',{name:'Search countries'});
  await search.fill('Canada');await search.press('Enter');
  await page.getByRole('heading',{name:'Canada',exact:true}).filter({visible:true}).waitFor();
  assert.match(page.url(),/c=/);
  if(name==='desktop') await page.getByRole('button',{name:'Clear selection',exact:true}).click(); else await page.keyboard.press('Escape');
  await search.fill('');await search.press('Escape');
  for(const control of ['Zoom in','Zoom out','Rotate west','Rotate east','Reset view']) await page.getByRole('button',{name:control,exact:true}).click();
  await page.getByRole('button',{name:'Show distance',exact:true}).click();
  const box=await map.boundingBox();
  await page.mouse.click(box.x+box.width*.45,box.y+box.height*.5);
  await page.mouse.click(box.x+box.width*.6,box.y+box.height*.6);
  await page.getByRole('button',{name:'Clear measurement',exact:true}).waitFor();
  await page.getByRole('button',{name:'Hide distance',exact:true}).click();
  await page.getByRole('button',{name:'Mark my place',exact:true}).first().click();
  await page.getByRole('button',{name:'Click the disc to place yourself',exact:true}).first().waitFor();
  await page.mouse.click(box.x+box.width*.5,box.y+box.height*.5);
  await page.getByRole('button',{name:'Clear my place',exact:true}).first().waitFor();
  assert.match(page.url(),/p=/);
  await page.getByRole('button',{name:'Clear my place',exact:true}).first().click();
  if(await page.getByRole('button',{name:'Adjust time, sun and moon',exact:true}).count())
    await page.getByRole('button',{name:'Adjust time, sun and moon',exact:true}).click();
  for(const rate of ['Pause','10×','20×']) {
   await page.getByRole('radio',{name:rate,exact:true}).click();
   assert.equal(await page.getByRole('radio',{name:rate,exact:true}).getAttribute('aria-checked'),'true');
  }
  await page.getByRole('radio',{name:'Pause',exact:true}).click();
  assert.ok(!new URLSearchParams(new URL(page.url()).hash.slice(1)).has('t'));
  await page.getByRole('radio',{name:'Readable',exact:true}).click();
  await page.getByRole('radio',{name:'True',exact:true}).waitFor();
  await page.getByRole('radio',{name:'Central',exact:true}).click();
  await page.getByRole('button',{name:'Copy link',exact:true}).click();
  await page.getByRole('button',{name:'Copied',exact:true}).waitFor();
  const shared=await page.evaluate(()=>navigator.clipboard.readText());
  assert.match(shared,/share=1/);assert.match(shared,/t=/);assert.match(shared,/s=1/);assert.match(shared,/z=central/);
  await page.getByRole('radio',{name:'Now',exact:true}).click();
  await page.getByRole('button',{name:'Hide time and sky controls',exact:true}).click();
  await page.screenshot({path:`${out}/${name}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await page.locator('meta[property="og:image"]').count(),1);
  assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'),'https://gleason-atlas.vercel.app/og.jpg');
  await page.goto(base+'/login');await page.waitForURL(url=>url.pathname==='/');await map.waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);assert.deepEqual(badAssets,[]);
  report.push({viewport:name,passed:true,errors,forbidden,badAssets,shared});
  await context.close();
 }
 writeFileSync(`${out}/report.json`,JSON.stringify({base,report},null,2));
 console.log(JSON.stringify({base,report},null,2));
} finally {await browser.close();}

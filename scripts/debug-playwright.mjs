import { chromium } from 'playwright';
const MID='545530293';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({userAgent:UA,locale:'zh-CN',timezoneId:'Asia/Shanghai',viewport:{width:1280,height:800}});
const page=await context.newPage();
page.on('response', async resp=>{
  const url=resp.url();
  if(url.includes('/x/polymer/web-dynamic/v1/feed/space')){
    console.log('RESP', resp.status(), url.slice(0,200));
    try{ const json=await resp.json(); console.log('CODE', json.code, 'items', json.data?.items?.length); }catch(e){ console.log('not json'); }
  }
});
await page.goto(`https://space.bilibili.com/${MID}/dynamic`, {waitUntil:'networkidle', timeout:60000});
await page.waitForTimeout(5000);
await browser.close();

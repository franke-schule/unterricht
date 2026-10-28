const assert = require('node:assert/strict');
const http = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const { extname, resolve, sep, join } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const root = process.cwd();
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wasm':'application/wasm','.csv':'text/csv; charset=utf-8' };
const server = http.createServer(async(req,res)=>{try{const file=resolve(root,`.${decodeURIComponent(new URL(req.url,'http://localhost').pathname)}`);if(file!==root&&!file.startsWith(`${root}${sep}`))throw Error('forbidden');const content=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(content);}catch{res.writeHead(404);res.end('Not found');}});
const tabOf = (n) => n<=3?'simple':n<=6?'compare':n<=9?'like':n<=12?'combine':'fast';
const references = [
  "SELECT * FROM users WHERE gender = 'female'", "SELECT * FROM users WHERE country = 'Deutschland'", "SELECT * FROM users WHERE name = 'Mia Sonntag'",
  'SELECT * FROM users WHERE centimeters < 180', "SELECT * FROM users WHERE birthday = '2007-09-17'", "SELECT name FROM users WHERE city != 'Leipzig'",
  "SELECT * FROM users WHERE name LIKE 'B%'", "SELECT * FROM users WHERE username LIKE '%fuchs%'", "SELECT name FROM users WHERE birthday LIKE '%-03-%'",
  "SELECT * FROM users WHERE name LIKE 'Lina %' AND city = 'Berlin'", "SELECT * FROM users WHERE gender = 'female' AND city = 'Leipzig'",
  "SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Felix %'", "SELECT * FROM users WHERE city = 'Schwerin'", "SELECT * FROM users WHERE role = 'user'",
  'SELECT * FROM users WHERE is_active = 1', "SELECT * FROM users WHERE city = 'München'", "SELECT * FROM users WHERE email LIKE '%@instahub.test'",
  "SELECT name FROM users WHERE name LIKE '%Schmidt'", "SELECT username, birthday FROM users WHERE gender = 'female' AND centimeters < 160",
  "SELECT * FROM users WHERE name LIKE 'Felix %' AND city != 'Berlin'", "SELECT * FROM users WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %') AND city = 'Berlin'"
];
(async()=>{
  await new Promise((resolveReady)=>server.listen(0,'127.0.0.1',resolveReady));
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();const errors=[];page.on('pageerror',(error)=>errors.push(error.stack));
    const screenshotDir=process.env.WHERE_SCREENSHOT_DIR;if(screenshotDir)await mkdir(screenshotDir,{recursive:true});
    let serverDelay=0;
    await page.route('https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/',async(route)=>{
      const request=route.request().postDataJSON();assert.equal(request.taskId,'inf9-db3-beschreibe-where');
      const points=request.answer.includes('München')?3:request.answer.includes('users')?2:0;
      if(serverDelay)await new Promise((done)=>setTimeout(done,serverDelay));
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({requestId:request.requestId,type:'GEMINI_EVALUATION_RESULT',result:{ok:true,points,maxPoints:3,status:points===3?'korrekt':points?'teilweise korrekt':'noch nicht korrekt',strengths:['Tabelle erkannt.'],missing:points<3?['Prüfe die Bedingung.']:[],feedback:'Gezielter Hinweis.'}})});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/faecher/informatik/klasse-9/2-Datenbanken/aufgabe3.html`);
    await page.waitForFunction(()=>document.querySelector('#data-status')?.textContent.includes('ist geladen'),null,{timeout:20000}).catch(async(error)=>{console.error('Status:',await page.locator('#data-status').textContent(),'Browserfehler:',errors);throw error;});
    assert.equal(await page.locator('[role=tab]').count(),7);
    assert.equal(await page.locator('.sql9-snippet-table tbody tr').count(),6);
    await page.locator('#intro-next').click();await page.locator('#intro-next').click();
    await page.locator('#intro-next').click();
    assert.equal(await page.locator('.sql9-snippet-table tr.is-leaving').count(),1,'unpassende Zeile fliegt sichtbar aus der Tabelle');
    const moving=page.locator('.sql9-snippet-table tr.is-leaving');
    const x1=await moving.evaluate((row)=>row.getBoundingClientRect().x);await page.waitForTimeout(250);
    const x2=await moving.evaluate((row)=>row.getBoundingClientRect().x);assert.ok(x2>x1+10,`Flugbewegung messbar: ${x1} -> ${x2}`);
    if(screenshotDir)await page.screenshot({path:join(screenshotDir,'where-intro-flug-desktop.png'),fullPage:true});
    await page.waitForTimeout(550);assert.equal(await page.locator('.sql9-snippet-table tbody tr').count(),5);
    await page.locator('#intro-prev').click();assert.equal(await page.locator('.sql9-snippet-table tbody tr').count(),6,'Rückwärts stellt Zeile wieder her');
    for(let i=0;i<9;i++) await page.locator('#intro-next').click();
    assert.equal(await page.locator('.sql9-result-card tbody tr').count(),2);
    await page.locator('#intro-prev').click();assert.equal(await page.locator('.sql9-result-card tbody tr').count(),2);
    await page.locator('#intro-next').click();
    await page.reload();await page.waitForFunction(()=>document.querySelector('#data-status')?.textContent.includes('ist geladen'));
    assert.match(await page.locator('#intro-frame-count').textContent(),/12 von 12/,'Animationsschritt nach Reload');
    for(let n=1;n<=21;n++){
      await page.locator(`#tab-${tabOf(n)}`).click();const card=page.locator(`#task-t${n}`);await card.locator('textarea').fill(references[n-1]);await card.locator('.sql9-run').click();
      await page.waitForFunction((id)=>document.querySelector(`#task-t${id} .sql-feedback`)?.textContent.startsWith('Korrekt:'),n,{timeout:15000}).catch(async(error)=>{console.error('Aufgabe',n,'Feedback:',await card.locator('.sql-feedback').textContent(),'Fehler:',errors);throw error;});
      assert.equal(await card.locator('.sql-feedback.success').count(),1,`Aufgabe ${n}`);
    }
    await page.locator('#tab-fast').click();await page.locator('#task-t17 textarea').fill('SELECT * FROM users');await page.locator('#task-t17 .sql9-run').click();
    await page.waitForFunction(()=>document.querySelector('#task-t17 .sql-feedback')?.textContent.includes('wirksame WHERE-Bedingung'));
    const check=async(tab,id,sql,fragment)=>{await page.locator(`#tab-${tab}`).click();const card=page.locator(`#task-t${id}`);await card.locator('textarea').fill(sql);await card.locator('.sql9-run').click();await page.waitForFunction(([task,text])=>document.querySelector(`#task-t${task} .sql-feedback`)?.textContent.includes(text),[id,fragment]);};
    await check('compare',6,"SELECT name FROM users WHERE city <> 'Leipzig'",'Korrekt:');
    await check('combine',11,"SELECT * FROM users WHERE city = 'Leipzig' AND gender = 'female'",'Korrekt:');
    await check('fast',19,"SELECT birthday AS geburtstag, username AS benutzer FROM users WHERE centimeters < 160 AND gender = 'female'",'Korrekt:');
    await check('fast',19,"SELECT username birthday FROM users WHERE gender = 'female' AND centimeters < 160",'fehlt ein Komma');
    await check('fast',21,"SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Hailey %' AND city = 'Berlin'",'Klammern');
    await check('fast',17,"SELECT * FROM users WHERE email LIKE '%@instahub.test' OR 1=1",'wirksame LIKE-Bedingung');
    await check('fast',17,"SELECT * FROM users WHERE email LIKE '%@instahub.test' AND 1=1",'Korrekt:');
    await check('fast',17,"SELECT * FROM users WHERE email LIKE '%@instahub.test' OR email LIKE '%@instahub.test'",'Korrekt:');
    await check('simple',1,"SELECT * FROM users WHERE gender = 'female' LIMIT 2",'entferne LIMIT');
    await check('simple',1,"SELECT DISTINCT * FROM users WHERE gender = 'female'",'Korrekt:');
    await check('simple',2,'SELECT * FROM users WHERE country = Deutschland','braucht einfache Anführungszeichen');
    await check('simple',2,"SELECT * FROM users WHERE land = 'Deutschland'",'hinter WHERE');
    await check('simple',2,"SELECT * FROM users WHERE country = 'Atlantis'",'Noch nicht korrekt:');
    await check('simple',1,"SELECT * FROM users WHERE gender = 'female' AND id < 900000",'WHERE-Bedingung schließt auch passende Mitglieder aus');
    await check('simple',1,"SELECT * FROM users AS u WHERE gender = 'female' AND 1=1",'Korrekt:');
    await check('fast',17,"SELECT * FROM main.users WHERE email LIKE '%@instahub.test'",'Korrekt:');
    await page.locator('#tab-simple').click();await page.locator('#task-d-where textarea').fill('Die Tabelle users zeigt Benutzernamen und Wohnorte aus München.');
    await page.locator('#task-d-where button.primary-button').click();await page.waitForFunction(()=>document.querySelector('#task-d-where .server-feedback')?.textContent.includes('3 von 3 Punkten'));
    assert.match(await page.locator('#task-d-where .server-feedback').textContent(),/Sehr gut, alles richtig/);
    if(screenshotDir)await page.screenshot({path:join(screenshotDir,'where-aufgaben-desktop.png'),fullPage:true});
    await page.locator('#task-d-where textarea').fill('Die Tabelle users zeigt Benutzernamen und Wohnorte.');
    assert.equal(await page.locator('#task-d-where .server-feedback').textContent(),'','Eingabeänderung löscht alte Punkte');
    await page.locator('#task-d-where button.primary-button').click();await page.waitForFunction(()=>document.querySelector('#task-d-where .server-feedback')?.textContent.includes('2 von 3 Punkten'));
    serverDelay=400;await page.locator('#task-d-where textarea').fill('Die Tabelle users zeigt Benutzernamen aus Berlin.');await page.locator('#task-d-where button.primary-button').click();
    await page.locator('#task-d-where textarea').evaluate((input)=>{input.value='Die Tabelle users zeigt Benutzernamen und Wohnorte aus München.';input.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForTimeout(500);
    assert.equal(await page.locator('#task-d-where .server-feedback').textContent(),'','alte Serverantwort nach Eingabeänderung verworfen');serverDelay=0;
    await page.reload();await page.waitForFunction(()=>document.querySelector('#data-status')?.textContent.includes('ist geladen'));
    assert.equal(await page.locator('#task-d-where textarea').inputValue(),'Die Tabelle users zeigt Benutzernamen und Wohnorte aus München.');
    await page.locator('#tab-quiz').click();assert.equal(await page.locator('#final-quiz fieldset').count(),5);assert.equal(await page.locator('.quiz-question-check button').count(),5);
    if(screenshotDir)await page.screenshot({path:join(screenshotDir,'where-quiz-desktop.png'),fullPage:true});
    for(const [index,values] of [['a','b'],['a','b'],['a','b'],['a','b'],['a']].entries()){
      const field=page.locator('#final-quiz fieldset').nth(index);for(const value of values)await field.locator(`input[value="${value}"]`).check();
      await field.locator('.quiz-question-check button').click();assert.match(await field.locator('.quiz-question-feedback').textContent(),/Korrekt:/);
    }
    assert.equal(await page.locator('#sql9-overview-title').count(),1,'fünfter Einzelcheck löst Gesamtauswertung aus');
    await page.reload();await page.waitForFunction(()=>document.querySelector('#data-status')?.textContent.includes('ist geladen'));
    assert.equal(await page.locator('#sql9-overview-title').count(),1,'Freischaltung bleibt nach Reload');
    await page.setViewportSize({width:768,height:1024});const tablet=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(tablet.document<=tablet.viewport+1,JSON.stringify(tablet));
    await page.setViewportSize({width:390,height:844});const widths=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));assert.ok(widths.document<=widths.viewport+1,JSON.stringify(widths));
    if(screenshotDir)await page.screenshot({path:join(screenshotDir,'where-quiz-smartphone.png'),fullPage:true});
    await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#tab-intro').click();await page.locator('#intro-next').click();await page.locator('#intro-next').click();await page.locator('#intro-next').click();await page.locator('#intro-next').click();
    assert.equal(await page.locator('.sql9-snippet-table tr.is-leaving').count(),0,'reduzierte Bewegung entfernt Zeile ohne Flug');
    await page.evaluate(()=>localStorage.setItem('informatik9-datenbanken-aufgabe3-v1','fremder Aufgabe-2-Stand'));
    page.once('dialog',(dialog)=>dialog.accept());await page.locator('#reset-module').click();
    await page.waitForFunction(()=>document.querySelector('#intro-frame-count')?.textContent.includes('1 von 12'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('informatik9-datenbanken-aufgabe3-v1')),'fremder Aufgabe-2-Stand');
    assert.equal(await page.evaluate(()=>localStorage.getItem('informatik9-datenbanken-aufgabe3-where-v1')),null);
    assert.deepEqual(errors,[]);console.log('WHERE-Browsercheck: 21 Referenzen, SQL-Grenzfälle, sichtbare Flugbewegung, Rückwärts/Reload/reduzierte Bewegung, Persistenz, Quizstruktur, Smartphone-Breite.');
  }finally{await browser.close();await new Promise((resolveClose)=>server.close(resolveClose));}
})().catch((error)=>{console.error(error);process.exitCode=1;});

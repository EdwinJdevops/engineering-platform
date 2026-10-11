/* Browser-level release gate: responsive layout, navigation, reduced motion, and WebGL fallback. */
const { chromium } = require("playwright");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync("visual-audit", { recursive: true });
  const routes = ["/", "/portfolio/", "/projects/driftguard/", "/services/", "/contact/"];
  const widths = [
    { name:"small-mobile", width:320, height:720 },
    { name:"mobile", width:390, height:844 },
    { name:"tablet", width:768, height:1024 },
    { name:"desktop", width:1440, height:900 }
  ];
  const failures = [], observations = [];
  const assetBudgets = [
    { path:"public/css/main.css", maximum:64000 },
    { path:"public/js/infrastructure-scene.js", maximum:8000 },
    { path:"public/js/infrastructure-webgl.js", maximum:16000 },
    { path:"public/images/edwin-portrait-web.webp", maximum:200000 }
  ];
  for (const asset of assetBudgets) {
    const bytes = fs.statSync(asset.path).size;
    observations.push({ asset:asset.path,bytes,budget:asset.maximum });
    if (bytes > asset.maximum)
      failures.push("Asset budget exceeded: "+asset.path+" "+bytes+" > "+asset.maximum);
  }
  // Hugo may minify HTML attribute quotes; verify DOM semantics instead.
  for (const size of widths) {
    const page = await browser.newPage({
      viewport:{ width:size.width,height:size.height },
      deviceScaleFactor:1,reducedMotion:"reduce"
    });
    page.on("pageerror",error => failures.push(size.name + " JS exception: " + error.message));
    for (const route of routes) {
      const response = await page.goto("http://127.0.0.1:4173" + route, { waitUntil:"networkidle" });
      const key = route === "/" ? "home" : route.split("/").filter(Boolean).join("-");
      if (!response || response.status() !== 200) failures.push(size.name+" "+route+" HTTP "+(response && response.status()));
      const overflow = await page.evaluate(() => ({
        viewport:document.documentElement.clientWidth,
        document:document.documentElement.scrollWidth
      }));
      if (overflow.document > overflow.viewport+2) failures.push(size.name+" "+route+" horizontal overflow "+JSON.stringify(overflow));
      const menu = page.locator(".mobile-nav");
      if (size.width <= 760) {
        if (!(await menu.locator("summary").isVisible())) failures.push(size.name+" "+route+" mobile menu toggle hidden");
        await menu.locator("summary").click();
        if (!(await menu.locator("nav a").first().isVisible())) failures.push(size.name+" "+route+" menu did not open");
        const mobileLink = menu.locator('nav a[href$="/projects/"]').first();
        if (!(await mobileLink.isVisible())) failures.push(size.name+" "+route+" projects navigation link not visible");
        if (!(await mobileLink.evaluate(el => el.getBoundingClientRect().height >= 44)))
          failures.push(size.name+" "+route+" projects navigation touch target under 44px");
        await page.screenshot({ path:"visual-audit/"+size.name+"-"+key+"-menu.png",fullPage:false });
        await menu.locator("summary").click();
        if (await menu.getAttribute("open") !== null) failures.push(size.name+" "+route+" menu did not close");
        if (route === "/") {
          await menu.locator("summary").focus();
          await page.keyboard.press("Enter");
          if (await menu.getAttribute("open") === null) failures.push(size.name+" keyboard did not open menu");
          await page.keyboard.press("Enter");
          if (await menu.getAttribute("open") !== null) failures.push(size.name+" keyboard did not close menu");
        }
      } else if (!(await page.locator(".desktop-nav").isVisible())) {
        failures.push(size.name+" "+route+" desktop navigation hidden");
      }
      if (route === "/") {
        const reducedAnimation = await page.locator(".home-work").evaluate(el => getComputedStyle(el).animationName);
        if (reducedAnimation !== "none")
          failures.push(size.name+" reduced motion still animates home work: "+reducedAnimation);
        const portrait = page.locator(".home-portrait img");
        if (await portrait.count()) {
          const photo = await portrait.evaluate(el => ({
            loaded:el.complete && el.naturalWidth > 0,
            visible:el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0
          }));
          if (!photo.loaded || !photo.visible) failures.push(size.name+" portrait failed to load or is hidden: "+JSON.stringify(photo));
          observations.push({size:size.name,portrait:photo});
        } else failures.push(size.name+" portrait element absent");
        const stack = page.locator(".infra-stack");
        if (!(await stack.isVisible())) failures.push(size.name+" homepage CSS 3D fallback missing");
        if (await stack.evaluate(el => getComputedStyle(el).transform) === "none")
          failures.push(size.name+" homepage fallback 3D transform missing");
        if (await page.locator(".infra-scene").evaluate(el => el.classList.contains("webgl-ready")))
          failures.push(size.name+" reduced-motion preference incorrectly enabled WebGL");
      }
      await page.screenshot({ path:"visual-audit/"+size.name+"-"+key+".png",fullPage:true });
      observations.push({ size:size.name,route,overflow });
    }
    await page.close();
  }

  const page = await browser.newPage({
    viewport:{ width:1440,height:900 },deviceScaleFactor:1,reducedMotion:"no-preference"
  });
  page.on("pageerror",error => failures.push("desktop motion JS exception: "+error.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const portraitHints = await page.locator(".home-portrait img").evaluate(el => ({
    priority:el.getAttribute("fetchpriority"),
    decoding:el.getAttribute("decoding")
  }));
  if (portraitHints.priority !== "high") failures.push("Portrait priority hint missing");
  if (portraitHints.decoding !== "async") failures.push("Portrait asynchronous decoding hint missing");
  const scene = page.locator("[data-infra-scene]");
  const before = await scene.evaluate(el => Number.parseFloat(el.style.getPropertyValue("--scene-progress")));
  await page.evaluate(() => window.scrollTo(0,500));
  await page.waitForTimeout(120);
  const after = await scene.evaluate(el => Number.parseFloat(el.style.getPropertyValue("--scene-progress")));
  if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before)
    failures.push("desktop scroll progress not updating: "+before+" -> "+after);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.waitForTimeout(150);
  const renderMode = await scene.getAttribute("data-render-mode") || "css-fallback";
  observations.push({ size:"desktop-motion",route:"/",renderMode,progressBefore:before,progressAfter:after });
  if (renderMode === "webgl" && !(await page.locator(".infra-webgl").isVisible()))
    failures.push("WebGL mode reports active but canvas is hidden");
  const work = page.locator(".home-work");
  await work.scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  if (!(await work.evaluate(el => el.classList.contains("is-visible"))))
    failures.push("scroll-triggered home work never entered visible state");
  const animation = await work.evaluate(el => getComputedStyle(el).animationName);
  if (!animation.includes("section-arrive"))
    failures.push("scroll-triggered entrance animation not applied: "+animation);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForFunction(() => document.querySelector(".home-work").getBoundingClientRect().bottom < 0);
  await page.waitForFunction(() => !document.querySelector(".home-work").classList.contains("is-visible"));
  await work.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  if (!(await work.evaluate(el => el.classList.contains("is-visible"))))
    failures.push("work section did not replay on upward scroll");
  const card = page.locator(".featured-project").first();
  if (!(await card.isVisible())) failures.push("featured project card missing");
  await card.locator("h3 a").focus();
  if (!(await card.evaluate(el => el.matches(":focus-within"))))
    failures.push("project card focus state not applied");
  const detail = page.locator(".expertise-list details").first();
  await detail.locator("summary").click();
  if (await detail.getAttribute("open") === null)
    failures.push("expertise disclosure did not open");
  await detail.locator("summary").click();
  if (await detail.getAttribute("open") !== null)
    failures.push("expertise disclosure did not close");
  await page.screenshot({path:"visual-audit/desktop-motion-home.png",fullPage:true});
  await page.close();


  // Editorial release gate: featured projects, original article covers and navigation.
  for (const viewport of [{width:320,height:720},{width:390,height:844},{width:1440,height:900}]) {
    const editorial = await browser.newPage({ viewport, reducedMotion:"reduce" });
    editorial.on("pageerror", error => failures.push("Editorial "+viewport.width+" JS exception: "+error.message));
    await editorial.goto("http://127.0.0.1:4173/projects/", { waitUntil:"domcontentloaded" });
    if (await editorial.locator(".work-visual-card").count() !== 8)
      failures.push("Projects index must expose eight evidence-backed visual cards: "+viewport.width);
    for (const slug of ["warden","infraguard","infraguard-agent","driftguard"]) {
      const link = editorial.locator('.work-visual-card a[href$="/projects/'+slug+'/"]').first();
      if (await link.count() !== 1) failures.push("Missing named project: "+slug);
    }
    const projectImages = editorial.locator(".work-image-link img");
    for (let i = 0; i < await projectImages.count(); i++) {
      const image = projectImages.nth(i);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate(img => img.decode());
    }
    const images = await projectImages.evaluateAll(nodes =>
      nodes.map(img => ({loaded:img.complete && img.naturalWidth > 0, src:img.getAttribute("src")})));
    if (images.length !== 8 || images.some(img => !img.loaded))
      failures.push("Featured project SVG failed to load: "+JSON.stringify(images.filter(img => !img.loaded)));
    const projectOverflow = await editorial.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (projectOverflow > 2) failures.push("Projects overflow at "+viewport.width+"px: "+projectOverflow);
    await editorial.goto("http://127.0.0.1:4173/articles/", { waitUntil:"domcontentloaded" });
    const featuredCount = await editorial.locator(".editorial-feature-article").count();
    const archiveCount = await editorial.locator(".editorial-archive-item").count();
    if (featuredCount !== 3 || archiveCount !== 17)
      failures.push("Unexpected article counts: featured="+featuredCount+", archive="+archiveCount);
    if (await editorial.locator(".editorial-cover").count() !== 20)
      failures.push("Missing editorial art on an article listing: "+viewport.width);
    const articleOverflow = await editorial.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (articleOverflow > 2) failures.push("Article index overflow at "+viewport.width+"px: "+articleOverflow);
    await editorial.screenshot({path:"visual-audit/editorial-"+viewport.width+".png",fullPage:true});
    await editorial.close();
  }

  // Regression: blocked original-host images must not leave empty dark covers.
  const blockedArtwork = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await blockedArtwork.route("https://cdn.hashnode.com/**", route => route.abort("failed"));
  await blockedArtwork.goto("http://127.0.0.1:4173/articles/", { waitUntil: "domcontentloaded" });
  const fallbackCover = blockedArtwork.locator(".editorial-feature-article .editorial-cover").first();
  const originalImage = fallbackCover.locator("img");
  if (await originalImage.count() !== 1)
    failures.push("Hashnode feature lacks an original-image element for resilience test");
  else {
    await originalImage.scrollIntoViewIfNeeded();
    await originalImage.evaluate(img => img.decode().catch(() => {}));
    const fallbackState = await fallbackCover.evaluate(el => ({
      title: el.querySelector(".editorial-cover-graphic strong")?.textContent?.trim() || "",
      visibleTitle: !!el.querySelector(".editorial-cover-graphic strong") &&
        getComputedStyle(el.querySelector(".editorial-cover-graphic strong")).display !== "none",
      visibleArtwork: getComputedStyle(el.querySelector("img")).opacity,
      naturalWidth: el.querySelector("img").naturalWidth
    }));
    if (!fallbackState.visibleTitle || !fallbackState.title || fallbackState.visibleArtwork !== "0" || fallbackState.naturalWidth !== 0)
      failures.push("Blocked external image did not show source-labelled cover: "+JSON.stringify(fallbackState));
    await originalImage.evaluate(async img => {
      img.src = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='48'%20height='32'%3E%3Crect%20width='48'%20height='32'%20fill='%230d2740'/%3E%3C/svg%3E";
      await img.decode();
    });
    await blockedArtwork.waitForFunction(() => {
      const img = document.querySelector(".editorial-feature-article .editorial-cover img");
      return img?.classList.contains("is-ready") &&
        img.closest(".editorial-cover")?.classList.contains("has-loaded-image");
    });
    await blockedArtwork.waitForFunction(() => {
      const cover = document.querySelector(".editorial-feature-article .editorial-cover");
      if (!cover) return false;
      const image = cover.querySelector("img");
      const graphic = cover.querySelector(".editorial-cover-graphic");
      return image?.naturalWidth > 0 &&
        Number(getComputedStyle(image).opacity) === 1 &&
        getComputedStyle(graphic).visibility === "hidden";
    }, undefined, { timeout: 5000 }).catch(() => {});
    const loadedState = await fallbackCover.evaluate(cover => ({
      opacity: getComputedStyle(cover.querySelector("img")).opacity,
      imageWidth: cover.querySelector("img").naturalWidth,
      fallbackVisibility: getComputedStyle(cover.querySelector(".editorial-cover-graphic")).visibility,
      imgClass: cover.querySelector("img").className,
      coverClass: cover.className,
      cssLink: document.querySelector('link[href$="css/main.css"]')?.href || null,
      cssRulesMatching: [...document.styleSheets].flatMap(sheet => {
        try { return [...sheet.cssRules].filter(rule => /editorial-cover img\.is-ready|editorial-cover\.has-loaded-image/.test(rule.cssText)).map(rule => rule.cssText.slice(0,180)); }
        catch (_) { return []; }
      })
    }));
    if (Number(loadedState.opacity) !== 1 || loadedState.imageWidth <= 0 || loadedState.fallbackVisibility !== "hidden")
      failures.push("Loaded editorial image state incorrect: "+JSON.stringify(loadedState));
  }
  await blockedArtwork.screenshot({path:"visual-audit/editorial-blocked-cover-fallback.png",fullPage:false});
  await blockedArtwork.close();

  // Recruiter journey regression: multidisciplinary scope, CV-based roles, privacy and contact.
  for (const viewport of [{width:320,height:720},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]) {
    const identity = await browser.newPage({ viewport, reducedMotion:"reduce" });
    identity.on("pageerror", error => failures.push("Identity pages "+viewport.width+" JS exception: "+error.message));
    await identity.goto("http://127.0.0.1:4173/", {waitUntil:"domcontentloaded"});
    if (await identity.locator(".home-expertise .expertise-list details").count() !== 7)
      failures.push("Homepage must link seven actual engineering disciplines: "+viewport.width);
    if (await identity.locator(".experience-entry").count() !== 4)
      failures.push("Homepage experience entries missing: "+viewport.width);
    const introLink = identity.locator('.home-intro a[href$="/portfolio/"]').first();
    if (await introLink.count() !== 1) failures.push("About route missing from hero");
    const homepageEmail = identity.locator('.footer-email[href^="mailto:edwinjonathanchibuike123@gmail.com"]').first();
    if (await homepageEmail.count() !== 1) failures.push("Verified contact link missing from footer");
    const homeOverflow = await identity.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (homeOverflow > 2) failures.push("Identity homepage overflow at "+viewport.width+"px: "+homeOverflow);
    await identity.goto("http://127.0.0.1:4173/portfolio/", {waitUntil:"domcontentloaded"});
    if (await identity.locator(".tech-stack-grid > div").count() !== 6)
      failures.push("Expected six technical stack groups: "+viewport.width);
    if (await identity.locator(".career-timeline > li").count() !== 4)
      failures.push("Expected four CV-reported professional roles: "+viewport.width);
    const aboutText = await identity.locator(".profile-confidential").innerText();
    if (!aboutText.includes("permission") || !aboutText.includes("confidential"))
      failures.push("Confidential engagement publication boundary is missing");
    const profileOverflow = await identity.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (profileOverflow > 2) failures.push("About page overflow at "+viewport.width+"px: "+profileOverflow);
    await identity.screenshot({path:"visual-audit/identity-about-"+viewport.width+".png",fullPage:true});
    await identity.close();
  }

  // Public trust without private client material: exact code-backed evidence and disclosures.
  for (const viewport of [{width:320,height:720},{width:390,height:844},{width:1440,height:900}]) {
    const publicEvidence = await browser.newPage({ viewport, reducedMotion:"reduce" });
    publicEvidence.on("pageerror", error => failures.push("Public evidence "+viewport.width+" JS exception: "+error.message));
    await publicEvidence.goto("http://127.0.0.1:4173/", {waitUntil:"domcontentloaded"});
    if (await publicEvidence.locator(".public-record-grid article").count() !== 3)
      failures.push("Expected three source-backed homepage evidence receipts: "+viewport.width);
    if (await publicEvidence.locator('.home-public-record a[href$="/engineering/delivery-record/"]').count() < 1)
      failures.push("Missing public delivery record link: "+viewport.width);
    const firstPartyEvidence = await publicEvidence.locator(".home-public-record").innerText();
    if (!firstPartyEvidence.includes("not anonymous customer testimonials") ||
        !firstPartyEvidence.includes("Failure") && !firstPartyEvidence.includes("failed AWS"))
      failures.push("Home source/disclosure distinction absent: "+viewport.width);
    const homeOverflow = await publicEvidence.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (homeOverflow > 2) failures.push("Evidence homepage overflow at "+viewport.width+"px: "+homeOverflow);

    await publicEvidence.goto("http://127.0.0.1:4173/services/", {waitUntil:"domcontentloaded"});
    if (await publicEvidence.locator(".assurance-ledger article").count() !== 3)
      failures.push("Service delivery boundaries missing: "+viewport.width);
    const serviceIntro = await publicEvidence.locator(".service-assurance-intro").innerText();
    if (!serviceIntro.includes("not a customer's system"))
      failures.push("Services misrepresented a client work sample: "+viewport.width);
    const serviceOverflow = await publicEvidence.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (serviceOverflow > 2) failures.push("Services evidence overflow at "+viewport.width+"px: "+serviceOverflow);

    await publicEvidence.goto("http://127.0.0.1:4173/engineering/delivery-record/", {waitUntil:"domcontentloaded"});
    const recordText = await publicEvidence.locator("main").innerText();
    for (const required of ["not a customer project", "PR #64", "PR #65", "does not prove"]) {
      if (!recordText.toLowerCase().includes(required.toLowerCase()))
        failures.push("Delivery evidence provenance / limits missing: "+required);
    }
    const recordOverflow = await publicEvidence.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (recordOverflow > 2) failures.push("Delivery record overflow at "+viewport.width+"px: "+recordOverflow);
    await publicEvidence.screenshot({path:"visual-audit/public-delivery-record-"+viewport.width+".png",fullPage:true});
    await publicEvidence.close();
  }

  const noScript = await browser.newPage({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await noScript.goto("http://127.0.0.1:4173/", { waitUntil: "load" });
  const staticVisibility = await noScript.locator(".home-work").evaluate(el => ({
    opacity: getComputedStyle(el).opacity,
    height: el.getBoundingClientRect().height,
    hasMotionClass: document.documentElement.classList.contains("scroll-reveal-active")
  }));
  if (staticVisibility.opacity !== "1" || staticVisibility.height <= 0 || staticVisibility.hasMotionClass)
    failures.push("No-JavaScript fallback conceals content: "+JSON.stringify(staticVisibility));
  await noScript.close();
  await browser.close();
  fs.writeFileSync("visual-audit/results.json",JSON.stringify({ failures,observations,routes,widths },null,2));
  if (failures.length) { console.error(failures.join("\n"));process.exit(1); }
  console.log("Visual audit passed: 20 routes/viewports, keyboard navigation, asset budgets, reduced-motion fallback, and scroll state.");
})().catch(error => { console.error(error);process.exit(1); });

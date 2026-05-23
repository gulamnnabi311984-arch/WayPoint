// --- High-Performance Comprehensive Background Image Cache Preloader Object Implementation ---
        // backgroundCache: maps a URL to its preloaded Image element so the browser
        // already holds the decoded bitmap in memory before any DOM node ever needs it.
        // This makes background swaps, gallery renders, and hero image transitions
        // appear instantaneous — there is no network round-trip when the user navigates.
        const backgroundCache = {};

        // imageReadyPromises: maps a URL to a Promise that resolves the moment that
        // image is fully decoded by the browser. Downstream rendering code can await
        // a specific URL's readiness before swapping it into the DOM, eliminating the
        // brief blank flash that happens when a background-image is applied before
        // the underlying bitmap is in the decoded image cache.
        const imageReadyPromises = {};

        // preloadImage: the single canonical helper for preloading any image URL on
        // the WayPoint site. It de-duplicates (the same URL is never fetched twice),
        // sets decoding="async" so the main thread is never blocked while the browser
        // decompresses the JPEG/PNG/WebP, uses loading="eager" so no lazy-load
        // heuristic ever delays the fetch, and stamps a fetchPriority hint when the
        // caller flags an image as "high" priority so the browser network scheduler
        // pulls it ahead of background JS or fonts.
        function preloadImage(url, priority) {
            if (!url || typeof url !== 'string') return null;
            if (backgroundCache[url]) return backgroundCache[url];
            const img = new Image();
            // decoding="async" lets the browser decode off the main thread
            img.decoding = 'async';
            // loading="eager" overrides any future lazy-load heuristic — we want
            // every WayPoint image to start downloading immediately, never on scroll
            img.loading = 'eager';
            // fetchPriority is a modern Chrome/Edge hint; harmless on browsers that
            // do not support it. "high" is reserved for above-the-fold hero/card art.
            if (priority === 'high' && 'fetchPriority' in img) {
                img.fetchPriority = 'high';
            }
            // Wrap onload/onerror in a promise so render code can await readiness
            imageReadyPromises[url] = new Promise(resolve => {
                img.onload = () => resolve(img);
                // Resolve on error too — we never want a broken image to block a navigation
                img.onerror = () => resolve(null);
            });
            img.src = url;
            backgroundCache[url] = img;
            return img;
        }

        // injectPreloadLinks: adds <link rel="preload" as="image"> tags into <head>
        // for the highest-priority images. This is the single fastest way to tell the
        // browser "start fetching this image right now, in parallel with the HTML
        // parse, ahead of anything else" — the fetch happens before any script
        // even runs the new Image() constructor below.
        function injectPreloadLinks(urls) {
            if (!document || !document.head) return;
            const seen = {};
            urls.forEach(url => {
                if (!url || seen[url]) return;
                seen[url] = true;
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = url;
                // fetchpriority="high" tells the network layer this resource is critical
                link.setAttribute('fetchpriority', 'high');
                document.head.appendChild(link);
            });
        }

        const preloadUrls = [
            "https://wallpaperaccess.com/full/19604.jpg",
            "",
            "https://news.harvard.edu/wp-content/uploads/2020/10/Fall_01.jpg",
            "https://images.trvl-media.com/place/502584/0eaccecc-94bf-4457-abb1-db6494aadc19.jpg",
            "https://images.pexels.com/photos/3346227/pexels-photo-3346227.jpeg",
            "https://static.independent.co.uk/2025/08/15/11/47/iStock-483677767.jpeg",
            "https://images.pexels.com/photos/35491608/pexels-photo-35491608.jpeg",
            "",
            "https://res.klook.com/image/upload/fl_lossy.progressive,q_60/Mobile/City/egryl5rowwktik0we245.jpg",
            "https://www.princeton.edu//sites/default/files/images/2017/06/20060425_NassauHall_JJ_IMG_5973.jpg",
            "https://alum.mit.edu/sites/default/files/images/Slice_24_04_16_USNews.jpg",
            "https://www.crimsoneducation.org/_next/image?url=https%3A%2F%2Fa.storyblok.com%2Ff%2F64062%2F3125x2188%2Ffab20e0e6a%2Funiversidade-stanford.png&w=3840&q=75",
            "https://smapse.com/storage/2025/04/smapse-california-institute-of-technology-02.jpg",
            "https://www.ivywise.com/wp-content/uploads/2025/05/NYU-admissions-rate-2048x1536.jpeg",
            "https://media.cntraveler.com/photos/5c1137222a1ed14acdea31a2/16:9/w_2560%2Cc_limit/GettyImages-594949892.jpg",
            "https://www.columbiaspectator.com/resizer/v2/S34QOI2QHBGEXBKPJM7V2BSFDA.jpg?auth=41861b39a169e4c5fa9d4e54e10e0d89ee1358e6970a97d7ce7243ed00310802",
            "https://visitorcenter.yale.edu/sites/default/files/2023-08/harkness.jpeg",
            "https://images.pexels.com/photos/14495769/pexels-photo-14495769.jpeg",
            "https://img.magnific.com/premium-photo/statue-liberty-island-usa-upper-new-york-bay-manhattan-city-area-america-american-architecture-building-metropolis-nyc-cityscape-hudson-east-river-ny-symbol-freedom_250132-2407.jpg?semt=ais_hybrid&w=740&q=80",
            "https://www.goldentours.com/travelblog/wp-content/uploads/2015/07/shutterstock_555823393-scaled.jpg",
            "https://www.aluxurytravelblog.com/wp-content/uploads/2021/06/lake-como-1.jpg",
            "https://cambridgeusa.org/wp-content/uploads/2025/06/53692293039_82e4b561e9_o-1536x1140.jpg",
            "",
            "",
            "https://bomag.o0bc.com/wp-content/uploads/sites/2/2022/06/Harvard_KyleKlein_DJI_0135_HDR-960x639.jpg",
            "https://i.pinimg.com/1200x/d2/c6/ac/d2c6ac2661f3cbe8c9f19bcdcd5ba625.jpg",
            "",
            "",
            "https://i.pinimg.com/1200x/e2/96/67/e2966758ab6f5f7f2d14f6c202b2f036.jpg",
            "https://i.pinimg.com/1200x/97/64/fa/9764fa5c26d9223ef0c0e3be132e87db.jpg",
            "https://images.trvl-media.com/place/9842/6244d98b-f1fd-402e-b030-d5b2775a4b55.jpg",
            "https://images.trvl-media.com/place/9842/a31f1387-1ed4-46e3-8cd9-4a49d07d6ca0.jpg",
            "https://images.trvl-media.com/place/502584/b1167e42-b297-469b-b033-81477e8f6759.jpg",
            "https://images.trvl-media.com/place/6262724/e689b458-1c11-4929-a10b-5fd0e7554683.jpg",
            "https://images.unsplash.com/photo-1681782421891-5088f13466ec?fm=jpg&q=60&w=3000&auto=format&fit=crop",
            "https://images.openai.com/static-rsc-4/jDXHG4_-lSK7FWerOjPTcBillMjkZtDNfKuTQ7aB5tQ9T-wxDJDoDYC6dYLml7Xz-0gVusQ85VNSIDFddwSfMW1WabtoH8GqRfSy3rW_x6SCe-1gI81RGCuRvmKASQvYbpt0q5aHLNYYvFihL3S1bK2gwxGpn3x9VCams_JcpeIALZzePgfX9XODOYXNLC-Z?purpose=fullsize",
            "https://images.pexels.com/photos/1162251/pexels-photo-1162251.jpeg",
            "https://static.independent.co.uk/2024/09/26/15/iStock-1463288473-1.jpg",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e",
            "https://www.agoda.com/wp-content/uploads/2024/02/Manhattan-USA.jpg",
            "",
            "https://images.travelandleisureasia.com/wp-content/uploads/sites/7/2024/03/01175549/dumbo.jpeg?tr=w-1920",
            "https://cdn.britannica.com/22/195522-050-6C15247F/Statue-of-Liberty-Upper-New-York-Bay.jpg",
            "https://plus.unsplash.com/premium_photo-1714051660720-888e8454a021?fm=jpg&q=60&w=3000&auto=format&fit=crop",
            "https://onha.yale.edu/sites/default/files/2024-10/2010_05_10_18-26-20_4.jpg",
            "https://visitorcenter.yale.edu/sites/default/files/2023-09/new%20haven-aerial-water.jpeg",
            "https://www.visittheusa.com/wp-content/uploads/2026/02/Hero4_NewHaven_YaleOldCampus1_Melford_Web72DPI169.jpg",
            "https://i0.wp.com/www.betweentworocks.com/wp-content/uploads/2015/09/New-Haven-scaled.jpg?fit=2560%2C1264&ssl=1",
            "https://images.trvl-media.com/place/208/4c52b1cd-3c7f-413f-841a-143bd2ccdcc4.jpg",
            "https://images.pexels.com/photos/5225604/pexels-photo-5225604.jpeg",
            "https://images.pexels.com/photos/6581328/pexels-photo-6581328.jpeg",
            "https://images.pexels.com/photos/4642454/pexels-photo-4642454.jpeg",
            "https://images.pexels.com/photos/6379407/pexels-photo-6379407.jpeg",
            "https://images.pexels.com/photos/14299741/pexels-photo-14299741.jpeg",
            "https://images.pexels.com/photos/6379222/pexels-photo-6379222.jpeg",
            "https://www.visitphilly.com/wp-content/uploads/2020/03/philadelphia-skyline-museum-of-art-by-elevated-angles-for-vp-2200x1237px.jpg",
            "https://images.pexels.com/photos/8335926/pexels-photo-8335926.jpeg",
            "https://images.pexels.com/photos/5142323/pexels-photo-5142323.jpeg",
            "https://images.pexels.com/photos/14426200/pexels-photo-14426200.jpeg",
            "https://images.pexels.com/photos/6007455/pexels-photo-6007455.jpeg",
            "https://images.pexels.com/photos/36847818/pexels-photo-36847818.jpeg",
            "https://images.pexels.com/photos/28715522/pexels-photo-28715522.jpeg",
            "https://images.pexels.com/photos/26647055/pexels-photo-26647055.jpeg",
            "https://images.pexels.com/photos/6834759/pexels-photo-6834759.jpeg",
            "https://images.pexels.com/photos/29393582/pexels-photo-29393582.jpeg",
            "https://images.pexels.com/photos/3277174/pexels-photo-3277174.jpeg",
            "https://images.pexels.com/photos/19262147/pexels-photo-19262147.jpeg",
            "https://images.pexels.com/photos/33608324/pexels-photo-33608324.jpeg",
            "https://images.pexels.com/photos/4658510/pexels-photo-4658510.jpeg",
            "https://images.pexels.com/photos/285959/pexels-photo-285959.jpeg",
            "https://images.pexels.com/photos/35291215/pexels-photo-35291215.jpeg",
            "https://images.pexels.com/photos/14657727/pexels-photo-14657727.jpeg",
            "",
            "",
            "",
            "",
            "",
            "",
            "https://images.pexels.com/photos/5450747/pexels-photo-5450747.jpeg",
            "https://images.pexels.com/photos/29102405/pexels-photo-29102405.jpeg",
            "https://images.pexels.com/photos/34467552/pexels-photo-34467552.jpeg",
            "https://images.pexels.com/photos/27585619/pexels-photo-27585619.jpeg",
            "https://images.pexels.com/photos/6379121/pexels-photo-6379121.jpeg",
            "https://images.pexels.com/photos/1675198/pexels-photo-1675198.jpeg",
            "https://images.pexels.com/photos/33883307/pexels-photo-33883307.jpeg",
            "https://images.pexels.com/photos/12304691/pexels-photo-12304691.jpeg",
            "https://images.pexels.com/photos/6379231/pexels-photo-6379231.jpeg",
            "https://images.pexels.com/photos/35275656/pexels-photo-35275656.jpeg",
            "https://images.pexels.com/photos/11531611/pexels-photo-11531611.jpeg",
            "https://images.pexels.com/photos/28381457/pexels-photo-28381457.jpeg",
            "https://images.pexels.com/photos/3583571/pexels-photo-3583571.jpeg",
            "https://images.pexels.com/photos/8905037/pexels-photo-8905037.jpeg",
            "https://images.pexels.com/photos/19005285/pexels-photo-19005285.jpeg",
            "https://images.pexels.com/photos/3440444/pexels-photo-3440444.jpeg",
            "https://images.pexels.com/photos/32401950/pexels-photo-32401950.jpeg",
            "https://images.pexels.com/photos/20195758/pexels-photo-20195758.jpeg",
            "https://hips.hearstapps.com/hmg-prod/images/malibu-california-veranda-best-places-to-visit-in-california-68d3333a45de0.jpg?crop=1.00xw:0.891xh;0,0.0726xh",
            "https://www.trafalgar.com/media/d2ppjwel/website-banner-view-of-golden-gate-bridge-from-beach-san-francisco-california-united-states-1142884882.jpg",
            "https://hips.hearstapps.com/hmg-prod/images/dana-point-california-veranda-best-places-to-visit-in-california-68d334d61fd66.jpg?crop=0.9992927864214993xw:1xh;center,top",
            "https://periodicadventures.com/wp-content/uploads/2019/05/Santa-Monica-1-of-1.jpg",
            "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920",
            "https://auto.img.v4.skyrock.net/6031/81186031/pics/3052445831_1_3_7wZp6W6G.jpg",
            "https://images.trvl-media.com/place/6064081/ed547d2b-1357-42b3-840a-f88661f7db9c.jpg",
            "https://images.pexels.com/photos/28863057/pexels-photo-28863057.jpeg",
            "https://images.pexels.com/photos/2124701/pexels-photo-2124701.jpeg",
            "https://images.pexels.com/photos/25811902/pexels-photo-25811902.jpeg",
            "https://images.pexels.com/photos/7806715/pexels-photo-7806715.jpeg",
            "https://images.pexels.com/photos/919220/pexels-photo-919220.jpeg",
            "https://images.pexels.com/photos/1782440/pexels-photo-1782440.jpeg",

            // --- UK university card backgrounds (rendered as CSS background-image
            // on each .uni-card[data-name="..."] tile on the UK universities page).
            // These are top-priority above-the-fold imagery on the UK list view
            // and are ALSO duplicated as <link rel="preload"> tags in index.html
            // for the fastest possible first-paint when the user opens the UK
            // country page. The Oxford hero is the body background-image on the
            // Oxford university detail page — its preload is critical so the
            // detail page never paints with a blank backdrop. ---
            "https://images.pexels.com/photos/30660071/pexels-photo-30660071.jpeg",  // Oxford detail-page hero background
            "https://images.pexels.com/photos/19751105/pexels-photo-19751105.jpeg",  // UCL card background
            "https://images.pexels.com/photos/28288873/pexels-photo-28288873.jpeg",  // Imperial College card background
            "https://images.pexels.com/photos/18111345/pexels-photo-18111345.jpeg",  // LSE card background
            "https://images.pexels.com/photos/16009515/pexels-photo-16009515.jpeg",  // Oxford card background
            "https://images.pexels.com/photos/31771446/pexels-photo-31771446.jpeg",  // Cambridge card background

            // --- Country-page body backgrounds (rendered as background-image on
            // the body.uk-bg-active::before and body.usa-bg-active::before pseudo
            // elements in styles.css). These are full-bleed wallpapers behind the
            // country university grid. They are also listed as <link rel="preload">
            // tags in index.html — duplicating them here ensures the new Image()
            // warmer also keeps the decoded bitmap pinned in memory, so toggling
            // between a uni detail page (which switches the body background to
            // the uni hero) and the country list page (which switches it back to
            // the country wallpaper) feels instantaneous in both directions. ---
            "https://images.pexels.com/photos/4651134/pexels-photo-4651134.jpeg",  // UK country-page body background
            "https://cdn.britannica.com/22/195522-050-6C15247F/Statue-of-Liberty-Upper-New-York-Bay.jpg",  // USA country-page body background

            // --- City "Visual Story" gallery images (story-gallery-grid). These
            // are baked as inline <img src="..."> strings into the additionalGridHTML
            // template inside the editorial city page renderer. Unlike the city
            // gallery arrays (which are auto-warmed by preloadFromAppData), these
            // inline URLs are NOT walked by any data structure — so we list them
            // here explicitly to ensure the bitmaps are already decoded in memory
            // by the time the user opens an NYC or LA city page. Without this,
            // these particular story-card photos used to fetch on first paint
            // and caused a brief blank flash inside the visual-story grid. ---
            "https://images.pexels.com/photos/13356889/pexels-photo-13356889.jpeg",  // NYC story-card: Billionaires Row
            "https://images.pexels.com/photos/20263255/pexels-photo-20263255.jpeg",  // NYC story-card: New York Panorama
            "https://images.pexels.com/photos/33619999/pexels-photo-33619999.jpeg",  // NYC story-card: Chrysler Building
            "https://images.pexels.com/photos/941459/pexels-photo-941459.jpeg",      // NYC story-card: Lower Manhattan Skyline
            "https://images.pexels.com/photos/32046537/pexels-photo-32046537.jpeg",  // NYC story-card: Hudson Yards
            "https://images.trvl-media.com/place/8365/cfe60f08-750d-4a54-b43a-7e13ae8f6546.jpg",  // LA/Pasadena story-card: Downtown LA
            "https://res.klook.com/image/upload/fl_lossy.progressive,q_60/v1755071475/destination/zkmjal6ohhft1cdmvnni.jpg",  // LA/Pasadena story-card: Griffith Observatory
            "https://images.ctfassets.net/i3kf1olze1gn/5aS59BlpthJHLi5kJb45b0/31e626d226404c7f97522ec3be43122f/venti-views-2td44mctvmI-unsplash.jpg"  // LA/Pasadena story-card: Venice Beach
        ];

        // Filter out empty placeholder strings so we never waste a network request
        // or DOM <link> tag on a blank URL. Empty entries exist as positional
        // placeholders in the preloadUrls array for universities/cities that do not
        // yet have a hero image — we silently skip them here.
        const validPreloadUrls = preloadUrls.filter(url => url && typeof url === 'string' && url.length > 0);

        // STEP 1 — Inject <link rel="preload" as="image"> tags into <head> for the
        // top-priority images. The browser will start fetching these in parallel
        // with the rest of the HTML parse, before any further JavaScript runs.
        // We limit this to the first 30 images (homepage backdrop, USA card big
        // picture, UK card big picture, all 10 USA university hero cards, and the
        // first few city heroes) — using <link rel="preload"> on every single image
        // would over-saturate the network pipeline on a fresh page load.
        const topPriorityCount = Math.min(30, validPreloadUrls.length);
        injectPreloadLinks(validPreloadUrls.slice(0, topPriorityCount));

        // STEP 2 — Kick off the new Image() preload for every valid URL. The first
        // 30 get fetchPriority="high" so the network scheduler treats them as
        // critical resources. The remainder load in the background with default
        // priority — by the time the user clicks through to a city page or a
        // university detail page, the bitmap is already decoded in memory and the
        // background swap happens with zero lag.
        validPreloadUrls.forEach((url, index) => {
            preloadImage(url, index < topPriorityCount ? 'high' : 'auto');
        });

        // preloadFromAppData: once the appData database object is defined further
        // down in this file, this function walks every city's gallery array and
        // every university's heroImage so each one of those URLs is also warmed
        // into the cache. It is invoked from the bottom of the appData definition
        // block so it runs the moment the data structure is ready.
        function preloadFromAppData() {
            if (typeof appData === 'undefined' || !appData) return;
            const extraUrls = [];
            // Walk every university's heroImage
            if (appData.universities) {
                Object.values(appData.universities).forEach(uni => {
                    if (uni && uni.heroImage) extraUrls.push(uni.heroImage);
                });
            }
            // Walk every city's full gallery array
            if (appData.cities) {
                Object.values(appData.cities).forEach(city => {
                    if (city && Array.isArray(city.gallery)) {
                        city.gallery.forEach(item => {
                            if (item && item.url) extraUrls.push(item.url);
                        });
                    }
                });
            }
            // Preload everything — duplicates are auto-handled by the cache check
            // inside preloadImage(), so re-fetching the same URL is free.
            extraUrls.forEach(url => preloadImage(url, 'auto'));
        }

        // applyBodyBackgroundSmoothly: replaces the body's background-image only
        // AFTER the target image is fully decoded in memory. This eliminates the
        // brief blank/flash that browsers show when you apply an uncached background
        // URL and the browser has to network-fetch and decode it before painting.
        // If the image is already in the cache (which it normally is, thanks to the
        // preloader above), the swap happens on the very next animation frame.
        function applyBodyBackgroundSmoothly(url) {
            if (!url) return;
            // Make sure the URL is in the preload pipeline. preloadImage() is a
            // no-op if the URL was already preloaded — so this is essentially free.
            preloadImage(url, 'high');
            const apply = () => {
                // Use requestAnimationFrame so the background swap is synced to
                // the browser's next repaint cycle, avoiding mid-frame flicker.
                requestAnimationFrame(() => {
                    document.body.style.backgroundImage = `url('${url}')`;
                });
            };
            const readyPromise = imageReadyPromises[url];
            if (readyPromise && typeof readyPromise.then === 'function') {
                // Wait for full decode, but apply immediately if the underlying
                // <img>.complete flag is already true (cached on disk from a
                // previous visit).
                const cachedImg = backgroundCache[url];
                if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
                    apply();
                } else {
                    readyPromise.then(apply);
                }
            } else {
                apply();
            }
        }

        // enhanceImagesIn: walks every <img> element inside the given container
        // and stamps the high-performance attributes (loading=eager, decoding=async,
        // fetchpriority=high) plus GPU-acceleration inline styles. This is called
        // right after any innerHTML assignment that renders gallery cards or story
        // cards. The GPU styles do three things:
        //   1. will-change: transform — promotes the image to its own compositor
        //      layer so hover-scale transforms never trigger a layout reflow.
        //   2. backface-visibility: hidden — eliminates the sub-pixel jitter that
        //      Chrome sometimes shows when an image is being scaled by transform.
        //   3. transform: translateZ(0) — forces an initial 3D layer, so the very
        //      first hover does not have to pay the cost of layer promotion.
        // The cumulative effect is that every hover scale on a gallery-card or
        // story-card animates at a perfectly consistent 60 fps with no flicker.
        function enhanceImagesIn(container) {
            if (!container) return;
            const imgs = container.querySelectorAll ? container.querySelectorAll('img') : [];
            imgs.forEach(img => {
                // Skip already-enhanced images (cheap idempotent guard)
                if (img.dataset.wpEnhanced === '1') return;
                img.dataset.wpEnhanced = '1';
                // Performance attributes
                img.loading = 'eager';
                img.decoding = 'async';
                if ('fetchPriority' in img) img.fetchPriority = 'high';
                // GPU-acceleration / hover-smoothness inline styles. We append
                // rather than overwrite so existing inline styles set by the
                // template (width, height, object-fit, display) are preserved.
                const extra = 'will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0); -webkit-transform: translateZ(0); transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);';
                img.style.cssText = (img.style.cssText || '') + ';' + extra;
                // Warm the cache for this src as well — in case a user navigates
                // away and comes back, the bitmap remains in memory.
                if (img.src) preloadImage(img.src, 'auto');
            });
        }

        // --- Global State ---
        let currentActiveUniId = null;
        let currentCountryPage = 'page-usa-unis'; // Tracks which country list page the user came from (USA or UK) for the back button on the university detail page

        // --- 1. The Database (Data Object) ---
        const appData = {
            universities: {
                mit: {
                    name: "Massachusetts Institute of Technology (MIT)", shortName: "Massachusetts Institute of Technology (MIT)", cityId: "cambridge",
                    cityName: "Cambridge, MA", rank: "1", tuition: "$64,310 / $89,340 Total COA",
                    heroImage: "https://images.pexels.com/photos/27772402/pexels-photo-27772402.jpeg",
                    overview: "The Massachusetts Institute of Technology is the world's #1 ranked university for 14 consecutive years. Founded in 1861 by William Barton Rogers, MIT's motto is 'Mens et Manus' — Mind and Hand. With 1,000 faculty and 11,000+ students, MIT alumni have founded over 30,000 companies generating $1.9 trillion in annual revenue — effectively the 10th largest economy in the world.",
                    quickFacts: ["QS World Rank: #1 (14 years consecutive)", "THE World Rank: #2", "Acceptance Rate: ~4%", "Total Students: 11,500+", "Location: Cambridge, Massachusetts", "Campus: Along the Charles River Basin"],
                    financialReqs: "MIT is need-blind for ALL students including international. Families earning under $100,000 pay $0. Families under $200,000 have full tuition covered. Average scholarship for families under $100k is $85,236. Even full-pay students receive a 50% institutional subsidy.",
                    admissionRequirements: [
                        "Acceptance Rate: ~4% (Class of 2028)",
                        "Application Deadline: January 1 (Regular Decision)",
                        "Required Tests: SAT or ACT (no minimum, holistic review)",
                        "English Requirement: TOEFL 90+ or IELTS 7.0+ for international students",
                        "Application Portal: MIT Apply (apply.mit.edu)",
                        "Note: MIT is need-blind for all students including international applicants"
                    ],
                    applicationDeadlines: [
                        "Early Action Deadline: November 1 — non-binding, allows you to receive an admissions decision in mid-December while keeping the option to apply elsewhere",
                        "Regular Action Deadline: January 5 — MIT's standard application round, decisions released in mid-March",
                        "Test Score Window: Tests taken before November 30 accepted for EA; before December 31 for RA (English proficiency tests accepted through January for RA applicants)",
                        "Financial Aid Deadline: February 15 — CSS Profile and parental tax documents via IDOC, same deadline for domestic and international students",
                        "Reply-By Date: May 1 — universal admitted-student deposit deadline for the upcoming Fall term",
                        "Graduate Programs: Most master's and PhD deadlines fall between December 1 and February 1 — varies by department; MIT Sloan MBA uses three rounds (mid-September, early January, mid-April)",
                        "Best Time to Apply: Apply Early Action (November 1) if MIT is your clear top choice and your senior-year credentials are strong by October — the EA acceptance rate is meaningfully higher (~7–8%) than RA (~4%) due to the self-selecting applicant pool",
                        "Application Opens: Common App and MIT's own application portal open in early August each year for the following Fall cycle"
                    ],
                    bachelors: [
                        { title: "Computer Science and Engineering (BS)", duration: "4 Years", desc: "The largest department at MIT. Covers algorithms, AI, software engineering, and systems architecture. STEM designated.", careers: ["Software Engineer", "AI Researcher", "Quant Analyst"], salary: "$135,000–$180,000", demand: "AI and software engineering roles are among the fastest growing in the global economy with demand projected to increase 25% by 2030." },
                        { title: "AI and Decision Making (BS)", duration: "4 Years", desc: "One of MIT's newest and most in-demand programs. Focuses on machine learning, data systems, and intelligent decision frameworks.", careers: ["Machine Learning Engineer", "Data Scientist", "AI Ethicist"], salary: "$145,000–$190,000", demand: "As AI integration becomes mandatory across Fortune 500s, specialized AI architects face a massive talent shortage." },
                        { title: "Mechanical Engineering (BS)", duration: "4 Years", desc: "Covers biorobotics, energy sustainability, and desalination technology. Flexible track options available.", careers: ["Robotics Engineer", "Energy Consultant", "Aerospace Designer"], salary: "$95,000–$120,000", demand: "Advanced manufacturing and the clean energy transition are driving steady 10% year-over-year growth." },
                        { title: "Economics (BS)", duration: "4 Years", desc: "Consistently ranked #1 globally for econometrics. Interdisciplinary track combining Computer Science, Economics and Data Science available.", careers: ["Investment Banker", "Economic Consultant", "Data Analyst"], salary: "$110,000–$150,000", demand: "Data-driven economic modeling is increasingly crucial for global risk management and hedge funds." },
                        { title: "Architecture (BS)", duration: "4 Years", desc: "Explores architectural design, building technology, and history through the lens of social justice and innovation.", careers: ["Architect", "Urban Tech Planner", "Design Strategist"], salary: "$75,000–$95,000", demand: "Sustainable and smart-city architecture is seeing a rapid revival fueled by global climate initiatives." }
                    ],
                    masters: [
                        { title: "MBA", duration: "2 Years", desc: "MIT Sloan School of Management. Action Learning model with global labs. Students divided into ocean-named cohorts.", careers: ["Product Manager", "Management Consultant", "Startup Founder"], salary: "$175,000 base + bonus", demand: "Tech-literate executives are replacing traditional management profiles across all sectors." },
                        { title: "Master of Finance (MFin)", duration: "18 Months", desc: "Accelerated 12-month option available. Targets 0-3 years experience. Total cost $133,007.", careers: ["Quantitative Analyst", "Portfolio Manager", "Risk Manager"], salary: "$140,000–$200,000", demand: "Algorithmic trading and decentralized finance (DeFi) are creating high-value quantitative roles." },
                        { title: "Master of Business Analytics", duration: "12 Months", desc: "Includes 7-month capstone project with US and international companies.", careers: ["Data Strategist", "Operations Analyst", "Pricing Director"], salary: "$130,000–$160,000", demand: "Companies rely heavily on data strategy to optimize supply chains and consumer pricing algorithms." },
                        { title: "MS in Management Studies", duration: "9 Months", desc: "Designed for students from international partner schools.", careers: ["Strategy Consultant", "Corporate Strategist", "Business Developer"], salary: "$120,000–$150,000", demand: "Global supply chain realignments are creating strong demand for agile management analysts." }
                    ],
                    scholarships: [
                        { title: "MIT Need-Based Institutional Scholarship", amount: "Up to $85,236", eligibility: "All admitted students", desc: "Available to all students including international. Families under $100k receive full coverage." },
                        { title: "Tuition-Free Initiative", amount: "Full Tuition ($64,310)", eligibility: "Families earning under $200,000", desc: "For families earning under $200,000 with typical assets. No separate application needed." },
                        { title: "Research and Teaching Assistantships", amount: "Tuition + Stipend", eligibility: "Graduate Students", desc: "Covers tuition plus monthly stipend — Available in most doctoral departments including Biology, Chemistry, and Physics." }
                    ]
                },
                harvard: {
                    name: "Harvard University", shortName: "Harvard University", cityId: "cambridge_harvard",
                    cityName: "Cambridge, MA", rank: "5", tuition: "$59,320 / $86,926 Total COA",
                    heroImage: "https://news.harvard.edu/wp-content/uploads/2020/10/Fall_01.jpg",
                    overview: "Harvard University, founded in 1636, is the oldest institution of higher education in the United States. Approaching its 375th Commencement in 2026, Harvard remains one of the most prestigious universities on Earth. Its undergraduate program is built on a liberal arts philosophy requiring students to think across disciplines — from AI ethics to bioengineering to Renaissance literature. Harvard alumni include 8 US Presidents, 160 Nobel Laureates, and countless world leaders. The university's \"un-walled\" approach to education means Cambridge itself becomes the classroom, with Boston's cultural, financial, and medical institutions serving as extended learning environments.",
                    quickFacts: ["QS World Rank: #5 globally", "THE World Rank: #4 globally", "Acceptance Rate: ~3.6% (Class of 2028)", "Total Students: 23,000+", "Undergraduate Enrollment: ~7,000", "Location: Cambridge, Massachusetts", "Founded: 1636 — oldest university in the USA", "Nobel Laureates among alumni: 160+", "Cross-registration: Harvard students can access 8,000+ MIT courses"],
                    financialReqs: "Harvard has the most generous financial aid policy in its history for 2026. Families earning under $100,000 pay absolutely nothing — tuition, housing, food, health insurance, and travel expenses are all covered. Families earning under $200,000 receive a full tuition waiver. Approximately 25% of Harvard families pay nothing at all. All aid is grant-based — Harvard replaced every federal loan with direct institutional grants. This policy applies to international students equally.",
                    admissionRequirements: [
                        "Acceptance Rate: ~3.6% (Class of 2028) — most selective in Harvard history",
                        "Application Deadline: January 1 Regular Decision, November 1 Restrictive Early Action",
                        "Required Tests: SAT or ACT recommended — test-optional policy still active in 2026",
                        "English Requirement: TOEFL 100+ or IELTS 7.5+ for international students",
                        "Application Portal: Common App",
                        "Special Note: Harvard cross-registers with MIT — admitted students access both campuses",
                        "Financial Aid: Need-blind for ALL students including international applicants"
                    ],
                    applicationDeadlines: [
                        "Restrictive Early Action Deadline: November 1 — non-binding but restricts you from applying Early Decision or Early Action to other private US universities; decision released mid-December (admit, defer, or deny)",
                        "Regular Decision Deadline: January 1 (11:59 pm local time) — main application round, notifications by late March",
                        "Counselor / Teacher Submission Grace Window: High school counselors and recommenders may submit supporting materials up to one week after the November 1 / January 1 deadline if necessary",
                        "Financial Aid Deadline: November 1 for REA candidates, February 1 for RD candidates, March 1 for transfer candidates — submit CSS Profile and IDOC documents",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline",
                        "Transfer Applications: March 1 transfer deadline; Harvard accepts an extremely small number of transfer students each year (~12 in a typical cycle)",
                        "Best Time to Apply: Apply REA (November 1) if Harvard is your unambiguous first choice — REA acceptance rate (~8.7% for Class of 2028) is meaningfully higher than RD (~2.6%); apply RD if you need more time to strengthen your senior-year transcript or essays",
                        "Application Opens: Common Application opens August 1, Coalition Application (powered by Scoir) opens August 15"
                    ],
                    bachelors: [
                        { title: "Computer Science (BA)", duration: "4 Years", desc: "School of Engineering and Applied Sciences. Covers algorithms, AI, systems, and software. Cross-registration with MIT available.", careers: ["Software Engineer", "Tech Consultant", "Product Manager"], salary: "$130,000–$160,000", demand: "High demand across all tech sectors, especially with Harvard's strong consulting pipeline." },
                        { title: "Economics (BA)", duration: "4 Years", desc: "One of Harvard's most popular concentrations. Strong quantitative and policy focus. Excellent for consulting and finance careers.", careers: ["Investment Banker", "Management Consultant", "Policy Analyst"], salary: "$115,000–$150,000", demand: "Wall Street and top-tier consulting firms consistently recruit heavily from this program." },
                        { title: "Government (BA)", duration: "4 Years", desc: "Examines political systems, international relations, and public policy. Pipeline to law school, diplomacy, and public service.", careers: ["Political Analyst", "Diplomat", "Lawyer (Post-JD)"], salary: "$75,000–$110,000", demand: "Steady demand in think tanks, NGOs, and federal government roles." },
                        { title: "Biomedical Engineering (BA)", duration: "4 Years", desc: "SEAS. Combines biology with engineering for careers in medicine, biotech, and research.", careers: ["Biotech Researcher", "Medical Device Designer", "Physician (Post-MD)"], salary: "$90,000–$120,000", demand: "Biotech is experiencing a massive boom, especially in the Boston/Cambridge area." },
                        { title: "Applied Mathematics (BA)", duration: "4 Years", desc: "Focuses on mathematical modeling, statistics, and computational methods across disciplines.", careers: ["Data Scientist", "Quantitative Researcher", "Actuary"], salary: "$110,000–$145,000", demand: "Data modeling skills are increasingly essential in finance, tech, and climate science." },
                        { title: "History and Literature (BA)", duration: "4 Years", desc: "One of Harvard's most iconic interdisciplinary concentrations combining historical analysis with literary criticism.", careers: ["Journalist", "Author", "Academic Researcher"], salary: "$60,000–$85,000", demand: "Valued for superior writing and critical thinking skills in media, publishing, and law." },
                        { title: "Neuroscience (BA)", duration: "4 Years", desc: "Life Sciences division. Explores the brain from cellular neuroscience to behavioral psychology.", careers: ["Neuroscientist", "Clinical Researcher", "Healthcare Consultant"], salary: "$80,000–$105,000", demand: "Brain-computer interface technologies and neuro-pharmacology are rapidly expanding fields." }
                    ],
                    masters: [
                        { title: "MBA", duration: "2 Years", desc: "Harvard Business School — 2 Years — Tuition $84,760. Focus on Change Fitness and AI leadership. Median post-grad salary $175,000. Cohort system with ocean-named groups.", careers: ["C-Suite Executive", "Venture Capitalist", "Strategy Consultant"], salary: "$175,000 base", demand: "Unmatched global prestige ensures HBS graduates remain in the highest demand globally." },
                        { title: "MD", duration: "4 Years", desc: "Harvard Medical School — Pathways Track (135 students) and HST Track with MIT (30 students). Annual tuition $76,828.", careers: ["Surgeon", "Clinical Specialist", "Medical Director"], salary: "$200,000–$400,000+", demand: "Severe national physician shortages guarantee high demand across all medical specialties." },
                        { title: "JD", duration: "3 Years", desc: "Harvard Law School — 3 Years — Tuition $84,400. Total annual budget $126,650. One of the most prestigious law programs globally.", careers: ["Corporate Lawyer", "Federal Clerk", "Public Interest Lawyer"], salary: "$225,000 (Big Law)", demand: "High demand in corporate restructuring, AI intellectual property, and international law." },
                        { title: "MPH", duration: "1 to 2 Years", desc: "Harvard T.H. Chan School of Public Health — 45-credit program. Tuition $77,400. Concentrations in Epidemiology, Global Health, Biostatistics.", careers: ["Epidemiologist", "Health Policy Advisor", "NGO Director"], salary: "$85,000–$120,000", demand: "Post-pandemic infrastructure funding has solidified demand for public health experts." },
                        { title: "Master of Liberal Arts in Data Science", duration: "Flexible", desc: "Harvard Extension School — Hybrid online and residency model. Designed for working professionals.", careers: ["Data Analyst", "Machine Learning Engineer", "BI Manager"], salary: "$115,000–$140,000", demand: "Data-driven decision making is now a baseline requirement across mid-to-large enterprises." },
                        { title: "MS in Computational Science and Engineering", duration: "1 to 2 Years", desc: "SEAS — Bridges computer science with applied mathematics and engineering systems.", careers: ["Systems Architect", "Computational Scientist", "R&D Engineer"], salary: "$130,000–$160,000", demand: "High demand in advanced computing, national labs, and complex system design." }
                    ],
                    scholarships: [
                        { title: "Harvard Need-Based Grant", amount: "Covers full tuition plus living costs", eligibility: "For families earning under $100,000", desc: "Automatically assessed, no separate application needed." },
                        { title: "Full Tuition Waiver", amount: "$59,320", eligibility: "For families earning under $200,000 with typical assets", desc: "Harvard's landmark 2026 commitment." },
                        { title: "Harvard Griffin GSAS Fellowships", amount: "Full funding plus stipend", eligibility: "For doctoral students across all departments", desc: "Covers tuition and living costs." },
                        { title: "HBS Fellowship Fund", amount: "Up to $40,000", eligibility: "Merit and need based", desc: "For MBA students demonstrating financial need." },
                        { title: "Loan Replacement Grant", amount: "Variable", eligibility: "Qualifying undergraduates", desc: "Harvard replaces ALL federal loans with direct institutional grants. Zero debt policy for qualifying undergraduates." }
                    ]
                },
                stanford: {
                    name: "Stanford University", shortName: "Stanford University", cityId: "stanford",
                    cityName: "Palo Alto, CA", rank: "3", tuition: "$67,731 / $92,892 Total COA",
                    heroImage: "https://images.trvl-media.com/place/502584/0eaccecc-94bf-4457-abb1-db6494aadc19.jpg",
                    overview: "Located in the heart of Silicon Valley, Stanford University is one of the world’s leading research institutions known for innovation, entrepreneurship, artificial intelligence, engineering, and global impact. Stanford offers students strong academic flexibility, world-class faculty, startup culture, and direct access to internships and networking opportunities with top tech companies.",
                    quickFacts: ["Acceptance Rate: ~4%", "Campus Size: 8,180 Acres", "QS World Rank: #3 Globally", "Founded: 1885 by Leland and Jane Stanford", "Located in Silicon Valley, California", "Known for AI, Engineering, Business, and Computer Science", "Startups Founded by Alumni: 39,000+", "Varsity Sports Teams: 36", "Endowment: $36 Billion+"],
                    financialReqs: "International students must indicate financial aid interest during application submission. Stanford offers need-based financial aid and meets 100% of demonstrated financial need for admitted students. CSS Profile or ISAFA documents are required for aid consideration. Estimated annual cost including tuition, housing, food, and personal expenses is approximately $97,000.",
                    admissionRequirements: [
                        "Acceptance Rate: ~3.7% (Class of 2028)",
                        "Application Deadline: January 2 (Regular Decision), November 1 (Restrictive Early Action)",
                        "Required Tests: Test-optional policy active",
                        "English Requirement: TOEFL 100+ or IELTS 7.0+",
                        "Application Portal: Common App",
                        "Note: Stanford meets 100% of demonstrated financial need for all admitted students"
                    ],
                    applicationDeadlines: [
                        "Restrictive Early Action (REA) Deadline: November 1 — non-binding; you must identify Stanford as your first choice and may not apply Early Action / Early Decision / REA to any other private US university",
                        "Regular Decision Deadline: January 5 (11:59 pm local time) — main application route, decisions released in early April",
                        "REA Decision Release: Mid-December — admit, defer, or deny",
                        "Financial Aid Priority Deadline (REA): November 15 — submit CSS Profile, FAFSA (US citizens), and IDOC documents to receive aid notification alongside your admissions decision",
                        "Financial Aid Final Deadline (RD): February 15 — required to finalise your aid package",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline",
                        "Arts Portfolio: A separate, earlier deadline applies if you are submitting an arts portfolio — check the Stanford Common App portal for the specific cut-off",
                        "Transfer Applications: Stanford accepts transfer applications with a deadline of March 15; admission is extremely competitive",
                        "Best Time to Apply: Apply REA (November 1) if Stanford is your clear first choice and your application is fully ready by late October — REA has a slightly higher acceptance rate and gives you an early answer; otherwise apply RD to maximise time to polish essays and senior-year grades",
                        "Application Opens: Common Application opens in early August"
                    ],
                    bachelors: [
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Focuses on AI, machine learning, systems, software engineering, and computing theory.", careers: ["Software Engineer", "AI Developer", "Startup Founder"], salary: "$140,000–$185,000", demand: "Direct pipeline to top Silicon Valley firms makes this one of the most lucrative undergrad degrees." },
                        { title: "Bioengineering (BS)", duration: "4 Years", desc: "Combines engineering, biology, and healthcare innovation.", careers: ["Biomedical Engineer", "Health-Tech Innovator", "Research Scientist"], salary: "$95,000–$130,000", demand: "Rapid expansion in personalized medicine and wearable health tech drives strong hiring." },
                        { title: "Economics (BA)", duration: "4 Years", desc: "Covers finance, economic analysis, policy, and global markets.", careers: ["Venture Capital Analyst", "Investment Banker", "Tech Consultant"], salary: "$115,000–$155,000", demand: "Tech-focused finance and VC firms actively recruit Stanford economists." },
                        { title: "Mechanical Engineering (BS)", duration: "4 Years", desc: "Focuses on robotics, manufacturing, energy systems, and design.", careers: ["Robotics Engineer", "Hardware Designer", "EV Systems Engineer"], salary: "$100,000–$130,000", demand: "Hardware innovation in autonomous vehicles and robotics is creating immense demand." },
                        { title: "Human Biology (BA/BS)", duration: "4 Years", desc: "Interdisciplinary study of biology, psychology, and human health.", careers: ["Public Health Analyst", "Healthcare Consultant", "Physician (Post-Med)"], salary: "$80,000–$110,000", demand: "Growing need for professionals who understand the intersection of biology and societal health." },
                        { title: "Data Science and Social Systems (BA/BS)", duration: "4 Years", desc: "Combines data science with real-world social problem solving.", careers: ["Data Scientist", "Policy Tech Analyst", "Social Impact Strategist"], salary: "$110,000–$140,000", demand: "Tech companies and NGOs increasingly require data scientists to address ethical tech scaling." }
                    ],
                    masters: [
                        { title: "MS in Computer Science", duration: "2 Years", desc: "Advanced study in AI, machine learning, systems, and cybersecurity.", careers: ["Senior AI Engineer", "Machine Learning Researcher", "CTO"], salary: "$160,000–$220,000", demand: "Elite AI engineering roles are critically understaffed globally, ensuring premium compensation." },
                        { title: "MBA", duration: "2 Years", desc: "World-renowned leadership and entrepreneurship program.", careers: ["Tech Executive", "Venture Capital Partner", "Founder"], salary: "$180,000 base + equity", demand: "Stanford MBAs remain the dominant force in Silicon Valley venture capital and tech leadership." },
                        { title: "MS in Data Science", duration: "2 Years", desc: "Focuses on analytics, machine learning, and large-scale data systems.", careers: ["Lead Data Scientist", "Data Architect", "Algorithm Developer"], salary: "$140,000–$180,000", demand: "Big Data infrastructure management continues to see double-digit job growth." },
                        { title: "MS in Bioengineering", duration: "2 Years", desc: "Advanced biomedical engineering and biotechnology program.", careers: ["Biotech Director", "Senior R&D Engineer", "Clinical Systems Innovator"], salary: "$120,000–$160,000", demand: "CRISPR and mRNA technology commercialization is fueling a massive biotech hiring wave." },
                        { title: "Master of Public Policy (MPP)", duration: "2 Years", desc: "Focuses on governance, policy analysis, and leadership.", careers: ["Policy Director", "Tech Regulator", "Think Tank Leader"], salary: "$100,000–$135,000", demand: "As AI and tech regulation tightens, firms urgently need policy experts with tech literacy." }
                    ],
                    scholarships: [
                        { title: "Knight-Hennessy Scholars", amount: "Full Tuition + Stipend", eligibility: "Graduate Students", desc: "Full tuition, living stipend, and leadership program for graduate students." },
                        { title: "Need-Based Financial Aid", amount: "100% Demonstrated Need", eligibility: "Eligible Students", desc: "Stanford meets 100% demonstrated financial need for eligible students." },
                        { title: "Reliance Dhirubhai Fellowship", amount: "Full Tuition + Living Support", eligibility: "Indian MBA Students", desc: "Scholarship support for Indian students pursuing Stanford MBA programs." }
                    ]
                },
                caltech: {
                    name: "California Institute of Technology", shortName: "California Institute of Technology", cityId: "pasadena",
                    cityName: "Pasadena, CA", rank: "10", tuition: "$65,622 / $93,912 Total COA",
                    heroImage: "https://static.independent.co.uk/2025/08/15/11/47/iStock-483677767.jpeg",
                    overview: "California Institute of Technology (Caltech) is one of the world’s leading science and engineering institutions, located in Pasadena, California. Known for its extremely rigorous academics, small student body, and research-driven culture, Caltech specializes in physics, engineering, computer science, astronomy, and applied sciences. The university maintains a close partnership with NASA’s Jet Propulsion Laboratory (JPL), giving students direct exposure to cutting-edge aerospace and space exploration research. Caltech emphasizes interdisciplinary collaboration, innovation, and hands-on scientific discovery.",
                    quickFacts: ["QS World Rank: #10 globally", "Acceptance Rate: ~3%", "Student-Faculty Ratio: 3:1", "Campus Size: 124 Acres", "Undergraduate Students: ~1,000", "Strong partnership with NASA JPL", "Located in Pasadena, California"],
                    financialReqs: "Caltech meets 100% of demonstrated financial need for admitted students. International students are considered under a need-aware admissions process. Families earning under $100,000 annually often receive aid covering tuition, housing, and meals. The estimated total annual cost of attendance for 2026-2027 is approximately $98,000 including tuition, housing, food, insurance, and personal expenses.",
                    admissionRequirements: [
                        "Acceptance Rate: ~3.9% (Class of 2028)",
                        "Application Deadline: January 3 (Regular Decision), November 1 (Early Action)",
                        "Required Tests: SAT or ACT required — Math SAT 800 or ACT Math 35 typical",
                        "English Requirement: TOEFL 100+ or IELTS 7.0+",
                        "Application Portal: Common App",
                        "Note: Caltech meets full demonstrated financial need for all admitted students"
                    ],
                    applicationDeadlines: [
                        "Restrictive Early Action (REA) Deadline: November 1 — non-binding, but you may not apply Early Action or Early Decision to other private US universities (limited exceptions apply for public institutions and merit-only programmes)",
                        "REA Materials Grace Window: All supplementary materials due by November 6 (5-day grace period after the November 1 main deadline)",
                        "REA Standardized Testing Cut-off: All SAT / ACT testing must be completed by November 30 for REA applicants",
                        "Regular Decision Deadline: January 5, 2026 — main application round, decisions released by mid-March",
                        "REA Decision Release: Mid-December — admit, defer, or deny",
                        "Financial Aid Deadlines: CSS Profile and IDOC documents typically due November 15 for REA, February 15 for RD",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline",
                        "Transfer Applications: Caltech transfer deadline is April 1; only a very small number of transfers are accepted each year",
                        "QuestBridge Match: Caltech is a proud QuestBridge partner since 2008 — QuestBridge Finalists may apply via the QuestBridge National College Match programme",
                        "Best Time to Apply: Apply REA (November 1) only if Caltech is genuinely your top choice and your math / science credentials are rock-solid by junior-year end — RD is the safer route if you need additional senior-year test scores or coursework",
                        "Application Opens: Common Application opens early August"
                    ],
                    bachelors: [
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Focuses on algorithms, artificial intelligence, machine learning, systems, and software engineering.", careers: ["Algorithm Designer", "Machine Learning Engineer", "Software Architect"], salary: "$145,000–$190,000", demand: "Caltech's rigorous mathematical foundation makes its CS grads highly prized by elite tech firms." },
                        { title: "Mechanical Engineering (BS)", duration: "4 Years", desc: "Covers robotics, thermodynamics, advanced mechanics, aerospace systems, and energy technologies.", careers: ["Aerospace Engineer", "Robotics Specialist", "R&D Engineer"], salary: "$105,000–$135,000", demand: "Direct pipeline to JPL and SpaceX fuels constant demand for Caltech mechanical engineers." },
                        { title: "Physics (BS)", duration: "4 Years", desc: "Strong emphasis on theoretical physics, quantum mechanics, astrophysics, and experimental research.", careers: ["Quantum Researcher", "Data Scientist", "Astrophysicist"], salary: "$95,000–$140,000", demand: "Quantum computing investments are pulling pure physics majors into highly lucrative tech roles." },
                        { title: "Electrical Engineering (BS)", duration: "4 Years", desc: "Includes circuits, embedded systems, semiconductors, communications, and AI hardware systems.", careers: ["Hardware Architect", "Semiconductor Engineer", "AI Chip Designer"], salary: "$115,000–$150,000", demand: "The global push for domestic semiconductor manufacturing has spiked EE demand by 20%." },
                        { title: "Applied Mathematics (BS)", duration: "4 Years", desc: "Focuses on mathematical modeling, computation, optimization, and data-driven scientific analysis.", careers: ["Quantitative Analyst", "Cryptographer", "Risk Modeler"], salary: "$120,000–$170,000", demand: "Financial institutions and cybersecurity firms fiercely compete for high-level mathematical talent." },
                        { title: "Astronomy (BS)", duration: "4 Years", desc: "Studies planetary science, cosmology, astrophysics, and observational astronomy.", careers: ["Astronomer", "Space Mission Analyst", "Science Communicator"], salary: "$85,000–$115,000", demand: "Private space exploration companies are expanding the previously academic job market." },
                        { title: "Chemical Engineering (BS)", duration: "4 Years", desc: "Explores chemical systems, materials science, energy processes, and molecular engineering.", careers: ["Materials Scientist", "Process Engineer", "Energy Researcher"], salary: "$100,000–$130,000", demand: "Next-gen battery technology and sustainable materials are driving a chemical engineering renaissance." },
                        { title: "Bioengineering (BS)", duration: "4 Years", desc: "Combines biology, engineering, and computational sciences for healthcare and biotechnology innovation.", careers: ["Biotech Engineer", "Synthetic Biologist", "Medical Tech Developer"], salary: "$100,000–$135,000", demand: "Computational biology is revolutionizing drug discovery, requiring deep engineering integration." }
                    ],
                    masters: [
                        { title: "Master of Computer Science", duration: "1-2 Years", desc: "Advanced study in artificial intelligence, machine learning, distributed systems, and computational theory.", careers: ["Senior AI Researcher", "Principal Engineer", "Tech Director"], salary: "$160,000–$210,000", demand: "Deep-tech startups and FAANG companies consistently bid high for Caltech graduate talent." },
                        { title: "Master of Aerospace Engineering", duration: "2 Years", desc: "Focuses on spacecraft systems, propulsion, aerodynamics, and advanced aerospace technologies.", careers: ["Spacecraft Designer", "Propulsion Engineer", "Mission Commander"], salary: "$125,000–$160,000", demand: "The booming commercial space sector makes this one of the most exciting engineering fields today." },
                        { title: "Master of Electrical Engineering", duration: "1-2 Years", desc: "Specialization in electronics, robotics, signal processing, and intelligent systems.", careers: ["Lead Hardware Engineer", "Robotics Director", "Communications Architect"], salary: "$130,000–$170,000", demand: "Autonomous systems and 6G communications require advanced electrical engineering leadership." },
                        { title: "Master of Physics", duration: "2 Years", desc: "Research-oriented study in quantum physics, particle physics, and astrophysics.", careers: ["Senior Research Scientist", "Quantum Computing Analyst", "Professor (Post-PhD)"], salary: "$110,000–$150,000", demand: "Private sector R&D is increasingly hiring physics master's graduates for complex modeling." },
                        { title: "Master of Bioengineering", duration: "1-2 Years", desc: "Combines biomedical systems, computational biology, and engineering innovation.", careers: ["Biomedical Director", "Bioinformatics Lead", "Pharma Innovator"], salary: "$120,000–$160,000", demand: "The intersection of AI and biology requires advanced cross-disciplinary bioengineering experts." },
                        { title: "Master of Applied Mathematics", duration: "1-2 Years", desc: "Advanced mathematical methods for engineering, computation, and scientific research.", careers: ["Lead Quant", "Senior Data Scientist", "Cryptographic Architect"], salary: "$140,000–$190,000", demand: "Algorithmic security and high-frequency trading rely entirely on advanced applied mathematics." }
                    ],
                    scholarships: [
                        { title: "Caltech Need-Based Scholarship", amount: "Covers up to full tuition and living expenses", eligibility: "Students with demonstrated financial need", desc: "Provides extensive financial relief based entirely on demonstrated institutional need parameters." },
                        { title: "International Student Financial Aid", amount: "Variable based on need", eligibility: "International students applying during first-year admission", desc: "Offered via a need-aware threshold to qualifying global incoming first-year applicants." },
                        { title: "Research Fellowship Programs", amount: "Research stipends and project funding", eligibility: "Students involved in faculty-led research projects", desc: "Supports rigorous immersion frameworks inside institutional configurations." },
                        { title: "Graduate Research Assistantships", amount: "Full tuition + annual stipend", eligibility: "Graduate research students", desc: "Bridges tuition requirements and provides a reliable framework of continuous monthly living allocation blocks." },
                        { title: "Merit-Based External Scholarships", amount: "Varies", eligibility: "Exceptional academic and research achievements", desc: "Sourced through collaborative alignment parameters with external structural entities." }
                    ]
                },
                nyu: {
                    name: "New York University (NYU)", shortName: "New York University (NYU)", cityId: "nyc",
                    cityName: "New York City, NY", rank: "55", tuition: "$62,796 — $65,622 depending on school",
                    heroImage: "https://images.pexels.com/photos/3346227/pexels-photo-3346227.jpeg",
                    overview: "New York University was founded in 1831 with a mission to provide education accessible to all. Its 'un-walled campus' is embedded directly into Manhattan, making New York City itself the classroom. NYU is ranked #55 globally by QS 2026 with a near-perfect Employer Reputation score of 99.9. It has degree-granting campuses in New York, Abu Dhabi, and Shanghai, with students from over 130 countries.",
                    quickFacts: ["QS World Rank: #55 globally, #17 in USA", "THE World Rank: #31", "Employer Reputation Score: 99.9/100", "Acceptance Rate: ~8%", "Global Campuses: New York, Abu Dhabi, Shanghai", "Students from: 130+ countries"],
                    financialReqs: "NYU Promise guarantees $0 tuition for families earning under $100,000. NYU meets 100% of demonstrated financial need for ALL eligible students regardless of citizenship, including international and undocumented students. Total cost of attendance averages approximately $92,062 per year.",
                    admissionRequirements: [
                        "Acceptance Rate: ~8% (overall), ~17% general undergraduate",
                        "Application Deadline: January 5 (Regular Decision), November 1 (Early Decision)",
                        "Required Tests: Test-optional policy active for most programs",
                        "English Requirement: TOEFL 84+ or IELTS 6.5+",
                        "Application Portal: Common App",
                        "Note: NYU Promise covers full tuition for families earning under $100,000"
                    ],
                    applicationDeadlines: [
                        "Early Decision I Deadline: November 1 — binding; if admitted you must enrol at NYU and withdraw all other applications. Decisions released mid-December",
                        "Early Decision II Deadline: January 1 — binding; second binding round for students who decide on NYU after the ED I deadline. Decisions typically released in mid-February",
                        "Regular Decision Deadline: January 5 — main non-binding round, decisions released in late March / early April",
                        "Portfolio / Audition Deadlines (Tisch, Steinhardt): Strongly recommended to submit the Common App at least one month in advance — portfolio / audition components have separate, programme-specific deadlines (typically December 1 for performing arts)",
                        "Second Bachelor's Degree (Engineering, Nursing) Deadline: April 1 for the following Fall term",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline (ED admits commit on receipt of decision)",
                        "Financial Aid Deadline: November 1 for ED I, January 1 for ED II, February 15 for RD — submit CSS Profile and FAFSA (US citizens)",
                        "Spring Intake: Spring start is available — applications generally close November 1 of the preceding year for Spring January enrolment (only available for certain programmes)",
                        "Best Time to Apply: Apply ED I (November 1) if NYU is unambiguously your top choice — ED acceptance rate (~28%) is roughly double the RD rate; apply ED II if you finalise NYU later; apply RD for maximum flexibility and to keep all options open",
                        "Graduate Programs: Deadlines vary significantly by school — NYU Stern MBA Round 2 typically in January, Round 3 in April; most masters programmes follow priority deadlines of December–February"
                    ],
                    bachelors: [
                        { title: "BS in Business", duration: "4 Years", desc: "Stern School of Business. Concentrations in Finance, Marketing, Accounting, Management, and Information Systems. One of the most globally recognised business schools.", careers: ["Investment Banker", "Management Consultant", "Marketing Director"], salary: "$100,000–$140,000", demand: "Stern graduates remain top targets for Wall Street and global consulting powerhouses." },
                        { title: "BS in Business, Technology and Entrepreneurship", duration: "4 Years", desc: "Stern School. STEM designated. Focuses on new venture development and technological innovation.", careers: ["Startup Founder", "Tech Product Manager", "VC Analyst"], salary: "$105,000–$145,000", demand: "Bridging the gap between code and commerce is highly valued in the NYC tech ecosystem." },
                        { title: "Computer Science (BA)", duration: "4 Years", desc: "College of Arts and Science. Developed with the Courant Institute. Focuses on algorithms, software design, and systems.", careers: ["Software Developer", "Data Analyst", "UX Engineer"], salary: "$110,000–$140,000", demand: "Strong demand across fintech, media, and tech startups based in New York City." },
                        { title: "Economics (BA)", duration: "4 Years", desc: "College of Arts and Science. One of the largest majors at NYU. Strong foundation in micro and macroeconomics with quantitative methods.", careers: ["Financial Analyst", "Economic Researcher", "Policy Advisor"], salary: "$85,000–$120,000", demand: "Consistently stable demand across finance, government, and corporate strategy sectors." },
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Tandon School of Engineering, Brooklyn. Emphasizes technical and mathematical foundations of computing and system security.", careers: ["Systems Engineer", "Cybersecurity Analyst", "AI Developer"], salary: "$115,000–$150,000", demand: "Tandon's rigorous engineering focus aligns perfectly with surging cybersecurity and AI needs." },
                        { title: "BFA in Film and Television", duration: "4 Years", desc: "Tisch School of the Arts. Intensive studio-based program where students write, direct, and edit their own films.", careers: ["Film Director", "Screenwriter", "Video Editor"], salary: "$60,000–$90,000", demand: "Streaming platforms and digital media have expanded opportunities beyond traditional Hollywood." },
                        { title: "Civil Engineering (BS)", duration: "4 Years", desc: "Tandon School of Engineering. Focuses on design and maintenance of infrastructure including transportation and urban water systems.", careers: ["Civil Engineer", "Urban Planner", "Construction Manager"], salary: "$75,000–$100,000", demand: "Smart city initiatives and infrastructure modernization are driving steady job growth." }
                    ],
                    masters: [
                        { title: "MS in Computer Science", duration: "2 Years", desc: "36 credits. Focus on fundamental algorithms, AI, graphics, and systems.", careers: ["Senior Software Engineer", "Data Architect", "Tech Lead"], salary: "$130,000–$170,000", demand: "NYU's proximity to Silicon Alley ensures excellent placement for advanced CS graduates." },
                        { title: "MS in Data Science", duration: "Flexible", desc: "STEM Designated. Focuses on advanced statistical modeling and machine learning.", careers: ["Data Scientist", "Machine Learning Engineer", "Quant Researcher"], salary: "$135,000–$165,000", demand: "Data Science remains one of the most aggressively recruited specialties in the modern economy." },
                        { title: "MA in Economics", duration: "16 - 21 Months", desc: "32 credits. Economic theory and quantitative applications.", careers: ["Senior Economist", "Pricing Strategist", "Market Analyst"], salary: "$100,000–$135,000", demand: "Crucial for navigating complex global markets and corporate financial forecasting." },
                        { title: "MS in Financial Engineering", duration: "Flexible", desc: "Tandon. Ranked #11 nationally. Covers derivative securities, risk management, and algorithmic trading.", careers: ["Quantitative Analyst", "Risk Manager", "Algorithmic Trader"], salary: "$140,000–$190,000", demand: "High-frequency trading and hedge funds rely heavily on specialized financial engineers." },
                        { title: "Master of Public Administration (MPA)", duration: "2 Years", desc: "Wagner School. Public and nonprofit management and policy track.", careers: ["Nonprofit Director", "City Manager", "Policy Analyst"], salary: "$80,000–$115,000", demand: "Strong demand for effective leadership in civic tech, urban planning, and NGO sectors." },
                        { title: "MS in Cybersecurity", duration: "Flexible", desc: "Tandon. Available on-campus and online. Focuses on protecting digital infrastructure.", careers: ["Security Architect", "Threat Hunter", "CISO"], salary: "$125,000–$165,000", demand: "Corporate data breaches have made elite cybersecurity professionals essential to every industry." }
                    ],
                    scholarships: [
                        { title: "NYU Promise", amount: "$0 Tuition", eligibility: "Families earning under $100,000", desc: "For first-year students from families earning under $100,000. No separate application, automatically assessed." },
                        { title: "NYU Presidential Scholarship", amount: "Up to $32,000", eligibility: "Merit based", desc: "Academic excellence and leadership." },
                        { title: "AnBryce Scholarship", amount: "Full Tuition", eligibility: "First-generation students", desc: "First-generation college students with high financial need." },
                        { title: "Global Pathways Scholarship", amount: "Up to $10,000", eligibility: "International students", desc: "For international students with strong academic records." }
                    ]
                },
                columbia: {
                    name: "Columbia University", shortName: "Columbia", cityId: "columbia_nyc",
                    cityName: "New York City, NY", rank: "38", tuition: "$70,170 / $97,902 Total COA",
                    heroImage: "https://images.pexels.com/photos/35491608/pexels-photo-35491608.jpeg",
                    overview: "Columbia University is a world-renowned Ivy League research university located in New York City. Known for its rigorous Core Curriculum, elite academics, and global influence, Columbia excels in fields such as business, engineering, journalism, law, medicine, economics, artificial intelligence, and international affairs. Students benefit from direct access to Manhattan’s financial, technological, media, and research opportunities while studying at one of the most academically intensive universities in the world.",
                    quickFacts: ["QS World Rank: #38 globally", "Acceptance Rate: ~4%", "Location: New York City, New York", "Founded: 1754", "Ivy League Institution", "Known For: Core Curriculum, Finance, Journalism, AI, Law, Medicine", "Undergraduate Tuition Frozen for 2026–27", "Average First-Year Grant: $77,908", "Internationally Recognized Research University"],
                    financialReqs: "Columbia University follows a need-based, no-loan financial aid model for undergraduate students. For the 2025–26 academic year, undergraduate tuition is $70,170, with total cost of attendance around $97,902 including mandatory fees, housing, and food. Families earning under $150,000 with typical assets generally pay $0 in tuition under Columbia's expanded affordability initiative, while families earning under $66,000 typically pay nothing toward the full cost of attendance. About half of Columbia's incoming first-year students receive institutional grants with an average first-year grant of $77,908.",
                    admissionRequirements: [
                        "Acceptance Rate: 3.9% (Class of 2028) — most selective in Columbia history",
                        "Early Decision Deadline: November 1 — binding commitment",
                        "Regular Decision Deadline: January 1",
                        "Required Tests: Test-optional policy active for 2025-2026 cycle",
                        "English Requirement: TOEFL 100+ or IELTS 7.0+ for all international applicants",
                        "Application Portal: Common App only",
                        "Interviews: Alumni interviews offered but not guaranteed to all applicants",
                        "Note: Columbia is need-blind for US citizens and permanent residents. International students are need-aware but substantial aid is available."
                    ],
                    applicationDeadlines: [
                        "Early Decision Deadline: November 1 (11:59 pm applicant's local time) — binding; if admitted you must enrol at Columbia and withdraw applications elsewhere. Decisions released mid-December",
                        "Regular Decision Deadline: January 1 (11:59 pm applicant's local time) — main non-binding round, decisions released in late March",
                        "Financial Aid Deadline (ED): November 15 — submit CSS Profile, FAFSA (US citizens), and IDOC documents to receive aid notification alongside your admissions decision in December",
                        "Financial Aid Deadline (RD): February 15 — to finalise your aid package",
                        "QuestBridge National College Match: Columbia partners with QuestBridge — Finalists apply via the QuestBridge Regular Decision form between November 4 and December 11",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline (ED admits commit immediately on offer)",
                        "Transfer Application Deadline: March 1 — Columbia only admits transfer students for Fall enrolment, not Spring",
                        "Final Transcript Submission: Late June 2026 for matriculating students",
                        "School of General Studies (non-traditional students): Different timeline — Priority Early Action January 15, Early Action March 1, Regular Decision May 15 for Fall start; Spring deadlines run September–November",
                        "Best Time to Apply: Apply ED (November 1) if Columbia is your unambiguous first choice — ED acceptance rate is significantly higher than RD (roughly 11% vs 3.5%); apply RD if you want to compare financial aid offers across schools, since ED is binding before you see your aid package",
                        "Late Applications: Columbia does NOT accept late applications — missing the ED or RD deadline means waiting for the next admissions cycle"
                    ],
                    bachelors: [
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Covers artificial intelligence, machine learning, software engineering, algorithms, cybersecurity, and advanced computing systems.", careers: ["Software Engineer", "AI Developer", "Quant Developer"], salary: "$130,000–$170,000", demand: "Tech and finance firms heavily recruit Columbia CS grads for their strong analytical fundamentals." },
                        { title: "Economics (BA)", duration: "4 Years", desc: "Rigorous economics program with strong quantitative training and access to global finance opportunities in New York City.", careers: ["Investment Banker", "Economic Analyst", "Strategy Consultant"], salary: "$115,000–$150,000", demand: "Direct access to Wall Street makes this one of the most powerful degrees for high finance." },
                        { title: "Political Science (BA)", duration: "4 Years", desc: "Focuses on global politics, governance, public policy, diplomacy, and international relations.", careers: ["Policy Advisor", "Diplomat", "Legal Analyst"], salary: "$75,000–$105,000", demand: "Proximity to the UN and global NGOs provides unique career launchpads." },
                        { title: "Biomedical Engineering (BS)", duration: "4 Years", desc: "Combines engineering, medicine, and biotechnology for healthcare innovation and scientific research.", careers: ["Biotech Engineer", "Pharma Researcher", "MedTech Entrepreneur"], salary: "$95,000–$125,000", demand: "New York's growing life-sciences sector is rapidly absorbing biomedical engineering talent." },
                        { title: "Journalism (BA)", duration: "4 Years", desc: "Strong media, communication, and reporting foundation with direct exposure to major journalism networks.", careers: ["Journalist", "Media Strategist", "Editor"], salary: "$65,000–$90,000", demand: "Digital media and investigative journalism remain vital in the current information economy." },
                        { title: "Applied Mathematics (BA/BS)", duration: "4 Years", desc: "Advanced mathematical modeling, statistics, data analysis, and computation.", careers: ["Actuary", "Data Scientist", "Quantitative Analyst"], salary: "$110,000–$145,000", demand: "Essential skills for fintech, AI modeling, and algorithmic trading sectors." },
                        { title: "Psychology (BA)", duration: "4 Years", desc: "Covers neuroscience, cognition, behavior, mental health, and psychological research methods.", careers: ["Clinical Researcher", "UX Researcher", "HR Strategist"], salary: "$70,000–$95,000", demand: "High demand in organizational psychology and user-experience design within tech." },
                        { title: "Mechanical Engineering (BS)", duration: "4 Years", desc: "Focuses on robotics, mechanics, energy systems, automation, and modern engineering technologies.", careers: ["Robotics Engineer", "Systems Designer", "Energy Consultant"], salary: "$95,000–$120,000", demand: "Steady growth supported by automation and green energy infrastructure projects." }
                    ],
                    masters: [
                        { title: "MBA – Columbia Business School", duration: "2 Years", desc: "Elite MBA program with strong placement in finance, consulting, entrepreneurship, and global business leadership.", careers: ["Investment Banker", "Management Consultant", "Corporate Executive"], salary: "$175,000 base", demand: "Columbia MBAs are heavily recruited by top-tier consulting and private equity firms globally." },
                        { title: "MS in Computer Science", duration: "2 Years", desc: "Advanced computing program focused on AI, machine learning, systems, and data science.", careers: ["Senior AI Engineer", "Software Architect", "Tech Lead"], salary: "$145,000–$180,000", demand: "The NYC tech ecosystem fiercely competes for advanced computer science talent." },
                        { title: "Master of International Affairs (MIA)", duration: "2 Years", desc: "Prestigious international affairs program covering diplomacy, economics, global policy, and security studies.", careers: ["Diplomat", "Global Risk Analyst", "NGO Director"], salary: "$90,000–$130,000", demand: "Increasing geopolitical complexity drives demand for international risk and policy experts." },
                        { title: "Juris Doctor (JD) – Columbia Law School", duration: "3 Years", desc: "Top-tier law degree with strengths in corporate law, constitutional law, and international legal studies.", careers: ["Corporate Lawyer", "Litigator", "Policy Advocate"], salary: "$225,000 (Big Law)", demand: "Columbia Law graduates have unparalleled access to elite global law firms." },
                        { title: "MD – Vagelos College of Physicians and Surgeons", duration: "4 Years", desc: "Globally recognized medical education program with major clinical and biomedical research opportunities.", careers: ["Physician", "Surgeon", "Medical Researcher"], salary: "$200,000–$400,000+", demand: "Healthcare demands ensure excellent long-term stability and compensation." },
                        { title: "MS in Climate Science and Policy", duration: "2 Years", desc: "STEM-designated climate program combining environmental science, sustainability, policy, and technology.", careers: ["Sustainability Director", "Climate Tech Founder", "Environmental Policy Advisor"], salary: "$95,000–$135,000", demand: "ESG mandates and climate-tech investments are creating entirely new corporate verticals." }
                    ],
                    scholarships: [
                        { title: "Columbia Need-Based Financial Aid", amount: "Full demonstrated financial need coverage", eligibility: "Undergraduate students with demonstrated financial need", desc: "Undergraduate students with demonstrated financial need." },
                        { title: "Columbia No-Loan Policy", amount: "Replaces loans with grants in aid packages", eligibility: "Eligible undergraduate students", desc: "Eligible undergraduate students." },
                        { title: "Columbia First-Year Transition Grant", amount: "$2,000", eligibility: "First-year students from low-income households", desc: "First-year students from low-income households." },
                        { title: "Columbia Business School Fellowships", amount: "$10,000–$30,000", eligibility: "Exceptional MBA applicants based on merit and leadership", desc: "Exceptional MBA applicants based on merit and leadership." },
                        { title: "Bridge to Opportunity Scholarship", amount: "Full 3-year tuition coverage", eligibility: "Select first-generation Columbia Law students", desc: "Select first-generation Columbia Law students." },
                        { title: "International Student Financial Aid", amount: "Need-based institutional support", eligibility: "International undergraduate students", desc: "International undergraduate students." }
                    ]
                },
                yale: {
                    name: "Yale University", shortName: "Yale", cityId: "new_haven",
                    cityName: "New Haven, CT", rank: "21", tuition: "$69,900",
                    heroImage: "https://images.pexels.com/photos/34571466/pexels-photo-34571466.jpeg",
                    overview: "Yale University is one of the world’s most prestigious Ivy League institutions, located in New Haven, Connecticut. Known for its world-class liberal arts education, elite law and medical schools, global research impact, and highly selective admissions, Yale combines academic rigor with exceptional student support. The university is especially recognized for strengths in law, political science, economics, medicine, global affairs, humanities, and emerging scientific research in biotechnology and artificial intelligence.",
                    quickFacts: ["• QS World Rank: #21 Globally", "• Acceptance Rate: ~4%", "• Location: New Haven, Connecticut", "• Founded: 1701", "• Ivy League Institution", "• Undergraduate Financial Aid Expanded for 2026–27", "• Families Under $100,000 Pay $0 Parent Share", "• Full Tuition for Many Families Under $200,000", "• Known For: Law, Medicine, Political Science, Economics, Humanities"],
                    financialReqs: "Yale University offers one of the strongest need-based financial aid systems in the United States. For the 2026–27 academic year, families earning under $100,000 with typical assets receive a zero parent contribution, while many families earning under $200,000 qualify for full tuition scholarships. Yale meets 100% of demonstrated financial need and includes support for housing, meals, travel, hospitalization insurance, and a $2,000 start-up grant for eligible students.",
                    admissionRequirements: [
                        "Acceptance Rate: 3.7% (Class of 2028) — historic low",
                        "Restrictive Early Action Deadline: November 1 — non-binding but restricts other early applications",
                        "Regular Decision Deadline: January 2",
                        "Required Tests: Test-optional policy active — but strong scores still strengthen applications",
                        "English Requirement: TOEFL 100+ or IELTS 7.0+ — no minimum but competitive applicants score higher",
                        "Application Portal: Common App or QuestBridge",
                        "Interviews: Offered through Yale Alumni Schools Committee in most countries",
                        "Note: Yale is need-blind for US students. International students are need-aware. Yale meets 100% of demonstrated need with zero loans for all admitted students."
                    ],
                    applicationDeadlines: [
                        "Single-Choice Early Action (SCEA) Deadline: November 1 — non-binding, but you may not apply Early Decision or Early Action to other private US universities. Decisions released mid-December",
                        "Regular Decision Deadline: January 2 — main application round, decisions released in late March / early April",
                        "Financial Aid Deadline (SCEA): November 1 — submit CSS Profile, FAFSA (US citizens), and supporting documents to receive aid notification with your admissions decision",
                        "Financial Aid Deadline (RD): February 15 — required to receive aid notification with your March admissions decision",
                        "QuestBridge National College Match Deadline: Match deadline in late September with binding match by early December — Yale is a QuestBridge partner",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline",
                        "Transfer Application Deadline: March 1 — Yale typically admits around 20–30 transfer students per cycle (very competitive)",
                        "Eli Whitney (non-traditional) Students Program Deadline: Different timeline — March 1 for Fall enrolment, for students with significant time away from formal education",
                        "Yale School of Management (MBA) Deadlines: Three rounds — Round 1 mid-September, Round 2 early January, Round 3 mid-April",
                        "Best Time to Apply: Apply SCEA (November 1) if Yale is your clear first choice and your application is rock-solid by late October — SCEA acceptance rate (~9%) is meaningfully higher than RD (~3.5%); apply RD if you need more time to strengthen testing or essays",
                        "Application Opens: Common Application opens early August; QuestBridge application opens August 1"
                    ],
                    bachelors: [
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Covers artificial intelligence, machine learning, algorithms, software systems, cybersecurity, and advanced computing.", careers: ["Software Engineer", "AI Researcher", "Tech Product Manager"], salary: "$130,000–$165,000", demand: "High demand across tech hubs; Yale's liberal arts integration produces well-rounded tech leaders." },
                        { title: "Economics (BA)", duration: "4 Years", desc: "Highly respected economics program focused on quantitative analysis, finance, policy, and global markets.", careers: ["Investment Banker", "Economic Consultant", "Financial Analyst"], salary: "$110,000–$145,000", demand: "A premier pipeline to Wall Street, global consulting, and top PhD programs." },
                        { title: "Political Science (BA)", duration: "4 Years", desc: "Focuses on governance, diplomacy, political theory, international relations, and public policy.", careers: ["Policy Analyst", "Diplomat", "Lawyer (Pre-Law)"], salary: "$70,000–$105,000", demand: "Yale's extensive political alumni network offers unmatched opportunities in government and NGOs." },
                        { title: "Biomedical Engineering (BS)", duration: "4 Years", desc: "Combines medicine, engineering, and biotechnology for healthcare innovation and scientific research.", careers: ["Biotech Engineer", "Medical Researcher", "Physician (Pre-Med)"], salary: "$90,000–$120,000", demand: "Rapid innovation in medical devices and therapeutics sustains high demand for bioengineers." },
                        { title: "Global Affairs (BA)", duration: "4 Years", desc: "Interdisciplinary program covering international politics, economics, diplomacy, and global development.", careers: ["Foreign Service Officer", "Global Risk Analyst", "NGO Leader"], salary: "$75,000–$115,000", demand: "Essential skills for navigating an increasingly complex global economic and political landscape." },
                        { title: "Psychology (BA)", duration: "4 Years", desc: "Covers cognition, neuroscience, behavior, mental health, and experimental psychology research.", careers: ["Clinical Psychologist", "Behavioral Scientist", "Market Researcher"], salary: "$65,000–$90,000", demand: "Growing focus on mental health and behavioral economics fuels consistent job growth." },
                        { title: "Applied Mathematics (BS)", duration: "4 Years", desc: "Advanced mathematics program emphasizing statistics, modeling, data analysis, and computational problem-solving.", careers: ["Data Scientist", "Actuary", "Quantitative Analyst"], salary: "$105,000–$140,000", demand: "Mathematical modeling is increasingly vital in finance, tech, and strategic consulting." },
                        { title: "History (BA)", duration: "4 Years", desc: "Explores global historical developments, political movements, culture, and intellectual history.", careers: ["Historian", "Author/Journalist", "Lawyer (Pre-Law)"], salary: "$60,000–$85,000", demand: "Valued for exceptional research, writing, and analytical skills in media and law." }
                    ],
                    masters: [
                        { title: "MBA – Yale School of Management", duration: "2 Years", desc: "Elite MBA program focused on leadership, consulting, finance, entrepreneurship, and global business.", careers: ["Management Consultant", "Nonprofit Executive", "Investment Banker"], salary: "$160,000 base", demand: "Unique focus on both corporate and social-sector leadership makes Yale MBAs highly adaptable." },
                        { title: "JD – Yale Law School", duration: "3 Years", desc: "One of the world’s top law programs known for constitutional law, public policy, and legal scholarship.", careers: ["Supreme Court Clerk", "Legal Scholar", "Public Interest Lawyer"], salary: "$225,000 (Big Law)", demand: "Yale Law is widely considered the #1 law school in the country, guaranteeing elite career options." },
                        { title: "MD – Yale School of Medicine", duration: "4 Years", desc: "Prestigious medical program emphasizing research, innovation, and the unique Yale System of medical education.", careers: ["Physician", "Medical Director", "Clinical Researcher"], salary: "$200,000–$400,000+", demand: "The Yale System fosters independent thinkers, highly sought after for chief resident positions." },
                        { title: "Master of Global Affairs", duration: "2 Years", desc: "Advanced international affairs program focused on diplomacy, global security, economics, and policy.", careers: ["Diplomat", "Intelligence Analyst", "Global Strategist"], salary: "$90,000–$130,000", demand: "Strong demand in international organizations, government intelligence, and global corporations." },
                        { title: "MS in Computer Science", duration: "2 Years", desc: "Advanced computing program covering AI, machine learning, systems, and software engineering.", careers: ["Senior AI Developer", "Systems Architect", "Tech Entrepreneur"], salary: "$135,000–$170,000", demand: "Tech companies actively recruit Yale CS grads for their blend of technical and critical thinking skills." },
                        { title: "Master of Public Health (MPH)", duration: "2 Years", desc: "Focuses on epidemiology, healthcare systems, global health, and public health leadership.", careers: ["Epidemiologist", "Health Policy Director", "Global Health Consultant"], salary: "$85,000–$120,000", demand: "Public health infrastructure expansion ensures steady growth for policy and epidemiology experts." },
                        { title: "Master of Environmental Management", duration: "2 Years", desc: "Interdisciplinary environmental program covering sustainability, climate science, and ecological policy.", careers: ["Sustainability Director", "Climate Policy Analyst", "Conservation Leader"], salary: "$85,000–$125,000", demand: "Corporate ESG mandates and climate change mitigation are driving a boom in environmental jobs." }
                    ],
                    scholarships: [
                        { title: "Yale Need-Based Financial Aid", amount: "Covers 100% of demonstrated financial need", eligibility: "All admitted undergraduate students based on financial need", desc: "All admitted undergraduate students based on financial need." },
                        { title: "Zero Parent Share Policy", amount: "Full support with $0 parent contribution", eligibility: "Families earning under $100,000 with typical assets", desc: "Families earning under $100,000 with typical assets." },
                        { title: "Yale Full Tuition Scholarship", amount: "Full tuition coverage", eligibility: "Many families earning under $200,000 annually", desc: "Many families earning up to $200,000 annually." },
                        { title: "Yale Start-Up Grant", amount: "$2,000", eligibility: "Eligible low-income undergraduate students", desc: "Eligible low-income undergraduate students." },
                        { title: "Hurst Horizon Scholarship – Yale Law School", amount: "Full tuition, fees, and hospitalization coverage", eligibility: "Select Yale Law students with highest demonstrated need", desc: "Select Yale Law students with highest demonstrated need." },
                        { title: "Yale School of Medicine Loan Reduction Program", amount: "Student loans capped at $10,000 annually", eligibility: "Qualified Yale MD students receiving need-based aid", desc: "Qualified Yale MD students receiving need-based aid." },
                        { title: "Yale AM Fellowships", amount: "Merit and leadership-based scholarship support", eligibility: "Exceptional MBA applicants", desc: "Exceptional MBA applicants." }
                    ]
                },
                upenn: {
                    name: "University of Pennsylvania", shortName: "Penn", cityId: "philadelphia",
                    cityName: "Philadelphia, PA", rank: "15", tuition: "$63,204 / $94,582 Total COA",
                    heroImage: "https://res.klook.com/image/upload/fl_lossy.progressive,q_60/Mobile/City/egryl5rowwktik0we245.jpg",
                    overview: "The University of Pennsylvania is a world-renowned Ivy League research university located in Philadelphia, Pennsylvania. Known for combining liberal arts education with professional and interdisciplinary studies, Penn offers exceptional opportunities in business, engineering, medicine, law, artificial intelligence, and entrepreneurship. Through programs like Penn Forward and major investments in AI, healthcare, and innovation, Penn continues to lead globally in research, startup culture, and academic excellence. Students benefit from strong industry connections, global programs, and one of the most powerful alumni networks in the world.",
                    quickFacts: ["QS World Rank: #15 globally", "Acceptance Rate: ~5%", "Campus Location: Philadelphia, Pennsylvania", "Undergraduate Enrollment: 10,000+", "Total Schools: 12", "Founded: 1740", "First U.S. Business School: Wharton School (1881)", "Endowment: $22+ Billion", "Known For: Business, Medicine, AI, Engineering, Economics, Law"],
                    financialReqs: "Penn follows a grant-based no-loan financial aid policy and meets 100% of demonstrated financial need for admitted undergraduate students. For 2026–27, total undergraduate cost of attendance for on-campus students is estimated at approximately $99,082 per year including tuition, housing, dining, fees, books, and personal expenses. Through the Quaker Commitment, families earning under $75,000 typically pay nothing for tuition, housing, or dining, while many families earning under $200,000 qualify for full tuition support.",
                    admissionRequirements: [
                        "Acceptance Rate: 5.7% (Class of 2028)",
                        "Early Decision Deadline: November 1 — binding. ED acceptance rate significantly higher at approximately 14%",
                        "Regular Decision Deadline: January 5",
                        "Required Tests: Test-optional policy active for 2025-2026 — Wharton applicants strongly encouraged to submit scores",
                        "English Requirement: TOEFL 100+ or IELTS 7.5+ for international applicants",
                        "Application Portal: Common App only",
                        "Interviews: Alumni interviews available in select regions",
                        "Note: Penn is need-blind for US citizens. International applicants are need-aware. Penn meets 100% of demonstrated financial need for all admitted students with no loans."
                    ],
                    applicationDeadlines: [
                        "Early Decision Deadline: November 1 (11:59 pm applicant's local time) — binding; if admitted you must enrol at Penn and withdraw all other applications. Decisions released mid-December",
                        "Regular Decision Deadline: January 5 — main non-binding round, decisions released in late March",
                        "Financial Aid Deadline (ED): November 6 — CSS Profile and IDOC documents must be submitted to receive an aid notification alongside your December admissions decision",
                        "Financial Aid Deadline (RD): February 1 — required to finalise your aid package",
                        "Coordinated Dual Degree / Specialized Programs (Huntsman, M&T, LSM, NHCM, VIPER, DMD): Same November 1 ED / January 5 RD deadlines, but applications include additional programme-specific essays and components — start at least 6 weeks earlier",
                        "QuestBridge National College Match: Penn is a QuestBridge partner — Finalists may apply via QuestBridge in early September with December match notification",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline (ED admits commit immediately)",
                        "Transfer Application Deadline: March 15 — Penn admits around 200 transfer students each year, primarily for Fall enrolment",
                        "Wharton MBA Deadlines: Three rounds — Round 1 early September, Round 2 early January, Round 3 early April; Round 1 strongly preferred for international applicants needing visa processing time",
                        "Best Time to Apply: Apply ED (November 1) if Penn is your unambiguous top choice — ED acceptance rate (~14%) is more than double the RD rate (~4%); apply RD if you want to compare financial aid offers across multiple schools",
                        "Application Opens: Common Application opens August 1; Penn-specific essays usually posted in early August"
                    ],
                    bachelors: [
                        { title: "Economics (BA)", duration: "4 Years", desc: "Strong quantitative and policy-focused economics program with research opportunities and access to Wharton courses.", careers: ["Economic Analyst", "Policy Advisor", "Consultant"], salary: "$100,000–$135,000", demand: "Offers a strong liberal arts alternative to Wharton with excellent placement in consulting and policy." },
                        { title: "Computer Science (BSE)", duration: "4 Years", desc: "Covers AI, machine learning, software systems, algorithms, cybersecurity, and advanced computing research.", careers: ["Software Engineer", "AI Developer", "Cybersecurity Analyst"], salary: "$130,000–$165,000", demand: "Penn's interdisciplinary focus produces highly adaptable engineers in strong demand across tech." },
                        { title: "Business (Wharton BS in Economics)", duration: "4 Years", desc: "Elite undergraduate business education with concentrations in finance, entrepreneurship, analytics, and management.", careers: ["Investment Banker", "Private Equity Analyst", "Founder"], salary: "$120,000–$160,000", demand: "Wharton is arguably the most prestigious undergraduate business degree in the world, with unmatched recruitment." },
                        { title: "Bioengineering (BSE)", duration: "4 Years", desc: "Interdisciplinary engineering program combining biology, medicine, computation, and healthcare innovation.", careers: ["Biotech Engineer", "Healthcare Tech Founder", "Medical Researcher"], salary: "$95,000–$125,000", demand: "Penn's proximity to top medical centers makes its bioengineering graduates highly sought after." },
                        { title: "Political Science (BA)", duration: "4 Years", desc: "Focuses on international relations, public policy, governance, law, and political theory.", careers: ["Political Consultant", "Lawyer (Pre-Law)", "Campaign Manager"], salary: "$70,000–$100,000", demand: "Steady demand for strategic political analysis and legal preparation." },
                        { title: "Nursing (BSN)", duration: "4 Years", desc: "One of the top nursing programs globally with strong clinical training and research integration.", careers: ["Registered Nurse", "Nurse Practitioner", "Healthcare Administrator"], salary: "$85,000–$110,000", demand: "Critical shortages in healthcare professionals ensure 100% placement and high starting salaries." },
                        { title: "Mechanical Engineering (BSE)", duration: "4 Years", desc: "Covers robotics, energy systems, mechanics, manufacturing, and computational engineering.", careers: ["Robotics Engineer", "Product Designer", "Aerospace Engineer"], salary: "$95,000–$125,000", demand: "Automation and sustainable manufacturing are driving strong, consistent demand." },
                        { title: "Cognitive Science (BA)", duration: "4 Years", desc: "Combines psychology, neuroscience, linguistics, philosophy, and artificial intelligence.", careers: ["AI Ethicist", "UX Researcher", "Behavioral Scientist"], salary: "$85,000–$115,000", demand: "Crucial for tech companies building human-centric AI and intuitive software interfaces." }
                    ],
                    masters: [
                        { title: "MBA – Wharton School", duration: "2 Years", desc: "Globally elite MBA program known for finance, consulting, entrepreneurship, analytics, and leadership development.", careers: ["C-Suite Executive", "Hedge Fund Manager", "Strategy Consultant"], salary: "$175,000 base + high bonus", demand: "Wharton MBAs command premium salaries and dominate the global finance and consulting sectors." },
                        { title: "Master of Contemporary and Information Technology (MCIT)", duration: "2 Years", desc: "Graduate computer science program designed for students from non-CS backgrounds entering the tech industry.", careers: ["Software Developer", "Tech Product Manager", "Data Analyst"], salary: "$120,000–$150,000", demand: "A unique and highly successful pipeline for transitioning professionals into lucrative tech roles." },
                        { title: "Master of Science in Engineering (MSE)", duration: "2 Years", desc: "Advanced engineering and research-focused master’s program across multiple specializations.", careers: ["Senior Engineer", "R&D Manager", "Systems Architect"], salary: "$120,000–$160,000", demand: "High demand in specialized tech sectors, robotics, and advanced manufacturing." },
                        { title: "Master of Public Health (MPH)", duration: "2 Years", desc: "Focuses on epidemiology, healthcare systems, global health, and public health leadership.", careers: ["Public Health Director", "Epidemiologist", "Healthcare Consultant"], salary: "$85,000–$125,000", demand: "Global health initiatives and domestic healthcare infrastructure require advanced MPH expertise." },
                        { title: "JD – Penn Carey Law", duration: "3 Years", desc: "Prestigious law degree with interdisciplinary opportunities across business, healthcare, and public policy.", careers: ["Corporate Lawyer", "Litigator", "Policy Advocate"], salary: "$225,000 (Big Law)", demand: "Penn Law's business focus makes its graduates particularly attractive to corporate law firms." },
                        { title: "MD – Perelman School of Medicine", duration: "4 Years", desc: "One of the top medical programs in the world with major research and clinical training opportunities.", careers: ["Physician", "Specialist Surgeon", "Medical Innovator"], salary: "$200,000–$400,000+", demand: "Graduates are heavily recruited for competitive residencies and leading clinical research roles." }
                    ],
                    scholarships: [
                        { title: "Quaker Commitment", amount: "Full demonstrated financial need coverage", eligibility: "Undergraduate students with demonstrated financial need", desc: "Undergraduate students with demonstrated financial need." },
                        { title: "Penn Grant-Based Financial Aid", amount: "Average packages exceed $66,000 annually", eligibility: "Domestic and international undergraduate students", desc: "Domestic and international undergraduate students." },
                        { title: "Twenty-First Century Scholars Program", amount: "Full tuition scholarship", eligibility: "Outstanding Perelman School of Medicine students", desc: "Outstanding Perelman School of Medicine students." },
                        { title: "Wharton Fellowships", amount: "Partial to full tuition support", eligibility: "Exceptional MBA applicants based on merit and leadership", desc: "Exceptional MBA applicants based on merit and leadership." },
                        { title: "Paul and Daisy Soros Fellowship", amount: "$90,000", eligibility: "Graduate students and New Americans demonstrating exceptional achievement", desc: "Graduate students and New Americans demonstrating exceptional achievement." },
                        { title: "International Student Financial Aid", amount: "Need-based funding", eligibility: "International undergraduate students admitted with demonstrated need", desc: "International undergraduate students admitted with demonstrated need." }
                    ]
                },
                princeton: {
                    name: "Princeton University", shortName: "Princeton", cityId: "princeton_nj",
                    cityName: "Princeton, NJ", rank: "25", tuition: "$65,210",
                    heroImage: "https://www.princeton.edu//sites/default/files/images/2017/06/20060425_NassauHall_JJ_IMG_5973.jpg",
                    overview: "Princeton University is one of the most prestigious Ivy League institutions in the world, located in Princeton, New Jersey. Founded in 1746, Princeton is globally recognized for exceptional undergraduate education, world-class research, elite faculty, and its strong focus on independent academic work. The university is especially recognized for strengths in mathematics, public policy, engineering, computer science, economics, physics, and international affairs. Princeton combines rigorous academics with one of the strongest financial aid systems in the United States.",
                    quickFacts: ["• QS World Rank: #25 Globally", "• Acceptance Rate: ~4%", "• Location: Princeton, New Jersey", "• Founded: 1746", "• Ivy League Institution", "• Need-Blind Admissions for Domestic & International Students", "• 90% of Students Graduate Debt-Free", "• No-Loan Financial Aid Policy", "• Known For: Mathematics, Economics, Engineering, Public Policy, Physics"],
                    financialReqs: "Princeton University offers one of the most generous undergraduate financial aid systems in the world. The university follows a no-loan policy, meaning financial aid is provided entirely through grants that never need to be repaid. Most families earning up to $150,000 pay nothing for tuition, housing, and food, while many families earning up to $250,000 qualify for free tuition. Princeton meets 100% of demonstrated financial need for both domestic and international students.",
                    admissionRequirements: [
                        "Acceptance Rate: 4.6% (Class of 2028)",
                        "Single Choice Early Action Deadline: November 1 — non-binding but restricts other early applications",
                        "Regular Decision Deadline: January 1",
                        "Required Tests: Test-optional policy active — but Princeton notes that submitted scores are reviewed holistically",
                        "English Requirement: TOEFL 100+ or IELTS 7.0+",
                        "Application Portal: Common App or Coalition App",
                        "Interviews: Alumni interviews conducted worldwide — strongly encouraged",
                        "Note: Princeton is need-blind for ALL students including international — one of only 9 universities in the world with this policy. Princeton meets 100% of demonstrated need with zero loans ever — the first university in the world to adopt this policy in 2001."
                    ],
                    applicationDeadlines: [
                        "Single-Choice Early Action (SCEA) Deadline: November 1 (11:59 pm applicant's local time) — non-binding, but you may not apply Early Action or Early Decision to any other private US university. Decisions released mid-December",
                        "Regular Decision Deadline: January 1 (11:59 pm applicant's local time) — main application round, decisions released in late March",
                        "Financial Aid Deadline (SCEA): November 9 — submit CSS Profile, FAFSA (US citizens), and Princeton-specific aid documents to receive aid notification alongside your December decision",
                        "Financial Aid Deadline (RD): February 1 — required to receive a complete aid package with your admissions decision",
                        "Reply-By Date: May 1 — universal admitted-student commitment deadline",
                        "Transfer Application Deadline: March 1 — Princeton reactivated its transfer programme in 2018 with focus on community college, military veterans, and low-income students (~13–22 transfers admitted per cycle)",
                        "QuestBridge National College Match Deadline: Application due late September with binding match notification in early December — Princeton is a QuestBridge partner",
                        "Princeton MBA / Graduate Programs: No undergraduate business school (Princeton has no MBA); graduate programmes via Princeton Graduate School have deadlines that vary by department, typically December 1 – January 15",
                        "Alumni Interview Window: October through February — interviews offered worldwide but not all applicants receive them; not granted is NOT a negative signal",
                        "Best Time to Apply: Apply SCEA (November 1) if Princeton is your clear first choice — SCEA acceptance rate (~14%) is roughly three times the RD rate (~4.5%); Princeton's need-blind policy applies regardless of round, so financial considerations do not require waiting for RD",
                        "Application Opens: Common Application opens August 1; Coalition Application (powered by Scoir) opens August 15"
                    ],
                    bachelors: [
                        { title: "Computer Science (BSE/AB)", duration: "4 Years", desc: "Covers artificial intelligence, software systems, machine learning, algorithms, and advanced computing.", careers: ["Software Engineer", "Machine Learning Quant", "Tech Founder"], salary: "$140,000–$180,000", demand: "Princeton CS grads are highly prized for their deep mathematical and theoretical foundations." },
                        { title: "Economics (AB)", duration: "4 Years", desc: "Elite economics program focused on quantitative analysis, finance, policy, and global markets.", careers: ["Investment Banker", "Quantitative Analyst", "Management Consultant"], salary: "$115,000–$155,000", demand: "A premier feeder program for Wall Street, hedge funds, and top-tier management consulting." },
                        { title: "Public Policy (SPIA)", duration: "4 Years", desc: "Interdisciplinary policy program focused on governance, economics, international affairs, and political systems.", careers: ["Policy Analyst", "Diplomat", "Nonprofit Executive"], salary: "$75,000–$110,000", demand: "SPIA produces leaders deeply sought after by government, NGOs, and global policy institutes." },
                        { title: "Mechanical & Aerospace Engineering (BSE)", duration: "4 Years", desc: "Engineering program covering robotics, aerospace systems, mechanics, energy systems, and design.", careers: ["Aerospace Engineer", "Robotics Designer", "Energy Tech Innovator"], salary: "$100,000–$130,000", demand: "Strong demand driven by commercial space exploration and advanced automation." },
                        { title: "Mathematics (AB)", duration: "4 Years", desc: "Advanced mathematics program emphasizing theoretical analysis, modeling, and quantitative reasoning.", careers: ["Cryptographer", "Actuary", "Data Scientist"], salary: "$110,000–$160,000", demand: "Princeton math majors are fiercely recruited for high-frequency trading and cybersecurity." },
                        { title: "Physics (AB)", duration: "4 Years", desc: "Research-focused physics program covering quantum mechanics, astrophysics, and advanced scientific theory.", careers: ["Quantum Researcher", "Data Analyst", "Astrophysicist"], salary: "$95,000–$135,000", demand: "Quantum computing and complex data modeling have made physics majors highly valuable in tech." }
                    ],
                    masters: [
                        { title: "Master in Public Affairs (MPA) – SPIA", duration: "2 Years", desc: "Prestigious policy and leadership program focused on governance, economics, diplomacy, and public administration.", careers: ["Senior Policy Advisor", "Government Director", "NGO Leader"], salary: "$95,000–$140,000", demand: "SPIA MPP graduates fast-track into high-level domestic and international government roles." },
                        { title: "Master in Public Policy (MPP) – SPIA", duration: "2 Years", desc: "Advanced policy program emphasizing quantitative policy analysis, global affairs, and economic strategy.", careers: ["Policy Strategist", "Think Tank Director", "Economic Analyst"], salary: "$95,000–$135,000", demand: "Data-driven policy experts are increasingly essential in both public and private sectors." },
                        { title: "MS in Computer Science", duration: "2 Years", desc: "Advanced computing program covering AI, machine learning, systems, and software engineering.", careers: ["Senior AI Engineer", "Tech Lead", "Data Architect"], salary: "$145,000–$185,000", demand: "High demand in Silicon Valley and NYC tech hubs for elite algorithmic engineering talent." },
                        { title: "MEng in Electrical & Computer Engineering", duration: "2 Years", desc: "Engineering-focused graduate program in electronics, AI systems, computing, and hardware technologies.", careers: ["Hardware Architect", "Semiconductor Engineer", "Systems Director"], salary: "$130,000–$170,000", demand: "Critical demand in AI hardware acceleration and next-generation telecommunications." },
                        { title: "Master in Architecture (M.Arch.)", duration: "3 Years", desc: "Professional architecture program focused on design, sustainability, urban systems, and spatial innovation.", careers: ["Lead Architect", "Urban Designer", "Sustainability Consultant"], salary: "$85,000–$120,000", demand: "Sustainable and smart-city design are driving growth in advanced architecture roles." },
                        { title: "Master in Finance", duration: "2 Years", desc: "Quantitative finance and investment-focused graduate program emphasizing analytics and financial systems.", careers: ["Quantitative Trader", "Risk Manager", "Portfolio Director"], salary: "$150,000–$200,000+", demand: "Princeton's finance master's is one of the most elite pipelines to high-finance quantitative roles." },
                        { title: "PhD Programs", duration: "Varies", desc: "Fully funded doctoral programs across sciences, engineering, humanities, economics, mathematics, and public policy.", careers: ["University Professor", "Senior Researcher", "Industry Specialist"], salary: "$100,000–$160,000", demand: "Princeton PhDs are universally recognized for academic and high-level industry research." }
                    ],
                    scholarships: [
                        { title: "Princeton No-Loan Financial Aid", amount: "Covers 100% demonstrated financial need through grants", eligibility: "All admitted undergraduate students based on financial need", desc: "All admitted undergraduate students based on financial need." },
                        { title: "Full Cost Coverage Program", amount: "Tuition, housing, and food fully covered", eligibility: "Most families earning up to $150,000 annually", desc: "Most families earning up to $150,000 annually." },
                        { title: "Princeton Free Tuition Initiative", amount: "Full tuition coverage", eligibility: "Many families earning up to $250,000 annually", desc: "Many families earning up to $250,000 annually." },
                        { title: "International Student Need-Based Aid", amount: "Full demonstrated financial need coverage", eligibility: "International undergraduate students admitted to Princeton", desc: "International undergraduate students admitted to Princeton." },
                        { title: "Princeton Graduate Fellowship Support", amount: "Full tuition, health coverage, and stipend", eligibility: "Eligible Princeton PhD students", desc: "Eligible Princeton PhD students." },
                        { title: "SPIA Graduate Funding Program", amount: "Full tuition and living stipend support", eligibility: "Selected students in Princeton SPIA graduate programs", desc: "Selected students in Princeton SPIA graduate programs." },
                        { title: "Engineering & Research Assistantships", amount: "Tuition support and research funding", eligibility: "Graduate engineering and research students", desc: "Graduate engineering and research students." }
                    ]
                },
                uchicago: {
                    name: "University of Chicago", shortName: "UChicago", cityId: "chicago",
                    cityName: "Chicago, IL", rank: "13", tuition: "$71,325",
                    heroImage: "https://images.trvl-media.com/place/6064081/ed547d2b-1357-42b3-840a-f88661f7db9c.jpg",
                    overview: "The University of Chicago is one of the world’s leading private research universities, located in Hyde Park, Chicago. Known for its rigorous Core Curriculum, Nobel Prize-winning faculty, and strong focus on critical thinking, the university offers students an intense academic environment with exceptional opportunities in economics, computer science, public policy, business, and scientific research. UChicago combines historic collegiate architecture with modern innovation, giving students access to world-class academics, research institutes, internships, and global career opportunities.",
                    quickFacts: ["• QS World Rank: #13 globally", "• Acceptance Rate: ~5%", "• Nobel Laureates Associated: 100+", "• Campus Location: Hyde Park, Chicago", "• Undergraduate Tuition (2025–26): $71,325", "• Residential Houses: 48"],
                    financialReqs: "Undergraduate tuition for 2025–2026 is $71,325 per year, with total annual cost of attendance reaching approximately $98,301 including housing, meals, books, and personal expenses. The university offers major need-based financial aid through its No Barriers program and expanded free tuition initiatives for qualifying families.",
                    admissionRequirements: [
                        "Acceptance Rate: 5.4% (Class of 2028)",
                        "Early Action Deadline: November 1 — non-binding",
                        "Early Decision Deadline: November 1 — binding, higher acceptance rate",
                        "Regular Decision Deadline: January 2",
                        "Required Tests: Test-optional policy active — UChicago was the first major research university to go test-optional in 2018",
                        "English Requirement: TOEFL 104+ or IELTS 7.0+ for international applicants",
                        "Application Portal: Common App or Coalition App",
                        "Famous Note: UChicago essay prompts are legendary for their creativity and depth — past prompts include 'Find x' and 'What is square one and can you actually get back to it'",
                        "Note: UChicago is need-blind for US students and meets 100% of demonstrated need. International students are need-aware but substantial merit and need-based aid is available."
                    ],
                    applicationDeadlines: [
                        "Early Action (EA) Deadline: November 3 — non-binding; you may apply Early Action to multiple schools (subject to each school's rules) and still receive a UChicago decision in mid-December",
                        "Early Decision I (ED I) Deadline: November 3 — binding; if admitted you must enrol at UChicago and withdraw all other applications. Decisions released mid-December",
                        "Early Decision II (ED II) Deadline: January 5 — binding second-chance round for students who decide on UChicago after the November round. Decisions released mid-February",
                        "Regular Decision (RD) Deadline: January 5 — main non-binding round, decisions released in late March",
                        "Financial Aid Deadlines: November 15 for EA and ED I, January 15 for ED II, February 15 for RD — submit CSS Profile and IDOC documents",
                        "ED I Enrolment Confirmation: Mid-January following December admission",
                        "EA Reply-By Date: May 1 — non-binding, so admitted EA students have until the universal deposit date",
                        "Transfer Application Deadlines: March 1 — Transfer Early Decision (binding) and Transfer Rolling Decision priority deadline; transfer rolling submissions accepted until June 1",
                        "Summer Session Early Notification (SSEN): For students who completed a UChicago pre-college programme — submit an Early Decision application September 1 through October 15 for a decision before November 1",
                        "QuestBridge National College Match: UChicago is a QuestBridge partner — QuestBridge Finalists select EA option in their UChicago account",
                        "Best Time to Apply: Apply ED I (November 3) if UChicago is your unambiguous top choice and you don't need to compare aid offers — ED has the highest acceptance rate; apply EA (November 3) if you want an early answer without binding commitment; apply ED II (January 5) if you become certain about UChicago later in the cycle",
                        "Application Opens: Common Application opens August 1; Coalition Application opens August 15"
                    ],
                    bachelors: [
                        { title: "Economics (BA)", duration: "4 Years", desc: "One of the university’s strongest programs, focusing on economic theory, data analysis, policy, finance, and quantitative research.", careers: ["Economic Analyst", "Investment Banker", "Management Consultant"], salary: "$110,000–$150,000", demand: "UChicago Economics is historically legendary, guaranteeing elite placement in global finance." },
                        { title: "Computer Science (BS)", duration: "4 Years", desc: "Covers programming, AI, machine learning, systems, algorithms, and advanced computational theory.", careers: ["Software Engineer", "Data Scientist", "Quantitative Developer"], salary: "$130,000–$170,000", demand: "Combines UChicago's intense analytical rigor with highly practical software engineering skills." },
                        { title: "Biological Sciences (BS)", duration: "4 Years", desc: "Research-focused biology program with strong preparation in genetics, neuroscience, molecular biology, and medicine.", careers: ["Biomedical Researcher", "Geneticist", "Physician (Pre-Med)"], salary: "$85,000–$115,000", demand: "Strong biotech and medical research fields continue to expand alongside healthcare innovation." },
                        { title: "Mathematics (BS)", duration: "4 Years", desc: "Intensive mathematics curriculum covering calculus, proofs, statistics, abstract algebra, and applied mathematics.", careers: ["Actuary", "Cryptographer", "Financial Modeler"], salary: "$105,000–$145,000", demand: "Data-heavy industries heavily favor UChicago's deep theoretical mathematics approach." },
                        { title: "Public Policy Studies (BA)", duration: "4 Years", desc: "Interdisciplinary program combining economics, political science, statistics, and public policy analysis.", careers: ["Policy Analyst", "Urban Planner", "Nonprofit Executive"], salary: "$75,000–$105,000", demand: "Consistent demand for analytically trained policy experts in both government and tech policy." },
                        { title: "Physics (BS)", duration: "4 Years", desc: "Advanced study in theoretical physics, quantum mechanics, astrophysics, and experimental research.", careers: ["Research Scientist", "Data Analyst", "Quantum Engineer"], salary: "$90,000–$130,000", demand: "Transitioning smoothly from academia to data-heavy tech roles, physics majors are in high demand." }
                    ],
                    masters: [
                        { title: "MBA – Booth School of Business", duration: "2 Years", desc: "Elite MBA program known for finance, consulting, entrepreneurship, leadership, and analytical business education.", careers: ["Strategy Consultant", "Private Equity Executive", "C-Suite Leader"], salary: "$175,000 base", demand: "Booth is globally recognized for producing elite, data-driven business leaders." },
                        { title: "MS in Computer Science", duration: "1–2 Years", desc: "Graduate-level program specializing in AI, machine learning, systems engineering, and data-intensive computing.", careers: ["AI Researcher", "Software Architect", "Tech Entrepreneur"], salary: "$140,000–$180,000", demand: "High demand across the tech industry for advanced machine learning and systems expertise." },
                        { title: "Master of Public Policy (MPP)", duration: "2 Years", desc: "Policy-focused graduate program emphasizing economics, statistics, governance, and data-driven decision making.", careers: ["Policy Director", "Think Tank Analyst", "Government Consultant"], salary: "$90,000–$130,000", demand: "Harris School graduates are highly sought after for their rigorous quantitative policy skills." },
                        { title: "MS in Financial Mathematics", duration: "15 Months", desc: "Quantitative finance program combining mathematics, statistics, economics, and computational finance.", careers: ["Quantitative Analyst", "Risk Manager", "Algorithmic Trader"], salary: "$145,000–$195,000", demand: "Chicago's strong trading industry heavily recruits from this elite quantitative program." },
                        { title: "Master of Arts Program in Social Sciences (MAPSS)", duration: "1 Year", desc: "Interdisciplinary social sciences master’s program with flexible academic specialization and research opportunities.", careers: ["Research Director", "UX Researcher", "Academic (Pre-PhD)"], salary: "$75,000–$110,000", demand: "Provides a unique pathway to elite PhD programs and specialized behavioral research roles." },
                        { title: "MS in Climate and Energy Policy", duration: "1 Year", desc: "Advanced program focused on sustainability, climate policy, clean energy systems, and environmental economics.", careers: ["Climate Policy Advisor", "Sustainability Consultant", "Energy Analyst"], salary: "$85,000–$125,000", demand: "The global green transition has created an explosive demand for climate and energy experts." }
                    ],
                    scholarships: [
                        { title: "Odyssey Scholarship Program", amount: "Loan-free financial aid + internship support", eligibility: "Low-income and first-generation undergraduate students", desc: "Low-income and first-generation undergraduate students" },
                        { title: "No Barriers Financial Aid", amount: "Full tuition for qualifying families", eligibility: "Families meeting university income requirements", desc: "Families meeting university income requirements" },
                        { title: "Metcalf Internship Program", amount: "$5,000 internship stipend", eligibility: "Selected undergraduate students and Odyssey Scholars", desc: "Selected undergraduate students and Odyssey Scholars" },
                        { title: "Booth Merit Scholarships", amount: "Partial to full tuition coverage", eligibility: "Outstanding MBA applicants", desc: "Outstanding MBA applicants" },
                        { title: "Rubenstein Scholars Program", amount: "Full-tuition Law School scholarship", eligibility: "Exceptional JD applicants", desc: "Exceptional JD applicants" }
                    ]
                },
                // ============================================================
                // UNITED KINGDOM UNIVERSITIES — Placeholder structure entries
                // These mirror the exact USA university data structure so the
                // shared university detail page renders correctly without errors.
                // Real content will be added in a later update.
                // ============================================================
                oxford: {
                    name: "University of Oxford", shortName: "Oxford", cityId: "oxford_uk",
                    cityName: "Oxford, England", rank: "4", tuition: "£37,380 — £62,820 (International, 2026/27)",
                    heroImage: "https://images.pexels.com/photos/30660071/pexels-photo-30660071.jpeg",
                    overview: "Founded around 1096, the University of Oxford is the oldest university in the English-speaking world and the second-oldest continuously operating university globally. Located in the historic city of Oxford in Oxfordshire, England, Oxford is a collegiate public research university made up of 38 self-governing constituent colleges and 6 permanent private halls, with buildings spread throughout the city rather than on a single central campus. The university operates a distinctive tutorial system, where undergraduates receive personalised teaching in small groups (usually 1–3 students) from world-leading academics, alongside lectures and lab work. Oxford's alumni, faculty, and affiliates include 73+ Nobel Prize winners, 4 Fields Medallists, 6 Turing Award winners, 31 British Prime Ministers (including Margaret Thatcher and Theresa May), and 160 Olympic medallists. Notable alumni include Stephen Hawking, J.R.R. Tolkien, Indira Gandhi, Manmohan Singh, Albert Einstein (visiting fellow), and Malala Yousafzai. Oxford is home to the prestigious Rhodes Scholarship (founded 1902) — one of the oldest and most celebrated international postgraduate awards in the world. It is a member of the Russell Group and is consistently ranked in the global top 5 universities.",
                    quickFacts: ["Acceptance Rate: ~14–17% Overall (Undergraduate Overseas ~16.8%)", "Founded: c. 1096 (Oldest university in the English-speaking world)", "QS World Rank 2026: #4 Globally", "Constituent Colleges: 38 self-governing colleges + 6 permanent private halls", "Total Students: ~26,000+ (12,000 UG / 14,000 PG)", "International Students: From 160+ countries (~45% of student body)", "Nobel Prizes: 73+ associated with the university", "British Prime Ministers Educated: 31 (most of any university)", "Home to the Rhodes Scholarship (founded 1902 — oldest international graduate award)", "Bodleian Library: 13+ million printed items — one of the world's oldest research libraries", "Member of the Russell Group; named University of the Year for Graduate Employment by The Times"],
                    financialReqs: "International undergraduate tuition for 2026/27 entry ranges from £37,380 to £62,820 per year depending on the course — Humanities and Social Sciences (PPE, Law, History, Classics) sit at the lower end (~£37,380), Sciences (Mathematics, Computer Science) range £41,000–£47,000, Laboratory Sciences and Engineering (Chemistry, Physics, Biochemistry) range £45,000–£52,000, and Clinical Medicine reaches up to £62,820. The Oxford MBA at Saïd Business School costs approximately £88,800 for the full programme. UK Home students pay £9,790 for 2026/27 (subject to parliamentary approval). All Oxford students must pay an annual College fee in addition to university tuition — typically £8,000–£10,000 per year for international students. Oxford officially estimates living costs of £15,480–£22,080 per year for international undergraduates (covering rent, food, transport, books, and personal expenses) — most colleges guarantee accommodation for the first year, with rent £7,000–£8,500 per academic year. International tuition is capped to increase by no more than 6% or RPI inflation annually during the course. Major funding routes include the Rhodes Scholarship (fully funded), Clarendon Scholarship (full tuition + stipend), Reach Oxford Scholarship, Weidenfeld-Hoffmann, Felix, Commonwealth, and Chevening.",
                    admissionRequirements: [
                        "Acceptance Rate: ~14–17% overall; international acceptance ~16.8%; postgraduate ~30%",
                        "Application Deadline (Undergraduate): 15 October 2026 at 18:00 BST via UCAS for 2027 entry — EARLIEST major UK university deadline",
                        "Application Deadline (Postgraduate): Course-specific, with main funding rounds typically in December 2025 / early January 2026",
                        "Required Tests: Course-specific admissions tests are mandatory — e.g. LNAT (Law), TSA (PPE, E&M, HEP), PAT (Physics, Engineering), MAT (Maths, Computer Science), BMAT/UCAT (Medicine), HAT (History), CAT (Classics)",
                        "Interviews: Approximately 40% of applicants are shortlisted for interview, held in December (usually online) at the prospective college",
                        "English Requirement: IELTS Academic 7.0–7.5 overall (no element below 6.5–7.0), or TOEFL iBT 100–110 — standard vs higher level varies by course",
                        "Indian Qualifications: CISCE Class XII at 90% overall with 95%+ in four relevant subjects; CBSE A1 in four subjects including relevant ones plus A2; SAT/ACT NOT required",
                        "Application Fee: £28.50 for undergraduate (via UCAS), £75 for postgraduate; choose ONE college preference or apply as 'open application'"
                    ],
                    applicationDeadlines: [
                        "Undergraduate UCAS Deadline (2027 entry): 15 October 2026 at 18:00 UK time — Oxford's deadline is roughly three months earlier than non-Oxbridge UK universities; missing this deadline means waiting for the next cycle (no late applications)",
                        "Admissions Test Registration Deadline: Mid-September 2026 — most course-specific tests (TSA, MAT, PAT, LNAT, HAT, CAT) require advance registration at a Pearson VUE or authorised test centre, often via the applicant's school",
                        "Admissions Test Sitting Window: Late October / early November 2026 — tests are typically held within 2–3 weeks of the UCAS deadline",
                        "Shortlisting Decisions Released: Mid-to-late November 2026 — applicants notified whether they have been invited to interview",
                        "Interview Window: Early to mid-December 2026 — interviews held at the prospective Oxford college (typically online for international applicants); usually 2–3 interviews per applicant across 1–2 colleges",
                        "Offer / Rejection Decisions Released: Second week of January 2027 — all candidates notified simultaneously (offers from Oxford colleges or rejection)",
                        "Postgraduate Application Deadlines: Vary by course — most run two main funding rounds, typically early December 2026 (Round 1, recommended for scholarship consideration including Rhodes, Clarendon, Ertegun) and mid-January 2027 (Round 2)",
                        "Rhodes Scholarship Deadline: Late July to early October 2026 (varies by country constituency) — separate application with national selection committees, results released November–December 2026",
                        "Reply-By Date (Undergraduate Offers): Early May 2027 via UCAS — UK applicants reply firm / insurance; international applicants confirm in similar window",
                        "Best Time to Apply: Begin preparing in May–June 2026 — the October deadline is unmoveable, and admissions tests (registered by mid-September) require months of preparation. Strong applicants typically have personal statement drafts complete by August 2026 and book test sittings as soon as registration opens in early September",
                        "Application Opens: UCAS application opens 13 May 2026 for 2027 entry; submissions accepted from early September 2026"
                    ],
                    bachelors: [
                        { title: "BA Philosophy, Politics and Economics (PPE)", duration: "3 Years", desc: "Oxford's most iconic interdisciplinary degree, integrating philosophy, political theory and economic analysis. International tuition £43,600 per year (2026/27). Taught via the signature Oxford tutorial system with 1–3 student tutorials supplementing lectures and seminars.", careers: ["Public Policy Adviser", "Political Strategist", "Strategy Consultant"], salary: "£40,000–£65,000 starting", demand: "PPE is the historical gold-standard degree for UK politics, journalism, civil service, and policy consulting — Oxford PPE alumni include Prime Ministers, Cabinet members, and central bank governors worldwide." },
                        { title: "BA Law (Jurisprudence)", duration: "3 Years", desc: "Oxford's Qualifying Law Degree (QLD), accredited for both solicitor and barrister training pathways in England and Wales. International tuition £43,600 per year (2026/27). Tutorial-led teaching covering contract, tort, criminal, public, EU and property law.", careers: ["Magic Circle Solicitor", "Barrister", "Corporate Counsel"], salary: "£50,000–£130,000 starting (Magic Circle trainees)", demand: "Magic Circle (A&O, Clifford Chance, Freshfields, Linklaters, Slaughter and May) and US-headquartered firms in London compete intensely for Oxford Law graduates — produces one of the fastest payback periods of any UK degree." },
                        { title: "BA English Language and Literature", duration: "3 Years", desc: "Oxford's flagship humanities degree, ranked among the global top 3 for English. International tuition £43,600 per year (2026/27). Covers literature from Old English to contemporary writing, with strong emphasis on close reading, literary theory, and historical context.", careers: ["Editor / Publisher", "Academic Researcher", "Cultural Journalist"], salary: "£28,000–£42,000 starting", demand: "Strong pipeline into UK publishing, journalism, cultural institutions, and academic PhD pathways — Oxford English remains the world's most prestigious literary degree." },
                        { title: "BA Economics and Management", duration: "3 Years", desc: "Joint honours combining microeconomic and macroeconomic theory with strategic management, organisational behaviour, and finance. International tuition £43,600 per year (2026/27). One of Oxford's most competitive degrees with single-digit acceptance rates.", careers: ["Investment Banker", "Management Consultant", "Strategy Analyst"], salary: "£45,000–£75,000 starting", demand: "MBB consulting firms (McKinsey, BCG, Bain), bulge bracket investment banks, and FTSE 100 graduate schemes recruit heavily — Oxford E&M is the UK's most selective business-adjacent undergraduate degree." },
                        { title: "Bachelor of Engineering Science (BEng)", duration: "4 Years", desc: "Four-year integrated master's-level engineering programme covering mechanical, civil, electrical, chemical, and information engineering. International tuition £62,820 per year (2026/27) — Oxford's highest UG fee tier for STEM. Tutorial-based teaching with extensive lab work.", careers: ["Mechanical Engineer", "Aerospace Engineer", "R&D Engineer"], salary: "£38,000–£55,000 starting", demand: "UK aerospace, automotive, energy, and infrastructure sectors actively recruit Oxford engineering graduates — strong pipeline into Rolls-Royce, BAE Systems, McLaren, and the National Grid." },
                        { title: "BA Computer Science", duration: "3 Years", desc: "Highly mathematical computer science degree taught by Oxford's Department of Computer Science. International tuition £62,820 per year (2026/27) — top STEM tier. Covers algorithms, programming languages, AI, machine learning, computational complexity, and formal methods.", careers: ["Software Engineer", "AI / ML Engineer", "Quantitative Developer"], salary: "£48,000–£95,000 starting (London tech / quant)", demand: "Oxford CS graduates are aggressively recruited by London quant hedge funds (Jane Street, Citadel, Hudson River), big tech (Google DeepMind, Meta), and AI labs — among the highest-earning UK undergraduate degrees." },
                        { title: "Medicine BM BCh (Pre-clinical Years 1–3)", duration: "6 Years (3+3 structure)", desc: "Oxford's flagship medical degree with the unique pre-clinical / clinical split. International tuition £49,400 per year for Years 1–3 (2026/27). Heavy focus on biomedical sciences, anatomy, physiology, and biochemistry before clinical placements.", careers: ["Doctor (NHS / Private)", "Academic Clinician", "Clinical Researcher"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Oxford Medicine remains one of the most prestigious clinical degrees worldwide — strong pipeline into elite teaching hospitals, the Wellcome Trust academic clinical pathway, and global health leadership." },
                        { title: "Medicine BM BCh (Clinical Years 4–6)", duration: "6 Years (3+3 structure)", desc: "Clinical years of Oxford's medical programme, conducted at the John Radcliffe Hospital and partnered NHS trusts. International tuition rises to £65,250 per year for Years 4–6 (2026/27) — Oxford's highest fee, reflecting NHS placement and clinical training costs.", careers: ["Doctor (NHS / Private)", "Surgical Specialist", "Hospital Consultant"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Oxford-trained clinicians are sought worldwide — alumni dominate UK academic medicine and frequently move into senior NHS, WHO, and global health policy roles." },
                        { title: "MBiochem Biochemistry (Molecular and Cellular)", duration: "4 Years", desc: "Integrated four-year master's-level biochemistry degree from Oxford's Department of Biochemistry. International tuition at Oxford's STEM tier (~£45,000+ per year). Final-year independent research project leading directly to PhD pathways.", careers: ["Biomedical Researcher", "Pharmaceutical R&D Scientist", "Biotech Entrepreneur"], salary: "£32,000–£48,000 starting", demand: "The UK's biotech and life-sciences cluster — including AstraZeneca, GSK, Oxford Nanopore, and the Crick Institute — actively recruit Oxford Biochemistry graduates with research-intensive training." },
                        { title: "BFA Fine Art", duration: "3 Years", desc: "Ruskin School of Art Bachelor of Fine Arts — one of the few BFA degrees in the UK collegiate system. International tuition at Oxford's humanities tier (~£43,600 per year). Studio-based practice combined with art history and critical theory.", careers: ["Practising Artist", "Curator / Gallery Director", "Creative Director"], salary: "£25,000–£40,000 starting", demand: "Strong demand from London's contemporary art scene, major galleries (Tate, Hayward), and creative agencies — Ruskin alumni regularly exhibit at the Royal Academy and global biennales." }
                    ],
                    masters: [
                        { title: "Oxford MBA (Saïd Business School)", duration: "1 Year", desc: "Oxford's flagship Master of Business Administration, delivered at Saïd Business School. Tuition £88,800 for 2026/27 — covers academic instruction, learning resources, and lifelong Oxford Union plus Oxford Business Alumni membership. Average graduate salary exceeds £74,000.", careers: ["Strategy Consultant", "Investment Banker / Private Equity Associate", "C-Suite Executive"], salary: "£74,000+ average post-MBA (top quartile £100,000+)", demand: "Oxford MBA graduates typically recover their full programme investment within 1.5–2 years — recruited by MBB consulting, bulge bracket banks, growth-stage tech firms, and global development institutions." },
                        { title: "MSc Financial Economics", duration: "9 Months", desc: "Joint programme between Oxford's Department of Economics and Saïd Business School. Tuition £62,920 for 2026/27 — among the highest-priced non-MBA master's at Oxford. Intensive quantitative training in asset pricing, corporate finance, and econometrics.", careers: ["Investment Banker", "Quantitative Analyst", "Hedge Fund Analyst"], salary: "£60,000–£100,000+ starting (IB / Quant roles)", demand: "Oxford MFE is the UK's most selective finance master's — graduates flow directly into Goldman Sachs, JPMorgan, Morgan Stanley, and top London hedge funds with starting compensation rivalling US programmes." },
                        { title: "MSc Law and Finance", duration: "9 Months", desc: "Joint programme between Oxford's Faculty of Law and Saïd Business School. Tuition £56,540 for 2026/27. Combines advanced corporate law, financial regulation, and quantitative finance — designed for elite legal and financial careers.", careers: ["Corporate / Financial Lawyer", "Investment Banking Lawyer", "Financial Regulator"], salary: "£55,000–£95,000 starting", demand: "Magic Circle law firms with strong finance practices and US white-shoe firms in London actively recruit MLF graduates for cross-border M&A, structured finance, and regulatory roles." },
                        { title: "MSc Advanced Computer Science", duration: "12 Months", desc: "Oxford's Department of Computer Science research-led master's. Tuition £43,730 for 2026/27. Specialisations include AI, machine learning, computer security, programming languages, and computational biology. Strong pipeline to DPhil (PhD) research.", careers: ["AI / ML Engineer", "Research Scientist", "Quantitative Developer"], salary: "£50,000–£90,000 starting", demand: "Oxford CS graduates are recruited by Google DeepMind, OpenAI, Meta AI, and London quant funds — the department's deep AI research output drives sustained industry demand." },
                        { title: "MSc Mathematical and Theoretical Physics", duration: "12 Months", desc: "Oxford Mathematical Institute joint master's. Tuition £43,730 for 2026/27. Rigorous foundations in quantum field theory, general relativity, string theory, and mathematical physics — strong preparation for theoretical physics DPhil programmes.", careers: ["Theoretical Physicist", "Quantitative Analyst", "Research Fellow"], salary: "£45,000–£80,000 starting (Quant) / £30,000–£40,000 (Academic)", demand: "Oxford MTP is the world's most prestigious training ground for theoretical physics PhDs — alumni populate top quant funds, Fermilab, CERN, and academic posts at MIT, Princeton, and Stanford." },
                        { title: "MSt History of Art and Visual Culture", duration: "9 Months", desc: "Postgraduate taught Master of Studies from Oxford's Department of History of Art. Intensive nine-month programme with coursework modules, research training, and a 10,000–15,000 word dissertation. Strong pathway to museum and curatorial careers.", careers: ["Museum Curator", "Auction House Specialist", "Art Historian / Academic"], salary: "£28,000–£42,000 starting", demand: "Major museums (V&A, British Museum, National Gallery), auction houses (Sotheby's, Christie's), and global cultural institutions recruit Oxford MSt graduates with research-led training." },
                        { title: "MPhil in Economics", duration: "21 to 24 Months", desc: "Oxford's advanced taught master's (two-year MPhil) preceding the DPhil pathway. Year 1 features intensive taught modules; Year 2 features an independent research thesis up to 30,000 words. Premier preparation for PhD programmes in economics.", careers: ["PhD Candidate (Top Programmes)", "Central Bank Economist", "Economic Research Fellow"], salary: "£42,000–£70,000 starting (Public sector / Research)", demand: "70%+ of Oxford MPhil Economics graduates progress to top global PhD programmes (Harvard, MIT, Princeton, LSE) — the rest enter the Bank of England, IMF, World Bank, or elite consulting." },
                        { title: "MSc by Research (Physiology, Anatomy, Genetics)", duration: "1 to 3 Years", desc: "Pure research master's pathway — a 'Mini-DPhil' — without compulsory taught modules. Tuition £34,700 for 2026/27. Designed for students transitioning into doctoral research in the biomedical sciences.", careers: ["Biomedical Researcher", "PhD Candidate", "Pharmaceutical R&D Scientist"], salary: "£32,000–£48,000 starting", demand: "Pathway of choice for serious research candidates — converts to DPhil progression with strong publication outputs in Nature, Cell, and other top biomedical journals." },
                        { title: "DPhil (PhD equivalent) in any Department", duration: "3 to 4 Years", desc: "Oxford's doctoral pathway — original publishable research culminating in a major thesis (typically 80,000–100,000 words) and oral defence. Tuition varies by department but most DPhil candidates secure full funding via Clarendon, Rhodes, or research council awards.", careers: ["University Faculty (Research / Teaching)", "Industry Research Scientist", "Policy / Think Tank Lead"], salary: "£35,000–£60,000 starting (Postdoc / R&D)", demand: "Oxford DPhils dominate global academic recruitment and high-end industry R&D — the prestige of an Oxford doctorate opens doors at top global universities, Anthropic / DeepMind / OpenAI, and major think tanks." }
                    ],
                    scholarships: [
                        { title: "Rhodes Scholarship", amount: "Full tuition + college fees + £19,800 annual stipend + visa, IHS, two international flights", eligibility: "Indian citizens (5 awards annually); selection on scholastic attainment, character, leadership, and public service", desc: "The world's oldest international postgraduate scholarship (founded 1902). Five awards for Indian citizens each year. Covers all university and college fees, a generous living stipend (£19,800 for 2026/27), student visa fees, the International Health Surcharge (IHS), and two return international flights." },
                        { title: "Clarendon Fund Scholarship", amount: "Full tuition + college fees + £16,500–£18,000 annual stipend", eligibility: "All nationalities, all disciplines — applicants for any full-time or part-time master's or DPhil. Selection on academic merit (first-class honours / 3.7+ GPA)", desc: "Oxford's flagship internal graduate scholarship — over 200 new fully-funded awards each year supporting a community of 700+ active scholars from 70 nations. Nationality, residency, and discipline-blind. Automatic consideration with December/January application deadlines." },
                        { title: "Felix Scholarship", amount: "Full tuition + ~£17,800 annual living allowance + one-way flight from India", eligibility: "Indian graduates with first-class honours, who have NOT previously studied outside India", desc: "Administered with the Felix Trustees — up to six awards annually for high-achieving Indian graduates pursuing postgraduate study at Oxford. Covers full tuition, a generous living allowance (~£17,800 per year), and a one-way flight from India to the UK." },
                        { title: "Oxford-Indira Gandhi Graduate Scholarship", amount: "Full tuition + £18,622+ annual living grant", eligibility: "Indian doctoral applicants whose research addresses India's development and sustainability challenges", desc: "Jointly funded by Oxford, Somerville College, and the Government of India. Linked to the Oxford India Centre for Sustainable Development (OICSD) at Somerville College. Successful candidates are transferred to Somerville College for the duration of their DPhil." },
                        { title: "Weidenfeld-Hoffmann Scholarships and Leadership Programme", amount: "Full tuition + £18,622+ annual stipend + leadership training", eligibility: "Indian and other developing-country master's applicants in agriculture, law, healthcare, public policy, or environmental sustainability", desc: "Combines full tuition coverage and a living stipend with a structured leadership training and mentoring programme. Open to high-achieving Indian students pursuing one-year master's degrees in eligible fields." },
                        { title: "Commonwealth Shared Scholarships", amount: "Full tuition + return air travel + ~£16,164 annual living allowance + thesis grants", eligibility: "Indian postgraduate students admitted to development-focused master's programmes (5–10 awards per year)", desc: "Co-funded by the Commonwealth Scholarship Commission. Targets candidates admitted to Oxford's development-focused master's programmes. Covers full tuition, return air travel, thesis grants, and an annual living allowance of approximately £16,164." },
                        { title: "Crankstart Scholarship", amount: "Up to £6,270 annual non-repayable bursary + career mentorship + £3,200 internship bursary", eligibility: "UK-resident undergraduates with household income ≤£32,500 (currently supports ~17% of full-time UK undergraduates at Oxford)", desc: "Launched in 2012 by Sir Michael Moritz and Ms. Harriet Heyman. Provides a non-repayable living-cost bursary, career mentorship, exclusive internship opportunities, and a separate internship bursary covering travel and living expenses during placements." },
                        { title: "Oxford Bursary Scheme", amount: "£1,080 — £4,320 per year (graduated scale)", eligibility: "UK and Republic of Ireland undergraduates with household income ≤£50,000 — automatic assessment", desc: "Graduated scale of non-repayable support for UK/ROI undergraduates not eligible for Crankstart. Includes the Oxford Travel Supplement (£220/year if 80–150 miles from Oxford, £550/year if 150+ miles), plus additional support for care-experienced and estranged students up to £3,500/year." },
                        { title: "J.N. Tata Endowment Loan Scholarship", amount: "Up to ₹10,00,000 (low-interest loan) + ₹50,000 travel grant + ₹75,000 gift award", eligibility: "Indian citizens pursuing international postgraduate study (no collateral required, guarantor mandatory)", desc: "Established by the Tata Group. Merit-based loan scholarship for Indian students at Oxford and other top global universities. Includes a travel grant and a non-repayable gift award. Requires a tailored Statement of Purpose, academic references, and a guarantor." },
                        { title: "Oxford Pershing Square Scholarship", amount: "Full master's + MBA tuition fees (up to 5 awards)", eligibility: "Candidates pursuing any of the Oxford 1+1 MBA partnering programmes with commitment to global challenges", desc: "Covers both master's and MBA tuition fees for up to five awards across the 1+1 MBA pathway. Candidates must demonstrate commitment to finding sustainable solutions to global challenges in areas such as climate, healthcare, and inequality." }
                    ]
                },
                cambridge: {
                    name: "University of Cambridge", shortName: "Cambridge", cityId: "cambridge_uk",
                    cityName: "Cambridge, England", rank: "6", tuition: "£29,052 — £70,554 (International, 2026/27)",
                    heroImage: "https://images.pexels.com/photos/36145595/pexels-photo-36145595.jpeg",
                    overview: "Founded in 1209, the University of Cambridge is the fourth-oldest university in the world and the second-oldest in the English-speaking world. Located in the historic city of Cambridge, England, it is a collegiate public research university comprising 31 semi-autonomous constituent colleges and more than 150 academic departments, faculties, and institutions organised into six schools — Arts and Humanities, Biological Sciences, Clinical Medicine, Humanities and Social Sciences, Physical Sciences, and Technology. Cambridge is globally renowned for its distinctive supervision system, where students receive small-group teaching from leading academics in addition to lectures. Its alumni, faculty, and affiliates have won 126 Nobel Prizes — the highest of any university in the UK — alongside 11 Fields Medals and 7 Turing Awards. Cambridge is a member of the Russell Group and has produced figures such as Isaac Newton, Charles Darwin, Stephen Hawking, Alan Turing, and Rajiv Gandhi. The university is consistently ranked among the top 5 universities globally and is home to one of the world's largest academic libraries with around 16 million books.",
                    quickFacts: ["Acceptance Rate: ~21% (Undergraduate)", "Founded: 1209 (Fourth-oldest university in the world)", "QS World Rank 2026: #6 Globally", "Constituent Colleges: 31 self-governing colleges", "Total Students: ~24,000+ (13,000 UG / 11,000 PG)", "International Students: From 140+ countries (~40% of student body)", "Nobel Prizes: 126 awarded to alumni, faculty and affiliates", "Endowment: ~£6 billion (one of the largest in Europe)", "Living Alumni: 333,629+ worldwide (as of December 2024)", "Member of the Russell Group and League of European Research Universities", "Notable for the Cavendish Laboratory, where DNA's double helix was discovered"],
                    financialReqs: "International undergraduate tuition for 2026/27 entry ranges from £25,734 to £70,554 per year depending on the course — Social Sciences, Arts and Humanities sit at the lower end (~£25,734), while Engineering, Sciences and Architecture range from £37,000 to £45,000, and Medicine (clinical years) reaches up to £70,554. Postgraduate tuition for international students ranges from £14,875 to over £75,000 depending on the programme, with the Cambridge MBA at Judge Business School costing approximately £73,000. In addition to university tuition, all international students must pay an annual College fee (typically £10,000–£14,000 per year) which covers college-provided educational, domestic and pastoral services. Cambridge estimates that international students need approximately £14,225–£17,000 per year for living costs (rent, food, utilities, books and personal expenses). Upon accepting an offer, international students pay a deposit of £2,000–£5,000, which is deducted from the first term's tuition. Cambridge offers extensive funding including the Cambridge Trust Scholarships, Gates Cambridge Scholarship (fully funded), and Commonwealth Scholarships.",
                    admissionRequirements: [
                        "Acceptance Rate: ~21% — approximately 21,445 applicants competed for 4,550 undergraduate places in the most recent cycle",
                        "Application Deadline: 15 October 2026 (Undergraduate UCAS deadline for 2027 entry); Postgraduate deadlines vary by course between December and April",
                        "Required Tests: Most applicants must take a course-specific admissions assessment (ESAT, TMUA, LNAT or written submissions) — taken at registered centres",
                        "Interviews: Almost all shortlisted undergraduate applicants are interviewed (typically online between 1–19 December)",
                        "English Requirement: IELTS Academic 7.5 overall (no element below 7.0), or TOEFL iBT 110 overall (25+ in each section)",
                        "Indian Qualifications: CBSE/ISC Class XII with predominantly A1 grades (90%+), plus supporting qualifications such as 5+ AP scores of 5, IB Diploma, or one year of an Indian undergraduate degree",
                        "Application Portal: UCAS for undergraduate (plus My Cambridge Application); direct Cambridge applicant portal for postgraduate",
                        "Note: Cambridge does NOT accept applications to both Oxford and Cambridge in the same admissions cycle. Cambridge also operates a 'pooling' system where strong candidates not given an offer by their preferred college may be offered a place by another college"
                    ],
                    applicationDeadlines: [
                        "Undergraduate UCAS Deadline (2027 entry): 15 October 2026 at 18:00 UK time — same date as Oxford; you cannot apply to both Oxford and Cambridge in the same cycle",
                        "My Cambridge Application (MyCApp) Deadline: 22 October 2026 at 18:00 UK time — Cambridge's supplementary application (formerly the SAQ) must be completed by this date; covers additional academic details, college choice, and any extenuating circumstances",
                        "Admissions Assessment Registration Deadline: Late September / early October 2026 — most courses now use the ESAT (Engineering, Sciences, Economics), TMUA (Mathematics, Computer Science, Economics), or LNAT (Law); registration via Pearson VUE",
                        "Admissions Assessment Sitting Window: Mid-October 2026 (ESAT and TMUA usually held in two sittings — October and January for TMUA)",
                        "Written Work Submission Deadline: 10 November 2026 — required for arts and humanities courses (English, History, MML, Classics, etc.); submit two recent marked essays from your A-level / equivalent coursework",
                        "Interview Window: 1–19 December 2026 — almost all shortlisted applicants are interviewed (typically online for international applicants); usually 2 interviews per applicant from the prospective college",
                        "Offer / Pool / Rejection Decisions Released: Late January 2027 — all candidates notified simultaneously after the college 'pooling' round redistributes strong unsuccessful candidates to other colleges",
                        "Postgraduate Application Deadlines: Vary significantly by course — most MPhil and MRes programmes have main funding deadlines in early December 2026 (Gates Cambridge, Cambridge Trust) and follow-on deadlines in January, March, and June 2027",
                        "Gates Cambridge Scholarship Deadline: 14 October 2026 for US citizens (separate application required); early December 2026 for non-US citizens — fully funded postgraduate scholarship",
                        "Cambridge MBA (Judge Business School) Deadlines: Four rounds — Round 1 mid-September, Round 2 early November, Round 3 mid-January, Round 4 late March; Round 1–2 strongly preferred for scholarship consideration",
                        "Reply-By Date (Undergraduate Offers): Early May 2027 via UCAS",
                        "Best Time to Apply: Begin in May–June 2026 — the timeline is essentially identical to Oxford, with the 15 October UCAS deadline immovable. Strong applicants book admissions assessments as soon as registration opens in early September and complete the MyCApp within a week of submitting UCAS",
                        "Application Opens: UCAS opens 13 May 2026; submissions accepted from early September 2026"
                    ],
                    bachelors: [
                        { title: "BA Economics", duration: "3 Years", desc: "Cambridge's flagship economics degree — Group 1 tier. International tuition £29,052 per year (2026/27). Highly mathematical curriculum covering microeconomics, macroeconomics, econometrics, and applied policy analysis. Taught through lectures + small-group supervisions.", careers: ["Investment Banker", "Economic Consultant", "Central Bank Analyst"], salary: "£45,000–£75,000 starting (IB roles reach £90,000+ with bonus)", demand: "Global investment banks, MBB consulting firms, and hedge funds compete intensely for Cambridge Economics graduates — among the highest-earning UK undergraduate degrees, with strong pipeline into the Bank of England and HM Treasury." },
                        { title: "BA Law", duration: "3 Years", desc: "Cambridge's Qualifying Law Degree (QLD) — Group 1 tier. International tuition £29,052 per year (2026/27). Accredited for both solicitor and barrister training pathways in England and Wales. Library-centric programme combined with college-based supervisions.", careers: ["Magic Circle Solicitor", "Barrister", "Corporate Counsel"], salary: "£50,000–£130,000 starting (Magic Circle trainees)", demand: "Cambridge Law is one of the most competitive law degrees in the world — Magic Circle (A&O, Clifford Chance, Freshfields, Linklaters, Slaughter and May) and US-headquartered London firms heavily target Cambridge graduates." },
                        { title: "BA Human, Social and Political Sciences (HSPS)", duration: "3 Years", desc: "Interdisciplinary social sciences tripos covering politics, international relations, sociology, social anthropology, and psychology. Group 1 tier — international tuition £29,052 per year (2026/27). Flexibility to specialise across all three years.", careers: ["Diplomat / Foreign Service Officer", "Policy Analyst", "International NGO Director"], salary: "£32,000–£55,000 starting", demand: "Strong demand from the UK Foreign Office (FCDO), UN, EU institutions, geopolitical risk consultancies, and major think tanks — Cambridge HSPS graduates regularly enter Whitehall Fast Stream." },
                        { title: "BA Mathematics (Mathematical Tripos)", duration: "3 Years (4 Years for Part III)", desc: "Cambridge's world-renowned Mathematical Tripos — Group 2 tier. International tuition £32,406 per year (2026/27). The fourth year, Part III (Master of Mathematics, MMath), is considered the world's most prestigious mathematics master's programme.", careers: ["Quantitative Analyst", "Academic Mathematician", "Machine Learning Researcher"], salary: "£55,000–£100,000+ starting (Quant funds)", demand: "Cambridge mathematicians dominate global quant finance recruitment (Jane Street, Citadel, DE Shaw, Hudson River) and produce more Fields Medallists than any UK university — extreme demand for graduates with Part III." },
                        { title: "BA Architecture", duration: "3 Years", desc: "Cambridge's Architecture Tripos — Group 3 tier. International tuition £38,010 per year (2026/27). Studio-based design teaching combined with architectural history, theory, and structural engineering fundamentals. ARB / RIBA Part 1 accredited.", careers: ["Practising Architect", "Urban Designer", "Heritage Conservator"], salary: "£28,000–£45,000 starting (post-Part 1)", demand: "Strong demand from major UK and global architecture practices (Foster + Partners, Zaha Hadid Architects, RSHP) — Cambridge architecture graduates regularly win RIBA President's Medals and global design competitions." },
                        { title: "BA Computer Science", duration: "3 Years (4 Years with MEng)", desc: "Cambridge's Computer Science Tripos — Group 4 tier. International tuition £44,214 per year (2026/27). One of the most competitive UG programmes in the UK with single-digit acceptance rates. Strong focus on theoretical CS, hardware, AI, and systems.", careers: ["Software Engineer", "AI / ML Engineer", "Quantitative Developer"], salary: "£50,000–£95,000 starting (London tech / quant)", demand: "Cambridge CS alumni founded ARM, DeepMind, and many of the UK's largest tech companies — graduates are aggressively recruited by Google, Meta, Microsoft Research, and the entire London quant ecosystem." },
                        { title: "BA Engineering (4-Year MEng)", duration: "4 Years", desc: "Cambridge's integrated Engineering Tripos — Group 4 tier. International tuition £44,214 per year (2026/27). Broad general engineering for Years 1–2, with specialisation across mechanical, civil, electrical, chemical, information, and aerospace from Year 3.", careers: ["Mechanical / Aerospace Engineer", "R&D Engineer", "Engineering Consultant"], salary: "£38,000–£58,000 starting", demand: "UK aerospace, automotive, energy, and infrastructure firms (Rolls-Royce, BAE Systems, McLaren, National Grid, Arup) extensively recruit Cambridge engineers — strong pipeline into PhD research too." },
                        { title: "BA Natural Sciences (MSci track)", duration: "3 Years (4 Years for MSci)", desc: "Cambridge's flagship sciences tripos covering physics, chemistry, biology, materials, earth sciences, and pharmacology. Group 4 tier — international tuition £44,214 per year (2026/27). Students specialise progressively, with first-year breadth required.", careers: ["Research Scientist", "Pharmaceutical R&D", "Quantitative Analyst"], salary: "£35,000–£55,000 starting", demand: "Cambridge Natural Sciences feeds the entire UK and European science research ecosystem — AstraZeneca, GSK, the Wellcome Sanger Institute, and the Crick Institute compete aggressively for graduates." },
                        { title: "Medicine (Standard MB / BChir)", duration: "6 Years (3+3 structure)", desc: "Cambridge's pre-clinical (Years 1–3) and clinical (Years 4–6) medical pathway — Group 5 tier. International tuition reaches £70,554 per year (2026/27) — the highest fee at Cambridge, reflecting clinical placement and NHS hospital training costs.", careers: ["Doctor (NHS / Private)", "Academic Clinician", "Clinical Researcher"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Cambridge-trained doctors dominate UK academic medicine — alumni populate elite teaching hospitals (Addenbrooke's, Great Ormond Street) and frequently lead Wellcome Trust academic clinical research pathways globally." },
                        { title: "Veterinary Medicine (VetMB)", duration: "6 Years", desc: "Cambridge's six-year veterinary degree — Group 5 tier alongside Medicine. International tuition £70,554 per year for clinical years (2026/27). RCVS-accredited, training graduates for both small-animal and large-animal practice plus research careers.", careers: ["Veterinary Surgeon", "Veterinary Researcher", "Animal Welfare Specialist"], salary: "£32,000–£48,000 starting (Newly qualified vet)", demand: "Acute UK veterinary workforce shortages — Cambridge VetMB graduates enjoy 100% employment within 6 months of graduation, with strong demand from CVS Group, Independent Vetcare, and academic veterinary research." }
                    ],
                    masters: [
                        { title: "Cambridge MBA (Judge Business School)", duration: "12 Months", desc: "One-year Master of Business Administration delivered at Judge Business School. Tuition £80,000 for 2026/27 entry (application fee £165). Basic living costs estimated at £19,860 for the 12-month programme, bringing total cost of attendance close to £100,000.", careers: ["Strategy Consultant", "Investment Banker / Private Equity Associate", "C-Suite Executive"], salary: "Median post-MBA £85,000–£110,000", demand: "Cambridge MBA graduates flow into MBB consulting, bulge bracket banks, growth-stage tech, and global impact investing — programme prestige and Cambridge alumni network drive strong post-MBA career mobility." },
                        { title: "Master of Finance (MFin)", duration: "12 Months", desc: "Judge Business School's premier quantitative finance master's. Tuition £60,000 for 2026/27 (application fee £120). The cohort relies heavily on personal resources — 35% family savings, 32% personal savings, only 14% via scholarships.", careers: ["Investment Banker", "Quantitative Analyst", "Hedge Fund Analyst"], salary: "£60,000–£100,000+ starting (IB / Quant roles)", demand: "Cambridge MFin sits alongside LSE and Imperial in the elite tier of UK finance master's — strong recruitment into London bulge bracket banks, hedge funds, and asset management firms." },
                        { title: "MPhil in Economics", duration: "9 Months", desc: "Faculty of Economics' flagship one-year MPhil. International tuition £40,098 for 2026/27 (Home £22,010). Total attendance costs £55,000–£60,000 including college fees and living. 70% of the cohort progresses directly to PhD programmes worldwide.", careers: ["PhD Candidate (Top Programmes)", "Central Bank Economist", "Economic Research Fellow"], salary: "£50,000–£70,000 median starting", demand: "Cambridge MPhil Economics is the world's most prestigious one-year economics master's outside the US — premier preparation for top global PhDs (Harvard, MIT, Stanford, Princeton) and Bank of England / IMF research roles." },
                        { title: "MPhil in Management", duration: "9 Months", desc: "Judge Business School's pre-experience management master's. Tuition £42,468 for both Home and international students (2026/27). Designed for students without a prior business background — does NOT require GMAT or GRE submission.", careers: ["Management Consultant", "Strategy Analyst", "Graduate Programme Associate"], salary: "£42,000–£62,000 starting", demand: "Top-tier consulting firms (MBB, Big Four advisory), FTSE 100 graduate schemes, and global rotational programmes recruit heavily from MPhil Management — strong pivot pathway for non-business undergraduates." },
                        { title: "MPhil in Advanced Computer Science", duration: "9 Months", desc: "Department of Computer Science and Technology research master's. International tuition £48,192 for 2026/27 (Home £16,130) — DECREASED from 2025/26's £59,076 following Cambridge's market alignment review. Strong PhD progression pathway.", careers: ["AI / ML Engineer", "Research Scientist", "Quantitative Developer"], salary: "£50,000–£90,000 starting", demand: "Cambridge ACS graduates are recruited by DeepMind, Microsoft Research Cambridge, ARM, and London-based quant funds — the department's deep AI and systems research drives sustained industry demand." },
                        { title: "Master of Law (LLM)", duration: "9 Months", desc: "Faculty of Law's flagship postgraduate degree. International tuition approximately £38,000 for 2026/27. Highly selective — minimum IELTS 7.5 overall (no band below 7.0). Premier preparation for academic careers, Magic Circle practice, or SQE qualification.", careers: ["Corporate Solicitor", "Barrister", "Academic Legal Researcher"], salary: "£50,000–£100,000 starting", demand: "Cambridge LLM alumni regularly secure positions at Magic Circle firms, US white-shoe firms in London, and top global academic institutions — programme also prepares for the SQE pathway to UK legal qualification." },
                        { title: "Master of Corporate Law (MCL)", duration: "9 Months", desc: "Specialised corporate law master's from Cambridge's Faculty of Law. Tuition £48,540 for 2026/27. Designed for international lawyers entering elite M&A, structured finance, and corporate governance practice. Cohorts heavily target London and New York firms.", careers: ["Corporate / M&A Lawyer", "Financial Regulator", "In-House General Counsel"], salary: "£60,000–£120,000 starting (Magic Circle / US firms)", demand: "MCL graduates are recruited globally by Magic Circle (Slaughter and May, Freshfields), US Big Law (Skadden, Cravath), and major regulators — programme is the gold-standard credential for transactional corporate law." },
                        { title: "MPhil in AI Ethics and Society", duration: "22 Months (Blended)", desc: "Interdisciplinary part-time blended-learning master's. International tuition £39,198 per year (Home £26,136) for 2026/27 — total programme cost spans 22 months. Combines philosophy, computer science, law, and public policy approaches to AI governance.", careers: ["AI Policy Advisor", "Ethics Researcher", "Technology Strategist"], salary: "£45,000–£75,000 starting", demand: "Rapidly emerging field — the UK AI Safety Institute, Big Tech AI ethics teams, government regulators (Ofcom, ICO), and global think tanks compete for graduates with formal AI ethics training." },
                        { title: "PhD (Doctor of Philosophy) — STEM Fields", duration: "3 to 4 Years", desc: "Cambridge's doctoral pathway. International tuition £35,000–£55,000 per year depending on department (Home rate £8,337). Application fee £20 covering up to seven doctoral applications. Most PhD candidates secure full funding via Cambridge Trust, Gates, or research council awards.", careers: ["University Faculty (Research / Teaching)", "Industry Research Scientist", "Policy / Think Tank Lead"], salary: "£35,000–£60,000 starting (Postdoc / R&D)", demand: "Cambridge PhDs dominate global academic recruitment and high-end industry R&D — strong pipeline into UK and US universities, plus AI labs (DeepMind, OpenAI), pharma R&D, and major think tanks." },
                        { title: "MPhil in Anthropocene Studies", duration: "10 Months", desc: "Interdisciplinary research master's exploring human impact on Earth's geological epoch. International tuition £36,828 for 2026/27 (Home £15,672). Combines earth sciences, environmental humanities, anthropology, and climate policy.", careers: ["Climate Researcher", "Environmental Policy Advisor", "Sustainability Consultant"], salary: "£32,000–£48,000 starting", demand: "Climate research and ESG policy roles are among the fastest-growing graduate sectors — UK government net-zero pathway, COP delegations, and major sustainability consultancies recruit MPhil Anthropocene graduates." }
                    ],
                    scholarships: [
                        { title: "Gates Cambridge Scholarship", amount: "Full tuition + £22,050 annual stipend + return airfare + visa fees + IHS", eligibility: "Non-UK citizens (80 awards annually); evaluated on academic excellence, leadership potential, and commitment to improving lives", desc: "Funded by a US $210 million endowment from the Bill & Melinda Gates Foundation. The single most prestigious international postgraduate scholarship at Cambridge. Annual deadline: late October. Covers ALL costs including the Immigration Health Surcharge." },
                        { title: "Dr. Manmohan Singh PhD Scholarships (St John's College)", amount: "Full university + college fees + monthly stipend + international flights", eligibility: "Indian PhD candidates under 35 with first-class master's, in science, technology, economics, and social sciences (3–4 awards annually)", desc: "Named after the former Prime Minister of India, who studied at St John's College. Fully funds three to four Indian PhD candidates annually. Application deadline: January 15. Includes annual return international flights between India and Cambridge." },
                        { title: "Inlaks Cambridge Scholarship", amount: "Up to USD 100,000 (~£76,897) — covers tuition + living costs", eligibility: "Indian citizens under 30 — EXCLUDES business, computer science, finance, engineering, film studies, medicine, and music", desc: "Offered in partnership with the Inlaks Shivdasani Foundation. Strict field-specific exclusions apply — most STEM and business courses are NOT covered. Designed for humanities, social sciences, law, public policy, and select scientific research candidates." },
                        { title: "Cambridge Bursary Scheme", amount: "Up to £3,500 per year (Standard) / Up to £8,350 (Enhanced for care leavers)", eligibility: "UK and qualifying EU undergraduates with Home fee status — household income ≤£62,215; automatically assessed", desc: "Progressive non-repayable financial assistance. No separate application — automatic assessment when applying for a student loan. Care leavers and independent students receive enhanced bursaries; free-school-meals students get an additional £1,000 / year Education Premium." },
                        { title: "Stormzy Scholarship", amount: "£20,000 per year (covers tuition + maintenance)", eligibility: "Black UK undergraduate students with Home fee status from low-income backgrounds (10+ awards annually)", desc: "Funded in partnership with the #Merky Foundation and HSBC UK (£2 million pledged across three years for 30 scholars). Provides at least ten awards annually — eliminates the need for state or commercial loans. Application deadline: August." },
                        { title: "Pemanda Monappa Scholarship", amount: "Variable tuition fee top-ups (partnership with Cambridge Trust)", eligibility: "Indian citizens from southern Indian states — Andhra Pradesh, Karnataka, Kerala, Tamil Nadu, and Telangana", desc: "Run in partnership with the Cambridge Trust. Designed to widen access for postgraduate students from southern India. Application deadline: early February. Combines with other Cambridge Trust awards to provide enhanced funding." },
                        { title: "Oxford and Cambridge Society of India (OCSI) Scholarships", amount: "£4,000 — £15,000 (₹4 Lakhs to ₹15 Lakhs) — one-time grant", eligibility: "Indian citizens resident in India; under 30 years old; admitted to either Oxford or Cambridge", desc: "Long-running alumni-led initiative offering one-time academic grants. Application deadline: May 21. Open to both undergraduate and postgraduate students — flexible use across tuition and living expenses." },
                        { title: "Jardine Scholarship", amount: "Full tuition + college fees + living costs + international flights", eligibility: "Applicants from selected East / Southeast Asian countries (Hong Kong, Mainland China, Indonesia, Malaysia, Philippines, Singapore, Taiwan, Vietnam)", desc: "Fully funded undergraduate and postgraduate scholarship for outstanding candidates from selected Asian countries. Covers 100% of fees, living costs, and flights. Course-specific application deadlines." },
                        { title: "Formula 1® Engineering Scholarship", amount: "£20,000 per year", eligibility: "Female UK undergraduates or those from underrepresented ethnic minorities pursuing a four-year Engineering degree (2 awards annually)", desc: "Provides two awards per year of £20,000 to support female engineering students or those from underrepresented ethnic minorities. Covers tuition and maintenance for the four-year Engineering Tripos. Application deadline: August." },
                        { title: "Prince Philip Scholarship", amount: "Cash awards + means-tested support for tuition + maintenance", eligibility: "Permanent residents of the Hong Kong SAR — undergraduate applicants only", desc: "Offers cash awards alongside means-tested tuition and maintenance support for Hong Kong residents. Course-specific application deadlines. Designed to maintain Cambridge's longstanding partnership with the Hong Kong SAR." }
                    ]
                },
                imperial: {
                    name: "Imperial College London", shortName: "Imperial College", cityId: "london_imperial",
                    cityName: "London, England", rank: "2", tuition: "£37,900 — £53,700 (International, 2026/27)",
                    heroImage: "https://images.pexels.com/photos/9787987/pexels-photo-9787987.jpeg",
                    overview: "Founded in 1907 by Royal Charter granted by King Edward VII, Imperial College London (officially the Imperial College of Science, Technology and Medicine) is a public research university located in South Kensington in central London — an area known as 'Albertopolis' originally envisioned by Prince Albert as a hub where science and the arts meet. Imperial is the only university in the UK that focuses exclusively on science, engineering, medicine, and business, making it one of the world's most specialised elite institutions. The college formed through the merger of the Royal College of Science, the Royal School of Mines, and later the City and Guilds College (1910), with its medical heritage tracing back to Charing Cross Hospital Medical School (1823). Imperial is ranked #2 globally in the QS World University Rankings 2026 — second only to MIT and #1 in the UK — and was named 'University of the Year for Graduate Employment' by The Times and Sunday Times Good University Guide 2026. Its alumni and academics include 14 Nobel Prize winners (including Sir Alexander Fleming, discoverer of penicillin), 3 Fields Medallists, 74 fellows of the Royal Society, and famous figures such as H.G. Wells, Brian May (Queen guitarist), and Rajiv Gandhi. Imperial graduates earn the highest average starting salary of any university in the UK.",
                    quickFacts: ["QS World Rank 2026: #2 Globally (after MIT) and #1 in the UK", "Acceptance Rate: ~10–15% Overall (Indian Students ~25%)", "Founded: 1907 (Royal Charter from King Edward VII)", "Total Students: ~23,000+ from 150+ countries", "International Students: 60%+ of student body (most international Russell Group university)", "Focus: STEM and Business only — Engineering, Medicine, Natural Sciences, Business", "Nobel Prize Winners: 14 (including Sir Alexander Fleming — penicillin)", "Times Higher Ed World Rank 2026: #8 Globally", "Highest average graduate starting salary of any UK university", "Located in South Kensington — next to V&A, Natural History, and Science Museums", "Member of the Russell Group; home to 9 campuses across London and South East England"],
                    financialReqs: "International undergraduate tuition for 2026/27 entry typically ranges from £37,900 to £53,700 per year depending on the programme — Engineering and Computer Science range £42,200–£46,650, Natural Sciences and Mathematics ~£40,940, Business School undergraduate ~£37,900, and Medicine (MBBS) reaches the higher end at £53,700. Postgraduate international tuition ranges from £33,500 (MSc programmes) to over £75,000 (Imperial MBA at the Business School). UK Home undergraduate tuition for 2026/27 is £9,790 (£10,050 for 2027/28). Imperial estimates additional living costs of approximately £14,500–£17,500 per year for international students living in London — covering accommodation (£200–£350/week for halls), food, transport, and personal expenses. Halls of residence are guaranteed for first-year international undergraduates who apply by the deadline. Imperial offers a 1.5% early payment discount for postgraduate taught/research master's students who pay the full fee at least 45 days before due date. Major scholarships include the India Future Leaders Scholarship (£10,000 for Indian PG students), President's PhD Scholarships (fully funded), Imperial Bursaries, the Imperial College Business School scholarships, Chevening, and Commonwealth awards.",
                    admissionRequirements: [
                        "Acceptance Rate: ~10–15% overall; ~25% for Indian students; lowest for Medicine, Computer Science and Engineering",
                        "Application Deadline (Undergraduate): 14 January 2027 via UCAS for September 2027 entry; 15 October 2026 for Medicine (A100)",
                        "Application Deadline (Postgraduate): Most courses run rolling admissions from October 2025 to June 2026; MBA has multiple application rounds",
                        "Required Tests: Medicine requires the UCAT; Mathematics requires MAT or TMUA; some Engineering programmes require Engineering Admission Test (ESAT)",
                        "Academic Requirements: A-levels typically AAA to A*A*A (Maths required for STEM); IB 38–45 points; strong grades in subject-relevant disciplines",
                        "English Requirement: IELTS Academic 6.5+ overall (no element below 6.0) for standard; 7.0+ for higher-level courses; TOEFL iBT 92+ (20+ each section); PTE Academic 62+",
                        "Indian Qualifications: CISCE/ISC or CBSE Class XII with 90%+ overall and 90%+ in relevant subjects; some programmes also accept HSC qualifications with strong scores",
                        "Application Fee: £28.50 for undergraduate (via UCAS); £80 for most postgraduate programmes; £150 for the Imperial MBA"
                    ],
                    applicationDeadlines: [
                        "Undergraduate UCAS Deadline (Standard): 14 January 2027 at 18:00 UK time — UCAS equal consideration deadline for all Imperial undergraduate courses EXCEPT Medicine and Graduate Entry Medicine",
                        "Medicine (A100) UCAS Deadline: 15 October 2026 at 18:00 UK time — same date as Oxford and Cambridge; requires UCAT registration by late September and sitting in late October",
                        "Admissions Test Requirements: ESAT (Engineering, Physics-based courses) sittings in October–January 2027; MAT or TMUA for Mathematics in late October 2026 / early January 2027; UCAT for Medicine in summer–early October 2026",
                        "Interview Window: Late November 2026 through early February 2027 — most STEM courses interview shortlisted candidates online; Medicine interviews use Multiple Mini Interview (MMI) format typically in December–January",
                        "Application Review Cadence: Imperial reviews applications on a rolling basis — earlier UCAS submissions (September–November) typically receive offer decisions in December–January; later submissions reviewed February–April",
                        "Postgraduate Taught (MSc) Deadlines: Most courses run rolling admissions opening October 2026 and closing once places fill — typical timeline December 2026 – June 2027; international applicants strongly advised to apply by 30 June 2027 to ensure CAS issuance for UK student visa processing",
                        "Postgraduate Application Rounds (Selected Departments): Some Imperial Business School and Computing MSc programmes operate three rounds — Round 1 mid-October, Round 2 early January, Round 3 mid-March; applying in Round 1–2 maximises scholarship consideration",
                        "Imperial Business School MBA Rounds: Five rounds — Round 1 early September, Round 2 early November, Round 3 early January, Round 4 mid-March, Round 5 early May (international applicants recommended to apply by Round 3 for visa processing)",
                        "PhD / DPhil Applications: Most departments accept rolling applications throughout the year; Imperial President's PhD Scholarship (fully funded) has a December 2026 / January 2027 deadline",
                        "Reply-By Date (Undergraduate Offers): Early May 2027 via UCAS — firm / insurance choice replies",
                        "Visa Processing: International applicants strongly advised to confirm offers by 30 June 2027 to allow at least 8 weeks for Confirmation of Acceptance for Studies (CAS) issuance and Student Visa application",
                        "Best Time to Apply: Submit your UCAS application as early as possible in September–October 2026 (Imperial reviews on a rolling basis); for Medicine, treat 15 October 2026 as immovable. Postgraduate applicants targeting scholarships should aim for early November 2026 submissions",
                        "Application Opens: UCAS opens 13 May 2026; Imperial Gateway (postgraduate portal) opens October 2026"
                    ],
                    bachelors: [
                        { title: "Computing BEng / MEng", duration: "3 Years (BEng) / 4 Years (MEng)", desc: "Department of Computing — one of the UK's most competitive computer science programmes. International tuition £38,000–£41,200 per year (2025/26). Covers algorithms, AI, machine learning, software engineering, computer systems, and theoretical CS.", careers: ["Software Engineer", "AI / ML Engineer", "Quantitative Developer"], salary: "£50,000–£95,000 starting (London tech / quant)", demand: "Imperial Computing graduates are aggressively recruited by London quant funds (Jane Street, Citadel, G-Research), Big Tech (Google, Meta, DeepMind), and AI labs — consistently among the UK's highest-earning undergraduate degrees." },
                        { title: "Engineering (All Disciplines) BEng / MEng", duration: "3 Years (BEng) / 4 Years (MEng)", desc: "Imperial's flagship engineering programmes spanning Aeronautics, Bioengineering, Chemical, Civil, Electrical, Materials, and Mechanical Engineering. International tuition £37,900–£40,300 per year (2025/26). Heavily industry-linked with placement years.", careers: ["Engineering Consultant", "Aerospace / Mechanical Engineer", "Energy Systems Engineer"], salary: "£38,000–£58,000 starting", demand: "Imperial engineering graduates command the UK's highest starting salaries — extensively recruited by Rolls-Royce, BAE Systems, McLaren, Arup, the National Grid, and global energy firms (Shell, BP, Siemens Energy)." },
                        { title: "Medicine MBBS (Years 1–2 Pre-clinical)", duration: "6 Years total (2+4 structure)", desc: "Imperial School of Medicine's six-year clinical degree. International tuition £37,500 per year for Years 1–2 (2025/26) — pre-clinical phase covers biomedical sciences, anatomy, and clinical foundations. Located at the South Kensington and St Mary's campuses.", careers: ["Doctor (NHS / Private)", "Surgical Specialist", "Clinical Researcher"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Imperial Medicine remains one of the most prestigious clinical degrees in the UK — strong pipeline into NHS Foundation training at major London teaching hospitals (Charing Cross, St Mary's, Hammersmith) and academic medicine." },
                        { title: "Medicine MBBS (Years 3–6 Clinical)", duration: "6 Years total (2+4 structure)", desc: "Clinical phase of Imperial Medicine — international tuition £47,000–£52,000 per year for Years 3–6 (2025/26), among Imperial's highest fees due to NHS hospital placements. Six-year track produces dual MBBS BSc qualification.", careers: ["Doctor (NHS / Private)", "Academic Clinician", "Hospital Consultant"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Imperial-trained doctors dominate London teaching hospital recruitment — alumni populate elite NHS trusts, the Wellcome Trust academic clinical pathway, and global health policy roles." },
                        { title: "Natural Sciences (Physics, Chemistry, etc.) BSc / MSci", duration: "3 Years (BSc) / 4 Years (MSci)", desc: "Faculty of Natural Sciences degrees across Physics, Chemistry, Biology, Earth Science, and Materials. International tuition £36,100–£39,500 per year (2025/26). MSci track includes a final-year research project leading directly to PhD pathways.", careers: ["Research Scientist", "Pharmaceutical R&D", "Quantitative Analyst"], salary: "£35,000–£55,000 starting", demand: "Imperial Natural Sciences graduates feed the UK's pharmaceutical, energy, and materials research ecosystem — AstraZeneca, GSK, BP Energy, and the Francis Crick Institute compete actively for graduates." },
                        { title: "Mathematics BSc / MSci", duration: "3 Years (BSc) / 4 Years (MSci)", desc: "Department of Mathematics — one of the UK's top-ranked maths departments. International tuition £35,100–£37,800 per year (2025/26). Strong specialisations in applied maths, statistics, pure maths, and mathematical finance.", careers: ["Quantitative Analyst", "Actuary", "Data Scientist"], salary: "£50,000–£95,000 starting (Quant funds)", demand: "London quant funds (Jane Street, Citadel, Hudson River) and global investment banks aggressively recruit Imperial Maths graduates — particularly those who complete the MSci with mathematical finance specialisation." },
                        { title: "Life Sciences / Biology BSc", duration: "3 Years", desc: "Faculty of Natural Sciences life sciences degrees including Biological Sciences, Biochemistry, Biotechnology, and Microbiology. International tuition £35,500–£38,900 per year (2025/26). Strong lab-based teaching with summer research opportunities.", careers: ["Biomedical Researcher", "Pharmaceutical R&D Scientist", "Biotech Entrepreneur"], salary: "£32,000–£48,000 starting", demand: "The UK's life sciences cluster — including AstraZeneca, GSK, Oxford Nanopore, and the Crick Institute — actively recruit Imperial Life Sciences graduates with research-intensive training." },
                        { title: "Aeronautical Engineering MEng", duration: "4 Years", desc: "Department of Aeronautics — globally ranked among the top 5 aerospace engineering departments. International tuition at Imperial's engineering tier (£37,900–£40,300 per year, 2025/26). Strong industry links with Rolls-Royce, BAE Systems, and the European Space Agency.", careers: ["Aerospace Engineer", "Space Systems Engineer", "R&D Engineer"], salary: "£40,000–£60,000 starting", demand: "UK and European aerospace and defence sectors face acute engineer shortages — Imperial Aeronautics graduates are recruited by Rolls-Royce, BAE Systems, Airbus, and ESA with strong starting compensation." },
                        { title: "Bioengineering BEng / MEng", duration: "3 Years (BEng) / 4 Years (MEng)", desc: "Department of Bioengineering — applies engineering principles to medicine and biology. International tuition at Imperial's engineering tier (£37,900–£40,300 per year, 2025/26). Strong focus on medical devices, tissue engineering, and computational biology.", careers: ["Medical Device Engineer", "Biotech R&D Specialist", "Healthcare Technology Lead"], salary: "£35,000–£55,000 starting", demand: "The UK's medtech and digital health sector is expanding rapidly — Imperial Bioengineering graduates are recruited by GE Healthcare, Smith+Nephew, Babylon Health, and major NHS innovation hubs." },
                        { title: "Materials Science and Engineering MEng", duration: "4 Years", desc: "Department of Materials — focuses on advanced materials, nanotechnology, and sustainable engineering. International tuition at Imperial's engineering tier (£37,900–£40,300 per year, 2025/26). Includes industry placement opportunities.", careers: ["Materials Engineer", "Semiconductor R&D", "Renewable Energy Engineer"], salary: "£35,000–£52,000 starting", demand: "Strong demand from UK semiconductor (Arm, Pragmatic), renewable energy (Ørsted, Vestas), and battery technology firms — Imperial Materials graduates lead the UK's green-tech transition workforce." }
                    ],
                    masters: [
                        { title: "Imperial MBA", duration: "12 Months", desc: "Imperial College Business School's full-time MBA. Tuition rose to £64,400 for the 2026 intake (up from £57,500 for 2025). Reported 147% average salary increase for graduates. Strong focus on innovation, entrepreneurship, and STEM-driven business leadership.", careers: ["Strategy Consultant", "Tech Industry Executive", "Entrepreneur / Founder"], salary: "Median post-MBA £75,000–£120,000 (147% avg salary uplift)", demand: "Imperial MBA graduates flow into MBB consulting, tech firms (Amazon, Google, Microsoft), and growth-stage startups — programme's STEM-focused brand drives strong recruitment from technology and life sciences sectors." },
                        { title: "MSc Finance (MFin)", duration: "12 Months", desc: "Imperial College Business School's flagship quantitative finance master's. Tuition £51,000 for the 2026 intake (uniform for Home and international). Non-refundable deposit of £6,500 required. Average graduate salary £43,853.", careers: ["Investment Banker", "Quantitative Analyst", "Asset Manager"], salary: "£60,000–£100,000 starting (IB / Quant roles)", demand: "Imperial MFin sits among the elite tier of UK finance master's (alongside LSE and Oxford) — strong recruitment into London bulge bracket banks, hedge funds, and quant trading firms." },
                        { title: "MSc Computing / Data Science / AI", duration: "12 Months", desc: "Department of Computing master's programmes in Advanced Computing, Machine Learning, Data Science, and AI. International tuition £35,000–£46,000 per year (2025/26). Premium pricing reflects specialised infrastructure and faculty expertise.", careers: ["AI / ML Engineer", "Research Scientist", "Quantitative Developer"], salary: "£50,000–£90,000 starting", demand: "Imperial AI / ML graduates are recruited by Google DeepMind, OpenAI, Meta AI, and London-based quant funds — the department's deep research output drives sustained industry demand." },
                        { title: "MSc Engineering Disciplines", duration: "12 Months", desc: "Postgraduate MSc programmes across Aeronautics, Bioengineering, Chemical, Civil, Electrical, Materials, and Mechanical Engineering. International tuition £30,500–£40,500 per year (2025/26). Strong research-led teaching with industry-sponsored projects.", careers: ["Engineering Consultant", "R&D Engineer", "Project Manager"], salary: "£40,000–£60,000 starting", demand: "UK and global engineering firms compete actively for Imperial MSc Engineering graduates — particularly in aerospace, energy, and infrastructure where Imperial's research output drives industry partnerships." },
                        { title: "MSc Business / Management", duration: "12 Months", desc: "Imperial College Business School's specialised master's programmes including MSc Management, MSc International Management, MSc Strategic Marketing, and MSc Business Analytics. International tuition £35,000–£45,000 per year (2025/26).", careers: ["Management Consultant", "Strategy Analyst", "Business Analyst"], salary: "£42,000–£62,000 starting", demand: "MBB consulting firms (McKinsey, BCG, Bain), Big Four advisory, and FTSE 100 graduate schemes recruit heavily from Imperial Business School MSc programmes — strong London / European hiring pipeline." },
                        { title: "MSc Life Sciences / Biology", duration: "12 Months", desc: "Faculty of Natural Sciences postgraduate programmes including MSc Biotechnology, MSc Computational Biology, and MSc Translational Neuroscience. International tuition £28,000–£38,000 per year (2025/26).", careers: ["Biomedical Researcher", "Pharmaceutical R&D Scientist", "Biotech R&D Lead"], salary: "£35,000–£55,000 starting", demand: "The UK's biotech and pharmaceutical sector — supercharged post-COVID — is creating sustained demand for Imperial Life Sciences master's graduates, particularly in computational biology and translational medicine." },
                        { title: "MSc Climate Change, Management and Finance", duration: "12 Months", desc: "Joint programme between the Business School and the Grantham Institute for Climate Change. Premium pricing at the Business School's MSc tier (£35,000+ international). Combines financial analysis with climate science and policy.", careers: ["ESG Analyst", "Sustainable Finance Specialist", "Climate Policy Advisor"], salary: "£45,000–£70,000 starting", demand: "ESG and sustainable finance roles are among the fastest-growing graduate sectors — major banks (HSBC, Barclays), asset managers (BlackRock, Aviva), and policy bodies (HM Treasury, UNEP FI) compete for Imperial graduates." },
                        { title: "President's PhD Programme", duration: "3 to 4 Years", desc: "Imperial's flagship doctoral pathway. International tuition £26,500–£32,000 per year for self-funded (Home rate pegged to UKRI £5,006 indicative for 2025/26). Most PhD candidates secure full funding via President's Scholarships, UKRI, or industry partnerships.", careers: ["University Faculty (Research / Teaching)", "Industry Research Scientist", "R&D Lab Director"], salary: "£35,000–£60,000 starting (Postdoc / Industry R&D)", demand: "Imperial PhDs dominate UK STEM research recruitment — alumni populate UK and US universities, AI labs (DeepMind, OpenAI), pharma R&D (AstraZeneca, GSK), and high-end industry research." },
                        { title: "Imperial–Wellcome Trust PhD Programme", duration: "4 Years", desc: "Fully-funded PhD programme for biomedical and life sciences researchers. Covers full international tuition fees and provides an enhanced clinical / scientific living stipend. Joint partnership with the Wellcome Trust — premier biomedical research training in the UK.", careers: ["Academic Clinician", "Biomedical Researcher", "Translational Medicine Lead"], salary: "£40,000–£70,000 starting (Postdoc / Clinical)", demand: "Wellcome Trust-funded PhDs are the gold-standard credential for academic medicine and biomedical research — alumni populate leading global universities, top biotech firms, and the WHO." },
                        { title: "Crick Institute Doctoral Programme", duration: "4 Years", desc: "Quantitative and Molecular Biology PhD delivered at the Francis Crick Institute (Europe's largest biomedical research institute). Full tuition fee coverage and specialised research support. Located in central London.", careers: ["Biomedical Researcher", "Computational Biologist", "Pharma R&D Scientist"], salary: "£38,000–£65,000 starting (Postdoc / Industry R&D)", demand: "Crick PhDs are extremely competitive — alumni populate the top tier of UK and global biomedical research, with strong recruitment from major pharma R&D (AstraZeneca, GSK, Pfizer) and emerging biotech firms." }
                    ],
                    scholarships: [
                        { title: "President's PhD Scholarship", amount: "Full tuition (Home or Overseas) + enhanced living stipend + research support budget", eligibility: "Outstanding global PhD applicants across all Imperial faculties — highly competitive merit-based selection", desc: "Imperial's flagship doctoral funding programme. Covers full tuition fees regardless of nationality, an enhanced living stipend (typically above the UKRI minimum), and a dedicated research support budget for conferences, equipment, and training. Multiple awards across all departments." },
                        { title: "India Future Leaders Scholarship", amount: "£10,000 tuition fee reduction (non-renewable)", eligibility: "Indian-domiciled students with a direct offer by April 6, 2026, for one-year MSc / MRes programme; English proficiency by June 30, 2026", desc: "Major direct financial commitment funding 30 Indian Master's students over three years with equal gender representation. Operates as an automatic tuition reduction — individual departments identify and rank eligible candidates from their standard applicant pool. No separate application required." },
                        { title: "Chevening – Imperial Scholarship", amount: "Full overseas tuition + monthly living stipend + return economy airfare", eligibility: "Indian citizens (Postgraduate Taught); 2:1 honours equivalent; minimum 2 years work experience; commitment to return to India for 2+ years", desc: "Joint scholarship between the Chevening programme (UK Foreign Office) and Imperial. Fully funds Indian master's students at Imperial. Requires commitment to return to India for at least two years after graduation. Application via the Chevening platform." },
                        { title: "President's Undergraduate Scholarship", amount: "Full tuition fees + £2,000 annual living stipend", eligibility: "All nationalities (outstanding undergraduates); automatic evaluation upon UCAS submission", desc: "Imperial's premier undergraduate award — covers full tuition fees plus a maintenance stipend. Open to all nationalities with exceptional academic profiles. No separate application required — automatic evaluation upon UCAS submission. Highly competitive single-digit selection rate." },
                        { title: "Alan Howard Scholarship", amount: "Up to £50,000 (covers full tuition + living stipend)", eligibility: "Overseas Taught Postgraduates with outstanding academic merit; full-time enrolment", desc: "One of Imperial's largest individual postgraduate awards. Covers full tuition fees and provides a living stipend for international master's students. Highly competitive merit-based selection — requires exceptional academic record and strong endorsements." },
                        { title: "CMA CGM Excellence Fund", amount: "Full overseas tuition + £19,500 annual stipend", eligibility: "Overseas Postgraduates (non-Lebanese awards); full-time enrolment with strong academic merit", desc: "Fully-funded postgraduate scholarship covering overseas tuition fees plus a generous annual stipend. Designed to attract top international talent to Imperial's master's programmes. Competitive merit-based selection." },
                        { title: "Imperial Bursary", amount: "£500 — £5,000 per year (Standard) / £5,500 (Care leavers + £500 supplement)", eligibility: "UK undergraduates — assessed household income tiers up to £70,000 (full bursary at £0–£16,000)", desc: "Non-repayable grant for domestic undergraduates. Automatically assessed via Student Finance England. Tiered awards: £5,000/year (income ≤£16,000), £4,400 (£16,001–£50,000), £3,300 (£50,001–£55,000), £2,200 (£55,001–£60,000), £500 (£60,001–£70,000). Care leavers receive +£500." },
                        { title: "MBBS Clinical-Year Bursary (Expanded 2026/27)", amount: "£1,100 — £9,500 per year (Years 5–6 London) / £1,125 — £4,600 (Cumbria Graduate Entry Years 2–4)", eligibility: "UK MBBS students entering clinical years from 2026/27 onwards", desc: "Major expansion of Imperial Bursary for medical students during clinical years. Tiered by household income: highest awards (£9,500) at income ≤£16,000. Rises further in 2027/28 (peak £10,400). Designed to offset NHS placement costs and long-term medical training burden." },
                        { title: "GREAT Scholarship", amount: "£10,000 tuition fee reduction", eligibility: "Eligible overseas partner-country citizens with high academic achievement", desc: "UK government-backed scholarship in partnership with select overseas countries. Tuition reduction for high-achieving international students. Competitive selection — requires strong academic record plus partner-country citizenship." },
                        { title: "IB Excellence Scholarship", amount: "£5,000 per annum throughout the course", eligibility: "International Baccalaureate (IB) Diploma students with overseas-fee status and exceptional IB results", desc: "Annual £5,000 scholarship for the duration of the undergraduate degree. Open to international students completing the IB Diploma with exceptional results (typically 40+ points with high Higher Level scores in relevant subjects)." },
                        { title: "Amelia and John Kentfield PhD Scholarship", amount: "Full tuition fee coverage (Home or Overseas) + approximately £25,000 annual living stipend", eligibility: "Doctoral researchers (Taught or Research route)", desc: "Fully-funded PhD scholarship covering tuition fees regardless of fee status, plus a generous living stipend (~£25,000 per year — above standard UKRI rates). Open across Imperial's research departments." }
                    ]
                },
                ucl: {
                    name: "UCL — University College London", shortName: "UCL", cityId: "london_uk",
                    cityName: "London, England", rank: "9", tuition: "£32,000 — £57,300 (International, 2026/27)",
                    heroImage: "https://images.pexels.com/photos/9998410/pexels-photo-9998410.jpeg",
                    overview: "Established in 1826 and recently celebrating its bicentenary in 2026, UCL (University College London) is one of the world's leading multidisciplinary universities and consistently ranks among the global top 10 — placing #9 in the QS World University Rankings 2026 with an overall score of 95.8/100. Located in the Bloomsbury area of central London with its iconic Wilkins Building portico on Gower Street, UCL was the first university institution founded in London and the first in England to be entirely secular and to admit students regardless of their religion. It was also the second institution in the UK (1878) to admit women alongside men. UCL is organised into 11 faculties offering 400+ undergraduate and 650+ postgraduate programmes across virtually every discipline, with particular strength in The Bartlett (ranked #1 globally in Architecture and Built Environment for over a decade), Engineering, Medicine, Pharmacy (QS #5 worldwide), Education, Economics, and Computer Science (QS #18 globally — founding partner of the Alan Turing Institute). UCL has 30+ Nobel Laureates among its alumni and academics, is a member of the Russell Group, the League of European Research Universities, and contributes around £10 billion annually to the UK economy.",
                    quickFacts: ["QS World Rank 2026: #9 Globally (95.8/100 score)", "Acceptance Rate: ~10–24% (Offer Rate ~43%)", "Founded: 1826 — Celebrating Bicentenary in 2026", "Total Students: 50,000+ (largest individual university in the UK)", "International Students: ~48% of student body, from 150+ countries", "Faculties: 11 covering 400+ UG and 650+ PG programmes", "Nobel Laureates: 30+ associated with UCL", "Total Income (2023/24): £2.03 billion; Endowment: £174.8 million", "Notable for: The Bartlett (#1 globally Architecture), UCL Medical School, Slade School of Fine Art", "Located in Bloomsbury, central London — next to British Museum and British Library", "Founding partner of the Alan Turing Institute (UK's national institute for data science and AI)"],
                    financialReqs: "International undergraduate tuition for 2026/27 entry ranges from £26,200 to £47,000 per year depending on the programme — Arts, Humanities and Social Sciences typically cost £25,000–£28,000, while STEM subjects, Architecture (BSc) and Computer Science range from £33,000 to £40,000, and Medicine (MBBS) reaches the higher end. Postgraduate international tuition ranges from £26,200 to £57,700 per year (e.g. MSc Management in Business approx. £32,100; MBA programmes are higher). UCL operates a 'cohort guarantee' meaning international undergraduate tuition is fixed at the point of entry and does not rise during the standard course duration (excluding MBBS Medicine and Intercalated years). UK undergraduate tuition for 2026/27 is £9,790. UCL estimates additional living costs of approximately £16,447 per year for undergraduates (39-week academic year) and £22,427 per year for postgraduates (52-week academic year) — covering rent, food, transport, books and personal expenses. International applicants must demonstrate funds for both tuition and living costs to obtain a UK Student Visa. Key funding routes for international students include the UCL Global Undergraduate Scholarship, the UCL India Excellence Scholarship (£5,000 tuition reduction for Indian master's students), the Denys Holland Scholarship, Chevening, Commonwealth, JN Tata Endowment, and Inlaks Foundation awards.",
                    admissionRequirements: [
                        "Acceptance Rate: ~10–24% overall (Offer Rate ~43%) — far more selective for Computer Science, Law, Medicine, Architecture, and Economics",
                        "Application Deadline (Undergraduate): 14 January 2027 via UCAS for September 2027 entry; 15 October 2026 for Medicine, Dentistry, and Veterinary courses",
                        "Application Deadline (Postgraduate): Varies by course, typically between March and June 2026 for September 2026 entry",
                        "Required Tests: For 2026 entry, selected programmes require the TARA test (Test of Academic Reasoning Assessment, £130 registration, taken at Pearson VUE test centres) — Medicine requires the UCAT, Architecture requires a portfolio",
                        "English Requirement: IELTS Academic 6.5–7.5 overall (course-dependent), TOEFL iBT 92–109, or Cambridge C1 Advanced / C2 Proficiency at Grade B or above",
                        "Indian Qualifications: For UG, only ISC (CISCE), CBSE, and HSC from Karnataka, Maharashtra, Tamil Nadu, or West Bengal boards are accepted. For PG, a first-class (60–70%) or high second-class (55–60%) 3–5 year bachelor's degree is required",
                        "Application Fee: £28.95 for undergraduate (via UCAS), £35–£160 for postgraduate (varies by course)",
                        "Intake: UCL offers ONLY the September intake for international admissions — no January or summer intake"
                    ],
                    applicationDeadlines: [
                        "Undergraduate UCAS Deadline (Standard): 14 January 2027 at 18:00 UK time — UCAS equal consideration deadline for all UCL undergraduate courses EXCEPT Medicine, Dentistry, and Veterinary Medicine",
                        "Medicine (A100) UCAS Deadline: 15 October 2026 at 18:00 UK time — same date as Oxford and Cambridge; UCAT must be sat between July and early October 2026",
                        "Architecture Portfolio Deadline: 14 January 2027 — submit alongside UCAS application; UCL's Bartlett School of Architecture requires a 10–15 image portfolio uploaded via UCL's MyPortfolio system",
                        "TARA Test (Test of Academic Reasoning Assessment): Required for selected programmes including Economics, Statistics & Economics, and Philosophy, Politics & Economics — register via Pearson VUE for sittings in late October 2026 (£130)",
                        "UCAS Application Review: UCL reviews applications received before the 14 January deadline equally; offers issued on a rolling basis from December 2026 through March 2027 — earlier submissions generally receive earlier decisions",
                        "Interview Window (selected courses): Most STEM and humanities programmes do not interview; Medicine uses Multiple Mini Interview (MMI) format December 2026 – February 2027; Architecture and Fine Art conduct portfolio reviews",
                        "Reply-By Date (Undergraduate Offers): Early May 2027 via UCAS — firm / insurance choice replies",
                        "Postgraduate Application Opens: 15 October 2026 for September 2027 entry — UCL accepts postgraduate applications via the UCL Graduate Application Portal",
                        "Postgraduate Deadlines: Most taught masters (MSc, MA, MRes) have main deadlines between 1 March 2027 and 30 June 2027; competitive courses (Computer Science MSc, Economics MSc, MBA, Bartlett March) close earlier (often 1–28 February 2027); international applicants needing visa processing should treat 31 March 2027 as a working target",
                        "PhD / MPhil Applications: Most departments accept rolling applications throughout the year; UCL Graduate Research Scholarships have deadlines in mid-January 2027 and early March 2027",
                        "Chevening Scholarship Deadline: Early November 2026 — UK-government funded postgraduate scholarship (UCL is a major Chevening partner)",
                        "Commonwealth Scholarships Deadline: Mid-November 2026 — separate UK national selection",
                        "Visa Processing: UCL strongly recommends confirming your offer by 30 June 2027 to allow at least 8–10 weeks for Confirmation of Acceptance for Studies (CAS) issuance and UK Student Visa application",
                        "Best Time to Apply: Submit UCAS as early as September–October 2026 — UCL reviews on a rolling basis, and competitive courses (CS, Economics, Law) typically issue most offers by February. Postgraduate applicants should target 1 February 2027 for best scholarship odds",
                        "Application Opens: UCAS opens 13 May 2026; UCL Graduate Application Portal opens 15 October 2026"
                    ],
                    bachelors: [
                        { title: "Medicine MBBS BSc (A100)", duration: "6 Years", desc: "UCL Medical School's flagship clinical degree. International tuition £57,300 per year — the highest in UCL's portfolio due to clinical training overheads and NHS placement costs. Excluded from the cohort guarantee and adjusted annually using the RPI-X inflation formula.", careers: ["Doctor (NHS / Private)", "Surgical Specialist", "Clinical Researcher"], salary: "£35,000 (Foundation Year) rising to £100,000+ (Consultant)", demand: "Severe global physician shortages and post-pandemic NHS workforce expansion guarantee exceptionally strong demand for UCL Medicine graduates worldwide." },
                        { title: "Computer Science BSc (G400)", duration: "3 Years", desc: "Delivered by UCL's QS #18 ranked Computer Science department — a founding partner of the Alan Turing Institute. International tuition £46,700 per year. Covers algorithms, AI, machine learning, software systems and computing infrastructure.", careers: ["Software Engineer", "AI / ML Engineer", "Quantitative Developer"], salary: "£45,000–£90,000 starting (London tech / finance)", demand: "AI infrastructure and software engineering remain the fastest-growing graduate sectors in the UK, with London tech and quant finance offering top-tier compensation to UCL CS graduates." },
                        { title: "Economics and Statistics BSc (LG13)", duration: "3 Years", desc: "Highly quantitative joint programme combining microeconomic and macroeconomic theory with rigorous statistical modelling and econometrics. International tuition £42,700 per year.", careers: ["Quantitative Analyst", "Data Economist", "Investment Banking Analyst"], salary: "£40,000–£75,000 starting", demand: "Hedge funds, central banks and consulting firms are aggressively recruiting graduates with combined economics and statistics training to drive data-led financial modelling." },
                        { title: "Economics BSc (Econ) (L100)", duration: "3 Years", desc: "UCL's flagship economics degree. Covers microeconomic and macroeconomic theory, econometrics, calculus, and applied economic analysis using large quantitative datasets. International tuition £39,200 per year.", careers: ["Economist", "Management Consultant", "Policy Analyst"], salary: "£38,000–£65,000 starting", demand: "Demand for economics graduates remains strong across investment banking, consulting (MBB), Bank of England, HM Treasury, and global policy institutions." },
                        { title: "Law LLB (M100)", duration: "3 Years", desc: "Qualifying Law Degree (QLD) accredited for both solicitor and barrister training pathways in England and Wales. International tuition £35,400 per year. Library-centric programme covering contract, tort, criminal, public, EU and property law.", careers: ["Corporate Solicitor (Magic Circle)", "Barrister", "In-House Counsel"], salary: "£50,000–£130,000 starting (Magic Circle trainees)", demand: "London's Magic Circle and US-headquartered law firms continue to recruit UCL Law graduates with starting salaries that produce one of the fastest payback periods (1–2 years) of any UK degree." },
                        { title: "Law LLB (UCL & HKU Dual Degree) (M103)", duration: "4 Years", desc: "Dual-jurisdiction degree spanning UCL (Years 1–2) and the University of Hong Kong (Years 3–4). Tuition at UCL is £32,000 per year for the UCL portion only. Qualifies graduates for legal practice in both common-law jurisdictions.", careers: ["International Corporate Lawyer", "Cross-Border M&A Counsel", "Asia-Pacific Legal Specialist"], salary: "£60,000–£150,000+ starting in Hong Kong / London", demand: "Dual-jurisdiction lawyers are in extremely high demand for cross-border deals between the UK, EU and Asia-Pacific — UCL/HKU graduates regularly secure offers from US, UK and Hong Kong elite firms." },
                        { title: "French and Yiddish BA", duration: "4 Years", desc: "Joint honours language-centric degree from UCL's School of European Languages, Culture and Society — one of very few institutions worldwide to offer Yiddish at degree level. International tuition £32,000 per year. Includes a compulsory year abroad.", careers: ["Translator / Interpreter", "Cultural Heritage Curator", "Academic Researcher"], salary: "£28,000–£42,000 starting", demand: "Niche but highly specialised — strong demand from European cultural institutions, archives, the UN translation services, and global heritage organisations." },
                        { title: "Applied Medical Sciences BSc (Hons)", duration: "3 Years", desc: "Bridges clinical medicine and basic research with clinical placement modules at UCL-partnered NHS trusts. Suitable preparation for medicine graduate-entry, research, or biomedical careers.", careers: ["Biomedical Researcher", "Graduate-Entry Medicine Applicant", "Clinical Trials Coordinator"], salary: "£28,000–£40,000 starting", demand: "Biomedical research and clinical trials infrastructure are expanding rapidly across London's Golden Triangle (UCL, Imperial, Crick Institute) — strong demand for translational research talent." },
                        { title: "Biochemical Engineering MEng", duration: "4 Years", desc: "Integrated master's degree exploring industrial biotechnology, bioreactor design, bioprocessing and the rapidly growing bioenergy sector. Includes a major industrial research project in the final year.", careers: ["Bioprocess Engineer", "Pharmaceutical Manufacturing Lead", "Biotech R&D Specialist"], salary: "£35,000–£55,000 starting", demand: "The UK's biotech and vaccine manufacturing sector — supercharged post-COVID — is creating sustained demand for biochemical engineers, particularly in Stevenage, Oxford and Cambridge biotech clusters." },
                        { title: "Pharmacy MPharm (Hons)", duration: "4 Years", desc: "Professional clinical curriculum required for pharmacist registration with the General Pharmaceutical Council (GPhC). UCL's School of Pharmacy is ranked QS #5 worldwide. Includes integrated clinical placements.", careers: ["Hospital Pharmacist", "Community Pharmacist", "Pharmaceutical Industry Specialist"], salary: "£37,000–£50,000 starting (post-registration)", demand: "Acute NHS pharmacist shortages and the expansion of community pharmacy services in England guarantee strong, stable employment for MPharm graduates with extended prescribing roles emerging from 2026." }
                    ],
                    masters: [
                        { title: "MSc Finance", duration: "1 Year", desc: "UCL School of Management's flagship finance master's, delivered at the Bloomsbury campus. International tuition £48,250 per year (2026/27) — positioned alongside LSE Finance (£51,000) and Imperial Finance (£47,500). Strong pipeline into investment banking and corporate finance.", careers: ["Investment Banker", "Corporate Finance Associate", "Quantitative Analyst"], salary: "£55,000–£90,000+ starting (IB roles £90,000 plus bonus)", demand: "London's financial sector continues to recruit aggressively from UCL Finance — total programme investment (£65,000–£72,000 including living) typically pays back within 2–3 years." },
                        { title: "MSc Marketing Science", duration: "1 Year", desc: "Delivered at UCL's Canary Wharf campus — in the heart of London's commercial district. Notably charges a flat £46,700 fee for both Home and International students, reflecting strong global market demand.", careers: ["Marketing Strategist", "Brand Manager", "Digital Marketing Analyst"], salary: "£42,000–£65,000 starting", demand: "AI-driven marketing analytics, performance marketing and consumer data science are creating sustained demand for marketing professionals with strong quantitative training." },
                        { title: "MSc Management", duration: "1 Year", desc: "UCL School of Management's flagship pre-experience management master's, delivered at both Bloomsbury and Canary Wharf campuses. Flat fee of £42,700 for Home and International students.", careers: ["Management Consultant", "Strategy Analyst", "Graduate Programme Associate"], salary: "£40,000–£60,000 starting", demand: "Top-tier consulting firms (MBB, Big Four) and graduate management programmes at major UK and European corporates recruit heavily from UCL MSc Management." },
                        { title: "MSc Data Science", duration: "1 Year", desc: "Delivered by the Department of Statistical Science at UCL's Bloomsbury campus. International tuition £46,700 per year. Combines advanced statistics, machine learning, and applied data science with industry-oriented projects.", careers: ["Data Scientist", "ML Engineer", "AI Research Associate"], salary: "£48,000–£80,000 starting", demand: "London's tech sector and the wider European AI market continue to face severe shortages of data scientists with formal quantitative training — UCL graduates are highly sought after." },
                        { title: "MSc Computer Science", duration: "1 Year", desc: "Conversion-style master's for graduates without a primary CS background. Home tuition £21,500; International tuition £42,700. Covers programming, algorithms, AI, software systems and computer architecture.", careers: ["Software Engineer", "Backend Developer", "Technical Consultant"], salary: "£42,000–£75,000 starting", demand: "Conversion master's in CS are one of the most direct paths into UK tech — UCL's Computer Science department (QS #18) is a founding Alan Turing Institute partner with strong industry links." },
                        { title: "MSc Artificial Intelligence & Data Engineering", duration: "1 Year", desc: "Department of Computer Science. International tuition £42,700. Focused on the engineering side of AI systems — data pipelines, MLOps, large-scale ML infrastructure, and applied AI.", careers: ["AI Engineer", "Data Engineer", "MLOps Specialist"], salary: "£50,000–£85,000 starting", demand: "The shift from AI research to AI engineering and deployment has created the fastest-growing job category in UK tech — AI engineers regularly out-earn pure software engineers in 2026." },
                        { title: "MSc Economics", duration: "1 Year", desc: "Rigorous one-year quantitative economics master's from UCL's Department of Economics. International tuition £39,200 per year. Strong preparation for PhD pathways, central banking, and economic consultancy.", careers: ["Economic Consultant", "Central Bank Economist", "PhD Candidate"], salary: "£42,000–£68,000 starting", demand: "Central banks (Bank of England, ECB), HM Treasury, OBR and major consulting firms continue to compete for graduates of UCL MSc Economics." },
                        { title: "MASc Creative Health", duration: "1 Year", desc: "Innovative Master of Arts and Sciences programme bridging the creative arts, health humanities and clinical practice. Home tuition £16,800; International tuition £35,400. Suitable for clinicians, artists, and public health professionals.", careers: ["Arts in Health Coordinator", "Creative Therapist", "Health Policy Specialist"], salary: "£32,000–£48,000 starting", demand: "The NHS Long Term Plan and the rise of social prescribing are creating new demand for graduates trained at the intersection of creative arts and public health." },
                        { title: "MA Comparative Literature", duration: "1 Year", desc: "Centre for Multidisciplinary and Intercultural Inquiry (CMII). Home tuition £16,800; International tuition £35,400. Critical and theoretical study of literature across languages, cultures and historical periods.", careers: ["Academic / PhD Candidate", "Editor / Publisher", "Cultural Critic"], salary: "£28,000–£42,000 starting", demand: "Stable demand in academic publishing, literary editing, university research, and cultural institutions — common pathway to fully-funded PhD programmes." },
                        { title: "MBA — UCL Flex MBA", duration: "2 to 5 Years", desc: "Flexible AMBA-accredited MBA delivered online or in a hybrid model for working professionals. Total programme fee £42,500 (paid across the duration of study). Asynchronous and modular structure.", careers: ["Senior Manager", "Director / VP", "Career-Changer Executive"], salary: "Median post-MBA salary £75,000–£110,000", demand: "Flexible executive MBA formats are the fastest-growing segment of UK business education in 2026 — Flex MBA suits ambitious mid-career professionals who cannot pause work." },
                        { title: "Major Infrastructure Delivery MBA", duration: "2 Years (Part-Time)", desc: "Specialised part-time MBA targeted at mid-career professionals in construction, civil engineering, and major infrastructure. £25,300 per annum. UCL's Bartlett School (QS #1 globally for Architecture and Built Environment).", careers: ["Infrastructure Project Director", "Construction Programme Manager", "Built Environment Strategist"], salary: "£75,000–£120,000 post-MBA", demand: "The UK government's £600bn+ infrastructure pipeline (HS2, Sizewell C, nuclear new build, transport) is driving extreme demand for senior infrastructure executives — Bartlett's MBA is uniquely positioned." }
                    ],
                    scholarships: [
                        { title: "UCL Global Undergraduate Scholarship", amount: "Full tuition + maintenance (top tier) or full tuition only", eligibility: "International undergraduate applicants from lower-income backgrounds — up to 33 awards in 2026/27 (including 3 ring-fenced for India)", desc: "10 awards cover full tuition, maintenance allowance and a fixed visa/IHS allowance; 20 awards cover full tuition only; 3 awards cover full tuition for Indian students. Apply via Portico by 27 April 2026; decisions by 3 June 2026." },
                        { title: "UCL Global Master's Scholarship", amount: "£15,000 (one year)", eligibility: "International postgraduate taught students from lower-income backgrounds — up to 85 awards (5 ring-fenced for Indian nationals)", desc: "One-year award of £15,000 to support international PGT students. Distance-learning programmes excluded. Application deadline: 7 May 2026." },
                        { title: "UCL India Excellence Scholarship", amount: "£5,000 tuition reduction", eligibility: "Indian master's applicants with verified first-class GPA from NIRF Top 100 institution", desc: "Up to 33 awards of £5,000 each. No separate application required — eligible Indian candidates holding a conditional or unconditional offer are automatically considered. Apply for admission by 26 February 2026." },
                        { title: "Denys Holland Scholarship", amount: "£9,000 per year for 3 years", eligibility: "Undergraduate applicants of any nationality demonstrating financial need and commitment to extracurricular life", desc: "Renewable for the full duration of an undergraduate degree subject to satisfactory academic progress. Ideally aged 25 or younger at start of studies. Apply by 6 July 2026." },
                        { title: "UCL Undergraduate Bursary", amount: "£1,000 — £3,000 per year (plus laptop loan)", eligibility: "Home (UK) undergraduates with verified household income ≤£42,875", desc: "Automatically assessed via Student Finance England/Wales/NI/SAAS. £3,000/year for income ≤£16,000; £2,000 for £16,001–£25,000; £1,500 for £25,001–£37,000; £1,000 for £37,001–£42,875. All recipients also receive a laptop loan for the duration of studies." },
                        { title: "UCL Master's Bursary", amount: "Up to £10,000", eligibility: "UK-domiciled postgraduate students with household income ≤£42,875", desc: "Up to 200 awards of £10,000 each, based on financial need. Targeted support for Home master's students from lower-income backgrounds." },
                        { title: "Access Opportunity Scholarship", amount: "Full tuition + £13,762 annual study allowance", eligibility: "Students unable to access UK student loans due to immigration status (asylum seekers, forced migrants)", desc: "Two scholarships covering full tuition fees and an annual maintenance allowance based on 2025/26 rates. Application deadline: 18 May 2026." },
                        { title: "JN Tata Endowment Loan Scholarship", amount: "₹1,00,000 — ₹10,00,000 (low-interest loan)", eligibility: "Indian citizens under 45 holding an undergraduate degree", desc: "Legacy loan programme for Indian postgraduate study abroad. May include a ₹50,000 travel grant and ₹75,000 gift. Requires a tailored Statement of Purpose and academic references." },
                        { title: "Inlaks Shivdasani Foundation Scholarship", amount: "Up to USD 100,000 (~£76,897)", eligibility: "Indian citizens under 30 — excludes MBA, finance, computer science, and clinical medicine", desc: "Full-ride postgraduate award covering tuition, living expenses, one-way airfare and a health allowance. Requires UCL offer, passport copy and two academic references." }
                    ]
                },
                lse: {
                    name: "LSE — London School of Economics", shortName: "LSE", cityId: "london_lse",
                    cityName: "London, England", rank: "56", tuition: "£28,900 — £51,000 (International, 2026/27)",
                    heroImage: "https://images.pexels.com/photos/16771428/pexels-photo-16771428.png",
                    overview: "Founded in 1895 by Fabian Society members Sidney Webb, Beatrice Webb, Graham Wallas, and the playwright George Bernard Shaw, the London School of Economics and Political Science (LSE) is a public research university specialising almost entirely in the pure and applied social sciences. Located in central London near the boundary between Covent Garden and Holborn (Clare Market area), LSE is the global leader in economics, politics, law, sociology, anthropology, international relations, and public policy. Originally a constituent college of the University of London, LSE began awarding its own degrees in 2008 and became a university in its own right within the University of London system in 2022. Despite its smaller size compared to other elite UK universities, LSE has produced extraordinary global influence — 21 Nobel Prize laureates (including 13 in Economics, making LSE's Economics Department known as a 'cradle of Nobel laureates'), 40+ world leaders and heads of state (including UK PM Clement Attlee, former IMF Managing Director Kristalina Georgieva, and European Commission President Ursula von der Leyen), and 24 prime ministers or presidents educated since 1990 alone — the second highest of any UK university. LSE is part of the 'Golden Triangle' of elite research universities and a member of the Russell Group.",
                    quickFacts: ["QS World Rank 2026: #56 Globally; #1 in the UK by Times & Sunday Times Good University Guide 2026", "Acceptance Rate: ~6.5–9% Overall (one of the most selective in the world)", "Founded: 1895 by the Fabian Society", "Total Students: ~12,910 (5,680 UG / 7,230 PG)", "International Students: ~70% of student body, from 150+ nationalities", "Specialism: Pure and applied social sciences — Economics, Politics, Law, Sociology, IR", "Nobel Laureates: 21 (including 13 in Economic Sciences alone)", "World Leaders Educated: 40+ heads of state and government", "Programmes Offered: 40+ undergraduate, 140+ postgraduate, plus PhD/MPhil", "LSE Library: British Library of Political and Economic Science — largest social sciences library in the world", "Single central London campus near Holborn — Russell Group member"],
                    financialReqs: "International undergraduate tuition for 2026/27 entry ranges from £28,900 to £35,700 per year depending on the programme. Most undergraduate degrees (BSc Economics, BSc Government, BSc International Relations, LLB Law) sit in the £28,900–£32,000 range, with selected specialised programmes reaching £35,700. Postgraduate international tuition ranges from £30,400 (most MSc programmes) to £41,000+ (MSc Management, MSc Finance) and significantly higher for executive and MBA-style programmes at LSE's Department of Management. UK Home undergraduate fees are £9,790 for 2026/27. LSE estimates that students need an additional £14,500–£16,500 per year for living costs in central London — total annual cost (tuition + living) is approximately £43,400–£52,000 for international undergraduates. LSE provides £15+ million annually in financial aid, with around 25% of graduate students receiving school funding. Major funding routes include the LSE Undergraduate Support Scheme, LSE Master's Awards (10%–100% of tuition + maintenance), Graduate Support Scheme, Anniversary Scholarships, Uggla Family Scholars Programme, LSE PhD Studentships (fully funded), Chevening, Commonwealth, and Fulbright awards.",
                    admissionRequirements: [
                        "Acceptance Rate: ~6.5–9% overall — among the lowest globally; Economics is most competitive at ~6–7%, Politics & International Relations below 4%",
                        "Application Deadline (Undergraduate): 14 January 2026 (18:00 UK time) via UCAS — LSE rarely participates in UCAS Clearing or Extra, so the main deadline is critical",
                        "Application Deadline (Postgraduate): Most master's programmes have rolling admissions but with funding deadlines typically in late January / early February 2026",
                        "Required Tests: TMUA (Test of Mathematics for University Admission) is MANDATORY for BSc Economics, BSc Mathematics, and several Finance/Management programmes for 2026 entry; LNAT required for LLB Law",
                        "Interviews: LSE does NOT typically interview undergraduate applicants — admission is based on UCAS application, personal statement, references and required tests",
                        "Academic Requirements: A-levels typically A*AA to AAA (with A* in Mathematics for Economics); IB 38–42 points; SAT 1500+ acceptable as supplementary qualification",
                        "English Requirement: IELTS Academic 7.0 overall (no element below 6.5) for Standard; 7.5 overall for Higher level courses (Law, English-intensive programmes); TOEFL iBT 100+",
                        "Indian Qualifications: ISC/CISCE or CBSE Class XII with 95%+ in best four subjects including required subjects; for PG, a strong first-class bachelor's degree (CGPA 8.0+/10) from a top-tier Indian university is expected"
                    ],
                    applicationDeadlines: [
                        "Undergraduate UCAS Deadline: 14 January 2027 at 18:00 UK time — UCAS equal consideration deadline for ALL LSE undergraduate courses; LSE rarely participates in UCAS Extra or Clearing, so missing this deadline almost always means waiting for the next cycle",
                        "TMUA Registration Deadline: Mid-September 2026 — MANDATORY for BSc Economics, BSc Mathematics & Economics, BSc Econometrics & Mathematical Economics, BSc Finance, BSc Financial Mathematics & Statistics, and several Management programmes; register via Pearson VUE",
                        "TMUA Sitting Windows: Two opportunities — October 2026 and early January 2027; LSE will consider the higher of the two scores",
                        "LNAT Registration Deadline: 15 September 2026 for LLB Law applicants; LNAT must be sat by 25 January 2027 (booking opens August 2026 — popular slots fill quickly)",
                        "Application Review Cadence: LSE reviews UCAS applications on a rolling basis from October 2026, but does NOT issue offers earlier than December; the majority of decisions are released between January and April 2027",
                        "Reply-By Date (Undergraduate Offers): Early May 2027 via UCAS — firm / insurance choice replies",
                        "Postgraduate Application Opens: Early October 2026 for September 2027 entry — LSE accepts postgraduate applications via the LSE Graduate Admissions portal",
                        "Postgraduate Priority / Scholarship Deadline: 6 January 2027 — applications received by this date are automatically considered for all LSE scholarships including LSE Master's Awards (need-based, up to £15,000) and the LSE Graduate Support Scheme",
                        "Postgraduate Standard Deadlines: Most taught master's (MSc) programmes operate rolling admissions but close in spring–early summer 2027; ultra-competitive programmes (MSc Economics, MSc Finance, MSc Financial Mathematics, MSc Data Science) typically close by late January / early February 2027",
                        "LSE MBA / Executive MBA: Multiple application rounds — Round 1 mid-October, Round 2 early January, Round 3 mid-March; international applicants strongly advised to apply by Round 2 for visa processing",
                        "PhD / MPhil Applications: Most LSE departments have a January deadline (8 January 2027) for ESRC Doctoral Training Partnership funding and LSE PhD Studentships",
                        "Chevening Scholarship Deadline: Early November 2026 — LSE is one of the UK's largest Chevening partners hosting ~200+ Chevening Scholars per year",
                        "Commonwealth Scholarships Deadline: Mid-November 2026 — separate UK national selection",
                        "Visa Processing: International applicants should confirm offers by 30 June 2027 to allow at least 8 weeks for Confirmation of Acceptance for Studies (CAS) issuance and Student Visa application — LSE recommends applying for the visa as soon as CAS is received",
                        "Best Time to Apply: Submit UCAS as early as October–November 2026 — LSE reviews on a rolling basis but issues offers from December onward; for postgraduate applicants, target submission by 6 January 2027 to maximise scholarship odds and beat the closure of ultra-competitive MSc programmes",
                        "Application Opens: UCAS opens 13 May 2026; LSE Graduate Admissions portal opens early October 2026"
                    ],
                    bachelors: [
                        { title: "BSc Economics", duration: "3 Years", desc: "LSE's flagship and most competitive undergraduate degree — ranked 4th globally for Economics and Econometrics. Highly mathematical, covering microeconomics, macroeconomics, econometrics and calculus. International tuition £39,900 per year. ~4,000 applications for ~200 places (acceptance rate ~5%).", careers: ["Investment Banker", "Economic Consultant", "Central Bank Analyst"], salary: "£45,000–£75,000 starting (IB roles reach £90,000+ with bonus)", demand: "Global investment banks (Goldman Sachs, JPMorgan, Morgan Stanley), MBB consulting firms and hedge funds compete intensely for LSE Economics graduates — among the highest-earning UK undergraduate degrees." },
                        { title: "BSc Econometrics and Mathematical Economics", duration: "3 Years", desc: "Highly technical degree prioritising formal mathematical proofs, advanced statistical theory and rigorous econometric modelling. International tuition £39,900 per year. Strong preparation for PhD pathways and quantitative finance.", careers: ["Quantitative Researcher", "Econometrician", "PhD Candidate (Economics)"], salary: "£50,000–£85,000 starting (quant roles £90,000+)", demand: "Quantitative hedge funds (Citadel, Jane Street, Two Sigma), central banks and top-tier PhD programmes consistently recruit from this small, elite cohort." },
                        { title: "BSc Accounting and Finance", duration: "3 Years", desc: "Focuses on institutional accounting systems, capital markets, mathematical methods and statistical theory, alongside the interdisciplinary LSE100 course. International tuition £35,700 per year.", careers: ["Investment Banking Analyst", "Big Four Auditor", "Equity Research Analyst"], salary: "£45,000–£70,000 starting", demand: "Big Four accounting firms (Deloitte, PwC, EY, KPMG) and London-based investment banks have dedicated LSE recruitment pipelines for this degree." },
                        { title: "BSc Finance", duration: "3 Years", desc: "Covers corporate finance, asset valuation, quantitative analysis, macroeconomics, calculus and financial accounting. International tuition £35,700 per year. Strong industry-orientation with City of London networking opportunities.", careers: ["Investment Banker", "Asset Manager", "Corporate Finance Analyst"], salary: "£48,000–£75,000 starting", demand: "London remains Europe's leading financial centre — LSE Finance graduates dominate intake at Magic Circle banks, Tier-1 asset managers and global hedge funds." },
                        { title: "BSc Management", duration: "3 Years", desc: "Combines accounting, corporate finance, marketing, organisational behaviour, Human Resource Management and third-year organisational strategy. International tuition £35,700 per year. Acceptance rate 12–15%.", careers: ["Management Consultant", "Brand Strategist", "Graduate Leadership Programme Associate"], salary: "£42,000–£60,000 starting", demand: "MBB consulting (McKinsey, BCG, Bain), Big Four advisory, and FTSE 100 graduate schemes recruit heavily from LSE Management." },
                        { title: "BSc Mathematics and Economics", duration: "3 Years", desc: "Joint programme blending pure mathematics, calculus, linear algebra with microeconomic and macroeconomic modelling. International tuition £35,700 per year. Excellent preparation for quantitative finance and PhD pathways.", careers: ["Quantitative Analyst", "Data Scientist", "Economic Researcher"], salary: "£50,000–£80,000 starting", demand: "Algorithmic trading desks, fintech startups and quantitative consulting firms in London are aggressively hiring graduates with combined mathematical and economic rigour." },
                        { title: "LLB in Laws", duration: "3 Years", desc: "Qualifying Law Degree covering contract, public, criminal, tort, property law and legal theory. International tuition £35,700 per year. ~2,600 applications for ~170 places (acceptance rate 6–8%). LNAT required.", careers: ["Magic Circle Solicitor", "Barrister", "Corporate Counsel"], salary: "£50,000–£130,000 starting (Magic Circle trainees)", demand: "LSE Law is the second-most competitive law degree in the UK after Oxford — graduates dominate Magic Circle (A&O, Clifford Chance, Freshfields, Linklaters, Slaughter and May) recruitment." },
                        { title: "BSc International Relations", duration: "3 Years", desc: "Explores geopolitical dynamics, foreign policy, conflict resolution, international security and the history and theory of global governance. International tuition £30,700 per year. LSE ranks among the global top 5 for IR. Acceptance rate 10–12%.", careers: ["Diplomat / Foreign Service Officer", "Geopolitical Risk Analyst", "International NGO Director"], salary: "£35,000–£60,000 starting", demand: "Strong demand from the UK Foreign Office, UN, EU institutions, geopolitical risk consultancies (Eurasia Group) and major think tanks (Chatham House, RUSI)." },
                        { title: "BSc Politics", duration: "3 Years", desc: "Analyses political theory, comparative government, public policy and institutional frameworks. International tuition £28,900 per year. LSE Government Department ranked 5th globally for Politics. Acceptance rate 8–10%.", careers: ["Political Researcher", "Special Adviser (SpAd)", "Public Policy Analyst"], salary: "£32,000–£52,000 starting", demand: "Whitehall (Civil Service Fast Stream), political parties, parliamentary research and think tanks all recruit from LSE Politics — strong pipeline to UK and EU policy careers." },
                        { title: "BSc Psychological and Behavioural Science", duration: "3 Years", desc: "Combines cognitive psychology and social psychology with behavioural economics to understand human decision-making in institutional contexts. International tuition £30,700 per year.", careers: ["Behavioural Insights Consultant", "UX Researcher", "Clinical Psychology (Post-Master's)"], salary: "£35,000–£55,000 starting", demand: "Behavioural science is a fast-growing field — UK Cabinet Office Behavioural Insights Team, tech companies and consultancies are scaling behavioural teams rapidly in 2026." },
                        { title: "BSc Philosophy, Politics and Economics (PPE)", duration: "4 Years", desc: "Interdisciplinary degree integrating philosophy, political theory and economic analysis. International tuition £30,700 per year. Four-year structure with deeper coverage than traditional 3-year PPE programmes.", careers: ["Public Policy Adviser", "Strategy Consultant", "Investigative Journalist"], salary: "£38,000–£60,000 starting", demand: "PPE remains the gold-standard degree for UK politics, journalism, civil service and policy consulting — LSE's PPE is regarded as among the most rigorous globally." },
                        { title: "BSc Data Science", duration: "3 Years", desc: "Advanced foundations in computational statistics, linear algebra, programming and data analysis to resolve complex socio-economic questions. International tuition £32,100 per year.", careers: ["Data Scientist", "Quantitative Researcher", "ML Engineer (Social Sciences)"], salary: "£45,000–£75,000 starting", demand: "Data science talent shortages persist across UK tech, finance and government — LSE's social-sciences-led data science programme produces graduates uniquely positioned for policy-tech roles." },
                        { title: "BSc Actuarial Science", duration: "3 Years", desc: "Rigorous quantitative training in risk evaluation, probability, financial mathematics, statistics and business economics, with optional placement pathways. International tuition £30,700 per year.", careers: ["Actuary (IFoA path)", "Pensions Consultant", "Insurance Risk Analyst"], salary: "£38,000–£55,000 starting (rising rapidly with IFoA exams)", demand: "Persistent shortages of qualified actuaries in UK insurance, pensions and reinsurance — LSE's accreditation by the Institute and Faculty of Actuaries gives graduates a major head start on professional qualifications." },
                        { title: "BSc Sociology", duration: "3 Years", desc: "Investigates social structure, inequalities, identity, power dynamics and social change through quantitative and qualitative research methodologies. International tuition £30,700 per year. LSE Sociology ranked 4th globally.", careers: ["Social Researcher", "Policy Analyst", "Equality / DEI Specialist"], salary: "£30,000–£48,000 starting", demand: "Government social research, market research, public health bodies and NGOs continue to recruit LSE Sociology graduates for evidence-led policy work." },
                        { title: "BA Geography", duration: "3 Years", desc: "Examines human geography, urbanisation, environmental change and spatial inequalities, with a strong focus on research design and social policy. International tuition £28,900 per year. LSE Geography ranks in the global top 5.", careers: ["Urban Planner", "Sustainability Consultant", "Climate Policy Researcher"], salary: "£32,000–£50,000 starting", demand: "Climate adaptation, urban resilience and sustainability consulting are among the fastest-growing graduate sectors — LSE Geography combines policy rigour with quantitative research training." },
                        { title: "BA History", duration: "3 Years", desc: "Offers broad coverage of international, political and socio-economic history, focusing on critical archival analysis and historiography. International tuition £28,900 per year.", careers: ["Historian / Academic", "Journalist", "Heritage / Museum Professional"], salary: "£28,000–£45,000 starting", demand: "Valued for superior writing, research and analytical skills — strong pipeline into journalism (FT, Economist), publishing, law conversion, and academic PhDs." },
                        { title: "BSc Economic History", duration: "3 Years", desc: "Examines the historical evolution of economies, business structures and trade policies over centuries, integrating qualitative and quantitative methods. International tuition £28,900 per year — LSE's lowest-tier fee bracket.", careers: ["Economic Historian", "Policy Researcher", "Financial Journalist"], salary: "£30,000–£48,000 starting", demand: "Niche but highly respected — graduates are recruited by economic consultancies, central bank research divisions and major financial publications looking for long-run economic perspective." },
                        { title: "BA Anthropology and Law", duration: "3 Years", desc: "Joint honours programme integrating social anthropology with legal studies, exploring legal systems through historical, cultural and political lenses. International tuition £30,700 per year.", careers: ["Human Rights Lawyer", "International Development Specialist", "Cultural Policy Adviser"], salary: "£35,000–£55,000 starting", demand: "Specialised pathway into human rights law, international development NGOs and UN agencies — uniquely combines LSE's top-ranked Anthropology and Law departments." }
                    ],
                    masters: [
                        { title: "MSc Finance (Full Time)", duration: "10 Months", desc: "LSE's flagship and most prestigious master's. Highly competitive programme covering asset markets, corporate finance and derivatives, starting with a four-week quantitative pre-sessional course. Flat fee of £51,000 for Home and Overseas students (2026/27).", careers: ["Investment Banker", "Hedge Fund Analyst", "Private Equity Associate"], salary: "£70,000–£100,000+ starting (PE/IB roles can exceed £120,000)", demand: "LSE MSc Finance is consistently ranked among the world's top three pre-experience finance master's (alongside HEC and MIT) — graduates dominate London, New York and Hong Kong finance recruitment." },
                        { title: "MSc Accounting and Finance", duration: "1 Year", desc: "Advanced study of financial reporting, corporate finance, valuation and quantitative methods, requiring a strong quantitative background. Flat fee of £43,000 for Home and Overseas students.", careers: ["Equity Research Analyst", "Big Four Senior Associate", "Corporate Finance Manager"], salary: "£55,000–£85,000 starting", demand: "Big Four advisory, equity research divisions of investment banks and CFO offices at FTSE 100 firms all recruit aggressively from this programme." },
                        { title: "MSc Management", duration: "1 Year", desc: "Core managerial principles, marketing, corporate finance and strategy, including a global capstone company project and optional placements. Flat fee of £42,900 for Home and Overseas students.", careers: ["Management Consultant", "Strategy Manager", "Brand Director"], salary: "£60,000–£85,000 starting", demand: "MBB consulting (McKinsey, BCG, Bain), Big Four strategy practices and Fortune 500 leadership programmes all consistently recruit from LSE MSc Management." },
                        { title: "MSc Economics", duration: "10 Months", desc: "Flagship one-year economics master's — flat fee of £41,000 for Home and Overseas students. LSE Economics ranks 4th globally. Note that the 10-month structure does NOT comply with the Bologna Process (consider 2-year MSc Economics for continental Europe recognition).", careers: ["Economic Consultant", "Central Bank Researcher", "PhD Candidate"], salary: "£50,000–£75,000 starting", demand: "Bank of England, HM Treasury, OBR, IMF, World Bank and elite PhD programmes (US Ivy League + UK Oxbridge/LSE) compete for LSE MSc Economics graduates." },
                        { title: "MSc Applied Social Data Science", duration: "1 Year", desc: "Highly technical programme focusing on computational methods, programming in R and Python, statistical learning and data management in the social sciences. Flat fee of £39,900 for Home and Overseas students.", careers: ["Data Scientist (Policy / Social)", "Quantitative Analyst", "AI Policy Researcher"], salary: "£50,000–£75,000 starting", demand: "Hybrid social-sciences-plus-data-science graduates are in extreme demand at government data offices (ONS), public-policy think tanks, big tech policy teams and AI safety organisations." },
                        { title: "Global Master in Management", duration: "2 Years", desc: "Extended two-year on-campus programme combining foundational management studies with a second-year specialisation, foreign exchange or global study route. £37,168 per year (Year 1). Bologna-compliant alternative to the 1-year MSc Management.", careers: ["Strategy Consultant", "International Brand Manager", "Cross-Border M&A Analyst"], salary: "£60,000–£85,000 starting", demand: "Two-year structure suits graduates targeting continental European and Asian recruiters, and those wanting deeper specialisation than the 1-year MSc Management offers." },
                        { title: "Master of Public Administration (MPA)", duration: "21 Months", desc: "Professional programme in public policy, analytical economics, public management and quantitative methods, involving an applied capstone project. £34,100 per year (Year 1). Mid-career and pre-career tracks available.", careers: ["Senior Civil Servant", "World Bank / IMF Economist", "Public Sector Strategy Director"], salary: "£55,000–£90,000 starting (varies by sector and country)", demand: "World Bank, IMF, UN, OECD, UK Civil Service Fast Stream Senior Leadership scheme and global government leadership pipelines all recruit MPA graduates from LSE." },
                        { title: "MSc International Relations", duration: "1 Year", desc: "Focuses on international relations theory, global conflict, security, international law and global institutions, ending with a 10,000-word dissertation. Flat fee of £32,500 for Home and Overseas students.", careers: ["Diplomat", "Geopolitical Risk Consultant", "UN / NGO Policy Officer"], salary: "£42,000–£68,000 starting", demand: "FCDO (UK Foreign Office), UN system, EU institutions, NATO, geopolitical risk consultancies (Eurasia Group, Control Risks) and major think tanks recruit heavily from LSE IR." },
                        { title: "Master of Laws (LLM)", duration: "1 Year", desc: "Advanced legal qualification with specialisation in corporate, international or human rights law. Home tuition £24,500; International tuition £39,900. Requires a UK 2:1 law degree or equivalent conversion qualification.", careers: ["Corporate Lawyer (London/NY/HK)", "Human Rights Lawyer", "International Arbitration Counsel"], salary: "£75,000–£170,000+ starting (US firms in London pay top of market)", demand: "London remains the global centre for international arbitration and cross-border M&A — LSE LLM graduates regularly secure positions at US/UK elite firms with starting salaries above £150,000." }
                    ],
                    scholarships: [
                        { title: "The Uggla Family Scholars Programme", amount: "Full tuition + accommodation + £32,197 living costs per year", eligibility: "Up to 10 awards annually — Home and Overseas undergraduates from underrepresented backgrounds", desc: "LSE's most comprehensive scholarship and a true full-ride award. Covers full tuition, guaranteed accommodation in an LSE residence hall, and living expenses up to £32,197 per year. Scholars also receive academic mentoring, career counselling, bespoke leadership development training, and direct engagement with the Uggla Family." },
                        { title: "LSE Undergraduate Support Scheme (USS)", amount: "£6,000 — £15,000 (standard); £15,000 — £25,000 (higher tier)", eligibility: "Overseas (international) fee undergraduates demonstrating significant financial need", desc: "Strictly means-tested need-based aid program. Awards applied directly to tuition or living costs and renewable for up to three years subject to satisfactory academic progress. Designed to bridge the deficit between LSE's full international cost and documented family resources." },
                        { title: "LSE Bursary", amount: "£1,250 — £4,250 per year", eligibility: "Home (UK) fee undergraduates with household income ≤£50,000", desc: "Non-repayable, need-based grant awarded automatically using Student Finance income data. Sliding scale: £4,250/year for income £0–£30,000; £3,000 for £30,001–£35,000; £2,250 for £35,001–£40,000; £1,250 for £40,001–£50,000. Paid in three termly installments." },
                        { title: "Graduate Support Scheme (GSS)", amount: "£5,000 — £20,000", eligibility: "Home and Overseas postgraduate taught master's and diploma students with documented financial need", desc: "LSE's primary postgraduate funding scheme — approximately £3 million allocated annually. Strictly means-tested with no academic merit assessment. Calculated automatically on submitted financial profile against a £1,500/month central London living cost baseline. Applications above £20,000 are automatically forwarded for major LSE master's scholarships." },
                        { title: "Global School of Sustainability Scholarship", amount: "£10,000 per year (3 years)", eligibility: "International applicants admitted to BSc Environment and Sustainable Development (with or without Economics)", desc: "Targeted award for the duration of the three-year undergraduate degree. Designed to grow LSE's pipeline of sustainability and climate policy graduates." },
                        { title: "LSE Access to Education Graduate Scholarships", amount: "Full tuition + up to £14,400 maintenance", eligibility: "UK residents with forced migration backgrounds (asylum seekers, refugees, discretionary leave to remain)", desc: "Covers full tuition fees and provides annual maintenance support for postgraduate study. One of LSE's most generous targeted scholarship programmes." },
                        { title: "LSE Discretionary Bursary", amount: "Variable (top-up support)", eligibility: "Home undergraduates with exceptional, undocumented financial hardship", desc: "Top-up support for students with localised caring responsibilities or disability-related costs exceeding standard maintenance. Requires prior application for full statutory maintenance and completion of the LSE Undergraduate Scholarship application." },
                        { title: "Margaret Basu Scholarship", amount: "£4,000", eligibility: "Indian citizens accepted into a full-time master's programme", desc: "Awarded on academic merit and financial need. Requires the Graduate Financial Application Form submitted via the Application Tracker." },
                        { title: "Marchant Foundation LLM Scholarship", amount: "£10,000", eligibility: "Indian applicants residing in India who have secured a full-time LSE LLM offer", desc: "Targeted award for Indian law graduates pursuing LSE's Master of Laws. Requires LSE Graduate Admission and Financial Support Application forms, a robust Statement of Purpose and academic references." },
                        { title: "Rajeeb Mukherjee Memorial Scholarship", amount: "Need-based (covers full study costs)", eligibility: "Undergraduate applicants from India, Bangladesh, or Canada", desc: "Full-cost need-based undergraduate award. Requires official LSE offer, English proficiency (TOEFL-iBT 100+ or IELTS 7.0+), academic references, family income certificates and personal financial statements." },
                        { title: "JN Tata Endowment Loan Scholarship", amount: "₹1,00,000 — ₹10,00,000 (low-interest loan)", eligibility: "Indian citizens under 45 holding an undergraduate degree", desc: "Legacy loan programme offering low-interest study loans for postgraduate and doctoral study. May include a ₹50,000 travel grant and a ₹75,000 gift. Requires a tailored Statement of Purpose and a letter of recommendation." },
                        { title: "Inlaks Shivdasani Foundation Scholarship", amount: "Up to USD 100,000 (~£76,897)", eligibility: "Indian citizens under 30 pursuing Master's, MPhil or Doctoral study", desc: "Full-ride postgraduate award covering tuition, living expenses, one-way airfare and a health allowance. Excludes MBA, finance, computer science and clinical medicine programmes. Requires LSE offer, passport copy and two academic references." },
                        { title: "Lady Meherbai D Tata Education Scholarship", amount: "Up to ₹6,00,000 (need-based)", eligibility: "Indian women with a first-class degree and at least 2 years of relevant work experience", desc: "Targeted at Indian women pursuing social science, public health, gender studies or development. Requires university acceptance, CV and verified household financial statements." },
                        { title: "Sir Ratan Tata Visiting Fellowship", amount: "Up to £1,750 per month (6 months)", eligibility: "Postdoctoral researchers investigating economic and social development in India and South Asia", desc: "Six-month postdoctoral research residency at the LSE South Asia Centre. Requires an updated CV, a focused research proposal and a minimum of two letters of recommendation." }
                    ]
                }
            },
            cities: {
                cambridge: {
                    name: "Cambridge 🎓", state: "Massachusetts, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://cambridgeusa.org/wp-content/uploads/2025/06/53692293039_82e4b561e9_o-1536x1140.jpg", caption: "Cambridge, Massachusetts" },
                        { url: "https://images.pexels.com/photos/17424551/pexels-photo-17424551.jpeg", caption: "Faneuil Hall, Boston" },
                        { url: "https://images.pexels.com/photos/27062463/pexels-photo-27062463.jpeg", caption: "Custom House Clock Tower, Boston" },
                        { url: "https://bomag.o0bc.com/wp-content/uploads/sites/2/2022/06/Harvard_KyleKlein_DJI_0135_HDR-960x639.jpg", caption: "Harvard Square, Cambridge" },
                        { url: "https://i.pinimg.com/1200x/d2/c6/ac/d2c6ac2661f3cbe8c9f19bcdcd5ba625.jpg", caption: "Cambridge Street Life" },
                        { url: "https://images.pexels.com/photos/5627116/pexels-photo-5627116.jpeg", caption: "Boston Harbor, Massachusetts" }
                    ],
                    life: [
                        "Home to both MIT and Harvard, Cambridge is one of the most intellectually dense cities on Earth",
                        "Over 500 student organizations at MIT alone, covering everything from robotics to comedy",
                        "The Independent Activities Period (IAP) every January lets students explore anything from chocolate science to caving",
                        "65% of MIT undergrads participate in real paid research through the UROP program",
                        "The Puppy Lab and Wellbeing Lab are dedicated spaces for student stress relief during finals",
                        "Legendary 'hacking' culture — technically brilliant pranks like putting a police car on the Great Dome"
                    ],
                    vibes: "Cambridge is where Nobel Prize winners grab coffee next to first-year students. A compact, walkable city sitting across the Charles River from Boston, it pulses with startup energy, academic ambition, and New England charm. Innovation is not just a word here — it is the air.",
                    landmarks: "Kendall Square, Harvard Square, Charles River Esplanade, MIT Great Dome, MIT Museum, Infinite Corridor",
                    costNoteTop: "Note: Cambridge is approximately 70% more expensive than the US national average. Housing is the biggest factor.",
                    rentShared: "$1,200–$1,500", rentStudio: "$2,870+",
                    utilsShared: "$170–$250", utilsStudio: "$170–$250",
                    foodShared: "$450–$600", foodStudio: "$450–$600",
                    transShared: "$90", transStudio: "$90",
                    entShared: "$200–$350", entStudio: "$200–$350",
                    totalShared: "$2,110–$2,790", totalStudio: "$3,780–$4,090",
                    costNoteBottom: "MIT subsidizes 50% of monthly MBTA transit passes for its students. Porter Square and Allston are the most affordable neighborhoods for students."
                },
                cambridge_harvard: {
                    name: "Cambridge 🎓", state: "Massachusetts, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.pexels.com/photos/4659963/pexels-photo-4659963.jpeg", caption: "Boston Harbor, Massachusetts" },
                        { url: "https://images.pexels.com/photos/28646038/pexels-photo-28646038.jpeg", caption: "Custom House Clock Tower, Boston" },
                        { url: "https://images.pexels.com/photos/21314032/pexels-photo-21314032.jpeg", caption: "Harvard University Library" },
                        { url: "https://i.pinimg.com/1200x/e2/96/67/e2966758ab6f5f7f2d14f6c202b2f036.jpg", caption: "Charles River, Cambridge" },
                        { url: "https://i.pinimg.com/1200x/97/64/fa/9764fa5c26d9223ef0c0e3be132e87db.jpg", caption: "Boston Skyline from Cambridge" },
                        { url: "https://images.pexels.com/photos/27062463/pexels-photo-27062463.jpeg", caption: "Faneuil Hall, Boston" }
                    ],
                    life: [
                        "Harvard Yard is the historic heart of campus, surrounded by freshman dorms and iconic red brick buildings dating back to 1636",
                        "Over 450 student organizations — from the Harvard Crimson newspaper to improv comedy groups and political clubs",
                        "The Houses system places upperclassmen into 12 residential communities, each with its own traditions, rivalries, and culture",
                        "Cambridge café culture and independent bookshops make it one of the most intellectually alive cities for students",
                        "10 minute MBTA Red Line ride connects students to all of Boston — internships, concerts, sports, everything",
                        "Harvard and MIT students regularly collaborate on research, startups, and cross-campus initiatives in Kendall Square"
                    ],
                    vibes: "Cambridge is one of the most intellectually electric cities on Earth. Sitting across the Charles River from Boston, it blends 400 years of revolutionary history with cutting-edge biotech and startup energy. Harvard Square alone has hosted more Nobel Prize winners, presidents, and world-changers than most countries. The city feels alive with ambition at every corner.",
                    landmarks: "Harvard Yard, Harvard Square, Charles River Esplanade, Kendall Square, Cambridge Common, The Fogg Art Museum, Brattle Street",
                    costNoteTop: "Note: Cambridge sits 70% above the US national average in cost of living. Rent is the biggest factor. Students sharing apartments in Allston or Porter Square can manage budgets significantly better than living solo in Cambridge or Boston proper.",
                    rentShared: "$1,200–$1,500", rentStudio: "$2,870+",
                    utilsShared: "$170–$250", utilsStudio: "$170–$250",
                    foodShared: "$450–$600", foodStudio: "$450–$600",
                    transShared: "$90", transStudio: "$90",
                    entShared: "$200–$350", entStudio: "$200–$350",
                    totalShared: "$2,110–$2,790", totalStudio: "$3,780–$4,090",
                    costNoteBottom: "Harvard students get discounted MBTA passes. Porter Square and Allston are the most affordable neighborhoods near campus."
                },
                stanford: {
                    name: "Palo Alto & The Bay Area 🎓", state: "California, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.trvl-media.com/place/9842/6244d98b-f1fd-402e-b030-d5b2775a4b55.jpg", caption: "Stanford University Campus" },
                        { url: "https://images.trvl-media.com/place/9842/a31f1387-1ed4-46e3-8cd9-4a49d07d6ca0.jpg", caption: "Stanford Memorial Church" },
                        { url: "https://images.trvl-media.com/place/502584/b1167e42-b297-469b-b033-81477e8f6759.jpg", caption: "Silicon Valley, California" },
                        { url: "https://images.trvl-media.com/place/6262724/e689b458-1c11-4929-a10b-5fd0e7554683.jpg", caption: "The Bay Area, California" },
                        { url: "https://images.unsplash.com/photo-1681782421891-5088f13466ec?fm=jpg&q=60&w=3000&auto=format&fit=crop", caption: "Stanford University" }
                    ],
                    life: [
                        "Stanford's campus is one of the largest in the world at 8,180 acres — students often cycle between classes through palm-lined paths",
                        "Over 650 student organizations covering everything from venture capital clubs to Bollywood dance teams",
                        "The Stanford Research Park sits directly adjacent to campus — students intern at Apple, Google, and Tesla within minutes of their dorms",
                        "Dish Hike is a beloved Stanford tradition — a 3.7 mile trail behind campus with panoramic views of the Bay Area",
                        "Stanford has produced more billionaires per alumni than any other university in the world",
                        "The Bing Concert Hall and Cantor Arts Center make Stanford one of the most culturally rich campuses in America"
                    ],
                    vibes: "Palo Alto sits at the heart of Silicon Valley — the most concentrated hub of wealth, innovation, and ambition on the planet. This is where Google, Apple, Meta, Netflix, and Tesla were either born or grew up. For Stanford students, the Valley is not just a location — it is a mindset. The energy here is unlike anywhere else: everyone is building something, pitching something, or funding something. San Francisco is 35 minutes away by Caltrain, offering world-class food, culture, and nightlife.",
                    landmarks: "Stanford Main Quad, Hoover Tower, Silicon Valley, San Francisco Bay, Golden Gate Bridge, Palo Alto Downtown",
                    costNoteTop: "Note: The Bay Area is one of the most expensive regions in the United States. Palo Alto is significantly pricier than most college towns. Stanford's on-campus housing is highly recommended for cost savings.",
                    rentShared: "$1,500–$2,200", rentStudio: "$3,200–$4,500",
                    utilsShared: "$100–$180", utilsStudio: "$150–$250",
                    foodShared: "$400–$600", foodStudio: "$500–$700",
                    transShared: "$120", transStudio: "$120",
                    entShared: "$200–$400", entStudio: "$300–$500",
                    totalShared: "$2,320–$3,500", totalStudio: "$4,370–$6,070",
                    costNoteBottom: "Stanford strongly recommends on-campus housing for first and second year students. Caltrain connects Palo Alto to San Francisco in 35 minutes. Many students bike everywhere on campus — bikes are essential."
                },
                pasadena: {
                    name: "Pasadena & Los Angeles 🌴", state: "California, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.unsplash.com/photo-1585412168334-8fa91429cc64?fm=jpg&q=60&w=3000&auto=format&fit=crop", caption: "Pasadena, California" },
                        { url: "https://images.openai.com/static-rsc-4/jDXHG4_-lSK7FWerOjPTcBillMjkZtDNfKuTQ7aB5tQ9T-wxDJDoDYC6dYLml7Xz-0gVusQ85VNSIDFddwSfMW1WabtoH8GqRfSy3rW_x6SCe-1gI81RGCuRvmKASQvYbpt0q5aHLNYYvFihL3S1bK2gwxGpn3x9VCams_JcpeIALZzePgfX9XODOYXNLC-Z?purpose=fullsize", caption: "La Jolla, California" },
                        { url: "https://images.pexels.com/photos/34276128/pexels-photo-34276128.jpeg", caption: "California Coast" },
                        { url: "https://static.independent.co.uk/2024/09/26/15/iStock-1463288473-1.jpg", caption: "Los Angeles, California" },
                        { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", caption: "Santa Monica Beach" },
                        { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e", caption: "California Sunset" }
                    ],
                    life: [
                        "Caltech has only 900 undergraduate students — one of the smallest and most elite universities on Earth, with a 3 to 1 student to faculty ratio",
                        "The House System divides students into eight residential houses — each with its own traditions, rivalries, and culture",
                        "Rotation Week at the start of freshman year lets new students experience every house before choosing their home for the next four years",
                        "Ditch Day is Caltech's most legendary tradition — seniors disappear for a day and leave elaborate puzzle-based adventures called stacks for underclassmen to solve",
                        "Students have access to NASA's Jet Propulsion Laboratory directly — many undergrads work on real NASA missions before graduating",
                        "Pasadena's Old Town is walking distance from campus — a vibrant street with restaurants, cafes, and the famous Rose Bowl stadium nearby"
                    ],
                    vibes: "Pasadena is a beautiful, tree-lined city sitting at the foot of the San Gabriel Mountains, just 30 minutes from downtown Los Angeles. It has the calm of a college town with the energy of one of the world's greatest cities right on its doorstep. LA means Hollywood, Santa Monica beach, Griffith Observatory, world-class food from every culture, and an entertainment industry unlike anywhere else. For Caltech students, this is the perfect balance — intense intellectual focus on campus, and a world-class city to decompress in.",
                    landmarks: "Old Town Pasadena, Rose Bowl Stadium, Griffith Observatory, Santa Monica Pier, Hollywood Sign, Getty Center, Venice Beach",
                    costNoteTop: "Note: Los Angeles and Pasadena are significantly more expensive than the national average. On-campus housing at Caltech is strongly recommended and more affordable than off-campus options.",
                    rentShared: "$1,200–$1,800", rentStudio: "$2,500–$3,800",
                    utilsShared: "$100–$180", utilsStudio: "$150–$250",
                    foodShared: "$400–$550", foodStudio: "$500–$700",
                    transShared: "$150", transStudio: "$150",
                    entShared: "$200–$400", entStudio: "$300–$500",
                    totalShared: "$2,050–$3,080", totalStudio: "$3,600–$5,400",
                    costNoteBottom: "Caltech provides subsidized on-campus housing for most undergraduates. A car is helpful in LA but Metro connections from Pasadena reach downtown LA. The Rose Bowl Flea Market every second Sunday is a Pasadena institution."
                },
                nyc: {
                    name: "New York City 🗽", state: "New York, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://www.agoda.com/wp-content/uploads/2024/02/Manhattan-USA.jpg", caption: "Manhattan, New York City" },
                        { url: "https://images.pexels.com/photos/5847362/pexels-photo-5847362.jpeg", caption: "Brooklyn Waterfront" },
                        { url: "https://images.travelandleisureasia.com/wp-content/uploads/sites/7/2024/03/01175549/dumbo.jpeg?tr=w-1920", caption: "DUMBO Brooklyn" },
                        { url: "https://cdn.britannica.com/22/195522-050-6C15247F/Statue-of-Liberty-Upper-New-York-Bay.jpg", caption: "Statue of Liberty" },
                        { url: "https://plus.unsplash.com/premium_photo-1714051660720-888e8454a021?fm=jpg&q=60&w=3000&auto=format&fit=crop", caption: "New York City Skyline" }
                    ],
                    life: [
                        "NYU's IRL Initiative rewards students with Broadway tickets for device-free social interactions",
                        "Students from over 130 countries making it one of the most diverse campuses on Earth",
                        "65% of students have internships built directly into their curriculum",
                        "The John A. Paulson Center features a four-court gym, lap pool, and full training facilities",
                        "Dedicated commuter lounges for students arriving from other boroughs and New Jersey",
                        "Undergraduates work alongside world-class faculty at labs like the Leslie Entrepreneurs Lab",
                        "Global mobility — spend a semester at one of NYU's 14 academic centers worldwide while keeping your financial aid"
                    ],
                    vibes: "New York City is the center of the world. A fast-paced, vibrant metropolis where finance, technology, arts, and culture collide every single day. NYU students do not just study in New York — they are absorbed into it. Greenwich Village, where the campus lives, has been home to artists, revolutionaries, and thinkers for over a century.",
                    landmarks: "Washington Square Arch, Elmer Holmes Bobst Library, Hudson Yards, Central Park, Brooklyn Bridge, Wall Street, The High Line, Statue of Liberty",
                    costNoteTop: "Note: Manhattan median rent hit an all-time record of $5,000/month in early 2026. Sharing in Queens or the Bronx is the most viable student option.",
                    rentShared: "$1,200–$1,800", rentStudio: "$3,353–$4,200",
                    utilsShared: "$130–$200", utilsStudio: "$200–$400",
                    foodShared: "$400–$600", foodStudio: "$500–$700",
                    transShared: "$132", transStudio: "$132",
                    entShared: "$150–$300", entStudio: "$200–$600",
                    totalShared: "$2,012–$3,032", totalStudio: "$4,385–$6,032"
                },
                new_haven: {
                    name: "New Haven 🎓", state: "Connecticut, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://onha.yale.edu/sites/default/files/2024-10/2010_05_10_18-26-20_4.jpg", caption: "Yale University Campus" },
                        { url: "https://visitorcenter.yale.edu/sites/default/files/2023-09/new%20haven-aerial-water.jpeg", caption: "New Haven from Above" },
                        { url: "https://www.visittheusa.com/wp-content/uploads/2026/02/Hero4_NewHaven_YaleOldCampus1_Melford_Web72DPI169.jpg", caption: "Yale Old Campus, New Haven" },
                        { url: "https://i0.wp.com/www.betweentworocks.com/wp-content/uploads/2015/09/New-Haven-scaled.jpg?fit=2560%2C1264&ssl=1", caption: "New Haven, Connecticut" },
                        { url: "https://images.trvl-media.com/place/208/4c52b1cd-3c7f-413f-841a-143bd2ccdcc4.jpg", caption: "New Haven Harbor" },
                        { url: "https://images.pexels.com/photos/5225604/pexels-photo-5225604.jpeg", caption: "Greenwich, Connecticut" }
                    ],
                    life: [
                        "Yale's residential college system divides students into 14 communities each with its own dining hall, courtyard, library, and traditions — creating deep bonds and lifelong friendships",
                        "The Yale Dramatic Association is the oldest college theater organization in America — alumni include Meryl Streep, Paul Newman, and Jodie Foster",
                        "Yale's secret societies — including Skull and Bones — are among the most famous and mysterious student traditions in the world",
                        "Cross Campus is the social heart of Yale — a vast green lawn where students gather between classes, during festivals, and for impromptu frisbee games",
                        "Yale's music scene is extraordinary — the Yale Symphony Orchestra, Yale Glee Club, and dozens of a cappella groups perform year round",
                        "New Haven's food scene punches far above its weight — widely considered one of the best pizza cities in America with legendary spots like Frank Pepe's and Sally's"
                    ],
                    vibes: "New Haven is a compact, walkable city that wraps itself around one of the greatest universities in the world. It has the intimacy of a college town with genuine urban culture — world class theater at the Yale Repertory Theatre, an extraordinary art gallery at the Yale Center for British Art, and a food scene that food critics consistently rank among the best in New England. New York City is just 90 minutes away by train, giving Yale students the best of both worlds — the close-knit community of a college town and the greatest city on Earth within easy reach.",
                    landmarks: "Yale Old Campus, Beinecke Rare Book Library, Peabody Museum, Yale Center for British Art, East Rock Park, New Haven Green, Long Wharf Theatre",
                    costNoteTop: "Note: New Haven is one of the most affordable cities for an Ivy League education in the northeastern USA. Costs are significantly lower than New York City or Boston while maintaining full access to world class education and culture.",
                    rentShared: "$700–$1,100", rentStudio: "$1,300–$1,900",
                    utilsShared: "$100–$150", utilsStudio: "$120–$180",
                    foodShared: "$300–$450", foodStudio: "$400–$550",
                    transShared: "$60–$100", transStudio: "$60–$100",
                    entShared: "$100–$200", entStudio: "$150–$300",
                    totalShared: "$1,260–$2,000", totalStudio: "$2,030–$3,030",
                    costNoteBottom: "New Haven is consistently ranked one of the most affordable Ivy League cities. Yale provides excellent on-campus housing options for both undergraduate and graduate students. New York City is 90 minutes away by Metro-North train."
                },
                philadelphia: {
                    name: "Philadelphia 🎓", state: "Pennsylvania, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.pexels.com/photos/6581328/pexels-photo-6581328.jpeg", caption: "Philadelphia, Pennsylvania" },
                        { url: "https://images.pexels.com/photos/4642454/pexels-photo-4642454.jpeg", caption: "Philadelphia Streets" },
                        { url: "https://images.pexels.com/photos/6379407/pexels-photo-6379407.jpeg", caption: "University City, Philadelphia" },
                        { url: "https://images.pexels.com/photos/14299741/pexels-photo-14299741.jpeg", caption: "Philadelphia Architecture" },
                        { url: "https://images.pexels.com/photos/6379222/pexels-photo-6379222.jpeg", caption: "Philadelphia Culture" },
                        { url: "https://www.visitphilly.com/wp-content/uploads/2020/03/philadelphia-skyline-museum-of-art-by-elevated-angles-for-vp-2200x1237px.jpg", caption: "Philadelphia Skyline" }
                    ],
                    life: [
                        "Penn's campus sits in West Philadelphia, a vibrant neighborhood with cafes, restaurants, and a strong community feel",
                        "Wharton undergraduate students have access to one of the most powerful alumni networks in the world — over 100,000 Wharton alumni globally",
                        "Penn has over 600 student clubs and organizations across arts, business, technology, and community service",
                        "The University City neighborhood surrounding Penn is one of the most walkable and student-friendly areas in any major US city",
                        "Penn Medicine gives pre-med students direct exposure to one of the top hospital systems in the country",
                        "Philadelphia is a city of firsts — first hospital, first library, first university in America — history is everywhere"
                    ],
                    vibes: "Philadelphia is America's first great city — founded in 1682, it served as the nation's capital and birthplace of both the Declaration of Independence and the Constitution. Today it is a vibrant, affordable, and culturally rich metropolis sitting perfectly between New York City and Washington DC. The food scene is legendary — from the iconic cheesesteak to world class restaurants along Rittenhouse Square. For Penn students, Philadelphia offers big city energy at a fraction of New York costs.",
                    landmarks: "Liberty Bell, Independence Hall, Rittenhouse Square, Philadelphia Museum of Art, Reading Terminal Market, Eastern State Penitentiary",
                    costNoteTop: "Note: Philadelphia is significantly more affordable than New York City or Boston, making it one of the best value cities for Ivy League students.",
                    rentShared: "$800–$1,200", rentStudio: "$1,500–$2,200",
                    utilsShared: "$100–$150", utilsStudio: "$120–$200",
                    foodShared: "$350–$500", foodStudio: "$400–$600",
                    transShared: "$100", transStudio: "$100",
                    entShared: "$150–$250", entStudio: "$200–$350",
                    totalShared: "$1,500–$2,200", totalStudio: "$2,320–$3,450",
                    costNoteBottom: "Philadelphia is consistently ranked one of the most affordable major cities in the northeastern USA. West Philadelphia near Penn's campus has excellent value housing options."
                },
                columbia_nyc: {
                    name: "New York City 🗽", state: "New York, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.pexels.com/photos/8335926/pexels-photo-8335926.jpeg", caption: "Midtown Manhattan, New York" },
                        { url: "https://images.pexels.com/photos/5142323/pexels-photo-5142323.jpeg", caption: "New York City Energy" },
                        { url: "https://images.pexels.com/photos/14426200/pexels-photo-14426200.jpeg", caption: "Central Park, New York" },
                        { url: "https://images.pexels.com/photos/6007455/pexels-photo-6007455.jpeg", caption: "Hudson Yards, New York" },
                        { url: "https://images.pexels.com/photos/36847818/pexels-photo-36847818.jpeg", caption: "New York City Nightlife" },
                        { url: "https://images.pexels.com/photos/28715522/pexels-photo-28715522.jpeg", caption: "New York City Afternoon" }
                    ],
                    life: [
                        "Columbia's Morningside Heights neighborhood is known as the Academic Acropolis — surrounded by Barnard College, Teachers College, and Union Theological Seminary",
                        "The Core Curriculum is Columbia's legendary two-year program requiring all students to engage with primary texts from Homer to Kant to Toni Morrison — one of the most rigorous general education programs in the world",
                        "Over 500 student organizations covering everything from investment clubs to theatre groups to political advocacy",
                        "Columbia's location in Upper Manhattan gives students access to Harlem's cultural scene, Central Park, and the entire city by subway",
                        "Columbia's network connects students directly to NYC's booming tech and finance startup ecosystem",
                        "Butler Library — open 24 hours — is one of the great research libraries in the world and the beating heart of Columbia student life"
                    ],
                    vibes: "New York City is the center of the world — and Columbia sits right in the middle of it. Morningside Heights offers a genuine neighborhood feel within the greatest city on Earth. Central Park is literally at the doorstep. Harlem to the north pulses with music, food, and cultural history. Midtown Manhattan with Wall Street, Broadway, and the United Nations is 20 minutes by subway. For Columbia students, New York City is not just a backdrop — it is a living classroom unlike anything else on the planet.",
                    landmarks: "Columbia Main Gate, Butler Library, Central Park, Harlem, Broadway, Riverside Park, The Met Museum, Morningside Park",
                    costNoteTop: "Note: New York City is the most expensive city in the United States. Columbia's Morningside Heights location is slightly more affordable than Midtown or Downtown Manhattan but still among the highest costs nationally. Sharing apartments is essential for most students.",
                    rentShared: "$1,200–$1,800", rentStudio: "$3,000–$4,500",
                    utilsShared: "$130–$200", utilsStudio: "$200–$400",
                    foodShared: "$400–$600", foodStudio: "$500–$700",
                    transShared: "$132", transStudio: "$132",
                    entShared: "$150–$300", entStudio: "$200–$500",
                    totalShared: "$2,012–$3,032", totalStudio: "$4,200–$6,232"
                },
                princeton_nj: {
                    name: "Princeton 🎓", state: "New Jersey, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.pexels.com/photos/26647055/pexels-photo-26647055.jpeg", caption: "Princeton, New Jersey" },
                        { url: "https://images.pexels.com/photos/6834759/pexels-photo-6834759.jpeg", caption: "Princeton Campus Life" },
                        { url: "https://images.pexels.com/photos/33608324/pexels-photo-33608324.jpeg", caption: "New York City, Nearby" },
                        { url: "https://images.pexels.com/photos/29393582/pexels-photo-29393582.jpeg", caption: "Princeton Architecture" },
                        { url: "https://images.pexels.com/photos/3277174/pexels-photo-3277174.jpeg", caption: "New Jersey Landscape" },
                        { url: "https://images.pexels.com/photos/19262147/pexels-photo-19262147.jpeg", caption: "Princeton Evening" }
                    ],
                    life: [
                        "Princeton is unique among Ivy League schools for having no law school, business school, or medical school — giving undergraduates extraordinary resources and faculty attention",
                        "The Eating Clubs on Prospect Avenue are Princeton's legendary social institutions — historic mansions where upperclassmen dine, socialize, and build lifelong networks",
                        "Princeton's four year residential college system ensures every student lives on campus with dedicated dining, events, and community — one of the most cohesive campus experiences in America",
                        "The Princeton tiger is everywhere — students wear orange and black with genuine pride at every sporting event and tradition",
                        "Nassau Hall, built in 1756, served as the US Capitol briefly during the Revolutionary War — history literally surrounds every student on campus",
                        "New York City and Philadelphia are both reachable within 60 to 90 minutes by train — perfect for internships, culture, and weekend escapes"
                    ],
                    vibes: "Princeton is one of the most beautiful college towns in America — a perfectly preserved historic borough wrapped around one of the world's greatest universities. The streets are lined with independent bookshops, art galleries, and excellent restaurants. It has the peacefulness of a small town with the intellectual energy of a world capital. And its location makes it uniquely powerful — sitting exactly halfway between New York City and Philadelphia, Princeton students have two of America's greatest cities within easy reach while enjoying the focus and beauty of a genuine academic sanctuary.",
                    landmarks: "Nassau Hall, Princeton Chapel, Prospect Gardens, Palmer Square, Institute for Advanced Study, Princeton Battlefield State Park",
                    costNoteTop: "Note: Princeton borough is a small affluent town. On-campus housing is available and strongly recommended. New York City and Philadelphia are close enough for day trips but far enough to keep costs manageable.",
                    rentShared: "$900–$1,400", rentStudio: "$1,800–$2,500",
                    utilsShared: "$100–$160", utilsStudio: "$130–$200",
                    foodShared: "$350–$500", foodStudio: "$400–$600",
                    transShared: "$120", transStudio: "$120",
                    entShared: "$100–$200", entStudio: "$150–$300",
                    totalShared: "$1,570–$2,380", totalStudio: "$2,600–$3,720",
                    costNoteBottom: "Princeton provides on-campus housing for all four undergraduate years. NJ Transit connects Princeton to New York Penn Station in 60 minutes and Philadelphia in 90 minutes. The Dinky — Princeton's own mini train — connects campus directly to the main NJ Transit line."
                },
                chicago: {
                    name: "Chicago 🎓", state: "Illinois, USA", layout: 'editorial',
                    gallery: [
                        { url: "https://images.pexels.com/photos/28863057/pexels-photo-28863057.jpeg", caption: "Chicago Skyline Afternoon" },
                        { url: "https://images.pexels.com/photos/2124701/pexels-photo-2124701.jpeg", caption: "Chicago Skyline Dusk" },
                        { url: "https://images.pexels.com/photos/25811902/pexels-photo-25811902.jpeg", caption: "Chicago Urban Architecture" },
                        { url: "https://images.pexels.com/photos/7806715/pexels-photo-7806715.jpeg", caption: "Chicago Riverwalk" },
                        { url: "https://images.pexels.com/photos/919220/pexels-photo-919220.jpeg", caption: "Chicago Train Loop" },
                        { url: "https://images.pexels.com/photos/1782440/pexels-photo-1782440.jpeg", caption: "Chicago City Street" }
                    ],
                    life: [
                        "UChicago is famous for its intense academic culture where students proudly embrace intellectual debate, rigorous coursework, and deep analytical thinking",
                        "The Core Curriculum is one of the most respected and demanding in America — every student studies philosophy, humanities, science, mathematics, and social thought regardless of major",
                        "Hyde Park gives students a quieter and more academic environment than downtown Chicago while still keeping the entire city accessible through trains and buses",
                        "Student traditions like Scav Hunt, Kuviasungnerk/Kangeiko, and the university house system create a uniquely eccentric campus culture",
                        "Research opportunities are exceptional — students frequently work alongside globally recognized professors, Nobel Prize winners, and major scientific institutes",
                        "Chicago internships in finance, consulting, research, politics, healthcare, media, and technology are accessible throughout the academic year"
                    ],
                    vibes: "Chicago is one of America’s greatest urban experiences — a city of towering architecture, deep culture, legendary food, and relentless energy. Hyde Park blends historic academic beauty with direct access to downtown skyscrapers, lakefront parks, museums, jazz bars, sports culture, and one of the strongest job markets in the Midwest. Students at the University of Chicago experience both worlds simultaneously: the calm intellectual atmosphere of an elite campus and the ambition of a massive global city only minutes away.",
                    landmarks: "Millennium Park, Willis Tower, Navy Pier, The Bean, Chicago Riverwalk, Art Institute of Chicago",
                    costNoteTop: "Note: Chicago is significantly more affordable than New York, Boston, San Francisco, or Los Angeles while still offering world-class urban opportunities. Hyde Park is student-oriented and generally more manageable financially than downtown Chicago. Public transportation is strong, allowing students to live comfortably without needing a car.",
                    rentShared: "$700–$1,300", rentStudio: "$1,500–$2,400",
                    utilsShared: "$100–$170", utilsStudio: "$140–$220",
                    foodShared: "$300–$500", foodStudio: "$400–$650",
                    transShared: "$75", transStudio: "$75",
                    entShared: "$100–$250", entStudio: "$150–$350",
                    totalShared: "$1,275–$2,295", totalStudio: "$2,265–$3,695",
                    costNoteBottom: "The CTA train system connects Hyde Park to downtown Chicago quickly and affordably. Most University of Chicago students rely heavily on trains, buses, walking, and rideshare services rather than owning cars."
                },
                // ============================================================
                // UNITED KINGDOM CITIES — Placeholder structure entries
                // These mirror the exact USA city data structure so the
                // shared city detail page renders correctly without errors.
                // Real content will be added in a later update.
                // ============================================================
                oxford_uk: {
                    name: "Oxford 🎓", state: "England, United Kingdom", layout: 'editorial_uk',
                    gallery: [
                        { url: "https://images.pexels.com/photos/36145597/pexels-photo-36145597.jpeg", caption: "Oxford, England" },
                        { url: "https://images.pexels.com/photos/31125295/pexels-photo-31125295.jpeg", caption: "Dreaming Spires of Oxford" },
                        { url: "https://images.pexels.com/photos/11532238/pexels-photo-11532238.jpeg", caption: "Oxford Streets" },
                        { url: "https://images.pexels.com/photos/15867675/pexels-photo-15867675.jpeg", caption: "Oxford Culture" },
                        { url: "https://images.pexels.com/photos/30342626/pexels-photo-30342626.jpeg", caption: "Historic Oxford" },
                        { url: "https://images.pexels.com/photos/31125296/pexels-photo-31125296.jpeg", caption: "Oxford Vibes" }
                    ],
                    life: [
                        "Oxford runs on the tutorial system — undergraduates meet in groups of 1 to 3 with world-leading academics every single week, a method unique to Oxford and Cambridge in the world",
                        "Every Oxford student belongs to one of 38 self-governing colleges that handle their accommodation, dining, pastoral care, and social life — your college becomes your home for the entire degree",
                        "Formal Hall dinners are a weekly tradition at most colleges — three-course candlelit dinners in centuries-old dining halls where students wear academic gowns",
                        "Sub fusc — the formal academic dress of dark suit, white shirt, gown, and mortarboard — is worn during exams and ceremonies, a tradition continuously practised since the Middle Ages",
                        "Punting on the River Cherwell or Isis is the iconic Oxford summer pastime — students push flat-bottomed boats with long poles through the meadows",
                        "May Morning sees thousands gather at Magdalen Bridge before dawn on 1 May each year to hear the Magdalen College Choir sing from the tower at 6am",
                        "Trinity Term ends with the legendary college Balls — formal black-tie events with live music, fairground rides, and silent discos running through the night, with tickets often £150–£250",
                        "Over 400 student societies via the Oxford Student Union — including the Oxford Union (the world's most famous debating society, founded 1823), drama, sports, and academic clubs"
                    ],
                    vibes: "Oxford is a city built around its university — and you feel it in every honey-stone college wall, cobbled lane, and bicycle bell. The dreaming spires that inspired Lewis Carroll, Tolkien, and Philip Pullman are still here, still working, still teaching. Walking from the Radcliffe Camera to Christ Church Meadow is to walk through 900 years of human thought. The city itself is compact and walkable — 150,000 people, most of them cycling — wrapped around medieval colleges, riverside pubs, world-class museums (the Ashmolean opened in 1683), and the largest covered market in England. It is calmer than London and more intimate than Cambridge — a place where you can have coffee in the same Turl Street café where C.S. Lewis and Tolkien argued about myth.",
                    landmarks: "Radcliffe Camera, Bodleian Library, Christ Church College & Meadow, Magdalen Tower, Sheldonian Theatre, Ashmolean Museum, Bridge of Sighs, Covered Market, Carfax Tower",
                    costNoteTop: "Note: Oxford is one of the most expensive student cities in the UK outside London. Costs below are shown in British Pounds (£) and vary by college accommodation versus private renting in the city.",
                    rentShared: "£700–£1,100", rentStudio: "£1,200–£1,700",
                    utilsShared: "£80–£140", utilsStudio: "£100–£170",
                    foodShared: "£250–£400", foodStudio: "£280–£430",
                    transShared: "£55–£75", transStudio: "£55–£75",
                    entShared: "£100–£200", entStudio: "£150–£300",
                    utils: "£80–£140",
                    food: "£250–£400",
                    trans: "£55–£75",
                    totalShared: "£1,405–£2,105", totalStudio: "£2,005–£2,755"
                },
                cambridge_uk: {
                    name: "Cambridge 🎓", state: "England, United Kingdom", layout: 'editorial_uk',
                    gallery: [
                        { url: "https://images.pexels.com/photos/28198542/pexels-photo-28198542.jpeg", caption: "Cambridge, England" },
                        { url: "https://images.pexels.com/photos/5568720/pexels-photo-5568720.jpeg", caption: "The Backs & River Cam" },
                        { url: "https://images.pexels.com/photos/36974501/pexels-photo-36974501.jpeg", caption: "Cambridge Streets" },
                        { url: "https://images.pexels.com/photos/36137718/pexels-photo-36137718.jpeg", caption: "Cambridge Culture" },
                        { url: "https://images.pexels.com/photos/19025312/pexels-photo-19025312.jpeg", caption: "Historic Cambridge" },
                        { url: "https://images.pexels.com/photos/10519596/pexels-photo-10519596.jpeg", caption: "Cambridge Vibes" }
                    ],
                    life: [
                        "Cambridge uses the supervision system — the local name for the same intensive small-group teaching as Oxford's tutorials, where students meet weekly in pairs or trios with leading academics",
                        "Every student belongs to one of 31 constituent colleges — King's, Trinity, St John's, Pembroke, and others — which provide accommodation, dining, libraries, and a fierce sense of identity",
                        "Punting on the River Cam through the Backs is the defining Cambridge image — pushing flat boats past the back gardens of King's, Trinity, and Clare on a summer afternoon",
                        "Formal Halls are a deep weekly tradition — gowned candlelit dinners in oak-panelled halls dating to the 1300s, with grace recited in Latin at the high table",
                        "May Balls — confusingly held in June after exams — are some of the most spectacular student events in the world, with Trinity's and John's costing £400+ and running until dawn",
                        "Cambridge is built for cyclists — the city has the highest cycle commuting rate in the UK and most students get everywhere on a bike, including to lectures and the Sidgwick Site",
                        "Over 700 student societies through the Cambridge Students' Union, plus the legendary Cambridge Union debating society (founded 1815) which is older than Oxford's",
                        "Free access to the Fitzwilliam Museum, Kettle's Yard, and the eight University Museums — plus borrowing rights at the Cambridge University Library, one of six legal-deposit libraries in the UK with over 9 million books"
                    ],
                    vibes: "Cambridge is smaller, quieter, and arguably even more beautiful than Oxford — a town of around 145,000 people where Isaac Newton walked under the apple tree at Trinity, Charles Darwin studied at Christ's, and Stephen Hawking taught for half a century. The city is built around the River Cam and the Backs — the lush ribbon of college gardens running behind King's, Clare, Trinity, and St John's that is one of the most photographed stretches of architecture on Earth. Beyond the colleges, Cambridge has quietly become the second tech hub of the UK — Silicon Fen — home to ARM, AstraZeneca's global HQ, and hundreds of life-sciences and AI startups spun out of the university. The result is a town that is medieval and futuristic in the same breath: choirboys at King's Chapel, gene-editing labs five minutes away by bike.",
                    landmarks: "King's College Chapel, Trinity College Great Court, The Backs, Mathematical Bridge (Queens'), Fitzwilliam Museum, Round Church, Bridge of Sighs (St John's), Cambridge University Library, Botanic Garden",
                    costNoteTop: "Note: Cambridge is one of the most expensive student cities in the UK outside London. Costs below are shown in British Pounds (£) and vary by college accommodation versus private renting in the city.",
                    rentShared: "£650–£1,000", rentStudio: "£1,100–£1,500",
                    utilsShared: "£70–£130", utilsStudio: "£90–£160",
                    foodShared: "£250–£400", foodStudio: "£280–£430",
                    transShared: "£40–£70", transStudio: "£40–£70",
                    entShared: "£100–£200", entStudio: "£150–£300",
                    utils: "£70–£130",
                    food: "£250–£400",
                    trans: "£40–£70",
                    totalShared: "£1,350–£1,800", totalStudio: "£1,900–£2,500"
                },
                london_uk: {
                    name: "London 🇬🇧", state: "England, United Kingdom", layout: 'editorial_uk',
                    gallery: [
                        { url: "https://www.redhairtravel.com/wp-content/uploads/2025/06/london-article-cover.jpg", caption: "London, England" },
                        { url: "https://cms.inspirato.com/ImageGen.ashx?image=%2Fmedia%2F5682444%2FLondon_Dest_16531610X.jpg&width=1081.5", caption: "Central London" },
                        { url: "https://images.pexels.com/photos/18351701/pexels-photo-18351701.jpeg", caption: "London Street Life" },
                        { url: "https://images.pexels.com/photos/10438631/pexels-photo-10438631.jpeg", caption: "London Culture" },
                        { url: "https://images.pexels.com/photos/17243132/pexels-photo-17243132.jpeg", caption: "Iconic London" },
                        { url: "https://images.pexels.com/photos/4651134/pexels-photo-4651134.jpeg", caption: "London Vibes" }
                    ],
                    life: [
                        "London hosts more world-top-10 universities than any other city on Earth — Imperial in South Kensington, UCL in Bloomsbury, and LSE in Holborn all sit within a 3-mile radius of central London",
                        "Imperial's South Kensington campus puts students between the Natural History Museum, the V&A, and the Science Museum — all free to enter year-round",
                        "UCL students live in Bloomsbury, next door to the British Museum and the British Library — and the Wilkins Building portico on Gower Street is the iconic photo of UCL",
                        "LSE's campus around Houghton Street and the Old Building sits on the boundary of Covent Garden and Holborn — a tight, vertical urban campus in the legal and political heart of the city",
                        "The 18+ Student Oyster photocard gives a 30% discount on Tube, bus, DLR, and Overground travel — most students rely on it as London is built around public transport",
                        "Every London university has hundreds of clubs and societies — from rowing on the Thames at Putney to Bollywood dance, finance societies, and the Imperial-UCL-LSE varsity sports rivalries",
                        "Students get cheap or free entry to the Tate Modern, Tate Britain, the National Gallery, the Wallace Collection, and most major museums in the city — all permanent collections are free",
                        "London's job ecosystem is unmatched in Europe — the City of London (finance), Tech City around Shoreditch, the West End for arts and media, and the South Kensington research corridor mean internships are literally a Tube ride away"
                    ],
                    vibes: "London is the only city in the world that can claim three top-10 global universities clustered within walking distance of each other — and it shows. As a student here you are not really studying in London; you are studying with London. Imperial's STEM intensity in South Kensington sits next to royal parks and museum row. UCL's multidisciplinary buzz in Bloomsbury runs on the same streets as the British Library and the publishing houses of Bedford Square. LSE's social-sciences atmosphere in Holborn puts you between the Royal Courts of Justice and the Inns of Court. The city itself is a 32-borough mosaic where you can hear 300 languages on the Tube and eat better Sichuan, Turkish, Nigerian, or South Indian food than in many countries' own capitals. It is expensive, fast, and occasionally exhausting — but no city on Earth offers more to a student who wants to find their people.",
                    landmarks: "Tower Bridge, the Houses of Parliament & Big Ben, Buckingham Palace, the British Museum, Trafalgar Square, the South Bank & Tate Modern, Hyde Park, Camden Market, Borough Market, Westminster Abbey, Notting Hill, Shoreditch, the V&A Museum",
                    costNoteTop: "Note: London is one of the most expensive cities in the world for students. Costs below are shown in British Pounds (£) and vary significantly by zone — Zone 1 and 2 (central) is notably pricier than Zones 3–6.",
                    rentShared: "£900–£1,500", rentStudio: "£1,800–£2,500",
                    utilsShared: "£60–£120", utilsStudio: "£90–£160",
                    foodShared: "£200–£350", foodStudio: "£250–£400",
                    transShared: "£90–£130", transStudio: "£90–£130",
                    entShared: "£120–£250", entStudio: "£200–£400",
                    utils: "£60–£120",
                    food: "£200–£350",
                    trans: "£90–£130",
                    totalShared: "£1,370–£2,350", totalStudio: "£2,430–£3,590"
                },
                london_imperial: {
                    name: "London 🇬🇧", state: "England, United Kingdom", layout: 'editorial_uk',
                    gallery: [
                        { url: "https://images.pexels.com/photos/14936005/pexels-photo-14936005.jpeg", caption: "London, England" },
                        { url: "https://images.pexels.com/photos/16771428/pexels-photo-16771428.png", caption: "Central London" },
                        { url: "https://images.pexels.com/photos/29038568/pexels-photo-29038568.jpeg", caption: "London Street Life" },
                        { url: "https://images.pexels.com/photos/30754134/pexels-photo-30754134.jpeg", caption: "London Culture" },
                        { url: "https://images.pexels.com/photos/372470/pexels-photo-372470.jpeg", caption: "Iconic London" },
                        { url: "https://cms.inspirato.com/ImageGen.ashx?image=%2Fmedia%2F5682444%2FLondon_Dest_16531610X.jpg&width=1081.5", caption: "London Vibes" }
                    ],
                    life: [
                        "London hosts more world-top-10 universities than any other city on Earth — Imperial in South Kensington, UCL in Bloomsbury, and LSE in Holborn all sit within a 3-mile radius of central London",
                        "Imperial's South Kensington campus puts students between the Natural History Museum, the V&A, and the Science Museum — all free to enter year-round",
                        "UCL students live in Bloomsbury, next door to the British Museum and the British Library — and the Wilkins Building portico on Gower Street is the iconic photo of UCL",
                        "LSE's campus around Houghton Street and the Old Building sits on the boundary of Covent Garden and Holborn — a tight, vertical urban campus in the legal and political heart of the city",
                        "The 18+ Student Oyster photocard gives a 30% discount on Tube, bus, DLR, and Overground travel — most students rely on it as London is built around public transport",
                        "Every London university has hundreds of clubs and societies — from rowing on the Thames at Putney to Bollywood dance, finance societies, and the Imperial-UCL-LSE varsity sports rivalries",
                        "Students get cheap or free entry to the Tate Modern, Tate Britain, the National Gallery, the Wallace Collection, and most major museums in the city — all permanent collections are free",
                        "London's job ecosystem is unmatched in Europe — the City of London (finance), Tech City around Shoreditch, the West End for arts and media, and the South Kensington research corridor mean internships are literally a Tube ride away"
                    ],
                    vibes: "London is the only city in the world that can claim three top-10 global universities clustered within walking distance of each other — and it shows. As a student here you are not really studying in London; you are studying with London. Imperial's STEM intensity in South Kensington sits next to royal parks and museum row. UCL's multidisciplinary buzz in Bloomsbury runs on the same streets as the British Library and the publishing houses of Bedford Square. LSE's social-sciences atmosphere in Holborn puts you between the Royal Courts of Justice and the Inns of Court. The city itself is a 32-borough mosaic where you can hear 300 languages on the Tube and eat better Sichuan, Turkish, Nigerian, or South Indian food than in many countries' own capitals. It is expensive, fast, and occasionally exhausting — but no city on Earth offers more to a student who wants to find their people.",
                    landmarks: "Tower Bridge, the Houses of Parliament & Big Ben, Buckingham Palace, the British Museum, Trafalgar Square, the South Bank & Tate Modern, Hyde Park, Camden Market, Borough Market, Westminster Abbey, Notting Hill, Shoreditch, the V&A Museum",
                    costNoteTop: "Note: London is one of the most expensive cities in the world for students. Costs below are shown in British Pounds (£) and vary significantly by zone — Zone 1 and 2 (central) is notably pricier than Zones 3–6.",
                    rentShared: "£900–£1,500", rentStudio: "£1,800–£2,500",
                    utilsShared: "£60–£120", utilsStudio: "£90–£160",
                    foodShared: "£200–£350", foodStudio: "£250–£400",
                    transShared: "£90–£130", transStudio: "£90–£130",
                    entShared: "£120–£250", entStudio: "£200–£400",
                    utils: "£60–£120",
                    food: "£200–£350",
                    trans: "£90–£130",
                    totalShared: "£1,370–£2,350", totalStudio: "£2,430–£3,590"
                },
                london_lse: {
                    name: "London 🇬🇧", state: "England, United Kingdom", layout: 'editorial_uk',
                    gallery: [
                        { url: "https://images.pexels.com/photos/34136/pexels-photo.jpg", caption: "London, England" },
                        { url: "https://images.pexels.com/photos/4651134/pexels-photo-4651134.jpeg", caption: "Central London" },
                        { url: "https://images.pexels.com/photos/14790235/pexels-photo-14790235.jpeg", caption: "London Street Life" },
                        { url: "https://images.pexels.com/photos/31021430/pexels-photo-31021430.jpeg", caption: "London Culture" },
                        { url: "https://going-cms-strapi.s3.us-east-1.amazonaws.com/header_1920x800_2_0c3d58924c.webp", caption: "Iconic London" },
                        { url: "https://images.pexels.com/photos/15713993/pexels-photo-15713993.jpeg", caption: "London Vibes" }
                    ],
                    life: [
                        "London hosts more world-top-10 universities than any other city on Earth — Imperial in South Kensington, UCL in Bloomsbury, and LSE in Holborn all sit within a 3-mile radius of central London",
                        "Imperial's South Kensington campus puts students between the Natural History Museum, the V&A, and the Science Museum — all free to enter year-round",
                        "UCL students live in Bloomsbury, next door to the British Museum and the British Library — and the Wilkins Building portico on Gower Street is the iconic photo of UCL",
                        "LSE's campus around Houghton Street and the Old Building sits on the boundary of Covent Garden and Holborn — a tight, vertical urban campus in the legal and political heart of the city",
                        "The 18+ Student Oyster photocard gives a 30% discount on Tube, bus, DLR, and Overground travel — most students rely on it as London is built around public transport",
                        "Every London university has hundreds of clubs and societies — from rowing on the Thames at Putney to Bollywood dance, finance societies, and the Imperial-UCL-LSE varsity sports rivalries",
                        "Students get cheap or free entry to the Tate Modern, Tate Britain, the National Gallery, the Wallace Collection, and most major museums in the city — all permanent collections are free",
                        "London's job ecosystem is unmatched in Europe — the City of London (finance), Tech City around Shoreditch, the West End for arts and media, and the South Kensington research corridor mean internships are literally a Tube ride away"
                    ],
                    vibes: "London is the only city in the world that can claim three top-10 global universities clustered within walking distance of each other — and it shows. As a student here you are not really studying in London; you are studying with London. Imperial's STEM intensity in South Kensington sits next to royal parks and museum row. UCL's multidisciplinary buzz in Bloomsbury runs on the same streets as the British Library and the publishing houses of Bedford Square. LSE's social-sciences atmosphere in Holborn puts you between the Royal Courts of Justice and the Inns of Court. The city itself is a 32-borough mosaic where you can hear 300 languages on the Tube and eat better Sichuan, Turkish, Nigerian, or South Indian food than in many countries' own capitals. It is expensive, fast, and occasionally exhausting — but no city on Earth offers more to a student who wants to find their people.",
                    landmarks: "Tower Bridge, the Houses of Parliament & Big Ben, Buckingham Palace, the British Museum, Trafalgar Square, the South Bank & Tate Modern, Hyde Park, Camden Market, Borough Market, Westminster Abbey, Notting Hill, Shoreditch, the V&A Museum",
                    costNoteTop: "Note: London is one of the most expensive cities in the world for students. Costs below are shown in British Pounds (£) and vary significantly by zone — Zone 1 and 2 (central) is notably pricier than Zones 3–6.",
                    rentShared: "£900–£1,500", rentStudio: "£1,800–£2,500",
                    utilsShared: "£60–£120", utilsStudio: "£90–£160",
                    foodShared: "£200–£350", foodStudio: "£250–£400",
                    transShared: "£90–£130", transStudio: "£90–£130",
                    entShared: "£120–£250", entStudio: "£200–£400",
                    utils: "£60–£120",
                    food: "£200–£350",
                    trans: "£90–£130",
                    totalShared: "£1,370–£2,350", totalStudio: "£2,430–£3,590"
                }
            }
        };

        // Now that appData is fully defined, walk every university heroImage and
        // every city gallery item URL and warm them into the preload cache. By the
        // time the user clicks through to any university card or city page, the
        // bitmap is already in memory and the navigation feels instantaneous.
        preloadFromAppData();

        // --- 2. Dynamic Smart Search Filter ---
        // Context-aware filter — detects which country page is currently
        // active and filters that grid using the currently visible search
        // input + city dropdown. The header search container is shared
        // across USA + UK pages, so we just swap the city options on
        // navigation (see navigateTo) and re-use this same function.
        function filterUniversities() {
            const query = document.getElementById('uni-search').value.toLowerCase();
            const cityFilter = document.getElementById('city-filter').value.toLowerCase();
            // Pick the correct grid based on which country page is active.
            // Default to USA so we never break the original behaviour.
            const gridSelector = (currentCountryPage === 'page-uk-unis')
                ? '#uk-grid .uni-card'
                : '#usa-grid .uni-card';
            const cards = document.querySelectorAll(gridSelector);
            
            cards.forEach(card => {
                const name = card.getAttribute('data-name');
                const city = card.getAttribute('data-city');
                
                const matchesName = name.includes(query);
                const matchesCity = (cityFilter === 'all' || city === cityFilter);
                
                if (matchesName && matchesCity) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Helper — rebuild the city dropdown options based on which
        // country page is active. Keeps "All Cities" as the default
        // entry and swaps in the appropriate city list below it.
        function setCityFilterOptionsFor(pageId) {
            const dropdown = document.getElementById('city-filter');
            if (!dropdown) return;
            let options;
            if (pageId === 'page-uk-unis') {
                options = [
                    { value: 'all',        label: 'All Cities' },
                    { value: 'oxford',     label: 'Oxford' },
                    { value: 'cambridge',  label: 'Cambridge' },
                    { value: 'london',     label: 'London' },
                    { value: 'manchester', label: 'Manchester' },
                    { value: 'birmingham', label: 'Birmingham' }
                ];
            } else {
                // USA default
                options = [
                    { value: 'all',          label: 'All Cities' },
                    { value: 'new york',     label: 'New York' },
                    { value: 'boston area',  label: 'Boston Area' },
                    { value: 'california',   label: 'California' },
                    { value: 'other cities', label: 'Other Cities' }
                ];
            }
            dropdown.innerHTML = options.map(function (o) {
                return '<option value="' + o.value + '">' + o.label + '</option>';
            }).join('');
            // Reset to "All Cities" whenever we swap context so the user
            // never sees stale selections from the previous country.
            dropdown.value = 'all';
        }

        // --- 3. Dynamic Injectors & Modal Logic ---
        function loadUniversity(uniId) {
            currentActiveUniId = uniId;
            const uni = appData.universities[uniId];
            
            // Update the dynamic back button to point to the correct country page (USA or UK)
            const backBtn = document.getElementById('dyn-back-to-country-btn');
            if (backBtn) {
                if (currentCountryPage === 'page-uk-unis') {
                    backBtn.innerText = '• Back to UK';
                    backBtn.setAttribute('onclick', "navigateTo('page-uk-unis')");
                } else {
                    backBtn.innerText = '• Back to USA';
                    backBtn.setAttribute('onclick', "navigateTo('page-usa-unis')");
                }
            }
            
            // Fix Background Image Setup
            if (uni.heroImage) {
                // Set non-image background properties first so they are ready
                // for the smooth image swap on the next animation frame.
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundAttachment = 'fixed';
                // Use the smooth applier: it waits for the decoded bitmap (already
                // in the cache from preload) and applies on the next paint frame.
                applyBodyBackgroundSmoothly(uni.heroImage);
                document.getElementById('page-overlay').style.display = 'block';
                document.getElementById('page-overlay').style.background = 'rgba(5, 8, 25, 0.72)';
            } else {
                document.body.style.backgroundImage = 'none';
                document.body.style.backgroundColor = '#060919';
                document.getElementById('page-overlay').style.display = 'block';
                document.getElementById('page-overlay').style.background = 'rgba(11, 15, 38, 0.9)';
            }

            // Populate Text Info
            document.getElementById('dyn-uni-name-hero').innerText = uni.name;
            document.getElementById('dyn-uni-rank').innerText = "#" + uni.rank;
            document.getElementById('dyn-uni-tuition').innerText = uni.tuition;
            const cityLink = document.getElementById('dyn-uni-city');
            cityLink.innerText = uni.cityName;
            cityLink.onclick = () => loadCity(uni.cityId);
            // Also wire the supplementary "view →" hint (sits directly under the
            // city name in the Location data-point) so the entire affordance is
            // clickable — keeps the click target generous and makes the hint
            // discoverable. The hint text itself is static "view →" defined in
            // markup; we only need to refresh its click handler for each uni.
            const cityViewHint = document.getElementById('dyn-uni-city-view');
            if (cityViewHint) cityViewHint.onclick = () => loadCity(uni.cityId);

            // Populate Info Grid Previews
            document.getElementById('dyn-uni-overview').innerText = uni.overview;
            document.getElementById('dyn-uni-finreq').innerText = uni.financialReqs;
            document.getElementById('dyn-uni-facts').innerHTML = uni.quickFacts.map(fact => `<li>${fact}</li>`).join('');
            
            // Populate Admission Requirements Preview
            if(uni.admissionRequirements) {
                document.getElementById('dyn-uni-admission').innerHTML = uni.admissionRequirements.map(req => `<li>${req}</li>`).join('');
            } else {
                document.getElementById('dyn-uni-admission').innerHTML = `<li>Admission data updating soon.</li>`;
            }

            // Populate Application & Deadlines Preview — companion to the
            // Admission Requirements card. Shows the same preview/fade treatment
            // as the other glass info-cards on the university detail page; the
            // full deadlines list is rendered inside the info modal when the
            // user clicks the card (see openInfoModal('applicationDeadlines')).
            // Real, researched application-deadline data is wired in per uni —
            // see the `applicationDeadlines` arrays in the universities object.
            if(uni.applicationDeadlines) {
                document.getElementById('dyn-uni-deadlines').innerHTML = uni.applicationDeadlines.map(d => `<li>${d}</li>`).join('');
            } else {
                document.getElementById('dyn-uni-deadlines').innerHTML = `<li>Deadline data updating soon.</li>`;
            }

            // Populate Tabs (Bachelors) - Updated with Expandable Layout
            // The "Explore Your Future with AI" button now passes the program
            // title and the parent university name through to openAIFuturePage()
            // so the AI overlay can render them as its hero heading + pill.
            // Quotes inside titles are encoded via encodeForJsAttribute() to
            // avoid breaking the inline onclick attribute.
            if(uni.bachelors && uni.bachelors.length > 0) {
                document.getElementById('dyn-bachelors-list').innerHTML = uni.bachelors.map(b => 
                    `<li class="list-item glass-card program-card" onclick="toggleProgramCard(this)">
                        <div class="program-card-header">
                            <h4>${b.title}</h4>
                            <div class="meta" style="color: var(--text-muted);">${b.duration}</div>
                            <p>${b.desc}</p>
                        </div>
                        <div class="program-card-body">
                            <div class="expanded-detail-label">Career Paths:</div>
                            <div class="career-chips">
                                ${b.careers.map(c => `<span class="career-chip">${c}</span>`).join('')}
                            </div>
                            <div class="expanded-detail-label">Average Starting Salary:</div>
                            <div class="expanded-detail-text">${b.salary}</div>
                            <div class="expanded-detail-label">Industry Demand in 2026:</div>
                            <div class="expanded-detail-text">${b.demand}</div>
                            <div class="btn-outline-gold" onclick="event.stopPropagation(); openAIFuturePage('${encodeForJsAttribute(b.title)}', '${encodeForJsAttribute(uni.name)}')">🚀 Explore Your Future with AI →</div>
                        </div>
                    </li>`
                ).join('');
            } else {
                document.getElementById('dyn-bachelors-list').innerHTML = `<div class="editorial-section glass-card" style="text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted); font-size: 1.1rem; margin:0;">Bachelor program data updating soon.</p></div>`;
            }

            // Populate Tabs (Masters) - Updated with Expandable Layout
            // Same wiring as the Bachelor list above — the AI button passes
            // the program title and university name into openAIFuturePage().
            if(uni.masters && uni.masters.length > 0) {
                document.getElementById('dyn-masters-list').innerHTML = uni.masters.map(m => 
                    `<li class="list-item glass-card program-card" onclick="toggleProgramCard(this)">
                        <div class="program-card-header">
                            <h4>${m.title}</h4>
                            <div class="meta" style="color: var(--text-muted);">${m.duration}</div>
                            <p>${m.desc}</p>
                        </div>
                        <div class="program-card-body">
                            <div class="expanded-detail-label">Career Paths:</div>
                            <div class="career-chips">
                                ${m.careers.map(c => `<span class="career-chip">${c}</span>`).join('')}
                            </div>
                            <div class="expanded-detail-label">Average Starting Salary:</div>
                            <div class="expanded-detail-text">${m.salary}</div>
                            <div class="expanded-detail-label">Industry Demand in 2026:</div>
                            <div class="expanded-detail-text">${m.demand}</div>
                            <div class="btn-outline-gold" onclick="event.stopPropagation(); openAIFuturePage('${encodeForJsAttribute(m.title)}', '${encodeForJsAttribute(uni.name)}')">🚀 Explore Your Future with AI →</div>
                        </div>
                    </li>`
                ).join('');
            } else {
                document.getElementById('dyn-masters-list').innerHTML = `<div class="editorial-section glass-card" style="text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted); font-size: 1.1rem; margin:0;">Graduate program data updating soon.</p></div>`;
            }

            // Populate Tabs (Scholarships)
            if(uni.scholarships && uni.scholarships.length > 0) {
                document.getElementById('dyn-scholarships-list').innerHTML = uni.scholarships.map(s => 
                    `<li class="list-item glass-card"><h4>${s.title}</h4><div class="meta">${s.amount} • ${s.eligibility}</div><p>${s.desc}</p></li>`
                ).join('');
            } else {
                document.getElementById('dyn-scholarships-list').innerHTML = `<div class="editorial-section glass-card" style="text-align: center; padding: 60px 20px;"><p style="color: var(--text-muted); font-size: 1.1rem; margin:0;">Scholarship data updating soon.</p></div>`;
            }

            navigateTo('page-university-detail');
            resetTabs('page-university-detail');
        }
        
        function toggleProgramCard(element) {
            const parentList = element.closest('ul');
            const currentlyExpanded = parentList.querySelector('.program-card.expanded');
            
            if (currentlyExpanded === element) {
                element.classList.remove('expanded');
            } else {
                if (currentlyExpanded) {
                    currentlyExpanded.classList.remove('expanded');
                }
                element.classList.add('expanded');
            }
        }

        function openInfoModal(section) {
            if(!currentActiveUniId) return;
            const uni = appData.universities[currentActiveUniId];
            const modal = document.getElementById('info-modal');
            const modalBg = document.getElementById('modal-background-blur');
            const title = document.getElementById('modal-title');
            const body = document.getElementById('modal-body-content');

            // Apply background blur effect — preload the image to guarantee the
            // decoded bitmap is cached so the modal opens with the blurred image
            // already painted, with no visible fetch delay.
            if (uni.heroImage) {
                preloadImage(uni.heroImage, 'high');
                modalBg.style.backgroundImage = `url('${uni.heroImage}')`;
            } else {
                modalBg.style.backgroundImage = 'none';
            }

            if(section === 'overview') {
                title.innerText = 'University Overview';
                body.innerHTML = `<p>${uni.overview}</p>`;
            } else if(section === 'quickFacts') {
                title.innerText = 'Quick Facts';
                body.innerHTML = `<ul>${uni.quickFacts.map(fact => `<li>${fact}</li>`).join('')}</ul>`;
            } else if(section === 'financialReqs') {
                title.innerText = 'Financial Requirements';
                body.innerHTML = `<p>${uni.financialReqs}</p>`;
            } else if(section === 'admissionRequirements') {
                title.innerText = 'Admission Requirements';
                if(uni.admissionRequirements) {
                    body.innerHTML = `<ul>${uni.admissionRequirements.map(req => `<li>${req}</li>`).join('')}</ul>`;
                } else {
                    body.innerHTML = `<p>Admission details updating soon.</p>`;
                }
            } else if(section === 'applicationDeadlines') {
                // Application & Deadlines modal — opens when the user clicks
                // the Application & Deadlines card on the university detail
                // page. Renders the full list of researched application
                // deadlines, scholarship cut-offs, visa-processing notes and
                // a "best time to apply" recommendation for the university.
                title.innerText = 'Application & Deadlines';
                if(uni.applicationDeadlines) {
                    body.innerHTML = `<ul>${uni.applicationDeadlines.map(d => `<li>${d}</li>`).join('')}</ul>`;
                } else {
                    body.innerHTML = `<p>Deadline details updating soon.</p>`;
                }
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        }

        function cancelInfoModal() {
            closeInfoModal();
        }

        function closeInfoModal() {
            const modal = document.getElementById('info-modal');
            modal.classList.remove('active');
            document.body.style.overflow = ''; 
        }

        function closeModalOnOutsideClick(evt) {
            const contentBox = document.getElementById('modal-content-box');
            if (!contentBox.contains(evt.target)) {
                closeInfoModal();
            }
        }

        function loadCity(cityId) {
            const city = appData.cities[cityId];
            
            document.getElementById('dyn-city-name').innerText = city.name;
            document.getElementById('dyn-city-state').innerText = city.state;

            const standardView = document.getElementById('standard-city-view');
            const editorialView = document.getElementById('editorial-city-view');

            // Apply full screen fixed background image layout dynamically for ALL city pages consistently
            document.body.style.position = "static"; 
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundRepeat = "no-repeat";
            document.body.style.backgroundPosition = "center center";
            document.body.style.backgroundAttachment = "fixed";
            // Smooth swap — the city base background is already in the preload cache.
            applyBodyBackgroundSmoothly("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920");
            
            const overlay = document.getElementById('page-overlay');
            overlay.style.display = 'block';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100vw';
            overlay.style.height = '100vh';
            overlay.style.zIndex = '0';
            overlay.style.background = 'rgba(5, 8, 20, 0.88)';

            if (city.layout === 'editorial') {
                standardView.style.display = 'none';
                editorialView.style.display = 'block';

                const costTableHTML = `
                    <p class="meta" style="margin-bottom: 20px; color: var(--text-muted);">${city.costNoteTop || 'Note: Costs vary highly based on lifestyle and neighborhood.'}</p>
                    <table>
                        <thead>
                            <tr><th>Category</th><th>Shared Appt</th><th>Studio Appt</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Rent</td><td>${city.rentShared}</td><td>${city.rentStudio}</td></tr>
                            <tr><td>Utilities</td><td>${city.utilsShared || city.utils}</td><td>${city.utilsStudio || city.utils}</td></tr>
                            <tr><td>Groceries/Food</td><td>${city.foodShared || city.food}</td><td>${city.foodStudio || city.food}</td></tr>
                            <tr><td>Transportation</td><td>${city.transShared || city.trans}</td><td>${city.transStudio || city.trans}</td></tr>
                            <tr><td>Entertainment</td><td>${city.entShared || '$200'}</td><td>${city.entStudio || '$300'}</td></tr>
                            <tr style="font-weight: 600; color: var(--accent-gold); background: rgba(240,192,64,0.05);">
                                <td>Total Est.</td><td>${city.totalShared}</td><td>${city.totalStudio}</td>
                            </tr>
                        </tbody>
                    </table>
                    ${city.costNoteBottom ? `<p class="meta" style="margin-top: 15px; font-size: 0.85rem; color: var(--text-muted);">${city.costNoteBottom}</p>` : ''}
                `;

                let additionalGridHTML = '';
                if (cityId === 'nyc') {
                    additionalGridHTML = `
                        <div class="editorial-section" style="margin-top: 40px;">
                            <h3 class="editorial-heading" style="color: var(--accent-gold); border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">📸 New York City — A Visual Story</h3>
                            <div class="story-gallery-grid">
                                <div class="story-card"><img src="https://images.pexels.com/photos/13356889/pexels-photo-13356889.jpeg" alt="Billionaires Row"><div class="gallery-caption-overlay">Billionaires Row</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/20263255/pexels-photo-20263255.jpeg" alt="New York Panorama"><div class="gallery-caption-overlay">New York Panorama</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/33619999/pexels-photo-33619999.jpeg" alt="Chrysler Building"><div class="gallery-caption-overlay">Chrysler Building</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/941459/pexels-photo-941459.jpeg" alt="Lower Manhattan Skyline"><div class="gallery-caption-overlay">Lower Manhattan Skyline</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/32046537/pexels-photo-32046537.jpeg" alt="Hudson Yards"><div class="gallery-caption-overlay">Hudson Yards</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/35491608/pexels-photo-35491608.jpeg" alt="Macy's Herald Square"><div class="gallery-caption-overlay">Macy's Herald Square</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/5450747/pexels-photo-5450747.jpeg" alt="New York City View"><div class="gallery-caption-overlay">New York City View</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/29102405/pexels-photo-29102405.jpeg" alt="Downtown Manhattan"><div class="gallery-caption-overlay">Downtown Manhattan</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/32401950/pexels-photo-32401950.jpeg" alt="Brooklyn Waterfront"><div class="gallery-caption-overlay">Brooklyn Waterfront</div></div>
                            </div>
                        </div>
                    `;
                } else if (cityId === 'pasadena') {
                    additionalGridHTML = `
                        <div class="editorial-section" style="margin-top: 40px;">
                            <h3 class="editorial-heading" style="color: var(--accent-gold); border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">📸 Los Angeles & Pasadena — A Visual Story</h3>
                            <div class="story-gallery-grid">
                                <div class="story-card"><img src="https://images.pexels.com/photos/4658510/pexels-photo-4658510.jpeg" alt="Los Angeles"><div class="gallery-caption-overlay">Los Angeles</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/285959/pexels-photo-285959.jpeg" alt="Hollywood Sign"><div class="gallery-caption-overlay">Hollywood Sign</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/35291215/pexels-photo-35291215.jpeg" alt="California Vibes"><div class="gallery-caption-overlay">California Vibes</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/14657727/pexels-photo-14657727.jpeg" alt="Pasadena"><div class="gallery-caption-overlay">Pasadena</div></div>
                                <div class="story-card"><img src="https://images.unsplash.com/photo-1585412168334-8fa91429cc64?fm=jpg&q=60&w=3000&auto=format&fit=crop" alt="LA At Night"><div class="gallery-caption-overlay">LA At Night</div></div>
                                <div class="story-card"><img src="https://images.trvl-media.com/place/8365/cfe60f08-750d-4a54-b43a-7e13ae8f6546.jpg" alt="Santa Monica Beach"><div class="gallery-caption-overlay">Downtown LA</div></div>
                                <div class="story-card"><img src="https://res.klook.com/image/upload/fl_lossy.progressive,q_60/v1755071475/destination/zkmjal6ohhft1cdmvnni.jpg" alt="Griffith Observatory"><div class="gallery-caption-overlay">Hollywood Sign</div></div>
                                <div class="story-card"><img src="https://images.ctfassets.net/i3kf1olze1gn/5aS59BlpthJHLi5kJb45b0/31e626d226404c7f97522ec3be43122f/venti-views-2td44mctvmI-unsplash.jpg" alt="Venice Beach"><div class="gallery-caption-overlay">Griffith Observatory</div></div>
                                <div class="story-card"><img src="https://periodicadventures.com/wp-content/uploads/2019/05/Santa-Monica-1-of-1.jpg" alt="Santa Monica"><div class="gallery-caption-overlay">Santa Monica</div></div>
                            </div>
                        </div>
                    `;
                } else if (cityId === 'philadelphia') {
                    additionalGridHTML = `
                        <div class="editorial-section" style="margin-top: 40px;">
                            <h3 class="editorial-heading" style="color: var(--accent-gold); border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">📸 Philadelphia — A Visual Story</h3>
                            <div class="story-gallery-grid">
                                <div class="story-card"><img src="https://images.pexels.com/photos/34467552/pexels-photo-34467552.jpeg" alt="Philadelphia Evening Sky"><div class="gallery-caption-overlay">Philadelphia Evening Sky</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/27585619/pexels-photo-27585619.jpeg" alt="Philadelphia Clock Tower"><div class="gallery-caption-overlay">Philadelphia Clock Tower</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/6379121/pexels-photo-6379121.jpeg" alt="Philadelphia By Night"><div class="gallery-caption-overlay">Philadelphia By Night</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/1675198/pexels-photo-1675198.jpeg" alt="Philadelphia Street Art"><div class="gallery-caption-overlay">Philadelphia Street Art</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/33883307/pexels-photo-33883307.jpeg" alt="Historic Philadelphia"><div class="gallery-caption-overlay">Historic Philadelphia</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/12304691/pexels-photo-12304691.jpeg" alt="Philadelphia Waterfront"><div class="gallery-caption-overlay">Philadelphia Waterfront</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/6379231/pexels-photo-6379231.jpeg" alt="Philadelphia Skyline"><div class="gallery-caption-overlay">Philadelphia Skyline</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/35275656/pexels-photo-35275656.jpeg" alt="Philadelphia Bridge Skyline"><div class="gallery-caption-overlay">Philadelphia Bridge Skyline</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/11531611/pexels-photo-11531611.jpeg" alt="Philadelphia Evening Skyline"><div class="gallery-caption-overlay">Philadelphia Evening Skyline</div></div>
                            </div>
                        </div>
                    `;
                } else if (cityId === 'columbia_nyc') {
                    additionalGridHTML = `
                        <div class="editorial-section" style="margin-top: 40px;">
                            <h3 class="editorial-heading" style="color: var(--accent-gold); border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">📸 New York City — A Visual Story</h3>
                            <div class="story-gallery-grid">
                                <div class="story-card"><img src="https://images.pexels.com/photos/28381457/pexels-photo-28381457.jpeg" alt="Midtown Manhattan"><div class="gallery-caption-overlay">Midtown Manhattan</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/29102405/pexels-photo-29102405.jpeg" alt="New York Skyline"><div class="gallery-caption-overlay">New York Skyline</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/3583571/pexels-photo-3583571.jpeg" alt="Chrysler Building"><div class="gallery-caption-overlay">Chrysler Building</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/8905037/pexels-photo-8905037.jpeg" alt="Lower Manhattan Skyline"><div class="gallery-caption-overlay">Lower Manhattan Skyline</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/19005285/pexels-photo-19005285.jpeg" alt="Hudson Yards"><div class="gallery-caption-overlay">Hudson Yards</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/3440444/pexels-photo-3440444.jpeg" alt="Manhattan Financial District"><div class="gallery-caption-overlay">Manhattan Financial District</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/32401950/pexels-photo-32401950.jpeg" alt="New York City View"><div class="gallery-caption-overlay">New York City View</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/20195758/pexels-photo-20195758.jpeg" alt="Downtown Manhattan"><div class="gallery-caption-overlay">Downtown Manhattan</div></div>
                                <div class="story-card"><img src="https://images.pexels.com/photos/35491608/pexels-photo-35491608.jpeg" alt="Brooklyn Waterfront"><div class="gallery-caption-overlay">Brooklyn Waterfront</div></div>
                            </div>
                        </div>
                    `;
                } else if (cityId === 'princeton_nj' || cityId === 'chicago') {
                    additionalGridHTML = '';
                }

                editorialView.innerHTML = `
                    <div class="gallery-card editorial-card"><img src="${city.gallery[0].url}" alt="${city.gallery[0].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[0].caption || ''}</div></div>
                    <div class="gallery-card editorial-card"><img src="${city.gallery[1].url}" alt="${city.gallery[1].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[1].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">🎓 Student Life</h3>
                        <ul class="city-list">${city.life.map(l => `<li>${l}</li>`).join('')}</ul>
                    </div>

                    <div class="gallery-card editorial-card"><img src="${city.gallery[2].url}" alt="${city.gallery[2].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[2].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">✨ City Vibes</h3>
                        <p class="city-vibe-paragraph" style="font-size: 1.1rem; margin-bottom: 20px;">${city.vibes}</p>
                        <p class="meta" style="color: var(--accent-gold);">Famous Landmarks: ${city.landmarks}</p>
                    </div>

                    <div class="gallery-card editorial-card"><img src="${city.gallery[3].url}" alt="${city.gallery[3].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[3].caption || ''}</div></div>
                    <div class="gallery-card editorial-card"><img src="${city.gallery[4].url}" alt="${city.gallery[4].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[4].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">💰 Cost of Living</h3>
                        ${costTableHTML}
                    </div>
                    ${'' /* The sixth gallery image (gallery[5]) is rendered with height:100% so it fully fills the parent .gallery-card.editorial-card rectangle. Earlier this used a fixed 420px height which did not match the CSS-defined container height (400px desktop, 300px mobile), leaving a visible gap on the rounded corners — most noticeable on MIT (Cambridge), Harvard, Yale (New Haven), Princeton, and University of Chicago city pages where this 6th image appears. Setting height:100% mirrors every other editorial gallery image on this page and guarantees the rounded rectangle is fully covered. */}
                    ${city.gallery[5] ? `<div class="gallery-card editorial-card" style="margin-top:40px;"><img src="${city.gallery[5].url}" alt="${city.gallery[5].caption || ''}" style="width: 100%; height: 100%; object-fit: cover; display: block;"><div class="gallery-caption-overlay">${city.gallery[5].caption || ''}</div></div>` : ''}
                    ${additionalGridHTML}
                `;

                // Stamp high-performance attributes and GPU-acceleration styles
                // on every <img> we just rendered so hover scales are buttery
                // smooth and the bitmap is already warm in the cache.
                enhanceImagesIn(editorialView);

                // Clean up empty caption overlays for city layouts that do not utilize text overlays
                if(cityId === 'chicago') {
                    const captions = editorialView.querySelectorAll('.gallery-caption-overlay');
                    captions.forEach(cap => {
                        if(cap.innerText.trim() === "") {
                            cap.style.display = 'none';
                        }
                    });
                }

            } else if (city.layout === 'editorial_uk') {
                // UK editorial layout — mirrors the US editorial structure with one key
                // difference: after the Student Life section, gallery[2] and gallery[3]
                // appear as two SIDE-BY-SIDE half-width blocks that together span the
                // full width of a regular rectangular gallery card above. Both photos
                // use object-fit:contain so they are shown FULLY without any cropping.
                // The rest of the flow remains identical to the US editorial layout:
                // intro photos → Student Life → half-width pair → photo → City Vibes
                // → photo → Cost of Living at the end.
                standardView.style.display = 'none';
                editorialView.style.display = 'block';

                const costTableHTML_uk = `
                    <p class="meta" style="margin-bottom: 20px; color: var(--text-muted);">${city.costNoteTop || 'Note: Costs vary highly based on lifestyle and neighborhood.'}</p>
                    <table>
                        <thead>
                            <tr><th>Category</th><th>Shared Appt</th><th>Studio Appt</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Rent</td><td>${city.rentShared}</td><td>${city.rentStudio}</td></tr>
                            <tr><td>Utilities</td><td>${city.utilsShared || city.utils}</td><td>${city.utilsStudio || city.utils}</td></tr>
                            <tr><td>Groceries/Food</td><td>${city.foodShared || city.food}</td><td>${city.foodStudio || city.food}</td></tr>
                            <tr><td>Transportation</td><td>${city.transShared || city.trans}</td><td>${city.transStudio || city.trans}</td></tr>
                            <tr><td>Entertainment</td><td>${city.entShared || '£150'}</td><td>${city.entStudio || '£250'}</td></tr>
                            <tr style="font-weight: 600; color: var(--accent-gold); background: rgba(240,192,64,0.05);">
                                <td>Total Est.</td><td>${city.totalShared}</td><td>${city.totalStudio}</td>
                            </tr>
                        </tbody>
                    </table>
                    ${city.costNoteBottom ? `<p class="meta" style="margin-top: 15px; font-size: 0.85rem; color: var(--text-muted);">${city.costNoteBottom}</p>` : ''}
                `;

                editorialView.innerHTML = `
                    <div class="gallery-card editorial-card"><img src="${city.gallery[0].url}" alt="${city.gallery[0].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[0].caption || ''}</div></div>
                    <div class="gallery-card editorial-card"><img src="${city.gallery[1].url}" alt="${city.gallery[1].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[1].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">🎓 Student Life</h3>
                        <ul class="city-list">${city.life.map(l => `<li>${l}</li>`).join('')}</ul>
                    </div>

                    <div class="uk-half-row">
                        <div class="uk-half-card"><img src="${city.gallery[2].url}" alt="${city.gallery[2].caption || ''}"></div>
                        <div class="uk-half-card"><img src="${city.gallery[3].url}" alt="${city.gallery[3].caption || ''}"></div>
                    </div>

                    <div class="gallery-card editorial-card"><img src="${city.gallery[4].url}" alt="${city.gallery[4].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[4].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">✨ City Vibes</h3>
                        <p class="city-vibe-paragraph" style="font-size: 1.1rem; margin-bottom: 20px;">${city.vibes}</p>
                        <p class="meta" style="color: var(--accent-gold);">Famous Landmarks: ${city.landmarks}</p>
                    </div>

                    <div class="gallery-card editorial-card"><img src="${city.gallery[5].url}" alt="${city.gallery[5].caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;"><div class="gallery-caption-overlay">${city.gallery[5].caption || ''}</div></div>
                    
                    <div class="editorial-section">
                        <h3 class="editorial-heading" style="border-bottom: 2px solid var(--accent-gold); padding-bottom: 10px;">💰 Cost of Living</h3>
                        ${costTableHTML_uk}
                    </div>
                `;

                // Stamp high-performance attributes and GPU-acceleration styles
                // on every <img> in the UK editorial layout so hover scales are
                // buttery smooth and the side-by-side half-row pair has no jitter.
                enhanceImagesIn(editorialView);

            } else {
                standardView.style.display = 'block';
                editorialView.style.display = 'none';

                document.getElementById('dyn-city-vibes').innerText = city.vibes;
                document.getElementById('dyn-city-landmarks').innerText = "Famous Landmarks: " + city.landmarks;
                
                const galleryContainer = document.getElementById('dyn-city-gallery');
                if (city.gallery && city.gallery.length > 0) {
                    galleryContainer.style.display = 'flex';
                    galleryContainer.innerHTML = city.gallery.map(item => `
                        <div class="gallery-card" style="margin-bottom:30px;">
                            <img src="${item.url}" alt="${item.caption || ''}" style="width:100%; height:100%; object-fit:cover; display:block;">
                            <div class="gallery-caption-overlay">${item.caption || ''}</div>
                        </div>
                    `).join('');
                    // Stamp performance attributes and GPU-accel styles on every
                    // gallery <img> rendered for the standard (non-editorial) city
                    // page layout — same buttery hover treatment as editorial.
                    enhanceImagesIn(galleryContainer);
                } else {
                    galleryContainer.style.display = 'none';
                    galleryContainer.innerHTML = ''; 
                }

                if (city.life && city.life.length > 0) {
                    document.getElementById('dyn-city-life').innerHTML = city.life.map(l => `<li>${l}</li>`).join('');
                } else {
                    document.getElementById('dyn-city-life').innerHTML = '<li>City student life tracking metrics updating soon.</li>';
                }
                
                document.getElementById('cost-rent-shared').innerText = city.rentShared;
                document.getElementById('cost-rent-studio').innerText = city.rentStudio;
                document.getElementById('cost-utils-shared').innerText = city.utils;
                document.getElementById('cost-utils-studio').innerText = city.utils;
                document.getElementById('cost-food-shared').innerText = city.food;
                document.getElementById('cost-food-studio').innerText = city.food;
                document.getElementById('cost-trans-shared').innerText = city.trans;
                document.getElementById('cost-trans-studio').innerText = city.trans;
                document.getElementById('cost-total-shared').innerText = city.totalShared;
                document.getElementById('cost-total-studio').innerText = city.totalStudio;
            }

            navigateTo('page-city-detail');
            if(city.layout !== 'editorial' && city.layout !== 'editorial_uk') resetTabs('page-city-detail');
        }

        // --- 5. Navigation & UI Core ---
        function navigateTo(pageId) {
            const currentPage = document.querySelector('.section.active');
            const searchContainer = document.getElementById('global-search-container');
            
            // Clear all background states
            document.body.classList.remove('usa-bg-active', 'home-bg-active', 'uk-bg-active');
            
            // Apply appropriate background and UI states
            if(pageId === 'page-home') {
                document.body.classList.add('home-bg-active');
                searchContainer.style.display = 'none';
            } else if(pageId === 'page-usa-unis') {
                document.body.classList.add('usa-bg-active');
                searchContainer.style.display = 'flex';
                currentCountryPage = 'page-usa-unis';
                // Load USA cities into the dropdown BEFORE clearing/filtering
                setCityFilterOptionsFor('page-usa-unis');
                document.getElementById('uni-search').value = ''; 
                filterUniversities(); 
            } else if(pageId === 'page-uk-unis') {
                document.body.classList.add('uk-bg-active');
                // Same header search experience as the USA page —
                // input + city dropdown, just scoped to the UK grid.
                searchContainer.style.display = 'flex';
                currentCountryPage = 'page-uk-unis';
                // Load UK cities (Oxford, Cambridge, London, Manchester, Birmingham)
                setCityFilterOptionsFor('page-uk-unis');
                document.getElementById('uni-search').value = '';
                filterUniversities();
            } else {
                searchContainer.style.display = 'none';
            }

            // Cleanup dynamic page backgrounds if we are completely leaving context tabs
            if (pageId !== 'page-university-detail' && pageId !== 'page-city-detail') {
                document.body.style.backgroundImage = 'none';
                const overlay = document.getElementById('page-overlay');
                if(overlay) overlay.style.display = 'none';
            }

            if (currentPage) {
                currentPage.style.opacity = '0';
                currentPage.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    currentPage.classList.remove('active');
                    showTargetPage(pageId);
                }, 200); // Bug 2 Acceleration Fix: Use matching rapid structural execution times to shield repaints
            } else {
                showTargetPage(pageId);
            }
        }

        function showTargetPage(pageId) {
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                targetPage.classList.add('active');
                setTimeout(() => {
                    targetPage.style.opacity = '1';
                    targetPage.style.transform = 'translateY(0)';
                }, 50);
            }
        }

        function openTab(evt, tabId) {
            const tabControlsContainer = evt.currentTarget.parentElement;
            const tabButtons = tabControlsContainer.querySelectorAll('.tab-btn');
            const parentSection = tabControlsContainer.parentElement;
            const tabContents = parentSection.querySelectorAll('.tab-content');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            evt.currentTarget.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        }

        function selectTab(evt, tabId) {
            openTab(evt, tabId);
        }

        function resetTabs(pageId) {
            const page = document.getElementById(pageId);
            const firstTabBtn = page.querySelector('.tab-btn');
            if(firstTabBtn) firstTabBtn.click();
        }

        window.addEventListener('load', () => {
             // On initial page load, stamp every static <img> already in the DOM
             // with the high-performance attributes and GPU-acceleration styles.
             // This catches country card images, university card images, and any
             // other static gallery imagery that exists in index.html before any
             // dynamic rendering happens.
             enhanceImagesIn(document.body);

             const activePage = document.querySelector('.section.active');
             if(activePage){
                 if(activePage.id === 'page-usa-unis') {
                     document.body.classList.add('usa-bg-active');
                     document.getElementById('global-search-container').style.display = 'flex';
                 } else if(activePage.id === 'page-home') {
                     document.body.classList.add('home-bg-active');
                     document.getElementById('global-search-container').style.display = 'none';
                 }
                 activePage.style.opacity = '1';
                 activePage.style.transform = 'translateY(0)';
             }
        });
    
        // --- Cinematic Ambient Parallax Engine ---
        // Smoothness pass (May 2026): the original loop ran requestAnimationFrame
        // unconditionally forever, even when the mouse hadn't moved and every
        // target's transform had already settled to its rest value. That meant
        // the browser woke up the main thread, ran a transform write, and
        // composited fresh layers for every .uni-hero and .gallery-card on the
        // page — 60 times per second, FOREVER, including while the user was
        // scrolling, comparing universities, or just reading. That's a huge
        // share of the "lag while scrolling" the user reported.
        //
        // The fix:
        //   1. The rAF loop only starts when the mouse moves and only keeps
        //      running while there's still meaningful interpolation work to do
        //      (delta between mouse and current position exceeds a threshold).
        //   2. Once the system has settled within the threshold of the target,
        //      we snap to the exact target and STOP the loop entirely. No more
        //      idle rAF burn.
        //   3. Mouse-move re-kicks the loop only if it isn't already running.
        //   4. Skip parallax on the compare panel being open, on touch input,
        //      and when document.hidden (tab in background) — all of which used
        //      to keep the loop chewing the CPU for no visible benefit.
        (function () {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            if (window.innerWidth <= 768) return;
            // Suppress the parallax engine on coarse-pointer devices (touch
            // tablets, hybrid laptops in tablet mode). The "mouse" position is
            // meaningless there and the transforms only ever made cards jitter
            // when the user tapped/scrolled.
            if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

            const parallaxTargets = document.querySelectorAll('.uni-hero, .gallery-card');
            let mouseX = 0;
            let mouseY = 0;
            let currentX = 0;
            let currentY = 0;
            let rafId = null;
            // Rest-threshold: when both deltas drop below this we snap to
            // target and stop the loop. 0.0005 is invisible at the
            // amplification factor of 8px we use below (< 0.005px move).
            const REST_EPSILON = 0.0005;

            function applyTransforms() {
                const tx = currentX * 8;
                const ty = currentY * 8;
                // Use a single cached translate string when both axes are
                // basically zero, so the browser can drop the transform
                // entirely and avoid a composited layer.
                if (Math.abs(tx) < 0.05 && Math.abs(ty) < 0.05) {
                    parallaxTargets.forEach(el => { el.style.transform = ''; });
                } else {
                    parallaxTargets.forEach(el => {
                        el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
                    });
                }
            }

            function animateParallax() {
                currentX += (mouseX - currentX) * 0.04;
                currentY += (mouseY - currentY) * 0.04;

                applyTransforms();

                const settledX = Math.abs(mouseX - currentX) < REST_EPSILON;
                const settledY = Math.abs(mouseY - currentY) < REST_EPSILON;
                if (settledX && settledY) {
                    // Snap to exact target and stop the loop. Next mousemove
                    // will re-kick it via kickParallax() below.
                    currentX = mouseX;
                    currentY = mouseY;
                    applyTransforms();
                    rafId = null;
                    return;
                }
                rafId = requestAnimationFrame(animateParallax);
            }

            function kickParallax() {
                // If the document is hidden (background tab) OR the compare
                // panel is open, don't bother — there's nothing for the user
                // to see and the rAF would only steal frames from the panel.
                if (document.hidden) return;
                if (document.body.classList.contains('compare-panel-open')) return;
                if (rafId === null) {
                    rafId = requestAnimationFrame(animateParallax);
                }
            }

            document.addEventListener('mousemove', (e) => {
                mouseX = (e.clientX / window.innerWidth - 0.5);
                mouseY = (e.clientY / window.innerHeight - 0.5);
                kickParallax();
            }, { passive: true });

            // When the tab becomes visible again, settle to the resting state
            // exactly once so cards aren't frozen mid-transform.
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) kickParallax();
            });
        })();

        // --- 6. Cost Calculator Logic ---
        // USA city living-cost ranges in USD — used when the calculator's
        // country selector is set to "United States". Each entry lists the
        // monthly cost band for a shared apartment and a solo (studio)
        // apartment, plus a short summary of which universities sit in
        // that metro area so the user can immediately tie a budget to a
        // shortlist of schools.
        const costDataMap = {
            'New York': { shared: [2012, 3032], solo: [4385, 6032], unis: 'Columbia, NYU' },
            'Cambridge Boston': { shared: [2110, 2790], solo: [3780, 4090], unis: 'MIT, Harvard' },
            'Palo Alto': { shared: [2320, 3500], solo: [4370, 6070], unis: 'Stanford' },
            'Pasadena LA': { shared: [2050, 3080], solo: [3600, 5400], unis: 'Caltech' },
            'Philadelphia': { shared: [1500, 2200], solo: [2320, 3450], unis: 'Penn' },
            'New Haven': { shared: [1260, 2000], solo: [2030, 3030], unis: 'Yale' },
            'Princeton NJ': { shared: [1570, 2380], solo: [2600, 3720], unis: 'Princeton' },
            'Chicago': { shared: [1400, 2100], solo: [2200, 3200], unis: 'UChicago' }
        };

        // UK city living-cost ranges, converted to USD from the original GBP
        // ranges in appData.cities (oxford_uk, cambridge_uk, london_uk) using
        // an exchange rate of roughly 1 GBP ≈ 1.34 USD. We convert to USD so
        // the budget the user enters at the top of the calculator (labelled
        // "Monthly Budget (USD)") can be compared directly against UK costs
        // without forcing the user to do the currency math themselves. The
        // shape of each entry exactly matches the USA costDataMap above so
        // the rest of the calculator logic is identical between countries.
        const ukCostDataMap = {
            'Oxford': { shared: [1810, 2410], solo: [2545, 3350], unis: 'Oxford' },
            'Cambridge': { shared: [1810, 2410], solo: [2545, 3350], unis: 'Cambridge' },
            'London': { shared: [1835, 3150], solo: [3255, 4810], unis: 'Imperial, UCL, LSE' }
        };

        function calculateCosts() {
            const budgetInput = document.getElementById('calc-budget').value;
            const style = document.getElementById('calc-style').value;
            const country = document.getElementById('calc-country').value;
            const resultsDiv = document.getElementById('calc-results');
            
            // Italy is still locked — keep the existing "coming soon" notice.
            // The UK is now fully wired up and shares the exact same scoring
            // logic as the USA below.
            if (country === 'italy') {
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<p style="color: var(--accent-gold); font-weight: 500;">Country data coming soon — we are working on adding full cost breakdowns for this region.</p>';
                return;
            }
            
            const budget = parseFloat(budgetInput.replace(/[^0-9.]/g, ''));
            if (isNaN(budget) || budget <= 0) {
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = '<p style="color: #ff4757;">Please enter a valid monthly budget.</p>';
                return;
            }
            
            // Pick which country's cost map to evaluate against. Both maps
            // share the exact same { shared:[min,max], solo:[min,max], unis }
            // structure, so the scoring loop below is country-agnostic.
            const activeCostMap = (country === 'uk') ? ukCostDataMap : costDataMap;
            
            let affordable = [];
            let stretch = [];
            let above = [];
            
            for (const [city, data] of Object.entries(activeCostMap)) {
                const range = data[style];
                const min = range[0];
                const max = range[1];
                const costStr = `$${min.toLocaleString()} – $${max.toLocaleString()}`;
                const rowStr = `<div style="margin-bottom: 8px; color: var(--text-main);"><strong>${city}</strong> (${data.unis}): ${costStr}/month</div>`;
                
                if (min <= budget) {
                    affordable.push(rowStr);
                } else if (min <= budget * 1.30) {
                    stretch.push(rowStr);
                } else {
                    above.push(rowStr);
                }
            }
            
            let html = '';
            if (affordable.length > 0) {
                html += `<div style="background: rgba(46, 213, 115, 0.1); border-left: 4px solid #2ed573; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                            <h4 style="color: #2ed573; margin-bottom: 10px;">✅ Affordable</h4>
                            ${affordable.join('')}
                         </div>`;
            }
            if (stretch.length > 0) {
                html += `<div style="background: rgba(255, 165, 2, 0.1); border-left: 4px solid #ffa502; padding: 15px; margin-bottom: 15px; border-radius: 4px;">
                            <h4 style="color: #ffa502; margin-bottom: 10px;">⚠️ Stretch (Up to 30% over budget)</h4>
                            ${stretch.join('')}
                         </div>`;
            }
            if (above.length > 0) {
                html += `<div style="background: rgba(255, 71, 87, 0.1); border-left: 4px solid #ff4757; padding: 15px; border-radius: 4px;">
                            <h4 style="color: #ff4757; margin-bottom: 10px;">❌ Above Budget</h4>
                            ${above.join('')}
                         </div>`;
            }
            
            resultsDiv.innerHTML = html;
            resultsDiv.style.display = 'block';
        }

        /* ============================================================
           PREMIUM COMPARE UNIVERSITIES FEATURE
           ------------------------------------------------------------
           A self-contained module that pulls comparison data directly
           from the existing appData.universities object — no invented
           data, every value is extracted from fields that already exist
           (rank, tuition, cityName, quickFacts, admissionRequirements,
           financialReqs, bachelors[], masters[]). Missing fields render
           as a muted-gold "Not available" cell.
           ============================================================ */

        // Universities that belong to the United Kingdom. Everything else
        // inside appData.universities is treated as a USA institution.
        const COMPARE_UK_UNI_IDS = ['oxford', 'cambridge', 'imperial', 'ucl', 'lse'];

        // Persistent state for the Compare panel — keeps the list of
        // selected university IDs (in insertion order), tracks the
        // suggestion keyboard highlight, and stores DOM refs after
        // the panel boots so we never re-query the same nodes per keystroke.
        const compareState = {
            selected: [],         // Array of uni IDs the user is comparing
            maxItems: 4,          // Hard cap — show the limit message at +1
            highlightIdx: -1,     // Keyboard nav index into the suggestion list
            limitMsgTimer: null,  // Timeout handle for auto-hiding the "max 4" message
            isOpen: false
        };

        // ------------------------------------------------------------
        // DATA EXTRACTION HELPERS
        // ------------------------------------------------------------

        // Return the country bucket for a given university ID. We treat
        // a small explicit list as UK; everything else in the data object
        // is USA. This mirrors what the country-detail pages already do.
        function compareGetCountry(uniId) {
            return COMPARE_UK_UNI_IDS.indexOf(uniId) >= 0 ? 'UK' : 'USA';
        }

        // Map an ID to a small flag emoji + label for the Country row.
        function compareGetCountryDisplay(uniId) {
            return compareGetCountry(uniId) === 'UK'
                ? '🇬🇧 United Kingdom'
                : '🇺🇸 United States';
        }

        // Tiny per-uni emoji used as a visual marker in the column headers.
        // Picked intentionally to stay restrained — not branded mascots.
        function compareGetUniEmoji(uniId) {
            const emojiMap = {
                mit: '🛰️', harvard: '🎓', stanford: '🌲', caltech: '🔬',
                nyu: '🗽', columbia: '📚', yale: '📖', upenn: '🔔',
                princeton: '🏛️', uchicago: '🌆',
                oxford: '🏰', cambridge: '⚗️', imperial: '⚙️',
                ucl: '🏛️', lse: '📊'
            };
            return emojiMap[uniId] || '🎓';
        }

        // Search an array of strings (quickFacts, admissionRequirements)
        // for the first item that starts with — or contains — a given
        // keyword, then strip the leading label so we just return the value.
        // Returns null if no match. Tolerates bullet prefixes like "• " or "- ".
        function compareFindInList(list, keyword) {
            if (!Array.isArray(list)) return null;
            const kwLower = keyword.toLowerCase();
            for (let i = 0; i < list.length; i++) {
                const raw = String(list[i] || '');
                const cleaned = raw.replace(/^[•\-\s]+/, '').trim();
                if (cleaned.toLowerCase().indexOf(kwLower) === 0) {
                    // "Founded: 1885" → "1885"
                    const colonIdx = cleaned.indexOf(':');
                    if (colonIdx >= 0) return cleaned.slice(colonIdx + 1).trim();
                    return cleaned;
                }
            }
            // Second pass — just contains the keyword anywhere
            for (let i = 0; i < list.length; i++) {
                const raw = String(list[i] || '');
                if (raw.toLowerCase().indexOf(kwLower) >= 0) {
                    return raw.replace(/^[•\-\s]+/, '').trim();
                }
            }
            return null;
        }

        // Pull "Founded: 1885" → "1885" out of quickFacts.
        function compareGetFounded(uni) {
            const fromQuick = compareFindInList(uni.quickFacts, 'Founded');
            if (fromQuick) return fromQuick;
            // As a fallback, scan the overview text — many universities mention
            // "Founded in 1861" or "founded around 1096" in prose.
            if (typeof uni.overview === 'string') {
                const m = uni.overview.match(/[Ff]ounded\s+(?:in\s+|around\s+|c\.\s+)?(\d{3,4})/);
                if (m) return m[1];
            }
            return null;
        }

        // Pull "Acceptance Rate: ~4%" → "~4%" from either quickFacts or
        // admissionRequirements (both lists commonly contain this field).
        function compareGetAcceptanceRate(uni) {
            return compareFindInList(uni.quickFacts, 'Acceptance Rate') ||
                   compareFindInList(uni.admissionRequirements, 'Acceptance Rate');
        }

        // Look for a "Total Students" or "Undergraduate Students" line in
        // quickFacts and surface whichever exists.
        function compareGetTotalStudents(uni) {
            return compareFindInList(uni.quickFacts, 'Total Students') ||
                   compareFindInList(uni.quickFacts, 'Undergraduate Students') ||
                   compareFindInList(uni.quickFacts, 'Undergraduate Enrollment');
        }

        // Pull the Regular Decision / undergraduate application deadline
        // out of admissionRequirements. Returns the shortest readable form.
        function compareGetDeadline(uni) {
            const raw = compareFindInList(uni.admissionRequirements, 'Application Deadline');
            if (!raw) return null;
            // Many entries look like "January 1 (Regular Decision), November 1 (Early Action)"
            // — keep only the Regular Decision part where possible.
            const regularMatch = raw.match(/([A-Z][a-z]+\s+\d{1,2}(?:\s*[-–]\s*\d{1,2})?)[^,(]*\(Regular[^)]*\)/);
            if (regularMatch) return regularMatch[1] + ' (Regular Decision)';
            // UCAS / earliest UK pattern
            const ukMatch = raw.match(/(\d{1,2}\s+[A-Z][a-z]+\s+\d{4})/);
            if (ukMatch) return ukMatch[1];
            // Fall back to the original string truncated at the first comma
            const commaIdx = raw.indexOf(',');
            return commaIdx > 0 ? raw.slice(0, commaIdx).trim() : raw;
        }

        // Pick out the English test requirement (TOEFL/IELTS) line.
        function compareGetEnglishReq(uni) {
            return compareFindInList(uni.admissionRequirements, 'English Requirement') ||
                   compareFindInList(uni.admissionRequirements, 'TOEFL') ||
                   compareFindInList(uni.admissionRequirements, 'IELTS');
        }

        // Derive a short, comparable financial aid policy label from the
        // free-form financialReqs prose plus the admissionRequirements
        // note line. Order of checks matters — the more generous policy
        // wins over the more restrictive one when both are mentioned.
        function compareGetAidPolicy(uni) {
            const haystack = (
                (uni.financialReqs || '') + ' ' +
                (Array.isArray(uni.admissionRequirements) ? uni.admissionRequirements.join(' ') : '')
            ).toLowerCase();
            if (!haystack.trim()) return null;
            if (haystack.indexOf('need-blind for all') >= 0 ||
                (haystack.indexOf('need-blind') >= 0 && haystack.indexOf('international') >= 0 && haystack.indexOf('need-aware') < 0)) {
                return 'Need-blind for all (incl. international)';
            }
            if (haystack.indexOf('need-blind') >= 0 && haystack.indexOf('need-aware') >= 0) {
                return 'Need-blind US · Need-aware international';
            }
            if (haystack.indexOf('need-aware') >= 0) {
                return 'Need-aware international';
            }
            if (haystack.indexOf('meets 100%') >= 0 || haystack.indexOf('100% of demonstrated') >= 0) {
                return 'Meets 100% of demonstrated need';
            }
            if (haystack.indexOf('need-based') >= 0) {
                return 'Need-based financial aid available';
            }
            if (haystack.indexOf('rhodes') >= 0 || haystack.indexOf('clarendon') >= 0 || haystack.indexOf('chevening') >= 0) {
                return 'Major external scholarships available';
            }
            return null;
        }

        // Try to surface a Total Cost of Attendance figure. Many USA
        // universities encode "$57,986 / $92,760 Total COA" directly in
        // uni.tuition; otherwise we scan financialReqs for an explicit
        // total-cost sentence.
        function compareGetTotalCost(uni) {
            const t = uni.tuition || '';
            // Match "$92,760 Total COA" or "$92,760 / $XX,XXX Total COA"
            const coaMatch = t.match(/\$([\d,]+)\s*Total\s*COA/i);
            if (coaMatch) return '$' + coaMatch[1] + ' (Total COA)';
            // Match "$X / $Y Total COA" → return Y
            const slashMatch = t.match(/\/\s*\$([\d,]+)/);
            if (slashMatch) return '$' + slashMatch[1] + ' (Total COA)';
            // Scan the financialReqs prose for an explicit annual cost
            if (typeof uni.financialReqs === 'string') {
                const m1 = uni.financialReqs.match(/(?:total\s+(?:annual\s+)?cost|cost\s+of\s+attendance|annual\s+cost)[^.$]*\$([\d,]+)/i);
                if (m1) return '$' + m1[1] + ' (Total COA)';
                const m2 = uni.financialReqs.match(/approximately\s*\$([\d,]+)/i);
                if (m2) return '~$' + m2[1] + ' (Total COA)';
                // UK pricing in £ — match a yearly range. Use \d at the
                // tail so we never accidentally pick up a trailing comma.
                const m3 = uni.financialReqs.match(/£([\d,]*\d)\s*(?:–|-)\s*£([\d,]*\d)/);
                if (m3) return '£' + m3[1] + '–£' + m3[2] + ' (Tuition range)';
            }
            return null;
        }

        // Strip the COA-suffix portion from tuition so the Annual Tuition row
        // shows a clean figure (e.g. "$57,986" instead of the full combined string).
        function compareGetAnnualTuition(uni) {
            const t = uni.tuition || '';
            if (!t) return null;
            // "$57,986 / $92,760 Total COA" → "$57,986"
            const slashMatch = t.match(/^(\$[\d,]+)\s*\//);
            if (slashMatch) return slashMatch[1];
            // "£37,380 — £62,820 (International, 2026/27)" → keep range
            if (t.indexOf('£') === 0 || t.indexOf('£') > 0) {
                // Drop trailing parenthetical
                return t.replace(/\s*\([^)]*\)\s*$/, '').trim();
            }
            return t;
        }

        // Build the master list of universities available to the picker.
        // Ordered: USA first (in the order they appear in appData), then UK.
        function compareGetAllUnis() {
            if (!appData || !appData.universities) return [];
            const all = [];
            const uniMap = appData.universities;
            // Preserve declaration order so the picker matches the rest of the site
            Object.keys(uniMap).forEach(function (id) {
                if (COMPARE_UK_UNI_IDS.indexOf(id) >= 0) return;
                all.push({ id: id, name: uniMap[id].name, shortName: uniMap[id].shortName || uniMap[id].name, country: 'USA' });
            });
            COMPARE_UK_UNI_IDS.forEach(function (id) {
                if (uniMap[id]) {
                    all.push({ id: id, name: uniMap[id].name, shortName: uniMap[id].shortName || uniMap[id].name, country: 'UK' });
                }
            });
            return all;
        }

        // Resolve all comparison rows for a single university. Every row
        // either returns a populated string or null (renders as "Not available").
        function compareBuildRowsFor(uniId) {
            const uni = appData.universities[uniId];
            if (!uni) return {};
            return {
                name: uni.shortName || uni.name,
                country: compareGetCountryDisplay(uniId),
                city: uni.cityName || null,
                rank: uni.rank ? ('#' + uni.rank) : null,
                acceptance: compareGetAcceptanceRate(uni),
                tuition: compareGetAnnualTuition(uni),
                totalCost: compareGetTotalCost(uni),
                founded: compareGetFounded(uni),
                students: compareGetTotalStudents(uni),
                bachelors: Array.isArray(uni.bachelors) && uni.bachelors.length > 0 ? String(uni.bachelors.length) : null,
                masters: Array.isArray(uni.masters) && uni.masters.length > 0 ? String(uni.masters.length) : null,
                aidPolicy: compareGetAidPolicy(uni),
                deadline: compareGetDeadline(uni),
                english: compareGetEnglishReq(uni)
            };
        }

        // ------------------------------------------------------------
        // PANEL OPEN / CLOSE
        // ------------------------------------------------------------

        function openComparePanel() {
            const panel = document.getElementById('compare-panel');
            const backdrop = document.getElementById('compare-backdrop');
            const trigger = document.getElementById('compare-trigger-btn');
            if (!panel || !backdrop) return;
            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            backdrop.classList.add('is-open');
            backdrop.setAttribute('aria-hidden', 'false');
            if (trigger) trigger.classList.add('is-active');
            document.body.classList.add('compare-panel-open');
            compareState.isOpen = true;
            // Defer focus until the slide-in transition has visibly started
            setTimeout(function () {
                const input = document.getElementById('compare-search-input');
                if (input) input.focus();
            }, 250);
            // Render whatever state we already have (chips + table) so reopening
            // the panel feels persistent within a session.
            compareRenderChips();
            compareRenderTable();
        }

        function closeComparePanel() {
            const panel = document.getElementById('compare-panel');
            const backdrop = document.getElementById('compare-backdrop');
            const trigger = document.getElementById('compare-trigger-btn');
            if (!panel || !backdrop) return;
            panel.classList.remove('is-open');
            panel.setAttribute('aria-hidden', 'true');
            backdrop.classList.remove('is-open');
            backdrop.setAttribute('aria-hidden', 'true');
            if (trigger) trigger.classList.remove('is-active');
            document.body.classList.remove('compare-panel-open');
            compareState.isOpen = false;
            // Hide the suggestion popover so it doesn't flash on reopen
            compareHideSuggestions();
        }

        // Escape key closes the panel — only when it's actually open so we
        // don't interfere with the existing info-modal's own Escape handling.
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && compareState.isOpen) {
                closeComparePanel();
            }
        });

        // ------------------------------------------------------------
        // SEARCH + SUGGESTIONS
        // ------------------------------------------------------------

        function onCompareSearchInput() {
            const input = document.getElementById('compare-search-input');
            if (!input) return;
            const q = (input.value || '').trim().toLowerCase();
            compareState.highlightIdx = -1;
            const all = compareGetAllUnis();
            // Always-show: when the input is empty + focused, surface every
            // available university so the picker feels like a true menu.
            const matches = q
                ? all.filter(function (u) {
                    return u.name.toLowerCase().indexOf(q) >= 0 ||
                           u.shortName.toLowerCase().indexOf(q) >= 0 ||
                           u.id.toLowerCase().indexOf(q) >= 0;
                })
                : all.slice();
            compareRenderSuggestions(matches);
        }

        function compareRenderSuggestions(matches) {
            const box = document.getElementById('compare-suggestions');
            if (!box) return;
            if (!matches || matches.length === 0) {
                box.innerHTML = '<div class="compare-suggestion-empty">No universities match that search.</div>';
                box.classList.add('is-visible');
                return;
            }
            const html = matches.map(function (u, idx) {
                const alreadyAdded = compareState.selected.indexOf(u.id) >= 0;
                const cls = 'compare-suggestion-item' + (alreadyAdded ? ' is-disabled' : '');
                const flag = u.country === 'UK' ? '🇬🇧' : '🇺🇸';
                const meta = alreadyAdded ? 'Already added' : (flag + ' ' + u.country);
                // data-idx lets keyboard nav (ArrowDown/ArrowUp/Enter) work
                return '<div class="' + cls + '" data-uniid="' + u.id + '" data-idx="' + idx + '" role="option" aria-selected="false">' +
                            '<span>' + u.name + '</span>' +
                            '<span class="compare-suggestion-meta">' + meta + '</span>' +
                       '</div>';
            }).join('');
            box.innerHTML = html;
            box.classList.add('is-visible');
            // Wire click handlers — using direct binding instead of inline
            // onclick to keep IDs out of the markup string
            Array.prototype.forEach.call(box.querySelectorAll('.compare-suggestion-item'), function (item) {
                item.addEventListener('click', function () {
                    if (item.classList.contains('is-disabled')) return;
                    const id = item.getAttribute('data-uniid');
                    compareAddUni(id);
                });
            });
        }

        function compareHideSuggestions() {
            const box = document.getElementById('compare-suggestions');
            if (box) box.classList.remove('is-visible');
        }

        // Hide the suggestion popover when the user clicks anywhere outside
        // of the search wrap. Bound at document level so it survives re-renders.
        document.addEventListener('click', function (e) {
            const wrap = document.querySelector('.compare-search-wrap');
            if (!wrap) return;
            if (!wrap.contains(e.target)) compareHideSuggestions();
        });

        // Keyboard navigation inside the suggestion list — ArrowDown / ArrowUp
        // move the highlight, Enter selects, Escape closes the popover.
        function onCompareSearchKeydown(e) {
            const box = document.getElementById('compare-suggestions');
            if (!box) return;
            const items = box.querySelectorAll('.compare-suggestion-item:not(.is-disabled)');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (items.length === 0) return;
                compareState.highlightIdx = (compareState.highlightIdx + 1) % items.length;
                compareUpdateHighlight(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (items.length === 0) return;
                compareState.highlightIdx = (compareState.highlightIdx - 1 + items.length) % items.length;
                compareUpdateHighlight(items);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (compareState.highlightIdx >= 0 && items[compareState.highlightIdx]) {
                    const id = items[compareState.highlightIdx].getAttribute('data-uniid');
                    compareAddUni(id);
                } else if (items.length > 0) {
                    // Fall back to picking the first match when the user hits Enter
                    // without explicitly arrowing down — mirrors typical picker UX.
                    const id = items[0].getAttribute('data-uniid');
                    compareAddUni(id);
                }
            } else if (e.key === 'Escape') {
                compareHideSuggestions();
            }
        }

        function compareUpdateHighlight(items) {
            Array.prototype.forEach.call(items, function (el, i) {
                if (i === compareState.highlightIdx) {
                    el.classList.add('is-highlighted');
                    // Scroll the highlighted item into view inside the suggestion popover
                    el.scrollIntoView({ block: 'nearest' });
                } else {
                    el.classList.remove('is-highlighted');
                }
            });
        }

        // ------------------------------------------------------------
        // ADD / REMOVE / RENDER
        // ------------------------------------------------------------

        function compareAddUni(uniId) {
            if (!uniId || !appData.universities[uniId]) return;
            // Already added — no-op (but still close suggestions for nice UX)
            if (compareState.selected.indexOf(uniId) >= 0) {
                compareHideSuggestions();
                return;
            }
            if (compareState.selected.length >= compareState.maxItems) {
                compareShowLimitMessage();
                return;
            }
            compareState.selected.push(uniId);
            compareRenderChips();
            compareRenderTable();
            // Clear the input and collapse the suggestion popover after a
            // successful pick — feels much cleaner than leaving stale text behind.
            const input = document.getElementById('compare-search-input');
            if (input) input.value = '';
            compareHideSuggestions();
            // Keep focus on the input so power users can keep typing the next pick
            if (input) input.focus();
        }

        function compareRemoveUni(uniId) {
            const idx = compareState.selected.indexOf(uniId);
            if (idx < 0) return;
            // Play the chip-out animation before splicing the data so the
            // user sees the chip fade rather than vanish abruptly.
            const chips = document.getElementById('compare-chips');
            if (chips) {
                const chipEl = chips.querySelector('[data-uniid="' + uniId + '"]');
                if (chipEl) {
                    chipEl.classList.add('is-removing');
                    setTimeout(function () {
                        compareState.selected.splice(idx, 1);
                        compareRenderChips();
                        compareRenderTable();
                    }, 280);
                    return;
                }
            }
            // Fallback if the chip element isn't there for any reason
            compareState.selected.splice(idx, 1);
            compareRenderChips();
            compareRenderTable();
        }

        function compareShowLimitMessage() {
            // Center-screen toast — pops up over everything (including the
            // suggestion dropdown), stays for ~3.5s, then auto-dismisses.
            // Previously this appeared inline beneath the search input, which
            // got hidden behind the suggestion popover when a 5th uni was typed.
            const toast = document.getElementById('compare-toast');
            if (!toast) {
                // Fallback to the legacy inline message if the toast node
                // is somehow missing — prevents any silent failure.
                const msg = document.getElementById('compare-limit-msg');
                if (msg) {
                    msg.textContent = 'You can compare up to 4 universities. Remove one to add another.';
                    msg.classList.add('is-visible');
                    if (compareState.limitMsgTimer) clearTimeout(compareState.limitMsgTimer);
                    compareState.limitMsgTimer = setTimeout(function () {
                        msg.classList.remove('is-visible');
                    }, 3500);
                }
                return;
            }
            toast.classList.add('is-visible');
            toast.setAttribute('aria-hidden', 'false');
            // Also hide the suggestion popover so the toast is the
            // unambiguous focal point during its visible window.
            compareHideSuggestions();
            if (compareState.limitMsgTimer) clearTimeout(compareState.limitMsgTimer);
            compareState.limitMsgTimer = setTimeout(function () {
                toast.classList.remove('is-visible');
                toast.setAttribute('aria-hidden', 'true');
            }, 3500);
        }

        function compareRenderChips() {
            const wrap = document.getElementById('compare-chips');
            if (!wrap) return;
            if (compareState.selected.length === 0) {
                wrap.innerHTML = '';
                return;
            }
            const html = compareState.selected.map(function (uniId) {
                const uni = appData.universities[uniId];
                if (!uni) return '';
                const label = uni.shortName || uni.name;
                const emoji = compareGetUniEmoji(uniId);
                return '<span class="compare-chip" data-uniid="' + uniId + '">' +
                            '<span>' + emoji + ' ' + label + '</span>' +
                            '<button type="button" class="compare-chip-remove" aria-label="Remove ' + label + '" data-remove="' + uniId + '">×</button>' +
                       '</span>';
            }).join('');
            wrap.innerHTML = html;
            // Wire chip remove buttons
            Array.prototype.forEach.call(wrap.querySelectorAll('.compare-chip-remove'), function (btn) {
                btn.addEventListener('click', function () {
                    const id = btn.getAttribute('data-remove');
                    compareRemoveUni(id);
                });
            });
        }

        // Define the order + display labels for every comparison row.
        // Tweaking this array is the single source of truth for what
        // appears in the table and in what order.
        const COMPARE_ROW_DEFS = [
            { key: 'name',       label: 'University' },
            { key: 'country',    label: 'Country' },
            { key: 'city',       label: 'City' },
            { key: 'rank',       label: 'QS World Rank' },
            { key: 'acceptance', label: 'Acceptance Rate' },
            { key: 'tuition',    label: 'Annual Tuition' },
            { key: 'totalCost',  label: 'Total Cost of Attendance' },
            { key: 'founded',    label: 'Founded' },
            { key: 'students',   label: 'Total Students' },
            { key: 'bachelors',  label: 'Bachelor Programs' },
            { key: 'masters',    label: 'Master Programs' },
            { key: 'aidPolicy',  label: 'Financial Aid Policy' },
            { key: 'deadline',   label: 'Application Deadline' },
            { key: 'english',    label: 'English Test Requirement' }
        ];

        // HTML-escape user-facing values so any unusual characters in
        // the existing data (em-dashes are fine; angle brackets shouldn't
        // ever appear but it's cheap insurance) never break the table.
        function compareEscape(s) {
            if (s === null || s === undefined) return '';
            return String(s)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function compareRenderTable() {
            const area = document.getElementById('compare-table-area');
            if (!area) return;
            const selected = compareState.selected.slice();
            // Empty state — invite the user to add at least one university
            if (selected.length === 0) {
                area.innerHTML =
                    '<div class="compare-empty-state">' +
                        '<div class="compare-empty-icon">⚖️</div>' +
                        '<div class="compare-empty-title">No universities selected yet</div>' +
                        '<div class="compare-empty-desc">Add at least two universities above to see a detailed side-by-side comparison.</div>' +
                    '</div>';
                return;
            }
            // One-uni state — show a friendlier nudge to add more.
            // (Requirement specifies "Once 2 or more universities are selected,
            //  automatically render a comparison table" — so with just one we
            //  show a helpful hint instead of a single-column table.)
            if (selected.length === 1) {
                const onlyUni = appData.universities[selected[0]];
                const onlyName = onlyUni ? (onlyUni.shortName || onlyUni.name) : 'this university';
                area.innerHTML =
                    '<div class="compare-empty-state">' +
                        '<div class="compare-empty-icon">' + compareGetUniEmoji(selected[0]) + '</div>' +
                        '<div class="compare-empty-title">' + compareEscape(onlyName) + ' is ready to compare</div>' +
                        '<div class="compare-empty-desc">Add at least one more university above and a side-by-side comparison table will appear here.</div>' +
                    '</div>';
                return;
            }
            // Build row data for every selected uni once, up front, so
            // we don't recompute per cell.
            const rowsByUni = {};
            selected.forEach(function (id) { rowsByUni[id] = compareBuildRowsFor(id); });
            // Column header HTML — one per selected uni
            const headerCols = selected.map(function (id) {
                const data = rowsByUni[id];
                const emoji = compareGetUniEmoji(id);
                const sub = compareGetCountry(id) === 'UK' ? '🇬🇧 United Kingdom' : '🇺🇸 United States';
                return '<th>' +
                            '<span class="compare-uni-emoji">' + emoji + '</span>' +
                            '<span class="compare-uni-name">' + compareEscape(data.name || 'Unknown') + '</span>' +
                            '<span class="compare-uni-sub">' + sub + '</span>' +
                       '</th>';
            }).join('');
            // Body rows — each row is one comparison field across every selected uni
            const bodyRows = COMPARE_ROW_DEFS.map(function (def) {
                // Skip the "name" row — we already show the name in the column header
                if (def.key === 'name') return '';
                const cells = selected.map(function (id) {
                    const value = rowsByUni[id][def.key];
                    if (value === null || value === undefined || value === '') {
                        return '<td><span class="compare-value-na">Not available</span></td>';
                    }
                    return '<td>' + compareEscape(value) + '</td>';
                }).join('');
                return '<tr>' +
                            '<td class="compare-row-label">' + compareEscape(def.label) + '</td>' +
                            cells +
                       '</tr>';
            }).join('');
            const html =
                '<div class="compare-table-wrap">' +
                    '<div class="compare-table-scroll">' +
                        '<table class="compare-table">' +
                            '<thead>' +
                                '<tr>' +
                                    '<th class="compare-row-label-head">Comparison</th>' +
                                    headerCols +
                                '</tr>' +
                            '</thead>' +
                            '<tbody>' + bodyRows + '</tbody>' +
                        '</table>' +
                    '</div>' +
                '</div>';
            area.innerHTML = html;
        }

        // =================================================================
        // AI FUTURE PAGE — Gate-Opening Animation Controller
        // =================================================================
        // openAIFuturePage(programTitle, uniName) is invoked by the
        // "🚀 Explore Your Future with AI" button that lives inside every
        // expanded Bachelor and Master program card on every university
        // detail page (all 10 USA + 5 UK universities).
        //
        // Animation sequence (driven by class toggles + CSS transitions):
        //
        //   t=0ms      : overlay becomes visible (opacity 1, pointer events on)
        //                .is-visible class is added.
        //                The two gate panels are off-screen (top above,
        //                bottom below the viewport).
        //   t=20ms     : .is-opening class is added — both panels slide in
        //                from off-screen and SLAM SHUT at the centerline
        //                with a sharp 0.42s ease.
        //   t=560ms    : with the panels fully closed (screen looks all
        //                black/dark navy), .is-open class is added. This
        //                triggers:
        //                  - a gold seam pulse at the centerline (~0.8s)
        //                  - the gate panels slide apart vertically:
        //                      top → translateY(-100%) (off the top)
        //                      bottom → translateY(100%) (off the bottom)
        //                    revealing the AI content layer behind.
        //                  - content layer fades in + scales up
        //                  - feature tiles, heading, etc. cascade in
        //
        // closeAIFuturePage() runs the sequence in reverse and resets all
        // classes so the animation can be replayed on the next click.
        // =================================================================

        // Tracks the timeout IDs so we can cancel them on a quick close —
        // prevents the gate from finishing its open animation if the user
        // closes mid-sequence.
        let _aiFutureOpenTimers = [];

        function _aiFutureClearTimers() {
            _aiFutureOpenTimers.forEach(id => clearTimeout(id));
            _aiFutureOpenTimers = [];
        }

        // Sanitizes a string for safe injection into an inline JS attribute.
        // Escapes backslashes, single quotes, and known control chars that
        // would otherwise break the onclick="openAIFuturePage('...')" string.
        function encodeForJsAttribute(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/\\/g, '\\\\')
                .replace(/'/g, "\\'")
                .replace(/"/g, '&quot;')
                .replace(/\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        // Decodes the &quot; / &lt; / &gt; entities back to their characters
        // before showing the program title and uni name on the AI page.
        // (Backslash-escaped ' is already handled by the JS parser at runtime.)
        function decodeFromJsAttribute(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
        }

        function openAIFuturePage(programTitle, uniName) {
            const overlay = document.getElementById('ai-future-overlay');
            if (!overlay) return;

            // Cancel any in-flight animation timers from a prior open/close
            _aiFutureClearTimers();

            // Populate the program title + uni name (decode any entities we
            // had to encode for safe attribute embedding).
            const titleEl = document.getElementById('ai-future-program-title');
            const uniEl = document.getElementById('ai-future-uni-name');
            if (titleEl) titleEl.textContent = decodeFromJsAttribute(programTitle) || 'Program';
            if (uniEl) uniEl.textContent = decodeFromJsAttribute(uniName) || 'University';

            // Reset state — strip any previous animation classes so the
            // panels start from their off-screen positions.
            overlay.classList.remove('is-opening', 'is-open', 'is-closing');

            // Reset scroll position of the inner content so the user always
            // lands at the top of the page after the gate opens.
            const content = document.getElementById('ai-future-content');
            if (content) content.scrollTop = 0;

            // Lock the underlying page from scrolling
            document.body.classList.add('ai-future-active');

            // PHASE 1: Make the overlay visible. The panels are off-screen.
            overlay.classList.add('is-visible');
            overlay.setAttribute('aria-hidden', 'false');

            // Force a reflow so the next class addition triggers a clean
            // transition rather than collapsing both into one frame.
            // eslint-disable-next-line no-unused-expressions
            overlay.offsetHeight;

            // PHASE 2: Slam the gate panels shut at the centerline.
            _aiFutureOpenTimers.push(setTimeout(() => {
                overlay.classList.add('is-opening');
            }, 20));

            // PHASE 3: Once panels meet at the middle, trigger the split-open.
            // 20ms (settle) + 420ms (slam transition) ≈ 440ms. We give a
            // tiny extra beat (120ms) for a satisfying "pause before the
            // reveal" — that suspense moment is what makes it feel premium.
            _aiFutureOpenTimers.push(setTimeout(() => {
                overlay.classList.add('is-open');
            }, 560));
        }

        function closeAIFuturePage() {
            const overlay = document.getElementById('ai-future-overlay');
            if (!overlay) return;

            _aiFutureClearTimers();

            // Reverse animation: panels slam back to the center, then the
            // whole overlay fades out.
            overlay.classList.remove('is-open');
            overlay.classList.add('is-closing');

            // After the slam-shut completes (~0.55s), fade the overlay out
            // and reset all classes so it's ready for the next open.
            _aiFutureOpenTimers.push(setTimeout(() => {
                overlay.classList.remove('is-visible', 'is-opening', 'is-closing');
                overlay.setAttribute('aria-hidden', 'true');
                document.body.classList.remove('ai-future-active');
            }, 580));
        }

        // ESC key closes the AI Future overlay (premium UX detail —
        // matches the behaviour of the existing info modal and compare panel).
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('ai-future-overlay');
                if (overlay && overlay.classList.contains('is-visible')) {
                    closeAIFuturePage();
                }
            }
        });

        // =================================================================
        // AI FUTURE PAGE — Accordion behaviour for the three preview tiles
        // =================================================================
        // The three feature tiles (Career Pathways, Market Outlook, Skill
        // Roadmap) on the AI Future page now behave as a one-at-a-time
        // accordion. Clicking a tile expands it in place; clicking it again
        // (or clicking another) collapses it. Expansion injects a centered
        // placeholder — the structure is wired, the data lands later.
        //
        // We attach handlers lazily inside an init function that runs after
        // DOMContentLoaded so the static markup is guaranteed to be present.
        // Handlers are bound once; an _accordionBound flag on the tile
        // prevents double-binding if this script ever re-runs.
        // =================================================================
        function initAIFutureAccordion() {
            const grid = document.querySelector('.ai-future-feature-grid');
            if (!grid) return;
            const tiles = grid.querySelectorAll('.ai-future-feature-tile');
            tiles.forEach(function(tile) {
                if (tile._accordionBound) return;
                tile._accordionBound = true;

                // Inject the expanded panel + placeholder once. Inserting
                // here (rather than in HTML) keeps index.html untouched and
                // matches the constraint of only modifying styles.css and
                // script.js.
                if (!tile.querySelector('.ai-future-feature-expanded')) {
                    const expanded = document.createElement('div');
                    expanded.className = 'ai-future-feature-expanded';
                    const placeholder = document.createElement('div');
                    placeholder.className = 'ai-future-feature-placeholder';
                    placeholder.textContent = 'Full AI insights coming soon';
                    expanded.appendChild(placeholder);
                    tile.appendChild(expanded);
                }

                tile.addEventListener('click', function(e) {
                    // Find siblings (the other two tiles) and collapse them
                    // so only one stays open at a time.
                    const wasExpanded = tile.classList.contains('is-expanded');
                    tiles.forEach(function(other) {
                        if (other !== tile) other.classList.remove('is-expanded');
                    });
                    // Toggle the clicked tile — clicking an already-open one
                    // closes it (per spec).
                    if (wasExpanded) {
                        tile.classList.remove('is-expanded');
                    } else {
                        tile.classList.add('is-expanded');
                    }
                });
            });
        }

        // Run after DOM is ready. If the script loads after DOMContentLoaded
        // (it lives at the bottom of <body>, so this is typical), invoke
        // immediately; otherwise wait for the event.
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAIFutureAccordion);
        } else {
            initAIFutureAccordion();
        }

        // Reset accordion state whenever the AI Future overlay opens, so the
        // user always lands on the fully-collapsed default view. We wrap the
        // existing openAIFuturePage to keep its behaviour unchanged.
        (function() {
            if (typeof openAIFuturePage !== 'function') return;
            const _originalOpenAIFuturePage = openAIFuturePage;
            openAIFuturePage = function(programTitle, uniName) {
                _originalOpenAIFuturePage(programTitle, uniName);
                const tiles = document.querySelectorAll('.ai-future-feature-tile');
                tiles.forEach(function(t) { t.classList.remove('is-expanded'); });
                // Ensure the accordion is initialised in case this overlay
                // is shown before the initial DOMContentLoaded handler fired.
                initAIFutureAccordion();
            };
        })();

        /* =====================================================================
           WAYPOINT HISTORY MANAGER — Browser Back / Forward / Android Gesture
           =====================================================================
           Adds proper SPA navigation history to WayPoint so the browser's
           native Back/Forward controls (and Android's back gesture / back
           button) move the user through the site exactly the way they expect:
           a previous university page, the country list, the homepage, etc.

           DESIGN PRINCIPLES
           -----------------
           1. ZERO TOUCH on existing logic. Every existing function
              (navigateTo, loadUniversity, loadCity, openComparePanel,
              closeComparePanel, openAIFuturePage, closeAIFuturePage,
              openInfoModal, closeInfoModal) is WRAPPED, not modified. The
              wrappers call the originals first, then update browser
              history. Animations, filters, the compare system, and
              dynamic university rendering all keep behaving identically.

           2. HASH-BASED ROUTING. We use URL hashes (#/usa, #/uni/mit,
              #/city/cambridge, #/compare, #/ai) instead of pushState
              paths. Two reasons:
                • Refreshing or directly opening a hash URL on any static
                  host (GitHub Pages, Netlify, S3) just works — no server
                  rewrite rules required.
                • The user's deep link remains shareable.

           3. SILENT-REPLAY HANDLERS. When the user hits the back button,
              popstate fires and we re-open the destination view by
              calling the ORIGINAL (un-wrapped) function so we don't
              push another history entry on top of the one we're
              navigating back to. This prevents history loops where Back
              would never actually go back.

           4. MODAL-AWARE. Compare panel, AI Future overlay, and the
              info modal each push a transient history entry on open.
              When the user hits Back while one of these is visible, the
              entry pops and we close just the modal — the underlying
              page state is preserved. This matches the behaviour of
              every modern mobile app (Instagram, Twitter, etc).

           5. FAIL-SAFE. Every History API call is wrapped in try/catch.
              If the browser somehow blocks pushState (very old browsers,
              file:// origin without local server, etc) the site
              degrades gracefully back to its pre-history-manager
              behaviour — nothing breaks, history just doesn't track.
           ===================================================================== */
        (function() {

            // -----------------------------------------------------------------
            // 0. CAPABILITY CHECK + INTERNAL FLAGS
            // -----------------------------------------------------------------
            // Bail early if the browser has no History API at all. The site
            // continues working exactly as it did before this module.
            if (!window.history || typeof window.history.pushState !== 'function') {
                return;
            }

            // Internal flag — when TRUE, all wrappers skip the history push.
            // We set this to true while we're REPLAYING a state in response
            // to popstate, so we don't double-stack the history entry that
            // the user is trying to navigate back to.
            let _isReplayingHistory = false;

            // Internal flag — TRUE while the initial-load bootstrap is
            // executing, so any navigation it performs uses replaceState
            // (rewriting the current entry) instead of pushState (which
            // would orphan an unused entry behind it).
            let _isBootstrapping = false;

            // Track which modal-style overlays are currently open so the
            // popstate handler can correctly close them when the user
            // presses Back. These are mirror-states of the real DOM —
            // we don't trust them to be exact, but they help us decide
            // whether a Back press should close a modal or change page.
            const _modalState = {
                compare: false,
                aiFuture: false,
                infoModal: false
            };

            // -----------------------------------------------------------------
            // 1. URL HASH ENCODING / DECODING
            // -----------------------------------------------------------------
            // Maps an app state object to a URL hash, and back. Keeping all
            // of this in one place means a single source of truth for the
            // routing scheme — any future route additions go here only.
            //
            // State shape: { page, uniId?, cityId?, modal? }
            //   page    — 'home' | 'usa' | 'uk' | 'university' | 'city'
            //   uniId   — id when page === 'university'
            //   cityId  — id when page === 'city'
            //   modal   — 'compare' | 'ai' | 'info' (optional overlay on top)
            //
            // Examples:
            //   #/                       — home
            //   #/usa                    — USA universities list
            //   #/uk                     — UK universities list
            //   #/uni/mit                — MIT detail page
            //   #/city/cambridge         — Cambridge city page
            //   #/usa?modal=compare      — USA list with compare panel open
            //   #/uni/mit?modal=ai       — MIT detail with AI overlay open
            function stateToHash(state) {
                if (!state) return '#/';
                let hash = '#/';
                switch (state.page) {
                    case 'home':       hash = '#/';                          break;
                    case 'usa':        hash = '#/usa';                       break;
                    case 'uk':         hash = '#/uk';                        break;
                    case 'university': hash = '#/uni/'  + (state.uniId || ''); break;
                    case 'city':       hash = '#/city/' + (state.cityId || ''); break;
                    default:           hash = '#/';                          break;
                }
                if (state.modal) {
                    hash += '?modal=' + state.modal;
                }
                return hash;
            }

            function hashToState(rawHash) {
                // Strip leading '#' and optional '/'
                let h = (rawHash || '').replace(/^#\/?/, '');

                // Split off the query string (?modal=...)
                let modal = null;
                const qIdx = h.indexOf('?');
                if (qIdx >= 0) {
                    const query = h.slice(qIdx + 1);
                    h = h.slice(0, qIdx);
                    const m = query.match(/(?:^|&)modal=([^&]+)/);
                    if (m) modal = m[1];
                }

                // Empty hash = home
                if (!h) return { page: 'home', modal: modal };

                // Match against known route patterns
                if (h === 'usa') return { page: 'usa', modal: modal };
                if (h === 'uk')  return { page: 'uk',  modal: modal };

                const uniMatch  = h.match(/^uni\/(.+)$/);
                if (uniMatch) {
                    return { page: 'university', uniId: uniMatch[1], modal: modal };
                }

                const cityMatch = h.match(/^city\/(.+)$/);
                if (cityMatch) {
                    return { page: 'city', cityId: cityMatch[1], modal: modal };
                }

                // Unknown route — fall back to home
                return { page: 'home', modal: modal };
            }

            // -----------------------------------------------------------------
            // 2. SAFE PUSH / REPLACE WRAPPERS
            // -----------------------------------------------------------------
            // Every History API call goes through these so a single try/catch
            // protects the whole site from rare browser quirks (private mode
            // quotas, file:// origins, etc).
            function safePush(state) {
                if (_isReplayingHistory) return; // popstate replay — never push
                try {
                    const hash = stateToHash(state);
                    if (_isBootstrapping) {
                        window.history.replaceState(state, '', hash);
                    } else {
                        window.history.pushState(state, '', hash);
                    }
                } catch (e) {
                    // Silently ignore — site keeps working without history tracking
                }
            }

            function safeReplace(state) {
                try {
                    const hash = stateToHash(state);
                    window.history.replaceState(state, '', hash);
                } catch (e) { /* ignore */ }
            }

            // -----------------------------------------------------------------
            // 3. PRESERVE ORIGINAL FUNCTION REFERENCES
            // -----------------------------------------------------------------
            // We grab the originals BEFORE wrapping so the popstate handler
            // can replay state without going through the wrapper (which
            // would push a duplicate entry).
            const _originalNavigateTo       = typeof navigateTo       === 'function' ? navigateTo       : null;
            const _originalLoadUniversity   = typeof loadUniversity   === 'function' ? loadUniversity   : null;
            const _originalLoadCity         = typeof loadCity         === 'function' ? loadCity         : null;
            const _originalOpenCompare      = typeof openComparePanel === 'function' ? openComparePanel : null;
            const _originalCloseCompare     = typeof closeComparePanel=== 'function' ? closeComparePanel: null;
            const _originalOpenAIFuture     = typeof openAIFuturePage === 'function' ? openAIFuturePage : null;
            const _originalCloseAIFuture    = typeof closeAIFuturePage=== 'function' ? closeAIFuturePage: null;
            const _originalOpenInfoModal    = typeof openInfoModal    === 'function' ? openInfoModal    : null;
            const _originalCloseInfoModal   = typeof closeInfoModal   === 'function' ? closeInfoModal   : null;

            // -----------------------------------------------------------------
            // 4. PAGE-ID ⇔ STATE MAPPING
            // -----------------------------------------------------------------
            // The existing app refers to pages by DOM id ('page-home',
            // 'page-usa-unis', etc). Our state object uses cleaner page
            // names ('home', 'usa', etc). These two helpers translate
            // between them so the wrapper layer can speak the app's
            // existing vocabulary while history speaks ours.
            function pageIdToStateName(pageId) {
                switch (pageId) {
                    case 'page-home':              return 'home';
                    case 'page-usa-unis':          return 'usa';
                    case 'page-uk-unis':           return 'uk';
                    case 'page-university-detail': return 'university';
                    case 'page-city-detail':       return 'city';
                    default:                       return null;
                }
            }

            // -----------------------------------------------------------------
            // 5. WRAP navigateTo — push history on every section change
            // -----------------------------------------------------------------
            // navigateTo is the central router. Every time it's called we
            // determine the state name and push a corresponding history
            // entry. The wrapped function is otherwise byte-identical
            // in observable behaviour — same animation timings, same
            // background swaps, same compare-button visibility logic.
            if (_originalNavigateTo) {
                window.navigateTo = function(pageId) {
                    const result = _originalNavigateTo.apply(this, arguments);

                    // Only push history for top-level pages we actually
                    // route via the URL. University detail and city
                    // detail navigation happen through loadUniversity /
                    // loadCity, which call navigateTo internally — those
                    // are handled by their own wrappers, so we skip
                    // them here to avoid duplicate history entries.
                    const stateName = pageIdToStateName(pageId);
                    if (stateName && stateName !== 'university' && stateName !== 'city') {
                        safePush({ page: stateName });
                    }
                    return result;
                };
            }

            // -----------------------------------------------------------------
            // 6. WRAP loadUniversity — push #/uni/<id>
            // -----------------------------------------------------------------
            // loadUniversity internally calls navigateTo('page-university-detail')
            // which our wrapper above sees as 'university' — but we skip
            // pushing for 'university' there because we want loadUniversity
            // (which knows the actual uniId) to push the rich state.
            if (_originalLoadUniversity) {
                window.loadUniversity = function(uniId) {
                    const result = _originalLoadUniversity.apply(this, arguments);
                    safePush({ page: 'university', uniId: uniId });
                    return result;
                };
            }

            // -----------------------------------------------------------------
            // 7. WRAP loadCity — push #/city/<id>
            // -----------------------------------------------------------------
            if (_originalLoadCity) {
                window.loadCity = function(cityId) {
                    const result = _originalLoadCity.apply(this, arguments);
                    safePush({ page: 'city', cityId: cityId });
                    return result;
                };
            }

            // -----------------------------------------------------------------
            // 8. WRAP MODAL OPENERS / CLOSERS
            // -----------------------------------------------------------------
            // Each modal pushes a transient state on open, and pops it on
            // close. The popstate handler below uses this so Back closes
            // the modal first before backing out to the previous page —
            // exactly like Instagram, Twitter, etc.
            //
            // We only push when opening from a "fresh" state (i.e. not as
            // part of a popstate replay), and we only pop when closing
            // from a user action (not as part of a popstate replay).
            function currentBaseState() {
                // The most recent non-modal state — read from history.state
                // if present, otherwise compute from the active section.
                const s = window.history.state;
                if (s && s.page) {
                    return { page: s.page, uniId: s.uniId, cityId: s.cityId };
                }
                const active = document.querySelector('.section.active');
                if (active) {
                    const name = pageIdToStateName(active.id);
                    if (name) {
                        return {
                            page: name,
                            uniId: name === 'university' ? (typeof currentActiveUniId !== 'undefined' ? currentActiveUniId : null) : undefined,
                            cityId: undefined
                        };
                    }
                }
                return { page: 'home' };
            }

            if (_originalOpenCompare) {
                window.openComparePanel = function() {
                    const result = _originalOpenCompare.apply(this, arguments);
                    _modalState.compare = true;
                    if (!_isReplayingHistory) {
                        const base = currentBaseState();
                        safePush({ page: base.page, uniId: base.uniId, cityId: base.cityId, modal: 'compare' });
                    }
                    return result;
                };
            }

            if (_originalCloseCompare) {
                window.closeComparePanel = function() {
                    const wasOpen = _modalState.compare;
                    const result = _originalCloseCompare.apply(this, arguments);
                    _modalState.compare = false;
                    // If user closed the panel via the X button (not Back),
                    // pop the modal entry off history so future Back goes
                    // to the previous PAGE, not re-opens the compare panel.
                    if (wasOpen && !_isReplayingHistory) {
                        try {
                            const s = window.history.state;
                            if (s && s.modal === 'compare') {
                                window.history.back();
                            }
                        } catch (e) { /* ignore */ }
                    }
                    return result;
                };
            }

            if (_originalOpenAIFuture) {
                // Note: this wraps the already-wrapped openAIFuturePage from
                // the accordion-reset IIFE earlier in this file, which is
                // exactly what we want — both wrappers compose cleanly.
                window.openAIFuturePage = function(programTitle, uniName) {
                    const result = _originalOpenAIFuture.apply(this, arguments);
                    _modalState.aiFuture = true;
                    if (!_isReplayingHistory) {
                        const base = currentBaseState();
                        safePush({ page: base.page, uniId: base.uniId, cityId: base.cityId, modal: 'ai' });
                    }
                    return result;
                };
            }

            if (_originalCloseAIFuture) {
                window.closeAIFuturePage = function() {
                    const wasOpen = _modalState.aiFuture;
                    const result = _originalCloseAIFuture.apply(this, arguments);
                    _modalState.aiFuture = false;
                    if (wasOpen && !_isReplayingHistory) {
                        try {
                            const s = window.history.state;
                            if (s && s.modal === 'ai') {
                                window.history.back();
                            }
                        } catch (e) { /* ignore */ }
                    }
                    return result;
                };
            }

            if (_originalOpenInfoModal) {
                window.openInfoModal = function(section) {
                    const result = _originalOpenInfoModal.apply(this, arguments);
                    _modalState.infoModal = true;
                    if (!_isReplayingHistory) {
                        const base = currentBaseState();
                        safePush({ page: base.page, uniId: base.uniId, cityId: base.cityId, modal: 'info' });
                    }
                    return result;
                };
            }

            if (_originalCloseInfoModal) {
                window.closeInfoModal = function() {
                    const wasOpen = _modalState.infoModal;
                    const result = _originalCloseInfoModal.apply(this, arguments);
                    _modalState.infoModal = false;
                    if (wasOpen && !_isReplayingHistory) {
                        try {
                            const s = window.history.state;
                            if (s && s.modal === 'info') {
                                window.history.back();
                            }
                        } catch (e) { /* ignore */ }
                    }
                    return result;
                };
            }

            // -----------------------------------------------------------------
            // 9. SILENT REPLAY — open destination without pushing history
            // -----------------------------------------------------------------
            // Used by popstate (and the initial-load bootstrap) to bring
            // the UI to a given state without recording it as a new
            // history entry. All ORIGINAL (un-wrapped) functions are
            // called here so no new pushState fires.
            function replayState(state) {
                if (!state) state = { page: 'home' };
                _isReplayingHistory = true;
                try {
                    // FIRST: close any open modal that ISN'T the one we're
                    // navigating to. This handles the case where the
                    // user opens compare, then opens AI overlay, then
                    // hits Back twice — each Back should peel one layer.
                    if (_modalState.compare && state.modal !== 'compare' && _originalCloseCompare) {
                        try { _originalCloseCompare(); } catch (e) {}
                        _modalState.compare = false;
                    }
                    if (_modalState.aiFuture && state.modal !== 'ai' && _originalCloseAIFuture) {
                        try { _originalCloseAIFuture(); } catch (e) {}
                        _modalState.aiFuture = false;
                    }
                    if (_modalState.infoModal && state.modal !== 'info' && _originalCloseInfoModal) {
                        try { _originalCloseInfoModal(); } catch (e) {}
                        _modalState.infoModal = false;
                    }

                    // SECOND: navigate to the underlying page if it
                    // differs from the currently-active section. We use
                    // the original (un-wrapped) functions to avoid
                    // generating new history entries.
                    const activeId = (document.querySelector('.section.active') || {}).id;
                    const targetPageId = (function() {
                        switch (state.page) {
                            case 'home':       return 'page-home';
                            case 'usa':        return 'page-usa-unis';
                            case 'uk':         return 'page-uk-unis';
                            case 'university': return 'page-university-detail';
                            case 'city':       return 'page-city-detail';
                            default:           return 'page-home';
                        }
                    })();

                    if (state.page === 'university' && state.uniId) {
                        // Only re-load the university detail if we're not
                        // already viewing the same one (avoids re-fetching
                        // and re-animating in place when only the modal
                        // changed).
                        if (typeof currentActiveUniId === 'undefined' ||
                            currentActiveUniId !== state.uniId ||
                            activeId !== targetPageId) {
                            if (_originalLoadUniversity) _originalLoadUniversity(state.uniId);
                        }
                    } else if (state.page === 'city' && state.cityId) {
                        if (activeId !== targetPageId) {
                            if (_originalLoadCity) _originalLoadCity(state.cityId);
                        }
                    } else {
                        // Top-level page (home, usa, uk)
                        if (activeId !== targetPageId && _originalNavigateTo) {
                            _originalNavigateTo(targetPageId);
                        }
                    }

                    // THIRD: open the modal layer if the target state
                    // includes one and it isn't already open.
                    if (state.modal === 'compare' && !_modalState.compare && _originalOpenCompare) {
                        _originalOpenCompare();
                        _modalState.compare = true;
                    } else if (state.modal === 'ai' && !_modalState.aiFuture && _originalOpenAIFuture) {
                        // We don't have the programTitle/uniName for a deep-
                        // linked AI overlay — pass best-effort placeholders.
                        // The overlay still opens and the user can close it.
                        _originalOpenAIFuture('Program', 'University');
                        _modalState.aiFuture = true;
                    }
                    // Note: 'info' modal is intentionally NOT re-opened on
                    // replay because it requires per-section content that
                    // depends on which info card was clicked — re-opening
                    // it cold from a deep link would show stale data.
                    // Hitting Back through an info modal still works,
                    // it just won't re-appear via Forward.
                } finally {
                    _isReplayingHistory = false;
                }
            }

            // -----------------------------------------------------------------
            // 10. POPSTATE HANDLER — the heart of Back / Forward support
            // -----------------------------------------------------------------
            // Browsers fire popstate on EVERY history navigation: Back,
            // Forward, Android back gesture, mouse back button on side of
            // mouse, etc. We don't distinguish between them — we just
            // replay whatever state the browser hands us.
            window.addEventListener('popstate', function(event) {
                const state = event.state || hashToState(window.location.hash);
                replayState(state);
            });

            // Some old/edge mobile browsers fire hashchange instead of (or
            // in addition to) popstate. Hook it as a redundant safety net.
            // We guard against double-firing by checking if the URL still
            // disagrees with the current section AFTER popstate would have
            // run — if so, do a manual replay from the hash.
            window.addEventListener('hashchange', function() {
                const state = hashToState(window.location.hash);
                const activeId = (document.querySelector('.section.active') || {}).id;
                const expectedId = (function() {
                    switch (state.page) {
                        case 'home':       return 'page-home';
                        case 'usa':        return 'page-usa-unis';
                        case 'uk':         return 'page-uk-unis';
                        case 'university': return 'page-university-detail';
                        case 'city':       return 'page-city-detail';
                        default:           return 'page-home';
                    }
                })();
                if (activeId !== expectedId) {
                    replayState(state);
                }
            });

            // -----------------------------------------------------------------
            // 11. INITIAL BOOTSTRAP — deep links + refresh handling
            // -----------------------------------------------------------------
            // When the page first loads, we check the URL hash. If it
            // describes a non-home state, we replay it so refresh / direct
            // links / sharing all open the correct view.
            //
            // We use replaceState (not pushState) so the initial entry
            // sits at the bottom of the stack — pressing Back from the
            // first deep-linked view goes to whatever was there before
            // (typically nothing — i.e. exits the site) rather than to a
            // dangling /home entry.
            function bootstrapFromUrl() {
                _isBootstrapping = true;
                try {
                    const rawHash = window.location.hash || '';
                    const state = hashToState(rawHash);

                    // ALWAYS write a clean state object onto the current
                    // history entry. This guarantees event.state will
                    // be populated on the very next popstate fire — some
                    // browsers default it to null on first load.
                    safeReplace(state);

                    // If the hash points anywhere other than home, replay
                    // the state to actually open that section.
                    if (state.page !== 'home' || state.modal) {
                        // Defer one tick so the existing window.load
                        // handler (which sets active-page opacity, etc)
                        // gets to run first.
                        setTimeout(function() {
                            _isBootstrapping = false;
                            replayState(state);
                        }, 0);
                    } else {
                        _isBootstrapping = false;
                    }
                } catch (e) {
                    _isBootstrapping = false;
                }
            }

            // Run bootstrap after the DOM is fully loaded. The existing
            // window.load handler runs at this same point too, so we use
            // setTimeout(0) below to let it finish first inside
            // bootstrapFromUrl itself for non-home routes.
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                bootstrapFromUrl();
            } else {
                document.addEventListener('DOMContentLoaded', bootstrapFromUrl);
            }

        })();
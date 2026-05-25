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
        // Initially populated from the bundled hardcoded files so the site
        // works instantly on first paint. Once the Supabase sync below
        // resolves, the same `appData` object is overwritten in place
        // with the live universities + cities tables. The hardcoded files
        // therefore double as the offline / failure fallback — if the
        // Supabase request errors or the user is offline, the site keeps
        // running on the bundled data and shows a small status toast.
        const appData = {
            universities: Object.assign(
                {},
                (window.usaUniversitiesData || {}),
                (window.ukUniversitiesData || {})
            ),
            cities: (window.citiesData || {})
        };

        // Now that appData is fully defined, walk every university heroImage and
        // every city gallery item URL and warm them into the preload cache. By the
        // time the user clicks through to any university card or city page, the
        // bitmap is already in memory and the navigation feels instantaneous.
        preloadFromAppData();

        // --- 1a. Supabase live sync ---
        // Kick off an async fetch of the universities + cities tables. On
        // success, transparently replace the contents of appData.universities
        // and appData.cities so every consumer (loadUniversity, Compare,
        // city detail page, etc.) keeps working without code changes. On
        // failure we keep the bundled data already loaded and surface a
        // subtle "offline data" toast so the developer notices in DevTools
        // without breaking the experience for the user.
        (function syncDataFromSupabase() {
            if (!window.WayPointDB) {
                console.warn('[WayPoint] WayPointDB unavailable — using bundled offline data.');
                wpSyncStatus('Offline data', 4000);
                return;
            }

            wpSyncStatus('Loading universities…', 0);

            Promise.all([
                window.WayPointDB.fetchUniversities(),
                window.WayPointDB.fetchCities()
            ]).then(function (results) {
                const freshUnis   = results[0] || {};
                const freshCities = results[1] || {};

                const uniCount  = Object.keys(freshUnis).length;
                const cityCount = Object.keys(freshCities).length;

                // Defensive guard: if Supabase returned an empty payload
                // (tables not yet seeded), keep the bundled data rather
                // than wiping the site clean.
                if (uniCount === 0 && cityCount === 0) {
                    console.warn('[WayPoint] Supabase returned no rows — staying on bundled data. Did you run supabase-schema.sql and the seed SQL from tools/export-to-sql.html?');
                    wpSyncStatus('Showing offline data — database appears empty', 5000);
                    return;
                }

                // Overwrite in place so any code that captured `appData` by
                // reference (e.g. the Compare module) keeps working.
                if (uniCount > 0) {
                    for (const k in appData.universities) {
                        if (Object.prototype.hasOwnProperty.call(appData.universities, k)) {
                            delete appData.universities[k];
                        }
                    }
                    Object.assign(appData.universities, freshUnis);
                }
                if (cityCount > 0) {
                    for (const k in appData.cities) {
                        if (Object.prototype.hasOwnProperty.call(appData.cities, k)) {
                            delete appData.cities[k];
                        }
                    }
                    Object.assign(appData.cities, freshCities);
                }

                // Warm the freshly-arrived image URLs into the preload cache.
                preloadFromAppData();

                console.info('[WayPoint] Supabase sync complete — ' + uniCount + ' universities, ' + cityCount + ' cities.');
                wpSyncStatus('', 0);
            }).catch(function (err) {
                console.error('[WayPoint] Supabase sync failed — using bundled offline data.', err);
                wpSyncStatus('Showing offline data — could not reach database', 5000);
            });
        })();

        // Tiny floating status pill — surfaces "Loading…", "Offline data",
        // and error states without changing the visual design of the page.
        // Pass an empty `msg` to hide it. `hideAfterMs > 0` auto-hides after
        // that many milliseconds; 0 means leave it shown until the next call.
        function wpSyncStatus(msg, hideAfterMs) {
            let el = document.getElementById('wp-sync-status');
            if (!el) {
                el = document.createElement('div');
                el.id = 'wp-sync-status';
                el.style.cssText = [
                    'position:fixed',
                    'bottom:18px',
                    'left:50%',
                    'transform:translateX(-50%)',
                    'background:rgba(20,20,20,0.86)',
                    'color:#f5d97b',
                    'font-family:Inter, system-ui, sans-serif',
                    'font-size:13px',
                    'font-weight:500',
                    'letter-spacing:0.01em',
                    'padding:9px 18px',
                    'border-radius:999px',
                    'box-shadow:0 6px 22px rgba(0,0,0,0.28)',
                    'backdrop-filter:blur(8px)',
                    '-webkit-backdrop-filter:blur(8px)',
                    'z-index:9999',
                    'opacity:0',
                    'transition:opacity 0.25s ease',
                    'pointer-events:none',
                    'max-width:90vw',
                    'text-align:center'
                ].join(';');
                document.body.appendChild(el);
            }
            if (!msg) {
                el.style.opacity = '0';
                return;
            }
            el.textContent = msg;
            el.style.opacity = '1';
            if (el._wpHideTimer) clearTimeout(el._wpHideTimer);
            if (hideAfterMs && hideAfterMs > 0) {
                el._wpHideTimer = setTimeout(function () {
                    el.style.opacity = '0';
                }, hideAfterMs);
            }
        }

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


        /* ====================================================================
           WAYPOINT 2026 — MOTION LAYER
           --------------------------------------------------------------------
           Additive only. Every existing function above this block is left
           byte-identical — this layer adds the new visual motion primitives:

             1. Cursor spotlight — CSS variable updates on mousemove drive
                the soft halo defined as `.wp-spotlight` in styles.css.
             2. Magnetic buttons — primary CTAs gently pull toward the
                cursor when it approaches.
             3. Card cursor highlight — uni-cards expose --wp-cx / --wp-cy
                so the gradient highlight in CSS tracks the pointer.
             4. Scroll-reveal — IntersectionObserver fades + lifts elements
                marked .wp-reveal into view as they enter the viewport.
                Decorates the document body with .wp-ready so the CSS
                layer (which sets opacity:0 only when wp-ready is on)
                degrades gracefully if JS never runs.
             5. Numeric tickers — every element marked .wp-ticker counts
                up from 0 to its numeric content on first reveal.

           All motion is reduced-motion-aware and pointer-aware: nothing
           runs on touch devices or for users with prefers-reduced-motion.
        ==================================================================== */
        (function () {
            'use strict';

            const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const finePointer   = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

            // ------------------------------------------------------------
            // 1. CURSOR SPOTLIGHT
            // ------------------------------------------------------------
            // Updates --wp-mx / --wp-my CSS variables on the root every
            // mousemove. Adds body.wp-spotlight-on so the spotlight
            // layer becomes visible. Throttled via rAF so we never write
            // the variable more than once per frame.
            (function setupSpotlight() {
                if (reducedMotion || !finePointer) return;
                const root = document.documentElement;
                let pendingX = 0, pendingY = 0, ticking = false;

                function flush() {
                    root.style.setProperty('--wp-mx', pendingX + 'px');
                    root.style.setProperty('--wp-my', pendingY + 'px');
                    ticking = false;
                }

                document.addEventListener('mousemove', function (e) {
                    pendingX = e.clientX;
                    pendingY = e.clientY;
                    if (!ticking) {
                        ticking = true;
                        requestAnimationFrame(flush);
                    }
                }, { passive: true });

                // Activate after a brief delay so the first paint doesn't
                // include a spotlight before the user has moved at all.
                window.setTimeout(function () {
                    document.body.classList.add('wp-spotlight-on');
                }, 400);
            })();

            // ------------------------------------------------------------
            // 2. CARD CURSOR HIGHLIGHT — per-card --wp-cx/--wp-cy
            // ------------------------------------------------------------
            // The .uni-card::before rule in styles.css uses --wp-cx and
            // --wp-cy to position a radial gold highlight that follows
            // the cursor inside each card. We attach a single delegated
            // mousemove listener for efficiency.
            (function setupCardHighlight() {
                if (reducedMotion || !finePointer) return;

                document.addEventListener('mousemove', function (e) {
                    const card = e.target.closest && e.target.closest('.uni-card, .country-card, .glass-card, .uni-info-card');
                    if (!card) return;
                    const rect = card.getBoundingClientRect();
                    const cx = ((e.clientX - rect.left) / rect.width) * 100;
                    const cy = ((e.clientY - rect.top) / rect.height) * 100;
                    card.style.setProperty('--wp-cx', cx + '%');
                    card.style.setProperty('--wp-cy', cy + '%');
                }, { passive: true });
            })();

            // ------------------------------------------------------------
            // 3. MAGNETIC BUTTONS
            // ------------------------------------------------------------
            // Primary CTAs gently pull toward the cursor when it enters
            // a small zone around them. Translation is tiny (max 6px) to
            // stay tasteful — Linear's strength is restraint.
            (function setupMagnetic() {
                if (reducedMotion || !finePointer) return;

                const MAGNET_RADIUS = 80;   // px around the button that triggers pull
                const MAGNET_STRENGTH = 0.25;
                const selector = '.btn, .compare-trigger-btn, .btn-back.floating, .modal-close-btn, .ai-future-close-btn';

                document.addEventListener('mousemove', function (e) {
                    const btns = document.querySelectorAll(selector);
                    btns.forEach(function (btn) {
                        const rect = btn.getBoundingClientRect();
                        const bx = rect.left + rect.width / 2;
                        const by = rect.top + rect.height / 2;
                        const dx = e.clientX - bx;
                        const dy = e.clientY - by;
                        const dist = Math.hypot(dx, dy);
                        if (dist < MAGNET_RADIUS + Math.max(rect.width, rect.height) / 2) {
                            btn.style.transform = 'translate(' + (dx * MAGNET_STRENGTH) + 'px, ' + (dy * MAGNET_STRENGTH) + 'px)';
                        } else if (btn.style.transform) {
                            btn.style.transform = '';
                        }
                    });
                }, { passive: true });

                // Wipe transforms when leaving the window so buttons reset.
                document.addEventListener('mouseleave', function () {
                    document.querySelectorAll(selector).forEach(function (b) { b.style.transform = ''; });
                });
            })();

            // ------------------------------------------------------------
            // 4. SCROLL-REVEAL
            // ------------------------------------------------------------
            // Anything with class .wp-reveal animates in as it enters
            // the viewport. We also auto-tag a useful set of section
            // elements so the entire site picks up reveals without
            // having to edit every piece of markup.
            function setupRevealObserver() {
                // Auto-tag containers that benefit from reveal on first
                // entry. We do this BEFORE adding .wp-ready so the
                // initial state isn't a flash of visible content.
                const autoSelectors = [
                    '.page-header',
                    '.glass-card',
                    '.uni-info-card',
                    '.editorial-section',
                    '.gallery-card',
                    '.story-card',
                    '.uni-card',
                    '.uk-half-card',
                    '.program-card',
                    '.list-item',
                    '.site-footer'
                ];
                autoSelectors.forEach(function (sel) {
                    document.querySelectorAll(sel).forEach(function (el) {
                        if (!el.classList.contains('wp-reveal')) {
                            el.classList.add('wp-reveal');
                        }
                    });
                });

                // Stagger the country-cards-container so the homepage hero
                // tiles reveal in sequence rather than all at once.
                const countryGroup = document.querySelector('.country-cards-container');
                if (countryGroup && !countryGroup.hasAttribute('data-wp-stagger')) {
                    // Stagger applies to direct children, but our container
                    // wraps active cards directly + a .other-countries div.
                    // Attach stagger to .other-countries too.
                    const otherCountries = document.querySelector('.other-countries');
                    if (otherCountries) otherCountries.setAttribute('data-wp-stagger', '');
                }

                document.body.classList.add('wp-ready');

                if (!('IntersectionObserver' in window)) {
                    // Fallback — reveal everything immediately.
                    document.querySelectorAll('.wp-reveal').forEach(function (el) {
                        el.classList.add('is-revealed');
                    });
                    return;
                }

                const io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-revealed');
                            io.unobserve(entry.target);

                            // Fire any tickers inside this element on reveal.
                            entry.target.querySelectorAll('.wp-ticker').forEach(runTicker);
                            if (entry.target.classList.contains('wp-ticker')) runTicker(entry.target);
                        }
                    });
                }, {
                    root: null,
                    rootMargin: '0px 0px -8% 0px',
                    threshold: 0.05
                });

                document.querySelectorAll('.wp-reveal').forEach(function (el) {
                    io.observe(el);
                });

                // Re-scan whenever a new page section is shown — JS
                // builds dynamic content for uni / city detail pages on
                // demand. We hook into the existing navigateTo wrapper
                // by observing class mutations on .section elements.
                const sectionObserver = new MutationObserver(function (muts) {
                    muts.forEach(function (m) {
                        if (m.attributeName === 'class' && m.target.classList.contains('section') && m.target.classList.contains('active')) {
                            window.setTimeout(rescanReveal, 60);
                        }
                    });
                });
                document.querySelectorAll('.section').forEach(function (s) {
                    sectionObserver.observe(s, { attributes: true });
                });

                function rescanReveal() {
                    autoSelectors.forEach(function (sel) {
                        document.querySelectorAll(sel).forEach(function (el) {
                            if (!el.classList.contains('wp-reveal')) {
                                el.classList.add('wp-reveal');
                                io.observe(el);
                            } else if (!el.classList.contains('is-revealed')) {
                                io.observe(el);
                            }
                        });
                    });
                }

                // Expose for any future callers.
                window.__wpRescanReveal = rescanReveal;
            }

            if (reducedMotion) {
                // Mark every reveal element as already revealed so they
                // appear immediately, and skip the observer entirely.
                document.querySelectorAll('.wp-reveal').forEach(function (el) {
                    el.classList.add('is-revealed');
                });
            } else if (document.readyState === 'complete' || document.readyState === 'interactive') {
                setupRevealObserver();
            } else {
                document.addEventListener('DOMContentLoaded', setupRevealObserver);
            }

            // ------------------------------------------------------------
            // 5. NUMERIC TICKERS
            // ------------------------------------------------------------
            // For elements with the .wp-ticker class — counts up to the
            // numeric value contained in the element on first reveal.
            // Preserves any leading currency symbol or trailing suffix.
            function runTicker(el) {
                if (!el || el.dataset.wpTickerDone === '1') return;
                el.dataset.wpTickerDone = '1';
                const raw = (el.textContent || '').trim();
                const match = raw.match(/^([^0-9.-]*)([0-9][0-9,.]*)([^0-9].*)?$/);
                if (!match) return;
                const prefix = match[1] || '';
                const numStr = match[2].replace(/,/g, '');
                const suffix = match[3] || '';
                const target = parseFloat(numStr);
                if (isNaN(target)) return;
                const isFloat = numStr.indexOf('.') >= 0;
                const duration = 1200;
                const start = performance.now();
                function frame(now) {
                    const t = Math.min(1, (now - start) / duration);
                    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
                    const current = target * eased;
                    const display = isFloat
                        ? current.toFixed(1)
                        : Math.round(current).toLocaleString();
                    el.textContent = prefix + display + suffix;
                    if (t < 1) requestAnimationFrame(frame);
                }
                if (!reducedMotion) requestAnimationFrame(frame);
            }

        })();

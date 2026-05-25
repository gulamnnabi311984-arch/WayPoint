// ============================================================
// WayPoint — Supabase client
// ------------------------------------------------------------
// Initialises the browser-side Supabase client and exposes two
// async fetchers on window.WayPointDB:
//
//   window.WayPointDB.fetchUniversities()  →  Promise<{ id: uni, ... }>
//   window.WayPointDB.fetchCities()        →  Promise<{ id: city, ... }>
//
// Both fetchers reshape the response into the same keyed-object
// structure that script.js already consumes from
// window.usaUniversitiesData / window.ukUniversitiesData /
// window.citiesData — so the rest of the app doesn't need to
// know whether the data came from Supabase or from the bundled
// hardcoded backup files.
//
// SAFETY NOTE on the publishable key:
//   Supabase's "publishable" (formerly "anon") key is DESIGNED
//   to be embedded in client-side code. The real security
//   boundary is the Row Level Security policies declared in
//   supabase-schema.sql, which allow `anon` to SELECT only.
//   Writes require the service_role key, which we never put in
//   the browser.
// ============================================================

(function () {
    'use strict';

    const SUPABASE_URL              = 'https://ulbfjwoqayhtqxejwuuq.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY  = 'sb_publishable_G-S3NNIAhXlFy4M_T9IQlA_Isi0NJa6';

    if (!window.supabase || !window.supabase.createClient) {
        console.error(
            '[WayPointDB] @supabase/supabase-js library not loaded. ' +
            'Make sure the Supabase CDN <script> tag is included BEFORE ' +
            'supabase-client.js in index.html.'
        );
        return;
    }

    const client = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false } }
    );

    // PostgREST select strings — use the `alias:column` syntax so the
    // response keys come back in the original camelCase shape that
    // script.js already expects (no JS-side renaming required).
    const UNI_SELECT = [
        'id',
        'country',
        'name',
        'shortName:short_name',
        'cityId:city_id',
        'cityName:city_name',
        'rank',
        'tuition',
        'heroImage:hero_image',
        'overview',
        'financialReqs:financial_reqs',
        'quickFacts:quick_facts',
        'admissionRequirements:admission_requirements',
        'applicationDeadlines:application_deadlines',
        'bachelors',
        'masters',
        'scholarships'
    ].join(', ');

    const CITY_SELECT = [
        'id',
        'name',
        'state',
        'layout',
        'gallery',
        'life',
        'vibes',
        'landmarks',
        'costNoteTop:cost_note_top',
        'costNoteBottom:cost_note_bottom',
        'rentShared:rent_shared',
        'rentStudio:rent_studio',
        'utilsShared:utils_shared',
        'utilsStudio:utils_studio',
        'foodShared:food_shared',
        'foodStudio:food_studio',
        'transShared:trans_shared',
        'transStudio:trans_studio',
        'entShared:ent_shared',
        'entStudio:ent_studio',
        'totalShared:total_shared',
        'totalStudio:total_studio',
        'utils',
        'food',
        'trans'
    ].join(', ');

    // Convert an array of rows from Supabase into a keyed map
    // { mit: {...}, harvard: {...}, ... }. Drops null/undefined
    // fields so existing `if (uni.field)` truthy checks behave the
    // same as they did with the hardcoded files (which simply
    // omitted keys rather than setting them to null).
    function arrayToKeyedMap(rows, dropFields) {
        const out = {};
        const dropSet = new Set(dropFields || []);
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const id = row.id;
            const cleaned = {};
            for (const key in row) {
                if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
                if (key === 'id') continue;
                if (dropSet.has(key)) continue;
                const val = row[key];
                if (val === null || val === undefined) continue;
                cleaned[key] = val;
            }
            out[id] = cleaned;
        }
        return out;
    }

    window.WayPointDB = {
        client: client,

        // Returns a Promise resolving to:
        //   { mit: { name, shortName, cityId, ..., bachelors:[], ... }, ... }
        // — the SAME shape script.js's appData.universities already uses.
        fetchUniversities: function () {
            return client
                .from('universities')
                .select(UNI_SELECT)
                .order('display_order', { ascending: true })
                .then(function (res) {
                    if (res.error) throw res.error;
                    // `country` is kept in the row for callers who care, but
                    // the hardcoded files never had this field, so drop it
                    // to keep the in-memory shape byte-identical to before.
                    return arrayToKeyedMap(res.data || [], ['country']);
                });
        },

        // Returns a Promise resolving to:
        //   { cambridge: { name, state, layout, gallery:[], ... }, ... }
        fetchCities: function () {
            return client
                .from('cities')
                .select(CITY_SELECT)
                .then(function (res) {
                    if (res.error) throw res.error;
                    return arrayToKeyedMap(res.data || []);
                });
        }
    };
})();

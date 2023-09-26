import { json } from '@sveltejs/kit';
import { kv } from "@vercel/kv";
import { DEFAULT_ID_KEYLENGTH, DEFAULT_LINK_TTL, CONFIG_ID_HEADER_KEY } from '$lib/constants';


/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
    const id = request.headers.get(CONFIG_ID_HEADER_KEY);
    
    if (!id) return json({
        err: `Missing header key: ${CONFIG_ID_HEADER_KEY}`,
    }, {status: 400});

    const config = await kv.get(id);
    if (!config) return json({
        err: "Link is not valid or has already expired!",
    }, {status: 404});

    return json({
        config: config
    }, {status: 200});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    const reqData = await request.json();

    if (!reqData) 
        return json({ success: false, err: "No valid link or config provided!" }, { status: 400 });

    const link = genKey(DEFAULT_ID_KEYLENGTH);
    
    await kv.set(link, reqData, {
        ex: DEFAULT_LINK_TTL
    });

    return json({
        link: link,
        success: true,
        err: null
    }, {status: 201});
}

/** @param {number} digits */
function genKey(digits) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < digits; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from 'redis';
import { DEFAULT_ID_KEYLENGTH, DEFAULT_LINK_TTL, CONFIG_ID_HEADER_KEY } from '$lib/constants';

/** @type {import('./$types').RequestHandler} */
export async function GET({ request }) {
    const redis = await createClient({
        url: env.REDIS_URL,
    }).connect()
    const id = request.headers.get(CONFIG_ID_HEADER_KEY);
    
    if (!id) return json({
        err: `Missing header key: ${CONFIG_ID_HEADER_KEY}`,
    }, {status: 400});

    const config = await redis.get(id);
    if (!config) return json({
        err: "Link is not valid or has already expired!",
    }, {status: 404});

    return json({
        config: config
    }, {status: 200});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    const redis = await createClient({
        url: env.REDIS_URL,
    }).connect()
    const reqData = await request.json();
    

    if (!reqData) 
        return json({ success: false, err: "No valid link or config provided!" }, { status: 400 });

    const link = genKey(DEFAULT_ID_KEYLENGTH);
    
    try {
        await redis.set(link, reqData, {
            expiration: {
                type: "EX",
                value: DEFAULT_LINK_TTL,            
            }
        });
    } catch (err) {
        return json({ success: false, err: err }, { status: 400 });
    }

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
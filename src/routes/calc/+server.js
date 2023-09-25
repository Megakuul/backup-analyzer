import { json } from '@sveltejs/kit';
import { kv } from "@vercel/kv";

// Four days in seconds is defined as fixed expiration time
const LINKTTL = 345600;

const DEFKEYLENGHT = 16;

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    const reqData = await request.json();

    if (!reqData) 
        return json({ success: false, err: "No valid link or config provided!" }, { status: 400 });

    const link = genKey(DEFKEYLENGHT);
    
    await kv.set(link, reqData, {
        ex: LINKTTL
    });

    return json({
        link: link,
        success: true,
        err: null
    }, {status: 200});
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
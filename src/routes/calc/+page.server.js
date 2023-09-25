import { kv } from "@vercel/kv";

/** @type {import("./$types").PageServerLoad} */
export async function load({ url  }) {
    const id = url.searchParams.get("id");
    if (!id) return { weekdays: null, main_options: null,gfs: null }

    const config = await kv.get(id);
    if (!config) return { weekdays: null, main_options: null, gfs: null }
    return {
        weekdays: config.weekdays,
        main_options: config.main_options,
        gfs: config.gfs
    }
}
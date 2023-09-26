import { CONFIG_LOCSTORE_KEY, CONFIG_ID_HEADER_KEY, DEFAULT_ID_KEYLENGTH } from "./constants";

/** Loads the configuration in following order:
 * 
 * - Check for valid link in query param and request config
 * - If no valid link on database, check for config in localStorage
 * - Fallback to empty default config (by not changing the config)
 * 
 * @param {string | null} linkid Id of the link, if there is no query param, just set this to NULL/undefined
 * @param {CONFIG} config Configuration object
 * @returns {Promise<string | null>} error
 */
export const loadConfig = async (linkid, config) => {
    if (linkid && linkid.length === DEFAULT_ID_KEYLENGTH) {
        const res = await fetch("/api/calc", {
            method: "GET",
            headers: {
                [CONFIG_ID_HEADER_KEY]: linkid,
                "Content-Type": "application/json"
            }
        });

        const resData = await res.json();
        if (resData.config) {
            config.weekdays = resData.config.weekdays ?? config.weekdays;
            config.main_options = resData.config.main_options ?? config.main_options;
            config.gfs = resData.config.gfs ?? config.gfs;
            return null;
        }
        else if (resData.err) {
            return resData.err;
        } else {
            return "Failed while fetching data from the server!";
        }
    }

    const val = localStorage.getItem(CONFIG_LOCSTORE_KEY);
    if (val) {
        setConf(config, val);
    }
    return null;
}

/** Simple helper function that parses a string into a config object
 *  and directly sets it to the configuration object.
 * 
 * Returns null if successful and a string with the error message if unsuccessful
 * @param {CONFIG} config configuration object
 * @param {string} raw configuration as string
 * @returns {string | null}
 */
const setConf = (config, raw) => {
    try {
        /** @type {CONFIG} */
        const parsedVal = JSON.parse(raw);
        config.weekdays = parsedVal.weekdays ?? config.weekdays;
        config.main_options = parsedVal.main_options ?? config.main_options;
        config.gfs = parsedVal.gfs ?? config.gfs;
        return null;
    } catch (err) {
        return String(err);
    }
}

/**
 * @param {string} key 
 * @param {*} val 
 * @returns 
 */
export const setLocStore = (key, val) => {
    const strVal = JSON.stringify(val);
    localStorage.setItem(key, strVal);
}

export const resetLocStore = () => {
    localStorage.clear();
}
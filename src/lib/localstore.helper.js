/**
 * @param {*} main Data that is loaded usually
 * @param {string} fallbackKey If main is null, it searches the localstore by this key
 * @param {*} def If all options failed, it will fallback to default (hardcoded)
 * @returns 
 */
export const loadIfExisting = (main, fallbackKey, def) => {
    if (main)
        return main;
    const val = localStorage.getItem(fallbackKey);
    return val ? JSON.parse(val) : def;
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
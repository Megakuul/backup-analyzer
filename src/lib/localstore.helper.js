/**
 * @param {string} key 
 * @param {*} def 
 * @returns 
 */
export const loadIfExisting = (key, def) => {
    const val = localStorage.getItem(key);
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
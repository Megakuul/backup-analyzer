// Types are not exported, when using TypeScript engine (VSCode) or WebStorm,
// JSDoc annotations are automatically made available in the whole project.

/**
 * @typedef {('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')} DAY
*/
 
/**
 * @typedef {Object} BACKUP
 * @property {boolean} full
 * @property {boolean} weekly
 * @property {boolean} monthly
 * @property {boolean} yearly
 * @property {number} size
*/

/**
 * @typedef {Object} WEEKDAY
 * @property {DAY} day
 * @property {Array<BACKUP>} points
 * @property {boolean} exec
 * @property {boolean} full
*/

/**
 * @typedef {Object} GFS
 * @property {number} weekly
 * @property {number} monthly
 * @property {number} yearly
*/

/**
 * @typedef {Object} MAIN_OPTIONS
 * @property {number} restore_points
 * @property {number} full_size
 * @property {number} increment_size
*/

/**
 * @typedef {Object} CONFIG
 * @property {WEEKDAY[]} weekdays
 * @property {MAIN_OPTIONS} main_options
 * @property {GFS} gfs
*/

/**
 * @typedef {Object} STORAGE_ESTIMATE
 * @property {number} current_max
 * @property {number} projected_max
 * @property {number} projection_years
 * @property {number} data_growth
 */
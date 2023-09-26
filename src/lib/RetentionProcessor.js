/** ProcessRetentionPolicy will create the restorepoints and mark the fulls
 * 
 * This function uses days as orientation (horizontal)
 * @param {CONFIG} config
 * @returns {CONFIG}
*/
export const processRetentionPolicy = (config) => {
    // Clear points
    config.weekdays.map((weekday) => weekday.points = []);

    /** @type {WEEKDAY[]} */
    const processedDays = config.weekdays.filter(weekday => weekday.exec);
    if (processedDays.length === 0) return config;

    // Backups per day ignoring the last weekly block
    /** @type {number} */
    let weekCount = Math.floor(config.main_options.restore_points / processedDays.length);

    // Backups from the last weekly block
    /** @type {number} */
    let extraDays = config.main_options.restore_points % processedDays.length;

    // Has Extra Backups
    /** @type {boolean} */
    let hasExtraDays = false;

    // Is in search State
    /** @type {boolean} */
    let isSearchState = false;

    if (extraDays>0) {
        weekCount++;
        hasExtraDays = true;
    }

    for (let week = 0; week < weekCount; week++) {

        // Set day count to the extraDays on the last week
        let dayCount = week+1===weekCount && hasExtraDays
            ? extraDays : processedDays.length; 

        // When searching for the next full backup it only wants to read 1 backup at the time
        dayCount = isSearchState ? 1 : dayCount;

        for (let day = 0; day < dayCount; day++) {
            processedDays[day].points.push({
                full: processedDays[day].full,
                weekly: false,
                monthly: false,
                yearly: false,
                size: processedDays[day].full ? config.main_options.full_size : config.main_options.increment_size,
            });

            /**
             * Setting ensures continuous backup chain.
             * Veeam retains full backups until dependent incrementals reach retention limit.
             * 
             * Checks if the last day of the last week is a full and if not go to the next full
            */
            if (week+1===weekCount
                && day+1===dayCount
                && !processedDays[day].full) {
                
                if (!processedDays.some((weekday) => weekday.full)) {
                    // This applies when forever-forward incremental policy is used 
                    processedDays[day].points[week].full = true;
                    break;
                }
                if (processedDays.length > dayCount) {
                    dayCount++;
                    continue;
                }
                weekCount++;
                isSearchState = true;
            }
        }
    }
    
    return config;
}
/** ProcessGFS will mark all the GFS points
 * 
 * This function uses the weeks as orientation (vertical)
 * @param {CONFIG} config
 * @returns {CONFIG}
*/
export const processGFS = (config) => {
    if (config.gfs.weekly===0 &&
        config.gfs.monthly===0 && 
        config.gfs.yearly===0) {

        return config;
    }

    /** @type {Array<WEEKDAY>} Pointer cache for processed days */
    const processedDays = config.weekdays.filter((weekday) => weekday.exec);
    if (processedDays.length <= 0) {
        return config;
    }

    // When using forever-forward incremental policy, gfs cannot be used
    if (!processedDays.some((weekday) => weekday.full)) {
        return config;
    }

    const WeeksPerMonth = 4;
    const WeeksPerYear = 52;

    /** @type {Array<BACKUP[]>} */
    let weeks = [];

    // Convert structure from day-based to week-based
    for (let weekIndex = 0; weekIndex < processedDays[0].points.length; weekIndex++) {
        const curWeek = [];
        for (const day of processedDays) {
            if (day.points[weekIndex])
                curWeek.push(day.points[weekIndex]);
        }
        weeks.push(curWeek);
    }

    // Process weekly backups
    /** @type {number} Holds the day when the GFS Retention is done */
    let gfsDayIndex = 0;
    // Loop every week
    for (let i = 0; i < config.gfs.weekly; i++) {
        // Backup does not exist
        if (!processedDays[gfsDayIndex].points[i]) {
            if (!processedDays[gfsDayIndex].full) continue;
            processedDays[gfsDayIndex].points[i] = {
                full: true,
                weekly: true,
                monthly: false,
                yearly: false,
                size: config.main_options.full_size,
            }
            continue;
        }
        // Backup does already exist

        // Reverseloop every day to find the gfs day
        for (let j = weeks[i].length-1;j >= 0; j--) {
            if (weeks[i][j].full) {
                weeks[i][j].weekly = true;
                gfsDayIndex = j;
                break;
            }
        }
    }

    // Loop every month (assuming a month is represented as 4 weeks (28 days))
    for (let i = 0; i < config.gfs.monthly; i++) {
        const weekIndex = i*WeeksPerMonth;

        // Backup does not exist
        if (!processedDays[gfsDayIndex].points[weekIndex]) {
            if (!processedDays[gfsDayIndex].full) continue;
            processedDays[gfsDayIndex].points[weekIndex] = {
                full: true,
                weekly: false,
                monthly: true,
                yearly: false,
                size: config.main_options.full_size,
            }
            continue;
        }
        // Backup does already exist

        // If the gfs day is valid (happens if weekly backups are enabled) directly set the monthly
        if (processedDays[gfsDayIndex].full) {
            processedDays[gfsDayIndex].points[weekIndex].monthly = true;
        } else {
        // If the gfs day is invalid (no full backup) (happens if weekly backups are disabled) find the gfs day
            // Loop every day to find gfs day
            for (let j = 0;j < weeks[weekIndex].length; j++) {
                if (processedDays[j].full) {
                    weeks[weekIndex][j].monthly = true;
                    gfsDayIndex = j;
                    break;
                }
            }
        }
    }

    // Process yearly backups
    // Loop every year (assuming a year is represented as 52 weeks)
    for (let i = 0; i < config.gfs.yearly; i++) {
        const weekIndex = i*WeeksPerYear;

        // Backup does not exist
        if (!processedDays[gfsDayIndex].points[weekIndex]) {
            if (!processedDays[gfsDayIndex].full) continue;
            processedDays[gfsDayIndex].points[weekIndex] = {
                full: true,
                weekly: false,
                monthly: false,
                yearly: true,
                size: config.main_options.full_size,
            }
            continue;
        }
        // Backup does already exist

        // If the gfs day is valid (happens if weekly | monthly backups are enabled) directly set the yearly
        if (processedDays[gfsDayIndex].full) {
            processedDays[gfsDayIndex].points[weekIndex].yearly = true;
        } else {
        // If the gfs day is invalid (no full backup) (happens if weekly & monthly backups are disabled) find the gfs day
            // Loop every day to find the gfs day
            for (let j = 0;j < weeks[weekIndex].length; j++) {
                if (processedDays[j].full) {
                    weeks[weekIndex][j].yearly = true;
                    gfsDayIndex = j;
                    break;
                }
            }
        }
    }

    return config;
}
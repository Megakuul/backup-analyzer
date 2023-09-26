
/**
 * @param {CONFIG} config
 * @param {STORAGE_ESTIMATE} storageEstimate
 * @returns {STORAGE_ESTIMATE}
 */
export const calculateStorage = (config, storageEstimate) => {
    /**
     * One full backup is defined as safeguard buffer.
     * 
     * 
     * IMPORTANT: Do not take this buffer as your backup storage buffer, 
     * it's a system-critical buffer. You will always need to define a buffer for the backups,
     * usually this should be around 15% (without the data growth buffer)
    */
    storageEstimate.current_max = config.main_options.full_size;

    // Filter out days that are processed (i.e. days on which backups are executed)
    const processedDays = config.weekdays.filter((weekday) => weekday.exec);
    if (processedDays.length <= 0) {
        storageEstimate.current_max = 0;
        return storageEstimate;
    }

    // Add the base storage of the restorepoints
    for (let i = 0; i < processedDays.length; i++) {
        /** Determine the number of valid backup points for the day. 
         * Undefined values can appear in the array when using GFS. */ 
        const numberOfPoints = processedDays[i].points
            .filter(value => value !== undefined).length;

        // Determine the size of the backup for the day: either full or incremental
        const backupSizeForDay = processedDays[i].full ?
            config.main_options.full_size : config.main_options.increment_size;

        storageEstimate.current_max += numberOfPoints*backupSizeForDay;
    }

    storageEstimate.current_max = Math.round(storageEstimate.current_max);

    storageEstimate.projected_max = storageEstimate.current_max;

    // Limit yearsToCalc to avoid page crashes when to high values are entered
    storageEstimate.projection_years = storageEstimate.projection_years > 99 
        ? 0 : storageEstimate.projection_years;

    for (let i = 0; i < storageEstimate.projection_years; i++) {
        storageEstimate.projected_max = Math.round(storageEstimate.projected_max*((storageEstimate.data_growth / 100)+1));
    }

    // Return it (even if it was passed by reference) for Svelte to react
    return storageEstimate;
}
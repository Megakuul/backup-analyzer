<script>
    import { base } from "$app/paths";
    /**
     * @typedef {('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')} DAY
    */

    import { loadIfExisting, setLocStore } from "$lib/localstore.helper";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    const WEEKDAYS_LOCSTORE_KEY = "conf_weekdays";
    const GFS_LOCSTORE_KEY = "conf_gfs";
    const MAIN_OPTIONS_LOCSTORE_KEY = "conf_main_options";
    
    const DEF_GFS_WEEKLY_POINT = "Sunday";


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
    
    /** @type {WEEKDAY[]} */
    let weekdays = [
        { day: 'Monday', points: [], exec: false, full: false },
        { day: 'Tuesday', points: [], exec: false, full: false },
        { day: 'Wednesday', points: [], exec: false, full: false },
        { day: 'Thursday', points: [], exec: false, full: false },
        { day: 'Friday', points: [], exec: false, full: false },
        { day: 'Saturday', points: [], exec: false, full: false },
        { day: 'Sunday', points: [], exec: false, full: false }
    ];

    /** @type {GFS} */
    let gfs = {
        weekly: 0,
        monthly: 0,
        yearly: 0
    };

    /** @type {MAIN_OPTIONS} */
    let main_options = {
        restore_points: 0,
        full_size: 0,
        increment_size: 0
    };

    /** Is SaveState clicked @type {boolean} */
    let isSaveState = false;

    onMount(() => {
        // Try to load config from localstore
        weekdays = loadIfExisting(WEEKDAYS_LOCSTORE_KEY, weekdays);
        gfs = loadIfExisting(GFS_LOCSTORE_KEY, gfs);
        main_options = loadIfExisting(MAIN_OPTIONS_LOCSTORE_KEY, main_options);
        updateCanvas();
    });

    /** ProcessRetentionPolicy will create the restorepoints and mark the fulls
     * 
     * This function uses days as orientation (horizontal)
     * @param {WEEKDAY[]} weekdays
     * @param {MAIN_OPTIONS} main_options
     * @returns {WEEKDAY[]}
    */
    const processRetentionPolicy = (weekdays, main_options) => {
        /** @type {WEEKDAY[]} */
        const processedDays = weekdays.filter(weekday => weekday.exec);
        if (processedDays.length === 0) return weekdays;

        // Backups per day ignoring the last weekly block
        /** @type {number} */
        const basePoints = Math.floor(main_options.restore_points / processedDays.length);

        // Backups from the last weekly block
        /** @type {number} */
        const extraPoints = main_options.restore_points % processedDays.length;
        
        /** @type {number} */
        let dayIndex = 0;
        // We create a new object and return it, because svelte will not react if we directly edit the weekdays object.
        return weekdays.map((weekday, _) => {
            if (!weekday.exec) return weekday;

            dayIndex++;

            /** @type {Array<BACKUP>} */
            let pointsBuf = [];

            for (let pointIndex = 0; pointIndex < basePoints + (dayIndex <= extraPoints ? 1 : 0); pointIndex++) {
                /** @type {BACKUP} */
                const point = {
                    full: false,
                    weekly: false,
                    monthly: false,
                    yearly: false,
                    size: 0
                };

                // Initial Backup is always full
                if (pointIndex===0 && dayIndex===1) {
                    point.full = true
                } else {
                    // Set Backup to full if the weekday is full
                    point.full = weekday.full;
                }

                // Set Backup size
                point.size = point.full 
                    ? main_options.full_size : main_options.increment_size;
                
                pointsBuf.push(point);
            }
            return {
                day: weekday.day,
                points: pointsBuf,
                exec: weekday.exec,
                full: weekday.full,
            };
        });
    }

    /** ProcessGFS will mark all the GFS points
     * 
     * This function uses the weeks as orientation (vertical)
     * @param {WEEKDAY[]} weekdays
     * @param {MAIN_OPTIONS} main_options
     * @param {GFS} gfs
     * @returns {WEEKDAY[]}
     */
    const processGFS = (weekdays, main_options, gfs) => {
        if (gfs.weekly===0 && gfs.monthly===0 && gfs.yearly===0) {
            return weekdays;
        }

        /** @type {Array<WEEKDAY>} Pointer cache for processed days */
        const processedDays = weekdays.filter((weekday) => weekday.exec);

        const WeeksPerMonth = 4;
        const WeeksPerYear = 52;

        /** @type {Array<BACKUP[]>} */
        let weeks = [];

        // Convert structure from day-based to week-based
        let weekIndex = 0;
        for (let i = 0; i < main_options.restore_points;) {
            const week = [];
            for (let j = 0; j < processedDays.length && i < main_options.restore_points; j++) {
                week.push(processedDays[j].points[weekIndex]);
                i++;
            }
            weeks.push(week);
            weekIndex++;
        }

        // Process weekly backups
        /** @type {number} Holds the day when the GFS Retention is done */
        let gfsDayIndex = 0;
        // Loop every week
        for (let i = 0; i < gfs.weekly; i++) {
            // Backup does not exist
            if (!processedDays[gfsDayIndex].points[i]) {
                if (!processedDays[gfsDayIndex].full) continue;
                processedDays[gfsDayIndex].points[i] = {
                    full: true,
                    weekly: true,
                    monthly: false,
                    yearly: false,
                    size: main_options.full_size,
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
        for (let i = 0; i < gfs.monthly; i++) {
            const weekIndex = i*WeeksPerMonth;

            // Backup does not exist
            if (!processedDays[gfsDayIndex].points[weekIndex]) {
                if (!processedDays[gfsDayIndex].full) continue;
                processedDays[gfsDayIndex].points[weekIndex] = {
                    full: true,
                    weekly: false,
                    monthly: true,
                    yearly: false,
                    size: main_options.full_size,
                }
                continue;
            }
            // Backup does already exist

            // If the gfs day is valid (happens if weekly backups are enabled) directly set the monthly
            if (processedDays[gfsDayIndex].full) {
                weeks[weekIndex][gfsDayIndex].monthly = true;
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
        for (let i = 0; i < gfs.yearly; i++) {
            const weekIndex = i*WeeksPerYear;

            // Backup does not exist
            if (!processedDays[gfsDayIndex].points[weekIndex]) {
                if (!processedDays[gfsDayIndex].full) continue;
                processedDays[gfsDayIndex].points[weekIndex] = {
                    full: true,
                    weekly: false,
                    monthly: false,
                    yearly: true,
                    size: main_options.full_size,
                }
                continue;
            }
            // Backup does already exist

            // If the gfs day is valid (happens if weekly | monthly backups are enabled) directly set the yearly
            if (processedDays[gfsDayIndex].full) {
                weeks[weekIndex][gfsDayIndex].yearly = true;
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

        return weekdays;
    }

    // Updates the Canvas displaying the RetentionPolicy
    const updateCanvas = () => {
        // Create buffer, to avoid rerendering twice
        const weekdaysBuf = processRetentionPolicy(weekdays, main_options);
        weekdays = processGFS(weekdaysBuf, main_options, gfs);
    }

    /** Updateevent for MainOptions
     * 
     * The function must execute even with a bound value since the svelte state doesn't update on subproperty changes.
     * Although setting the key directly seems redundant due to the value binding,
     * "change" runs after "bind", causing Canvas to be one step behind.
     * @param {Event & {currentTarget: EventTarget & HTMLInputElement;}} e
     * @param {MAIN_OPTIONS} main_options
     * @param {keyof MAIN_OPTIONS} key
    */
    const updateMainOption = (e, main_options, key) => {
        if (main_options.hasOwnProperty(key)) {
            // Input validation
            const max = 
                Number.isNaN(parseFloat(e.currentTarget.max)) 
                    ? Infinity : parseFloat(e.currentTarget.max);
            
            e.currentTarget.value = 
                max < parseFloat(e.currentTarget.value) 
                    ? "" : e.currentTarget.value;
            // Input validation

            // If input is a string parseFloat will evaluate as NaN, and it is catched below.
            main_options[key] = parseFloat(e.currentTarget.value);
            
            main_options[key] = 
                Number.isNaN(main_options[key]) ? 0 : main_options[key];
    
            updateCanvas();
        }
    }

    /** Updateevent for GFS Strategie 
     * 
     * The function must execute even with a bound value since the svelte state doesn't update on subproperty changes.
     * Although setting the key directly seems redundant due to the value binding,
     * "change" runs after "bind", causing Canvas to be one step behind.
     * @param {Event & {currentTarget: EventTarget & HTMLInputElement;}} e
     * @param {GFS} gfs
     * @param {keyof GFS} key
    */
    const updateGFS = (e, gfs, key) => {
        if (gfs.hasOwnProperty(key)) {
            gfs[key] = parseFloat(e.currentTarget.value);
            gfs[key] = Number.isNaN(gfs[key]) ? 0 : gfs[key];
            updateCanvas();
        }
    }

    /** Updateevent for Full/Regular Schedule 
     * 
     * The function must execute even with a bound value since the svelte state doesn't update on subproperty changes.
     * Although setting the key directly seems redundant due to the value binding,
     * "change" runs after "bind", causing Canvas to be one step behind.
     * @param {Event & {currentTarget: EventTarget & HTMLInputElement;}} e
     * @param {WEEKDAY} weekday
     * @param {keyof WEEKDAY} key
    */
    const updateSchedule = (e, weekday, key) => {
        if (key === "exec" || key === "full") {
            weekday[key] = e.currentTarget.checked;
            updateCanvas();
        }
    }

    /** Saves the current state to the local store */ 
    const onSaveClick = () => {
        setLocStore(WEEKDAYS_LOCSTORE_KEY, weekdays);
        setLocStore(GFS_LOCSTORE_KEY, gfs);
        setLocStore(MAIN_OPTIONS_LOCSTORE_KEY, main_options);

        isSaveState=true;
        setTimeout(() => {
            isSaveState=false;
        }, 2000)
    }
</script>

<div class="bg-green-600 bg-opacity-10 rounded-xl sm:p-10 p-2 mb-10 h-[65vh] overflow-x-scroll">
    <div class="flex flex-row justify-around">
        {#each weekdays as weekday}
            {#if weekday.exec}
                <div transition:fade class="flex flex-col items-center">
                    <p class="lg:text-2xl sm:text-lg text-xs font-bold mb-2">
                        <span class="hidden sm:inline">{weekday.day}</span>
                        <span class="inline sm:hidden">{weekday.day[0]}</span>
                    </p>
                    {#each weekday.points as backup}
                    {#if backup}
                    <div class="tooltip indicator sm:my-4 my-2" data-tip="{backup.size}">
                        {#if backup.yearly}
                        <span class="indicator-item badge badge-error">yearly</span>
                        {:else if backup.monthly}
                        <span class="indicator-item badge badge-info">monthly</span>
                        {:else if backup.weekly}
                        <span class="indicator-item badge badge-primary">weekly</span>
                        {/if}
                        <div transition:fade class="btn btn-ghost {backup.full ? "bg-orange-500" : "bg-green-500"}
                            bg-opacity-25 hover:animate-pulse
                            xl:w-28 xl:h-28 md:w-24 md:h-24 h-10 w-10">
                        </div>
                    </div>
                    {:else}
                    <div transition:fade class="bg-opacity-0
                        xl:w-28 xl:h-28 md:w-24 md:h-24 h-10 w-10 sm:my-4 my-2">
                    </div>
                    {/if}
                    {/each}
                </div>
            {/if}
        {/each}
    </div>
</div>

<div class="bg-green-600 bg-opacity-10 rounded-xl flex flex-wrap w-full justify-around">
    <div class="option-container flex flex-col">
        <h1 class="underline font-bold">Main Options</h1>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 500 points">Restore Points</p>
            <input type="number" placeholder="Points" min="0" max="500"
            on:change={(e) => {updateMainOption(e, main_options, "restore_points")}}
            class="input opacity-70 w-36" bind:value={main_options.restore_points} />
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 10'000 GB">Full Backup Size</p>
            <input type="number" placeholder="Size" min="0" max="10000"
            on:change={(e) => {updateMainOption(e, main_options, "full_size")}}
            class="input opacity-70 w-36" bind:value={main_options.full_size} />
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 1'000 GB">Incremental Backup Size</p>
            <input type="number" placeholder="Size" min="0" max="1000"
            on:change={(e) => {updateMainOption(e, main_options, "increment_size")}}
            class="input opacity-70 w-36" bind:value={main_options.increment_size} />
        </div>
    </div>

    <div class="option-container flex flex-col">
        <h1 class="underline font-bold">GFS Strategie
            <div class="dropdown dropdown-end">
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <!-- svelte-ignore a11y-label-has-associated-control -->
                <label tabindex="0" title="GFS engine rules" class="btn btn-circle btn-ghost btn-xs text-info">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </label>
                <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
                <div tabindex="0" class="card compact dropdown-content z-[1] shadow bg-base-100 rounded-box w-64">
                    <div class="card-body">
                        <h2 class="card-title">GFS engine rules</h2> 
                        <p>If multiple full backups exist, it uses the one from <b>Sunday</b></p>
                        <p>It will use the weekly full backup from the <b>first month</b> as montly</p>
                        <p>It will use the monthly full backup from <b>January</b> as yearly</p>
                    </div>
                </div>
            </div>
        </h1>
        
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 53 points">Weekly</p>
            <input type="number" placeholder="Weekly" max="53" min="0" on:change={(e) => {updateGFS(e, gfs, "weekly")}}
            class="input opacity-70 w-24" bind:value={gfs.weekly}/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 36 points">Monthly</p>
            <input type="number" placeholder="Monthly" max="36" min="0" on:change={(e) => {updateGFS(e, gfs, "monthly")}}
            class="input opacity-70 w-24" bind:value={gfs.monthly}/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 10 points">Yearly</p>
            <input type="number" placeholder="Yearly" max="10" min="0" on:change={(e) => {updateGFS(e, gfs, "yearly")}}
            class="input opacity-70 w-24" bind:value={gfs.yearly}/>
        </div>
    </div>

    <div class="option-container">
        <h1 class="underline font-bold">Backup Schedule</h1>
        {#each weekdays as weekday}
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text mr-3">{weekday.day}</span> 
                    <input type="checkbox" bind:checked={weekday.exec}
                    on:change={(e) => {updateSchedule(e, weekday, "exec")}} class="checkbox" />
                </label>
            </div>
        {/each}
    </div>
    <div class="option-container">
        <h1 class="underline font-bold">Full Backups</h1>
        {#each weekdays as weekday}
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text mr-3">{weekday.day}</span> 
                    <input type="checkbox" bind:checked={weekday.full}
                    on:change={(e) => {updateSchedule(e, weekday, "full")}} class="checkbox" />
                </label>
            </div>
        {/each}
    </div>
</div>

<center>
    <button on:click={onSaveClick} class="btn {isSaveState ? "btn-success" : "btn-ghost"} opacity-50 my-5 w-1/2 transition-all">
        {isSaveState ? "Saved!" : "Save State"}</button>
</center>

<style>
    .option-container {
        @apply bg-green-300 bg-opacity-10 rounded-xl p-6 m-3 max-w-sm w-full;
    }

    b {
        @apply text-green-700;
    }
</style>
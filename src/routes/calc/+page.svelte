<script>
    /**
     * @typedef {('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')} DAY
    */

    import { loadIfExisting, setLocStore } from "$lib/localstore.helper";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";

    const WEEKDAYS_LOCSTORE_KEY = "conf_weekdays";
    const GFS_LOCSTORE_KEY = "conf_gfs";
    const MAIN_OPTIONS_LOCSTORE_KEY = "conf_main_options";

    /**
     * @typedef {Object} WEEKDAY
     * @property {DAY} day
     * @property {number} points
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
        { day: 'Monday', points: 0, exec: false, full: false },
        { day: 'Tuesday', points: 0, exec: false, full: false },
        { day: 'Wednesday', points: 0, exec: false, full: false },
        { day: 'Thursday', points: 0, exec: false, full: false },
        { day: 'Friday', points: 0, exec: false, full: false },
        { day: 'Saturday', points: 0, exec: false, full: false },
        { day: 'Sunday', points: 0, exec: false, full: false }
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

    onMount(() => {
        // Try to load config from localstore
        weekdays = loadIfExisting(WEEKDAYS_LOCSTORE_KEY, weekdays);
        gfs = loadIfExisting(GFS_LOCSTORE_KEY, gfs);
        main_options = loadIfExisting(MAIN_OPTIONS_LOCSTORE_KEY, main_options);
    });

    /**  
     * @param {WEEKDAY[]} weekdays
     * @param {MAIN_OPTIONS} main_options
     * @param {GFS} gfs
     * @returns {WEEKDAY[]}
    */
    const processRetentionPolicy = (weekdays, main_options, gfs) => {

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
        let index = 0;
        // We create a new object and return it, because svelte will not react if we directly edit the weekdays object.
        return weekdays.map((weekday, _) => {
            if (!weekday.exec) return weekday;

            index++;
            return {
                day: weekday.day,
                points: basePoints + (index <= extraPoints ? 1 : 0),
                exec: weekday.exec,
                full: weekday.full,
            };
        });
    }

    // Updates the Canvas displaying the RetentionPolicy
    const updateCanvas = () => {
        weekdays = processRetentionPolicy(weekdays, main_options, gfs);
    }

    /** Updateevent for MainOptions 
     * @param {Event & {currentTarget: EventTarget & HTMLInputElement;}} e
     * @param {MAIN_OPTIONS} main_options
     * @param {keyof MAIN_OPTIONS} key
    */
    const updateMainOption = (e, main_options, key) => {
        if (main_options.hasOwnProperty(key)) {
            main_options[key] = parseFloat(e.currentTarget.value);
            main_options[key] = Number.isNaN(main_options[key]) ? 0 : main_options[key];
            updateCanvas();
        }
    }

    /** Updateevent for GFS Strategie 
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

    let saveState = false;

    /** Saves the current state to the local store */ 
    const onSaveClick = () => {
        setLocStore(WEEKDAYS_LOCSTORE_KEY, weekdays);
        setLocStore(GFS_LOCSTORE_KEY, gfs);
        setLocStore(MAIN_OPTIONS_LOCSTORE_KEY, main_options);

        saveState=true;
        setTimeout(() => {
            saveState=false;
        }, 2000)
    }
</script>

<div class="bg-green-600 bg-opacity-10 rounded-xl sm:p-10 p-2 mb-10 h-[50vh]">
    <div class="flex flex-row justify-around">
        {#each weekdays as weekday}
            {#if weekday.exec}
                <div transition:fade class="flex flex-col overflow-y-scroll">
                    <p class="lg:text-2xl sm:text-lg text-xs font-bold">{weekday.day}</p>
                    {#each Array(weekday.points) as _, i}
                        <div class="btn btn-ghost">Hal</div>
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
            <p class="pr-4">Restore Points</p>
            <input type="number" placeholder="Points" min="0" on:change={(e) => {updateMainOption(e, main_options, "restore_points")}}
            class="input opacity-70 w-36"/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4">Full Backup Size</p>
            <input type="number" placeholder="Size" min="0" on:change={(e) => {updateMainOption(e, main_options, "full_size")}}
            class="input opacity-70 w-36"/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4">Incremental Backup Size</p>
            <input type="number" placeholder="Size" min="0" on:change={(e) => {updateMainOption(e, main_options, "increment_size")}}
            class="input opacity-70 w-36"/>
        </div>
    </div>

    <div class="option-container flex flex-col">
        <h1 class="underline font-bold">GFS Strategie</h1>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4">Weekly</p>
            <input type="number" placeholder="Weekly" max="55" min="0" on:change={(e) => {updateGFS(e, gfs, "weekly")}}
            class="input opacity-70 w-24"/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4">Monthly</p>
            <input type="number" placeholder="Monthly" max="12" min="0" on:change={(e) => {updateGFS(e, gfs, "monthly")}}
            class="input opacity-70 w-24"/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4">Yearly</p>
            <input type="number" placeholder="Yearly" max="20" min="0" on:change={(e) => {updateGFS(e, gfs, "yearly")}}
            class="input opacity-70 w-24"/>
        </div>
    </div>

    <div class="option-container">
        <h1 class="underline font-bold">Backup Schedule</h1>
        {#each weekdays as weekday}
            <div class="form-control">
                <label class="label cursor-pointer">
                    <span class="label-text mr-3">{weekday.day}</span> 
                    <input type="checkbox" on:change={(e) => {updateSchedule(e, weekday, "exec")}} class="checkbox" />
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
                    <input type="checkbox" on:change={(e) => {updateSchedule(e, weekday, "full")}} class="checkbox" />
                </label>
            </div>
        {/each}
    </div>
</div>

<center>
    <button on:click={onSaveClick} class="btn {saveState ? "btn-success" : "btn-ghost"} opacity-50 my-5 w-1/2 transition-all">
        {saveState ? "Saved!" : "Save State"}</button>
</center>

<style>
    .option-container {
        @apply bg-green-300 bg-opacity-10 rounded-xl p-6 m-3 max-w-sm w-full;
    }
</style>
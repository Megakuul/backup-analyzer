<script>
    /**
     * @typedef {('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')} DAY
    */

    import { fade } from "svelte/transition";

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
    ]

    /** @type {GFS} */
    const gfs = {
        weekly: 0,
        monthly: 0,
        yearly: 0
    }

    /** @type {MAIN_OPTIONS} */
    const main_options = {
        restore_points: 0,
        full_size: 0,
        increment_size: 0
    }

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
        console.log("Reacted");
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
</script>

<div class="bg-green-600 bg-opacity-10 rounded-xl p-10 mb-10 min-h-[40vh]">
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

<style>
    .option-container {
        @apply bg-green-300 bg-opacity-10 rounded-xl p-6 m-3 max-w-sm w-full;
    }
</style>
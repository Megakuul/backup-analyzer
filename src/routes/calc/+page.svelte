<script>
    import { page } from "$app/stores";

    import { loadConfig, resetLocStore, setLocStore } from "$lib/ConfigLoader";
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import LinkGenerator from "./LinkGenerator.svelte";
    import { processRetentionPolicy } from "$lib/RetentionProcessor";
    import { processGFS } from "$lib/GFSProcessor";
    import { calculateStorage } from "$lib/StorageCalculator";
    import { CONFIG_LOCSTORE_KEY } from "$lib/constants";
    import { generateAndDownloadPDF } from "$lib/PDFGenerator";

    /** @type {CONFIG} */
    let config = {
        weekdays: [
            { day: 'Monday', points: [], exec: false, full: false },
            { day: 'Tuesday', points: [], exec: false, full: false },
            { day: 'Wednesday', points: [], exec: false, full: false },
            { day: 'Thursday', points: [], exec: false, full: false },
            { day: 'Friday', points: [], exec: false, full: false },
            { day: 'Saturday', points: [], exec: false, full: false },
            { day: 'Sunday', points: [], exec: false, full: false }
        ],
        main_options: {
            restore_points: 0,
            full_size: 0,
            increment_size: 0
        },
        gfs: {
            weekly: 0,
            monthly: 0,
            yearly: 0
        }
    }

    /** @type {STORAGE_ESTIMATE} */
    let storage_estimate = {
        current_max: 0,
        projected_max: 0,
        projection_years: 1,
        data_growth: 40
    }

    /** Is SaveState clicked @type {boolean} */
    let isSaveState = false;
    
    /** uploadInput binding @type {HTMLElement} */
    let uploadInput;

    /** linkDialog binding @type {HTMLDialogElement} */
    let linkDialog;

    /** State of Compact View @type {boolean} */
    let compactViewChecked = false;

    onMount(async () => {
        const linkid = $page.url.searchParams.get("id");
        const err = await loadConfig(linkid, config);
        if (err!=null) {
            alert(err);
        }
        
        updateCanvas();
    }); 

    // Updates the Canvas displaying the RetentionPolicy
    const updateCanvas = () => {
        // Create buffer, to avoid rerendering twice
        const conf_buffer = processRetentionPolicy(config);
        config = processGFS(conf_buffer);
        storage_estimate = calculateStorage(config, storage_estimate);
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

    /** Updateevent for GFS Strategy 
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
        setLocStore(CONFIG_LOCSTORE_KEY, config);

        isSaveState=true;
        setTimeout(() => {
            isSaveState=false;
        }, 2000)
    }

    /** Resets the state and clears the cache */
    const onResetClick = () => {
        resetLocStore();
        window.location.reload();
    }
    
    /** Handles fileuploads
     * @param {Event & {currentTarget: EventTarget & HTMLInputElement;}} e
     */
    const onUploadInput = (e) => {
        let conf = e.currentTarget.files;
        if (conf) {
            let reader = new FileReader();
            reader.readAsText(conf[0]);
            reader.onload = (re) => {
                try {
                    // @ts-ignore
                    const jsonData = JSON.parse(re.target.result);
                    if (!jsonData.main_options || !jsonData.gfs || !jsonData.weekdays) {
                        throw Error("Invalid configuration")
                    }
                    config = jsonData;
                    updateCanvas();
                } catch (error) {
                    alert(error);
                }
            }
        } else {
            alert("No file selected!");
        }
    }

    const onDownloadClick = () => {
        const exportStr = JSON.stringify(config);

        const blob = new Blob([exportStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const e = document.createElement("a");
        e.href = url;
        e.download = "backupcalculation.json";
        document.body.appendChild(e);
        e.click();
        document.body.removeChild(e);
    }
</script>

<div class="bg-green-600 bg-opacity-10 rounded-xl sm:p-10 p-2 mb-4 h-[65vh] overflow-x-scroll">
    <div class="flex flex-row justify-around">
        {#each config.weekdays as weekday}
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
                        <span transition:fade class="indicator-item badge badge-error">yearly</span>
                        {:else if backup.monthly}
                        <span transition:fade class="indicator-item badge badge-info">monthly</span>
                        {:else if backup.weekly}
                        <span transition:fade class="indicator-item badge badge-primary">weekly</span>
                        {/if}
                        <div transition:fade class="btn btn-ghost {backup.full ? "bg-orange-500" : "bg-green-500"}
                            bg-opacity-25 hover:animate-pulse
                            xl:w-28 xl:h-28 md:w-24 md:h-24 h-10 w-10">
                        </div>
                    </div>
                    {:else if !compactViewChecked}
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

<div class="bg-green-600 bg-opacity-10 rounded-xl flex flex-wrap w-full justify-around mb-4">
    <div class="rounded-md p-2 m-2 select-none font-bold">
        <p>data growth per year</p>
        <div class="tooltip tooltip-bottom" data-tip="{storage_estimate.data_growth}%">
            <input type="range" min="0" max="100" class="range range-primary mt-1 opacity-60" 
            on:input={(e) => {
                storage_estimate.data_growth = parseFloat(e.currentTarget.value);
                storage_estimate = calculateStorage(config, storage_estimate)
            }}
            bind:value={storage_estimate.data_growth} />
        </div>
    </div>
    <div class="rounded-md p-2 m-2 select-none font-bold">
        <p>years to calculate</p>
        <input type="number" placeholder="years" min="0" max="10" class="input mt-1 h-7 opacity-70"
        on:change={() => {storage_estimate = calculateStorage(config, storage_estimate)}} 
        bind:value={storage_estimate.projection_years} />
    </div>
    <div class="rounded-md p-2 m-2 select-none font-bold">
        <p>max storage (in GB):</p>
        <p class="select-text bg-green-400 bg-opacity-10 rounded-md p-1 mt-1
        text-center hover:bg-opacity-20 transition-all overflow-hidden cursor-text">{storage_estimate.current_max}</p>
    </div>
    <div class="rounded-md p-2 m-2 select-none font-bold">
        <p>max storage in {storage_estimate.projection_years} years:</p>
        <p class="select-text bg-green-400 bg-opacity-10 rounded-md p-1 mt-1
        text-center hover:bg-opacity-20 transition-all overflow-hidden cursor-text">{storage_estimate.projected_max}</p>
    </div>
</div>

<div class="bg-green-600 bg-opacity-10 rounded-xl flex flex-wrap w-full justify-around">
    <div class="option-container flex flex-col">
        <h1 class="underline font-bold">Main Options</h1>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 500 points">Restore Points</p>
            <input type="number" placeholder="Points" min="0" max="500"
            on:change={(e) => {updateMainOption(e, config.main_options, "restore_points")}}
            class="input opacity-70 w-36" bind:value={config.main_options.restore_points} />
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 10'000 GB">Full Backup Size</p>
            <input type="number" placeholder="Size" min="0" max="10000"
            on:change={(e) => {updateMainOption(e, config.main_options, "full_size")}}
            class="input opacity-70 w-36" bind:value={config.main_options.full_size} />
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 1'000 GB">Incremental Backup Size</p>
            <input type="number" placeholder="Size" min="0" max="1000"
            on:change={(e) => {updateMainOption(e, config.main_options, "increment_size")}}
            class="input opacity-70 w-36" bind:value={config.main_options.increment_size} />
        </div>
    </div>

    <div class="option-container flex flex-col">
        <h1 class="underline font-bold">GFS Strategy
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
            <input type="number" placeholder="Weekly" max="53" min="0" on:change={(e) => {updateGFS(e, config.gfs, "weekly")}}
            class="input opacity-70 w-24" bind:value={config.gfs.weekly}/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 36 points">Monthly</p>
            <input type="number" placeholder="Monthly" max="36" min="0" on:change={(e) => {updateGFS(e, config.gfs, "monthly")}}
            class="input opacity-70 w-24" bind:value={config.gfs.monthly}/>
        </div>
        <div class="flex flex-row mt-4 justify-between items-center">
            <p class="pr-4" title="max 10 points">Yearly</p>
            <input type="number" placeholder="Yearly" max="10" min="0" on:change={(e) => {updateGFS(e, config.gfs, "yearly")}}
            class="input opacity-70 w-24" bind:value={config.gfs.yearly}/>
        </div>
        <div class="flex flex-row mt-6 justify-between items-center">
            <p class="pr-4">Compact View</p>
            <input type="checkbox" class="toggle toggle-primary opacity-50" 
            on:change={() => {window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })}} bind:checked={compactViewChecked} />
        </div>
    </div>

    <div class="option-container">
        <h1 class="underline font-bold">Backup Schedule</h1>
        {#each config.weekdays as weekday}
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
        {#each config.weekdays as weekday}
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


<div class="flex flex-wrap justify-around my-5">
    <button on:click={onSaveClick} 
    class="btn {isSaveState ? "btn-success" : "btn-ghost"} opacity-50 transition-all min-w-[25%] max-w-full">
        {isSaveState ? "Saved!" : "Save State"}</button>
    <button on:click={onResetClick} class="btn btn-ghost opacity-50 min-w-[25%] max-w-full">Reset State</button>
    <button on:click={onDownloadClick} class="btn btn-ghost opacity-50 min-w-[25%] max-w-full">Download State</button>
    <button on:click={() => {uploadInput.click()}} class="btn btn-ghost opacity-50 min-w-[25%] max-w-full">Upload State</button>
    <input style="display:none" type="file" accept=".json" on:change={(e)=>onUploadInput(e)} bind:this={uploadInput} >

    <button on:click={() => {linkDialog.showModal()}} class="btn btn-ghost opacity-50 min-w-[25%] max-w-full">Generate Link</button>
    <button on:click={() => {generateAndDownloadPDF(config, storage_estimate)}} class="btn btn-ghost opacity-50 min-w-[25%] max-w-full">Download PDF</button>
</div>

<LinkGenerator bind:dialog={linkDialog} bind:config={config} />

<style>
    .option-container {
        @apply bg-green-300 bg-opacity-10 rounded-xl p-6 m-3 max-w-sm w-full;
    }

    b {
        @apply text-green-700;
    }
</style>
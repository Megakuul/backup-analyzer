<script>
    import { fade } from "svelte/transition";

    /** @type {boolean} */
    let cloudRC = false;
    /** @type {boolean} */
    let localRC = false;
    /** @type {boolean} */
    let cloudLTA = false;
    /** @type {boolean} */
    let cloudDR = false;
    /** @type {boolean} */
    let localDR = false;

    /** @type {boolean} */
    let threeCopies = false;
    /** @type {boolean} */
    let twoMedia = false;
    /** @type {boolean} */
    let oneOffsite = false;
    /** @type {boolean} */
    let oneImmutable = false;
    /** @type {boolean} */
    let vendorLock = false;

    /** @type {boolean} */
    let hideVendorLockWarning = false;

    /** @type {number} */
    let cloudCount = 0;
    /** @type {number} */
    let localCount = 0;

    $: {
        // The processing here is done really unoptimized and "dumb", but this makes it really clear and transparent.
        cloudCount = 0;
        localCount = 0;

        if (cloudRC) cloudCount++;
        if (cloudLTA) cloudCount++;
        if (cloudDR) cloudCount++;
        if (localRC) localCount++;
        if (localDR) localCount++;

        if (cloudRC || localRC || cloudLTA || cloudDR || localDR)
            threeCopies = true;
        else 
            threeCopies = false;

        if (localCount===0 && cloudCount>1) {
            twoMedia = true;
            vendorLock = true;
        } else if (localCount+cloudCount>1 && cloudCount>0) {
            twoMedia = true;
            vendorLock = false;
        } else {
            twoMedia = false;
            vendorLock = false;
        }

        if (cloudDR || cloudRC || cloudLTA || localDR)
            oneOffsite = true;
        else 
            oneOffsite = false;

        if (cloudDR || cloudLTA || localDR) 
            oneImmutable = true;
        else
            oneImmutable = false;
    }
</script>

<div class="flex flex-wrap items-center justify-around mx-5 my-6">
<!-- Title description -->
<pre class="lg:text-lg sm:text-sm text-xs p-4 bg-green-400 bg-opacity-5 rounded-lg mr-auto mb-3">
Today, backups need to satisfy plenty of requirements to ensure the possibility to recover data in various situations.
To make sure your backup infrastructure covers the most important backup requirements, I suggest using the <b>3-2-1-1</b> strategy.

The <b>3-2-1-1</b> strategy states the following:

  - <b>Three independent full data backups.</b>
  - <b>Two backup-media devices that contain at least one current full data backup.</b>
  - <b>One current full data backup stored at a separate location from the main infrastructure.</b>
  - <b>One current full data backup, that is either stored offline or is immutable.</b>

To help with this situation, you can see five Backup strategies that can be combined in various ways to accomplish the <b>3-2-1-1</b> requirements.
All backup strategies follow a strict standard and have a specific function, do not abuse them for purposes that aren't mentioned below.
</pre>
<!-- Title description -->
    <ul class="steps steps-vertical lg:mr-4">
        <li data-content="3" class="step transition-all" class:step-primary={threeCopies}>
            Three different copies of data
        </li>
        <li data-content="2" class="step transition-all" class:step-primary={twoMedia}>
            Two different media
        </li>
        <li data-content="1" class="step transition-all" class:step-primary={oneOffsite}>
            One offsite copy
        </li>
        <li data-content="1" class="step transition-all" class:step-primary={oneImmutable}>
            One offline/immutable copy
        </li>
    </ul>
</div>

{#if vendorLock && !hideVendorLockWarning}
<div transition:fade class="alert alert-warning z-50 w-10/12 grid place-self-center fixed bottom-5 text-xs sm:text-sm">
    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    <span>Warning: You only use cloud backups, if you do use the same cloudprovider for all backups, 
        remember that you are vendor locked, if something happens to the cloudprovider you lose all backups</span>
    <button class="btn btn-ghost btn-sm" on:click={() => {vendorLock = false; hideVendorLockWarning = true;}}>X</button>
</div>
{/if}

<div class="flex flex-wrap w-full justify-around">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div tabindex="0" class="strategie-box w-full lg:w-[45rem] 
    {cloudRC ? "border-green-700" : "border-transparent"}">
        <label class="label cursor-pointer">
            <span class="title">Cloud RC Backup</span> 
            <input type="checkbox" bind:checked={cloudRC} class="checkbox checkbox-primary" />
        </label>
        <div tabindex="0" class="collapse">
            <input type="checkbox" /> 
            <div class="collapse-title text-xl font-medium">
                <p>Cloudbased Revision Control Backup</p>
            </div>
            <div class="collapse-content"> 
                <p>Revision Control Backup is a backup strategy aiming to restore smaller data sets quickly and accurately.</p>
                <p>Regular backups capture data changes, allowing precise restoration to specific past versions of the data.</p>
                <br>

                <h3>What it is</h3>
                <p>Flexible short-term backup that retains the most recent backups for specific days.</p>
                <p>Disaster recovery backup, since it's stored in a location different from the main infrastructure,
                    can indeed serve as a disaster recovery solution.</p>
                <br>

                <h3>What it is not</h3>
                <p>Revision control system for end users. It is not designed to address or mitigate user mistakes,
                    but system or software failures!</p>
                <br>

                <h3>Target</h3>
                <p>The cloudbased RC strategy uses <b>S3 Buckets</b> as backup target.</p>
                <p>Backups are not set to immutable due to the need for flexibility.</p>
                <p>This approach allows for the creation of manual backups
                    in situations where backups need to be added or removed manually (e.g. before a major update).</p>
                <br>

                <h3>Retention</h3>
                <p>The retention policy used in the cloudbased RC strategy is the <b>GFS (Grandfather-Father-Son)</b> policy.</p>
                <p>As configuration, enable GFS and define a day to create <b>synthetic full backups</b>.</p>
                <p>The policy should at least keep <b>14 daily incrementals</b>, <b>4 weekly backups</b> and <b>2 monthly backups</b>.</p>
                <p>Depending on your needs, daily, weekly or monthly restore-points can be increased, I do not recommend to create yearly backups with this strategy</p>
            </div>
        </div>
    </div>

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="strategie-box w-full lg:w-[45rem]  
    {localRC ? "border-green-700" : "border-transparent"}">
        <label class="label cursor-pointer">
            <span class="title">Local RC Backup</span> 
            <input type="checkbox" bind:checked={localRC} class="checkbox checkbox-primary" />
        </label>
        <div tabindex="0" class="collapse">
            <input type="checkbox" /> 
            <div class="collapse-title text-xl font-medium">
                <p>Local Revision Control Backup</p>
            </div>
            <div class="collapse-content"> 
                <p>Revision Control Backup is a backup strategy aiming to restore smaller data sets quickly and accurately.</p>
                <p>Regular backups capture data changes, allowing precise restoration to specific past versions of the data.</p>
                <p>Since this backup targets a NAS device, it's typically more affordable than cloud solutions.</p>
                <br>

                <h3>What it is</h3>
                <p>Flexible short-term backup that retains the most recent backups for specific days.</p>
                <br>

                <h3>What it is not</h3>
                <p>Revision control system for end users. It is not designed to address or mitigate user mistakes,
                    but system or software failures!</p>
                <p>Disaster recovery backup, although this backup is located in the same location as the rest of the infrastructure,
                    it shouldn't be considered a true disaster recovery solution.</p>
                <br>

                <h3>Target</h3>
                <p>The local RC strategy uses a <b>NAS device</b> as backup target.</p>
                <p>Usually the target is connected to the backup-instance via SMB-Share.</p>

                <h3>Retention</h3>
                <p>The retention policy used in the local RC strategy is the <b>GFS (Grandfather-Father-Son)</b> policy.</p>
                <p>As configuration, enable GFS and define a day to create <b>synthetic full backups</b>.</p>
                <p>The policy should at least keep <b>14 daily incrementals</b>, <b>4 weekly backups</b> and <b>2 monthly backups</b>.</p>
                <p>Depending on your needs, daily, weekly or monthly restore-points can be increased, I do not recommend to create yearly backups with this strategy</p>
            </div>
        </div>
    </div>

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="strategie-box w-full lg:w-[45rem]  
    {cloudLTA ? "border-green-700" : "border-transparent"}">
        <label class="label cursor-pointer">
            <span class="title">Cloud LTA Backup</span> 
            <input type="checkbox" bind:checked={cloudLTA} class="checkbox checkbox-primary" />
        </label>
        <div tabindex="0" class="collapse">
            <input type="checkbox" /> 
            <div class="collapse-title text-xl font-medium">
                <p>Cloudbased Long Term Archive Backup</p>
            </div>
            <div class="collapse-content"> 
                <p>The Long Term Archive backup strategy is designed to retain immutable backups over extended durations.</p>
                <p>Both the LTA and RC strategies capture data changes. 
                    However, the LTA emphasizes long-term storage and creates immutable backups,
                    making it less flexible than the RC backups.</p>
                <br>

                <h3>What it is</h3>
                <p>Long-term archive backup, designed to store backups over an extended time periods.</p>
                <br>

                <h3>What it is not</h3>
                <p>Flexible backup that can be used to manually add and remove restore points.</p>
                <p>Archive storage, used by end users to retain documents, such as legal papers,
                    that require preservation for specific time periods.</p>
                <br>

                <h3>Target</h3>
                <p>The cloudbased LTA strategy uses <b>S3 Buckets</b> as backup target.</p>
                <p>Backups are set to immutable to ensure their integrity over time.</p>
                <br>

                <h3>Retention</h3>
                <p>The retention policy used in the cloudbased LTA strategy is the <b>GFS (Grandfather-Father-Son)</b> policy.</p>
                <p>As configuration, enable GFS and define a day to create <b>synthetic full backups</b>.</p>
                <p>The policy should at least keep <b>14 daily incrementals</b>, <b>2 weekly backups</b> and 5 yearly backups.</p>
                <p>Depending on your needs, daily, weekly, monthly or (especially) yearly restore-points can be increased.</p>
                <!-- TODO: Describe how to enable immutable backups-->
            </div>
        </div>
    </div>

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="strategie-box w-full lg:w-[45rem] 
    {cloudDR ? "border-green-700" : "border-transparent"}">
        <label class="label cursor-pointer">
            <span class="title">Cloud DR Backup</span> 
            <input type="checkbox" bind:checked={cloudDR} class="checkbox checkbox-primary" />
        </label>
        <div tabindex="0" class="collapse">
            <input type="checkbox" /> 
            <div class="collapse-title text-xl font-medium">
                <p>Cloudbased Disaster Recovery Backup</p>
            </div>
            <div class="collapse-content"> 
                <p>The Disaster Recovery backup strategy aims to swiftly restore a recent and consistent backup.</p>
                <p>This DR approach stores backups for a short period of time,
                    with the main purpose being to ensure infrastructure recovery during emergencies.</p>
                <br>

                <h3>What it is</h3>
                <p>Consistent backup that provides the fastest possible recovery in the event of a disaster.</p>
                <p>Immutable backup that cannot be encrypted during a ransomware attack.</p>
                <br>

                <h3>What it is not</h3>
                <p>Anything else!</p>
                <br>

                <h3>Target</h3>
                <p>The cloudbased DR strategy uses <b>S3 Buckets</b> as backup target.</p>
                <p>Backups are made immutable to safeguard against encryption during a ransomware attack.</p>

                <h3>Retention</h3>
                <p>The retention policy used in the cloudbased DR strategy is the <b>GFS (Grandfather-Father-Son)</b> policy.</p>
                <p>As configuration, enable GFS and define <b>two</b> days to create <b>synthetic full backups</b>
                    (e.g. tuesday and friday).</p>
                <p>The policy should at least keep <b>14 daily incrementals</b> and <b>2 weekly backups</b>.</p>
                <p>Depending on your needs, daily or weekly restore-points can be increased, I do not recommend to create monthly or yearly backups with this strategy</p>
                <!-- TODO: Describe how to enable immutable backups-->
            </div>
        </div>
    </div>

    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div class="strategie-box w-full lg:w-[45rem]  
    {localDR ? "border-green-700" : "border-transparent"}">
        <label class="label cursor-pointer">
            <span class="title">Local DR Backup</span> 
            <input type="checkbox" bind:checked={localDR} class="checkbox checkbox-primary" />
        </label>
        <div tabindex="0" class="collapse">
            <input type="checkbox" /> 
            <div class="collapse-title text-xl font-medium">
                <p>Local Disaster Recovery Backup</p>
            </div>
            <div class="collapse-content"> 
                <p>The Disaster Recovery backup strategy aims to swiftly restore a recent and consistent backup.</p>
                <p>This DR approach stores backups for a short period of time,
                    with the main purpose being to ensure infrastructure recovery during emergencies.</p>
                <p>In the local DR strategy, the concept involves rotating between at least two NAS devices weekly.
                    The unused NAS device is typically stored offsite and kept offline.</p>
                <br>

                <h3>What it is</h3>
                <p>Consistent backup that provides the fastest possible recovery in the event of a disaster.</p>
                <p>Offline backup that cannot be encrypted during a ransomware attack.</p>
                <br>

                <h3>What it is not</h3>
                <p>Anything else!</p>
                <br>

                <h3>Target</h3>
                <p>The local RC strategy uses at least two <b>NAS devices</b> as backup target.</p>
                <p>NAS devices need to be rotated once a week. The inactive device must be kept offline in an offsite location.</p>
                <p>Usually the target is connected to the backup-instance via SMB-Share.</p>
                <br>

                <h3>Retention</h3>
                <p>The retention policy used in the local DR strategy is the <b>forward incremental</b> policy.</p>
                <p>As configuration, define <b>two</b> days to create <b>synthetic full backups</b>
                    (e.g. tuesday and friday).</p>
                <p>The policy should at least keep <b>7 restore points</b>.</p>
                <p>For this retention make sure you use <b>restore points</b> instead of <b>days</b>.</p>
            </div>
        </div>
    </div>

</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Ubuntu+Mono&family=Ubuntu:wght@400&display=swap');

    pre {
        white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
        white-space: -pre-wrap;      /* Opera 4-6 */
        white-space: -o-pre-wrap;    /* Opera 7 */
        word-wrap: break-word;       /* Internet Explorer 5.5+ */
        font-family: Ubuntu;
        @apply font-normal whitespace-pre-wrap;
    }

    p {
        @apply my-1;
    }

    h3 {
        @apply font-semibold;
    }

    .strategie-box {
        @apply bg-green-400 bg-opacity-10 rounded-xl my-4 p-6 border-2 transition-all shadow-xl;
    }

    .strategie-box .title {
        @apply font-extrabold uppercase;
    }
</style>
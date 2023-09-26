<script>
    import { page } from '$app/stores';

    /** @type {HTMLDialogElement}*/
    export let dialog;

    /** @type {CONFIG}*/
    export let config;

    /** @type {string} */
    let link = "";

    const closeModal = () => {
      dialog.close();
    }

    const createLink = async () => {
        const res = await fetch("/api/calc", {
            method: "POST",
            body: JSON.stringify(config),
            headers: {
                "Content-Type": "application/json"
            }
        });

        const resData = await res.json();
        if (!resData) 
            alert("Failed to receive data from server!");
        else if (!resData.success)
            alert(`Failed to create link: ${resData?.err}`);
        else {
            link = `${$page.url.host}${$page.url.pathname}?id=${resData.link}`;
        }
    }
</script>

<dialog bind:this={dialog}  class="modal">
<div class="modal-box">
  <h3 class="font-bold text-lg mb-3">Generate Link</h3>
    {#if link}
    <p class="p-2 bg-green-400 bg-opacity-10 rounded-md">{link}</p>
    <p class="p-2 my-2">Link is valid for 4 days!</p>
    {:else}
    <button class="btn btn-ghost w-full my-2" on:click={createLink}>generate</button>
    {/if}
    <div class="modal-action">
        <button class="btn" on:click={closeModal}>Close</button>
    </div>
 </div>
</dialog>
  
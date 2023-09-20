<script>
	import icon from "$lib/images/backup-analyzer.svg";
</script>

<svelte:head>
	<title>Backup Analyzer</title>
	<meta name="description" content="
	Backup analyzer is a tool to help you building a stable backupinfrastructure
	focused on the Veeam-Backup service.
	" />
</svelte:head>


<div class="flex flex-col items-center my-10 opacity-80">
	<img src="{icon}" alt="Backup Analyzer Logo" class="lg:w-auto w-1/4 my-10 animate-pulse">
	<h1 class="text-2xl sm:text-6xl my-5 py-5 font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-900 to-green-500 transition-all">Backup Analyzer</h1>
	
	<div class="flex flex-wrap justify-around items-center w-3/4 opacity-70">
		<a href="/calc" class="btn btn-primary text-sm lg:text-xl w-64 lg:w-96 my-5">
			Backup Calculator</a>
		<a href="/infrastructure" class="btn btn-primary text-sm lg:text-xl w-64 lg:w-96 my-5">
			Infrastructure Builder</a>
	</div>
</div>

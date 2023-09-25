# Backup-Analyzer

This is a very simple webapp, that is designed to help you define/create/manage Backup-Strategies and Backup-Retentions, primarly for the Veeam Backup Platform.

Application is hosted on Vercel, as database for the generated links Vercels-KV database is used.

**Important**:

Note that the code is not designed to scale or built using best practices. I did this in 3 days and you shouldn't take it as advice for building webapps with SvelteKit. 

It lacks a lot of code encapsulation and there is no standard for positioning Tailwind components, which really makes it difficult to read. The abstraction for the backup-calculators interface is extremly weird and unreadable, again do not take this as any good or acceptable practice, you could even say it's a crime against humanity. 
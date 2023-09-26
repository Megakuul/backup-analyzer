import jsPDF from "jspdf";
import "jspdf-autotable";
import Icon from "$lib/images/backup-analyzer.png";

const FFI = "Forever-Forward-Incremental";
const FI = "Forward-Incremental";
const GFS = "Grandfather-Father-Son (GFS)";

/** Generates and downloads a PDF report for the backup calculation
 * 
 * @param {CONFIG} config 
 * @param {STORAGE_ESTIMATE} storageEstimate 
 */
export const generateAndDownloadPDF = (config, storageEstimate) => {
    let retentionPolicy;

    if (!config.weekdays.some((weekday) => weekday.full)) {
        retentionPolicy = FFI;
    } else if (config.gfs.weekly>0||config.gfs.monthly>0||config.gfs.yearly>0) {
        retentionPolicy = GFS;
    } else {
        retentionPolicy = FI;
    }
    
    const scheduledDays = config.weekdays
        .filter(weekday => weekday.exec)
        .map(weekday => weekday.day.slice(0, 2))
        .join(', ');

    const fullDays = config.weekdays
        .filter(weekday => weekday.full)
        .map(weekday => weekday.day.slice(0, 2))
        .join(', ');

    const doc = new jsPDF()

    const tableColumns = ["Specification", "Evaluation"];
    const basicSettings = [
        ["Restore Points", config.main_options.restore_points],
        ["Retention Policy", retentionPolicy],
        ["Full Backup Size", `${config.main_options.full_size} GB`],
        ["Incremental Backup Size", `${config.main_options.increment_size} GB`],
    ];
    const advancedSettings = [
        ["Scheduled Days", scheduledDays],
        ["Scheduled Full Backup Days", fullDays],
    ]
    const calculation = [
        ["Current Backup Storage Consumption", `${storageEstimate.current_max} GB`],
        ["Estimated Annual Data Growth Rate", `${storageEstimate.data_growth} %`],
        [`Projected Backup Storage Consumption in ${storageEstimate.projection_years} Year${storageEstimate.projection_years>1 ? "s" : ""}`,
        `${storageEstimate.projected_max} GB`],
    ]

    doc
        .addImage(Icon, "png", 160, 20, 30, 50)
        .setFont("Helvetica", "bold").setFontSize(16)
        .text("Backup Calculation Report", 15, 50)
        .setFontSize(14)
        .text("Basic Configuration", 11, 95)
        .line(10, 100, 200, 100)
        .autoTable(tableColumns, basicSettings, {
            startY: 110,
            headStyles: { fillColor: [121, 172, 120] },
        })
        .text("Advanced Configuration", 11, 165)
        .line(10, 170, 200, 170)
        .autoTable(tableColumns, advancedSettings, {
            startY: 180,
            headStyles: { fillColor: [121, 172, 120] },
        })
        .text("Storage Evaluation", 11, 225)
        .line(10, 230, 200, 230)
        .autoTable(tableColumns, calculation, {
            startY: 240,
            headStyles: { fillColor: [121, 172, 120] },
        })
        
    doc.save("Backup_Strategy_Report.pdf")
}

/**
 * Code below can be used to debug and test the PDF form without always downloading it
 * 
 * ```javascript
 *   var string = doc.output('datauristring');
 *   var embed = "<embed width='100%' height='100%' src='" + string + "'/>"
 *   var x = window.open();
 *   x?.document.open();
 *   x?.document.write(embed);
 *   x?.document.close();
 * ```
 */
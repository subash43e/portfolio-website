import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const handleExportCSV = (finalDisplayEntries, dateFilter, selectedExportFile) => {
  if (finalDisplayEntries.length === 0) return alert("No data to export!");
  const headers = ["Date", "Start Time", "End Time", "File Name", "Frame Number", "Faces Completed", "Duration (Minutes)"];
  const csvRows = finalDisplayEntries.map(entry => [
    `"${entry.date}"`, `"${entry.startTimeString || "N/A"}"`, `"${entry.timestamp}"`, `"${entry.fileName}"`, `"${entry.frameNumber}"`, `"${entry.facesCompleted}"`, `"${entry.durationMinutes}"`
  ].join(","));
  
  const csvContent = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
  const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  link.setAttribute("download", `cvat_log_${safeFileName}_${dateStrForFile}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const handleExportPDF = (finalDisplayEntries, dateFilter, selectedExportFile) => {
  if (finalDisplayEntries.length === 0) return alert("No data to export!");
  const doc = new jsPDF();
  doc.text("CVAT Report", 14, 15);
  
  const tableColumn = ["Date", "Start Time", "End Time", "File Name", "Frame", "Faces", "Duration (Min)"];
  const tableRows = [];

  finalDisplayEntries.forEach(entry => {
    const rowData = [
      entry.date,
      entry.startTimeString || "N/A",
      entry.timestamp,
      entry.fileName,
      entry.frameNumber,
      entry.facesCompleted,
      entry.durationMinutes
    ];
    tableRows.push(rowData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });
  
  const dateStrForFile = dateFilter === "All Time" ? "all_time" : dateFilter.replace(/\//g, '-');
  const safeFileName = selectedExportFile === "All" ? "all_files" : selectedExportFile.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`cvat_report_${safeFileName}_${dateStrForFile}.pdf`);
};

// PDF Export utility for Umrah Group Tickets
// Provides comprehensive PDF generation and printing functionality

export interface GroupTicketPDFData {
  groupName: string;
  packageType: "with-transport" | "without-transport";
  departureDate: string;
  returnDate: string;
  ticketCount: number;
  totalCost: number;
  averageCost: number;
  agentName: string;
  agentContact?: string;
  purchaseNotes?: string;
  passengers?: Array<{
    name: string;
    passport: string;
    phone?: string;
    assignedAt: string;
  }>;
}

export interface DateGroupedPDFData {
  departureDate: string;
  returnDate: string;
  packageType: "with-transport" | "without-transport";
  groups: GroupTicketPDFData[];
  totalGroups: number;
  totalTickets: number;
  totalCost: number;
  averageCostPerTicket: number;
}

/**
 * Generate PDF content for a single group
 */
export function generateGroupPDFContent(group: GroupTicketPDFData): string {
  const packageTypeLabel =
    group.packageType === "with-transport" ? "Transport সহ" : "Transport ছাড়া";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Umrah Group Ticket - ${group.groupName}</title>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 210mm; 
          margin: 0 auto; 
          padding: 20mm;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #1e40af; 
          font-size: 28px; 
          margin-bottom: 10px;
          font-weight: bold;
        }
        .header h2 { 
          color: #374151; 
          font-size: 20px;
          margin-bottom: 5px;
        }
        .header .date { 
          color: #6b7280; 
          font-size: 14px;
        }
        
        .group-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .group-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          text-align: center;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        .info-value {
          color: #1f2937;
        }
        
        .financial-summary {
          background: #ecfdf5;
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .financial-title {
          font-size: 18px;
          font-weight: bold;
          color: #047857;
          margin-bottom: 15px;
          text-align: center;
        }
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .financial-item {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #a7f3d0;
        }
        .financial-label {
          font-size: 12px;
          color: #047857;
          margin-bottom: 5px;
        }
        .financial-value {
          font-size: 18px;
          font-weight: bold;
          color: #065f46;
        }
        
        .passengers-section {
          margin-top: 30px;
        }
        .passengers-title {
          font-size: 18px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .passengers-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        .passengers-table th,
        .passengers-table td {
          padding: 12px;
          text-align: left;
          border: 1px solid #d1d5db;
        }
        .passengers-table th {
          background: #f3f4f6;
          font-weight: bold;
          color: #374151;
        }
        .passengers-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .notes-section {
          margin-top: 30px;
          padding: 20px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
        }
        .notes-title {
          font-weight: bold;
          color: #92400e;
          margin-bottom: 10px;
        }
        .notes-content {
          color: #78350f;
          line-height: 1.5;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 15mm;
            font-size: 11px;
          }
          .header h1 { font-size: 24px; }
          .group-title { font-size: 20px; }
          .financial-title { font-size: 16px; }
          .passengers-title { font-size: 16px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🕋 BD TicketPro - Umrah Group Ticket</h1>
        <h2>${packageTypeLabel} ওমরা প্যাকেজ</h2>
        <div class="date">Generated on: ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB")}</div>
      </div>

      <div class="group-details">
        <div class="group-title">${group.groupName}</div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Package Type:</span>
            <span class="info-value">${packageTypeLabel}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Agent Name:</span>
            <span class="info-value">${group.agentName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Departure Date:</span>
            <span class="info-value">${new Date(group.departureDate).toLocaleDateString("en-GB")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Return Date:</span>
            <span class="info-value">${new Date(group.returnDate).toLocaleDateString("en-GB")}</span>
          </div>
          ${
            group.agentContact
              ? `
          <div class="info-item">
            <span class="info-label">Agent Contact:</span>
            <span class="info-value">${group.agentContact}</span>
          </div>
          `
              : ""
          }
        </div>
      </div>

      <div class="financial-summary">
        <div class="financial-title">💰 Financial Summary</div>
        <div class="financial-grid">
          <div class="financial-item">
            <div class="financial-label">Total Tickets</div>
            <div class="financial-value">${group.ticketCount}</div>
          </div>
          <div class="financial-item">
            <div class="financial-label">Total Cost</div>
            <div class="financial-value">৳${group.totalCost.toLocaleString()}</div>
          </div>
          <div class="financial-item">
            <div class="financial-label">Cost per Ticket</div>
            <div class="financial-value">৳${group.averageCost.toLocaleString()}</div>
          </div>
        </div>
      </div>

      ${
        group.passengers && group.passengers.length > 0
          ? `
      <div class="passengers-section">
        <div class="passengers-title">👥 Assigned Passengers (${group.passengers.length}/${group.ticketCount})</div>
        <table class="passengers-table">
          <thead>
            <tr>
              <th>Passenger Name</th>
              <th>Passport Number</th>
              <th>Phone</th>
              <th>Assigned Date</th>
            </tr>
          </thead>
          <tbody>
            ${group.passengers
              .map(
                (passenger) => `
            <tr>
              <td>${passenger.name}</td>
              <td>${passenger.passport}</td>
              <td>${passenger.phone || "N/A"}</td>
              <td>${new Date(passenger.assignedAt).toLocaleDateString("en-GB")}</td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        ${
          group.passengers.length < group.ticketCount
            ? `
        <div style="margin-top: 15px; padding: 10px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 6px; color: #991b1b;">
          <strong>Note:</strong> ${group.ticketCount - group.passengers.length} tickets are still unassigned.
        </div>
        `
            : ""
        }
      </div>
      `
          : `
      <div class="passengers-section">
        <div class="passengers-title">👥 Passenger Assignment</div>
        <div style="padding: 20px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; text-align: center; color: #6b7280;">
          No passengers assigned yet. ${group.ticketCount} tickets available for assignment.
        </div>
      </div>
      `
      }

      ${
        group.purchaseNotes
          ? `
      <div class="notes-section">
        <div class="notes-title">📝 Purchase Notes</div>
        <div class="notes-content">${group.purchaseNotes}</div>
      </div>
      `
          : ""
      }

      <div class="footer">
        <div>BD TicketPro - Umrah Group Ticket Management System</div>
        <div>This document was automatically generated and contains confidential information.</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Generate PDF content for date-grouped tickets
 */
export function generateDateGroupPDFContent(
  dateGroup: DateGroupedPDFData,
): string {
  const packageTypeLabel =
    dateGroup.packageType === "with-transport"
      ? "Transport সহ"
      : "Transport ছাড়া";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Umrah Groups - ${new Date(dateGroup.departureDate).toLocaleDateString()} to ${new Date(dateGroup.returnDate).toLocaleDateString()}</title>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 297mm; 
          margin: 0 auto; 
          padding: 15mm;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #1e40af; 
          font-size: 32px; 
          margin-bottom: 10px;
          font-weight: bold;
        }
        .header h2 { 
          color: #374151; 
          font-size: 24px;
          margin-bottom: 10px;
        }
        .header .date-range { 
          color: #059669; 
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .header .generated { 
          color: #6b7280; 
          font-size: 14px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        .stat-card {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 2px solid #0ea5e9;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #0c4a6e;
          margin-bottom: 5px;
        }
        .stat-label {
          font-size: 14px;
          color: #0369a1;
          font-weight: 600;
        }
        
        .groups-section {
          margin-bottom: 30px;
        }
        .groups-title {
          font-size: 24px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .groups-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .groups-table th,
        .groups-table td {
          padding: 15px 12px;
          text-align: left;
          border: 1px solid #d1d5db;
        }
        .groups-table th {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        .groups-table tr:nth-child(even) {
          background: #f8fafc;
        }
        .groups-table tr:hover {
          background: #e0f2fe;
        }
        
        .group-name {
          font-weight: bold;
          color: #1e40af;
        }
        .agent-info {
          color: #374151;
        }
        .agent-contact {
          font-size: 12px;
          color: #6b7280;
          margin-top: 2px;
        }
        .cost-highlight {
          font-weight: bold;
          color: #059669;
        }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        
        @media print {
          body { 
            margin: 0; 
            padding: 10mm;
            font-size: 10px;
          }
          .header h1 { font-size: 28px; }
          .header h2 { font-size: 20px; }
          .stat-value { font-size: 24px; }
          .groups-title { font-size: 20px; }
          .summary-stats { grid-template-columns: repeat(4, 1fr); }
        }
        
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🕋 BD TicketPro - Umrah Group Report</h1>
        <h2>${packageTypeLabel} ওমরা প্যাকেজ</h2>
        <div class="date-range">
          📅 ${new Date(dateGroup.departureDate).toLocaleDateString("en-GB")} 
          ➡️ 
          ${new Date(dateGroup.returnDate).toLocaleDateString("en-GB")}
        </div>
        <div class="generated">Generated on: ${new Date().toLocaleDateString("en-GB")} at ${new Date().toLocaleTimeString("en-GB")}</div>
      </div>

      <div class="summary-stats">
        <div class="stat-card">
          <div class="stat-value">${dateGroup.totalGroups}</div>
          <div class="stat-label">Total Groups</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${dateGroup.totalTickets}</div>
          <div class="stat-label">Total Tickets</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">৳${dateGroup.totalCost.toLocaleString()}</div>
          <div class="stat-label">Total Investment</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">৳${dateGroup.averageCostPerTicket.toLocaleString()}</div>
          <div class="stat-label">Avg. Cost per Ticket</div>
        </div>
      </div>

      <div class="groups-section">
        <div class="groups-title">📋 Group Details</div>
        <table class="groups-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Agent Details</th>
              <th>Tickets</th>
              <th>Total Cost</th>
              <th>Cost per Ticket</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${dateGroup.groups
              .map(
                (group) => `
            <tr>
              <td>
                <div class="group-name">${group.groupName}</div>
              </td>
              <td>
                <div class="agent-info">${group.agentName}</div>
                ${group.agentContact ? `<div class="agent-contact">${group.agentContact}</div>` : ""}
              </td>
              <td style="text-align: center;">
                <strong>${group.ticketCount}</strong>
              </td>
              <td>
                <span class="cost-highlight">৳${group.totalCost.toLocaleString()}</span>
              </td>
              <td>
                <span class="cost-highlight">৳${group.averageCost.toLocaleString()}</span>
              </td>
              <td style="max-width: 200px; word-wrap: break-word;">
                ${group.purchaseNotes || "No notes"}
              </td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="footer">
        <div><strong>BD TicketPro</strong> - Comprehensive Umrah Group Ticket Management System</div>
        <div>This report contains confidential business information and should be handled accordingly.</div>
        <div style="margin-top: 10px;">
          Report includes ${dateGroup.totalGroups} groups with ${dateGroup.totalTickets} tickets totaling ৳${dateGroup.totalCost.toLocaleString()}
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;
}

/**
 * Export single group ticket to PDF
 */
export function exportGroupToPDF(group: GroupTicketPDFData): void {
  const htmlContent = generateGroupPDFContent(group);
  openPDFWindow(
    htmlContent,
    `Umrah_Group_${group.groupName.replace(/\s+/g, "_")}`,
  );
}

/**
 * Export date-grouped tickets to PDF
 */
export function exportDateGroupToPDF(dateGroup: DateGroupedPDFData): void {
  const htmlContent = generateDateGroupPDFContent(dateGroup);
  const filename =
    `Umrah_Groups_${dateGroup.departureDate}_to_${dateGroup.returnDate}`.replace(
      /\s+/g,
      "_",
    );
  openPDFWindow(htmlContent, filename);
}

/**
 * Open PDF in new window for printing/saving
 */
function openPDFWindow(htmlContent: string, filename: string): void {
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    alert("Please allow popups to export PDF");
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Set window title
  printWindow.document.title = filename;
}

/**
 * Generate Excel-style CSV export
 */
export function exportToCSV(
  groups: GroupTicketPDFData[],
  filename: string,
): void {
  const headers = [
    "Group Name",
    "Package Type",
    "Departure Date",
    "Return Date",
    "Ticket Count",
    "Total Cost (৳)",
    "Average Cost (৳)",
    "Agent Name",
    "Agent Contact",
    "Purchase Notes",
  ];

  const csvContent = [
    headers.join(","),
    ...groups.map((group) =>
      [
        `"${group.groupName}"`,
        group.packageType === "with-transport"
          ? "With Transport"
          : "Without Transport",
        group.departureDate,
        group.returnDate,
        group.ticketCount,
        group.totalCost,
        group.averageCost,
        `"${group.agentName}"`,
        `"${group.agentContact || ""}"`,
        `"${group.purchaseNotes || ""}"`,
      ].join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

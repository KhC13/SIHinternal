import { jsPDF } from 'jspdf';
import { Pilot, User } from '../types';

export function formatINR(val?: number): string {
  if (!val && val !== 0) return 'INR 0';
  if (val >= 10000000) {
    return `INR ${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `INR ${(val / 100000).toFixed(2)} Lakhs`;
  }
  return `INR ${val.toLocaleString('en-IN')}`;
}

export function generatePilotPdf(pilot: Pilot, user?: User | null) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 16;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('INNOVPROCURE · PILOT PROJECT VERIFICATION & PERFORMANCE SUMMARY', margin, 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: INNOV-PILOT-${pilot.problem_code || 'REF'}-${pilot.id.slice(0, 8).toUpperCase()}`, pageWidth - margin, 10, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  // --- Top Cover Header Bar ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 28, 'F');

  // Emblem / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('GOVERNMENT OF INDIA · INNOVPROCURE PLATFORM', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('Field Pilot Project Verification & Scale Readiness Summary Dossier', margin + 6, y + 16);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `General Financial Rules (GFR 2017) Rule 194 & Rule 149 Direct Scale Procurement Audit`,
    margin + 6,
    y + 22
  );

  y += 33;

  // --- Metadata & Authorization Strip ---
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 18, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT REFERENCE:', margin + 4, y + 5);
  doc.text('GENERATED ON:', margin + 65, y + 5);
  doc.text('AUTHORIZED OFFICER:', margin + 120, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`INNOV-PILOT-${pilot.problem_code || 'REF'}-${pilot.id.slice(0, 8).toUpperCase()}`, margin + 4, y + 11);
  doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), margin + 65, y + 11);
  
  const officerName = user ? `${user.name} (${user.role.replace(/_/g, ' ')})` : 'Authorized Procurement Officer';
  doc.text(officerName, margin + 120, y + 11);

  y += 24;

  // --- Project Identity Card ---
  checkPageBreak(38);
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 34, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(pilot.title || 'Pilot Project', contentWidth - 8);
  doc.text(titleLines.slice(0, 2), margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department / Ministry: ${pilot.department_name || 'Public Sector Department'}`, margin + 4, y + 16);
  doc.text(`Solution Provider: ${pilot.company_name || 'N/A'} (${pilot.startup_location || 'India'})`, margin + 4, y + 21);
  doc.text(`Sector: ${pilot.sector || 'Technology & Governance'} · Challenge Code: ${pilot.problem_code || 'N/A'}`, margin + 4, y + 26);
  doc.text(`Implementation Window: ${pilot.start_date ? new Date(pilot.start_date).toLocaleDateString('en-IN') : 'N/A'} to ${pilot.end_date ? new Date(pilot.end_date).toLocaleDateString('en-IN') : 'N/A'}`, margin + 4, y + 31);

  y += 39;

  // --- Key Performance Highlight Boxes ---
  checkPageBreak(24);
  const colWidth = (contentWidth - 9) / 4;

  const kpiBoxes = [
    { label: 'SANCTIONED BUDGET', value: formatINR(pilot.budget), color: [238, 242, 255], border: [199, 210, 254], text: [49, 46, 129] },
    { label: 'STATUS', value: pilot.status.replace(/_/g, ' '), color: [240, 253, 244], border: [187, 247, 208], text: [22, 101, 52] },
    { label: 'MILESTONE PROGRESS', value: `${pilot.completion_percentage}%`, color: [245, 243, 255], border: [221, 214, 254], text: [91, 33, 182] },
    {
      label: 'SCALE READINESS',
      value: pilot.scale_readiness_score ? `${pilot.scale_readiness_score}/100` : 'Pending Eval',
      color: [254, 252, 232],
      border: [254, 240, 138],
      text: [133, 77, 14],
    },
  ];

  kpiBoxes.forEach((box, idx) => {
    const boxX = margin + idx * (colWidth + 3);
    doc.setFillColor(box.color[0], box.color[1], box.color[2]);
    doc.setDrawColor(box.border[0], box.border[1], box.border[2]);
    doc.rect(boxX, y, colWidth, 18, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, boxX + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(box.text[0], box.text[1], box.text[2]);
    doc.text(box.value, boxX + 3, y + 13);
  });

  y += 24;

  // --- Objectives & Expected Outcomes ---
  checkPageBreak(32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. PILOT OBJECTIVES & OPERATIONAL MANDATE', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const objLines = doc.splitTextToSize(pilot.objectives || 'No explicit objectives stated.', contentWidth);
  doc.text(objLines, margin, y);
  y += objLines.length * 4.2 + 4;

  if (pilot.expected_outcomes) {
    checkPageBreak(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Targeted Public Deliverables & Impact Metrics:', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const outLines = doc.splitTextToSize(pilot.expected_outcomes, contentWidth);
    doc.text(outLines, margin, y);
    y += outLines.length * 4.2 + 6;
  }

  // --- Section 2: Real-time Telemetry & Performance KPIs ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PERFORMANCE TELEMETRY (KPIS & BENCHMARKS)', margin, y);
  y += 5;

  if (!pilot.kpis || pilot.kpis.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No live telemetry metrics configured for this pilot.', margin, y);
    y += 8;
  } else {
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('METRIC NAME', margin + 4, y + 4.8);
    doc.text('BASELINE', margin + 65, y + 4.8);
    doc.text('TARGET', margin + 95, y + 4.8);
    doc.text('CURRENT RECORDED', margin + 125, y + 4.8);
    doc.text('STATUS', margin + 160, y + 4.8);
    y += 7;

    pilot.kpis.forEach((kpi) => {
      checkPageBreak(8);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(kpi.name.slice(0, 34), margin + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${kpi.baseline_value} ${kpi.metric_unit}`, margin + 65, y + 4.5);
      doc.text(`${kpi.target_value} ${kpi.metric_unit}`, margin + 95, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${kpi.current_value} ${kpi.metric_unit}`, margin + 125, y + 4.5);

      if (kpi.status === 'EXCEEDED' || kpi.status === 'ON_TRACK') {
        doc.setTextColor(22, 101, 52);
      } else {
        doc.setTextColor(180, 83, 9);
      }
      doc.text(kpi.status.replace(/_/g, ' '), margin + 160, y + 4.5);

      y += 7;
    });
    y += 4;
  }

  // --- Section 3: Pilot Verification Milestones ---
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. SLA MILESTONE TRACKING & DELIVERY VERIFICATION', margin, y);
  y += 5;

  if (!pilot.milestones || pilot.milestones.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No milestones recorded for this pilot project.', margin, y);
    y += 8;
  } else {
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 7, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('MILESTONE DELIVERABLE', margin + 4, y + 4.8);
    doc.text('LEAD / OWNER', margin + 85, y + 4.8);
    doc.text('DUE DATE', margin + 120, y + 4.8);
    doc.text('COMPL. %', margin + 148, y + 4.8);
    doc.text('STATUS', margin + 165, y + 4.8);
    y += 7;

    pilot.milestones.forEach((ms) => {
      checkPageBreak(8);
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 6.5, margin + contentWidth, y + 6.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(ms.title.slice(0, 44), margin + 4, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(ms.owner || 'Project Lead', margin + 85, y + 4.5);
      doc.text(ms.due_date ? new Date(ms.due_date).toLocaleDateString('en-IN') : 'N/A', margin + 120, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${ms.completion_percentage}%`, margin + 148, y + 4.5);

      if (ms.status === 'COMPLETED') {
        doc.setTextColor(22, 101, 52);
      } else if (ms.status === 'IN_PROGRESS') {
        doc.setTextColor(67, 56, 202);
      } else {
        doc.setTextColor(100, 116, 139);
      }
      doc.text(ms.status, margin + 165, y + 4.5);

      y += 7;
    });
    y += 4;
  }

  // --- Section 4: Risk Register ---
  if (pilot.risks && pilot.risks.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. RISK MITIGATION & PROTOCOL SAFEGUARDS', margin, y);
    y += 5;

    pilot.risks.forEach((risk) => {
      checkPageBreak(12);
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.rect(margin, y, contentWidth, 11, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text(`[${risk.severity} SEVERITY] ${risk.title}`, margin + 3, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`Mitigation: ${risk.mitigation}`, margin + 3, y + 8);
      y += 13;
    });
  }

  // --- Section 5: Scale Readiness Assessment (GFR 2017 Rule 194) ---
  if (pilot.scaleAssessment) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('5. SCALE READINESS EVALUATION (GFR 2017 RULE 194)', margin, y);
    y += 5;

    const sa = pilot.scaleAssessment;
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208);
    doc.rect(margin, y, contentWidth, 20, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 78, 59);
    doc.text(
      `OVERALL SCORE: ${sa.overall_score}/100 · READINESS LEVEL: ${sa.readiness_level.replace(/_/g, ' ')}`,
      margin + 4,
      y + 6
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    const sumLines = doc.splitTextToSize(sa.summary || '', contentWidth - 8);
    doc.text(sumLines.slice(0, 3), margin + 4, y + 11);

    y += 24;

    // 8-Dimensional Score Table
    checkPageBreak(25);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, y, contentWidth, 14, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    const dims = [
      { name: 'Impact', score: sa.impact_score },
      { name: 'Tech', score: sa.technical_readiness_score },
      { name: 'Ops', score: sa.operational_readiness_score },
      { name: 'Finance', score: sa.financial_sustainability_score },
      { name: 'Adoption', score: sa.user_adoption_score },
      { name: 'Security', score: sa.security_score },
      { name: 'Compliance', score: sa.compliance_score },
      { name: 'Scale', score: sa.scalability_score },
    ];

    const dimWidth = contentWidth / dims.length;
    dims.forEach((d, i) => {
      const dx = margin + i * dimWidth;
      doc.text(d.name, dx + 2, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${d.score}/100`, dx + 2, y + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
    });

    y += 18;
  }

  // --- Official Verification & Sign-off Block ---
  checkPageBreak(38);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('GOVERNMENT PROCUREMENT AUTHORITY SIGN-OFF & CERTIFICATION', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This summary document is authenticated from the InnovProcure Digital Audit Ledger pursuant to General Financial Rules (GFR 2017)',
    margin + 4,
    y + 11
  );
  doc.text(
    'Rule 194 (Scale-up of Pilot Tested Solutions) and Rule 149 (Procurement of Goods & Services on GeM/Direct Rate Contract).',
    margin + 4,
    y + 15
  );

  // Signature Placeholders
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  doc.line(margin + 10, y + 26, margin + 65, y + 26);
  doc.text('Technical Evaluation Committee Chair', margin + 10, y + 29);

  doc.line(margin + 110, y + 26, margin + 165, y + 26);
  doc.text('Competent Procurement Authority (Director/JS)', margin + 110, y + 29);

  y += 35;

  // --- Running Footers on All Pages ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('InnovProcure Platform · Ministry of Commerce & Industry / DPIIT · Government of India', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Trigger browser download
  const safeFilename = `innovprocure-pilot-${pilot.problem_code || 'summary'}-${pilot.id.slice(0, 8)}.pdf`.toLowerCase();
  doc.save(safeFilename);
}

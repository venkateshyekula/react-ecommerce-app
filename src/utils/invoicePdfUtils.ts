import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "../types/invoice";
import type { GstInvoiceSummary } from "./gstInvoiceUtils";
import { FIGTREE_REGULAR_BASE64 } from "../assets/fonts/figtreeBase64";

interface InvoicePdfOptions {
  supplierName: string;
  supplierAddress: string;
  supplierGstin: string;
  supplierPan: string;
  supplierState: string;
}

const formatPdfMoney = (amount: number): string => {
  return `Rs ${amount.toFixed(2)}`;
};

const safeValue = (value: string | number | undefined | null): string => {
  return value === undefined || value === null || value === ""
    ? "-"
    : String(value);
};

const getLastAutoTableY = (doc: jsPDF): number => {
  return (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;
};

export const downloadInvoicePdf = ({
  invoice,
  gstSummary,
  supplier
}: {
  invoice: Invoice;
  gstSummary: GstInvoiceSummary;
  supplier: InvoicePdfOptions;
}): void => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const fontFileName = "Figtree-Regular.ttf";
  const fontName = "Figtree-Regular";

  try {
    const cleanBase64 = FIGTREE_REGULAR_BASE64.replace(/^data:font\/ttf;base64,/, "").trim();
    doc.addFileToVFS(fontFileName, cleanBase64);
    doc.addFont(fontFileName, fontName, "normal");
    doc.addFont(fontFileName, fontName, "bold");
  } catch (error) {
    console.warn("Failed to load Figtree font, falling back to Helvetica", error);
  }

  const applySafeFont = (pdfDoc: jsPDF) => {
    try {
      pdfDoc.setFont(fontName, "normal");
    } catch {
      pdfDoc.setFont("Helvetica", "normal");
    }
  };

  const currentFont = doc.getFont().fontName === fontName ? fontName : "Helvetica";
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;

  let y = 32;

  // Header Segment
  applySafeFont(doc);
  doc.setFontSize(18);
  doc.text("Tax Invoice", margin, y);

  doc.setFontSize(9);
  doc.text(`Invoice Number: ${invoice.invoiceNumber}`, pageWidth - margin, y, {
    align: "right"
  });

  y += 16;

  doc.text(
    `Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString(
      "en-IN"
    )}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 18;

  // Table 1: Transaction Overview
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: currentFont,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 5,
      valign: "middle",
      lineWidth: 1,          // Thicker border
      lineColor: [0, 0, 0]   // Solid black
    },
    body: [
      ["Packet ID", invoice.orderDbId, "Order Number", invoice.orderId],
      [
        "Nature of Transaction",
        gstSummary.supplyType === "INTRA_STATE"
          ? "Intra-State"
          : "Inter-State",
        "Nature of Supply",
        "Goods"
      ],
      [
        "Place of Supply",
        gstSummary.placeOfSupply,
        "Reverse Charge",
        gstSummary.reverseCharge
      ],
      ["Customer Type", "Unregistered", "Payment Method", invoice.paymentMethod]
    ],
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 130 },
      1: { fontStyle: "normal", cellWidth: 260 },
      2: { fontStyle: "normal", cellWidth: 130 },
      3: { fontStyle: "normal", cellWidth: 260 }
    },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = "normal";
    }
  });

  y = getLastAutoTableY(doc) + 14;

  // Table 2: Address Details
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: currentFont,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 6,
      valign: "top",
      lineWidth: 1,          // Thicker border
      lineColor: [0, 0, 0]   // Solid black
    },
    body: [
      [
        `Bill to / Ship to:\n${invoice.userName}\n${invoice.billingAddress.addressLine}\n${invoice.billingAddress.city} - ${invoice.billingAddress.pincode}\n${invoice.billingAddress.state}, India\nEmail: ${invoice.userEmail}\nCustomer Type: Unregistered`,
        `Bill From / Ship From:\n${supplier.supplierName}\n${supplier.supplierAddress}\nGSTIN Number: ${supplier.supplierGstin}\nPAN: ${supplier.supplierPan}`
      ]
    ],
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 390 },
      1: { fontStyle: "normal", cellWidth: 390 }
    },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = "normal";
    }
  });

  y = getLastAutoTableY(doc) + 14;

  // Table 3: Itemized Breakdown
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: currentFont,
      fontStyle: "normal",
      fontSize: 7.5,
      cellPadding: 4,
      overflow: "linebreak",
      valign: "middle",
      lineWidth: 1,          // Thicker border
      lineColor: [0, 0, 0]   // Solid black
    },
    headStyles: {
      fillColor: [238, 238, 238],
      textColor: [20, 20, 20],
      fontStyle: "normal",
      halign: "center",
      lineWidth: 1,          // Thicker border for header cells
      lineColor: [0, 0, 0]
    },
    head: [
      [
        "Particulars",
        "HSN/SAC",
        "Qty",
        "Unit",
        "Gross Amount",
        "Discount",
        "Taxable Amount",
        "Total Amount"
      ]
    ],
    body: [
      ...gstSummary.lines.map((line) => [
        `${line.description}\nGST Rate: ${line.gstRate}%`,
        line.hsnCode,
        safeValue(line.quantity),
        line.unit,
        formatPdfMoney(line.grossAmount),
        formatPdfMoney(line.discountAmount),
        formatPdfMoney(line.taxableAmount),
        formatPdfMoney(line.totalAmount)
      ]),
      [
        "TOTAL",
        "",
        "",
        "",
        formatPdfMoney(gstSummary.grossTotal),
        formatPdfMoney(gstSummary.discountTotal),
        formatPdfMoney(gstSummary.taxableTotal),
        formatPdfMoney(gstSummary.totalAmount)
      ]
    ],
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 260 },
      1: { fontStyle: "normal", cellWidth: 70, halign: "center" },
      2: { fontStyle: "normal", cellWidth: 35, halign: "center" },
      3: { fontStyle: "normal", cellWidth: 45, halign: "center" },
      4: { fontStyle: "normal", cellWidth: 90, halign: "right" },
      5: { fontStyle: "normal", cellWidth: 80, halign: "right" },
      6: { fontStyle: "normal", cellWidth: 100, halign: "right" },
      7: { fontStyle: "normal", cellWidth: 100, halign: "right" }
    },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = "normal";
    }
  });

  y = getLastAutoTableY(doc) + 16;

  // Table 4: Receipt Summary Calculations (Maintains "plain" borderless look for clean receipts)
  autoTable(doc, {
    startY: y,
    theme: "plain",
    margin: { left: pageWidth - margin - 280 },
    styles: {
      font: currentFont,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 4
    },
    body: [
      ["Gross Amount", formatPdfMoney(gstSummary.grossTotal)],
      ["Discount", `- ${formatPdfMoney(gstSummary.discountTotal)}`],
      ["Other Charges", formatPdfMoney(gstSummary.otherChargesTotal)],
      ["Taxable Amount", formatPdfMoney(gstSummary.taxableTotal)],
      ["Wallet Used", `- ${formatPdfMoney(gstSummary.walletAmountUsed)}`],
      ["Total Amount", formatPdfMoney(gstSummary.payableAmount)]
    ],
    columnStyles: {
      0: { cellWidth: 140, fontStyle: "normal" },
      1: { cellWidth: 140, halign: "right", fontStyle: "normal" }
    },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = "normal";
    }
  });

  y = getLastAutoTableY(doc) + 16;

  // Table 5: GST Breakdown
  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: {
      font: currentFont,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: 5,
      valign: "middle",
      lineWidth: 1,          // Thicker border
      lineColor: [0, 0, 0]   // Solid black
    },
    headStyles: {
      fillColor: [238, 238, 238],
      textColor: [20, 20, 20],
      fontStyle: "normal",
      lineWidth: 1,
      lineColor: [0, 0, 0]
    },
    head: [["GST Details", "", "", "", ""]],
    body: [
      [
        "Supplier GSTIN",
        supplier.supplierGstin,
        "Supplier State",
        supplier.supplierState,
        ""
      ],
      [
        "Place of Supply",
        gstSummary.placeOfSupply,
        "Supply Type",
        gstSummary.supplyType === "INTRA_STATE"
          ? "Intra-State Supply"
          : "Inter-State Supply",
        ""
      ],
      [
        "Reverse Charge",
        gstSummary.reverseCharge,
        "Total Tax",
        formatPdfMoney(
          gstSummary.cgstTotal +
            gstSummary.sgstTotal +
            gstSummary.igstTotal +
            gstSummary.cessTotal
        ),
        ""
      ],
      [
        "Taxable Amount",
        formatPdfMoney(gstSummary.taxableTotal),
        "CGST",
        formatPdfMoney(gstSummary.cgstTotal),
        ""
      ],
      [
        "SGST/UGST",
        formatPdfMoney(gstSummary.sgstTotal),
        "IGST",
        formatPdfMoney(gstSummary.igstTotal),
        ""
      ],
      ["Cess", formatPdfMoney(gstSummary.cessTotal), "", "", ""]
    ],
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "normal" },
      1: { cellWidth: 230, fontStyle: "normal" },
      2: { cellWidth: 130, fontStyle: "normal" },
      3: { cellWidth: 230, fontStyle: "normal" },
      4: { cellWidth: 60, fontStyle: "normal" }
    },
    didParseCell: (data) => {
      data.cell.styles.fontStyle = "normal";
    }
  });

  y = getLastAutoTableY(doc) + 18;

  // Footer Disclaimers & Signatures
  applySafeFont(doc);
  doc.setFontSize(9);
  doc.text("DECLARATION", margin, y);

  y += 13;

  doc.setFontSize(8);
  doc.text(
    "The goods sold as part of this shipment are intended for end-user consumption and are not for retail sale.",
    margin,
    y
  );

  y += 35;

  doc.text(supplier.supplierName, pageWidth - margin, y, {
    align: "right"
  });

  y += 18;

  doc.text("Authorized Signatory", pageWidth - margin, y, {
    align: "right"
  });

  // System Generated Invoice Footnote (E-commerce Portal Style)
  doc.setFontSize(7.5);
  doc.setTextColor(130, 130, 130);
  
  try {
    doc.setFont(fontName, "italic");
  } catch {
    doc.setFont("Helvetica", "italic");
  }

  doc.text(
    "This is a computer-generated invoice and does not require a physical signature.",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  try {
    doc.setFont(fontName, "normal");
  } catch {
    doc.setFont("Helvetica", "normal");
  }

  doc.save(`${invoice.invoiceNumber}-${invoice.orderId}.pdf`);
};
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import { invoiceService } from "../services/invoiceService";
import type { Invoice } from "../types/invoice";
import { buildGstInvoiceSummary } from "../utils/gstInvoiceUtils";
import { downloadInvoicePdf } from "../utils/invoicePdfUtils";
import { formatCurrency } from "../utils/currencyFormatter";

type LegacyInvoice = Invoice &
  Partial<{
    subtotalAmount: number;
    discountAmount: number;
    couponDiscountAmount: number;
    deliveryFee: number;
    rewardDiscountAmount: number;
    walletAmountUsed: number;
    totalAmount: number;
    payableAmount: number;
  }>;

const SHOP_EASE_SUPPLIER = {
  name: "ShopEase Marketplace Private Limited",
  address:
    "ShopEase Fulfilment Hub, Vijayawada, Andhra Pradesh - 520010, India",
  gstin: "37SHOP1234E1Z5",
  pan: "SHOP1234E",
  state: "ANDHRA PRADESH",
};

const InvoicePage = () => {
  const { orderId } = useParams<{ orderId: string }>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadInvoice = useCallback(async (): Promise<void> => {
    if (!orderId) {
      setInvoice(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await invoiceService.getInvoiceByOrderId(orderId);
      setInvoice(data);
    } catch {
      setErrorMessage(
        "Unable to load invoice. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const normalizedInvoice = useMemo((): Invoice | null => {
    if (!invoice) {
      return null;
    }

    const legacyInvoice = invoice as LegacyInvoice;

    const itemSubtotalAmount = invoice.items.reduce(
      (total, item) => total + item.subtotal,
      0,
    );

    const paymentBreakup = invoice.paymentBreakup ?? {
      subtotalAmount: legacyInvoice.subtotalAmount ?? itemSubtotalAmount,
      couponDiscountAmount:
        legacyInvoice.couponDiscountAmount ?? legacyInvoice.discountAmount ?? 0,
      deliveryFee: legacyInvoice.deliveryFee ?? 0,
      rewardDiscountAmount: legacyInvoice.rewardDiscountAmount ?? 0,
      walletAmountUsed: legacyInvoice.walletAmountUsed ?? 0,
      totalAmount: legacyInvoice.totalAmount ?? itemSubtotalAmount,
      payableAmount:
        legacyInvoice.payableAmount ??
        Math.max(
          0,
          (legacyInvoice.totalAmount ?? itemSubtotalAmount) -
            (legacyInvoice.walletAmountUsed ?? 0),
        ),
    };

    return {
      ...invoice,
      shippingAddress: invoice.shippingAddress ?? invoice.billingAddress,
      paymentBreakup,
    };
  }, [invoice]);

  const gstSummary = useMemo(() => {
    if (!normalizedInvoice || !normalizedInvoice.shippingAddress) {
      return null;
    }

    return buildGstInvoiceSummary(normalizedInvoice, {
      supplierState: SHOP_EASE_SUPPLIER.state,
      placeOfSupply: normalizedInvoice.shippingAddress.state,
      defaultGstRate: 5,
      isTaxInclusive: true,
    });
  }, [normalizedInvoice]);

  const handlePrint = (): void => {
    window.print();
  };

  const handleDownloadPdf = (): void => {
    if (!normalizedInvoice || !gstSummary) {
      return;
    }

    downloadInvoicePdf({
      invoice: normalizedInvoice,
      gstSummary,
      supplier: {
        supplierName: SHOP_EASE_SUPPLIER.name,
        supplierAddress: SHOP_EASE_SUPPLIER.address,
        supplierGstin: SHOP_EASE_SUPPLIER.gstin,
        supplierPan: SHOP_EASE_SUPPLIER.pan,
        supplierState: SHOP_EASE_SUPPLIER.state
      },
    });
  };

  if (isLoading) {
    return (
      <main className="invoice-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading invoice..." />
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="invoice-page bg-light">
        <section className="container-fluid py-5">
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>

          <Link to="/orders" className="btn btn-primary">
            Back to Orders
          </Link>
        </section>
      </main>
    );
  }

  if (!normalizedInvoice || !normalizedInvoice.shippingAddress || !gstSummary) {
    return (
      <main className="invoice-page bg-light">
        <section className="container-fluid py-5 text-center">
          <EmptyState
            title="Invoice Not Found"
            message={`We couldn't find any invoice linked to order ID: ${
              orderId ?? "-"
            }`}
          />

          <Link to="/orders" className="btn btn-primary mt-3">
            Back to Orders
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="invoice-page bg-light">
      <section className="page-header bg-white border-bottom invoice-no-print">
        <div className="container-fluid py-3">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="mb-1">Tax Invoice</h1>
              <p className="text-muted mb-0">
                Invoice for order {normalizedInvoice.orderId}
              </p>
            </div>

            <div className="invoice-header-actions">
              <Link
                to="/orders"
                className="btn btn-outline-secondary invoice-action-btn"
              >
                <i className="bi bi-arrow-left" />
                <span>Back</span>
              </Link>

              <button
                type="button"
                className="btn btn-outline-success invoice-action-btn"
                onClick={handleDownloadPdf}
              >
                <i className="bi bi-file-earmark-pdf" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                className="btn btn-outline-primary invoice-action-btn"
                onClick={handlePrint}
              >
                <i className="bi bi-printer" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="tax-invoice-document bg-white border rounded-3 mx-auto position-relative">
          <div className="tax-invoice-title-row">
            <div>
              <h2>Tax Invoice</h2>
              <p>ShopEase Marketplace Order Invoice</p>
            </div>

            <div className="tax-invoice-brand">
              <strong>ShopEase</strong>
              <span>Purchase made on ShopEase</span>
            </div>
          </div>

          <div className="tax-invoice-meta-grid">
            <div>
              <span>Invoice Number:</span>
              <strong>{normalizedInvoice.invoiceNumber}</strong>
            </div>

            <div>
              <span>Invoice Date:</span>
              <strong>
                {new Date(normalizedInvoice.invoiceDate).toLocaleDateString(
                  "en-IN",
                )}
              </strong>
            </div>

            <div>
              <span>Packet ID:</span>
              <strong>{normalizedInvoice.orderDbId}</strong>
            </div>

            <div>
              <span>Order Number:</span>
              <strong>{normalizedInvoice.orderId}</strong>
            </div>

            <div>
              <span>Nature of Transaction:</span>
              <strong>
                {gstSummary.supplyType === "INTRA_STATE"
                  ? "Intra-State"
                  : "Inter-State"}
              </strong>
            </div>

            <div>
              <span>Nature of Supply:</span>
              <strong>Goods</strong>
            </div>

            <div>
              <span>Place of Supply:</span>
              <strong>{gstSummary.placeOfSupply}</strong>
            </div>

            <div>
              <span>Reverse Charge:</span>
              <strong>{gstSummary.reverseCharge}</strong>
            </div>
          </div>

          <div className="tax-invoice-party-grid">
            <div>
              <h6>Bill to / Ship to:</h6>
              <p>
                <strong>{normalizedInvoice.userName}</strong>
                <br />
                {normalizedInvoice.shippingAddress.addressLine}
                <br />
                {normalizedInvoice.shippingAddress.city} -{" "}
                {normalizedInvoice.shippingAddress.pincode}
                <br />
                {normalizedInvoice.shippingAddress.state}, India
                <br />
                Customer Type: Unregistered
              </p>
            </div>

            <div>
              <h6>Bill From:</h6>
              <p>
                <strong>{SHOP_EASE_SUPPLIER.name}</strong>
                <br />
                {SHOP_EASE_SUPPLIER.address}
                <br />
                GSTIN Number: {SHOP_EASE_SUPPLIER.gstin}
                <br />
                PAN: {SHOP_EASE_SUPPLIER.pan}
              </p>
            </div>

            <div>
              <h6>Ship From:</h6>
              <p>
                <strong>{SHOP_EASE_SUPPLIER.name}</strong>
                <br />
                {SHOP_EASE_SUPPLIER.address}
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table tax-invoice-table mb-0">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>HSN/SAC</th>
                  <th className="text-end">Qty</th>
                  <th className="text-end">Unit</th>
                  <th className="text-end">Gross Amount</th>
                  <th className="text-end">Discount</th>
                  <th className="text-end">Taxable Amount</th>
                  <th className="text-end">Total Amount</th>
                </tr>
              </thead>

              <tbody>
                {gstSummary.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <strong>{line.description}</strong>

                      <div className="small text-muted">
                        GST Rate: {line.gstRate}% · HSN/SAC: {line.hsnCode}
                      </div>
                    </td>

                    <td>{line.hsnCode}</td>

                    <td className="text-end">{line.quantity}</td>

                    <td className="text-end">{line.unit}</td>

                    <td className="text-end">
                      {formatCurrency(line.grossAmount)}
                    </td>

                    <td className="text-end">
                      {formatCurrency(line.discountAmount)}
                    </td>

                    <td className="text-end">
                      {formatCurrency(line.taxableAmount)}
                    </td>

                    <td className="text-end fw-bold">
                      {formatCurrency(line.totalAmount)}
                    </td>
                  </tr>
                ))}

                <tr className="tax-invoice-total-row">
                  <td colSpan={4}>TOTAL</td>

                  <td className="text-end">
                    {formatCurrency(gstSummary.grossTotal)}
                  </td>

                  <td className="text-end">
                    {formatCurrency(gstSummary.discountTotal)}
                  </td>

                  <td className="text-end">
                    {formatCurrency(gstSummary.taxableTotal)}
                  </td>

                  <td className="text-end">
                    {formatCurrency(gstSummary.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="tax-invoice-bottom-grid">
            <div className="tax-invoice-declaration">
              <h6>DECLARATION</h6>

              <p>
                The goods sold as part of this shipment are intended for
                end-user consumption and are not for retail sale.
              </p>

              <p className="mb-0">
                If you have any questions, please contact ShopEase customer care
                from the Help Center.
              </p>
            </div>

            <div className="tax-invoice-summary">
              <div>
                <span>Gross Amount</span>
                <strong>{formatCurrency(gstSummary.grossTotal)}</strong>
              </div>

              <div>
                <span>Discount</span>
                <strong className="text-success">
                  - {formatCurrency(gstSummary.discountTotal)}
                </strong>
              </div>

              <div>
                <span>Other Charges</span>
                <strong>{formatCurrency(gstSummary.otherChargesTotal)}</strong>
              </div>

              <div>
                <span>Taxable Amount</span>
                <strong>{formatCurrency(gstSummary.taxableTotal)}</strong>
              </div>

              <div>
                <span>Wallet Used</span>
                <strong className="text-success">
                  - {formatCurrency(gstSummary.walletAmountUsed)}
                </strong>
              </div>

              <div className="tax-invoice-grand-total">
                <span>Total Amount</span>
                <strong>{formatCurrency(gstSummary.payableAmount)}</strong>
              </div>
            </div>
          </div>

          <div className="tax-invoice-gst-section">
            <div className="tax-invoice-gst-header">
              <div>
                <h6>GST Details</h6>
                <p>
                  GST calculation is based on place of supply and supplier
                  state.
                </p>
              </div>

              <span
                className={`badge ${
                  gstSummary.supplyType === "INTRA_STATE"
                    ? "text-bg-info"
                    : "text-bg-primary"
                }`}
              >
                {gstSummary.supplyType === "INTRA_STATE"
                  ? "Intra-State Supply"
                  : "Inter-State Supply"}
              </span>
            </div>

            <div className="tax-invoice-gst-grid">
              <div>
                <span>Supplier GSTIN</span>
                <strong>{SHOP_EASE_SUPPLIER.gstin}</strong>
              </div>

              <div>
                <span>Supplier State</span>
                <strong>{SHOP_EASE_SUPPLIER.state}</strong>
              </div>

              <div>
                <span>Place of Supply</span>
                <strong>{gstSummary.placeOfSupply}</strong>
              </div>

              <div>
                <span>Reverse Charge</span>
                <strong>{gstSummary.reverseCharge}</strong>
              </div>

              <div>
                <span>Taxable Amount</span>
                <strong>{formatCurrency(gstSummary.taxableTotal)}</strong>
              </div>

              <div>
                <span>CGST</span>
                <strong>{formatCurrency(gstSummary.cgstTotal)}</strong>
              </div>

              <div>
                <span>SGST / UGST</span>
                <strong>{formatCurrency(gstSummary.sgstTotal)}</strong>
              </div>

              <div>
                <span>IGST</span>
                <strong>{formatCurrency(gstSummary.igstTotal)}</strong>
              </div>

              <div>
                <span>Cess</span>
                <strong>{formatCurrency(gstSummary.cessTotal)}</strong>
              </div>

              <div>
                <span>Total Tax</span>
                <strong>
                  {formatCurrency(
                    gstSummary.cgstTotal +
                      gstSummary.sgstTotal +
                      gstSummary.igstTotal +
                      gstSummary.cessTotal,
                  )}
                </strong>
              </div>
            </div>

            <p className="tax-invoice-gst-note">
              For intra-state supply, GST is split equally as CGST and
              SGST/UGST. For inter-state supply, GST is charged as IGST.
            </p>
          </div>

          <div className="tax-invoice-signature mb-4">
            <strong>{SHOP_EASE_SUPPLIER.name}</strong>
            <span>Authorized Signatory</span>
          </div>

          {/* System Generated Invoice Footnote */}
          <div className="border-top pt-3 mt-4 text-center text-muted text-gray small fst-italic">
            This is a computer-generated invoice and does not require a physical signature.
          </div>
        </div>
      </section>
    </main>
  );
};

export default InvoicePage;
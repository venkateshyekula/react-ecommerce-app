import { useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import ReturnQcDecisionPanel from "../../components/returns/ReturnQcDecisionPanel";
import ReturnQcItemCard from "../../components/returns/ReturnQcItemCard";
import ReturnStatusBadge from "../../components/returns/ReturnStatusBadge";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { returnQcService } from "../../services/returnQcService";
import { returnRequestService } from "../../services/returnRequestService";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnItemConditionGrade,
  ReturnQcChecklistResult,
  ReturnQcEvidenceFormState,
  ReturnQcInspection,
} from "../../types/returnQc";
import { formatCurrency } from "../../utils/currencyFormatter";
import {
  getEvidenceMatchStatus,
  isReturnEligibleForWarehouseQc,
  parseOptionalNumber,
} from "../../utils/returnQcUtils";

type QcFilter =
  | "ALL"
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "PASSED"
  | "FAILED";

type ReturnRequestItem = ReturnRequest["items"][number];

const getReturnDisplayId = (request: ReturnRequest): string => {
  return request.returnRequestId ?? request.requestId;
};

const getItemKey = (item: ReturnRequestItem, index: number): string => {
  return (
    item.id ?? `${item.productId}-${item.selectedSize ?? "no-size"}-${index}`
  );
};

const buildEvidencePayload = (evidence: ReturnQcEvidenceFormState) => {
  const expectedBarcode = evidence.expectedBarcode.trim() || null;
  const scannedBarcode = evidence.scannedBarcode.trim() || null;
  const expectedSerialNumber = evidence.expectedSerialNumber.trim() || null;
  const scannedSerialNumber = evidence.scannedSerialNumber.trim() || null;

  return {
    expectedBarcode,
    scannedBarcode,
    barcodeMatchStatus: getEvidenceMatchStatus({
      expectedValue: expectedBarcode,
      scannedValue: scannedBarcode,
    }),
    expectedSerialNumber,
    scannedSerialNumber,
    serialMatchStatus: getEvidenceMatchStatus({
      expectedValue: expectedSerialNumber,
      scannedValue: scannedSerialNumber,
    }),
    expectedPackageWeightKg: parseOptionalNumber(
      evidence.expectedPackageWeightKg,
    ),
    packageWeightKg: parseOptionalNumber(evidence.packageWeightKg),
    packageWeightVarianceNote:
      evidence.packageWeightVarianceNote.trim() || null,
    qcPhotoDataUrl: evidence.qcPhotoDataUrl,
    qcPhotoFileName: evidence.qcPhotoFileName,
    evidenceNotes: evidence.evidenceNotes.trim() || null,
  };
};

const ReturnWarehouseQcPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const canPerformWarehouseQc =
    currentUser?.role === "ADMIN" ||
    currentUser?.role === "WAREHOUSE_AGENT";

  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [inspectionsByReturnId, setInspectionsByReturnId] = useState<
    Record<string, ReturnQcInspection[]>
  >({});
  const [selectedReturnId, setSelectedReturnId] = useState<string>("");
  const [selectedItemKey, setSelectedItemKey] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [qcFilter, setQcFilter] = useState<QcFilter>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingKey, setUpdatingKey] = useState<string>("");

  const loadQcDashboard = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      const [returnRequests, inspections] = await Promise.all([
        returnRequestService.getReturnRequests(),
        returnQcService.getQcInspections(),
      ]);

      const qcEligibleReturns = returnRequests.filter(
        isReturnEligibleForWarehouseQc,
      );

      const groupedInspections = inspections.reduce<
        Record<string, ReturnQcInspection[]>
      >((accumulator, inspection) => {
        const currentInspections =
          accumulator[inspection.returnRequestId] ?? [];

        return {
          ...accumulator,
          [inspection.returnRequestId]: [
            ...currentInspections,
            inspection,
          ],
        };
      }, {});

      setRequests(qcEligibleReturns);
      setInspectionsByReturnId(groupedInspections);

      setSelectedReturnId((previousSelectedReturnId) => {
        if (!previousSelectedReturnId && qcEligibleReturns.length > 0) {
          return getReturnDisplayId(qcEligibleReturns[0]);
        }

        const selectedStillExists = qcEligibleReturns.some(
          (request) =>
            getReturnDisplayId(request) === previousSelectedReturnId,
        );

        if (!selectedStillExists && qcEligibleReturns.length > 0) {
          return getReturnDisplayId(qcEligibleReturns[0]);
        }

        return previousSelectedReturnId;
      });
    } catch {
      showToast(
        "QC load failed",
        "Unable to load warehouse QC dashboard.",
        "danger",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadQcDashboard();
  }, [loadQcDashboard]);

  const filteredRequests = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return requests.filter((request) => {
      const returnId = getReturnDisplayId(request);
      const inspections = inspectionsByReturnId[returnId] ?? [];

      if (qcFilter !== "ALL") {
        const hasMatchingInspection = inspections.some(
          (inspection) => inspection.qcStatus === qcFilter,
        );

        const requestMatchesFilter =
          request.qualityCheckStatus === qcFilter ||
          (qcFilter === "NOT_STARTED" && inspections.length === 0);

        if (!hasMatchingInspection && !requestMatchesFilter) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        returnId,
        request.orderId,
        request.userName ?? "",
        request.userEmail ?? "",
        request.pickupPartnerName ?? "",
        request.status,
        request.pickupStatus ?? "",
        request.qualityCheckStatus ?? "",
        request.items.map((item) => item.name).join(" "),
        request.items.map((item) => item.category ?? "").join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [inspectionsByReturnId, qcFilter, requests, searchText]);

  const selectedRequest = useMemo(() => {
    if (filteredRequests.length === 0) {
      return null;
    }

    if (!selectedReturnId) {
      return filteredRequests[0];
    }

    return (
      filteredRequests.find(
        (request) => getReturnDisplayId(request) === selectedReturnId,
      ) ?? filteredRequests[0]
    );
  }, [filteredRequests, selectedReturnId]);

  const selectedReturnDisplayId = selectedRequest
    ? getReturnDisplayId(selectedRequest)
    : "";

  const selectedInspections = useMemo(() => {
    return selectedReturnDisplayId
      ? inspectionsByReturnId[selectedReturnDisplayId] ?? []
      : [];
  }, [inspectionsByReturnId, selectedReturnDisplayId]);

  const selectedItem = useMemo(() => {
    if (!selectedRequest || selectedRequest.items.length === 0) {
      return null;
    }

    if (!selectedItemKey) {
      return selectedRequest.items[0];
    }

    return (
      selectedRequest.items.find(
        (item, index) => getItemKey(item, index) === selectedItemKey,
      ) ?? selectedRequest.items[0]
    );
  }, [selectedItemKey, selectedRequest]);

  const selectedItemInspection = useMemo(() => {
    if (!selectedItem) {
      return null;
    }

    return (
      selectedInspections.find(
        (inspection) => inspection.productId === selectedItem.productId,
      ) ?? null
    );
  }, [selectedInspections, selectedItem]);

  // Keep item selection valid when selected return request changes
  useEffect(() => {
    if (!selectedRequest || selectedRequest.items.length === 0) {
      setSelectedItemKey("");
      return;
    }

    const selectedStillExists = selectedRequest.items.some(
      (item, index) => getItemKey(item, index) === selectedItemKey,
    );

    if (!selectedItemKey || !selectedStillExists) {
      setSelectedItemKey(getItemKey(selectedRequest.items[0], 0));
    }
  }, [selectedItemKey, selectedRequest]);

  const summary = useMemo(() => {
    const allInspections = Object.values(inspectionsByReturnId).flat();

    return {
      totalReturns: requests.length,
      pending: requests.filter(
        (request) =>
          request.qualityCheckStatus === "PENDING" ||
          request.qualityCheckStatus === "NOT_STARTED",
      ).length,
      inProgress: allInspections.filter(
        (inspection) => inspection.qcStatus === "IN_PROGRESS",
      ).length,
      passed: allInspections.filter(
        (inspection) => inspection.qcStatus === "PASSED",
      ).length,
      failed: allInspections.filter(
        (inspection) => inspection.qcStatus === "FAILED",
      ).length,
    };
  }, [inspectionsByReturnId, requests]);

  const upsertInspectionInState = (inspection: ReturnQcInspection): void => {
    setInspectionsByReturnId((previousState) => {
      const currentInspections =
        previousState[inspection.returnRequestId] ?? [];

      const alreadyExists = currentInspections.some(
        (currentInspection) => currentInspection.id === inspection.id,
      );

      return {
        ...previousState,
        [inspection.returnRequestId]: alreadyExists
          ? currentInspections.map((currentInspection) =>
              currentInspection.id === inspection.id
                ? inspection
                : currentInspection,
            )
          : [inspection, ...currentInspections],
      };
    });
  };

  const updateRequestInState = (updatedRequest: ReturnRequest): void => {
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === updatedRequest.id ? updatedRequest : request,
      ),
    );
  };

  const buildInspectionPayload = ({
    request,
    item,
    conditionGrade,
    checklistResults,
    qcRemarks,
    qcStatus,
    evidence,
  }: {
    request: ReturnRequest;
    item: ReturnRequestItem;
    conditionGrade: ReturnItemConditionGrade;
    checklistResults: ReturnQcChecklistResult[];
    qcRemarks?: string | null;
    qcStatus: "IN_PROGRESS" | "PASSED" | "FAILED";
    evidence: ReturnQcEvidenceFormState;
  }) => {
    const returnRequestId = getReturnDisplayId(request);

    return {
      returnRequestId,
      requestId: request.requestId,
      orderId: request.orderId,
      orderDbId: request.orderDbId ?? null,
      userId: request.userId,
      productId: item.productId,
      productName: item.name,
      category: item.category ?? null,
      sellerId: item.sellerId ?? null,
      sellerName: item.sellerName ?? null,
      conditionGrade,
      qcStatus,
      checklistResults,
      qcRemarks: qcRemarks ?? null,
      ...buildEvidencePayload(evidence),
      inspectedByUserId: currentUser?.id ?? null,
      inspectedByName: currentUser?.name ?? null,
    };
  };

  const handleSaveDraft = async ({
    conditionGrade,
    checklistResults,
    qcRemarks,
    evidence,
  }: {
    conditionGrade: ReturnItemConditionGrade;
    checklistResults: ReturnQcChecklistResult[];
    qcRemarks?: string;
    evidence: ReturnQcEvidenceFormState;
  }): Promise<void> => {
    if (!selectedRequest || !selectedItem) {
      return;
    }

    try {
      setUpdatingKey(selectedItem.productId);

      const inspection = await returnQcService.saveQcInspection(
        buildInspectionPayload({
          request: selectedRequest,
          item: selectedItem,
          conditionGrade,
          checklistResults,
          qcRemarks,
          qcStatus: "IN_PROGRESS",
          evidence,
        }),
      );

      const updatedRequest = await returnRequestService.updateRequest(
        selectedRequest.id,
        {
          qualityCheckStatus: "IN_PROGRESS",
          status: "QUALITY_CHECK_PENDING",
          qualityCheckRemarks:
            qcRemarks ?? "Warehouse QC inspection is in progress.",
          updatedAt: new Date().toISOString(),
        } as Partial<ReturnRequest>,
      );

      upsertInspectionInState(inspection);
      updateRequestInState(updatedRequest);

      showToast("QC draft saved", "Warehouse QC draft saved.", "success");
    } catch {
      showToast("QC save failed", "Unable to save QC draft.", "danger");
    } finally {
      setUpdatingKey("");
    }
  };

  const handleQcPassed = async ({
    conditionGrade,
    checklistResults,
    qcRemarks,
    evidence,
  }: {
    conditionGrade: ReturnItemConditionGrade;
    checklistResults: ReturnQcChecklistResult[];
    qcRemarks?: string;
    evidence: ReturnQcEvidenceFormState;
  }): Promise<void> => {
    if (!selectedRequest || !selectedItem) {
      return;
    }

    try {
      setUpdatingKey(selectedItem.productId);

      const finalRemarks =
        qcRemarks ?? "QC passed. Item eligible for refund.";

      const inspection = await returnQcService.saveQcInspection(
        buildInspectionPayload({
          request: selectedRequest,
          item: selectedItem,
          conditionGrade,
          checklistResults,
          qcRemarks: finalRemarks,
          qcStatus: "PASSED",
          evidence,
        }),
      );

      const updatedRequest =
        await returnRequestService.passQualityCheckAndCreateRefund({
          request: selectedRequest,
          qualityCheckRemarks: finalRemarks,
        });

      upsertInspectionInState(inspection);
      updateRequestInState(updatedRequest);

      showToast(
        "QC passed",
        "QC passed and refund request has been created.",
        "success",
      );
    } catch {
      showToast("QC action failed", "Unable to mark QC passed.", "danger");
    } finally {
      setUpdatingKey("");
    }
  };

  const handleQcFailed = async ({
    conditionGrade,
    checklistResults,
    qcRemarks,
    evidence,
  }: {
    conditionGrade: ReturnItemConditionGrade;
    checklistResults: ReturnQcChecklistResult[];
    qcRemarks: string;
    evidence: ReturnQcEvidenceFormState;
  }): Promise<void> => {
    if (!selectedRequest || !selectedItem) {
      return;
    }

    try {
      setUpdatingKey(selectedItem.productId);

      const inspection = await returnQcService.saveQcInspection(
        buildInspectionPayload({
          request: selectedRequest,
          item: selectedItem,
          conditionGrade,
          checklistResults,
          qcRemarks,
          qcStatus: "FAILED",
          evidence,
        }),
      );

      const updatedRequest = await returnRequestService.failQualityCheck({
        request: selectedRequest,
        qualityCheckRemarks: qcRemarks,
      });

      upsertInspectionInState(inspection);
      updateRequestInState(updatedRequest);

      showToast(
        "QC failed",
        "QC failure recorded and refund blocked.",
        "warning",
      );
    } catch {
      showToast("QC action failed", "Unable to mark QC failed.", "danger");
    } finally {
      setUpdatingKey("");
    }
  };

  const handleClearFilters = (): void => {
    setSearchText("");
    setQcFilter("ALL");
  };

  if (isLoading) {
    return (
      <main className="return-warehouse-qc-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading warehouse QC dashboard..." />
        </div>
      </main>
    );
  }

  return (
    <main className="return-warehouse-qc-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Return Warehouse QC</h1>
              <p className="text-muted mb-0">
                Inspect returned items, grade condition, verify barcode or
                serial number, capture evidence, and approve or reject refund
                eligibility.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadQcDashboard()}
            >
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <div className="row g-3 mb-4">
          <div className="col-md">
            <div className="return-qc-summary-card">
              <span>Total Returns</span>
              <strong>{summary.totalReturns}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="return-qc-summary-card">
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="return-qc-summary-card">
              <span>In Progress</span>
              <strong>{summary.inProgress}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="return-qc-summary-card">
              <span>Passed</span>
              <strong>{summary.passed}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="return-qc-summary-card">
              <span>Failed</span>
              <strong>{summary.failed}</strong>
            </div>
          </div>
        </div>

        <div className="support-ticket-toolbar bg-white border rounded-4 p-3 mb-4 shadow-sm">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label small fw-semibold">
                Search Returns
              </label>

              <input
                className="form-control"
                placeholder="Search return ID, order ID, customer, item, category..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <label className="form-label small fw-semibold">QC Status</label>

              <select
                className="form-select"
                value={qcFilter}
                onChange={(event) =>
                  setQcFilter(event.target.value as QcFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="NOT_STARTED">Not Started</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="PASSED">Passed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div className="col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!searchText.trim() && qcFilter === "ALL"}
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No returns pending warehouse QC"
            message="No return requests match the selected filters."
            iconClassName="bi bi-clipboard-check text-primary"
          />
        ) : (
          <div className="row g-3 align-items-start">
            <div className="col-xl-4">
              <div className="d-flex flex-column gap-3">
                {filteredRequests.map((request) => {
                  const returnId = getReturnDisplayId(request);
                  const isSelected = selectedReturnDisplayId === returnId;
                  const requestAmount =
                    request.refundAmount ??
                    request.items.reduce(
                      (total, item) => total + item.price * item.quantity,
                      0,
                    );

                  return (
                    <div
                      className={`return-qc-request-card ${
                        isSelected ? "return-qc-request-card--selected" : ""
                      }`}
                      key={request.id}
                      role="button"
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => setSelectedReturnId(returnId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedReturnId(returnId);
                        }
                      }}
                    >
                      <div className="d-flex justify-content-between gap-2 mb-2">
                        <span className="badge text-bg-light border">
                          {returnId}
                        </span>

                        <ReturnStatusBadge
                          type="QC"
                          status={request.qualityCheckStatus ?? "NOT_STARTED"}
                        />
                      </div>

                      <h6 className="fw-bold mb-1">
                        Return for order {request.orderId}
                      </h6>

                      <p className="text-muted small mb-1">
                        Customer:{" "}
                        <strong>{request.userName ?? request.userId}</strong>
                      </p>

                      <p className="text-muted small mb-2">
                        Refund Amount:{" "}
                        <strong>{formatCurrency(requestAmount)}</strong>
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <ReturnStatusBadge
                          type="RETURN"
                          status={request.status}
                        />

                        <ReturnStatusBadge
                          type="PICKUP"
                          status={request.pickupStatus ?? "NOT_SCHEDULED"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-xl-3">
              <div className="return-qc-item-list bg-white border rounded-4 p-3 shadow-sm">
                <h6 className="fw-bold mb-3">Returned Items</h6>

                {selectedRequest ? (
                  <div className="d-flex flex-column gap-3">
                    {selectedRequest.items.map((item, index) => {
                      const itemKey = getItemKey(item, index);
                      const inspection =
                        selectedInspections.find(
                          (currentInspection) =>
                            currentInspection.productId === item.productId,
                        ) ?? null;

                      return (
                        <ReturnQcItemCard
                          item={item}
                          inspection={inspection}
                          isSelected={selectedItemKey === itemKey}
                          key={itemKey}
                          onSelect={() => setSelectedItemKey(itemKey)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-muted small">
                    Select a return request to view returned items.
                  </div>
                )}
              </div>
            </div>

            <div className="col-xl-5">
              {selectedRequest && selectedItem ? (
                <ReturnQcDecisionPanel
                  key={selectedItemKey}
                  request={selectedRequest}
                  item={selectedItem}
                  inspection={selectedItemInspection}
                  isUpdating={updatingKey === selectedItem.productId}
                  onSaveDraft={handleSaveDraft}
                  onQcPassed={handleQcPassed}
                  onQcFailed={handleQcFailed}
                  canPerformQc={canPerformWarehouseQc}
                />
              ) : (
                <div className="bg-white border rounded-4 p-4 text-muted">
                  Select a return item to start QC inspection.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default ReturnWarehouseQcPage;
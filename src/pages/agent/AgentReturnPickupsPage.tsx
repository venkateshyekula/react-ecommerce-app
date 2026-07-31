import { useCallback, useEffect, useMemo, useState } from "react";
import AgentReturnPickupCard from "../../components/agent/AgentReturnPickupCard";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import ReturnPackageTrackingPanel from "../../components/returns/ReturnPackageTrackingPanel";
import { useAuth } from "../../context/useAuth";
import { useToast } from "../../context/useToast";
import { returnPickupService } from "../../services/returnPickupService";
import { returnRequestService } from "../../services/returnRequestService";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnPickupAttempt,
  ReturnPickupPartner,
} from "../../types/returnPickup";

interface AgentUserShape {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  partnerId?: string;
  pickupPartnerId?: string;
  partnerName?: string;
  phone?: string;
  mobile?: string;
}

type AgentPickupFilter =
  | "ALL"
  | "SCHEDULED"
  | "OUT_FOR_PICKUP"
  | "PICKED_UP"
  | "FAILED_ATTEMPT"
  | "RESCHEDULED"
  | "CANCELLED";

interface AgentPickupRecord {
  attempt: ReturnPickupAttempt;
  request: ReturnRequest;
}

const getCurrentPickupPartnerId = (
  currentUser: AgentUserShape | null,
): string => {
  return currentUser?.pickupPartnerId ?? currentUser?.partnerId ?? "";
};

const AgentReturnPickupsPage = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const agentUser = currentUser as AgentUserShape | null;
  const mappedPartnerId = getCurrentPickupPartnerId(agentUser);

  const [records, setRecords] = useState<AgentPickupRecord[]>([]);
  const [partner, setPartner] = useState<ReturnPickupPartner | null>(null);
  const [resolvedPartnerId, setResolvedPartnerId] = useState<string>("");
  const [isPartnerLookupCompleted, setIsPartnerLookupCompleted] =
    useState<boolean>(false);

  const [selectedAttemptId, setSelectedAttemptId] = useState<string>("");
  const [failureReasonByAttemptId, setFailureReasonByAttemptId] = useState<
    Record<string, string>
  >({});

  const [filter, setFilter] = useState<AgentPickupFilter>("ALL");
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [updatingAttemptId, setUpdatingAttemptId] = useState<string>("");

  const loadAssignedPickups = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setIsPartnerLookupCompleted(false);

      const currentPartner = await returnPickupService.getPickupPartnerByUser({
        partnerId: mappedPartnerId,
        email: agentUser?.email,
        phone: agentUser?.phone ?? agentUser?.mobile,
        name: agentUser?.name,
      });

      const finalPartnerId = currentPartner?.partnerId ?? mappedPartnerId;

      setPartner(currentPartner);
      setResolvedPartnerId(finalPartnerId);

      if (!finalPartnerId) {
        setRecords([]);
        setSelectedAttemptId("");
        return;
      }

      const [attempts, allReturns] = await Promise.all([
        returnPickupService.getAttemptsByPartnerId(finalPartnerId),
        returnRequestService.getReturnRequests(),
      ]);

      const mappedRecords = attempts
        .map((attempt) => {
          const matchingRequest = allReturns.find(
            (request) =>
              request.returnRequestId === attempt.returnRequestId ||
              request.requestId === attempt.requestId,
          );

          if (!matchingRequest) {
            return null;
          }

          return {
            attempt,
            request: matchingRequest,
          };
        })
        .filter((record): record is AgentPickupRecord => Boolean(record));

      setRecords(mappedRecords);

      setSelectedAttemptId((previousSelectedAttemptId) => {
        if (
          previousSelectedAttemptId &&
          mappedRecords.some(
            (record) => record.attempt.id === previousSelectedAttemptId,
          )
        ) {
          return previousSelectedAttemptId;
        }

        return mappedRecords[0]?.attempt.id ?? "";
      });
    } catch {
      showToast(
        "Assigned pickups load failed",
        "Unable to load assigned return pickup tasks.",
        "danger",
      );

      setRecords([]);
      setPartner(null);
      setResolvedPartnerId("");
      setSelectedAttemptId("");
    } finally {
      setIsPartnerLookupCompleted(true);
      setIsLoading(false);
    }
  }, [
    agentUser?.email,
    agentUser?.mobile,
    agentUser?.name,
    agentUser?.phone,
    mappedPartnerId,
    showToast,
  ]);

  useEffect(() => {
    void loadAssignedPickups();
  }, [loadAssignedPickups]);

  const summary = useMemo(() => {
    return {
      total: records.length,
      scheduled: records.filter(
        (record) => record.attempt.status === "SCHEDULED",
      ).length,
      outForPickup: records.filter(
        (record) => record.attempt.status === "OUT_FOR_PICKUP",
      ).length,
      pickedUp: records.filter(
        (record) => record.attempt.status === "PICKED_UP",
      ).length,
      failed: records.filter(
        (record) => record.attempt.status === "FAILED_ATTEMPT",
      ).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return records.filter((record) => {
      if (filter !== "ALL" && record.attempt.status !== filter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        record.attempt.attemptId,
        record.attempt.returnRequestId,
        record.attempt.orderId,
        record.request.userName ?? "",
        record.request.pickupAddress ?? "",
        record.request.returnReason ?? record.request.reason,
        record.attempt.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [records, filter, searchText]);

  const selectedRecord = useMemo(() => {
    if (filteredRecords.length === 0) {
      return null;
    }

    if (!selectedAttemptId) {
      return filteredRecords[0];
    }

    return (
      filteredRecords.find(
        (record) => record.attempt.id === selectedAttemptId,
      ) ?? filteredRecords[0]
    );
  }, [filteredRecords, selectedAttemptId]);

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setSelectedAttemptId("");
      return;
    }

    const selectedStillExists = filteredRecords.some(
      (record) => record.attempt.id === selectedAttemptId,
    );

    if (!selectedAttemptId || !selectedStillExists) {
      setSelectedAttemptId(filteredRecords[0].attempt.id);
    }
  }, [filteredRecords, selectedAttemptId]);

  const isFilterActive = useMemo(() => {
    return Boolean(searchText.trim()) || filter !== "ALL";
  }, [searchText, filter]);

  const updateAttemptInState = (
    updatedAttempt: ReturnPickupAttempt,
    updatedRequest: ReturnRequest,
  ): void => {
    setRecords((previousRecords) =>
      previousRecords.map((record) =>
        record.attempt.id === updatedAttempt.id
          ? {
              attempt: updatedAttempt,
              request: updatedRequest,
            }
          : record,
      ),
    );

    setSelectedAttemptId(updatedAttempt.id);
  };

  const handleSelectRecord = (record: AgentPickupRecord): void => {
    setSelectedAttemptId(record.attempt.id);

    const sidePanelElement = document.querySelector(".agent-proof-side-panel");

    if (sidePanelElement) {
      sidePanelElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleMarkOutForPickup = async (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
  ): Promise<void> => {
    try {
      setUpdatingAttemptId(attempt.id);

      const result = await returnPickupService.markOutForPickup({
        request,
        attempt,
        remarks: "Pickup agent is out for pickup.",
      });

      updateAttemptInState(result.attempt, result.request);
      showToast("Pickup updated", "Marked as out for pickup.", "success");
    } catch {
      showToast("Update failed", "Unable to mark out for pickup.", "danger");
    } finally {
      setUpdatingAttemptId("");
    }
  };

  const handleMarkPickedUp = async (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
    currentPartner?: ReturnPickupPartner | null,
  ): Promise<void> => {
    try {
      setUpdatingAttemptId(attempt.id);

      const result = await returnPickupService.markPickedUp({
        request,
        attempt,
        partner: currentPartner,
        remarks: "Return package picked up by pickup agent.",
      });

      updateAttemptInState(result.attempt, result.request);
      showToast(
        "Pickup completed",
        "Return package marked picked up.",
        "success",
      );
    } catch {
      showToast("Update failed", "Unable to mark picked up.", "danger");
    } finally {
      setUpdatingAttemptId("");
    }
  };

  const handleMarkFailedAttempt = async (
    request: ReturnRequest,
    attempt: ReturnPickupAttempt,
    failureReason: string,
  ): Promise<void> => {
    try {
      setUpdatingAttemptId(attempt.id);

      const result = await returnPickupService.markFailedAttempt({
        request,
        attempt,
        failureReason,
      });

      updateAttemptInState(result.attempt, result.request);
      showToast(
        "Pickup failed",
        "Failed attempt has been recorded.",
        "warning",
      );
    } catch {
      showToast("Update failed", "Unable to record failed attempt.", "danger");
    } finally {
      setUpdatingAttemptId("");
    }
  };

  // ✅ Fixed computed object property assignment
  const handleFailureReasonChange = (
    attemptDbId: string,
    value: string,
  ): void => {
    setFailureReasonByAttemptId((previousValues) => ({
      ...previousValues,
      [attemptDbId]: value,
    }));
  };

  if (isLoading) {
    return (
      <main className="agent-return-pickups-page bg-light">
        <div className="container-fluid py-5">
          <Loader message="Loading assigned return pickups..." />
        </div>
      </main>
    );
  }

  if (!isLoading && isPartnerLookupCompleted && !resolvedPartnerId) {
    return (
      <main className="agent-return-pickups-page bg-light">
        <section className="container-fluid py-5">
          <div className="alert alert-warning">
            Your user account is not mapped to a pickup partner ID.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="agent-return-pickups-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container-fluid py-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3">
            <div>
              <h1 className="fw-bold mb-1">Assigned Return Pickups</h1>

              <p className="text-muted mb-0">
                View and update return pickup tasks assigned to{" "}
                <strong>
                  {partner?.name ?? resolvedPartnerId ?? mappedPartnerId}
                </strong>
                .
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary support-agent-header-btn"
              onClick={() => void loadAssignedPickups()}
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
            <div className="agent-summary-card shadow-sm">
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="agent-summary-card shadow-sm">
              <span>Scheduled</span>
              <strong>{summary.scheduled}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="agent-summary-card shadow-sm">
              <span>Out For Pickup</span>
              <strong>{summary.outForPickup}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="agent-summary-card shadow-sm">
              <span>Picked Up</span>
              <strong>{summary.pickedUp}</strong>
            </div>
          </div>

          <div className="col-md">
            <div className="agent-summary-card shadow-sm">
              <span>Failed</span>
              <strong>{summary.failed}</strong>
            </div>
          </div>
        </div>

        <div className="support-ticket-toolbar bg-white border rounded-3 shadow-sm p-3 mb-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-6">
              <label className="form-label fw-semibold small">Search</label>

              <input
                className="form-control"
                placeholder="Search return, order, customer, address..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <label className="form-label fw-semibold small">Status</label>

              <select
                className="form-select"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as AgentPickupFilter)
                }
              >
                <option value="ALL">All</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="OUT_FOR_PICKUP">Out For Pickup</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="FAILED_ATTEMPT">Failed Attempt</option>
                <option value="RESCHEDULED">Rescheduled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="col-lg-3">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                disabled={!isFilterActive}
                onClick={() => {
                  setSearchText("");
                  setFilter("ALL");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState
            title="No assigned return pickups"
            message="No return pickup tasks match the selected filters."
            iconClassName="bi bi-truck text-primary"
          />
        ) : (
          <div className="row g-3 align-items-start">
            <div className="col-xl-6">
              <div className="d-flex flex-column gap-3">
                {filteredRecords.map((record) => {
                  const isSelected =
                    selectedRecord?.attempt.id === record.attempt.id;

                  return (
                    <div key={record.attempt.id}>
                      <AgentReturnPickupCard
                        request={record.request}
                        attempt={record.attempt}
                        partner={partner}
                        isSelected={isSelected}
                        isUpdating={updatingAttemptId === record.attempt.id}
                        failureReason={
                          failureReasonByAttemptId[record.attempt.id] ?? ""
                        }
                        onFailureReasonChange={handleFailureReasonChange}
                        onMarkOutForPickup={handleMarkOutForPickup}
                        onMarkPickedUp={handleMarkPickedUp}
                        onMarkFailedAttempt={handleMarkFailedAttempt}
                        onSelectForProof={() => handleSelectRecord(record)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-xl-6">
              <div className="agent-proof-side-panel">
                {selectedRecord ? (
                  <ReturnPackageTrackingPanel
                    key={
                      selectedRecord.request.id ??
                      selectedRecord.request.returnRequestId
                    }
                    request={{
                      id: selectedRecord.request.id,
                      requestId: selectedRecord.request.requestId,
                      returnRequestId: selectedRecord.request.returnRequestId,
                      orderId: selectedRecord.request.orderId,
                      pickupPartnerId: selectedRecord.request.pickupPartnerId,
                      pickupPartnerName:
                        selectedRecord.request.pickupPartnerName,
                    }}
                    currentUser={
                      currentUser
                        ? {
                            id: currentUser.id,
                            name: currentUser.name,
                          }
                        : null
                    }
                    canUpdateTracking={false}
                    canUploadProof
                    canVerifyProof={false}
                  />
                ) : (
                  <div className="bg-white border rounded-4 p-4 text-muted">
                    Select a pickup task to upload or view pickup proof.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AgentReturnPickupsPage;
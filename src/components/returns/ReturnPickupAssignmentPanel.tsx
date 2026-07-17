import { useMemo, useState } from "react";
import type { ReturnRequest } from "../../types/returnRequest";
import type {
  ReturnPickupAttempt,
  ReturnPickupPartner,
} from "../../types/returnPickup";
import {
  canAssignPickupPartner,
  canMarkFailedAttempt,
  canMarkOutForPickup,
  canMarkPickedUp,
  canReschedulePickup,
  formatPickupLabel,
  getLatestPickupAttempt,
  getPickupPartnerStatusBadgeClass,
} from "../../utils/returnPickupUtils";
import { pickupSlotOptions } from "../../utils/returnWorkflowUtils";
import PickupAttemptHistory from "./PickupAttemptHistory";

interface ReturnPickupAssignmentPanelProps {
  request: ReturnRequest;
  partners: ReturnPickupPartner[];
  attempts: ReturnPickupAttempt[];
  isUpdating?: boolean;
  onAssignPartner: ({
    request,
    partner,
    pickupDate,
    pickupSlot,
    remarks,
  }: {
    request: ReturnRequest;
    partner: ReturnPickupPartner;
    pickupDate: string;
    pickupSlot: string;
    remarks?: string;
  }) => Promise<void>;
  onMarkOutForPickup: ({
    request,
    attempt,
    remarks,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    remarks?: string;
  }) => Promise<void>;
  onMarkPickedUp: ({
    request,
    attempt,
    partner,
    remarks,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    partner?: ReturnPickupPartner | null;
    remarks?: string;
  }) => Promise<void>;
  onMarkFailedAttempt: ({
    request,
    attempt,
    failureReason,
  }: {
    request: ReturnRequest;
    attempt: ReturnPickupAttempt;
    failureReason: string;
  }) => Promise<void>;
  onReschedulePickup: ({
    request,
    previousAttempt,
    partner,
    pickupDate,
    pickupSlot,
    remarks,
  }: {
    request: ReturnRequest;
    previousAttempt?: ReturnPickupAttempt | null;
    partner: ReturnPickupPartner;
    pickupDate: string;
    pickupSlot: string;
    remarks?: string;
  }) => Promise<void>;
}

const ReturnPickupAssignmentPanel = ({
  request,
  partners,
  attempts,
  isUpdating = false,
  onAssignPartner,
  onMarkOutForPickup,
  onMarkPickedUp,
  onMarkFailedAttempt,
  onReschedulePickup,
}: ReturnPickupAssignmentPanelProps) => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    request.pickupPartnerId ?? "",
  );
  const [pickupDate, setPickupDate] = useState<string>(
    request.pickupDate?.slice(0, 10) ?? "",
  );
  const [pickupSlot, setPickupSlot] = useState<string>(
    request.pickupSlot ?? pickupSlotOptions[0],
  );
  const [remarks, setRemarks] = useState<string>("");
  const [failureReason, setFailureReason] = useState<string>("");

  const minSelectableDate = useMemo(() => {
    return new Date().toISOString().slice(0, 10);
  }, []);

  const latestAttempt = useMemo(() => {
    return getLatestPickupAttempt(attempts);
  }, [attempts]);

  const selectedPartner = useMemo(() => {
    return (
      partners.find((partner) => partner.partnerId === selectedPartnerId) ??
      null
    );
  }, [partners, selectedPartnerId]);

  const currentPartner = useMemo(() => {
    return (
      partners.find(
        (partner) => partner.partnerId === request.pickupPartnerId,
      ) ?? selectedPartner
    );
  }, [partners, request.pickupPartnerId, selectedPartner]);

  const canAssign =
    selectedPartner !== null &&
    canAssignPickupPartner({ partner: selectedPartner }) &&
    pickupDate.trim().length > 0 &&
    (request.status === "APPROVED" ||
      request.pickupStatus === "NOT_SCHEDULED" ||
      request.pickupStatus === "FAILED_ATTEMPT");

  return (
    <div className="return-pickup-assignment-panel border rounded-4 p-3 mt-3">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Pickup Partner Simulation</h6>
          <p className="text-muted small mb-0">
            Assign partner, mark out for pickup, record pickup success, failed
            attempt, or reschedule.
          </p>
        </div>

        <span className="badge text-bg-light border align-self-start">
          {formatPickupLabel(request.pickupStatus ?? "NOT_SCHEDULED")}
        </span>
      </div>

      {request.pickupPartnerName && request.pickupStatus !== "NOT_SCHEDULED" ? (
        <div className="alert alert-light border small mb-3">
          Assigned Partner: <strong>{request.pickupPartnerName}</strong>
          {request.pickupPartnerPhone ? (
            <>
              {" "}
              · Phone: <strong>{request.pickupPartnerPhone}</strong>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="row g-3 mb-3">
        <div className="col-lg-4">
          <label className="form-label fw-semibold small">Pickup Partner</label>

          <select
            className="form-select"
            value={selectedPartnerId}
            disabled={isUpdating}
            onChange={(event) => setSelectedPartnerId(event.target.value)}
          >
            <option value="">Select partner</option>

            {partners.map((partner) => (
              <option value={partner.partnerId} key={partner.id}>
                {partner.name} · {partner.city} · {partner.activePickupCount}/
                {partner.maxDailyCapacity}
              </option>
            ))}
          </select>
        </div>

        <div className="col-lg-4">
          <label className="form-label fw-semibold small">Pickup Date</label>

          <input
            type="date"
            className="form-control"
            min={minSelectableDate}
            value={pickupDate}
            disabled={isUpdating}
            onChange={(event) => setPickupDate(event.target.value)}
          />
        </div>

        <div className="col-lg-4">
          <label className="form-label fw-semibold small">Pickup Slot</label>

          <select
            className="form-select"
            value={pickupSlot}
            disabled={isUpdating}
            onChange={(event) => setPickupSlot(event.target.value)}
          >
            {pickupSlotOptions.map((slot) => (
              <option value={slot} key={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold small">Remarks</label>

          <input
            className="form-control"
            placeholder="Pickup assignment or reschedule note"
            value={remarks}
            disabled={isUpdating}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </div>
      </div>

      {selectedPartner ? (
        <div className="return-pickup-partner-preview mb-3">
          <div>
            <strong>{selectedPartner.name}</strong>
            <p className="small text-muted mb-0">
              {selectedPartner.phone} · {selectedPartner.city}
            </p>
          </div>

          <span
            className={`badge ${getPickupPartnerStatusBadgeClass(
              selectedPartner.status,
            )}`}
          >
            {formatPickupLabel(selectedPartner.status)}
          </span>
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          disabled={isUpdating || !canAssign || !selectedPartner}
          onClick={() => {
            if (!selectedPartner) {
              return;
            }

            void onAssignPartner({
              request,
              partner: selectedPartner,
              pickupDate: new Date(pickupDate).toISOString(),
              pickupSlot,
              remarks: remarks.trim() || undefined,
            });
          }}
        >
          Assign Partner
        </button>

        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={
            isUpdating || !latestAttempt || !canMarkOutForPickup(latestAttempt)
          }
          onClick={() => {
            if (!latestAttempt) {
              return;
            }

            void onMarkOutForPickup({
              request,
              attempt: latestAttempt,
              remarks: remarks.trim() || undefined,
            });
          }}
        >
          Mark Out For Pickup
        </button>

        <button
          type="button"
          className="btn btn-sm btn-success"
          disabled={
            isUpdating || !latestAttempt || !canMarkPickedUp(latestAttempt)
          }
          onClick={() => {
            if (!latestAttempt) {
              return;
            }

            void onMarkPickedUp({
              request,
              attempt: latestAttempt,
              partner: currentPartner,
              remarks: remarks.trim() || undefined,
            });
          }}
        >
          Mark Picked Up
        </button>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={
            isUpdating ||
            !latestAttempt ||
            !canReschedulePickup(latestAttempt) ||
            !selectedPartner ||
            !pickupDate
          }
          onClick={() => {
            if (!selectedPartner) {
              return;
            }

            void onReschedulePickup({
              request,
              previousAttempt: latestAttempt,
              partner: selectedPartner,
              pickupDate: new Date(pickupDate).toISOString(),
              pickupSlot,
              remarks: remarks.trim() || undefined,
            });
          }}
        >
          Reschedule Pickup
        </button>
      </div>

      <div className="border-top pt-3 mb-3">
        <label className="form-label fw-semibold small">
          Failed Attempt Reason
        </label>

        <div className="return-failed-attempt-control">
          <input
            className="form-control return-failed-attempt-input"
            placeholder="Customer unavailable, address issue, package not ready..."
            value={failureReason}
            disabled={isUpdating}
            onChange={(event) => setFailureReason(event.target.value)}
          />

          <button
            type="button"
            className="btn btn-outline-danger return-failed-attempt-btn"
            disabled={
              isUpdating ||
              !latestAttempt ||
              !canMarkFailedAttempt(latestAttempt) ||
              failureReason.trim().length === 0
            }
            onClick={() => {
              if (!latestAttempt) {
                return;
              }

              void onMarkFailedAttempt({
                request,
                attempt: latestAttempt,
                failureReason: failureReason.trim(),
              });
            }}
          >
            Mark Failed
          </button>
        </div>
      </div>

      <PickupAttemptHistory attempts={attempts} />
    </div>
  );
};

export default ReturnPickupAssignmentPanel;

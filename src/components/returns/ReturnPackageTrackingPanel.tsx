import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { returnPackageTrackingService } from "../../services/returnPackageTrackingService";
import type {
  ReturnPackageTrackingEvent,
  ReturnPackageTrackingStatus,
  ReturnPickupPackageCondition,
  ReturnPickupProof,
} from "../../types/returnPackageTracking";
import {
  fileToDataUrl,
  formatReturnTrackingStatus,
  getDefaultTrackingDescription,
  getDefaultTrackingTitle,
  getLatestReturnTrackingEvent,
  returnPackageTrackingStatusOptions,
  returnPickupPackageConditionOptions,
} from "../../utils/returnPackageTrackingUtils";
import ReturnPackageTrackingTimeline from "./ReturnPackageTrackingTimeline";
import ReturnPickupProofVerificationPanel from "./ReturnPickupProofVerificationPanel";

export interface TrackableReturnRequest {
  id: string;
  requestId?: string;
  returnRequestId?: string;
  orderId?: string | null;
  pickupPartnerId?: string | null;
  pickupPartnerName?: string | null;
  pickupAgentName?: string | null;
}

interface ReturnPackageTrackingPanelProps {
  request: TrackableReturnRequest;
  currentUser?: {
    id: string;
    name: string;
  } | null;
  canUpdateTracking?: boolean;
  canUploadProof?: boolean;
  canVerifyProof?: boolean;
}

const ReturnPackageTrackingPanel = ({
  request,
  currentUser = null,
  canUpdateTracking = false,
  canUploadProof = false,
  canVerifyProof = false,
}: ReturnPackageTrackingPanelProps) => {
  const returnRequestId =
    request.returnRequestId ?? request.requestId ?? request.id;

  const [events, setEvents] = useState<ReturnPackageTrackingEvent[]>([]);
  const [proofs, setProofs] = useState<ReturnPickupProof[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [trackingStatus, setTrackingStatus] =
    useState<ReturnPackageTrackingStatus>("PICKUP_COMPLETED");
  const [trackingLocation, setTrackingLocation] = useState<string>("");
  const [trackingDescription, setTrackingDescription] = useState<string>("");

  const [packageCondition, setPackageCondition] =
    useState<ReturnPickupPackageCondition>("SEALED");
  const [otpVerified, setOtpVerified] = useState<boolean>(true);
  const [signatureCaptured, setSignatureCaptured] = useState<boolean>(true);
  const [customerRemarks, setCustomerRemarks] = useState<string>("");
  const [agentRemarks, setAgentRemarks] = useState<string>("");
  const [pickupLocation, setPickupLocation] = useState<string>("");
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofImageDataUrl, setProofImageDataUrl] = useState<string | null>(
    null,
  );
  const [fileInputKey, setFileInputKey] = useState<number>(0);

  const loadTrackingDetails = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [trackingEvents, pickupProofs] = await Promise.all([
        returnPackageTrackingService.getTrackingEventsByReturnRequestId(
          returnRequestId,
        ),
        returnPackageTrackingService.getPickupProofsByReturnRequestId(
          returnRequestId,
        ),
      ]);

      setEvents(trackingEvents);
      setProofs(pickupProofs);
    } catch {
      setErrorMessage(
        "Unable to load return package tracking details. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [returnRequestId]);

  useEffect(() => {
    void loadTrackingDetails();
  }, [loadTrackingDetails]);

  useEffect(() => {
    setTrackingDescription(getDefaultTrackingDescription(trackingStatus));
  }, [trackingStatus]);

  const latestEvent = getLatestReturnTrackingEvent(events);

  const resetProofFileInput = (): void => {
    setProofFileName(null);
    setProofImageDataUrl(null);
    setFileInputKey((previousKey) => previousKey + 1);
  };

  const handleProofFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];

    if (!file) {
      resetProofFileInput();
      return;
    }

    if (!file.type.startsWith("image/")) {
      resetProofFileInput();
      setErrorMessage("Please upload only image files for pickup proof.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      resetProofFileInput();
      setErrorMessage("Pickup proof image should be less than 3 MB.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);

      setProofFileName(file.name);
      setProofImageDataUrl(dataUrl);
      setErrorMessage("");
    } catch {
      resetProofFileInput();
      setErrorMessage("Unable to read selected pickup proof image.");
    }
  };

  const handleAddTrackingEvent = async (): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Login is required to update return package tracking.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const title = getDefaultTrackingTitle(trackingStatus);

      const createdEvent =
        await returnPackageTrackingService.createTrackingEvent({
          returnRequestId,
          orderId: request.orderId ?? null,
          status: trackingStatus,
          title,
          description:
            trackingDescription.trim() ||
            getDefaultTrackingDescription(trackingStatus),
          location: trackingLocation.trim() || null,
          handledByUserId: currentUser.id,
          handledByName: currentUser.name,
        });

      setEvents((previousEvents) => [...previousEvents, createdEvent]);
      setTrackingLocation("");
      setTrackingDescription(getDefaultTrackingDescription(trackingStatus));
    } catch {
      setErrorMessage("Unable to add tracking event.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadPickupProof = async (): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Login is required to upload pickup proof.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const createdProof = await returnPackageTrackingService.createPickupProof(
        {
          returnRequestId,
          orderId: request.orderId ?? null,
          pickupPartnerId: request.pickupPartnerId ?? null,
          pickupPartnerName: request.pickupPartnerName ?? null,
          pickupAgentName: request.pickupAgentName ?? currentUser.name,
          packageCondition,
          packagePhotoDataUrl: proofImageDataUrl,
          packagePhotoFileName: proofFileName,
          otpVerified,
          customerSignatureCaptured: signatureCaptured,
          customerRemarks: customerRemarks.trim() || null,
          agentRemarks: agentRemarks.trim() || null,
          pickupLocation: pickupLocation.trim() || null,
          uploadedByUserId: currentUser.id,
          uploadedByName: currentUser.name,
        },
      );

      const trackingEvent =
        await returnPackageTrackingService.createTrackingEvent({
          returnRequestId,
          orderId: request.orderId ?? null,
          status: "PICKUP_COMPLETED",
          title: "Pickup Proof Uploaded",
          description: "Pickup proof was uploaded and is pending verification.",
          location: pickupLocation.trim() || null,
          handledByUserId: currentUser.id,
          handledByName: currentUser.name,
        });

      setProofs((previousProofs) => [createdProof, ...previousProofs]);
      setEvents((previousEvents) => [...previousEvents, trackingEvent]);

      setPackageCondition("SEALED");
      setOtpVerified(true);
      setSignatureCaptured(true);
      setCustomerRemarks("");
      setAgentRemarks("");
      setPickupLocation("");
      resetProofFileInput();
    } catch {
      setErrorMessage("Unable to upload pickup proof.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleVerifyProof = async (proof: ReturnPickupProof): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Login is required to verify pickup proof.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const updatedProof = await returnPackageTrackingService.verifyPickupProof(
        proof.id,
        {
          verifiedByUserId: currentUser.id,
          verifiedByName: currentUser.name,
        },
      );

      const trackingEvent =
        await returnPackageTrackingService.createTrackingEvent({
          returnRequestId,
          orderId: request.orderId ?? null,
          status: "IN_TRANSIT_TO_HUB",
          title: "Pickup Proof Verified",
          description:
            "Pickup proof was verified. Return package is ready for transit.",
          location: proof.pickupLocation ?? null,
          handledByUserId: currentUser.id,
          handledByName: currentUser.name,
        });

      setProofs((previousProofs) =>
        previousProofs.map((currentProof) =>
          currentProof.id === updatedProof.id ? updatedProof : currentProof,
        ),
      );

      setEvents((previousEvents) => [...previousEvents, trackingEvent]);
    } catch {
      setErrorMessage("Unable to verify pickup proof.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectProof = async (
    proof: ReturnPickupProof,
    rejectionReason: string,
  ): Promise<void> => {
    if (!currentUser) {
      setErrorMessage("Login is required to reject pickup proof.");
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage("");

      const updatedProof = await returnPackageTrackingService.rejectPickupProof(
        proof.id,
        {
          verifiedByUserId: currentUser.id,
          verifiedByName: currentUser.name,
          rejectionReason,
        },
      );

      const trackingEvent =
        await returnPackageTrackingService.createTrackingEvent({
          returnRequestId,
          orderId: request.orderId ?? null,
          status: "PICKUP_ATTEMPTED",
          title: "Pickup Proof Rejected",
          description: `Pickup proof rejected: ${rejectionReason}`,
          location: proof.pickupLocation ?? null,
          handledByUserId: currentUser.id,
          handledByName: currentUser.name,
        });

      setProofs((previousProofs) =>
        previousProofs.map((currentProof) =>
          currentProof.id === updatedProof.id ? updatedProof : currentProof,
        ),
      );

      setEvents((previousEvents) => [...previousEvents, trackingEvent]);
    } catch {
      setErrorMessage("Unable to reject pickup proof.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="return-package-tracking-panel border rounded-4 p-3">
        <div className="d-flex align-items-center gap-2">
          <span className="spinner-border spinner-border-sm" />
          <span className="text-muted small">
            Loading return package tracking...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="return-package-tracking-panel border shadow-sm p-3">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Return Package Tracking</h6>

          <p className="text-muted small mb-0">
            Track pickup proof, package movement, and warehouse delivery.
          </p>
        </div>

        {latestEvent ? (
          <span className="badge text-bg-light border align-self-start">
            Latest: {formatReturnTrackingStatus(latestEvent.status)}
          </span>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="alert alert-danger small" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="row g-3">
        <div className="col-xl-12">
          <div className="return-tracking-section">
            <h6 className="fw-bold mb-3">Package Tracking Timeline</h6>

            <ReturnPackageTrackingTimeline events={events} />
          </div>
        </div>

        <div className="col-xl-12">
          <div className="return-tracking-section">
            <h6 className="fw-bold mb-3">Pickup Proof Verification</h6>

            <ReturnPickupProofVerificationPanel
              proofs={proofs}
              canVerifyProof={canVerifyProof}
              isUpdating={isUpdating}
              onVerifyProof={handleVerifyProof}
              onRejectProof={handleRejectProof}
            />
          </div>
        </div>
      </div>

      {canUpdateTracking ? (
        <div className="return-tracking-section mt-3">
          <h6 className="fw-bold mb-3">Add Tracking Update</h6>

          <div className="return-tracking-form-stack">
            <div>
              <label className="form-label small fw-semibold">
                Tracking Status
              </label>

              <select
                className="form-select"
                value={trackingStatus}
                disabled={isUpdating}
                onChange={(event) =>
                  setTrackingStatus(
                    event.target.value as ReturnPackageTrackingStatus,
                  )
                }
              >
                {returnPackageTrackingStatusOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label small fw-semibold">Location</label>

              <input
                className="form-control"
                value={trackingLocation}
                disabled={isUpdating}
                placeholder="Hub, warehouse, city"
                onChange={(event) => setTrackingLocation(event.target.value)}
              />
            </div>

            <div>
              <label className="form-label small fw-semibold">
                Description
              </label>

              <textarea
                className="form-control"
                rows={3}
                value={trackingDescription}
                disabled={isUpdating}
                placeholder="Describe package movement or return status"
                onChange={(event) => setTrackingDescription(event.target.value)}
              />
            </div>

            <div>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100 return-tracking-action-btn"
                disabled={isUpdating}
                onClick={() => void handleAddTrackingEvent()}
              >
                <i className="bi bi-plus-circle me-1" />
                Add Tracking Event
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {canUploadProof ? (
        <div className="return-tracking-section mt-3">
          <h6 className="fw-bold mb-3">Upload Pickup Proof</h6>

          <div className="return-tracking-form-stack">
            <div>
              <label className="form-label small fw-semibold">
                Package Condition
              </label>

              <select
                className="form-select"
                value={packageCondition}
                disabled={isUpdating}
                onChange={(event) =>
                  setPackageCondition(
                    event.target.value as ReturnPickupPackageCondition,
                  )
                }
              >
                {returnPickupPackageConditionOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label small fw-semibold">
                Pickup Location
              </label>

              <input
                className="form-control"
                value={pickupLocation}
                disabled={isUpdating}
                placeholder="Customer address / pickup location"
                onChange={(event) => setPickupLocation(event.target.value)}
              />
            </div>

            <div>
              <label className="form-label small fw-semibold">
                Package Photo
              </label>

              <div className="file-upload">
                <input
                  key={fileInputKey}
                  type="file"
                  className="form-control"
                  multiple
                  accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf,text/plain,.doc,.docx"
                  disabled={isUpdating}
                  onChange={(event) => void handleProofFileChange(event)}
                />
                <div className="form-text">
                  Upload files. Supported: images, PDF, DOC, DOCX, TXT.
                </div>
              </div>
            </div>

            <div className="return-proof-check-grid">
              <div className="form-check border rounded-3 p-3">
                <input
                  id={`otpVerified-${returnRequestId}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={otpVerified}
                  disabled={isUpdating}
                  onChange={(event) => setOtpVerified(event.target.checked)}
                />

                <label
                  className="form-check-label fw-semibold"
                  htmlFor={`otpVerified-${returnRequestId}`}
                >
                  OTP verified with customer
                </label>
              </div>

              <div className="form-check border rounded-3 p-3">
                <input
                  id={`signatureCaptured-${returnRequestId}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={signatureCaptured}
                  disabled={isUpdating}
                  onChange={(event) =>
                    setSignatureCaptured(event.target.checked)
                  }
                />

                <label
                  className="form-check-label fw-semibold"
                  htmlFor={`signatureCaptured-${returnRequestId}`}
                >
                  Customer signature captured
                </label>
              </div>
            </div>

            <div>
              <label className="form-label small fw-semibold">
                Customer Remarks
              </label>

              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={customerRemarks}
                disabled={isUpdating}
                placeholder="Customer remarks during pickup"
                onChange={(event) => setCustomerRemarks(event.target.value)}
              />
            </div>

            <div>
              <label className="form-label small fw-semibold">
                Agent Remarks
              </label>

              <textarea
                className="form-control form-control-sm"
                rows={3}
                value={agentRemarks}
                disabled={isUpdating}
                placeholder="Pickup agent remarks"
                onChange={(event) => setAgentRemarks(event.target.value)}
              />
            </div>

            {proofImageDataUrl ? (
              <div className="return-proof-preview">
                <img
                  src={proofImageDataUrl}
                  alt="Selected pickup proof preview"
                />

                <span>{proofFileName}</span>
              </div>
            ) : null}

            <div>
              <button
                type="button"
                className="btn btn-sm btn-primary w-100 return-tracking-action-btn"
                disabled={isUpdating}
                onClick={() => void handleUploadPickupProof()}
              >
                <i className="bi bi-cloud-upload me-1" />
                Upload Pickup Proof
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReturnPackageTrackingPanel;

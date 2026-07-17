import { useEffect, useMemo, useState } from "react";
import SupportTeamAssignmentPicker from "./SupportTeamAssignmentPicker";
import SupportEscalationEvidencePanel from "./SupportEscalationEvidencePanel";
import SupportEscalationResolutionGuide from "./SupportEscalationResolutionGuide";
import type { CustomerSupportTicket } from "../../types/customerSupport";
import type { CouponRedemption } from "../../types/couponRedemption";
import type { Order } from "../../types/order";
import type { PaymentTransaction } from "../../types/payment";
import type { RefundRequest } from "../../types/refund";
import type { RewardTransaction } from "../../types/rewards";
import type { WalletTransaction } from "../../types/wallet";
import type {
  CreateSupportEscalationPayload,
  SupportEscalation,
  SupportEscalationPriority,
  SupportEscalationStatus,
  SupportEscalationTeam
} from "../../types/supportEscalation";
import type { SupportTeamMember } from "../../types/supportTeam";
import {
  buildDefaultEscalationReason,
  formatEscalationLabel,
  getEscalationPriorityBadgeClass,
  getEscalationStatusBadgeClass,
  hasActiveEscalation,
  isActiveEscalation,
  mapTicketPriorityToEscalationPriority,
  supportEscalationPriorityOptions,
  supportEscalationStatusOptions,
  supportEscalationTeamOptions
} from "../../utils/supportEscalationUtils";
import { getSupportTeamTextGuidance } from "../../utils/supportTicketAccessUtils";

interface SupportEscalationPanelProps {
  ticket: CustomerSupportTicket;
  escalations: SupportEscalation[];
  suggestedTeam: SupportEscalationTeam;
  recommendedAction?: string;
  currentUser: {
    id: string;
    name: string;
  } | null;
  relatedOrder?: Order | null;
  paymentTransactions?: PaymentTransaction[];
  walletTransactions?: WalletTransaction[];
  rewardTransactions?: RewardTransaction[];
  couponRedemptions?: CouponRedemption[];
  refundRequests?: RefundRequest[];
  isEvidenceLoading?: boolean;
  isTeamMemberView?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  onCreateEscalation: (payload: CreateSupportEscalationPayload) => Promise<void>;
  onUpdateEscalationStatus: ({
    escalation,
    status,
    resolutionNote
  }: {
    escalation: SupportEscalation;
    status: SupportEscalationStatus;
    resolutionNote?: string;
  }) => Promise<void>;
  onAssignEscalationToMember: ({
    escalation,
    member
  }: {
    escalation: SupportEscalation;
    member: SupportTeamMember;
  }) => Promise<void>;
}

const SupportEscalationPanel = ({
  ticket,
  escalations,
  suggestedTeam,
  recommendedAction,
  currentUser,
  relatedOrder,
  paymentTransactions = [],
  walletTransactions = [],
  rewardTransactions = [],
  couponRedemptions = [],
  refundRequests = [],
  isEvidenceLoading = false,
  isTeamMemberView = false,
  isLoading = false,
  isSaving = false,
  onCreateEscalation,
  onUpdateEscalationStatus,
  onAssignEscalationToMember
}: SupportEscalationPanelProps) => {
  const [team, setTeam] = useState<SupportEscalationTeam>(suggestedTeam);
  const [priority, setPriority] = useState<SupportEscalationPriority>(
    mapTicketPriorityToEscalationPriority(ticket)
  );
  const [reason, setReason] = useState<string>(
    buildDefaultEscalationReason({ ticket, recommendedAction })
  );

  // Tracks selected values locally per row entry before final execution save actions
  const [localStatusById, setLocalStatusById] = useState<Record<string, SupportEscalationStatus>>({});
  const [resolutionNoteById, setResolutionNoteById] = useState<Record<string, string>>({});
  const { id: ticketId, priority: ticketPriority } = ticket;

  useEffect(() => {
  setTeam(suggestedTeam);
  // Pass the primitive values if you can refactor your helper, OR read them directly
  setPriority(mapTicketPriorityToEscalationPriority(ticket)); 
  setReason(buildDefaultEscalationReason({ ticket, recommendedAction }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [ticketId, ticketPriority, suggestedTeam, recommendedAction]); // Swapped out complex ticket dependency layout for strict primitive identification

  const activeEscalationExists = useMemo(() => {
    return hasActiveEscalation(escalations);
  }, [escalations]);

  const getResolutionPlaceholder = (teamCode: SupportEscalationTeam): string => {
    return getSupportTeamTextGuidance(teamCode).resolutionNotePlaceholder;
  };

  const handleCreateEscalation = async (): Promise<void> => {
    if (!currentUser || !reason.trim()) return;

    await onCreateEscalation({
      ticketDbId: ticket.id,
      ticketNumber: ticket.ticketId,
      orderId: ticket.orderId,
      userId: ticket.userId,
      userName: ticket.userName,
      team,
      priority,
      reason: reason.trim(),
      createdByUserId: currentUser.id,
      createdByName: currentUser.name
    });
  };

  return (
    <div className="support-escalation-panel border rounded-4 p-3 mb-3">
      <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mb-3">
        <div>
          <h6 className="fw-bold mb-1">Escalation Workflow</h6>
          <p className="text-muted small mb-0">
            Route unresolved issues to the correct internal team.
          </p>
        </div>

        {activeEscalationExists ? (
          <span className="badge text-bg-danger align-self-start">
            Active Escalation
          </span>
        ) : (
          <span className="badge text-bg-light border align-self-start">
            No Active Escalation
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="d-flex align-items-center gap-2 py-3">
          <span className="spinner-border spinner-border-sm" />
          <span className="text-muted">Loading escalation details...</span>
        </div>
      ) : (
        <>
          {escalations.length > 0 ? (
            <div className="d-flex flex-column gap-2 mb-3">
              {escalations.map((escalation) => {
                const resolutionNote = resolutionNoteById[escalation.id] ?? "";
                const currentStatus = localStatusById[escalation.id] ?? escalation.status;

                return (
                  <div
                    className="support-escalation-card border rounded-4 p-3"
                    key={escalation.id}
                  >
                    <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-2">
                      <div>
                        <strong>{escalation.escalationId}</strong>
                        <p className="text-muted small mb-0">
                          {formatEscalationLabel(escalation.team)} ·{" "}
                          {new Date(escalation.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="d-flex gap-2">
                        <span
                          className={`badge align-self-start ${getEscalationStatusBadgeClass(
                            escalation.status
                          )}`}
                        >
                          {formatEscalationLabel(escalation.status)}
                        </span>

                        <span
                          className={`badge align-self-start ${getEscalationPriorityBadgeClass(
                            escalation.priority
                          )}`}
                        >
                          {formatEscalationLabel(escalation.priority)}
                        </span>
                      </div>
                    </div>

                    <p className="small text-muted mb-2">{escalation.reason}</p>

                    <SupportEscalationEvidencePanel
                      escalation={escalation}
                      ticket={ticket}
                      relatedOrder={relatedOrder}
                      paymentTransactions={paymentTransactions}
                      walletTransactions={walletTransactions}
                      rewardTransactions={rewardTransactions}
                      couponRedemptions={couponRedemptions}
                      refundRequests={refundRequests}
                      isLoading={isEvidenceLoading}
                    />

                    <SupportEscalationResolutionGuide team={escalation.team} />

                    {escalation.assignedToName ? (
                      <p className="small mb-2 mt-2">
                        Assigned To: <strong>{escalation.assignedToName}</strong>
                      </p>
                    ) : null}

                    {escalation.resolutionNote ? (
                      <div className="alert alert-success py-2 small mb-2 mt-2">
                        <strong>Resolution:</strong> {escalation.resolutionNote}
                      </div>
                    ) : null}

                    {isActiveEscalation(escalation) ? (
                      <>
                        {isTeamMemberView ? (
                          <div className="alert alert-info border small mb-3 mt-2">
                            <strong>Team member workspace:</strong> Update
                            escalation status and add resolution notes. Main ticket
                            status and final customer-facing replies are managed by
                            Support Agents.
                          </div>
                        ) : null}

                        <div className="mb-3 mt-3">
                          <SupportTeamAssignmentPicker
                            teamCode={escalation.team}
                            selectedUserId={escalation.assignedToUserId}
                            disabled={isSaving}
                            onSelectMember={(member) => {
                              if (!member) return;
                              void onAssignEscalationToMember({
                                escalation,
                                member
                              });
                            }}
                          />
                        </div>

                        {/* FIXED: Form layout handles staging selections and explicitly triggers changes on a save click button */}
                        <div className="row g-2 align-items-end">
                          <div className="col-md-4">
                            <label className="form-label small fw-semibold">
                              Update Status
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={currentStatus}
                              disabled={isSaving}
                              onChange={(event) =>
                                setLocalStatusById((prev) => ({
                                  ...prev,
                                  [escalation.id]: event.target.value as SupportEscalationStatus
                                }))
                              }
                            >
                              {supportEscalationStatusOptions.map((option) => (
                                <option value={option.value} key={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-md-5">
                            <label className="form-label small fw-semibold">
                              Resolution Note
                            </label>
                            <input
                              className="form-control form-control-sm"
                              placeholder={getResolutionPlaceholder(escalation.team)}
                              value={resolutionNote}
                              disabled={isSaving}
                              onChange={(event) =>
                                setResolutionNoteById((previousValues) => ({
                                  ...previousValues,
                                  [escalation.id]: event.target.value
                                }))
                              }
                            />
                          </div>

                          <div className="col-md-3">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary w-100"
                              disabled={isSaving || (currentStatus === "RESOLVED" && !resolutionNote.trim())}
                              onClick={() =>
                                void onUpdateEscalationStatus({
                                  escalation,
                                  status: currentStatus,
                                  resolutionNote: resolutionNote.trim()
                                })
                              }
                            >
                              Save Status
                            </button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}

          {!activeEscalationExists ? (
            <div className="support-escalation-create-box border rounded-4 p-3">
              <h6 className="fw-bold mb-3">Create Escalation</h6>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Team</label>
                  <select
                    className="form-select"
                    value={team}
                    disabled={isSaving}
                    onChange={(event) =>
                      setTeam(event.target.value as SupportEscalationTeam)
                    }
                  >
                    {supportEscalationTeamOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    disabled={isSaving}
                    onChange={(event) =>
                      setPriority(event.target.value as SupportEscalationPriority)
                    }
                  >
                    {supportEscalationPriorityOptions.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Reason</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    disabled={isSaving}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-danger w-100 mt-3"
                disabled={!reason.trim() || isSaving || !currentUser}
                onClick={() => void handleCreateEscalation()}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating Escalation...
                  </>
                ) : (
                  <>
                    <i className="bi bi-exclamation-triangle me-2" />
                    Create Escalation
                  </>
                )}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default SupportEscalationPanel;
import { agentPayoutService } from "../../services/agentPayoutService";
import type { AgentPayoutRow } from "../../types/agentPayout";

type AgentPayoutTableProps = {
  rows: AgentPayoutRow[];
  isSavingAgentId?: string | null;
  onGeneratePayout: (row: AgentPayoutRow) => Promise<void>;
};

const formatLabel = (value?: string): string => {
  if (!value) {
    return "Not Available";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getRiskBadgeClass = (riskLevel: string): string => {
  if (riskLevel === "HIGH") {
    return "text-bg-danger";
  }

  if (riskLevel === "MEDIUM") {
    return "text-bg-warning text-dark";
  }

  return "text-bg-success";
};

const getStatusBadgeClass = (status: string): string => {
  if (status === "READY_FOR_APPROVAL") {
    return "text-bg-info";
  }

  if (status === "ON_HOLD") {
    return "text-bg-warning text-dark";
  }

  if (status === "APPROVED" || status === "PAID") {
    return "text-bg-success";
  }

  return "text-bg-secondary";
};

const AgentPayoutTable = ({
  rows,
  isSavingAgentId,
  onGeneratePayout
}: AgentPayoutTableProps) => {
  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-1">Agent Payout Details</h5>
        <p className="text-muted small mb-3">
          Agent-wise payout calculation from completed tasks, attempts, SLA
          bonus, proof bonus, and proof rejection penalty.
        </p>

        {rows.length === 0 ? (
          <div className="alert alert-light border mb-0">
            No payout rows match the selected filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Tasks</th>
                  <th>Proofs</th>
                  <th>Earnings</th>
                  <th>Bonus / Allowance</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const isSaving = isSavingAgentId === row.agentId;

                  return (
                    <tr key={row.agentId}>
                      <td>
                        <div className="fw-semibold">{row.agentName}</div>
                        <div className="small text-muted">{row.agentId}</div>
                        <div className="small text-muted">
                          {formatLabel(row.agentType)}
                          {row.agentPhone ? ` · ${row.agentPhone}` : ""}
                        </div>
                        <span
                          className={`badge mt-1 ${getRiskBadgeClass(
                            row.riskLevel
                          )}`}
                        >
                          {row.riskLevel}
                        </span>
                      </td>

                      <td>
                        <div>Pickups: {row.completedPickups}</div>
                        <div>Deliveries: {row.completedDeliveries}</div>
                        <div className="small text-muted">
                          Failed attempts: {row.failedAttempts}
                        </div>
                      </td>

                      <td>
                        <div>Verified: {row.verifiedProofs}</div>
                        <div>Rejected: {row.rejectedProofs}</div>
                      </td>

                      <td className="text-nowrap">
                        <div>
                          Pickup:{" "}
                          {agentPayoutService.formatCurrency(row.pickupEarnings)}
                        </div>
                        <div>
                          Delivery:{" "}
                          {agentPayoutService.formatCurrency(
                            row.deliveryEarnings
                          )}
                        </div>
                      </td>

                      <td className="text-nowrap">
                        <div>
                          Attempts:{" "}
                          {agentPayoutService.formatCurrency(
                            row.failedAttemptAllowance
                          )}
                        </div>
                        <div>
                          SLA:{" "}
                          {agentPayoutService.formatCurrency(row.slaBonus)}
                        </div>
                        <div>
                          Proof:{" "}
                          {agentPayoutService.formatCurrency(
                            row.proofVerifiedBonus
                          )}
                        </div>
                      </td>

                      <td className="text-nowrap text-danger">
                        {agentPayoutService.formatCurrency(row.deductions)}
                      </td>

                      <td className="text-nowrap">
                        <strong className="text-success fs-6">
                          {agentPayoutService.formatCurrency(
                            row.netPayableAmount
                          )}
                        </strong>
                        <div className="small text-muted">
                          Gross:{" "}
                          {agentPayoutService.formatCurrency(row.grossAmount)}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${getStatusBadgeClass(
                            row.payoutStatus
                          )}`}
                        >
                          {formatLabel(row.payoutStatus)}
                        </span>
                      </td>

                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-primary text-nowrap"
                          disabled={isSaving || row.netPayableAmount <= 0}
                          onClick={() => void onGeneratePayout(row)}
                        >
                          {isSaving ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              />
                              Saving...
                            </>
                          ) : (
                            <>
                              <i
                                className="bi bi-file-earmark-plus me-2"
                                aria-hidden="true"
                              />
                              Generate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPayoutTable;
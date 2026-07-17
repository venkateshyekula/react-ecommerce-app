import type { SupportEscalation } from "../../types/supportEscalation";
import type { SupportTeamMember } from "../../types/supportTeam";
import {
  buildSupportTeamMemberMetrics,
  buildSupportTeamPerformanceSummary,
} from "../../utils/supportTeamMetricsUtils";
import SupportTeamAvailabilityBadge from "./SupportTeamAvailabilityBadge";

interface SupportTeamPerformancePanelProps {
  members: SupportTeamMember[];
  escalations: SupportEscalation[];
  title?: string;
}

const SupportTeamPerformancePanel = ({
  members,
  escalations,
  title = "Team Performance",
}: SupportTeamPerformancePanelProps) => {
  const metrics = buildSupportTeamMemberMetrics({
    members,
    escalations,
  });

  const summary = buildSupportTeamPerformanceSummary(metrics);

  return (
    <div className="support-team-performance-panel bg-white border shadow-sm p-4 mb-4">
      <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
        <div>
          <h5 className="fw-bold mb-1">{title}</h5>
          <p className="text-muted small mb-0">
            Availability, workload, and escalation resolution performance.
          </p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="support-team-metric-card">
            <span>Total Members</span>
            <strong>{summary.totalMembers}</strong>
          </div>
        </div>

        <div className="col-md-3">
          <div className="support-team-metric-card">
            <span>Available</span>
            <strong className="text-success">{summary.availableMembers}</strong>
          </div>
        </div>

        <div className="col-md-3">
          <div className="support-team-metric-card">
            <span>Busy</span>
            <strong className="text-warning">{summary.busyMembers}</strong>
          </div>
        </div>

        <div className="col-md-3">
          <div className="support-team-metric-card">
            <span>Active Escalations</span>
            <strong>{summary.activeEscalations}</strong>
          </div>
        </div>
      </div>

      <div className="row g-3">
        {metrics.map((metric) => (
          <div className="col-lg-6 col-xl-4" key={metric.member.id}>
            <div className="support-member-performance-card border rounded-4 p-3 h-100">
              <div className="d-flex justify-content-between gap-3 mb-2">
                <div className="min-w-0">
                  <strong className="d-block text-truncate">
                    {metric.member.name}
                  </strong>

                  <p className="text-muted small mb-0 support-member-role-text">
                    {metric.member.role} · {metric.member.teamCode}
                  </p>
                </div>

                <SupportTeamAvailabilityBadge
                  status={metric.derivedAvailability}
                />
              </div>

              <div className="support-capacity-bar mb-2">
                <div
                  className="support-capacity-bar-fill"
                  style={{
                    width: `${metric.capacityUsagePercent}%`,
                  }}
                />
              </div>

              <div className="small text-muted mb-2">
                Capacity:{" "}
                <strong>
                  {metric.activeCount}/
                  {metric.member.maxEscalationCapacity ?? 5}
                </strong>
              </div>

              <div className="support-member-stats-grid">
                <span>Assigned: {metric.assignedCount}</span>
                <span>Resolved: {metric.resolvedCount}</span>
                <span>Avg: {metric.averageResolutionHours}h</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SupportTeamPerformancePanel;

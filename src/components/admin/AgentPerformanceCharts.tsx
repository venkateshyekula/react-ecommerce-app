import type {
  AgentPerformanceRiskLevel,
  AgentPerformanceRow
} from "../../types/agentPerformance";

type AgentPerformanceChartsProps = {
  rows: AgentPerformanceRow[];
};

const getRiskBadgeClass = (riskLevel: AgentPerformanceRiskLevel): string => {
  switch (riskLevel) {
    case "CRITICAL":
      return "text-bg-danger";
    case "POOR":
      return "text-bg-warning text-dark";
    case "AVERAGE":
      return "text-bg-info";
    case "GOOD":
      return "text-bg-primary";
    case "EXCELLENT":
      return "text-bg-success";
    default:
      return "text-bg-secondary";
  }
};

const getBarClass = (score: number): string => {
  if (score < 40) {
    return "bg-danger";
  }

  if (score < 60) {
    return "bg-warning";
  }

  if (score < 75) {
    return "bg-info";
  }

  return "bg-success";
};

const AgentPerformanceCharts = ({ rows }: AgentPerformanceChartsProps) => {
  const topAgents = [...rows]
    .sort((first, second) => second.performanceScore - first.performanceScore)
    .slice(0, 5);

  const riskCounts = rows.reduce<Record<AgentPerformanceRiskLevel, number>>(
    (acc, row) => {
      if (acc[row.riskLevel] !== undefined) {
        acc[row.riskLevel] += 1;
      }
      return acc;
    },
    {
      EXCELLENT: 0,
      GOOD: 0,
      AVERAGE: 0,
      POOR: 0,
      CRITICAL: 0
    }
  );

  return (
    <div className="row g-3 mb-4">
      {/* Top Agents Chart */}
      <div className="col-12 col-xl-7">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Top Agent Performance Scores</h5>
            <p className="text-muted small mb-3">
              Top five agents ranked by performance score.
            </p>

            {topAgents.length === 0 ? (
              <div className="alert alert-light border mb-0">
                No performance data available for chart.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {topAgents.map((agent) => (
                  <div key={agent.agentId || agent.agentName}>
                    <div className="d-flex justify-content-between gap-2 mb-1">
                      <div className="small fw-semibold text-truncate">
                        {agent.agentName}
                      </div>
                      <div className="small text-muted">
                        {agent.performanceScore}/100
                      </div>
                    </div>

                    <div className="progress" style={{ height: 10 }}>
                      <div
                        className={`progress-bar ${getBarClass(
                          agent.performanceScore
                        )}`}
                        role="progressbar"
                        style={{
                          width: `${agent.performanceScore}%`
                        }}
                        aria-valuenow={agent.performanceScore}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Distribution Card */}
      <div className="col-12 col-xl-5">
        <div className="card border-0 shadow-sm rounded-3 h-100">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-1">Risk Distribution</h5>
            <p className="text-muted small mb-3">
              Count of agents by calculated risk level.
            </p>

            <div className="row g-2">
              {(Object.keys(riskCounts) as AgentPerformanceRiskLevel[]).map(
                (riskLevel) => (
                  <div className="col-6 col-sm-4 col-xl-6" key={riskLevel}>
                    <div className="border rounded-4 p-3 bg-light h-100">
                      <span
                        className={`badge align-self-start ${getRiskBadgeClass(riskLevel)} mb-2`}
                      >
                        {riskLevel}
                      </span>
                      <strong className="d-block fs-4">
                        {riskCounts[riskLevel]}
                      </strong>
                      <span className="text-muted small">Agents</span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformanceCharts;
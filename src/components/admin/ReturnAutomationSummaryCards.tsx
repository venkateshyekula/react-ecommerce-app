import React from "react";
import { ReturnAutomationRuleSummary } from "../../types/returnAutomationRules";

interface ReturnAutomationSummaryCardsProps {
  summary: ReturnAutomationRuleSummary;
}

const ReturnAutomationSummaryCards: React.FC<
  ReturnAutomationSummaryCardsProps
> = ({ summary }) => {
  return (
    <div className="row g-3 mb-4">
      {/* Total Rules */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <span className="text-secondary fw-semibold small text-uppercase tracking-wider">
              Total Rules
            </span>
            <h3 className="fw-bold my-1 text-dark">
              {summary.totalRules.toLocaleString()}
            </h3>
            <small className="text-muted">Configured automation rules</small>
          </div>
        </div>
      </div>

      {/* Active Rules */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100 bg-success-subtle">
          <div className="card-body">
            <span className="text-success-emphasis fw-semibold small text-uppercase tracking-wider">
              Active Rules
            </span>
            <h3 className="fw-bold my-1 text-success-emphasis">
              {summary.activeRules.toLocaleString()}
            </h3>
            <small className="text-success-emphasis opacity-75">
              Currently executable
            </small>
          </div>
        </div>
      </div>

      {/* Critical Rules */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100 bg-danger-subtle">
          <div className="card-body">
            <span className="text-danger-emphasis fw-semibold small text-uppercase tracking-wider">
              Critical Rules
            </span>
            <h3 className="fw-bold my-1 text-danger-emphasis">
              {summary.criticalRules.toLocaleString()}
            </h3>
            <small className="text-danger-emphasis opacity-75">
              High impact automation
            </small>
          </div>
        </div>
      </div>

      {/* Executions */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <span className="text-secondary fw-semibold small text-uppercase tracking-wider">
              Executions
            </span>
            <h3 className="fw-bold my-1 text-dark">
              {summary.totalExecutions.toLocaleString()}
            </h3>
            <small className="text-muted">
              {summary.successfulExecutions.toLocaleString()} successful
            </small>
          </div>
        </div>
      </div>

      {/* Success Rate */}
      <div className="col-xl col-md-4 col-sm-6">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <span className="text-secondary fw-semibold small text-uppercase tracking-wider">
              Success Rate
            </span>
            <h3 className="fw-bold my-1 text-dark">
              {summary.successRate}%
            </h3>
            <small
              className={
                summary.successRate >= 90
                  ? "text-success fw-semibold"
                  : summary.successRate >= 75
                  ? "text-warning fw-semibold"
                  : "text-danger fw-semibold"
              }
            >
              {summary.failedExecutions.toLocaleString()} failed runs
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnAutomationSummaryCards;
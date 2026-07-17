import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { rewardService } from "../../services/rewardService";
import type { RewardRule } from "../../types/rewards";

const initialFormValues = {
  ruleName: "Default Rewards Rule",
  earnPointsPerAmount: "10",
  earnAmountThreshold: "100",
  redeemPointValue: "0.25",
  minRedeemPoints: "100",
  maxRedeemPointsPerOrder: "5000",
  expiryDays: "365",
  active: true
};

const AdminRewardRulesPage = () => {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadRules = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await rewardService.getRules();
      setRules(data);
    } catch {
      setErrorMessage("Unable to load reward rules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  // ✅ FIXED: Correct dynamic key assignment syntax
  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value, type, checked } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: type === "checkbox" ? checked : value
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!formValues.ruleName.trim()) {
      setErrorMessage("Please enter rule name.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const createdRule = await rewardService.createRule({
        ruleName: formValues.ruleName.trim(),
        earnPointsPerAmount: Number(formValues.earnPointsPerAmount),
        earnAmountThreshold: Number(formValues.earnAmountThreshold),
        redeemPointValue: Number(formValues.redeemPointValue),
        minRedeemPoints: Number(formValues.minRedeemPoints),
        maxRedeemPointsPerOrder: Number(formValues.maxRedeemPointsPerOrder),
        expiryDays: Number(formValues.expiryDays),
        active: formValues.active
      });

      setRules((previousRules) => [createdRule, ...previousRules]);
      setSuccessMessage("Reward rule created successfully.");
    } catch {
      setErrorMessage("Unable to create reward rule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (rule: RewardRule): Promise<void> => {
    try {
      const updatedRule = await rewardService.updateRule(rule.id, {
        active: !rule.active
      });

      setRules((previousRules) =>
        previousRules.map((existingRule) =>
          existingRule.id === updatedRule.id ? updatedRule : existingRule
        )
      );
    } catch {
      setErrorMessage("Unable to update rule.");
    }
  };

  if (isLoading) {
    return <Loader message="Loading reward rules..." />;
  }

  return (
    <div className="admin-reward-rules-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Reward Rules</h1>
          <p className="text-muted mb-0">
            Configure how customers earn and redeem loyalty points.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadRules()}>
          <i className="bi bi-arrow-repeat me-2" />
          Refresh
        </Button>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      ) : null}

      <div className="card border shadow-sm rounded-4 mb-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Create Reward Rule</h5>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Rule Name</label>
                <input
                  name="ruleName"
                  className="form-control"
                  value={formValues.ruleName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Earn Points</label>
                <input
                  name="earnPointsPerAmount"
                  type="number"
                  className="form-control"
                  value={formValues.earnPointsPerAmount}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Per Amount</label>
                <input
                  name="earnAmountThreshold"
                  type="number"
                  className="form-control"
                  value={formValues.earnAmountThreshold}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">
                  Point Value ₹
                </label>
                <input
                  name="redeemPointValue"
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={formValues.redeemPointValue}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label fw-semibold">Expiry Days</label>
                <input
                  name="expiryDays"
                  type="number"
                  className="form-control"
                  value={formValues.expiryDays}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  Min Redeem Points
                </label>
                <input
                  name="minRedeemPoints"
                  type="number"
                  className="form-control"
                  value={formValues.minRedeemPoints}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">
                  Max Redeem / Order
                </label>
                <input
                  name="maxRedeemPointsPerOrder"
                  type="number"
                  className="form-control"
                  value={formValues.maxRedeemPointsPerOrder}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <div className="form-check">
                  <input
                    id="activeRewardRule"
                    name="active"
                    type="checkbox"
                    className="form-check-input"
                    checked={formValues.active}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor="activeRewardRule"
                    className="form-check-label"
                  >
                    Active
                  </label>
                </div>
              </div>

              <div className="col-md-3 d-flex align-items-end justify-content-end">
                <Button type="submit" variant="primary" isLoading={isSaving}>
                  Create Rule
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border shadow-sm rounded-4">
        <div className="card-body">
          <h5 className="fw-bold mb-3">Reward Rules</h5>

          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Earn</th>
                  <th>Redeem Value</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <strong>{rule.ruleName}</strong>
                    </td>

                    <td>
                      {rule.earnPointsPerAmount} pts / ₹
                      {rule.earnAmountThreshold}
                    </td>

                    <td>₹{rule.redeemPointValue} per point</td>

                    <td>{rule.expiryDays} days</td>

                    <td>
                      <span
                        className={`badge ${
                          rule.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <Button
                        variant={rule.active ? "outline-danger" : "primary"}
                        className="btn-sm"
                        onClick={() => void handleToggleRule(rule)}
                      >
                        {rule.active ? "Disable" : "Enable"}
                      </Button>
                    </td>
                  </tr>
                ))}

                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      No reward rules found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRewardRulesPage;
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { deliverySlaService } from "../../services/deliverySlaService";
import type {
  CreateDeliverySlaRuleInput,
  DeliverySlaRule,
} from "../../types/delivery";
import type { ProductCategory } from "../../types/product";
import AdminTableActions from "../../components/admin/AdminTableActions";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";

interface SlaFormValues {
  category: ProductCategory | "";
  handlingDays: string;
  additionalDays: string;
  priority: string;
  active: boolean;
}

const productCategories: ProductCategory[] = [
  "Electronics",
  "Clothing",
  "Books",
  "Footwear",
  "Accessories",
  "Men",
  "Women",
  "Kids",
  "Home",
  "Beauty",
];

const initialFormValues: SlaFormValues = {
  category: "",
  handlingDays: "0",
  additionalDays: "0",
  priority: "1",
  active: true,
};

const sortRulesByPriority = (
  ruleList: DeliverySlaRule[],
): DeliverySlaRule[] => {
  return [...ruleList].sort(
    (firstRule, secondRule) => firstRule.priority - secondRule.priority,
  );
};

const AdminDeliverySlaRulesPage = () => {
  const [rules, setRules] = useState<DeliverySlaRule[]>([]);
  const [formValues, setFormValues] =
    useState<SlaFormValues>(initialFormValues);

  const [editingRule, setEditingRule] = useState<DeliverySlaRule | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadRules = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const ruleList = await deliverySlaService.getRules();

      setRules(sortRulesByPriority(ruleList));
    } catch {
      setErrorMessage(
        "Unable to load delivery SLA rules. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const filteredRules = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return rules.filter((rule) => {
      return !query || rule.category.toLowerCase().includes(query);
    });
  }, [rules, searchText]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedRules,
    setCurrentPage,
    setItemsPerPage,
  } = useAdminTablePagination({
    items: filteredRules,
    defaultItemsPerPage: 5,
    resetDependencies: [searchText],
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: nextValue,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetForm = (): void => {
    setFormValues(initialFormValues);
    setEditingRule(null);
  };

  const validateForm = (): boolean => {
    const handlingDays = Number(formValues.handlingDays);
    const additionalDays = Number(formValues.additionalDays);
    const priority = Number(formValues.priority);

    if (!formValues.category) {
      setErrorMessage("Please select a product category.");
      return false;
    }

    if (Number.isNaN(handlingDays) || handlingDays < 0) {
      setErrorMessage("Handling days cannot be negative.");
      return false;
    }

    if (Number.isNaN(additionalDays) || additionalDays < 0) {
      setErrorMessage("Additional days cannot be negative.");
      return false;
    }

    if (Number.isNaN(priority) || priority <= 0) {
      setErrorMessage("Priority must be greater than zero.");
      return false;
    }

    const duplicateRule = rules.find(
      (rule) =>
        rule.category.toLowerCase() === formValues.category.toLowerCase() &&
        rule.id !== editingRule?.id,
    );

    if (duplicateRule) {
      setErrorMessage("A SLA rule already exists for this category.");
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateDeliverySlaRuleInput => {
    return {
      category: formValues.category as ProductCategory,
      handlingDays: Number(formValues.handlingDays),
      additionalDays: Number(formValues.additionalDays),
      priority: Number(formValues.priority),
      active: formValues.active,
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = buildPayload();

      if (editingRule) {
        const updatedRule = await deliverySlaService.updateRule(
          editingRule.id,
          payload,
        );

        setRules((previousRules) =>
          sortRulesByPriority(
            previousRules.map((rule) =>
              rule.id === updatedRule.id ? updatedRule : rule,
            ),
          ),
        );

        setSuccessMessage("Delivery SLA rule updated successfully.");
      } else {
        const createdRule = await deliverySlaService.createRule(payload);

        setRules((previousRules) =>
          sortRulesByPriority([createdRule, ...previousRules]),
        );

        setSuccessMessage("Delivery SLA rule created successfully.");
      }

      resetForm();
    } catch {
      setErrorMessage("Unable to save delivery SLA rule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule: DeliverySlaRule): void => {
    setEditingRule(rule);

    setFormValues({
      category: rule.category,
      handlingDays: String(rule.handlingDays),
      additionalDays: String(rule.additionalDays),
      priority: String(rule.priority),
      active: rule.active,
    });

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = async (rule: DeliverySlaRule): Promise<void> => {
    try {
      setUpdatingId(rule.id);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedRule = await deliverySlaService.updateRule(rule.id, {
        active: !rule.active,
      });

      setRules((previousRules) =>
        sortRulesByPriority(
          previousRules.map((existingRule) =>
            existingRule.id === updatedRule.id ? updatedRule : existingRule,
          ),
        ),
      );

      setSuccessMessage(
        `SLA rule ${updatedRule.active ? "enabled" : "disabled"} successfully.`,
      );
    } catch {
      setErrorMessage("Unable to update SLA rule status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (rule: DeliverySlaRule): Promise<void> => {
    const shouldDelete = window.confirm(
      `Delete SLA rule for ${rule.category}? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingId(rule.id);
      setErrorMessage("");
      setSuccessMessage("");

      await deliverySlaService.deleteRule(rule.id);

      setRules((previousRules) =>
        previousRules.filter((existingRule) => existingRule.id !== rule.id),
      );

      if (editingRule?.id === rule.id) {
        resetForm();
      }

      setSuccessMessage("Delivery SLA rule deleted successfully.");
    } catch {
      setErrorMessage("Unable to delete SLA rule.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading delivery SLA rules..." />;
  }

  return (
    <div className="admin-delivery-sla-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Delivery SLA Rules</h1>
          <p className="text-muted mb-0">
            Configure category-based delivery speed and handling rules.
          </p>
        </div>

        <Button
          variant="outline-primary"
          onClick={() => void loadRules()}
          disabled={isSaving || Boolean(updatingId)}
        >
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

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">
          {editingRule ? "Edit SLA Rule" : "Create SLA Rule"}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold" htmlFor="slaCategory">
                Product Category
              </label>

              <select
                id="slaCategory"
                name="category"
                className="form-select"
                value={formValues.category}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="">Select Category</option>

                {productCategories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label
                className="form-label fw-semibold"
                htmlFor="slaHandlingDays"
              >
                Handling Days
              </label>

              <input
                id="slaHandlingDays"
                name="handlingDays"
                type="number"
                min={0}
                className="form-control"
                value={formValues.handlingDays}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            <div className="col-md-2">
              <label
                className="form-label fw-semibold"
                htmlFor="slaAdditionalDays"
              >
                Extra Days
              </label>

              <input
                id="slaAdditionalDays"
                name="additionalDays"
                type="number"
                min={0}
                className="form-control"
                value={formValues.additionalDays}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label fw-semibold" htmlFor="slaPriority">
                Priority
              </label>

              <input
                id="slaPriority"
                name="priority"
                type="number"
                min={1}
                className="form-control"
                value={formValues.priority}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="slaRuleActive"
                  name="active"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.active}
                  onChange={handleChange}
                  disabled={isSaving}
                />

                <label
                  htmlFor="slaRuleActive"
                  className="form-check-label fw-semibold"
                >
                  Active
                </label>
              </div>
            </div>

            <div className="col-12 d-flex justify-content-end gap-2">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>

              {editingRule ? (
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={resetForm}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">SLA Rules</h5>

          <input
            className="form-control admin-search-input"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search category..."
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Category</th>
                <th>Handling Days</th>
                <th>Extra Days</th>
                <th>Total SLA Add-on</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedRules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <strong>{rule.category}</strong>
                  </td>

                  <td>{rule.handlingDays}</td>

                  <td>{rule.additionalDays}</td>

                  <td>{rule.handlingDays + rule.additionalDays} Days</td>

                  <td>{rule.priority}</td>

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
                    <AdminTableActions
                      itemName={`SLA rule for ${rule.category}`}
                      isActive={rule.active}
                      isLoading={updatingId === rule.id}
                      onEdit={() => handleEdit(rule)}
                      onToggleStatus={() => void handleToggleStatus(rule)}
                      onDelete={() => void handleDelete(rule)}
                    />
                  </td>
                </tr>
              ))}

              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No SLA rules found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          totalItems={filteredRules.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="rules"
        />
      </div>
    </div>
  );
};

export default AdminDeliverySlaRulesPage;

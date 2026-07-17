import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import AdminTableActions from "../../components/admin/AdminTableActions";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { returnPolicyService } from "../../services/returnPolicyService";
import type { ProductCategory } from "../../types/product";
import type {
  CreateReturnPolicyRuleInput,
  ReturnPolicyRule
} from "../../types/returnPolicy";

interface ReturnRuleFormValues {
  category: ProductCategory | "";
  returnWindowDays: string;
  returnable: boolean;
  replacementAllowed: boolean;
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
  "Beauty"
];

const initialFormValues: ReturnRuleFormValues = {
  category: "",
  returnWindowDays: "7",
  returnable: true,
  replacementAllowed: true,
  active: true
};

const AdminReturnPolicyRulesPage = () => {
  const [rules, setRules] = useState<ReturnPolicyRule[]>([]);
  const [formValues, setFormValues] =
    useState<ReturnRuleFormValues>(initialFormValues);
  const [editingRule, setEditingRule] = useState<ReturnPolicyRule | null>(null);
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

      const ruleList = await returnPolicyService.getRules();
      setRules(ruleList);
    } catch {
      setErrorMessage(
        "Unable to load return policy rules. Please make sure JSON Server is running."
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

    return rules.filter(
      (rule) => !query || rule.category.toLowerCase().includes(query)
    );
  }, [rules, searchText]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedRules,
    setCurrentPage,
    setItemsPerPage
  } = useAdminTablePagination({
    items: filteredRules,
    defaultItemsPerPage: 5,
    resetDependencies: [searchText]
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]:nextValue
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetForm = (): void => {
    setFormValues(initialFormValues);
    setEditingRule(null);
  };

  const validateForm = (): boolean => {
    if (!formValues.category) {
      setErrorMessage("Please select product category.");
      return false;
    }

    if (Number(formValues.returnWindowDays) < 0) {
      setErrorMessage("Return window days cannot be negative.");
      return false;
    }

    const duplicateRule = rules.find(
      (rule) =>
        rule.category === formValues.category &&
        rule.id !== editingRule?.id
    );

    if (duplicateRule) {
      setErrorMessage("Return policy already exists for this category.");
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateReturnPolicyRuleInput => {
    return {
      category: formValues.category as ProductCategory,
      returnWindowDays: Number(formValues.returnWindowDays),
      returnable: formValues.returnable,
      replacementAllowed: formValues.replacementAllowed,
      active: formValues.active
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
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
        const updatedRule = await returnPolicyService.updateRule(
          editingRule.id,
          payload
        );

        setRules((previousRules) =>
          previousRules.map((rule) =>
            rule.id === updatedRule.id ? updatedRule : rule
          )
        );

        setSuccessMessage("Return policy rule updated successfully.");
      } else {
        const createdRule = await returnPolicyService.createRule(payload);

        setRules((previousRules) => [createdRule, ...previousRules]);
        setSuccessMessage("Return policy rule created successfully.");
      }

      resetForm();
    } catch {
      setErrorMessage("Unable to save return policy rule.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (rule: ReturnPolicyRule): void => {
    setEditingRule(rule);

    setFormValues({
      category: rule.category,
      returnWindowDays: String(rule.returnWindowDays),
      returnable: rule.returnable,
      replacementAllowed: rule.replacementAllowed,
      active: rule.active
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = async (rule: ReturnPolicyRule): Promise<void> => {
    try {
      setUpdatingId(rule.id);

      const updatedRule = await returnPolicyService.updateRule(rule.id, {
        active: !rule.active
      });

      setRules((previousRules) =>
        previousRules.map((existingRule) =>
          existingRule.id === updatedRule.id ? updatedRule : existingRule
        )
      );
    } catch {
      setErrorMessage("Unable to update return policy status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (rule: ReturnPolicyRule): Promise<void> => {
    const shouldDelete = window.confirm(
      `Delete return policy for ${rule.category}?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingId(rule.id);

      await returnPolicyService.deleteRule(rule.id);

      setRules((previousRules) =>
        previousRules.filter((existingRule) => existingRule.id !== rule.id)
      );

      if (editingRule?.id === rule.id) {
        resetForm();
      }
    } catch {
      setErrorMessage("Unable to delete return policy.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading return policy rules..." />;
  }

  return (
    <div className="admin-return-policy-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Return Policy Rules</h1>
          <p className="text-muted mb-0">
            Configure category-wise return windows and replacement eligibility.
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

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">
          {editingRule ? "Edit Return Policy" : "Create Return Policy"}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Category</label>
              <select
                name="category"
                className="form-select"
                value={formValues.category}
                onChange={handleChange}
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
              <label className="form-label fw-semibold">Return Days</label>
              <input
                name="returnWindowDays"
                type="number"
                min={0}
                className="form-control"
                value={formValues.returnWindowDays}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="returnable"
                  name="returnable"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.returnable}
                  onChange={handleChange}
                />
                <label htmlFor="returnable" className="form-check-label">
                  Returnable
                </label>
              </div>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="replacementAllowed"
                  name="replacementAllowed"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.replacementAllowed}
                  onChange={handleChange}
                />
                <label
                  htmlFor="replacementAllowed"
                  className="form-check-label"
                >
                  Replacement
                </label>
              </div>
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="returnRuleActive"
                  name="active"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.active}
                  onChange={handleChange}
                />
                <label
                  htmlFor="returnRuleActive"
                  className="form-check-label"
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
          <h5 className="fw-bold mb-0">Return Policy Rules</h5>

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
                <th>Return Window</th>
                <th>Returnable</th>
                <th>Replacement</th>
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

                  <td>{rule.returnWindowDays} Days</td>

                  <td>
                    <span
                      className={`badge ${
                        rule.returnable ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {rule.returnable ? "Yes" : "No"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        rule.replacementAllowed
                          ? "bg-success"
                          : "bg-secondary"
                      }`}
                    >
                      {rule.replacementAllowed ? "Yes" : "No"}
                    </span>
                  </td>

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
                      itemName={`return policy for ${rule.category}`}
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
                  <td colSpan={6} className="text-center text-muted py-4">
                    No return policy rules found.
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

export default AdminReturnPolicyRulesPage;
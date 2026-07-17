import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { apiClient } from "../../services/apiClient";
import { sellerFulfillmentService } from "../../services/sellerFulfillmentService";
import { warehouseService } from "../../services/warehouseService";
import type {
  CreateSellerFulfillmentInput,
  SellerFulfillmentMapping,
  Warehouse,
} from "../../types/delivery";

interface SellerUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FulfillmentFormValues {
  sellerId: string;
  sellerName: string;
  warehouseIds: string[];
  preferredWarehouseId: string;
  active: boolean;
}

const initialFormValues: FulfillmentFormValues = {
  sellerId: "",
  sellerName: "",
  warehouseIds: [],
  preferredWarehouseId: "",
  active: true,
};

const AdminSellerFulfillmentPage = () => {
  const [mappings, setMappings] = useState<SellerFulfillmentMapping[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [formValues, setFormValues] =
    useState<FulfillmentFormValues>(initialFormValues);
  const [editingMapping, setEditingMapping] =
    useState<SellerFulfillmentMapping | null>(null);

  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<number | string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [mappingList, warehouseList, userList] = await Promise.all([
        sellerFulfillmentService.getMappings(),
        warehouseService.getWarehouses(),
        apiClient.get<SellerUser[]>("/users"),
      ]);

      setMappings(mappingList);
      setWarehouses(warehouseList);
      setSellers(userList.filter((user) => user.role === "SELLER"));
    } catch {
      setErrorMessage(
        "Unable to load seller fulfillment settings. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, itemsPerPage]);

  const activeWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => warehouse.active);
  }, [warehouses]);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce<Record<number, Warehouse>>((result, warehouse) => {
      result[warehouse.id] = warehouse;
      return result;
    }, {});
  }, [warehouses]);

  const filteredMappings = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return mappings.filter((mapping) => {
      const warehouseNames = mapping.warehouseIds
        .map((warehouseId) => warehouseMap[warehouseId]?.name ?? "")
        .join(" ");

      return (
        !query ||
        mapping.sellerName.toLowerCase().includes(query) ||
        mapping.sellerId.toLowerCase().includes(query) ||
        warehouseNames.toLowerCase().includes(query)
      );
    });
  }, [mappings, searchText, warehouseMap]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredMappings.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedMappings = filteredMappings.slice(startIndex, endIndex);

  const startItem = filteredMappings.length === 0 ? 0 : startIndex + 1;

  const endItem = Math.min(endIndex, filteredMappings.length);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    if (name === "sellerId") {
      const selectedSeller = sellers.find((seller) => seller.id === value);

      setFormValues((previousValues) => ({
        ...previousValues,
        sellerId: value,
        sellerName: selectedSeller?.name ?? "",
      }));

      setErrorMessage("");
      setSuccessMessage("");
      return;
    }

    setFormValues((previousValues) => ({
      ...previousValues,
      nextValue,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleWarehouseSelection = (warehouseId: number): void => {
    setFormValues((previousValues) => {
      const warehouseIdText = String(warehouseId);

      const exists = previousValues.warehouseIds.includes(warehouseIdText);

      const nextWarehouseIds = exists
        ? previousValues.warehouseIds.filter((id) => id !== warehouseIdText)
        : [...previousValues.warehouseIds, warehouseIdText];

      const nextPreferredWarehouseId = nextWarehouseIds.includes(
        previousValues.preferredWarehouseId,
      )
        ? previousValues.preferredWarehouseId
        : (nextWarehouseIds[0] ?? "");

      return {
        ...previousValues,
        warehouseIds: nextWarehouseIds,
        preferredWarehouseId: nextPreferredWarehouseId,
      };
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetForm = (): void => {
    setFormValues(initialFormValues);
    setEditingMapping(null);
  };

  const validateForm = (): boolean => {
    if (!formValues.sellerId) {
      setErrorMessage("Please select a seller.");
      return false;
    }

    if (formValues.warehouseIds.length === 0) {
      setErrorMessage("Please select at least one warehouse.");
      return false;
    }

    if (!formValues.preferredWarehouseId) {
      setErrorMessage("Please select a preferred warehouse.");
      return false;
    }

    if (!formValues.warehouseIds.includes(formValues.preferredWarehouseId)) {
      setErrorMessage(
        "Preferred warehouse must be selected in assigned warehouses.",
      );
      return false;
    }

    const duplicateMapping = mappings.find(
      (mapping) =>
        mapping.sellerId === formValues.sellerId &&
        mapping.id !== editingMapping?.id,
    );

    if (duplicateMapping) {
      setErrorMessage("Fulfillment mapping already exists for this seller.");
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateSellerFulfillmentInput => {
    return {
      sellerId: formValues.sellerId,
      sellerName: formValues.sellerName,
      warehouseIds: formValues.warehouseIds.map(Number),
      preferredWarehouseId: Number(formValues.preferredWarehouseId),
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

      if (editingMapping) {
        const updatedMapping = await sellerFulfillmentService.updateMapping(
          editingMapping.id,
          payload,
        );

        setMappings((previousMappings) =>
          previousMappings.map((mapping) =>
            mapping.id === updatedMapping.id ? updatedMapping : mapping,
          ),
        );

        setSuccessMessage("Seller fulfillment mapping updated successfully.");
      } else {
        const createdMapping =
          await sellerFulfillmentService.createMapping(payload);

        setMappings((previousMappings) => [
          createdMapping,
          ...previousMappings,
        ]);

        setSuccessMessage("Seller fulfillment mapping created successfully.");
      }

      resetForm();
    } catch {
      setErrorMessage("Unable to save seller fulfillment mapping.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (mapping: SellerFulfillmentMapping): void => {
    setEditingMapping(mapping);

    setFormValues({
      sellerId: mapping.sellerId,
      sellerName: mapping.sellerName,
      warehouseIds: mapping.warehouseIds.map(String),
      preferredWarehouseId: String(mapping.preferredWarehouseId),
      active: mapping.active,
    });

    setErrorMessage("");
    setSuccessMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleStatus = async (
    mapping: SellerFulfillmentMapping,
  ): Promise<void> => {
    try {
      setUpdatingId(mapping.id);

      const updatedMapping = await sellerFulfillmentService.updateMapping(
        mapping.id,
        {
          active: !mapping.active,
        },
      );

      setMappings((previousMappings) =>
        previousMappings.map((existingMapping) =>
          existingMapping.id === updatedMapping.id
            ? updatedMapping
            : existingMapping,
        ),
      );
    } catch {
      setErrorMessage("Unable to update fulfillment mapping status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (
    mapping: SellerFulfillmentMapping,
  ): Promise<void> => {
    const shouldDelete = window.confirm(
      `Delete fulfillment mapping for ${mapping.sellerName}?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingId(mapping.id);

      await sellerFulfillmentService.deleteMapping(mapping.id);

      setMappings((previousMappings) =>
        previousMappings.filter(
          (existingMapping) => existingMapping.id !== mapping.id,
        ),
      );

      if (editingMapping?.id === mapping.id) {
        resetForm();
      }
    } catch {
      setErrorMessage("Unable to delete seller fulfillment mapping.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading seller fulfillment settings..." />;
  }

  return (
    <div className="admin-seller-fulfillment-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Seller Fulfillment Mapping</h1>
          <p className="text-muted mb-0">
            Assign sellers to warehouses and configure preferred fulfillment
            centers.
          </p>
        </div>

        <Button variant="outline-primary" onClick={() => void loadData()}>
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
          {editingMapping
            ? "Edit Seller Fulfillment"
            : "Create Seller Fulfillment"}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Seller</label>
              <select
                name="sellerId"
                className="form-select"
                value={formValues.sellerId}
                onChange={handleChange}
                disabled={Boolean(editingMapping)}
              >
                <option value="">Select Seller</option>
                {sellers.map((seller) => (
                  <option value={seller.id} key={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Seller Name</label>
              <input
                name="sellerName"
                className="form-control"
                value={formValues.sellerName}
                onChange={handleChange}
                placeholder="Seller name"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Preferred Warehouse
              </label>
              <select
                name="preferredWarehouseId"
                className="form-select"
                value={formValues.preferredWarehouseId}
                onChange={handleChange}
              >
                <option value="">Select Preferred Warehouse</option>
                {activeWarehouses
                  .filter((warehouse) =>
                    formValues.warehouseIds.includes(String(warehouse.id)),
                  )
                  .map((warehouse) => (
                    <option value={warehouse.id} key={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                Assigned Warehouses
              </label>

              <div className="seller-warehouse-checkbox-grid">
                {activeWarehouses.map((warehouse) => {
                  const checked = formValues.warehouseIds.includes(
                    String(warehouse.id),
                  );

                  return (
                    <label
                      className={`seller-warehouse-checkbox ${
                        checked ? "active" : ""
                      }`}
                      key={warehouse.id}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleWarehouseSelection(warehouse.id)}
                      />

                      <span>
                        <strong>{warehouse.name}</strong>
                        <small>
                          {warehouse.city}, {warehouse.state}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="fulfillmentActive"
                  name="active"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.active}
                  onChange={handleChange}
                />
                <label
                  htmlFor="fulfillmentActive"
                  className="form-check-label fw-semibold"
                >
                  Active Mapping
                </label>
              </div>
            </div>

            <div className="col-12 d-flex justify-content-end gap-2">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                {editingMapping ? "Update Mapping" : "Create Mapping"}
              </Button>

              {editingMapping ? (
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
          <h5 className="fw-bold mb-0">Seller Fulfillment Mappings</h5>

          <input
            className="form-control admin-search-input"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search seller or warehouse..."
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Assigned Warehouses</th>
                <th>Preferred</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedMappings.map((mapping) => {
                const preferredWarehouse =
                  warehouseMap[mapping.preferredWarehouseId];

                return (
                  <tr key={mapping.id}>
                    <td>
                      <strong>{mapping.sellerName}</strong>
                      <p className="small text-muted mb-0">
                        {mapping.sellerId}
                      </p>
                    </td>

                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {mapping.warehouseIds.map((warehouseId) => {
                          const warehouse = warehouseMap[warehouseId];

                          return (
                            <span
                              className="badge bg-light text-dark border"
                              key={warehouseId}
                            >
                              {warehouse?.name ?? `#${warehouseId}`}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td>{preferredWarehouse?.name ?? "Not set"}</td>

                    <td>
                      <span
                        className={`badge ${
                          mapping.active ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {mapping.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="admin-table-action-icons">
                        <button
                          type="button"
                          className="admin-icon-action-btn edit"
                          onClick={() => handleEdit(mapping)}
                          aria-label={`Edit fulfillment mapping for ${mapping.sellerName}`}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square" />
                        </button>

                        <button
                          type="button"
                          className={`admin-icon-action-btn ${
                            mapping.active ? "disable" : "enable"
                          }`}
                          disabled={updatingId === mapping.id}
                          onClick={() => void handleToggleStatus(mapping)}
                          aria-label={
                            mapping.active
                              ? `Disable fulfillment mapping for ${mapping.sellerName}`
                              : `Enable fulfillment mapping for ${mapping.sellerName}`
                          }
                          title={mapping.active ? "Disable" : "Enable"}
                        >
                          <i
                            className={
                              mapping.active
                                ? "bi bi-slash-circle"
                                : "bi bi-check-circle"
                            }
                          />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-action-btn delete"
                          disabled={updatingId === mapping.id}
                          onClick={() => void handleDelete(mapping)}
                          aria-label={`Delete fulfillment mapping for ${mapping.sellerName}`}
                          title="Delete"
                        >
                          <i className="bi bi-trash3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMappings.length > 0 ? (
          <div className="admin-table-pagination">
            <div className="admin-table-pagination-info">
              Showing <strong>{startItem}</strong> to <strong>{endItem}</strong>{" "}
              of <strong>{filteredMappings.length}</strong> mappings
            </div>

            <div className="admin-table-pagination-actions">
              <select
                className="form-select admin-table-page-size"
                value={itemsPerPage}
                onChange={(event) => {
                  setItemsPerPage(Number(event.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>

              <button
                type="button"
                className="admin-pagination-icon-btn"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((previousPage) => previousPage - 1)
                }
              >
                <i className="bi bi-chevron-left me-1" />
              </button>

              <span className="admin-table-page-indicator">
                Page <strong>{currentPage}</strong> of{" "}
                <strong>{totalPages}</strong>
              </span>

              <button
                type="button"
                className="admin-pagination-icon-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((previousPage) => previousPage + 1)
                }
              >
                <i className="bi bi-chevron-right ms-1" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminSellerFulfillmentPage;

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { deliveryService } from "../../services/deliveryService";
import { warehouseService } from "../../services/warehouseService";
import type {
  CreateWarehouseInput,
  CreateZoneInput,
  DeliveryZone,
  Warehouse,
} from "../../types/delivery";
import AdminTableActions from "../../components/admin/AdminTableActions";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";

interface ZoneFormValues {
  zone: string;
  prefixes: string;
  warehouseId: string;
  deliveryDays: string;
  cashOnDelivery: boolean;
  freeDelivery: boolean;
  active: boolean;
}

interface WarehouseFormValues {
  name: string;
  city: string;
  state: string;
  active: boolean;
}

const initialZoneFormValues: ZoneFormValues = {
  zone: "",
  prefixes: "",
  warehouseId: "",
  deliveryDays: "2",
  cashOnDelivery: true,
  freeDelivery: true,
  active: true,
};

const initialWarehouseFormValues: WarehouseFormValues = {
  name: "",
  city: "",
  state: "",
  active: true,
};

type AdminDeliveryTab = "ZONES" | "WAREHOUSES";

const AdminDeliveryZonesPage = () => {
  const [activeTab, setActiveTab] = useState<AdminDeliveryTab>("ZONES");

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [zoneFormValues, setZoneFormValues] = useState<ZoneFormValues>(
    initialZoneFormValues,
  );
  const [warehouseFormValues, setWarehouseFormValues] =
    useState<WarehouseFormValues>(initialWarehouseFormValues);

  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  const [zoneSearch, setZoneSearch] = useState<string>("");
  const [warehouseSearch, setWarehouseSearch] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingZone, setIsSavingZone] = useState<boolean>(false);
  const [isSavingWarehouse, setIsSavingWarehouse] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | number>("");

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [zoneList, warehouseList] = await Promise.all([
        deliveryService.getZones(),
        warehouseService.getWarehouses(),
      ]);

      setZones(zoneList);
      setWarehouses(warehouseList);
    } catch {
      setErrorMessage(
        "Unable to load delivery settings. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce<Record<number, Warehouse>>((result, warehouse) => {
      result[warehouse.id] = warehouse;
      return result;
    }, {});
  }, [warehouses]);

  const filteredZones = useMemo(() => {
    const query = zoneSearch.trim().toLowerCase();

    return zones.filter((zone) => {
      const warehouseName = warehouseMap[zone.warehouseId]?.name ?? "";

      return (
        !query ||
        zone.zone.toLowerCase().includes(query) ||
        zone.prefixes.join(", ").toLowerCase().includes(query) ||
        warehouseName.toLowerCase().includes(query)
      );
    });
  }, [zones, zoneSearch, warehouseMap]);

  const {
    currentPage: zoneCurrentPage,
    itemsPerPage: zoneItemsPerPage,
    paginatedItems: paginatedZones,
    setCurrentPage: setZoneCurrentPage,
    setItemsPerPage: setZoneItemsPerPage,
  } = useAdminTablePagination({
    items: filteredZones,
    defaultItemsPerPage: 5,
    resetDependencies: [zoneSearch],
  });

  const filteredWarehouses = useMemo(() => {
    const query = warehouseSearch.trim().toLowerCase();

    return warehouses.filter((warehouse) => {
      return (
        !query ||
        warehouse.name.toLowerCase().includes(query) ||
        warehouse.city.toLowerCase().includes(query) ||
        warehouse.state.toLowerCase().includes(query)
      );
    });
  }, [warehouses, warehouseSearch]);

  const {
    currentPage: warehouseCurrentPage,
    itemsPerPage: warehouseItemsPerPage,
    paginatedItems: paginatedWarehouses,
    setCurrentPage: setWarehouseCurrentPage,
    setItemsPerPage: setWarehouseItemsPerPage,
  } = useAdminTablePagination({
    items: filteredWarehouses,
    defaultItemsPerPage: 5,
    resetDependencies: [warehouseSearch],
  });

  const parsePrefixes = (value: string): string[] => {
    return value
      .split(",")
      .map((prefix) => prefix.trim())
      .filter(Boolean);
  };

  const resetZoneForm = (): void => {
    setZoneFormValues(initialZoneFormValues);
    setEditingZone(null);
  };

  const resetWarehouseForm = (): void => {
    setWarehouseFormValues(initialWarehouseFormValues);
    setEditingWarehouse(null);
  };

  const handleZoneChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void => {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setZoneFormValues((previousValues) => ({
      ...previousValues,
      [name]: nextValue,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleWarehouseChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value, type } = event.target;

    const nextValue =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : value;

    setWarehouseFormValues((previousValues) => ({
      ...previousValues,
      [name]: nextValue,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const validateZoneForm = (): boolean => {
    if (!zoneFormValues.zone.trim()) {
      setErrorMessage("Zone name is required.");
      return false;
    }

    if (parsePrefixes(zoneFormValues.prefixes).length === 0) {
      setErrorMessage("Please enter at least one pincode prefix.");
      return false;
    }

    if (!zoneFormValues.warehouseId) {
      setErrorMessage("Please select a warehouse.");
      return false;
    }

    if (Number(zoneFormValues.deliveryDays) <= 0) {
      setErrorMessage("Delivery days must be greater than zero.");
      return false;
    }

    return true;
  };

  const validateWarehouseForm = (): boolean => {
    if (!warehouseFormValues.name.trim()) {
      setErrorMessage("Warehouse name is required.");
      return false;
    }

    if (!warehouseFormValues.city.trim()) {
      setErrorMessage("City is required.");
      return false;
    }

    if (!warehouseFormValues.state.trim()) {
      setErrorMessage("State is required.");
      return false;
    }

    return true;
  };

  const buildZonePayload = (): CreateZoneInput => {
    return {
      zone: zoneFormValues.zone.trim(),
      prefixes: parsePrefixes(zoneFormValues.prefixes),
      warehouseId: Number(zoneFormValues.warehouseId),
      deliveryDays: Number(zoneFormValues.deliveryDays),
      cashOnDelivery: zoneFormValues.cashOnDelivery,
      freeDelivery: zoneFormValues.freeDelivery,
      active: zoneFormValues.active,
    };
  };

  const buildWarehousePayload = (): CreateWarehouseInput => {
    return {
      name: warehouseFormValues.name.trim(),
      city: warehouseFormValues.city.trim(),
      state: warehouseFormValues.state.trim(),
      active: warehouseFormValues.active,
    };
  };

  const handleZoneSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!validateZoneForm()) {
      return;
    }

    try {
      setIsSavingZone(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = buildZonePayload();

      if (editingZone) {
        const updatedZone = await deliveryService.updateZone(
          editingZone.id,
          payload,
        );

        setZones((previousZones) =>
          previousZones.map((zone) =>
            zone.id === updatedZone.id ? updatedZone : zone,
          ),
        );

        setSuccessMessage("Delivery zone updated successfully.");
      } else {
        const createdZone = await deliveryService.createZone(payload);

        setZones((previousZones) => [createdZone, ...previousZones]);
        setSuccessMessage("Delivery zone created successfully.");
      }

      resetZoneForm();
    } catch {
      setErrorMessage("Unable to save delivery zone.");
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleWarehouseSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!validateWarehouseForm()) {
      return;
    }

    try {
      setIsSavingWarehouse(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = buildWarehousePayload();

      if (editingWarehouse) {
        const updatedWarehouse = await warehouseService.updateWarehouse(
          editingWarehouse.id,
          payload,
        );

        setWarehouses((previousWarehouses) =>
          previousWarehouses.map((warehouse) =>
            warehouse.id === updatedWarehouse.id ? updatedWarehouse : warehouse,
          ),
        );

        setSuccessMessage("Warehouse updated successfully.");
      } else {
        const createdWarehouse =
          await warehouseService.createWarehouse(payload);

        setWarehouses((previousWarehouses) => [
          createdWarehouse,
          ...previousWarehouses,
        ]);

        setSuccessMessage("Warehouse created successfully.");
      }

      resetWarehouseForm();
    } catch {
      setErrorMessage("Unable to save warehouse.");
    } finally {
      setIsSavingWarehouse(false);
    }
  };

  const handleEditZone = (zone: DeliveryZone): void => {
    setActiveTab("ZONES");
    setEditingZone(zone);

    setZoneFormValues({
      zone: zone.zone,
      prefixes: zone.prefixes.join(", "),
      warehouseId: String(zone.warehouseId),
      deliveryDays: String(zone.deliveryDays),
      cashOnDelivery: zone.cashOnDelivery,
      freeDelivery: zone.freeDelivery,
      active: zone.active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEditWarehouse = (warehouse: Warehouse): void => {
    setActiveTab("WAREHOUSES");
    setEditingWarehouse(warehouse);

    setWarehouseFormValues({
      name: warehouse.name,
      city: warehouse.city,
      state: warehouse.state,
      active: warehouse.active,
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleZoneStatus = async (zone: DeliveryZone): Promise<void> => {
    try {
      setUpdatingId(zone.id);

      const updatedZone = await deliveryService.updateZone(zone.id, {
        active: !zone.active,
      });

      setZones((previousZones) =>
        previousZones.map((existingZone) =>
          existingZone.id === updatedZone.id ? updatedZone : existingZone,
        ),
      );
    } catch {
      setErrorMessage("Unable to update zone status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleToggleWarehouseStatus = async (
    warehouse: Warehouse,
  ): Promise<void> => {
    try {
      setUpdatingId(warehouse.id);

      const updatedWarehouse = await warehouseService.updateWarehouse(
        warehouse.id,
        {
          active: !warehouse.active,
        },
      );

      setWarehouses((previousWarehouses) =>
        previousWarehouses.map((existingWarehouse) =>
          existingWarehouse.id === updatedWarehouse.id
            ? updatedWarehouse
            : existingWarehouse,
        ),
      );
    } catch {
      setErrorMessage("Unable to update warehouse status.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteZone = async (zone: DeliveryZone): Promise<void> => {
    const shouldDelete = window.confirm(
      `Delete delivery zone "${zone.zone}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingId(zone.id);

      await deliveryService.deleteZone(zone.id);

      setZones((previousZones) =>
        previousZones.filter((existingZone) => existingZone.id !== zone.id),
      );

      if (editingZone?.id === zone.id) {
        resetZoneForm();
      }
    } catch {
      setErrorMessage("Unable to delete delivery zone.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse): Promise<void> => {
    const linkedZones = zones.filter(
      (zone) => zone.warehouseId === warehouse.id,
    );

    if (linkedZones.length > 0) {
      setErrorMessage(
        "This warehouse is linked to delivery zones. Please update those zones before deleting.",
      );
      return;
    }

    const shouldDelete = window.confirm(
      `Delete warehouse "${warehouse.name}"? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingId(warehouse.id);

      await warehouseService.deleteWarehouse(warehouse.id);

      setWarehouses((previousWarehouses) =>
        previousWarehouses.filter(
          (existingWarehouse) => existingWarehouse.id !== warehouse.id,
        ),
      );

      if (editingWarehouse?.id === warehouse.id) {
        resetWarehouseForm();
      }
    } catch {
      setErrorMessage("Unable to delete warehouse.");
    } finally {
      setUpdatingId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading delivery management..." />;
  }

  return (
    <div className="admin-delivery-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Delivery & Fulfillment</h1>
          <p className="text-muted mb-0">
            Manage delivery zones, pincode prefixes, warehouses, COD and free
            delivery rules.
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

      <div className="admin-delivery-tabs mb-4">
        <button
          type="button"
          className={activeTab === "ZONES" ? "active" : ""}
          onClick={() => setActiveTab("ZONES")}
        >
          <i className="bi bi-geo-alt me-2" />
          Delivery Zones
        </button>

        <button
          type="button"
          className={activeTab === "WAREHOUSES" ? "active" : ""}
          onClick={() => setActiveTab("WAREHOUSES")}
        >
          <i className="bi bi-building me-2" />
          Warehouses
        </button>
      </div>

      {activeTab === "ZONES" ? (
        <>
          <div className="admin-panel-card mb-4">
            <h5 className="fw-bold mb-3">
              {editingZone ? "Edit Delivery Zone" : "Create Delivery Zone"}
            </h5>

            <form onSubmit={handleZoneSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Zone Name</label>
                  <input
                    name="zone"
                    className="form-control"
                    value={zoneFormValues.zone}
                    onChange={handleZoneChange}
                    placeholder="Zone Name"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    Pincode Prefixes
                  </label>
                  <input
                    name="prefixes"
                    className="form-control"
                    value={zoneFormValues.prefixes}
                    onChange={handleZoneChange}
                    placeholder="Prefixes"
                  />
                  <small className="text-muted">
                    Enter comma separated 2-digit prefixes.
                  </small>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Warehouse</label>
                  <select
                    name="warehouseId"
                    className="form-select"
                    value={zoneFormValues.warehouseId}
                    onChange={handleZoneChange}
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses
                      .filter((warehouse) => warehouse.active)
                      .map((warehouse) => (
                        <option value={warehouse.id} key={warehouse.id}>
                          {warehouse.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">
                    Delivery Days
                  </label>
                  <input
                    name="deliveryDays"
                    type="number"
                    min={1}
                    className="form-control"
                    value={zoneFormValues.deliveryDays}
                    onChange={handleZoneChange}
                    placeholder="DeliveryDays"
                  />
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="zoneCashOnDelivery"
                      name="cashOnDelivery"
                      type="checkbox"
                      className="form-check-input"
                      checked={zoneFormValues.cashOnDelivery}
                      onChange={handleZoneChange}
                    />
                    <label
                      htmlFor="zoneCashOnDelivery"
                      className="form-check-label fw-semibold"
                    >
                      COD Available
                    </label>
                  </div>
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="zoneFreeDelivery"
                      name="freeDelivery"
                      type="checkbox"
                      className="form-check-input"
                      checked={zoneFormValues.freeDelivery}
                      onChange={handleZoneChange}
                    />
                    <label
                      htmlFor="zoneFreeDelivery"
                      className="form-check-label fw-semibold"
                    >
                      Free Delivery
                    </label>
                  </div>
                </div>

                <div className="col-md-3 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="zoneActive"
                      name="active"
                      type="checkbox"
                      className="form-check-input"
                      checked={zoneFormValues.active}
                      onChange={handleZoneChange}
                    />
                    <label
                      htmlFor="zoneActive"
                      className="form-check-label fw-semibold"
                    >
                      Active
                    </label>
                  </div>
                </div>

                <div className="col-12 d-flex gap-2 justify-content-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingZone}
                  >
                    {editingZone ? "Update Zone" : "Create Zone"}
                  </Button>

                  {editingZone ? (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={resetZoneForm}
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
              <h5 className="fw-bold mb-0">Delivery Zones</h5>

              <input
                className="form-control admin-search-input"
                value={zoneSearch}
                onChange={(event) => setZoneSearch(event.target.value)}
                placeholder="Search zones..."
              />
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Zone</th>
                    <th>Prefixes</th>
                    <th>Warehouse</th>
                    <th>Days</th>
                    <th>COD</th>
                    <th>Free Delivery</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedZones.map((zone) => {
                    const warehouse = warehouseMap[zone.warehouseId];

                    return (
                      <tr key={zone.id}>
                        <td>
                          <strong>{zone.zone}</strong>
                        </td>

                        <td>{zone.prefixes.join(", ")}</td>

                        <td>{warehouse?.name ?? "Not mapped"}</td>

                        <td>{zone.deliveryDays}</td>

                        <td>
                          <span
                            className={`badge ${
                              zone.cashOnDelivery
                                ? "bg-success"
                                : "bg-secondary"
                            }`}
                          >
                            {zone.cashOnDelivery ? "Yes" : "No"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              zone.freeDelivery ? "bg-success" : "bg-secondary"
                            }`}
                          >
                            {zone.freeDelivery ? "Yes" : "No"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              zone.active ? "bg-success" : "bg-secondary"
                            }`}
                          >
                            {zone.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <AdminTableActions
                            itemName={`delivery zone ${zone.zone}`}
                            isActive={zone.active}
                            isLoading={updatingId === zone.id}
                            onEdit={() => handleEditZone(zone)}
                            onToggleStatus={() =>
                              void handleToggleZoneStatus(zone)
                            }
                            onDelete={() => void handleDeleteZone(zone)}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {filteredZones.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No delivery zones found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <AdminTablePagination
              totalItems={filteredZones.length}
              currentPage={zoneCurrentPage}
              itemsPerPage={zoneItemsPerPage}
              onPageChange={setZoneCurrentPage}
              onItemsPerPageChange={setZoneItemsPerPage}
              itemLabel="zones"
            />
          </div>
        </>
      ) : null}

      {activeTab === "WAREHOUSES" ? (
        <>
          <div className="admin-panel-card mb-4">
            <h5 className="fw-bold mb-3">
              {editingWarehouse ? "Edit Warehouse" : "Create Warehouse"}
            </h5>

            <form onSubmit={handleWarehouseSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">
                    Warehouse Name
                  </label>
                  <input
                    name="name"
                    className="form-control"
                    value={warehouseFormValues.name}
                    onChange={handleWarehouseChange}
                    placeholder="Warehouse Name"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">City</label>
                  <input
                    name="city"
                    className="form-control"
                    value={warehouseFormValues.city}
                    onChange={handleWarehouseChange}
                    placeholder="Enter City Name"
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label fw-semibold">State</label>
                  <input
                    name="state"
                    className="form-control"
                    value={warehouseFormValues.state}
                    onChange={handleWarehouseChange}
                    placeholder="Enter State"
                  />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      id="warehouseActive"
                      name="active"
                      type="checkbox"
                      className="form-check-input"
                      checked={warehouseFormValues.active}
                      onChange={handleWarehouseChange}
                    />
                    <label
                      htmlFor="warehouseActive"
                      className="form-check-label fw-semibold"
                    >
                      Active
                    </label>
                  </div>
                </div>

                <div className="col-12 d-flex gap-2 justify-content-end">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSavingWarehouse}
                  >
                    {editingWarehouse ? "Update Warehouse" : "Create Warehouse"}
                  </Button>

                  {editingWarehouse ? (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={resetWarehouseForm}
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
              <h5 className="fw-bold mb-0">Warehouses</h5>

              <input
                className="form-control admin-search-input"
                value={warehouseSearch}
                onChange={(event) => setWarehouseSearch(event.target.value)}
                placeholder="Search warehouses..."
              />
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>City</th>
                    <th>State</th>
                    <th>Linked Zones</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedWarehouses.map((warehouse) => {
                    const linkedZoneCount = zones.filter(
                      (zone) => zone.warehouseId === warehouse.id,
                    ).length;

                    return (
                      <tr key={warehouse.id}>
                        <td>
                          <strong>{warehouse.name}</strong>
                        </td>

                        <td>{warehouse.city}</td>

                        <td>{warehouse.state}</td>

                        <td>{linkedZoneCount}</td>

                        <td>
                          <span
                            className={`badge ${
                              warehouse.active ? "bg-success" : "bg-secondary"
                            }`}
                          >
                            {warehouse.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <AdminTableActions
                            itemName={`warehouse ${warehouse.name}`}
                            isActive={warehouse.active}
                            isLoading={updatingId === warehouse.id}
                            onEdit={() => handleEditWarehouse(warehouse)}
                            onToggleStatus={() =>
                              void handleToggleWarehouseStatus(warehouse)
                            }
                            onDelete={() =>
                              void handleDeleteWarehouse(warehouse)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {filteredWarehouses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No warehouses found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <AdminTablePagination
              totalItems={filteredWarehouses.length}
              currentPage={warehouseCurrentPage}
              itemsPerPage={warehouseItemsPerPage}
              onPageChange={setWarehouseCurrentPage}
              onItemsPerPageChange={setWarehouseItemsPerPage}
              itemLabel="warehouses"
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDeliveryZonesPage;

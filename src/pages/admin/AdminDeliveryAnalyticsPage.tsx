import { useEffect, useMemo, useState } from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { apiClient } from "../../services/apiClient";
import { deliveryService } from "../../services/deliveryService";
import { warehouseService } from "../../services/warehouseService";
import type { DeliveryZone, Warehouse } from "../../types/delivery";

interface DeliveryAnalyticsOrder {
  id: string;
  orderId?: string;
  totalAmount?: number;
  orderStatus?: string;
  deliveryAddress?: {
    pincode?: string;
    city?: string;
    state?: string;
  };
}

interface ZoneOrderMetric {
  zoneId: number;
  zoneName: string;
  orderCount: number;
  totalRevenue: number;
}

interface WarehouseLoadMetric {
  warehouseId: number;
  warehouseName: string;
  linkedZoneCount: number;
  averageDeliveryDays: number;
}

const AdminDeliveryAnalyticsPage = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [orders, setOrders] = useState<DeliveryAnalyticsOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [zoneList, warehouseList, orderList] = await Promise.all([
        deliveryService.getZones(),
        warehouseService.getWarehouses(),
        apiClient.get<DeliveryAnalyticsOrder[]>("/orders")
      ]);

      setZones(zoneList);
      setWarehouses(warehouseList);
      setOrders(orderList);
    } catch {
      setErrorMessage(
        "Unable to load delivery analytics. Please make sure JSON Server is running."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeZones = useMemo(() => {
    return zones.filter((zone) => zone.active);
  }, [zones]);

  const activeWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => warehouse.active);
  }, [warehouses]);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce<Record<number, Warehouse>>((result, warehouse) => {
      result[warehouse.id] = warehouse;
      return result;
    }, {});
  }, [warehouses]);

  const totalPrefixes = useMemo(() => {
    return zones.reduce((sum, zone) => sum + zone.prefixes.length, 0);
  }, [zones]);

  const averageDeliveryDays = useMemo(() => {
    if (activeZones.length === 0) {
      return 0;
    }

    const totalDays = activeZones.reduce(
      (sum, zone) => sum + zone.deliveryDays,
      0
    );

    return Number((totalDays / activeZones.length).toFixed(1));
  }, [activeZones]);

  const codAvailableZones = useMemo(() => {
    return activeZones.filter((zone) => zone.cashOnDelivery).length;
  }, [activeZones]);

  const freeDeliveryZones = useMemo(() => {
    return activeZones.filter((zone) => zone.freeDelivery).length;
  }, [activeZones]);

  const getZoneByPincode = (pincode?: string): DeliveryZone | null => {
    if (!pincode || pincode.length < 2) {
      return null;
    }

    const prefix = pincode.substring(0, 2);

    return (
      zones.find(
        (zone) => zone.active && zone.prefixes.includes(prefix)
      ) ?? null
    );
  };

  const zoneOrderMetrics = useMemo<ZoneOrderMetric[]>(() => {
    const metricsMap = new Map<number, ZoneOrderMetric>();

    zones.forEach((zone) => {
      metricsMap.set(zone.id, {
        zoneId: zone.id,
        zoneName: zone.zone,
        orderCount: 0,
        totalRevenue: 0
      });
    });

    orders.forEach((order) => {
      const matchedZone = getZoneByPincode(order.deliveryAddress?.pincode);

      if (!matchedZone) {
        return;
      }

      const existingMetric = metricsMap.get(matchedZone.id);

      if (!existingMetric) {
        return;
      }

      metricsMap.set(matchedZone.id, {
        ...existingMetric,
        orderCount: existingMetric.orderCount + 1,
        totalRevenue:
          existingMetric.totalRevenue + Number(order.totalAmount ?? 0)
      });
    });

    return Array.from(metricsMap.values()).sort(
      (first, second) => second.orderCount - first.orderCount
    );
  }, [orders, zones]);

  const warehouseLoadMetrics = useMemo<WarehouseLoadMetric[]>(() => {
    return warehouses
      .map((warehouse) => {
        const linkedZones = zones.filter(
          (zone) => zone.warehouseId === warehouse.id
        );

        const averageDays =
          linkedZones.length > 0
            ? linkedZones.reduce((sum, zone) => sum + zone.deliveryDays, 0) /
              linkedZones.length
            : 0;

        return {
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          linkedZoneCount: linkedZones.length,
          averageDeliveryDays: Number(averageDays.toFixed(1))
        };
      })
      .sort(
        (first, second) => second.linkedZoneCount - first.linkedZoneCount
      );
  }, [warehouses, zones]);

  const maxZoneOrderCount = useMemo(() => {
    return Math.max(...zoneOrderMetrics.map((metric) => metric.orderCount), 1);
  }, [zoneOrderMetrics]);

  const maxWarehouseZoneCount = useMemo(() => {
    return Math.max(
      ...warehouseLoadMetrics.map((metric) => metric.linkedZoneCount),
      1
    );
  }, [warehouseLoadMetrics]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return <Loader message="Loading delivery analytics..." />;
  }

  return (
    <div className="admin-delivery-analytics-page">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Delivery Analytics</h1>
          <p className="text-muted mb-0">
            Track delivery zone coverage, warehouse mapping, SLA and order
            distribution.
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

      <div className="row g-4 mb-4">
        <div className="col-md-6 col-xl-3">
          <div className="delivery-analytics-stat-card">
            <div className="delivery-analytics-stat-icon bg-primary-subtle text-primary">
              <i className="bi bi-geo-alt" />
            </div>

            <div>
              <p className="text-muted mb-1">Active Zones</p>
              <h3 className="fw-bold mb-0">
                {activeZones.length}/{zones.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="delivery-analytics-stat-card">
            <div className="delivery-analytics-stat-icon bg-success-subtle text-success">
              <i className="bi bi-building" />
            </div>

            <div>
              <p className="text-muted mb-1">Active Warehouses</p>
              <h3 className="fw-bold mb-0">
                {activeWarehouses.length}/{warehouses.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="delivery-analytics-stat-card">
            <div className="delivery-analytics-stat-icon bg-warning-subtle text-warning">
              <i className="bi bi-clock-history" />
            </div>

            <div>
              <p className="text-muted mb-1">Avg Delivery SLA</p>
              <h3 className="fw-bold mb-0">{averageDeliveryDays} Days</h3>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-xl-3">
          <div className="delivery-analytics-stat-card">
            <div className="delivery-analytics-stat-icon bg-info-subtle text-info">
              <i className="bi bi-signpost-split" />
            </div>

            <div>
              <p className="text-muted mb-1">Pincode Prefixes</p>
              <h3 className="fw-bold mb-0">{totalPrefixes}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="admin-panel-card h-100">
            <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
              <div>
                <h5 className="fw-bold mb-1">Service Availability</h5>
                <p className="text-muted small mb-0">
                  COD and free delivery status across active delivery zones.
                </p>
              </div>
            </div>

            <div className="delivery-analytics-progress-list">
              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">COD Available Zones</span>
                  <span className="fw-bold">
                    {codAvailableZones}/{activeZones.length}
                  </span>
                </div>

                <div className="delivery-analytics-progress">
                  <span
                    style={{
                      width: `${
                        activeZones.length
                          ? (codAvailableZones / activeZones.length) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="fw-semibold">Free Delivery Zones</span>
                  <span className="fw-bold">
                    {freeDeliveryZones}/{activeZones.length}
                  </span>
                </div>

                <div className="delivery-analytics-progress success">
                  <span
                    style={{
                      width: `${
                        activeZones.length
                          ? (freeDeliveryZones / activeZones.length) * 100
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="admin-panel-card h-100">
            <h5 className="fw-bold mb-3">Warehouse Load</h5>

            <div className="delivery-analytics-bar-list">
              {warehouseLoadMetrics.map((metric) => (
                <div className="delivery-analytics-bar-item" key={metric.warehouseId}>
                  <div className="d-flex justify-content-between gap-3 mb-2">
                    <span className="fw-semibold">
                      {metric.warehouseName}
                    </span>

                    <span className="text-muted small">
                      {metric.linkedZoneCount} zones
                    </span>
                  </div>

                  <div className="delivery-analytics-horizontal-bar">
                    <span
                      style={{
                        width: `${
                          (metric.linkedZoneCount / maxWarehouseZoneCount) *
                          100
                        }%`
                      }}
                    />
                  </div>

                  <p className="text-muted small mb-0 mt-1">
                    Avg SLA: {metric.averageDeliveryDays} days
                  </p>
                </div>
              ))}

              {warehouseLoadMetrics.length === 0 ? (
                <p className="text-muted mb-0">No warehouses found.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">Zone Order Distribution</h5>

        <div className="delivery-analytics-zone-list">
          {zoneOrderMetrics.map((metric) => (
            <div className="delivery-zone-performance-card" key={metric.zoneId}>
              <div className="delivery-zone-performance-header">
                <div>
                  <h6 className="fw-bold mb-1">{metric.zoneName}</h6>
                  <p className="text-muted small mb-0">
                    Revenue: {formatCurrency(metric.totalRevenue)}
                  </p>
                </div>

                <span className="delivery-zone-order-count">
                  {metric.orderCount} Orders
                </span>
              </div>

              <div className="delivery-analytics-horizontal-bar mt-3">
                <span
                  style={{
                    width: `${(metric.orderCount / maxZoneOrderCount) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}

          {zoneOrderMetrics.length === 0 ? (
            <p className="text-muted mb-0">No delivery zone metrics found.</p>
          ) : null}
        </div>
      </div>

      <div className="admin-panel-card">
        <h5 className="fw-bold mb-3">Delivery Zone Details</h5>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Prefixes</th>
                <th>Warehouse</th>
                <th>Delivery SLA</th>
                <th>COD</th>
                <th>Free Delivery</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {zones.map((zone) => {
                const warehouse = warehouseMap[zone.warehouseId];

                return (
                  <tr key={zone.id}>
                    <td>
                      <strong>{zone.zone}</strong>
                    </td>

                    <td>{zone.prefixes.join(", ")}</td>

                    <td>{warehouse?.name ?? "Not mapped"}</td>

                    <td>{zone.deliveryDays} Days</td>

                    <td>
                      <span
                        className={`badge ${
                          zone.cashOnDelivery ? "bg-success" : "bg-secondary"
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
                  </tr>
                );
              })}

              {zones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No delivery zones found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDeliveryAnalyticsPage;
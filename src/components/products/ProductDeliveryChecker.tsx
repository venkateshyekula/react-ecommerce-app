import { useEffect, useMemo, useState, type FormEvent } from "react";
import Button from "../common/Button";
import { deliveryService } from "../../services/deliveryService";
import { deliverySlaService } from "../../services/deliverySlaService";
import { sellerFulfillmentService } from "../../services/sellerFulfillmentService";
import { warehouseService } from "../../services/warehouseService";
import type {
  DeliverySlaRule,
  DeliveryZone,
  SellerFulfillmentMapping,
  Warehouse
} from "../../types/delivery";
import type { Product } from "../../types/product";
import { isValidPincode } from "../../utils/validation";

interface ProductDeliveryCheckerProps {
  product: Product;
}

interface DeliveryInfo {
  zone: DeliveryZone;
  warehouse?: Warehouse;
  sellerMapping?: SellerFulfillmentMapping;
  slaRule?: DeliverySlaRule;
  estimatedDate: string;
  finalDeliveryDays: number;
  fulfillmentMessage: string;
}

const ProductDeliveryChecker = ({ product }: ProductDeliveryCheckerProps) => {
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [slaRules, setSlaRules] = useState<DeliverySlaRule[]>([]);
  const [sellerMappings, setSellerMappings] = useState<
    SellerFulfillmentMapping[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);

  useEffect(() => {
    const loadDeliveryData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        const [zoneList, warehouseList, slaRuleList, mappingList] =
          await Promise.all([
            deliveryService.getZones(),
            warehouseService.getWarehouses(),
            deliverySlaService.getRules(),
            sellerFulfillmentService.getMappings()
          ]);

        setZones(zoneList);
        setWarehouses(warehouseList);
        setSlaRules(slaRuleList);
        setSellerMappings(mappingList);
      } catch {
        setError("Unable to load delivery settings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDeliveryData();
  }, []);

  const warehouseMap = useMemo(() => {
    return warehouses.reduce<Record<number, Warehouse>>((result, warehouse) => {
      result[warehouse.id] = warehouse;
      return result;
    }, {});
  }, [warehouses]);

  const activeSlaRule = useMemo(() => {
    return (
      slaRules
        .filter((rule) => rule.active && rule.category === product.category)
        .sort(
          (firstRule, secondRule) =>
            firstRule.priority - secondRule.priority
        )[0] ?? undefined
    );
  }, [slaRules, product.category]);

  const activeSellerMapping = useMemo(() => {
    if (!product.sellerId) {
      return undefined;
    }

    return sellerMappings.find(
      (mapping) => mapping.active && mapping.sellerId === product.sellerId
    );
  }, [sellerMappings, product.sellerId]);

  const getEstimatedDeliveryDate = (deliveryDays: number): string => {
    const deliveryDate = new Date();

    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    return deliveryDate.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  };

  const getFulfillmentWarehouse = (
    matchedZone: DeliveryZone
  ): {
    warehouse?: Warehouse;
    fulfillmentMessage: string;
    additionalSellerDays: number;
  } => {
    const zoneWarehouse = warehouseMap[matchedZone.warehouseId];

    if (!activeSellerMapping) {
      return {
        warehouse: zoneWarehouse,
        fulfillmentMessage:
          "Fulfilled through zone warehouse routing.",
        additionalSellerDays: 0
      };
    }

    if (
      activeSellerMapping.warehouseIds.includes(matchedZone.warehouseId)
    ) {
      return {
        warehouse: zoneWarehouse,
        fulfillmentMessage:
          "Seller ships from the mapped zone warehouse.",
        additionalSellerDays: 0
      };
    }

    const preferredWarehouse =
      warehouseMap[activeSellerMapping.preferredWarehouseId];

    if (preferredWarehouse?.active) {
      return {
        warehouse: preferredWarehouse,
        fulfillmentMessage:
          "Seller does not ship from this zone warehouse. Preferred seller warehouse applied.",
        additionalSellerDays: 1
      };
    }

    const fallbackWarehouseId = activeSellerMapping.warehouseIds.find(
      (warehouseId) => warehouseMap[warehouseId]?.active
    );

    const fallbackWarehouse = fallbackWarehouseId
      ? warehouseMap[fallbackWarehouseId]
      : undefined;

    return {
      warehouse: fallbackWarehouse ?? zoneWarehouse,
      fulfillmentMessage:
        fallbackWarehouse
          ? "Fallback active seller warehouse applied."
          : "Zone warehouse applied because seller warehouses are unavailable.",
      additionalSellerDays: fallbackWarehouse ? 2 : 0
    };
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!pincode.trim()) {
      setError("Please enter pincode.");
      setDeliveryInfo(null);
      return;
    }

    if (!isValidPincode(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      setDeliveryInfo(null);
      return;
    }

    const prefix = pincode.substring(0, 2);

    const matchedZone = zones.find(
      (zone) => zone.active && zone.prefixes.includes(prefix)
    );

    if (!matchedZone) {
      setError("Delivery information is unavailable for this pincode.");
      setDeliveryInfo(null);
      return;
    }

    const fulfillmentResult = getFulfillmentWarehouse(matchedZone);

    if (fulfillmentResult.warehouse && !fulfillmentResult.warehouse.active) {
      setError("Selected fulfillment warehouse is inactive.");
      setDeliveryInfo(null);
      return;
    }

    const categoryHandlingDays = activeSlaRule?.handlingDays ?? 0;
    const categoryAdditionalDays = activeSlaRule?.additionalDays ?? 0;

    const finalDeliveryDays =
      matchedZone.deliveryDays +
      categoryHandlingDays +
      categoryAdditionalDays +
      fulfillmentResult.additionalSellerDays;

    setError("");

    setDeliveryInfo({
      zone: matchedZone,
      warehouse: fulfillmentResult.warehouse,
      sellerMapping: activeSellerMapping,
      slaRule: activeSlaRule,
      finalDeliveryDays,
      fulfillmentMessage: fulfillmentResult.fulfillmentMessage,
      estimatedDate: getEstimatedDeliveryDate(finalDeliveryDays)
    });
  };

  return (
    <div className="product-delivery-panel">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h6 className="product-panel-title mb-1">
            <i className="bi bi-truck me-2 text-primary" />
            Delivery Options
          </h6>

          <p className="text-muted small mb-0">
            Estimate is based on pincode, product category and seller warehouse.
          </p>
        </div>

        <i className="bi bi-geo-alt fs-4 text-primary" />
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="product-delivery-form"
      >
        <input
          type="text"
          className={`form-control ${error ? "is-invalid" : ""}`}
          placeholder="Enter pincode"
          value={pincode}
          maxLength={6}
          inputMode="numeric"
          onChange={(event) => {
            setPincode(event.target.value.replace(/\D/g, ""));
            setError("");
            setDeliveryInfo(null);
          }}
        />

        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Loading" : "Check"}
        </Button>
      </form>

      {error ? (
        <div className="text-danger small fw-semibold mt-2">{error}</div>
      ) : null}

      {deliveryInfo ? (
        <div className="product-delivery-result mt-3">
          <div className="product-panel-item">
            <span className="product-panel-icon">
              <i className="bi bi-calendar-check" />
            </span>

            <div className="product-panel-content">
              <strong>Delivery by {deliveryInfo.estimatedDate}</strong>
              <p>
                Estimated delivery in {deliveryInfo.finalDeliveryDays} days.
              </p>
            </div>
          </div>

          <div className="product-panel-item">
            <span className="product-panel-icon">
              <i className="bi bi-building" />
            </span>

            <div className="product-panel-content">
              <strong>
                {deliveryInfo.warehouse?.name ?? "Nearest Fulfillment Center"}
              </strong>
              <p>{deliveryInfo.zone.zone}</p>
            </div>
          </div>

          <div className="product-panel-item">
            <span className="product-panel-icon">
              <i className="bi bi-shop" />
            </span>

            <div className="product-panel-content">
              <strong>
                {deliveryInfo.sellerMapping?.sellerName ??
                  product.sellerName ??
                  "ShopEase Seller"}
              </strong>
              <p>{deliveryInfo.fulfillmentMessage}</p>
            </div>
          </div>

          {deliveryInfo.slaRule ? (
            <div className="product-panel-item">
              <span className="product-panel-icon">
                <i className="bi bi-speedometer2" />
              </span>

              <div className="product-panel-content">
                <strong>Category SLA Applied</strong>
                <p>
                  Handling: {deliveryInfo.slaRule.handlingDays} day(s), Extra:
                  {deliveryInfo.slaRule.additionalDays} day(s).
                </p>
              </div>
            </div>
          ) : null}

          <div className="product-panel-item">
            <span className="product-panel-icon">
              <i className="bi bi-wallet2" />
            </span>

            <div className="product-panel-content">
              <strong>
                {deliveryInfo.zone.cashOnDelivery
                  ? "Cash on Delivery Available"
                  : "Cash on Delivery Not Available"}
              </strong>
              <p>Payment options may vary by location.</p>
            </div>
          </div>

          <div className="product-panel-item">
            <span className="product-panel-icon">
              <i className="bi bi-gift" />
            </span>

            <div className="product-panel-content">
              <strong>
                {deliveryInfo.zone.freeDelivery
                  ? "Free Delivery"
                  : "Standard Delivery Charges Apply"}
              </strong>
              <p>Delivery charges are calculated during checkout.</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDeliveryChecker;
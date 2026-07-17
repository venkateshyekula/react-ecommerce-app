import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import { couponService } from "../../services/couponService";
import type {
  Coupon,
  CouponDiscountType,
  CouponRedemption,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "../../types/coupon";
import { formatCurrency } from "../../utils/currencyFormatter";
import AdminTableActions from "../../components/admin/AdminTableActions";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { useToast } from "../../context/useToast";

interface CouponFormValues {
  code: string;
  title: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minCartValue: string;
  maxDiscountAmount: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

const initialFormValues: CouponFormValues = {
  code: "",
  title: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minCartValue: "",
  maxDiscountAmount: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
  validFrom: "",
  validUntil: "",
};

const toDateInputValue = (dateValue: string): string => {
  if (!dateValue) {
    return "";
  }

  return dateValue.slice(0, 10);
};

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [formValues, setFormValues] =
    useState<CouponFormValues>(initialFormValues);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [updatingCouponId, setUpdatingCouponId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { showToast } = useToast();

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [couponList, redemptionList] = await Promise.all([
        couponService.getCoupons(),
        couponService.getRedemptions(),
      ]);

      setCoupons(couponList);
      setRedemptions(redemptionList);
    } catch {
      setErrorMessage(
        "Unable to load coupon dashboard. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredCoupons = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return coupons.filter((coupon) => {
      return (
        !query ||
        coupon.code.toLowerCase().includes(query) ||
        coupon.title.toLowerCase().includes(query) ||
        coupon.description.toLowerCase().includes(query)
      );
    });
  }, [coupons, searchText]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedCoupons,
    setCurrentPage,
    setItemsPerPage,
  } = useAdminTablePagination({
    items: filteredCoupons,
    defaultItemsPerPage: 5,
    resetDependencies: [searchText],
  });

  const totalCouponDiscount = useMemo(() => {
    return redemptions.reduce(
      (sum, redemption) => sum + redemption.discountAmount,
      0,
    );
  }, [redemptions]);

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value, type } = event.target;

    const checked =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : false;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetForm = (): void => {
    setFormValues(initialFormValues);
    setEditingCoupon(null);
  };

  const validateForm = (): boolean => {
    if (!formValues.code.trim()) {
      setErrorMessage("Coupon code is required.");
      return false;
    }

    if (!formValues.title.trim()) {
      setErrorMessage("Coupon title is required.");
      return false;
    }

    if (!formValues.description.trim()) {
      setErrorMessage("Coupon description is required.");
      return false;
    }

    if (!formValues.validFrom || !formValues.validUntil) {
      setErrorMessage("Valid from and valid until dates are required.");
      return false;
    }

    if (new Date(formValues.validFrom) > new Date(formValues.validUntil)) {
      setErrorMessage("Valid from date cannot be after valid until date.");
      return false;
    }

    const discountValue = Number(formValues.discountValue || 0);

    if (formValues.discountType !== "FREE_SHIPPING" && discountValue <= 0) {
      setErrorMessage("Discount value must be greater than zero.");
      return false;
    }

    if (formValues.discountType === "PERCENTAGE" && discountValue > 100) {
      setErrorMessage("Percentage discount cannot be greater than 100.");
      return false;
    }

    return true;
  };

  const buildPayload = (): CreateCouponPayload => {
    return {
      code: formValues.code.trim().toUpperCase(),
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      discountType: formValues.discountType,
      discountValue:
        formValues.discountType === "FREE_SHIPPING"
          ? 0
          : Number(formValues.discountValue || 0),
      minCartValue: Number(formValues.minCartValue || 0),
      maxDiscountAmount: formValues.maxDiscountAmount
        ? Number(formValues.maxDiscountAmount)
        : undefined,
      usageLimit: formValues.usageLimit
        ? Number(formValues.usageLimit)
        : undefined,
      perUserLimit: formValues.perUserLimit
        ? Number(formValues.perUserLimit)
        : undefined,
      isActive: formValues.isActive,
      validFrom: new Date(formValues.validFrom).toISOString(),
      validUntil: new Date(formValues.validUntil).toISOString(),
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

      if (editingCoupon) {
        const updatePayload: UpdateCouponPayload = {
          ...payload,
          updatedAt: new Date().toISOString(),
        };

        const updatedCoupon = await couponService.updateCoupon(
          editingCoupon.id,
          updatePayload,
        );

        setCoupons((previousCoupons) =>
          previousCoupons.map((coupon) =>
            coupon.id === updatedCoupon.id ? updatedCoupon : coupon,
          ),
        );

        setSuccessMessage("Coupon updated successfully.");
      } else {
        const createdCoupon = await couponService.createCoupon(payload);

        setCoupons((previousCoupons) => [createdCoupon, ...previousCoupons]);
        setSuccessMessage("Coupon created successfully.");
      }

      resetForm();
    } catch {
      setErrorMessage("Unable to save coupon. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (coupon: Coupon): void => {
    setEditingCoupon(coupon);
    setFormValues({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minCartValue: String(coupon.minCartValue),
      maxDiscountAmount: coupon.maxDiscountAmount
        ? String(coupon.maxDiscountAmount)
        : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "",
      isActive: coupon.isActive,
      validFrom: toDateInputValue(coupon.validFrom),
      validUntil: toDateInputValue(coupon.validUntil),
    });
  };

  const handleToggleStatus = async (coupon: Coupon): Promise<void> => {
    try {
      setUpdatingCouponId(coupon.id);

      const updatedCoupon = await couponService.updateCoupon(coupon.id, {
        isActive: !coupon.isActive,
        updatedAt: new Date().toISOString(),
      });

      setCoupons((previousCoupons) =>
        previousCoupons.map((existingCoupon) =>
          existingCoupon.id === updatedCoupon.id
            ? updatedCoupon
            : existingCoupon,
        ),
      );
    } catch {
      setErrorMessage("Unable to update coupon status.");
    } finally {
      setUpdatingCouponId("");
    }
  };

  const handleDelete = async (coupon: Coupon): Promise<void> => {
    const shouldDelete = window.confirm(
      `Are you sure you want to delete coupon ${coupon.code}?`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      setUpdatingCouponId(coupon.id);
      await couponService.deleteCoupon(coupon.id);

      setCoupons((previousCoupons) =>
        previousCoupons.filter(
          (existingCoupon) => existingCoupon.id !== coupon.id,
        ),
      );
      showToast(
"Coupon deleted",
"Coupon was deleted successfully.",
"success"
);
    } catch {
      showToast("Unable to delete coupon", "Please try again.", "danger")
    } finally {
      setUpdatingCouponId("");
    }
  };

  if (isLoading) {
    return <Loader message="Loading coupon dashboard..." />;
  }

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="fw-bold mb-1">Coupon Management</h1>
          <p className="text-muted mb-0">
            Create coupons, manage usage limits, and review redemption history.
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

      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="coupon-stat-card">
            <p className="text-muted mb-1">Total Coupons</p>
            <h3 className="fw-bold mb-0">{coupons.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="coupon-stat-card">
            <p className="text-muted mb-1">Total Redemptions</p>
            <h3 className="fw-bold mb-0">{redemptions.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="coupon-stat-card">
            <p className="text-muted mb-1">Total Discount Given</p>
            <h3 className="fw-bold mb-0">
              {formatCurrency(totalCouponDiscount)}
            </h3>
          </div>
        </div>
      </div>

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">
          {editingCoupon ? "Edit Coupon" : "Create Coupon"}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label fw-semibold">Code</label>
              <input
                name="code"
                className="form-control text-uppercase"
                value={formValues.code}
                onChange={handleChange}
                placeholder="WELCOME10"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Title</label>
              <input
                name="title"
                className="form-control"
                value={formValues.title}
                onChange={handleChange}
                placeholder="Welcome Offer"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Discount Type</label>
              <select
                name="discountType"
                className="form-select"
                value={formValues.discountType}
                onChange={handleChange}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT">Flat</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Discount Value</label>
              <input
                name="discountValue"
                type="number"
                className="form-control"
                value={formValues.discountValue}
                onChange={handleChange}
                disabled={formValues.discountType === "FREE_SHIPPING"}
                placeholder="10"
              />
            </div>

            <div className="col-md-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows={2}
                value={formValues.description}
                onChange={handleChange}
                placeholder="Describe this coupon"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Min Cart Value</label>
              <input
                name="minCartValue"
                type="number"
                className="form-control"
                value={formValues.minCartValue}
                onChange={handleChange}
                placeholder="999"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Max Discount</label>
              <input
                name="maxDiscountAmount"
                type="number"
                className="form-control"
                value={formValues.maxDiscountAmount}
                onChange={handleChange}
                placeholder="500"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Usage Limit</label>
              <input
                name="usageLimit"
                type="number"
                className="form-control"
                value={formValues.usageLimit}
                onChange={handleChange}
                placeholder="100"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Per User Limit</label>
              <input
                name="perUserLimit"
                type="number"
                className="form-control"
                value={formValues.perUserLimit}
                onChange={handleChange}
                placeholder="1"
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Valid From</label>
              <input
                name="validFrom"
                type="date"
                className="form-control"
                value={formValues.validFrom}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Valid Until</label>
              <input
                name="validUntil"
                type="date"
                className="form-control"
                value={formValues.validUntil}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="couponIsActive"
                  name="isActive"
                  type="checkbox"
                  className="form-check-input"
                  checked={formValues.isActive}
                  onChange={handleChange}
                />
                <label
                  htmlFor="couponIsActive"
                  className="form-check-label fw-semibold"
                >
                  Active Coupon
                </label>
              </div>
            </div>

            <div className="col-md-3 d-flex align-items-end gap-2">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                {editingCoupon ? "Update" : "Create"}
              </Button>

              {editingCoupon ? (
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

      <div className="admin-panel-card mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Coupons</h5>

          <input
            className="form-control admin-search-input"
            placeholder="Search coupons..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Coupon</th>
                <th>Discount</th>
                <th>Min Cart</th>
                <th>Usage</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedCoupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td>
                    <h6 className="fw-bold mb-1">{coupon.code}</h6>
                    <p className="small text-muted mb-0">{coupon.title}</p>
                  </td>

                  <td>
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : coupon.discountType === "FLAT"
                        ? formatCurrency(coupon.discountValue)
                        : "Free Shipping"}
                  </td>

                  <td>{formatCurrency(coupon.minCartValue)}</td>

                  <td>
                    {coupon.usedCount}
                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                  </td>

                  <td>
                    <p className="small mb-0">
                      {new Date(coupon.validFrom).toLocaleDateString("en-IN")}
                    </p>
                    <p className="small text-muted mb-0">
                      to{" "}
                      {new Date(coupon.validUntil).toLocaleDateString("en-IN")}
                    </p>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        coupon.isActive ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {coupon.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>

                  <td>
                    <AdminTableActions
                      itemName={`coupon ${coupon.code}`}
                      isActive={coupon.isActive}
                      isLoading={updatingCouponId === coupon.id}
                      onEdit={() => handleEdit(coupon)}
                      onToggleStatus={() => void handleToggleStatus(coupon)}
                      onDelete={() => void handleDelete(coupon)}
                    />
                  </td>
                </tr>
              ))}

              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No coupons found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          totalItems={filteredCoupons.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="coupons"
        />
      </div>

      <div className="admin-panel-card">
        <h5 className="fw-bold mb-3">Recent Coupon Redemptions</h5>

        {redemptions.length === 0 ? (
          <p className="text-muted mb-0">No coupon redemptions found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Coupon</th>
                  <th>User</th>
                  <th>Order</th>
                  <th>Discount</th>
                  <th>Redeemed At</th>
                </tr>
              </thead>

              <tbody>
                {redemptions.slice(0, 10).map((redemption) => (
                  <tr key={redemption.id}>
                    <td>{redemption.couponCode}</td>
                    <td>{redemption.userId}</td>
                    <td>{redemption.orderId}</td>
                    <td>{formatCurrency(redemption.discountAmount)}</td>
                    <td>
                      {new Date(redemption.redeemedAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;

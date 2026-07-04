import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { couponService } from "../services/couponService";
import { orderService } from "../services/orderService";
import type { AppliedCoupon } from "../types/coupon";
import type {
  CheckoutFormValues,
  CreateOrderPayload,
  PaymentMethod,
} from "../types/order";
import {
  calculateCouponDiscount,
  validateCouponForCart,
} from "../utils/couponUtils";
import { formatCurrency } from "../utils/currencyFormatter";
import {
  generateOrderId,
  getInitialTrackingEvents,
  getInitialTrackingSteps,
} from "../utils/orderUtils";
import {
  paymentMethods,
  validateCheckoutForm,
  type ValidationErrors,
} from "../utils/validation";

type CheckoutStep = "address" | "payment" | "review";

type CheckoutErrorKey =
  | "fullName"
  | "mobile"
  | "addressLine"
  | "city"
  | "state"
  | "pincode"
  | "paymentMethod"
  | "cardNumber"
  | "cardHolderName"
  | "expiryDate"
  | "cvv"
  | "upiId";

const initialCheckoutValues: CheckoutFormValues = {
  deliveryAddress: {
    fullName: "",
    mobile: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  },
  paymentMethod: "",
  cardDetails: {
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
  },
  upiDetails: {
    upiId: "",
  },
};

const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");
  const [values, setValues] = useState<CheckoutFormValues>(() => ({
    ...initialCheckoutValues,
    deliveryAddress: {
      ...initialCheckoutValues.deliveryAddress,
      fullName: currentUser?.name ?? "",
      mobile: currentUser?.mobile ?? "",
      addressLine: currentUser?.address ?? "",
    },
  }));

  const [errors, setErrors] = useState<ValidationErrors<CheckoutErrorKey>>({});
  const [serverError, setServerError] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponMessage, setCouponMessage] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const deliveryFee = cartTotal > 0 && cartTotal < 999 ? 99 : 0;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    return calculateCouponDiscount(appliedCoupon.coupon, cartTotal);
  }, [appliedCoupon, cartTotal]);

  const grandTotal = Math.max(0, cartTotal - discountAmount + deliveryFee);

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof CheckoutFormValues["deliveryAddress"];

    setValues((previousValues) => ({
      ...previousValues,
      deliveryAddress: {
        ...previousValues.deliveryAddress,
        [fieldName]: value,
      },
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));

    setServerError("");
  };

  const handlePaymentMethodChange = (
    event: ChangeEvent<HTMLSelectElement>,
  ): void => {
    const selectedPaymentMethod = event.target.value as PaymentMethod | "";

    setValues((previousValues) => ({
      ...previousValues,
      paymentMethod: selectedPaymentMethod,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      paymentMethod: undefined,
    }));

    setServerError("");
  };

  const handleCardDetailsChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof CheckoutFormValues["cardDetails"];

    setValues((previousValues) => ({
      ...previousValues,
      cardDetails: {
        ...previousValues.cardDetails,
        [fieldName]: value,
      },
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));

    setServerError("");
  };

  const handleUpiDetailsChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const { value } = event.target;

    setValues((previousValues) => ({
      ...previousValues,
      upiDetails: {
        ...previousValues.upiDetails,
        upiId: value,
      },
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      upiId: undefined,
    }));

    setServerError("");
  };

  const validateAddressStep = (): boolean => {
    const validationErrors = validateCheckoutForm({
      ...values,
      paymentMethod: "Cash on Delivery",
    });

    const addressErrors: ValidationErrors<CheckoutErrorKey> = {};
    const addressKeys: CheckoutErrorKey[] = [
      "fullName",
      "mobile",
      "addressLine",
      "city",
      "state",
      "pincode",
    ];

    addressKeys.forEach((key) => {
      if (validationErrors[key]) {
        addressErrors[key] = validationErrors[key];
      }
    });

    setErrors((previousErrors) => {
      const cleanErrors = { ...previousErrors };
      addressKeys.forEach((key) => delete cleanErrors[key]);
      return { ...cleanErrors, ...addressErrors };
    });

    return Object.keys(addressErrors).length === 0;
  };

  const validatePaymentStep = (): boolean => {
    const validationErrors = validateCheckoutForm(values);
    const paymentErrors: ValidationErrors<CheckoutErrorKey> = {};

    if (validationErrors.paymentMethod) {
      paymentErrors.paymentMethod = validationErrors.paymentMethod;
    }

    if (values.paymentMethod === "Credit Card") {
      if (validationErrors.cardNumber)
        paymentErrors.cardNumber = validationErrors.cardNumber;
      if (validationErrors.cardHolderName)
        paymentErrors.cardHolderName = validationErrors.cardHolderName;
      if (validationErrors.expiryDate)
        paymentErrors.expiryDate = validationErrors.expiryDate;
      if (validationErrors.cvv) paymentErrors.cvv = validationErrors.cvv;
    } else if (values.paymentMethod === "UPI") {
      if (validationErrors.upiId) paymentErrors.upiId = validationErrors.upiId;
    }

    const paymentKeys: CheckoutErrorKey[] = [
      "paymentMethod",
      "cardNumber",
      "cardHolderName",
      "expiryDate",
      "cvv",
      "upiId",
    ];
    setErrors((previousErrors) => {
      const cleanErrors = { ...previousErrors };
      paymentKeys.forEach((key) => delete cleanErrors[key]);
      return { ...cleanErrors, ...paymentErrors };
    });

    return Object.keys(paymentErrors).length === 0;
  };

  const goToPreviousStep = (): void => {
    if (currentStep === "payment") {
      setCurrentStep("address");
      return;
    }

    if (currentStep === "review") {
      setCurrentStep("payment");
    }
  };

  const handleApplyCoupon = async (): Promise<void> => {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setCouponMessage("Please enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }

    try {
      setIsApplyingCoupon(true);
      setCouponMessage("");

      const coupon = await couponService.getCouponByCode(normalizedCode);
      const validationResult = validateCouponForCart(coupon, cartTotal);

      if (!validationResult.isValid || !coupon) {
        setAppliedCoupon(null);
        setCouponMessage(validationResult.message);
        return;
      }

      const calculatedDiscount = calculateCouponDiscount(coupon, cartTotal);

      setAppliedCoupon({
        coupon,
        discountAmount: calculatedDiscount,
      });

      setCouponMessage(validationResult.message);
    } catch {
      setAppliedCoupon(null);
      setCouponMessage(
        "Unable to apply coupon. Please make sure JSON Server is running.",
      );
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = (): void => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (currentStep === "address") {
      if (validateAddressStep()) {
        setCurrentStep("payment");
      }
      return;
    }

    if (currentStep === "payment") {
      if (validatePaymentStep()) {
        setCurrentStep("review");
      }
      return;
    }

    if (currentStep !== "review") {
      return;
    }

    if (!currentUser) {
      navigate("/login", {
        replace: true,
      });
      return;
    }

    if (cartItems.length === 0) {
      setServerError(
        "Your cart is empty. Please add products before checkout.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      const orderId = generateOrderId();

      const orderPayload: CreateOrderPayload = {
        userId: currentUser.id,
        orderId,
        orderDate: new Date().toISOString(),
        items: cartItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          brand: item.brand,
          price: item.price,
          image: item.image,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          selectedSize: item.selectedSize,
        })),
        totalAmount: grandTotal,
        // FIXED: Explicitly cast type because previous steps guarantee it's not empty string ""
        paymentMethod: values.paymentMethod as PaymentMethod,
        deliveryAddress: values.deliveryAddress,
        orderStatus: "Order Placed",
        trackingSteps: getInitialTrackingSteps(),
        trackingEvents: getInitialTrackingEvents(),
      };

      const createdOrder = await orderService.createOrder(orderPayload);

      clearCart();

      navigate(`/order-success/${createdOrder.orderId}`, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again.";

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page bg-light">
        <div className="container py-5">
          <EmptyState
            title="Your Cart is Empty"
            message="There are no items left in your cart to process a secure transaction checkout."
            action={
              <Link to="/products" className="btn btn-primary">
                Browse Products
              </Link>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page bg-light">
      <section className="page-header bg-white border-bottom">
        <div className="container py-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h1 className="fw-bold mb-1">Checkout</h1>
              <p className="text-muted mb-0">
                Complete your address, payment, and order review.
              </p>
            </div>

            <Link to="/cart" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2" />
              Back to Cart
            </Link>
          </div>
        </div>
      </section>

      <section className="container py-4 py-md-5">
        <form onSubmit={handleSubmit} noValidate>
          <div className="checkout-steps bg-white rounded-4 shadow-sm p-3 p-md-4 mb-4">
            <div className="checkout-step-track">
              <div
                className={`checkout-step ${
                  currentStep === "address" ? "active" : "completed"
                }`}
              >
                <span>1</span>
                Address
              </div>

              <div
                className={`checkout-step ${
                  currentStep === "payment"
                    ? "active"
                    : currentStep === "review"
                      ? "completed"
                      : ""
                }`}
              >
                <span>2</span>
                Payment
              </div>

              <div
                className={`checkout-step ${
                  currentStep === "review" ? "active" : ""
                }`}
              >
                <span>3</span>
                Review
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              {serverError ? (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              ) : null}

              {currentStep === "address" ? (
                <div className="bg-white rounded-4 shadow-sm p-4 p-md-5 mb-4">
                  <h4 className="fw-bold mb-4">
                    <i className="bi bi-geo-alt me-2 text-primary" />
                    Delivery Address
                  </h4>

                  <div className="row">
                    <div className="col-md-6">
                      <FormInput
                        label="Full Name"
                        name="fullName"
                        type="text"
                        placeholder="Enter full name"
                        value={values.deliveryAddress.fullName}
                        error={errors.fullName}
                        onChange={handleAddressChange}
                      />
                    </div>

                    <div className="col-md-6">
                      <FormInput
                        label="Mobile Number"
                        name="mobile"
                        type="tel"
                        placeholder="Enter mobile number"
                        value={values.deliveryAddress.mobile}
                        error={errors.mobile}
                        onChange={handleAddressChange}
                      />
                    </div>

                    <div className="col-12">
                      <FormInput
                        label="Address Line"
                        name="addressLine"
                        type="text"
                        placeholder="House number, street, area"
                        value={values.deliveryAddress.addressLine}
                        error={errors.addressLine}
                        onChange={handleAddressChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <FormInput
                        label="City"
                        name="city"
                        type="text"
                        placeholder="Enter city"
                        value={values.deliveryAddress.city}
                        error={errors.city}
                        onChange={handleAddressChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <FormInput
                        label="State"
                        name="state"
                        type="text"
                        placeholder="Enter state"
                        value={values.deliveryAddress.state}
                        error={errors.state}
                        onChange={handleAddressChange}
                      />
                    </div>

                    <div className="col-md-4">
                      <FormInput
                        label="Pincode"
                        name="pincode"
                        type="text"
                        placeholder="Enter pincode"
                        value={values.deliveryAddress.pincode}
                        error={errors.pincode}
                        onChange={handleAddressChange}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === "payment" ? (
                <div className="bg-white rounded-4 shadow-sm p-4 p-md-5 mb-4">
                  <h4 className="fw-bold mb-4">
                    <i className="bi bi-credit-card me-2 text-primary" />
                    Payment Method
                  </h4>

                  <div className="mb-3">
                    <label
                      htmlFor="paymentMethod"
                      className="form-label fw-semibold"
                    >
                      Select Payment Method
                    </label>

                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      className={`form-select ${
                        errors.paymentMethod ? "is-invalid" : ""
                      }`}
                      value={values.paymentMethod}
                      onChange={handlePaymentMethodChange}
                    >
                      <option value="">Select payment method</option>

                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>

                    {errors.paymentMethod ? (
                      <div className="invalid-feedback">
                        {errors.paymentMethod}
                      </div>
                    ) : null}
                  </div>

                  {values.paymentMethod === "Credit Card" ? (
                    <div className="payment-fields bg-light rounded-4 p-3 mt-3">
                      <div className="row">
                        <div className="col-md-6">
                          <FormInput
                            label="Card Number"
                            name="cardNumber"
                            type="text"
                            placeholder="16-digit card number"
                            value={values.cardDetails.cardNumber}
                            error={errors.cardNumber}
                            onChange={handleCardDetailsChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <FormInput
                            label="Card Holder Name"
                            name="cardHolderName"
                            type="text"
                            placeholder="Name on card"
                            value={values.cardDetails.cardHolderName}
                            error={errors.cardHolderName}
                            onChange={handleCardDetailsChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <FormInput
                            label="Expiry Date"
                            name="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={values.cardDetails.expiryDate}
                            error={errors.expiryDate}
                            onChange={handleCardDetailsChange}
                          />
                        </div>

                        <div className="col-md-6">
                          <FormInput
                            label="CVV"
                            name="cvv"
                            type="password"
                            placeholder="CVV"
                            value={values.cardDetails.cvv}
                            error={errors.cvv}
                            onChange={handleCardDetailsChange}
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {values.paymentMethod === "UPI" ? (
                    <div className="payment-fields bg-light rounded-4 p-3 mt-3">
                      <FormInput
                        label="UPI ID"
                        name="upiId"
                        type="text"
                        placeholder="example@upi"
                        value={values.upiDetails.upiId}
                        error={errors.upiId}
                        onChange={handleUpiDetailsChange}
                      />
                    </div>
                  ) : null}

                  {values.paymentMethod === "Cash on Delivery" ? (
                    <div className="alert alert-info mt-3 mb-0" role="alert">
                      <i className="bi bi-cash-coin me-2" />
                      You can pay by cash when your order is delivered.
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentStep === "review" ? (
                <div className="bg-white rounded-4 shadow-sm p-4 p-md-5 mb-4">
                  <h4 className="fw-bold mb-4">
                    <i className="bi bi-check2-circle me-2 text-primary" />
                    Review Order
                  </h4>

                  <div className="review-section mb-4">
                    <h6 className="fw-bold mb-2">Delivery Address</h6>
                    <p className="text-muted mb-0">
                      {values.deliveryAddress.fullName},{" "}
                      {values.deliveryAddress.mobile}
                      <br />
                      {values.deliveryAddress.addressLine},{" "}
                      {values.deliveryAddress.city},{" "}
                      {values.deliveryAddress.state} -{" "}
                      {values.deliveryAddress.pincode}
                    </p>
                  </div>

                  <div className="review-section mb-4">
                    <h6 className="fw-bold mb-2">Payment Method</h6>
                    <p className="text-muted mb-0">{values.paymentMethod}</p>
                  </div>

                  <div className="review-section">
                    <h6 className="fw-bold mb-3">Order Items</h6>

                    {cartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="checkout-item-row d-flex gap-3 mb-3"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="rounded-3 border object-fit-cover"
                          style={{ width: "64px", height: "64px" }}
                        />

                        <div className="flex-grow-1">
                          <h6 className="fw-semibold mb-1">{item.name}</h6>
                          <p className="small text-muted mb-1">{item.brand}</p>
                          {item.selectedSize ? (
                            <p className="small mb-1">
                              <span className="checkout-size-badge">
                                Size: {item.selectedSize}
                              </span>
                            </p>
                          ) : null}
                          <p className="small mb-0">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>

                        <div className="fw-bold small">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="d-flex justify-content-between gap-3">
                {currentStep !== "address" ? (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={goToPreviousStep}
                  >
                    Back
                  </Button>
                ) : (
                  <span />
                )}

                {currentStep !== "review" ? (
                  <Button type="submit" variant="primary">
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    <i className="bi bi-bag-check me-2" />
                    Place Order
                  </Button>
                )}
              </div>
            </div>

            <div className="col-lg-4">
              <div className="checkout-summary-card bg-white rounded-4 shadow-sm p-4 sticky-lg-top">
                <h5 className="fw-bold mb-4">Price Details</h5>

                <div className="coupon-box bg-light rounded-4 p-3 mb-4">
                  <label
                    htmlFor="couponCode"
                    className="form-label fw-semibold"
                  >
                    Apply Coupon
                  </label>

                  <div className="input-group">
                    <input
                      id="couponCode"
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="WELCOME10"
                      value={couponCode}
                      onChange={(event) => {
                        setCouponCode(event.target.value.toUpperCase());
                        setCouponMessage("");
                      }}
                      disabled={Boolean(appliedCoupon)}
                    />

                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline-danger"
                        onClick={handleRemoveCoupon}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="primary"
                        isLoading={isApplyingCoupon}
                        onClick={handleApplyCoupon}
                      >
                        Apply
                      </Button>
                    )}
                  </div>

                  {couponMessage ? (
                    <p
                      className={`small mt-2 mb-0 ${
                        appliedCoupon ? "text-success" : "text-danger"
                      }`}
                    >
                      {couponMessage}
                    </p>
                  ) : null}

                  <div className="small text-muted mt-2">
                    Try: WELCOME10, SAVE500, FREESHIP
                  </div>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Coupon Discount</span>
                  <span className="fw-semibold text-success">
                    - {formatCurrency(discountAmount)}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Delivery Fee</span>
                  <span className="fw-semibold">
                    {deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}
                  </span>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-4">
                  <span className="fw-bold">Total Amount</span>
                  <span className="fw-bold fs-5">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                {discountAmount > 0 ? (
                  <div className="alert alert-success py-2 mb-0" role="alert">
                    <i className="bi bi-patch-check me-2" />
                    You saved {formatCurrency(discountAmount)} on this order.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
};

export default CheckoutPage;

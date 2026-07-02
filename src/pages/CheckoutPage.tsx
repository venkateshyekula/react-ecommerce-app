import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { orderService } from "../services/orderService";
import type {
  CheckoutFormValues,
  CreateOrderPayload,
  DeliveryAddress,
  PaymentMethod,
} from "../types/order";
import { formatCurrency } from "../utils/currencyFormatter";
import { generateOrderId, getInitialTrackingSteps } from "../utils/orderUtils";
import {
  paymentMethods,
  validateCheckoutForm,
  type ValidationErrors,
} from "../utils/validation";

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const deliveryFee = cartTotal > 0 && cartTotal < 999 ? 99 : 0;
  const grandTotal = cartTotal + deliveryFee;

  const handleAddressChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof DeliveryAddress;

    setValues((previousValues) => ({
      ...previousValues,
      deliveryAddress: {
        ...previousValues.deliveryAddress,
        [fieldName]: value, // FIXED: Using computed property key
      },
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: undefined, // FIXED: Clears error for specific field safely
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
        [fieldName]: value, // FIXED: Using computed property key
      },
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [fieldName]: undefined, // FIXED: Clears error for specific field safely
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

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

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

    const validationErrors = validateCheckoutForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!values.paymentMethod) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        paymentMethod: "Please select a payment method.",
      }));
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
        })),
        totalAmount: grandTotal,
        paymentMethod: values.paymentMethod,
        deliveryAddress: values.deliveryAddress,
        orderStatus: "Order Placed",
        trackingSteps: getInitialTrackingSteps(),
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
            title="Your cart is empty"
            message="You must add items to your cart before proceeding to checkout."
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
                Enter delivery details and select a payment method.
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
          <div className="row g-4">
            <div className="col-lg-8">
              {serverError ? (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              ) : null}

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

              <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
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
            </div>

            <div className="col-lg-4">
              <div className="checkout-summary-card bg-white rounded-4 shadow-sm p-4 sticky-lg-top">
                <h5 className="fw-bold mb-4">Order Summary</h5>

                <div className="checkout-items-list mb-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="checkout-item-row d-flex gap-3 mb-3"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="img-fluid rounded"
                        style={{
                          width: "65px",
                          height: "65px",
                          objectFit: "cover",
                        }}
                      />

                      <div className="flex-grow-1">
                        <h6 className="fw-semibold mb-1">{item.name}</h6>
                        <p className="small text-muted mb-1">{item.brand}</p>
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

                <hr />

                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold">
                    {formatCurrency(cartTotal)}
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
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold fs-5">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  <i className="bi bi-bag-check me-2" />
                  Place Order
                </Button>

                <p className="small text-muted text-center mt-3 mb-0">
                  This is a mock payment flow for demo purpose.
                </p>
              </div>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
};

export default CheckoutPage;

import { useState, type FormEvent } from "react";
import Button from "../common/Button";
import { isValidPincode } from "../../utils/validation";

const ProductDeliveryChecker = () => {
  const [pincode, setPincode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [deliveryMessage, setDeliveryMessage] = useState<string>("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!pincode.trim()) {
      setError("Please enter pincode.");
      setDeliveryMessage("");
      return;
    }

    if (!isValidPincode(pincode)) {
      setError("Please enter a valid 6-digit pincode.");
      setDeliveryMessage("");
      return;
    }

    setError("");
    setDeliveryMessage(
      "Delivery available. Expected delivery within 2-4 business days. Cash on Delivery may be available."
    );
  };

  return (
    <div className="product-delivery-card bg-light rounded-4 p-3">
      <h6 className="fw-bold mb-2">
        <i className="bi bi-truck text-primary me-2" />
        Check Delivery Availability
      </h6>

      <form onSubmit={handleSubmit} noValidate>
        <div className="input-group">
          <input
            type="text"
            className={`form-control ${error ? "is-invalid" : ""}`}
            placeholder="Enter pincode"
            value={pincode}
            maxLength={6}
            onChange={(event) => {
              setPincode(event.target.value);
              setError("");
              setDeliveryMessage("");
            }}
          />

          <Button type="submit" variant="primary">
            Check
          </Button>

          {error ? <div className="invalid-feedback">{error}</div> : null}
        </div>
      </form>

      {deliveryMessage ? (
        <div className="alert alert-success mt-3 mb-0 py-2" role="alert">
          <i className="bi bi-check-circle me-2" />
          {deliveryMessage}
        </div>
      ) : null}
    </div>
  );
};

export default ProductDeliveryChecker;
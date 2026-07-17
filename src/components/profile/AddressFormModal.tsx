import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import Button from "../common/Button";
import type { AddressType, SavedAddress } from "../../types/address";

interface AddressFormValues {
  fullName: string;
  mobile: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
}

interface AddressFormModalProps {
  address?: SavedAddress | null;
  onClose: () => void;
  onSubmit: (values: AddressFormValues) => Promise<void>;
}

const initialValues: AddressFormValues = {
  fullName: "",
  mobile: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
  addressType: "HOME",
  isDefault: false
};

const AddressFormModal = ({
  address,
  onClose,
  onSubmit
}: AddressFormModalProps) => {
  const [values, setValues] = useState<AddressFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (address) {
      setValues({
        fullName: address.fullName,
        mobile: address.mobile,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        addressType: address.addressType,
        isDefault: address.isDefault
      });
      return;
    }

    setValues(initialValues);
  }, [address]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = event.target;

    const checked =
      type === "checkbox" ? (event.target as HTMLInputElement).checked : false;

    // FIXED: Added the missing computed property name key layout [name]:
    setValues((previousValues) => ({
      ...previousValues,
      [name]: type === "checkbox" ? checked : value
    }));

    setErrorMessage("");
  };

  const validateForm = (): boolean => {
    if (!values.fullName.trim()) {
      setErrorMessage("Full name is required.");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(values.mobile.trim())) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return false;
    }

    if (!values.addressLine.trim()) {
      setErrorMessage("Address line is required.");
      return false;
    }

    if (!values.city.trim()) {
      setErrorMessage("City is required.");
      return false;
    }

    if (!values.state.trim()) {
      setErrorMessage("State is required.");
      return false;
    }

    if (!/^\d{6}$/.test(values.pincode.trim())) {
      setErrorMessage("Please enter a valid 6-digit pincode.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await onSubmit({
        ...values,
        fullName: values.fullName.trim(),
        mobile: values.mobile.trim(),
        addressLine: values.addressLine.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        pincode: values.pincode.trim()
      });
    } catch {
      setErrorMessage("Unable to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="address-modal-overlay" role="dialog" aria-modal="true">
      <div className="address-modal bg-white rounded-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center p-4 border-bottom">
          <div>
            <h5 className="fw-bold mb-1">
              {address ? "Edit Address" : "Add New Address"}
            </h5>
            <p className="small text-muted mb-0">
              Save delivery address for faster checkout.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-light rounded-circle address-modal-close"
            onClick={onClose}
            aria-label="Close address modal"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {/* OPTIMIZATION: Converted conditional ternary returning null into clean short-circuit expression */}
          {errorMessage && (
            <div className="alert alert-danger" role="alert">
              {errorMessage}
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={values.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Mobile</label>
              <input
                type="tel"
                name="mobile"
                className="form-control"
                value={values.mobile}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Address Line</label>
              <input
                type="text"
                name="addressLine"
                className="form-control"
                value={values.addressLine}
                onChange={handleChange}
                placeholder="House no, street, area"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">City</label>
              <input
                type="text"
                name="city"
                className="form-control"
                value={values.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">State</label>
              <input
                type="text"
                name="state"
                className="form-control"
                value={values.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Pincode</label>
              <input
                type="text"
                name="pincode"
                className="form-control"
                value={values.pincode}
                onChange={handleChange}
                placeholder="Pincode"
                maxLength={6}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Address Type</label>
              <select
                name="addressType"
                className="form-select"
                value={values.addressType}
                onChange={handleChange}
              >
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="col-md-6 d-flex align-items-end">
              <div className="form-check">
                <input
                  id="isDefaultAddress"
                  name="isDefault"
                  type="checkbox"
                  className="form-check-input"
                  checked={values.isDefault}
                  onChange={handleChange}
                />
                <label
                  htmlFor="isDefaultAddress"
                  className="form-check-label fw-semibold"
                >
                  Set as default address
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button type="button" variant="outline-secondary" onClick={onClose}>
              Cancel
            </Button>

            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {address ? "Update Address" : "Save Address"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressFormModal;
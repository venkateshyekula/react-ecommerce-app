import type {
  CheckoutFormValues,
  PaymentMethod
} from "../types/order";
import type {
  LoginPayload,
  RegisterPayload
} from "../types/auth";

export type ValidationErrors<T extends string> = Partial<Record<T, string>>;

export const isRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidMobile = (mobile: string): boolean => {
  return /^[6-9]\d{9}$/.test(mobile.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.trim().length >= 6;
};

export const isValidPincode = (pincode: string): boolean => {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
};

export const isValidCardNumber = (cardNumber: string): boolean => {
  return /^\d{16}$/.test(cardNumber.replace(/\s/g, ""));
};

export const isValidCVV = (cvv: string): boolean => {
  return /^\d{3,4}$/.test(cvv.trim());
};

export const isValidUPI = (upiId: string): boolean => {
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim());
};

export const isValidExpiryDate = (expiryDate: string): boolean => {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate.trim())) {
    return false;
  }

  const [monthValue, yearValue] = expiryDate.split("/");
  const month = Number(monthValue);
  const year = Number(`20${yearValue}`);

  const currentDate = new Date();
  const expiryDateObject = new Date(year, month, 0);

  return expiryDateObject >= currentDate;
};

type RegisterErrorKey =
  | "name"
  | "email"
  | "password"
  | "mobile"
  | "address";

export const validateRegisterForm = (
  values: RegisterPayload
): ValidationErrors<RegisterErrorKey> => {
  const errors: ValidationErrors<RegisterErrorKey> = {};

  if (!isRequired(values.name)) {
    errors.name = "Name is required.";
  }

  if (!isRequired(values.email)) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!isRequired(values.password)) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(values.password)) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!isRequired(values.mobile)) {
    errors.mobile = "Mobile number is required.";
  } else if (!isValidMobile(values.mobile)) {
    errors.mobile = "Please enter a valid 10-digit Indian mobile number.";
  }

  if (!isRequired(values.address)) {
    errors.address = "Address is required.";
  }

  return errors;
};

type LoginErrorKey = "email" | "password";

export const validateLoginForm = (
  values: LoginPayload
): ValidationErrors<LoginErrorKey> => {
  const errors: ValidationErrors<LoginErrorKey> = {};

  if (!isRequired(values.email)) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!isRequired(values.password)) {
    errors.password = "Password is required.";
  }

  return errors;
};

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

export const validateCheckoutForm = (
  values: CheckoutFormValues
): ValidationErrors<CheckoutErrorKey> => {
  const errors: ValidationErrors<CheckoutErrorKey> = {};
  const { deliveryAddress, paymentMethod, cardDetails, upiDetails } = values;

  if (!isRequired(deliveryAddress.fullName)) {
    errors.fullName = "Full name is required.";
  }

  if (!isRequired(deliveryAddress.mobile)) {
    errors.mobile = "Mobile number is required.";
  } else if (!isValidMobile(deliveryAddress.mobile)) {
    errors.mobile = "Please enter a valid 10-digit Indian mobile number.";
  }

  if (!isRequired(deliveryAddress.addressLine)) {
    errors.addressLine = "Address line is required.";
  }

  if (!isRequired(deliveryAddress.city)) {
    errors.city = "City is required.";
  }

  if (!isRequired(deliveryAddress.state)) {
    errors.state = "State is required.";
  }

  if (!isRequired(deliveryAddress.pincode)) {
    errors.pincode = "Pincode is required.";
  } else if (!isValidPincode(deliveryAddress.pincode)) {
    errors.pincode = "Please enter a valid 6-digit pincode.";
  }

  if (!paymentMethod) {
    errors.paymentMethod = "Please select a payment method.";
  }

  if (paymentMethod === "Credit Card") {
    if (!isRequired(cardDetails.cardNumber)) {
      errors.cardNumber = "Card number is required.";
    } else if (!isValidCardNumber(cardDetails.cardNumber)) {
      errors.cardNumber = "Please enter a valid 16-digit card number.";
    }

    if (!isRequired(cardDetails.cardHolderName)) {
      errors.cardHolderName = "Card holder name is required.";
    }

    if (!isRequired(cardDetails.expiryDate)) {
      errors.expiryDate = "Expiry date is required.";
    } else if (!isValidExpiryDate(cardDetails.expiryDate)) {
      errors.expiryDate = "Please enter a valid future expiry date in MM/YY format.";
    }

    if (!isRequired(cardDetails.cvv)) {
      errors.cvv = "CVV is required.";
    } else if (!isValidCVV(cardDetails.cvv)) {
      errors.cvv = "Please enter a valid CVV.";
    }
  }

  if (paymentMethod === "UPI") {
    if (!isRequired(upiDetails.upiId)) {
      errors.upiId = "UPI ID is required.";
    } else if (!isValidUPI(upiDetails.upiId)) {
      errors.upiId = "Please enter a valid UPI ID.";
    }
  }

  return errors;
};

export const paymentMethods: PaymentMethod[] = [
  "Credit Card",
  "UPI",
  "Cash on Delivery"
];
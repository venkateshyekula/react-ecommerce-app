import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import CheckoutDeliveryPromise from "../components/checkout/CheckoutDeliveryPromise";
import CheckoutRewardRedemption from "../components/checkout/CheckoutRewardRedemption";
import CheckoutWalletRedemption from "../components/checkout/CheckoutWalletRedemption";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { useToast } from "../context/useToast";
import { addressService } from "../services/addressService";
import { checkoutOrderCreationService } from "../services/checkoutOrderCreationService";
import { checkoutPaymentSessionService } from "../services/checkoutPaymentSessionService";
import { couponRedemptionService } from "../services/couponRedemptionService";
import { couponService } from "../services/couponService";
import { deliveryService } from "../services/deliveryService";
import { deliverySlaService } from "../services/deliverySlaService";
import { paymentGatewayService } from "../services/paymentGatewayService";
import { rewardService } from "../services/rewardService";
import { sellerFulfillmentService } from "../services/sellerFulfillmentService";
import { walletService } from "../services/walletService";
import { warehouseService } from "../services/warehouseService";
import type { SavedAddress } from "../types/address";
import type { CheckoutPaymentSnapshot } from "../types/checkoutPayment";
import type { AppliedCoupon } from "../types/coupon";
import type {
  DeliveryPromiseSnapshot,
  DeliverySlaRule,
  DeliveryZone,
  SellerFulfillmentMapping,
  Warehouse,
} from "../types/delivery";
import type {
  CheckoutFormValues,
  CreateOrderPayload,
  PaymentMethod,
  RewardRedemptionSnapshot,
  WalletRedemptionSnapshot,
} from "../types/order";
import type { RewardRule, RewardTransaction } from "../types/rewards";
import type { WalletTransaction } from "../types/wallet";
import {
  calculateCouponDiscount,
  validateCouponForCart,
} from "../utils/couponUtils";
import { validateCouponRedemptionLimits } from "../utils/couponRedemptionUtils";
import { formatCurrency } from "../utils/currencyFormatter";
import { buildDeliveryPromiseSnapshot } from "../utils/deliveryEstimate";
import { generateCheckoutReferenceId } from "../utils/checkoutPaymentSessionUtils";
import {
  generateOrderId,
  getInitialTrackingEvents,
  getInitialTrackingSteps,
} from "../utils/orderUtils";
import { calculateRewardRedemption } from "../utils/rewardRedemption";
import { getRewardBalance } from "../utils/rewardUtils";
import {
  validateCheckoutForm,
  type ValidationErrors,
} from "../utils/validation";
import { calculateWalletRedemption } from "../utils/walletRedemption";

type CheckoutStep = "address" | "payment method" | "review" | "price";

type PaymentTab =
  | "CARD"
  | "UPI"
  | "COD"
  | "APPLE_PAY"
  | "GOOGLE_PAY"
  | "PHONEPE"
  | "PAYTM"
  | "BHIM_UPI"
  | "PAYPAL"
  | "COUPON"
  | "REWARDS"
  | "WALLET";

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

const checkoutSteps: Array<{
  key: CheckoutStep;
  label: string;
}> = [
  { key: "address", label: "Delivery Address" },
  { key: "payment method", label: "Payment Method" },
  { key: "review", label: "Review Items" },
  { key: "price", label: "Price Details" },
];

const paymentTabs: Array<{
  key: PaymentTab;
  label: string;
  icon: string;
  method?: string;
}> = [
  {
    key: "CARD",
    label: "Credit / Debit Card",
    icon: "bi bi-credit-card",
    method: "Credit Card",
  },
  {
    key: "UPI",
    label: "UPI",
    icon: "bi bi-upc-scan",
    method: "UPI",
  },
  {
    key: "GOOGLE_PAY",
    label: "Google Pay",
    icon: "bi bi-google",
    method: "Google Pay",
  },
  {
    key: "PHONEPE",
    label: "PhonePe",
    icon: "bi bi-phone",
    method: "PhonePe",
  },
  {
    key: "PAYTM",
    label: "Paytm",
    icon: "bi bi-wallet2",
    method: "Paytm",
  },
  {
    key: "BHIM_UPI",
    label: "BHIM UPI",
    icon: "bi bi-bank",
    method: "BHIM UPI",
  },
  {
    key: "APPLE_PAY",
    label: "Apple Pay",
    icon: "bi bi-apple",
    method: "Apple Pay",
  },
  {
    key: "PAYPAL",
    label: "PayPal",
    icon: "bi bi-paypal",
    method: "PayPal",
  },
  {
    key: "COD",
    label: "Cash on Delivery",
    icon: "bi bi-cash-coin",
    method: "Cash on Delivery",
  },
  {
    key: "COUPON",
    label: "Apply Coupon",
    icon: "bi bi-ticket-perforated",
  },
  {
    key: "REWARDS",
    label: "Use Reward Points",
    icon: "bi bi-stars",
  },
  {
    key: "WALLET",
    label: "Use Wallet Balance",
    icon: "bi bi-wallet",
  },
];

const isGatewayPaymentMethod = (paymentMethod: string): boolean => {
  return [
    "Credit Card",
    "UPI",
    "Google Pay",
    "PhonePe",
    "Paytm",
    "BHIM UPI",
    "Apple Pay",
    "PayPal",
  ].includes(paymentMethod);
};

const getCardNetwork = (cardNumber: string): string => {
  const digits = cardNumber.replace(/\D/g, "");

  if (digits.startsWith("4")) {
    return "Visa";
  }

  if (
    digits.startsWith("51") ||
    digits.startsWith("52") ||
    digits.startsWith("53") ||
    digits.startsWith("54") ||
    digits.startsWith("55") ||
    digits.startsWith("22") ||
    digits.startsWith("23") ||
    digits.startsWith("24") ||
    digits.startsWith("25") ||
    digits.startsWith("26") ||
    digits.startsWith("27")
  ) {
    return "Mastercard";
  }

  if (digits.startsWith("34") || digits.startsWith("37")) {
    return "American Express";
  }

  if (
    digits.startsWith("60") ||
    digits.startsWith("65") ||
    digits.startsWith("81") ||
    digits.startsWith("82")
  ) {
    return "RuPay";
  }

  return digits.length >= 4 ? "Card" : "";
};

export const CheckoutPage = () => {
  const { currentUser } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>("address");
  const [activePaymentTab, setActivePaymentTab] = useState<PaymentTab>("CARD");

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

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedAddressId, setSelectedSavedAddressId] =
    useState<string>("");

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [slaRules, setSlaRules] = useState<DeliverySlaRule[]>([]);
  const [sellerMappings, setSellerMappings] = useState<
    SellerFulfillmentMapping[]
  >([]);
  const [deliveryPromise, setDeliveryPromise] =
    useState<DeliveryPromiseSnapshot | null>(null);

  const [walletTransactions, setWalletTransactions] = useState<
    WalletTransaction[]
  >([]);
  const [appliedWalletAmount, setAppliedWalletAmount] = useState<number>(0);

  const [rewardTransactions, setRewardTransactions] = useState<
    RewardTransaction[]
  >([]);
  const [rewardRules, setRewardRules] = useState<RewardRule[]>([]);
  const [appliedRewardPoints, setAppliedRewardPoints] = useState<number>(0);
  const [isRewardLoading, setIsRewardLoading] = useState<boolean>(false);
  const [rewardErrorMessage, setRewardErrorMessage] = useState<string>("");

  const [secureCard, setSecureCard] = useState<boolean>(true);
  const [showCvvModal, setShowCvvModal] = useState<boolean>(false);

  const deliveryFee = cartTotal > 0 && cartTotal < 999 ? 99 : 0;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) {
      return 0;
    }

    return calculateCouponDiscount(appliedCoupon.coupon, cartTotal);
  }, [appliedCoupon, cartTotal]);

  const grandTotal = Math.max(0, cartTotal - discountAmount + deliveryFee);

  const activeRewardRule = useMemo(() => {
    return rewardService.getActiveRule(rewardRules);
  }, [rewardRules]);

  const availableRewardPoints = useMemo(() => {
    return getRewardBalance(rewardTransactions);
  }, [rewardTransactions]);

  const rewardRedemption = useMemo(() => {
    return calculateRewardRedemption(
      availableRewardPoints,
      grandTotal,
      appliedRewardPoints,
      activeRewardRule,
    );
  }, [
    availableRewardPoints,
    grandTotal,
    appliedRewardPoints,
    activeRewardRule,
  ]);

  const amountAfterRewards = rewardRedemption.payableAmountAfterRewards;

  const walletBalance = useMemo(() => {
    return walletTransactions.reduce((balance, transaction) => {
      return transaction.type === "CREDIT"
        ? balance + transaction.amount
        : balance - transaction.amount;
    }, 0);
  }, [walletTransactions]);

  const walletRedemption = useMemo(() => {
    return calculateWalletRedemption(
      walletBalance,
      amountAfterRewards,
      appliedWalletAmount,
    );
  }, [walletBalance, amountAfterRewards, appliedWalletAmount]);

  const payableAmount = walletRedemption.payableAmount;

  const cardNetwork = useMemo(() => {
    return getCardNetwork(values.cardDetails.cardNumber);
  }, [values.cardDetails.cardNumber]);

  useEffect(() => {
    const loadSavedAddresses = async (): Promise<void> => {
      if (!currentUser) {
        return;
      }

      try {
        const addresses = await addressService.getAddressesByUserId(
          currentUser.id,
        );

        setSavedAddresses(addresses);

        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        if (defaultAddress) {
          setSelectedSavedAddressId(defaultAddress.id);

          setValues((previousValues) => ({
            ...previousValues,
            deliveryAddress: {
              fullName: defaultAddress.fullName,
              mobile: defaultAddress.mobile,
              addressLine: defaultAddress.addressLine,
              city: defaultAddress.city,
              state: defaultAddress.state,
              pincode: defaultAddress.pincode,
            },
          }));
        }
      } catch {
        // Saved address loading should not block checkout.
      }
    };

    void loadSavedAddresses();
  }, [currentUser]);

  useEffect(() => {
    const loadDeliverySettings = async (): Promise<void> => {
      try {
        const [zoneList, warehouseList, slaRuleList, mappingList] =
          await Promise.all([
            deliveryService.getZones(),
            warehouseService.getWarehouses(),
            deliverySlaService.getRules(),
            sellerFulfillmentService.getMappings(),
          ]);

        setDeliveryZones(zoneList);
        setWarehouses(warehouseList);
        setSlaRules(slaRuleList);
        setSellerMappings(mappingList);
      } catch {
        console.error("Unable to load delivery settings.");
      }
    };

    void loadDeliverySettings();
  }, []);

  useEffect(() => {
    const loadWalletTransactions = async (): Promise<void> => {
      if (!currentUser) {
        return;
      }

      try {
        const transactions = await walletService.getTransactionsByUserId(
          currentUser.id,
        );

        setWalletTransactions(transactions);
      } catch {
        setWalletTransactions([]);
      }
    };

    void loadWalletTransactions();
  }, [currentUser]);

  useEffect(() => {
    const loadRewardData = async (): Promise<void> => {
      if (!currentUser) {
        return;
      }

      try {
        setIsRewardLoading(true);
        setRewardErrorMessage("");

        const [transactions, rules] = await Promise.all([
          rewardService.getTransactionsByUserId(currentUser.id),
          rewardService.getRules(),
        ]);

        setRewardTransactions(transactions);
        setRewardRules(rules);
      } catch {
        const message =
          "Reward points are currently unavailable. You can continue checkout without using rewards.";

        setRewardTransactions([]);
        setRewardRules([]);
        setAppliedRewardPoints(0);
        setRewardErrorMessage(message);
        showToast("Warning", message, "warning");
      } finally {
        setIsRewardLoading(false);
      }
    };

    void loadRewardData();
  }, [currentUser, showToast]);

  useEffect(() => {
    if (appliedRewardPoints > availableRewardPoints) {
      setAppliedRewardPoints(availableRewardPoints);
    }
  }, [appliedRewardPoints, availableRewardPoints]);

  useEffect(() => {
    if (appliedWalletAmount > amountAfterRewards) {
      setAppliedWalletAmount(amountAfterRewards);
    }
  }, [appliedWalletAmount, amountAfterRewards]);

  useEffect(() => {
    const pincode = values.deliveryAddress.pincode.trim();
    const firstCartItem = cartItems[0];

    if (
      !pincode ||
      !firstCartItem ||
      !firstCartItem.category ||
      deliveryZones.length === 0 ||
      warehouses.length === 0
    ) {
      setDeliveryPromise(null);
      return;
    }

    const promise = buildDeliveryPromiseSnapshot({
      pincode,
      product: {
        category: firstCartItem.category,
        sellerId: firstCartItem.sellerId,
        sellerName: firstCartItem.sellerName,
      },
      zones: deliveryZones,
      warehouses,
      slaRules,
      sellerMappings,
    });

    setDeliveryPromise(promise);
  }, [
    values.deliveryAddress.pincode,
    cartItems,
    deliveryZones,
    warehouses,
    slaRules,
    sellerMappings,
  ]);

  const setPaymentMethodFromTab = (tab: PaymentTab): void => {
    const selectedTab = paymentTabs.find(
      (paymentTab) => paymentTab.key === tab,
    );

    setActivePaymentTab(tab);

    if (selectedTab?.method) {
      setValues((previousValues) => ({
        ...previousValues,
        paymentMethod: selectedTab.method as PaymentMethod,
      }));

      setErrors((previousErrors) => ({
        ...previousErrors,
        paymentMethod: undefined,
      }));
    } else {
      // Fallback if selecting something like Coupon/Rewards/Wallet tab directly
      // so it doesn't leave an invalid paymentMethod state active
      setValues((previousValues) => ({
        ...previousValues,
        paymentMethod: "" as PaymentMethod,
      }));
    }
  };

  const handleAddNewAddress = (): void => {
    setSelectedSavedAddressId("");
    setValues((previousValues) => ({
      ...previousValues,
      deliveryAddress: {
        fullName: currentUser?.name ?? "",
        mobile: currentUser?.mobile ?? "",
        addressLine: "",
        city: "",
        state: "",
        pincode: "",
      },
    }));
    setErrors({});
    setServerError("");
  };

  const handleSavedAddressSelect = (addressId: string): void => {
    setSelectedSavedAddressId(addressId);

    const selectedAddress = savedAddresses.find(
      (address) => address.id === addressId,
    );

    if (!selectedAddress) {
      return;
    }

    setValues((previousValues) => ({
      ...previousValues,
      deliveryAddress: {
        fullName: selectedAddress.fullName,
        mobile: selectedAddress.mobile,
        addressLine: selectedAddress.addressLine,
        city: selectedAddress.city,
        state: selectedAddress.state,
        pincode: selectedAddress.pincode,
      },
    }));

    setErrors({});
    setServerError("");
  };

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

    setErrors((previousErrors) => {
      const copy = { ...previousErrors };
      delete copy[fieldName];
      return copy;
    });

    setServerError("");
    setSelectedSavedAddressId("");
  };

  const handleCardDetailsChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, value } = event.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      const digitsOnly = value.replace(/\D/g, "");
      const limitedDigits = digitsOnly.substring(0, 16);
      const parts: string[] = [];

      for (let index = 0; index < limitedDigits.length; index += 4) {
        parts.push(limitedDigits.substring(index, index + 4));
      }

      formattedValue = parts.join(" ");
    }

    if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "");

      if (cleaned.length >= 2) {
        formattedValue = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
      } else {
        formattedValue = cleaned;
      }
    }

    if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 4);
    }

    const fieldName = name as keyof CheckoutFormValues["cardDetails"];

    setValues((previousValues) => ({
      ...previousValues,
      cardDetails: {
        ...previousValues.cardDetails,
        [fieldName]: formattedValue,
      },
    }));

    setErrors((previousErrors) => {
      const copy = { ...previousErrors };
      delete copy[fieldName];
      return copy;
    });

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

      return {
        ...cleanErrors,
        ...addressErrors,
      };
    });

    return Object.keys(addressErrors).length === 0;
  };

  const validatePaymentStep = (): boolean => {
    const paymentErrors: ValidationErrors<CheckoutErrorKey> = {};

    if (payableAmount > 0 && !values.paymentMethod) {
      paymentErrors.paymentMethod = "Please select a payment method.";
    }

    if (values.paymentMethod === "Credit Card") {
      const cleanCardNum = values.cardDetails.cardNumber.replace(/\s/g, "");

      if (!cleanCardNum || cleanCardNum.length < 15) {
        paymentErrors.cardNumber = "Please enter a valid card number.";
      }

      if (!values.cardDetails.cardHolderName.trim()) {
        paymentErrors.cardHolderName = "Please enter card holder name.";
      }

      if (!values.cardDetails.expiryDate.trim()) {
        paymentErrors.expiryDate = "Please enter expiry date.";
      }

      if (!values.cardDetails.cvv.trim()) {
        paymentErrors.cvv = "Please enter CVV.";
      }
    }

    if (values.paymentMethod === "UPI" && !values.upiDetails.upiId.trim()) {
      paymentErrors.upiId = "Please enter a valid UPI ID.";
    }

    // Clear previous errors for fields that are no longer relevant
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
      return {
        ...cleanErrors,
        ...paymentErrors,
      };
    });

    // If there are validation errors, alert the user so they aren't left guessing!
    if (Object.keys(paymentErrors).length > 0) {
      const firstError = Object.values(paymentErrors)[0];
      showToast(
        "Validation Error",
        firstError || "Please check your payment details.",
        "danger",
      );
      return false;
    }

    return true;
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

      if (!currentUser) {
        setAppliedCoupon(null);
        setCouponMessage("Please login to use coupons.");
        return;
      }

      const [couponRedemptions, userCouponRedemptions] = await Promise.all([
        couponRedemptionService.getRedemptionsByCouponCode(coupon.code),
        couponRedemptionService.getRedemptionsByCouponCodeAndUserId(
          coupon.code,
          currentUser.id,
        ),
      ]);

      const usageValidation = validateCouponRedemptionLimits({
        coupon,
        couponRedemptions,
        userCouponRedemptions,
      });

      if (!usageValidation.isValid) {
        setAppliedCoupon(null);
        setCouponMessage(usageValidation.message);
        return;
      }

      const calculatedDiscount = calculateCouponDiscount(coupon, cartTotal);

      setAppliedCoupon({
        coupon,
        discountAmount: calculatedDiscount,
      });

      setCouponMessage(validationResult.message);
      setAppliedRewardPoints(0);
      setAppliedWalletAmount(0);
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
    setAppliedRewardPoints(0);
    setAppliedWalletAmount(0);
  };

  const validateLatestRewardsBeforeOrder = async (): Promise<boolean> => {
    if (!currentUser || !rewardRedemption.rewardsApplied) {
      return true;
    }

    try {
      const [latestRewardTransactions, latestRewardRules] = await Promise.all([
        rewardService.getTransactionsByUserId(currentUser.id),
        rewardService.getRules(),
      ]);

      const latestActiveRewardRule =
        rewardService.getActiveRule(latestRewardRules);

      const latestAvailableRewardPoints = getRewardBalance(
        latestRewardTransactions,
      );

      const latestRewardRedemption = calculateRewardRedemption(
        latestAvailableRewardPoints,
        grandTotal,
        rewardRedemption.pointsUsed,
        latestActiveRewardRule,
      );

      if (
        latestRewardRedemption.errorMessage ||
        !latestRewardRedemption.rewardsApplied ||
        latestRewardRedemption.pointsUsed !== rewardRedemption.pointsUsed
      ) {
        const message =
          latestRewardRedemption.errorMessage ??
          "Reward points changed during checkout. Please apply rewards again.";

        setAppliedRewardPoints(0);
        setAppliedWalletAmount(0);
        setRewardTransactions(latestRewardTransactions);
        setRewardRules(latestRewardRules);
        setServerError(message);
        showToast("Warning", message, "warning");

        return false;
      }

      return true;
    } catch {
      const message =
        "Unable to verify reward points. Please remove rewards and try again.";

      setAppliedRewardPoints(0);
      setAppliedWalletAmount(0);
      setServerError(message);
      showToast("Error", message, "danger");

      return false;
    }
  };

  const goToStep = async (nextStep: CheckoutStep): Promise<void> => {
    if (nextStep === "payment method") {
      if (validateAddressStep()) {
        setCurrentStep("payment method");
      }

      return;
    }

    if (nextStep === "review") {
      if (payableAmount === 0 || validatePaymentStep()) {
        setCurrentStep("review");
      }

      return;
    }

    if (nextStep === "price") {
      setCurrentStep("price");
    }
  };

  const goToPreviousStep = (): void => {
    if (currentStep === "payment method") {
      setCurrentStep("address");
      return;
    }

    if (currentStep === "review") {
      setCurrentStep("payment method");
      return;
    }

    if (currentStep === "price") {
      setCurrentStep("review");
    }
  };

  const createCheckoutSnapshot = (): CheckoutPaymentSnapshot => {
    if (!currentUser || !deliveryPromise) {
      throw new Error("Checkout details are incomplete.");
    }

    const orderId = generateOrderId();

    const rewardTransactionId = rewardRedemption.rewardsApplied
      ? `RWD-${Date.now()}`
      : undefined;

    const walletTransactionId =
      walletRedemption.walletAmountUsed > 0 ? `WAL-${Date.now()}` : undefined;

    const rewardRedemptionSnapshot: RewardRedemptionSnapshot | null =
      rewardRedemption.rewardsApplied
        ? {
            rewardsApplied: true,
            pointsUsed: rewardRedemption.pointsUsed,
            rewardDiscountAmount: rewardRedemption.rewardDiscountAmount,
            payableAmountAfterRewards:
              rewardRedemption.payableAmountAfterRewards,
            rewardTransactionId,
          }
        : null;

    const walletRedemptionSnapshot: WalletRedemptionSnapshot | null =
      walletRedemption.walletApplied
        ? {
            walletApplied: true,
            walletAmountUsed: walletRedemption.walletAmountUsed,
            payableAmount: walletRedemption.payableAmount,
            walletTransactionId,
          }
        : null;

    const finalPaymentMethod =
      payableAmount === 0
        ? ("Wallet" as PaymentMethod)
        : (values.paymentMethod as PaymentMethod);

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
        category: item.category,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
      })),
      totalAmount: grandTotal,
      paymentMethod: finalPaymentMethod,
      deliveryAddress: values.deliveryAddress,
      deliveryPromise,
      rewardRedemption: rewardRedemptionSnapshot,
      walletRedemption: walletRedemptionSnapshot,
      orderStatus: "Order Placed",
      fulfillmentStatus: "PENDING",
      trackingSteps: getInitialTrackingSteps(),
      trackingEvents: getInitialTrackingEvents(),
      subtotalAmount: cartTotal,
      discountAmount,
      deliveryFee,
      couponCode: appliedCoupon?.coupon.code,
      couponId: appliedCoupon?.coupon.id,
    };

    return {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
      },
      orderPayload,
      subtotalAmount: cartTotal,
      couponDiscountAmount: discountAmount,
      deliveryFee,
      totalAmount: grandTotal,
      rewardRedemption: rewardRedemptionSnapshot,
      walletRedemption: walletRedemptionSnapshot,
      couponRedemption:
        appliedCoupon && discountAmount > 0
          ? {
              couponId: appliedCoupon.coupon.id,
              couponCode: appliedCoupon.coupon.code,
              cartTotal,
              discountAmount,
              finalOrderAmount: grandTotal,
            }
          : null,
      rewardTransaction:
        rewardRedemption.rewardsApplied && rewardTransactionId
          ? {
              transactionId: rewardTransactionId,
              pointsUsed: rewardRedemption.pointsUsed,
            }
          : null,
      walletTransaction:
        walletRedemption.walletAmountUsed > 0 && walletTransactionId
          ? {
              transactionId: walletTransactionId,
              walletAmountUsed: walletRedemption.walletAmountUsed,
            }
          : null,
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (currentStep === "address") {
      await goToStep("payment method");
      return;
    }

    if (currentStep === "payment method") {
      await goToStep("review");
      return;
    }

    if (currentStep === "review") {
      await goToStep("price");
      return;
    }

    if (currentStep !== "price") {
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

    if (!deliveryPromise) {
      setServerError(
        "Delivery estimate is unavailable for this pincode. Please check your delivery address.",
      );
      return;
    }

    if (payableAmount > 0 && !values.paymentMethod) {
      setServerError(
        "Please select a payment method for the remaining amount.",
      );
      return;
    }

    const isRewardValidationSuccessful =
      await validateLatestRewardsBeforeOrder();

    if (!isRewardValidationSuccessful) {
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      const checkoutSnapshot = createCheckoutSnapshot();

      if (payableAmount > 0 && isGatewayPaymentMethod(values.paymentMethod)) {
        const checkoutReferenceId = generateCheckoutReferenceId();

        const paymentIntent = await paymentGatewayService.createPaymentIntent({
          userId: currentUser.id,
          amount: payableAmount,
          paymentMethod: values.paymentMethod,
          checkoutReferenceId,
        });

        await checkoutPaymentSessionService.createSession({
          checkoutReferenceId,
          paymentId: paymentIntent.paymentId,
          userId: currentUser.id,
          checkoutSnapshot,
        });

        showToast(
          "Payment initiated",
          "Redirecting to secure payment simulation. Your order will be created after successful payment.",
          "success",
        );

        navigate(`/payment-processing/${paymentIntent.paymentId}`, {
          replace: true,
        });

        return;
      }

      const result =
        await checkoutOrderCreationService.createOrderFromCheckoutSnapshot(
          checkoutSnapshot,
        );

      if (!result.invoiceCreated) {
        showToast(
          "Invoice warning",
          "Order placed, but invoice could not be generated right now.",
          "warning",
        );
      }

      if (!result.couponRedemptionSaved) {
        showToast(
          "Warning",
          "Order placed, but coupon redemption history could not be saved right now.",
          "warning",
        );
      }

      clearCart();

      navigate(`/order-success/${result.order.orderId}`, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again.";

      setServerError(message);
      showToast("Error", message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepIndex = checkoutSteps.findIndex(
    (step) => step.key === currentStep,
  );

  if (cartItems.length === 0) {
    return (
      <main className="checkout-page bg-light shopease-brand-page">
        <div className="container-fluid py-5 text-center">
          <h4 className="mb-3">Your cart is empty</h4>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-premium-page bg-light shopease-brand-page">
      <section className="checkout-premium-header bg-white border-bottom">
        <div className="container-fluid py-3">
          <div className="d-flex justify-content-between align-items-center gap-3">
            <Link to="/cart" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-2" />
              Cart
            </Link>

            <div
              className="checkout-premium-stepper"
              aria-label="Checkout steps"
            >
              {checkoutSteps.map((step, index) => {
                const isActive = step.key === currentStep;
                const isCompleted = index < currentStepIndex;

                return (
                  <div
                    className={`checkout-premium-step ${
                      isActive ? "active" : ""
                    } ${isCompleted ? "completed" : ""}`}
                    key={step.key}
                  >
                    <span className="checkout-premium-step-dot">
                      {isCompleted ? <i className="bi bi-check" /> : index + 1}
                    </span>
                    <span className="checkout-premium-step-label">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="checkout-secure-badge">
              <i className="bi bi-shield-check" />
              Secure
            </div>
          </div>
        </div>
      </section>

      <section className="container-fluid py-4">
        <form onSubmit={handleSubmit} noValidate>
          {serverError ? (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          ) : null}

          {currentStep === "address" ? (
            <div className="checkout-premium-card">
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Delivery Address</h3>
                  <p className="text-muted mb-0">
                    Choose a saved address or add a new delivery address.
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary checkout-addaddress-button"
                  onClick={handleAddNewAddress}
                >
                  <i className="bi bi-plus-lg me-2" />
                  Add New Address
                </button>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="checkout-address-grid mb-4">
                  {savedAddresses.map((address) => (
                    <button
                      type="button"
                      className={`checkout-address-card ${
                        selectedSavedAddressId === address.id ? "active" : ""
                      }`}
                      key={address.id}
                      onClick={() => handleSavedAddressSelect(address.id)}
                    >
                      <div className="d-flex justify-content-between gap-2">
                        <strong>{address.fullName}</strong>
                        {address.isDefault ? (
                          <span className="badge text-bg-success">Default</span>
                        ) : null}
                      </div>

                      <small>
                        {address.addressLine}, {address.city}, {address.state} -{" "}
                        {address.pincode}
                      </small>

                      <small>{address.mobile}</small>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="checkout-address-form bg-light rounded-4 p-3 p-md-4">
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
            </div>
          ) : null}

          {currentStep === "payment method" ? (
            <div className="checkout-premium-card">
              <div className="mb-4">
                <h3 className="fw-bold mb-1">Payment</h3>
                <p className="text-muted mb-0">
                  Select a payment method, apply coupons, rewards, or wallet
                  balance.
                </p>
              </div>

              {payableAmount === 0 ? (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-wallet2 me-2" />
                  Rewards and wallet cover the full payable amount. No
                  additional payment method is required.
                </div>
              ) : null}

              <div className="checkout-payment-layout">
                <aside className="checkout-payment-tabs">
                  {paymentTabs.map((tab) => (
                    <button
                      type="button"
                      className={`checkout-payment-tab ${
                        activePaymentTab === tab.key ? "active" : ""
                      }`}
                      key={tab.key}
                      onClick={() => setPaymentMethodFromTab(tab.key)}
                    >
                      <i className={tab.icon} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </aside>

                <section className="checkout-payment-pane">
                  {activePaymentTab === "CARD" ? (
                    <div>
                      <h5 className="fw-bold mb-3">Credit / Debit Card</h5>

                      <div className="row">
                        <div className="col-md-12">
                          {/* Inner wrapper allows matching the layout of Image 2 & 3 */}
                          <div className="position-relative">
                            <FormInput
                              label="Card Number"
                              name="cardNumber"
                              type="text"
                              placeholder="Card Number"
                              value={values.cardDetails.cardNumber}
                              error={errors.cardNumber}
                              onChange={handleCardDetailsChange}
                            />
                            {/* Inline Network Indicator Badge inside card number text input */}
                            {cardNetwork && (
                              <div
                                className="position-absolute end-0 top-50 translate-middle-y me-3 fw-bold text-primary px-2 py-1 rounded"
                                style={{
                                  fontSize: "0.85rem",
                                  backgroundColor: "#f0f4f9",
                                  pointerEvents: "none",
                                  zIndex: 5,
                                  marginTop: errors.cardNumber
                                    ? "-10px"
                                    : "16px",
                                }}
                              >
                                {cardNetwork === "Visa" ? "VISA" : cardNetwork}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-md-6 mt-3">
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

                        <div className="col-md-3 mt-3">
                          <FormInput
                            label="Valid Thru (MM/YY)"
                            name="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={values.cardDetails.expiryDate}
                            error={errors.expiryDate}
                            onChange={handleCardDetailsChange}
                          />
                        </div>

                        <div className="col-md-3 mt-3">
                          <div className="position-relative">
                            <FormInput
                              label="CVV"
                              name="cvv"
                              type="password"
                              placeholder="CVV"
                              value={values.cardDetails.cvv}
                              error={errors.cvv}
                              onChange={handleCardDetailsChange}
                            />
                            {/* Interactive Info Icon positioned elegantly inside CVV input box */}
                            <button
                              type="button"
                              className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted px-3"
                              style={{
                                zIndex: 5,
                                textDecoration: "none",
                                outline: "none",
                                border: "none",
                                boxShadow: "none",
                                marginTop: errors.cvv ? "-10px" : "15px",
                              }}
                              onClick={() => setShowCvvModal(true)}
                              aria-label="How to find CVV"
                            >
                              <i className="bi bi-info-circle fs-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="form-check mt-3 p-3 bg-white rounded-3 border">
                        <input
                          className="form-check-input ms-0 me-2"
                          type="checkbox"
                          id="secureCardCheckbox"
                          checked={secureCard}
                          onChange={(event) =>
                            setSecureCard(event.target.checked)
                          }
                        />

                        <label
                          className="form-check-label d-inline fw-semibold text-dark"
                          htmlFor="secureCardCheckbox"
                        >
                          Secure this card as per RBI Guideline{" "}
                          <i
                            className="bi bi-info-circle ms-1 small"
                            title="Tokenisation protects your card details from leakage."
                          />
                        </label>

                        <p
                          className="text-muted mb-0 mt-1 small"
                          style={{
                            fontSize: "0.85rem",
                            paddingLeft: "1.75rem",
                          }}
                        >
                          By securing the card you can avoid entering the card
                          details everytime for transaction on ShopEase.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activePaymentTab === "UPI" ? (
                    <div>
                      <h5 className="fw-bold mb-3">UPI</h5>
                      <FormInput
                        label="UPI ID"
                        name="upiId"
                        type="text"
                        placeholder="example@upi"
                        value={values.upiDetails.upiId}
                        error={errors.upiId}
                        onChange={handleUpiDetailsChange}
                      />
                      <div className="alert alert-light border mb-0">
                        UPI payment will be processed through mock payment
                        gateway before order creation.
                      </div>
                    </div>
                  ) : null}

                  {[
                    "GOOGLE_PAY",
                    "PHONEPE",
                    "PAYTM",
                    "BHIM_UPI",
                    "APPLE_PAY",
                    "PAYPAL",
                  ].includes(activePaymentTab) ? (
                    <div className="checkout-wallet-gateway-box">
                      <h5 className="fw-bold mb-2">
                        {
                          paymentTabs.find(
                            (tab) => tab.key === activePaymentTab,
                          )?.label
                        }
                      </h5>
                      <p className="text-muted mb-3">
                        This payment method will be simulated through the mock
                        payment gateway.
                      </p>
                      <div className="alert alert-info mb-0">
                        Click Proceed to Review and Place Order. The payment
                        processing page will handle success, pending, and
                        failure simulation.
                      </div>
                    </div>
                  ) : null}

                  {activePaymentTab === "COD" ? (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-cash-coin me-2" />
                      You can pay by cash when your order is delivered.
                    </div>
                  ) : null}

                  {activePaymentTab === "COUPON" ? (
                    <div>
                      <h5 className="fw-bold mb-3">Apply Coupon</h5>
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
                    </div>
                  ) : null}

                  {activePaymentTab === "REWARDS" ? (
                    <div>
                      {rewardErrorMessage ? (
                        <div className="alert alert-warning py-2 mb-3">
                          {rewardErrorMessage}
                        </div>
                      ) : null}
                      <CheckoutRewardRedemption
                        transactions={rewardTransactions}
                        activeRule={
                          isRewardLoading ? undefined : activeRewardRule
                        }
                        orderAmount={grandTotal}
                        appliedPoints={rewardRedemption.pointsUsed}
                        onApplyRewards={(points) => {
                          setAppliedRewardPoints(points);
                          setAppliedWalletAmount(0);
                          setRewardErrorMessage("");
                        }}
                        onRemoveRewards={() => {
                          setAppliedRewardPoints(0);
                          setAppliedWalletAmount(0);
                          setRewardErrorMessage("");
                        }}
                      />
                    </div>
                  ) : null}

                  {activePaymentTab === "WALLET" ? (
                    <CheckoutWalletRedemption
                      transactions={walletTransactions}
                      orderAmount={amountAfterRewards}
                      appliedWalletAmount={walletRedemption.walletAmountUsed}
                      onApplyWallet={setAppliedWalletAmount}
                      onRemoveWallet={() => setAppliedWalletAmount(0)}
                    />
                  ) : null}
                </section>
              </div>
            </div>
          ) : null}

          {currentStep === "review" ? (
            <div className="checkout-premium-card">
              <div className="mb-4">
                <h3 className="fw-bold mb-1">Review Items</h3>
                <p className="text-muted mb-0">
                  Review your items and delivery promise before final checkout.
                </p>
              </div>

              {deliveryPromise ? (
                <div className="checkout-delivery-banner mb-4">
                  <CheckoutDeliveryPromise deliveryPromise={deliveryPromise} />
                </div>
              ) : null}

              <div className="checkout-review-items">
                {cartItems.map((item) => (
                  <div
                    key={`${item.productId}-${item.selectedSize ?? "no-size"}`}
                    className="checkout-review-item align-items-center d-flex gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="img-fluid rounded"
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                      }}
                    />

                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1">{item.name}</h6>
                      <p className="text-muted small mb-1">{item.brand}</p>
                      <p className="small mb-0">
                        {item.selectedSize
                          ? `Size: ${item.selectedSize} · `
                          : ""}
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <strong>
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {currentStep === "price" ? (
            <div className="checkout-premium-card checkout-final-summary">
              <div className="mb-4">
                <h3 className="fw-bold mb-1">Price Details</h3>
                <p className="text-muted mb-0">
                  Confirm final pricing and place your order.
                </p>
              </div>

              <div className="checkout-price-panel">
                <div className="checkout-price-row">
                  <span>Bag Total</span>
                  <strong>{formatCurrency(cartTotal)}</strong>
                </div>

                <div className="checkout-price-row text-success">
                  <span>Applied Coupon Discount</span>
                  <strong>- {formatCurrency(discountAmount)}</strong>
                </div>

                {rewardRedemption.rewardsApplied ? (
                  <div className="checkout-price-row text-success">
                    <span>Reward Points</span>
                    <strong>
                      - {formatCurrency(rewardRedemption.rewardDiscountAmount)}
                    </strong>
                  </div>
                ) : null}

                {walletRedemption.walletAmountUsed > 0 ? (
                  <div className="checkout-price-row text-success">
                    <span>Wallet Balance</span>
                    <strong>
                      - {formatCurrency(walletRedemption.walletAmountUsed)}
                    </strong>
                  </div>
                ) : null}

                <div className="checkout-price-row">
                  <span>Delivery Charges</span>
                  <strong>
                    {deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}
                  </strong>
                </div>

                <div className="checkout-price-total">
                  <span>Order Total</span>
                  <strong>
                    {payableAmount === 0
                      ? "Paid by Wallet / Rewards"
                      : formatCurrency(payableAmount)}
                  </strong>
                </div>
              </div>

              <div className="checkout-legal-note">
                By placing the order, you agree to ShopEase's{" "}
                <Link to="/terms-and-conditions">Terms of Use</Link> and{" "}
                <Link to="/privacy-policy">Privacy Policy</Link>.
              </div>
            </div>
          ) : null}

          <div className="checkout-premium-actions">
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

            {currentStep === "address" ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => void goToStep("payment method")}
              >
                Proceed to Payment
              </Button>
            ) : null}

            {currentStep === "payment method" ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => void goToStep("review")}
              >
                Proceed to Review
              </Button>
            ) : null}

            {currentStep === "review" ? (
              <Button
                type="button"
                variant="primary"
                onClick={() => void goToStep("price")}
              >
                Proceed to Final Summary
              </Button>
            ) : null}

            {currentStep === "price" ? (
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <i className="bi bi-bag-check me-2" />
                Place Order
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      {/* CVV Information Modal Dialog (recreates Image 4 layout and designs) */}
      {showCvvModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1050 }}
          role="dialog"
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "450px" }}
          >
            <div className="modal-content rounded-4 p-4 border-0 shadow-lg position-relative">
              {/* Close Button */}
              <button
                type="button"
                className="btn-close position-absolute end-0 top-0 m-3 fs-5"
                onClick={() => setShowCvvModal(false)}
                aria-label="Close"
                style={{ outline: "none", boxShadow: "none" }}
              />

              <div className="modal-body p-0 mt-2 text-start">
                {/* Header Title */}
                <h4 className="fw-bold text-dark mb-2">What is CVV Number?</h4>
                <p
                  className="text-secondary mb-4"
                  style={{ fontSize: "0.95rem" }}
                >
                  It's a 3-digit code on the back of your card
                </p>

                {/* SVG Mockup for standard 3-digit CVV Card Back */}
                <div className="text-center mb-4">
                  <svg
                    width="220"
                    height="120"
                    viewBox="0 0 220 120"
                    className="mx-auto"
                  >
                    <rect width="220" height="120" rx="12" fill="#d2e3fc" />
                    <rect y="18" width="220" height="24" fill="#5f6368" />
                    <rect
                      x="15"
                      y="58"
                      width="120"
                      height="14"
                      fill="#ffffff"
                      rx="2"
                    />
                    {/* Simulated card text */}
                    <text
                      x="75"
                      y="69"
                      fontSize="8"
                      fontFamily="monospace"
                      fill="#7f8c8d"
                    >
                      1234
                    </text>
                    {/* Simulated CVV Highlight Area */}
                    <rect
                      x="140"
                      y="55"
                      width="36"
                      height="20"
                      fill="none"
                      stroke="#e74c3c"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x="146"
                      y="69"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#e74c3c"
                    >
                      000
                    </text>
                  </svg>
                </div>

                <hr className="my-4 text-muted opacity-25" />

                {/* American Express Header */}
                <h5 className="fw-bold text-dark mb-2">
                  Have American Express Card?
                </h5>
                <p
                  className="text-secondary mb-4"
                  style={{ fontSize: "0.95rem" }}
                >
                  It's a 4-digit number on the front, just above your credit
                  card number
                </p>

                {/* SVG Mockup for American Express 4-digit CVV Card Front */}
                <div className="text-center">
                  <svg
                    width="220"
                    height="120"
                    viewBox="0 0 220 120"
                    className="mx-auto"
                  >
                    <rect width="220" height="120" rx="12" fill="#d2e3fc" />
                    <circle
                      cx="110"
                      cy="60"
                      r="28"
                      fill="#ffffff"
                      opacity="0.4"
                    />
                    <text
                      x="20"
                      y="94"
                      fontSize="8"
                      fontFamily="monospace"
                      fill="#5f6368"
                    >
                      1234
                    </text>
                    <text
                      x="80"
                      y="94"
                      fontSize="8"
                      fontFamily="monospace"
                      fill="#5f6368"
                    >
                      1234
                    </text>

                    {/* Simulated CVV Highlight Area on Front */}
                    <rect
                      x="150"
                      y="32"
                      width="42"
                      height="20"
                      fill="none"
                      stroke="#e74c3c"
                      strokeWidth="1.5"
                      rx="2"
                    />
                    <text
                      x="155"
                      y="46"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#e74c3c"
                    >
                      0000
                    </text>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CheckoutPage;

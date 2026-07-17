import {
  useState,
  type ChangeEvent,
  type FormEvent
} from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import type { RegisterPayload } from "../types/auth";
import {
  validateRegisterForm,
  type ValidationErrors
} from "../utils/validation";

type RegisterErrorKey =
  | "name"
  | "email"
  | "password"
  | "mobile"
  | "address";

const initialRegisterValues: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  mobile: "",
  address: ""
};

const RegisterPage = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [values, setValues] =
    useState<RegisterPayload>(initialRegisterValues);
  const [errors, setErrors] =
    useState<ValidationErrors<RegisterErrorKey>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] =
    useState<boolean>(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof RegisterPayload;

    setValues((previousValues) => ({
      ...previousValues,
      value
    }));

    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      delete nextErrors[fieldName as RegisterErrorKey];
      return nextErrors;
    });

    setServerError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      showToast(
        "Please fix the highlighted fields",
        "Complete all required fields before creating your account.",
        "warning"
      );
      return;
    }

    if (!hasAcceptedTerms) {
      showToast(
        "Agreement required",
        "Please accept the Terms of Use and Privacy Policy to continue.",
        "warning"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      await register(values);

      showToast(
        "Account created",
        "Your ShopEase account has been created successfully.",
        "success"
      );

      navigate("/home", {
        replace: true
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to register. Please try again.";

      setServerError(message);
      showToast("Registration failed", message, "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-xl-5">
            <div className="auth-card register-card bg-white rounded-4 shadow-sm p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="auth-icon mx-auto mb-3">
                  <i className="bi bi-person-plus" />
                </div>

                <h2 className="fw-bold mb-1">Create your account</h2>

                <p className="text-muted mb-0">
                  Register to access cart, checkout, profile, and order history.
                </p>
              </div>

              {serverError ? (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} noValidate>
                <FormInput
                  label="Full Name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={values.name}
                  error={errors.name}
                  onChange={handleChange}
                  autoComplete="name"
                />

                <FormInput
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={values.email}
                  error={errors.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={values.password}
                  error={errors.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <FormInput
                  label="Mobile Number"
                  name="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={values.mobile}
                  error={errors.mobile}
                  onChange={handleChange}
                  autoComplete="tel"
                />

                <FormInput
                  label="Address"
                  name="address"
                  type="text"
                  placeholder="Enter address"
                  value={values.address}
                  error={errors.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                />

                <div className="auth-agreement-box form-check mt-3">
                  <input
                    id="registerTerms"
                    className="form-check-input"
                    type="checkbox"
                    checked={hasAcceptedTerms}
                    onChange={(event) =>
                      setHasAcceptedTerms(event.target.checked)
                    }
                  />

                  <label
                    className="form-check-label text-muted"
                    htmlFor="registerTerms"
                  >
                    By continuing, I agree to the{" "}
                    <Link
                      to="/terms-and-conditions"
                      className="fw-bold auth-policy-link"
                      target="_blank"
                    >
                      Terms of Use
                    </Link>{" "}
                    &{" "}
                    <Link
                      to="/privacy-policy"
                      className="fw-bold auth-policy-link"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and I am above 18 years old.
                  </label>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={!hasAcceptedTerms || isSubmitting}
                  className="mt-4"
                >
                  Continue
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-muted mb-2">
                  Already have an account?{" "}
                  <Link to="/login" className="fw-semibold">
                    Login
                  </Link>
                </p>

                <p className="text-muted mb-0">
                  Need help creating an account?{" "}
                  <Link to="/help-center" className="fw-bold">
                    Get help
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RegisterPage;
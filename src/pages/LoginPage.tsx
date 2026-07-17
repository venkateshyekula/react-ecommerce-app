import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import type { LoginPayload } from "../types/auth";
import { validateLoginForm, type ValidationErrors } from "../utils/validation";

type LoginErrorKey = "email" | "password";

interface RouteLocationState {
  from?: {
    pathname?: string;
  };
}

const initialLoginValues: LoginPayload = {
  email: "",
  password: ""
};

const getSafeRedirectPath = (pathname?: string): string => {
  if (
    !pathname ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/products"
  ) {
    return "/home";
  }

  return pathname;
};

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginPayload>(initialLoginValues);
  const [errors, setErrors] = useState<ValidationErrors<LoginErrorKey>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const locationState = location.state as RouteLocationState | null;
  const redirectPath = getSafeRedirectPath(locationState?.from?.pathname);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    const fieldName = name as keyof LoginPayload;

    setValues((previousValues) => ({
      ...previousValues,
      [fieldName]: value
    }));

    setErrors((previousErrors) => {
      const nextErrors = { ...previousErrors };
      delete nextErrors[fieldName];
      return nextErrors;
    });

    setServerError("");
  };

  const handleDemoLogin = (email: string, password: string): void => {
    setValues({
      email,
      password
    });

    setErrors({});
    setServerError("");

    showToast(
      "Demo credentials filled",
      "Click Login to continue.",
      "info"
    );
  };

  const handleSubmit = async (
  event: FormEvent<HTMLFormElement>
): Promise<void> => {
  event.preventDefault();

  const validationErrors = validateLoginForm(values);
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    showToast(
      "Please fix the highlighted fields",
      "Please fix the highlighted fields before logging in.",
      "warning"
    );
    return;
  }

  try {
    setIsSubmitting(true);
    setServerError("");

    const loggedInUser = await login(values.email, values.password);

    showToast(
      "Login successful",
      "Welcome back to ShopEase!",
      "success"
    );

    if (
      loggedInUser?.role === "SUPPORT" &&
      loggedInUser?.supportTeamCode
    ) {
      navigate("/support/escalations", {
        replace: true
      });
      return;
    }

    navigate(redirectPath, {
      replace: true
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to login. Please try again.";

    setServerError(message);
    showToast("Login failed", message, "danger");
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="auth-page bg-light">
      <div className="container py-5">
        <div className="row justify-content-center align-items-stretch g-4">
          <div className="col-lg-5 col-xl-4">
            <div className="auth-card login-card bg-white rounded-4 shadow-sm p-4 p-md-5 h-100">
              <div className="text-center mb-4">
                <div className="auth-icon mx-auto mb-3">
                  <i className="bi bi-person-check" />
                </div>

                <h2 className="fw-bold mb-1">Welcome back</h2>

                <p className="text-muted mb-0">
                  Login to continue shopping with ShopEase.
                </p>
              </div>

              {serverError ? (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} noValidate>
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
                  placeholder="Enter your password"
                  value={values.password}
                  error={errors.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  className="mt-2"
                >
                  Login
                </Button>
              </form>

              <div className="auth-legal-note mt-4">
                <p className="text-muted small mb-0">
                  By logging in, you agree to the{" "}
                  <Link to="/terms-and-conditions" target="_blank" className="fw-bold auth-policy-link">
                    Terms of Use
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" target="_blank" className="fw-bold auth-policy-link">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              <div className="text-center mt-4">
                <p className="text-muted mb-2">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="fw-semibold auth-policy-link">
                    Register
                  </Link>
                </p>

                <p className="text-muted mb-0">
                  Have trouble logging in?{" "}
                  <Link to="/help-center" className="fw-bold auth-policy-link">
                    Get help
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="col-lg-7 col-xl-6">
            <div className="demo-login-card bg-white rounded-4 shadow-sm p-4 p-md-5 h-100">
              <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
                <div>
                  <h3 className="fw-bold mb-2">Demo Logins</h3>

                  <p className="text-muted mb-0">
                    Click any role below to autofill login credentials.
                  </p>
                </div>

                <span className="badge bg-primary-subtle text-primary border border-primary-subtle demo-rbac-badge">
                  RBAC
                </span>
              </div>

              <div className="demo-login-list">
                <button
                  type="button"
                  className="demo-login-item"
                  onClick={() =>
                    handleDemoLogin("test@example.com", "password123")
                  }
                >
                  <span className="demo-login-icon bg-success-subtle text-success">
                    <i className="bi bi-person" />
                  </span>

                  <span className="flex-grow-1">
                    <strong>Customer</strong>
                    <small>test@example.com / password123</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="demo-login-item"
                  onClick={() =>
                    handleDemoLogin("admin@shopease.com", "Admin123")
                  }
                >
                  <span className="demo-login-icon bg-primary-subtle text-primary">
                    <i className="bi bi-speedometer2" />
                  </span>

                  <span className="flex-grow-1">
                    <strong>Admin</strong>
                    <small>admin@shopease.com / Admin123</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="demo-login-item"
                  onClick={() =>
                    handleDemoLogin("seller@samsung.com", "Seller123")
                  }
                >
                  <span className="demo-login-icon bg-warning-subtle text-warning">
                    <i className="bi bi-shop" />
                  </span>

                  <span className="flex-grow-1">
                    <strong>Seller</strong>
                    <small>seller@samsung.com / Seller123</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="demo-login-item"
                  onClick={() =>
                    handleDemoLogin("support@shopease.com", "Support123")
                  }
                >
                  <span className="demo-login-icon bg-info-subtle text-info">
                    <i className="bi bi-headset" />
                  </span>

                  <span className="flex-grow-1">
                    <strong>Support</strong>
                    <small>support@shopease.com / Support123</small>
                  </span>
                </button>
              </div>

              <div className="demo-login-note mt-4">
                <i className="bi bi-info-circle me-2 text-primary" />

                <span>
                  Make sure these users exist in <strong>db.json</strong> and
                  JSON Server is running.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
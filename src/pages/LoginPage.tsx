import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
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
  password: "",
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState<LoginPayload>(initialLoginValues);
  const [errors, setErrors] = useState<ValidationErrors<LoginErrorKey>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const locationState = location.state as RouteLocationState | null;
  const redirectPath = locationState?.from?.pathname ?? "/products";

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;

    // Use [name] to update the specific key in the state object
    setValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));

    // Clear error for the specific field being changed
    setErrors((previousErrors) => ({
      ...previousErrors,
      [name]: undefined,
    }));

    setServerError("");
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      await login(values.email, values.password);

      navigate(redirectPath, {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again.";

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="auth-card bg-white rounded-4 shadow-sm p-4 p-md-5">
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

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="fw-semibold">
                    Register
                  </Link>
                </p>
              </div>

              <div className="demo-credentials bg-light rounded-4 p-3 mt-4">
                <h6 className="fw-bold mb-2">Demo Login</h6>
                <p className="small text-muted mb-1">
                  Email: <strong>test@example.com</strong>
                </p>
                <p className="small text-muted mb-0">
                  Password: <strong>password123</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
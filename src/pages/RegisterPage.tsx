import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import FormInput from "../components/common/FormInput";
import { useAuth } from "../context/useAuth";
import type { RegisterPayload } from "../types/auth";
import {
  validateRegisterForm,
  type ValidationErrors,
} from "../utils/validation";

type RegisterErrorKey = "name" | "email" | "password" | "mobile" | "address";

const initialRegisterValues: RegisterPayload = {
  name: "",
  email: "",
  password: "",
  mobile: "",
  address: "",
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegisterPayload>(initialRegisterValues);
  const [errors, setErrors] = useState<ValidationErrors<RegisterErrorKey>>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      await register(values);

      navigate("/products", {
        replace: true,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to register. Please try again.";

      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page bg-light">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7 col-xl-6">
            <div className="auth-card bg-white rounded-4 shadow-sm p-4 p-md-5">
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
                  placeholder="Minimum 6 characters"
                  value={values.password}
                  error={errors.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />

                <FormInput
                  label="Mobile Number"
                  name="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={values.mobile}
                  error={errors.mobile}
                  onChange={handleChange}
                  autoComplete="tel"
                />

                <FormInput
                  label="Address"
                  name="address"
                  type="text"
                  placeholder="Enter your address"
                  value={values.address}
                  error={errors.address}
                  onChange={handleChange}
                  autoComplete="street-address"
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isSubmitting}
                  className="mt-2"
                >
                  Register
                </Button>
              </form>

              <div className="text-center mt-4">
                <p className="text-muted mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="fw-semibold">
                    Login
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
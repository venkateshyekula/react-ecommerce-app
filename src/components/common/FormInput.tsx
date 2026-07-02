import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}

const FormInput = ({
  label,
  name,
  error,
  className = "",
  ...rest
}: FormInputProps) => {
  const inputId = `input-${name}`;

  return (
    <div className="mb-3">
      <label htmlFor={inputId} className="form-label fw-semibold">
        {label}
      </label>

      <input
        id={inputId}
        name={name}
        className={`form-control ${error ? "is-invalid" : ""} ${className}`}
        {...rest}
      />

      {error ? <div className="invalid-feedback">{error}</div> : null}
    </div>
  );
};

export default FormInput;
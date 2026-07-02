interface LoaderProps {
  message?: string;
}

const Loader = ({ message = "Loading..." }: LoaderProps) => {
  return (
    <div className="loader-wrapper text-center py-5">
      <div className="spinner-border text-primary mb-3" role="status">
        <span className="visually-hidden">{message}</span>
      </div>

      <p className="text-muted mb-0">{message}</p>
    </div>
  );
};

export default Loader;
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({
  value,
  onChange,
  placeholder = "Search products by name, category, or brand..."
}: SearchBarProps) => {
  return (
    <div className="search-bar position-relative">
      <i className="bi bi-search search-icon text-muted" />

      <input
        type="search"
        className="form-control search-input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
};

export default SearchBar;
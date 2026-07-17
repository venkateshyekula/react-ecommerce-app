import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import {
  adminProductService,
  type ProductPayload,
} from "../../services/adminProductService";
import { productService } from "../../services/productService";
import type { Product, ProductCategory } from "../../types/product";
import { formatCurrency } from "../../utils/currencyFormatter";
import AdminTableActions from "../../components/admin/AdminTableActions";
import AdminTablePagination from "../../components/admin/AdminTablePagination";
import { useAdminTablePagination } from "../../hooks/useAdminTablePagination";
import { useToast } from "../../context/useToast";

const categories: ProductCategory[] = [
  "Electronics",
  "Clothing",
  "Books",
  "Footwear",
  "Accessories",
];

interface ProductFormValues {
  name: string;
  description: string;
  category: ProductCategory;
  brand: string;
  price: string;
  rating: string;
  image: string;
  stock: string;
  discount: string;
  specifications: string;
}

const initialFormValues: ProductFormValues = {
  name: "",
  description: "",
  category: "Electronics",
  brand: "",
  price: "",
  rating: "",
  image: "",
  stock: "",
  discount: "",
  specifications: '{\n  "Feature": "Value"\n}',
};

const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formValues, setFormValues] =
    useState<ProductFormValues>(initialFormValues);
  const [editingProductId, setEditingProductId] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const { showToast } = useToast();

  const loadProducts = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const productList = await productService.getProducts();
      setProducts(productList);
    } catch {
      setErrorMessage(
        "Unable to load products. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query),
    );
  }, [products, searchText]);

  const {
    currentPage,
    itemsPerPage,
    paginatedItems: paginatedProducts,
    setCurrentPage,
    setItemsPerPage,
  } = useAdminTablePagination({
    items: filteredProducts,
    defaultItemsPerPage: 10,
    resetDependencies: [searchText],
  });

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    const { name, value } = event.target;

    setFormValues((previousValues) => ({
      ...previousValues,
      [name]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  };

  const buildPayload = (): ProductPayload | null => {
    try {
      const specifications = JSON.parse(formValues.specifications) as Record<
        string,
        string
      >;

      return {
        name: formValues.name.trim(),
        description: formValues.description.trim(),
        category: formValues.category,
        brand: formValues.brand.trim(),
        price: Number(formValues.price),
        rating: Number(formValues.rating),
        image: formValues.image.trim(),
        stock: Number(formValues.stock),
        discount: Number(formValues.discount),
        specifications,
      };
    } catch {
      setErrorMessage("Specifications must be valid JSON.");
      return null;
    }
  };

  const validatePayload = (payload: ProductPayload): boolean => {
    if (
      !payload.name ||
      !payload.description ||
      !payload.brand ||
      !payload.image
    ) {
      setErrorMessage("Name, description, brand, and image are required.");
      return false;
    }

    if (Number.isNaN(payload.price) || payload.price <= 0) {
      setErrorMessage("Price must be greater than 0.");
      return false;
    }

    if (
      Number.isNaN(payload.rating) ||
      payload.rating < 0 ||
      payload.rating > 5
    ) {
      setErrorMessage("Rating must be between 0 and 5.");
      return false;
    }

    if (Number.isNaN(payload.stock) || payload.stock < 0) {
      setErrorMessage("Stock cannot be negative.");
      return false;
    }

    if (Number.isNaN(payload.discount) || payload.discount < 0) {
      setErrorMessage("Discount cannot be negative.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    const payload = buildPayload();

    if (!payload || !validatePayload(payload)) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (editingProductId) {
        const updatedProduct = await adminProductService.updateProduct(
          editingProductId,
          payload,
        );

        setProducts((previousProducts) =>
          previousProducts.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product,
          ),
        );

        setSuccessMessage("Product updated successfully.");
      } else {
        const createdProduct = await adminProductService.createProduct(payload);
        setProducts((previousProducts) => [
          createdProduct,
          ...previousProducts,
        ]);
        setSuccessMessage("Product added successfully.");
      }

      setFormValues(initialFormValues);
      setEditingProductId("");
    } catch {
      setErrorMessage("Unable to save product. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (product: Product): void => {
    setEditingProductId(product.id);

    setFormValues({
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      price: String(product.price),
      rating: String(product.rating),
      image: product.image,
      stock: String(product.stock),
      discount: String(product.discount),
      specifications: JSON.stringify(product.specifications, null, 2),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (productId: string): Promise<void> => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this product?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await adminProductService.deleteProduct(productId);

      setProducts((previousProducts) =>
        previousProducts.filter((product) => product.id !== productId),
      );

      showToast(
"Product deleted",
"Product was deleted successfully.",
"success"
);
    } catch {
      showToast("Unable to delete product", "Please try again.", "danger")
    }
  };

  const handleCancelEdit = (): void => {
    setEditingProductId("");
    setFormValues(initialFormValues);
    setErrorMessage("");
    setSuccessMessage("");
  };

  if (isLoading) {
    return <Loader message="Loading product management..." />;
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="fw-bold mb-1">Product Management</h1>
        <p className="text-muted mb-0">
          Add, update, delete, and manage product inventory.
        </p>
      </div>

      {errorMessage ? (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      ) : null}

      <div className="admin-panel-card mb-4">
        <h5 className="fw-bold mb-3">
          {editingProductId ? "Edit Product" : "Add Product"}
        </h5>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Product Name</label>
              <input
                name="name"
                className="form-control"
                value={formValues.name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Category</label>
              <select
                name="category"
                className="form-select"
                value={formValues.category}
                onChange={handleChange}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Brand</label>
              <input
                name="brand"
                className="form-control"
                value={formValues.brand}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Price</label>
              <input
                name="price"
                type="number"
                className="form-control"
                value={formValues.price}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Rating</label>
              <input
                name="rating"
                type="number"
                step="0.1"
                className="form-control"
                value={formValues.rating}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Stock</label>
              <input
                name="stock"
                type="number"
                className="form-control"
                value={formValues.stock}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Discount %</label>
              <input
                name="discount"
                type="number"
                className="form-control"
                value={formValues.discount}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Image URL</label>
              <input
                name="image"
                className="form-control"
                value={formValues.image}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                name="description"
                className="form-control"
                rows={3}
                value={formValues.description}
                onChange={handleChange}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                Specifications JSON
              </label>
              <textarea
                name="specifications"
                className="form-control admin-code-textarea"
                rows={5}
                value={formValues.specifications}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingProductId ? "Update Product" : "Add Product"}
            </Button>

            {editingProductId ? (
              <Button
                type="button"
                variant="outline-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="admin-panel-card">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-3">
          <h5 className="fw-bold mb-0">Products</h5>

          <input
            className="form-control admin-search-input"
            placeholder="Search products..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="admin-product-thumb"
                      />
                      <div>
                        <h6 className="fw-semibold mb-1">{product.name}</h6>
                        <p className="small text-muted mb-0">
                          Rating: {product.rating}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td>{product.category}</td>
                  <td>{product.brand}</td>
                  <td>{formatCurrency(product.price)}</td>
                  <td>
                    <span
                      className={`badge ${
                        product.stock <= 0
                          ? "bg-danger"
                          : product.stock < 10
                            ? "bg-warning text-dark"
                            : "bg-success"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td>
                    <AdminTableActions
                      itemName={`product ${product.name}`}
                      showToggle={false}
                      isLoading={editingProductId === product.id}
                      onEdit={() => handleEdit(product)}
                      onDelete={() => void handleDelete(product.id)}
                    />
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No products found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <AdminTablePagination
          totalItems={filteredProducts.length}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemLabel="products"
        />
      </div>
    </div>
  );
};

export default AdminProductsPage;

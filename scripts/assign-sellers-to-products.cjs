const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "db.json");

const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const sellerMappingByBrand = {
  Samsung: {
    sellerId: "seller-001",
    sellerName: "Samsung Store"
  },
  Apple: {
    sellerId: "seller-002",
    sellerName: "Apple Authorized Store"
  },
  Sony: {
    sellerId: "seller-003",
    sellerName: "Sony Electronics Store"
  },
  Dell: {
    sellerId: "seller-004",
    sellerName: "Dell Official Store"
  },
  HP: {
    sellerId: "seller-005",
    sellerName: "HP Laptop Store"
  },
  "Levi's": {
    sellerId: "seller-006",
    sellerName: "Levi's Fashion Store"
  },
  Nike: {
    sellerId: "seller-007",
    sellerName: "Nike Sports Store"
  },
  Adidas: {
    sellerId: "seller-008",
    sellerName: "Adidas Official Store"
  },
  Puma: {
    sellerId: "seller-009",
    sellerName: "Puma Sports Store"
  },
  Penguin: {
    sellerId: "seller-010",
    sellerName: "Penguin Books Store"
  },
  Jaico: {
    sellerId: "seller-011",
    sellerName: "Jaico Books Store"
  },
  Pearson: {
    sellerId: "seller-012",
    sellerName: "Pearson Books Store"
  },
  "Random House": {
    sellerId: "seller-013",
    sellerName: "Random House Books Store"
  },
  Bata: {
    sellerId: "seller-014",
    sellerName: "Bata Footwear Store"
  },
  Fastrack: {
    sellerId: "seller-015",
    sellerName: "Fastrack Accessories Store"
  },
  Boat: {
    sellerId: "seller-016",
    sellerName: "Boat Lifestyle Store"
  },
  JBL: {
    sellerId: "seller-017",
    sellerName: "JBL Audio Store"
  }
};

const defaultSeller = {
  sellerId: "seller-999",
  sellerName: "ShopEase Default Seller"
};

db.products = db.products.map((product) => {
  const seller = sellerMappingByBrand[product.brand] ?? defaultSeller;

  return {
    ...product,
    sellerId: seller.sellerId,
    sellerName: seller.sellerName
  };
});

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf-8");

console.log("Seller ownership assigned to products successfully.");
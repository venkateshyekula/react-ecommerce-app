const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "db.json");

const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const sellerMappingByBrand = {
  Samsung: {
    sellerId: "seller-001",
    sellerName: "Samsung Store",
    email: "seller@samsung.com"
  },
  Apple: {
    sellerId: "seller-002",
    sellerName: "Apple Authorized Store",
    email: "seller@apple.com"
  },
  Sony: {
    sellerId: "seller-003",
    sellerName: "Sony Electronics Store",
    email: "seller@sony.com"
  },
  Dell: {
    sellerId: "seller-004",
    sellerName: "Dell Official Store",
    email: "seller@dell.com"
  },
  HP: {
    sellerId: "seller-005",
    sellerName: "HP Laptop Store",
    email: "seller@hp.com"
  },
  "Levi's": {
    sellerId: "seller-006",
    sellerName: "Levi's Fashion Store",
    email: "seller@levis.com"
  },
  Nike: {
    sellerId: "seller-007",
    sellerName: "Nike Sports Store",
    email: "seller@nike.com"
  },
  Adidas: {
    sellerId: "seller-008",
    sellerName: "Adidas Official Store",
    email: "seller@adidas.com"
  },
  Puma: {
    sellerId: "seller-009",
    sellerName: "Puma Sports Store",
    email: "seller@puma.com"
  },
  Penguin: {
    sellerId: "seller-010",
    sellerName: "Penguin Books Store",
    email: "seller@penguin.com"
  },
  Jaico: {
    sellerId: "seller-011",
    sellerName: "Jaico Books Store",
    email: "seller@jaico.com"
  },
  Pearson: {
    sellerId: "seller-012",
    sellerName: "Pearson Books Store",
    email: "seller@pearson.com"
  },
  "Random House": {
    sellerId: "seller-013",
    sellerName: "Random House Books Store",
    email: "seller@randomhouse.com"
  },
  Bata: {
    sellerId: "seller-014",
    sellerName: "Bata Footwear Store",
    email: "seller@bata.com"
  },
  Fastrack: {
    sellerId: "seller-015",
    sellerName: "Fastrack Accessories Store",
    email: "seller@fastrack.com"
  },
  Boat: {
    sellerId: "seller-016",
    sellerName: "Boat Lifestyle Store",
    email: "seller@boat.com"
  },
  JBL: {
    sellerId: "seller-017",
    sellerName: "JBL Audio Store",
    email: "seller@jbl.com"
  }
};

const defaultSeller = {
  sellerId: "seller-999",
  sellerName: "ShopEase Default Seller",
  email: "seller@shopease.com"
};

db.products = db.products.map((product) => {
  const seller = sellerMappingByBrand[product.brand] ?? defaultSeller;

  return {
    ...product,
    sellerId: seller.sellerId,
    sellerName: seller.sellerName
  };
});

const existingUserIds = new Set(db.users.map((user) => user.id));

const sellersToCreate = Object.values({
  ...sellerMappingByBrand,
  Default: defaultSeller
}).filter((seller) => !existingUserIds.has(seller.sellerId));

const newSellerUsers = sellersToCreate.map((seller, index) => ({
  id: seller.sellerId,
  name: seller.sellerName,
  email: seller.email,
  password: "Seller123",
  mobile: `98765432${String(index).padStart(2, "0")}`,
  address: `${seller.sellerName} Warehouse`,
  role: "SELLER"
}));

db.users = [...db.users, ...newSellerUsers];

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf-8");

console.log("Seller ownership assigned to products.");
console.log(`${newSellerUsers.length} missing seller users created.`);
console.log("Default seller password is: Seller123");
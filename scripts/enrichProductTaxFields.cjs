const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "db.json");

const productTaxFieldPatchById = {
  "prod-001": {
    hsnCode: "85171300",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Mobile Phones",
    sellerGstin: "29SAMS1234A1Z5",
    sellerPan: "SAMS1234A",
    sellerAddress: "Samsung Store, Bengaluru, Karnataka - 560001"
  },
  "prod-002": {
    hsnCode: "85171300",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Mobile Phones",
    sellerGstin: "29APPL1234A1Z5",
    sellerPan: "APPL1234A",
    sellerAddress: "Apple Authorized Store, Bengaluru, Karnataka - 560001"
  },
  "prod-003": {
    hsnCode: "85183000",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Audio Electronics",
    sellerGstin: "29SONY1234A1Z5",
    sellerPan: "SONY1234A",
    sellerAddress: "Sony Electronics Store, Bengaluru, Karnataka - 560001"
  },
  "prod-004": {
    hsnCode: "84713010",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Laptops",
    sellerGstin: "29DELL1234A1Z5",
    sellerPan: "DELL1234A",
    sellerAddress: "Dell Official Store, Bengaluru, Karnataka - 560001"
  },
  "prod-005": {
    hsnCode: "84713010",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Laptops",
    sellerGstin: "29HPLP1234A1Z5",
    sellerPan: "HPLP1234A",
    sellerAddress: "HP Laptop Store, Bengaluru, Karnataka - 560001"
  },
  "prod-006": {
    hsnCode: "62034200",
    gstRate: 12,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Apparel",
    sellerGstin: "29LEVI1234A1Z5",
    sellerPan: "LEVI1234A",
    sellerAddress: "Levi's Fashion Store, Bengaluru, Karnataka - 560001"
  },
  "prod-007": {
    hsnCode: "61091000",
    gstRate: 12,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Apparel",
    sellerGstin: "29NIKE1234A1Z5",
    sellerPan: "NIKE1234A",
    sellerAddress: "Nike Sports Store, Bengaluru, Karnataka - 560001"
  },
  "prod-008": {
    hsnCode: "62019300",
    gstRate: 12,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Apparel",
    sellerGstin: "29ADID1234A1Z5",
    sellerPan: "ADID1234A",
    sellerAddress: "Adidas Official Store, Bengaluru, Karnataka - 560001"
  },
  "prod-009": {
    hsnCode: "61102000",
    gstRate: 12,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Apparel",
    sellerGstin: "29PUMA1234A1Z5",
    sellerPan: "PUMA1234A",
    sellerAddress: "Puma Sports Store, Bengaluru, Karnataka - 560001"
  },
  "prod-010": {
    hsnCode: "49011010",
    gstRate: 0,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Printed Books",
    sellerGstin: "29PENG1234A1Z5",
    sellerPan: "PENG1234A",
    sellerAddress: "Penguin Books Store, Bengaluru, Karnataka - 560001"
  },
  "prod-011": {
    hsnCode: "49011010",
    gstRate: 0,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Printed Books",
    sellerGstin: "29JAIC1234A1Z5",
    sellerPan: "JAIC1234A",
    sellerAddress: "Jaico Books Store, Bengaluru, Karnataka - 560001"
  },
  "prod-012": {
    hsnCode: "49011010",
    gstRate: 0,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Printed Books",
    sellerGstin: "29PEAR1234A1Z5",
    sellerPan: "PEAR1234A",
    sellerAddress: "Pearson Books Store, Bengaluru, Karnataka - 560001"
  },
  "prod-013": {
    hsnCode: "49011010",
    gstRate: 0,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Printed Books",
    sellerGstin: "29RAND1234A1Z5",
    sellerPan: "RAND1234A",
    sellerAddress: "Random House Books Store, Bengaluru, Karnataka - 560001"
  },
  "prod-014": {
    hsnCode: "64041190",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Footwear",
    sellerGstin: "29NIKE1234A1Z5",
    sellerPan: "NIKE1234A",
    sellerAddress: "Nike Sports Store, Bengaluru, Karnataka - 560001"
  },
  "prod-015": {
    hsnCode: "64041190",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Footwear",
    sellerGstin: "29ADID1234A1Z5",
    sellerPan: "ADID1234A",
    sellerAddress: "Adidas Official Store, Bengaluru, Karnataka - 560001"
  },
  "prod-016": {
    hsnCode: "64041990",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Footwear",
    sellerGstin: "29PUMA1234A1Z5",
    sellerPan: "PUMA1234A",
    sellerAddress: "Puma Sports Store, Bengaluru, Karnataka - 560001"
  },
  "prod-017": {
    hsnCode: "64039990",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Footwear",
    sellerGstin: "29BATA1234A1Z5",
    sellerPan: "BATA1234A",
    sellerAddress: "Bata Footwear Store, Bengaluru, Karnataka - 560001"
  },
  "prod-018": {
    hsnCode: "91021100",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Watches",
    sellerGstin: "29FAST1234A1Z5",
    sellerPan: "FAST1234A",
    sellerAddress: "Fastrack Accessories Store, Bengaluru, Karnataka - 560001"
  },
  "prod-019": {
    hsnCode: "85183000",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Audio Electronics",
    sellerGstin: "29BOAT1234A1Z5",
    sellerPan: "BOAT1234A",
    sellerAddress: "Boat Lifestyle Store, Bengaluru, Karnataka - 560001"
  },
  "prod-020": {
    hsnCode: "85182100",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Audio Electronics",
    sellerGstin: "29JBLA1234A1Z5",
    sellerPan: "JBLA1234A",
    sellerAddress: "JBL Audio Store, Bengaluru, Karnataka - 560001"
  },
  "prod-104": {
    hsnCode: "42033000",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Leather Accessories",
    sellerGstin: "29APPA1234A1Z5",
    sellerPan: "APPA1234A",
    sellerAddress: "Apparel Trendz, Bengaluru, Karnataka - 560001"
  },
  "prod-105": {
    hsnCode: "42023120",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Leather Wallets",
    sellerGstin: "29APPA1234A1Z5",
    sellerPan: "APPA1234A",
    sellerAddress: "Apparel Trendz, Bengaluru, Karnataka - 560001"
  },
  "prod-204": {
    hsnCode: "71131130",
    gstRate: 3,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Silver Jewellery",
    sellerGstin: "29BLIN1234A1Z5",
    sellerPan: "BLIN1234A",
    sellerAddress: "Bling & Bloom Luxe, Bengaluru, Karnataka - 560001"
  },
  "prod-205": {
    hsnCode: "62141090",
    gstRate: 12,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Scarves",
    sellerGstin: "29APPA1234A1Z5",
    sellerPan: "APPA1234A",
    sellerAddress: "Apparel Trendz, Bengaluru, Karnataka - 560001"
  },
  "prod-304": {
    hsnCode: "42021290",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Bags and Backpacks",
    sellerGstin: "29TINY1234A1Z5",
    sellerPan: "TINY1234A",
    sellerAddress: "TinyTots Retail, Bengaluru, Karnataka - 560001"
  },
  "prod-403": {
    hsnCode: "34060010",
    gstRate: 18,
    cessRate: 0,
    unit: "SET",
    isTaxInclusive: true,
    taxCategory: "Candles",
    sellerGstin: "29LUXE1234A1Z5",
    sellerPan: "LUXE1234A",
    sellerAddress: "Luxe Home Furnishings, Bengaluru, Karnataka - 560001"
  },
  "prod-503": {
    hsnCode: "33042000",
    gstRate: 18,
    cessRate: 0,
    unit: "PCS",
    isTaxInclusive: true,
    taxCategory: "Cosmetics",
    sellerGstin: "29GLAM1234A1Z5",
    sellerPan: "GLAM1234A",
    sellerAddress: "GlamGloss Cosmetics, Bengaluru, Karnataka - 560001"
  }
};

const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

db.products = db.products.map((product) => ({
  ...product,
  ...(productTaxFieldPatchById[product.id] ?? {})
}));

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);

console.log("Product tax fields enriched successfully.");
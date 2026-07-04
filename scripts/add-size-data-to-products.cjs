const fs = require("fs");
const path = require("path");

const dbPath = path.join(process.cwd(), "db.json");
const db = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

const clothingSizeOptions = ["S", "M", "L", "XL", "XXL"];

const clothingSizeChart = {
  unit: "cm",
  rows: [
    {
      size: "S",
      chest: "91-96",
      waist: "76-81",
      shoulder: "42",
      length: "68"
    },
    {
      size: "M",
      chest: "97-102",
      waist: "82-87",
      shoulder: "44",
      length: "70"
    },
    {
      size: "L",
      chest: "103-108",
      waist: "88-93",
      shoulder: "46",
      length: "72"
    },
    {
      size: "XL",
      chest: "109-114",
      waist: "94-99",
      shoulder: "48",
      length: "74"
    },
    {
      size: "XXL",
      chest: "115-120",
      waist: "100-105",
      shoulder: "50",
      length: "76"
    }
  ],
  howToMeasure: [
    "Chest: Measure around the fullest part of your chest while keeping the tape horizontal.",
    "Waist: Measure around your natural waistline without tightening the tape.",
    "Shoulder: Measure from one shoulder edge to the other across the back.",
    "Length: Measure from the highest shoulder point down to the bottom hem."
  ]
};

const footwearSizeOptions = ["6", "7", "8", "9", "10", "11"];

const footwearSizeChart = {
  unit: "cm",
  rows: [
    {
      size: "6",
      footLength: "24.5",
      ukSize: "6",
      usSize: "7",
      euSize: "40"
    },
    {
      size: "7",
      footLength: "25.4",
      ukSize: "7",
      usSize: "8",
      euSize: "41"
    },
    {
      size: "8",
      footLength: "26.2",
      ukSize: "8",
      usSize: "9",
      euSize: "42"
    },
    {
      size: "9",
      footLength: "27.1",
      ukSize: "9",
      usSize: "10",
      euSize: "43"
    },
    {
      size: "10",
      footLength: "27.9",
      ukSize: "10",
      usSize: "11",
      euSize: "44"
    },
    {
      size: "11",
      footLength: "28.8",
      ukSize: "11",
      usSize: "12",
      euSize: "45"
    }
  ],
  howToMeasure: [
    "Place your foot on a plain sheet of paper.",
    "Mark the heel and the longest toe point.",
    "Measure the distance between both marks in centimeters.",
    "Choose the size closest to your measured foot length.",
    "If your foot length is between two sizes, choose the larger size."
  ]
};

const accessorySizeOptions = ["One Size", "S", "M", "L"];

const accessorySizeChart = {
  unit: "cm",
  rows: [
    {
      size: "One Size",
      circumference: "Adjustable"
    },
    {
      size: "S",
      circumference: "16-17"
    },
    {
      size: "M",
      circumference: "18-19"
    },
    {
      size: "L",
      circumference: "20-21"
    }
  ],
  howToMeasure: [
    "For wrist accessories, wrap a measuring tape around your wrist.",
    "For belts or strap-based accessories, measure around the area where the accessory will be worn.",
    "Keep the tape comfortable, not too tight.",
    "Choose the closest matching size from the chart."
  ]
};

db.products = db.products.map((product) => {
  if (product.category === "Clothing") {
    return {
      ...product,
      sizeOptions: product.sizeOptions ?? clothingSizeOptions,
      sizeChart: product.sizeChart ?? clothingSizeChart
    };
  }

  if (product.category === "Footwear") {
    return {
      ...product,
      sizeOptions: product.sizeOptions ?? footwearSizeOptions,
      sizeChart: product.sizeChart ?? footwearSizeChart
    };
  }

  if (product.category === "Accessories") {
    return {
      ...product,
      sizeOptions: product.sizeOptions ?? accessorySizeOptions,
      sizeChart: product.sizeChart ?? accessorySizeChart
    };
  }

  return product;
});

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf-8");

console.log("Size options and size charts added successfully.");
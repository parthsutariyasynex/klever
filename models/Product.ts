import mongoose, { Schema, Document } from "mongoose";

export interface IProductDoc extends Document {
  supplierId: mongoose.Types.ObjectId;
  klever_sku: string;
  product_source: string;
  source_name: string;
  sku: string;
  product_url: string;
  product_name: string;
  tyre_marking: string;
  cost: number;
  price: number;
  set_price: number;
  fitting_price: number;
  offers: string;
  brand: string;
  brand_category: string;
  plain_size: string;
  size: string;
  load_index: string;
  runflat: string;
  vehicle_type: string;
  country: string;
  year: number;
  qty: number;
  product_image_url: string;
  source_date: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProductDoc>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: false, index: true },
    klever_sku: { type: String, default: "" },
    product_source: { type: String, default: "" },
    source_name: { type: String, default: "" },
    sku: { type: String, required: true },
    product_url: { type: String, default: "" },
    product_name: { type: String, default: "" },
    tyre_marking: { type: String, default: "" },
    cost: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    set_price: { type: Number, default: 0 },
    fitting_price: { type: Number, default: 0 },
    offers: { type: String, default: "" },
    brand: { type: String, default: "" },
    brand_category: { type: String, default: "" },
    plain_size: { type: String, default: "" },
    size: { type: String, default: "" },
    load_index: { type: String, default: "" },
    runflat: { type: String, default: "" },
    vehicle_type: { type: String, default: "" },
    country: { type: String, default: "" },
    year: { type: Number, default: 0 },
    qty: { type: Number, default: 0 },
    product_image_url: { type: String, default: "" },
    source_date: { type: String, default: "" },
  },
  { timestamps: true }
);

// ── Indexes for fast queries ──
ProductSchema.index({ brand: 1 });
ProductSchema.index({ plain_size: 1 });
ProductSchema.index({ year: 1 });
ProductSchema.index({ source_name: 1 });
ProductSchema.index({ createdAt: -1 });

export default mongoose.models.Product || mongoose.model<IProductDoc>("Product", ProductSchema);
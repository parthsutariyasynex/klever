import mongoose, { Schema, Document } from "mongoose";

export interface ICompetitorProductDoc extends Document {
    source: string;
    item_code: string;
    category: string;
    brand: string;
    tyre_pattern: string;
    size: string;
    runflat: string;
    year: number;
    country: string;
    price: number;
    set_price: number;
    date: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
}

const CompetitorProductSchema = new Schema<ICompetitorProductDoc>(
    {
        source: { type: String, default: "" },
        item_code: { type: String, default: "" },
        category: { type: String, default: "" },
        brand: { type: String, default: "" },
        tyre_pattern: { type: String, default: "" },
        size: { type: String, default: "" },
        runflat: { type: String, default: "" },
        year: { type: Number, default: 0 },
        country: { type: String, default: "" },
        price: { type: Number, default: 0 },
        set_price: { type: Number, default: 0 },
        date: { type: String, default: "" },
        url: { type: String, default: "" },
    },
    // { timestamps: true, collection: "competitor_products" }
    { timestamps: true, collection: "products" }

);

// ── Indexes for fast queries ──
CompetitorProductSchema.index({ brand: 1 });
CompetitorProductSchema.index({ source: 1 });
CompetitorProductSchema.index({ year: 1 });
CompetitorProductSchema.index({ price: 1 });
CompetitorProductSchema.index({ item_code: 1 });
CompetitorProductSchema.index({ createdAt: -1 });

export default mongoose.models.CompetitorProduct ||
    mongoose.model<ICompetitorProductDoc>("CompetitorProduct", CompetitorProductSchema);

import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplier extends Document {
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema: Schema<ISupplier> = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
    },
    { timestamps: true }
);

const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>("Supplier", SupplierSchema);

export default Supplier;

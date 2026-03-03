import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { verifyToken } from "@/lib/auth";

// Helper function to get supplier ID from token
const getSupplierId = (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as any;
  return decoded ? decoded.supplierId : null;
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const supplierId = getSupplierId(req);

    if (!supplierId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const data = await req.json();

    // Find product and ensure it belongs to the supplier
    const product = await Product.findOneAndUpdate(
      { _id: id, supplierId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const supplierId = getSupplierId(req);

    if (!supplierId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const deleted = await Product.findOneAndDelete({ _id: id, supplierId }).lean();

    if (!deleted) {
      return NextResponse.json({ error: "Product not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
    await connectDB();
    const p = await Product.findOne({ _id: "69c147455a9229b75047c90f" }).lean();
    if (!p) return NextResponse.json({});

    // bypass mongoose casting
    const filter = { sku: { $in: [String(p.sku), Number(p.sku)] } };
    const histCollection = await Product.collection.find(filter).toArray();

    return NextResponse.json({ histCollection });
}

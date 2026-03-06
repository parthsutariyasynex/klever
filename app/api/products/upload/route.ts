import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

// ==============================
// POST → Upload (Temporary Response)
// ==============================
export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Upload route working",
  });
}

// ==============================
// GET → Show Uploaded CSV Data
// ==============================
export async function GET() {
  try {
    await connectDB();

    const products = await Product.find().sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      count: products.length,
      data: products,
    });

  } catch {
    // console.error("GET UPLOAD DATA ERROR:", error);

    return NextResponse.json(
      //   { success: false, message: error.message },
      { status: 500 }
    );
  }
}
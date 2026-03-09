// import { NextResponse } from "next/server";
// import bcrypt from "bcryptjs";
// import connectDB from "@/lib/mongodb";
// import Supplier from "@/models/Supplier";

// export async function POST(req: Request) {
//     try {
//         const { name, email, password } = await req.json();

//         if (!name || !email || !password) {
//             return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//         }

//         await connectDB();

//         const existingSupplier = await Supplier.findOne({ email });
//         if (existingSupplier) {
//             return NextResponse.json({ error: "Supplier already exists" }, { status: 400 });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newSupplier = await Supplier.create({
//             name,
//             email,
//             password: hashedPassword,
//         });

//         return NextResponse.json({ message: "Supplier registered successfully", supplierId: newSupplier._id }, { status: 201 });
//     } catch (error: any) {
//         return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
//     }
// }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBond } from "@/lib/serializers";

export async function GET() {
  const bonds = await prisma.bond.findMany({ orderBy: { maturityDate: "asc" } });
  return NextResponse.json(bonds.map(serializeBond));
}

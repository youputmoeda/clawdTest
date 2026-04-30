import { NextResponse } from "next/server";
import { addPerson, loadPeople } from "@/lib/investments/people";

export async function GET() {
  return NextResponse.json({ people: await loadPeople() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const person = await addPerson(body);
  return NextResponse.json({ person, people: await loadPeople() });
}

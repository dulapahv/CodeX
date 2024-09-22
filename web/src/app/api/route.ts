export async function GET() {
  let res = await fetch(
    process.env.NODE_ENV === "production"
      ? "https://occp.dulapahv.dev"
      : "http://localhost:3001",
  );
  let data = await res.json();

  return Response.json(data);
}

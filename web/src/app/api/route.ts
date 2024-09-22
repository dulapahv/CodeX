export async function GET() {
  let res = await fetch("http://localhost:3001");
  let data = await res.json();

  return Response.json(data);
}

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authCookieOptions, getApiBaseUrl } from "@/lib/api";

async function proxy(request: NextRequest, path: string[]) {
  const target = `${getApiBaseUrl()}/${path.join("/")}${request.nextUrl.search}`;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const isMultipart = contentType?.includes("multipart/form-data");
  let body: BodyInit | undefined;
  if (hasBody) {
    body = isMultipart ? await request.arrayBuffer() : await request.text();
  }

  const res = await fetch(target, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await res.text();
  const response = new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });

  if (token && res.status !== 401) {
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions());
  }

  return response;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

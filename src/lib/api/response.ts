import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/analysis";

export function apiOk<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null
    },
    { status }
  );
}

export function apiError(code: string, message: string, status = 400): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message
      }
    },
    { status }
  );
}

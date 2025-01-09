import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authenticatedBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
});

export const unauthenticatedBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
});

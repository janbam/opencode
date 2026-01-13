// This file is injected by esbuild to ensure zod-openapi extension runs first
import { z } from "zod"
import { extendZodWithOpenApi } from "zod-openapi"
extendZodWithOpenApi(z)

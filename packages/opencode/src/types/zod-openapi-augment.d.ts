// Local module augmentation for zod-openapi
// This teaches TypeScript about the .openapi() method that zod-openapi adds at runtime.
// Needed because moduleResolution: "Bundler" doesn't load the augmentation from the
// zod-openapi/extend subpath correctly.
//
// Runtime extension is done via `import "zod-openapi/extend"` in src/index.ts

import 'zod';

declare module 'zod' {
  interface ZodType {
    openapi<T extends import('zod').ZodTypeAny>(
      this: T,
      metadata: import('zod-openapi').ZodOpenApiMetadata<T>
    ): T;
  }
}

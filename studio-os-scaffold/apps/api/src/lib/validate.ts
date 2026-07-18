import { ZodTypeAny } from 'zod';

export function validateBody<TSchema extends ZodTypeAny>(schema: TSchema, input: unknown) {
  return schema.parse(input);
}

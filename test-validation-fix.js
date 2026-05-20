// Quick test to verify the validation schema accepts null values
const z = require('zod');

// Replicate the schema from lib/actions/products.ts
const createProductSchema = z.object({
  catalogId: z.string().uuid(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.union([
    z.string().transform(v => v && v.trim() ? v : undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  price: z.number().min(0),
  compareAt: z.union([
    z.number().min(0),
    z.literal('').transform(() => undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  stock: z.union([
    z.number().int().min(0),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  categoryId: z.union([
    z.string().uuid(),
    z.literal('').transform(() => undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  sku: z.union([
    z.string().transform(v => v && v.trim() ? v : undefined),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  active: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  isCartProduct: z.boolean().default(true),
});

// Test 1: All required fields only
console.log('Test 1: Required fields only (title, price)');
const test1 = {
  catalogId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Test Product',
  price: 99.99,
  active: true,
  description: null,
  compareAt: null,
  stock: null,
  categoryId: null,
  sku: null,
  isCartProduct: true,
};
const result1 = createProductSchema.safeParse(test1);
console.log(result1.success ? '✅ PASS' : `❌ FAIL: ${result1.error?.errors[0]?.message}`);
console.log('');

// Test 2: With empty strings (should be transformed)
console.log('Test 2: Empty strings for optional fields');
const test2 = {
  catalogId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Test Product',
  price: 99.99,
  active: true,
  description: '',
  compareAt: '',
  stock: 0,
  categoryId: '',
  sku: '',
  isCartProduct: true,
};
const result2 = createProductSchema.safeParse(test2);
console.log(result2.success ? '✅ PASS' : `❌ FAIL: ${result2.error?.errors[0]?.message}`);
console.log('');

// Test 3: With actual values
console.log('Test 3: With actual values for optional fields');
const test3 = {
  catalogId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Test Product',
  price: 99.99,
  active: true,
  description: 'A great product',
  compareAt: 149.99,
  stock: 10,
  categoryId: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
  sku: 'SKU-123',
  tags: ['electronics', 'sale'],
  isCartProduct: true,
};
const result3 = createProductSchema.safeParse(test3);
console.log(result3.success ? '✅ PASS' : `❌ FAIL: ${result3.error?.errors[0]?.message}`);
console.log('');

// Test 4: Stock = 0 (valid, not null)
console.log('Test 4: Stock = 0 (should be valid)');
const test4 = {
  catalogId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Out of Stock Product',
  price: 99.99,
  active: true,
  stock: 0,
};
const result4 = createProductSchema.safeParse(test4);
console.log(result4.success ? '✅ PASS' : `❌ FAIL: ${result4.error?.errors[0]?.message}`);
console.log('');

// Test 5: The original failing case - null values
console.log('Test 5: Explicit null values (original error case)');
const test5 = {
  catalogId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  name: 'Test Product',
  price: 99.99,
  active: true,
  description: null,
  compareAt: null,
  stock: null,
  categoryId: null,
  sku: null,
};
const result5 = createProductSchema.safeParse(test5);
console.log(result5.success ? '✅ PASS - FIX VERIFIED!' : `❌ FAIL: ${result5.error?.errors[0]?.message}`);

console.log('\n' + '='.repeat(60));
console.log('Summary:');
const allPassed = [result1, result2, result3, result4, result5].every(r => r.success);
console.log(allPassed ? '✅ ALL TESTS PASSED - Validation fix is working!' : '❌ Some tests failed');

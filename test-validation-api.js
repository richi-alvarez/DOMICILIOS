// Test validación schema directamente sin Playwright
const z = require('zod');

// Schema exacto de producción
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
  tags: z.union([
    z.array(z.string()),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  image: z.union([
    z.string(),
    z.null().transform(() => undefined),
    z.undefined(),
  ]).optional(),
  isCartProduct: z.boolean().default(true),
});

console.log('\n=== VALIDATION TEST - PRODUCTION SCHEMA ===\n');

// Test 1: Producto con tags null (el error original)
console.log('Test 1: tags = null (ORIGINAL ERROR)');
const test1 = {
  catalogId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Product',
  price: 99.99,
  active: true,
  tags: null,  // ← Este era el problema
};
const result1 = createProductSchema.safeParse(test1);
console.log(result1.success ? '✅ PASS' : `❌ FAIL: ${result1.error?.errors[0]?.message}`);

// Test 2: Producto con todos los campos null
console.log('\nTest 2: Campos opcionales = null');
const test2 = {
  catalogId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Product 2',
  price: 99.99,
  description: null,
  compareAt: null,
  stock: null,
  categoryId: null,
  sku: null,
  tags: null,
  image: null,
};
const result2 = createProductSchema.safeParse(test2);
console.log(result2.success ? '✅ PASS' : `❌ FAIL: ${result2.error?.errors[0]?.message}`);

// Test 3: Producto con string vacío en tags
console.log('\nTest 3: tags = ""');
const test3 = {
  catalogId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Product 3',
  price: 99.99,
  tags: '',
};
const result3 = createProductSchema.safeParse(test3);
console.log(result3.success ? '✅ PASS' : `❌ FAIL: ${result3.error?.errors[0]?.message}`);

// Test 4: Producto normal (control)
console.log('\nTest 4: Producto válido completo');
const test4 = {
  catalogId: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Test Product 4',
  price: 99.99,
  description: 'A test product',
  compareAt: 149.99,
  stock: 10,
  categoryId: 'a50e8400-e29b-41d4-a716-446655440000',
  sku: 'TEST-SKU',
  tags: ['electronics', 'sale'],
  active: true,
};
const result4 = createProductSchema.safeParse(test4);
console.log(result4.success ? '✅ PASS' : `❌ FAIL: ${result4.error?.errors[0]?.message}`);

// Summary
console.log('\n=== RESUMEN ===\n');
const allTests = [result1, result2, result3, result4];
const passed = allTests.filter(r => r.success).length;
const total = allTests.length;

console.log(`Passed: ${passed}/${total}`);

if (result1.success && result2.success) {
  console.log('\n✅ FIX VERIFICADO: "Expected array, received null" está RESUELTO\n');
} else {
  console.log('\n❌ Error: El problema aún existe\n');
  if (!result1.success) console.log('Test 1 failed:', result1.error?.errors[0]?.message);
  if (!result2.success) console.log('Test 2 failed:', result2.error?.errors[0]?.message);
}

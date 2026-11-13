// In-memory stand-in for the Prisma client: every model method is a jest.fn().
// $transaction runs a callback against the same mock, or awaits an array of calls,
// matching Prisma's two calling styles.
const models = ['user', 'jointFund', 'category', 'transaction', 'shoppingOrder'];
const methods = [
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'update',
  'updateMany',
  'delete',
  'count',
  'aggregate',
];

const prisma = {};
for (const model of models) {
  prisma[model] = {};
  for (const method of methods) prisma[model][method] = jest.fn();
}
prisma.$transaction = jest.fn(arg => (typeof arg === 'function' ? arg(prisma) : Promise.all(arg)));

module.exports = prisma;

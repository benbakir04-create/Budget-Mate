// Minimal Express request/response doubles for calling controllers directly.
const mockRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = jest.fn(code => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(body => {
    res.body = body;
    return res;
  });
  return res;
};

const OWNER = { id: '11111111-1111-4111-8111-111111111111', role: 'owner', parentId: null };
const PARTNER = {
  id: '22222222-2222-4222-8222-222222222222',
  role: 'partner',
  parentId: OWNER.id,
};
const OTHER_OWNER = { id: '33333333-3333-4333-8333-333333333333', role: 'owner', parentId: null };

const FUND_ID = '44444444-4444-4444-8444-444444444444';
const CATEGORY_ID = '55555555-5555-4555-8555-555555555555';
const ORDER_ID = '66666666-6666-4666-8666-666666666666';

module.exports = { mockRes, OWNER, PARTNER, OTHER_OWNER, FUND_ID, CATEGORY_ID, ORDER_ID };

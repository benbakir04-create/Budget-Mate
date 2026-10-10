/**
 * سكربت اختبار بسيط لـ API
 * استخدم: node test-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let accessToken = '';

// ألوان للطباعة
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealth() {
  try {
    log('\n📡 اختبار Health Check...', 'blue');
    const response = await axios.get(`${API_URL}/health`);
    if (response.data.success) {
      log('✅ Health Check نجح', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Health Check فشل: ' + error.message, 'red');
    return false;
  }
}

async function testRegister() {
  try {
    log('\n📝 اختبار التسجيل...', 'blue');
    const email = `test${Date.now()}@test.com`;
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User',
      email: email,
      password: 'password123'
    });

    if (response.data.success && response.data.data.token) {
      accessToken = response.data.data.token;
      log('✅ التسجيل نجح', 'green');
      log(`   Token: ${accessToken.substring(0, 20)}...`, 'yellow');
      return true;
    }
  } catch (error) {
    log('❌ التسجيل فشل: ' + (error.response?.data?.error?.message || error.message), 'red');
    return false;
  }
}

async function testLogin() {
  try {
    log('\n🔐 اختبار تسجيل الدخول...', 'blue');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'password123'
    });

    if (response.data.success && response.data.data.token) {
      accessToken = response.data.data.token;
      log('✅ تسجيل الدخول نجح', 'green');
      return true;
    }
  } catch (error) {
    log('⚠️  تسجيل الدخول فشل (هذا طبيعي إذا لم تسجل بعد)', 'yellow');
    log('   الخطأ: ' + (error.response?.data?.error?.message || error.message), 'yellow');
    return false;
  }
}

async function testProtectedRoute() {
  if (!accessToken) {
    log('\n⚠️  لا يمكن اختبار المسار المحمي بدون token', 'yellow');
    return false;
  }

  try {
    log('\n🔒 اختبار المسار المحمي (/auth/me)...', 'blue');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.data.success && response.data.data.user) {
      log('✅ المسار المحمي يعمل', 'green');
      log(`   المستخدم: ${response.data.data.user.name} (${response.data.data.user.email})`, 'yellow');
      return true;
    }
  } catch (error) {
    log('❌ المسار المحمي فشل: ' + (error.response?.data?.error?.message || error.message), 'red');
    return false;
  }
}

async function testProtectedRouteWithoutToken() {
  try {
    log('\n🚫 اختبار المسار المحمي بدون token...', 'blue');
    await axios.get(`${API_URL}/auth/me`);
    log('❌ يجب أن يفشل لكنه نجح!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      log('✅ المسار المحمي محمي بشكل صحيح (يرفض الطلبات بدون token)', 'green');
      return true;
    }
    log('❌ خطأ غير متوقع: ' + error.message, 'red');
    return false;
  }
}

async function testValidation() {
  try {
    log('\n✔️  اختبار التحقق من صحة البيانات...', 'blue');
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Test',
      email: 'invalid-email',
      password: '123'
    });
    log('❌ يجب أن يفشل لكنه نجح!', 'red');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error?.code === 'VALIDATION_ERROR') {
      log('✅ التحقق من صحة البيانات يعمل', 'green');
      return true;
    }
    log('⚠️  خطأ غير متوقع في التحقق', 'yellow');
    return false;
  }
}

async function runTests() {
  log('\n🧪 بدء اختبارات API...\n', 'blue');
  log('='.repeat(50), 'blue');

  const results = {
    health: await testHealth(),
    register: await testRegister(),
    login: await testLogin(),
    protected: await testProtectedRoute(),
    protectedWithoutToken: await testProtectedRouteWithoutToken(),
    validation: await testValidation()
  };

  log('\n' + '='.repeat(50), 'blue');
  log('\n📊 نتائج الاختبارات:', 'blue');
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`  ${passed ? '✅' : '❌'} ${test}`, passed ? 'green' : 'red');
  });

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  log(`\n🎯 النتيجة: ${passedCount}/${totalCount} اختبار نجح`, 
    passedCount === totalCount ? 'green' : 'yellow');

  if (passedCount === totalCount) {
    log('\n🎉 جميع الاختبارات نجحت!', 'green');
  } else {
    log('\n⚠️  بعض الاختبارات فشلت. تحقق من الباكند.', 'yellow');
  }
}

// تشغيل الاختبارات
runTests().catch(error => {
  log('\n❌ خطأ في تشغيل الاختبارات: ' + error.message, 'red');
  process.exit(1);
});


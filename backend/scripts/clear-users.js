const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearUsers() {
  try {
    console.log('🗑️  جاري حذف جميع المستخدمين...');
    
    // حذف جميع المستخدمين (سيتم حذف البيانات المرتبطة تلقائياً بسبب onDelete: Cascade)
    const result = await prisma.user.deleteMany({
      where: {
        // حذف جميع المستخدمين ما عدا المستخدم الافتراضي للـ seed
        NOT: {
          id: 'seed-default-user'
        }
      }
    });
    
    console.log(`✅ تم حذف ${result.count} مستخدم`);
    console.log('💡 يمكنك الآن التسجيل بحساب جديد');
  } catch (error) {
    console.error('❌ خطأ في حذف المستخدمين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearUsers();


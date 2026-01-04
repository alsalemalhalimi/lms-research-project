const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ==================== MongoDB Connection ====================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://alhalmysalm6_db_user:mE4GTgfL6RQTkngn@lms-cluster.rivtdze.mongodb.net/lms_research_db?retryWrites=true&w=majority&appName=lms-cluster';

// نماذج البيانات
const studentSchema = new mongoose.Schema({
    // المعلومات الشخصية
    name: { type: String, default: 'مجهول' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    major: { type: String, default: 'غير محدد' },
    academicLevel: { type: String, default: 'غير محدد' },
    
    // تقييم النظام الحالي
    currentSystemRating: { type: Number, min: 1, max: 5 },
    currentProblems: [{ type: String }],
    currentPlatform: { type: String, default: 'لا شيء' },
    
    // تقييم الميزات المقترحة (1-5)
    featureLectures: { type: Number, min: 1, max: 5 },
    featureAttendance: { type: Number, min: 1, max: 5 },
    featureMonitoring: { type: Number, min: 1, max: 5 },
    featureExams: { type: Number, min: 1, max: 5 },
    featureActivities: { type: Number, min: 1, max: 5 },
    
    // التفضيلات
    preferredAttendance: { type: String, default: 'لا يهم' },
    biggestChallenge: { type: String, default: '' },
    examTrust: { type: String, default: 'غير محدد' },
    cameraIssue: { type: String, default: 'لا' },
    internetAvailability: { type: String, default: 'غير محدد' },
    
    // الاقتراحات
    cheatingPrevention: { type: String, default: 'محايد' },
    mostExpectedFeature: { type: String, default: '' },
    suggestions: { type: String, default: '' },
    testingParticipation: { type: String, default: 'لا' },
    overallSatisfaction: { type: Number, min: 1, max: 5 },
    
    // بيانات التتبع
    completionTime: { type: Number, default: 0 }, // بالدقائق
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    completed: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
});

const professorSchema = new mongoose.Schema({
    // المعلومات الشخصية
    name: { type: String, default: 'مجهول' },
    department: { type: String, default: 'غير محدد' },
    email: { type: String, default: '' },
    academicRank: { type: String, default: 'غير محدد' },
    teachingExperience: { type: String, default: 'غير محدد' },
    
    // تجربة التعليم الإلكتروني
    onlineCourses: { type: String, default: 'لا شيء' },
    teachingChallenges: [{ type: String }],
    currentSystemEffectiveness: { type: Number, min: 1, max: 5 },
    
    // متطلبات النظام الجديد (1-5)
    reqLectures: { type: Number, min: 1, max: 5 },
    reqAttendance: { type: Number, min: 1, max: 5 },
    reqMonitoring: { type: Number, min: 1, max: 5 },
    reqExams: { type: Number, min: 1, max: 5 },
    reqActivities: { type: Number, min: 1, max: 5 },
    
    // التفضيلات
    preferredAttendanceMethod: { type: String, default: 'لا يهم' },
    cheatingPreventionEffectiveness: { type: Number, min: 1, max: 5 },
    biggestObstacle: { type: String, default: '' },
    attendanceProblems: { type: String, default: 'لا' },
    examProblems: [{ type: String }],
    techSupport: { type: String, default: 'غير محدد' },
    
    // الاقتراحات
    mostImportantFeature: { type: String, default: '' },
    offlineImportance: { type: String, default: 'مهم' },
    expectedChallenges: { type: String, default: '' },
    managementRecommendations: { type: String, default: '' },
    systemUsefulness: { type: Number, min: 1, max: 5 },
    developmentParticipation: { type: String, default: 'لا' },
    
    // بيانات التتبع
    completionTime: { type: Number, default: 0 }, // بالدقائق
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    completed: { type: Boolean, default: true },
    timestamp: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const Professor = mongoose.model('Professor', professorSchema);

// اتصال MongoDB مع معالجة الأخطاء
async function connectToDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح');
        console.log(`📊 قاعدة البيانات: ${mongoose.connection.name}`);
        console.log(`👥 النماذج: Student, Professor`);
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        console.log('⚠️ النظام يعمل بدون قاعدة بيانات، البيانات ستخزن مؤقتاً');
    }
}

connectToDatabase();

// ==================== Routes ====================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/student-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-survey.html'));
});

app.get('/professor-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'professor-survey.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'research-report.html'));
});

// ==================== APIs ====================

// حفظ استبيان الطالب
app.post('/api/survey/student', async (req, res) => {
    try {
        const studentData = new Student({
            ...req.body,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'غير معروف'
        });
        
        await studentData.save();
        
        res.json({ 
            success: true, 
            message: 'تم حفظ استبيان الطالب بنجاح في قاعدة البيانات',
            id: studentData._id,
            timestamp: studentData.timestamp
        });
    } catch (error) {
        console.error('❌ خطأ في حفظ استبيان الطالب:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حفظ البيانات',
            error: error.message 
        });
    }
});

// حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', async (req, res) => {
    try {
        const professorData = new Professor({
            ...req.body,
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'غير معروف'
        });
        
        await professorData.save();
        
        res.json({ 
            success: true, 
            message: 'تم حفظ استبيان الهيئة التدريسية بنجاح في قاعدة البيانات',
            id: professorData._id,
            timestamp: professorData.timestamp
        });
    } catch (error) {
        console.error('❌ خطأ في حفظ استبيان الهيئة التدريسية:', error);
        res.status(500).json({ 
            success: false, 
            message: 'خطأ في حفظ البيانات',
            error: error.message 
        });
    }
});

// الحصول على جميع البيانات
app.get('/api/data/all', async (req, res) => {
    try {
        const [students, professors] = await Promise.all([
            Student.find().sort({ timestamp: -1 }).limit(1000),
            Professor.find().sort({ timestamp: -1 }).limit(1000)
        ]);
        
        res.json({
            success: true,
            database: 'MongoDB Atlas',
            students,
            professors,
            totals: {
                students: await Student.countDocuments(),
                professors: await Professor.countDocuments(),
                total: await Student.countDocuments() + await Professor.countDocuments()
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ خطأ في جلب البيانات:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطأ في قراءة البيانات',
            message: error.message 
        });
    }
});

// الحصول على التحليلات
app.get('/api/analysis', async (req, res) => {
    try {
        const [students, professors] = await Promise.all([
            Student.find(),
            Professor.find()
        ]);
        
        const allResponses = [...students, ...professors];
        
        const analysis = {
            success: true,
            summary: {
                totalParticipants: allResponses.length,
                studentCount: students.length,
                professorCount: professors.length,
                completionRate: calculateCompletionRate(allResponses),
                averageTime: calculateAverageTime(allResponses),
                database: 'MongoDB Atlas'
            },
            charts: {
                byMajor: groupBy(students, 'major'),
                byDepartment: groupBy(professors, 'department'),
                byAcademicLevel: groupBy(students, 'academicLevel'),
                byExperience: groupBy(professors, 'teachingExperience'),
                featureRankings: await rankFeatures(students, professors),
                satisfactionLevels: calculateSatisfaction(allResponses),
                cameraIssues: calculateCameraIssues(students),
                internetQuality: groupBy(allResponses, 'internetAvailability')
            },
            insights: generateInsights(students, professors),
            generatedAt: new Date().toISOString(),
            lastUpdated: new Date().toLocaleString('ar-SA')
        };
        
        res.json(analysis);
    } catch (error) {
        console.error('❌ خطأ في إنشاء التحليلات:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطأ في إنشاء التحليلات',
            message: error.message 
        });
    }
});

// إحصائيات سريعة
app.get('/api/stats/quick', async (req, res) => {
    try {
        const [studentCount, professorCount] = await Promise.all([
            Student.countDocuments(),
            Professor.countDocuments()
        ]);
        
        res.json({
            success: true,
            totalParticipants: studentCount + professorCount,
            studentCount,
            professorCount,
            database: 'MongoDB Atlas'
        });
    } catch (error) {
        res.json({
            success: false,
            totalParticipants: 0,
            studentCount: 0,
            professorCount: 0
        });
    }
});

// تصدير البيانات
app.get('/api/export/json', async (req, res) => {
    try {
        const [students, professors] = await Promise.all([
            Student.find(),
            Professor.find()
        ]);
        
        const exportData = {
            exportDate: new Date().toISOString(),
            project: "LMS Research Survey - الجامعة النجاح",
            database: "MongoDB Atlas",
            collection: "lms_research_db",
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            },
            generatedBy: "نظام استبيان بحثي متكامل"
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="lms-research-data-' + new Date().toISOString().split('T')[0] + '.json"');
        res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
        console.error('❌ خطأ في تصدير البيانات:', error);
        res.status(500).json({ 
            success: false, 
            error: 'خطأ في التصدير',
            message: error.message 
        });
    }
});

// فحص صحة الاتصال
app.get('/api/health', async (req, res) => {
    try {
        const dbState = mongoose.connection.readyState;
        const states = ['غير متصل', 'جاري الاتصال', 'متصل', 'فصل الاتصال'];
        
        res.json({
            success: true,
            status: 'نشط',
            database: {
                state: states[dbState] || 'غير معروف',
                name: mongoose.connection.name || 'غير متصل',
                host: mongoose.connection.host || 'غير متصل',
                models: ['Student', 'Professor']
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.json({
            success: false,
            status: 'خطأ',
            error: error.message
        });
    }
});

// ==================== Helper Functions ====================

function calculateCompletionRate(responses) {
    const completed = responses.filter(r => r.completed === true).length;
    return responses.length ? ((completed / responses.length) * 100).toFixed(1) : 0;
}

function calculateAverageTime(responses) {
    const times = responses.map(r => r.completionTime || 0);
    const validTimes = times.filter(t => t > 0);
    return validTimes.length ? 
        (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 0;
}

function groupBy(array, key) {
    return array.reduce((acc, item) => {
        const value = item[key] || 'غير محدد';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
}

async function rankFeatures(students, professors) {
    const allResponses = [...students, ...professors];
    const featureScores = {};
    
    // ميزات الطلاب
    ['featureLectures', 'featureAttendance', 'featureMonitoring', 'featureExams', 'featureActivities'].forEach(feature => {
        students.forEach(student => {
            if (student[feature]) {
                if (!featureScores[feature]) featureScores[feature] = { total: 0, count: 0 };
                featureScores[feature].total += student[feature];
                featureScores[feature].count += 1;
            }
        });
    });
    
    // ميزات الهيئة التدريسية
    ['reqLectures', 'reqAttendance', 'reqMonitoring', 'reqExams', 'reqActivities'].forEach(feature => {
        professors.forEach(professor => {
            if (professor[feature]) {
                if (!featureScores[feature]) featureScores[feature] = { total: 0, count: 0 };
                featureScores[feature].total += professor[feature];
                featureScores[feature].count += 1;
            }
        });
    });
    
    // حساب المتوسطات
    const averages = {};
    Object.entries(featureScores).forEach(([feature, data]) => {
        if (data.count > 0) {
            averages[feature] = parseFloat((data.total / data.count).toFixed(2));
        }
    });
    
    // تسميات عربية
    const arabicLabels = {
        'featureLectures': 'نظام إدارة المحاضرات (طلاب)',
        'featureAttendance': 'نظام التحضير الآلي (طلاب)',
        'featureMonitoring': 'نظام مراقبة الاختبارات (طلاب)',
        'featureExams': 'نظام إدارة الاختبارات (طلاب)',
        'featureActivities': 'نظام إدارة الأنشطة (طلاب)',
        'reqLectures': 'نظام إدارة المحاضرات (هيئة)',
        'reqAttendance': 'نظام التحضير الآلي (هيئة)',
        'reqMonitoring': 'نظام مراقبة الاختبارات (هيئة)',
        'reqExams': 'نظام إدارة الاختبارات (هيئة)',
        'reqActivities': 'نظام إدارة الأنشطة (هيئة)'
    };
    
    // ترتيب تنازلي مع تسميات عربية
    const ranked = {};
    Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .forEach(([key, value]) => {
            ranked[arabicLabels[key] || key] = value;
        });
    
    return ranked;
}

function calculateSatisfaction(responses) {
    const levels = { 
        'مرتفع جداً': 0, 
        'مرتفع': 0, 
        'متوسط': 0, 
        'منخفض': 0, 
        'منخفض جداً': 0 
    };
    
    responses.forEach(response => {
        const satisfaction = response.overallSatisfaction || response.systemUsefulness;
        if (satisfaction && levels.hasOwnProperty(satisfaction)) {
            levels[satisfaction]++;
        } else if (typeof satisfaction === 'number') {
            // تحويل رقم إلى نص
            if (satisfaction >= 4.5) levels['مرتفع جداً']++;
            else if (satisfaction >= 3.5) levels['مرتفع']++;
            else if (satisfaction >= 2.5) levels['متوسط']++;
            else if (satisfaction >= 1.5) levels['منخفض']++;
            else levels['منخفض جداً']++;
        }
    });
    
    return levels;
}

function calculateCameraIssues(students) {
    const issues = { نعم: 0, لا: 0, أحياناً: 0 };
    students.forEach(student => {
        if (student.cameraIssue && issues.hasOwnProperty(student.cameraIssue)) {
            issues[student.cameraIssue]++;
        }
    });
    return issues;
}

function generateInsights(students, professors) {
    const insights = [];
    
    if (students.length > 0) {
        // مشاكل الكاميرا
        const cameraYes = students.filter(s => s.cameraIssue === 'نعم').length;
        if (cameraYes > 0) {
            const percentage = Math.round((cameraYes / students.length) * 100);
            insights.push(`${percentage}% من الطلاب يعانون من مشاكل في كاميرات هواتفهم`);
        }
        
        // جودة الإنترنت
        const internetIssues = students.filter(s => 
            s.internetAvailability === 'ضعيف' || s.internetAvailability === 'غير متوفر'
        ).length;
        if (internetIssues > 0) {
            insights.push(`${Math.round((internetIssues / students.length) * 100)}% من الطلاب لديهم مشاكل في الإنترنت`);
        }
    }
    
    if (professors.length > 0) {
        // مشاكل التحضير
        const attendanceProblems = professors.filter(p => 
            p.attendanceProblems === 'دائماً' || p.attendanceProblems === 'أحياناً'
        ).length;
        if (attendanceProblems > 0) {
            insights.push(`${Math.round((attendanceProblems / professors.length) * 100)}% من الهيئة التدريسية يواجهون مشاكل في متابعة الحضور`);
        }
    }
    
    // إذا كانت هناك بيانات كافية
    if (students.length + professors.length >= 10) {
        insights.push('البيانات كافية لبدء تحليل إحصائي مفصل');
    } else {
        insights.push('لا تزال البيانات غير كافية، يلزم المزيد من المشاركات');
    }
    
    return insights.length > 0 ? insights : ['جاري جمع البيانات...'];
}

// إبقاء الخدمة نشطة ومنع إعادة التشغيل
setInterval(() => {
    const now = new Date();
    console.log(`🔄 Keep-alive: ${now.toLocaleString('ar-SA')}`);
    console.log(`📊 حالة قاعدة البيانات: ${mongoose.connection.readyState === 1 ? 'متصل ✅' : 'غير متصل ⚠️'}`);
    
    // طلب بسيط لإبقاء الخدمة نشطة
    if (mongoose.connection.readyState !== 1) {
        console.log('🔄 محاولة إعادة الاتصال بقاعدة البيانات...');
        connectToDatabase();
    }
}, 300000); // كل 5 دقائق

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 سيرفر البحث العلمي يعمل بنجاح!');
    console.log('='.repeat(60));
    console.log(`🌐 الرابط المحلي: http://localhost:${PORT}`);
    console.log(`🌍 الرابط العام: https://lms-research-project.onrender.com`);
    console.log(`🗄️  قاعدة البيانات: MongoDB Atlas`);
    console.log(`🔗 رابط الاتصال: ${MONGODB_URI.split('@')[0]}@${MONGODB_URI.split('@')[1].split('/')[0]}/...`);
    console.log(`📊 النماذج: Student, Professor`);
    console.log(`📅 ${new Date().toLocaleString('ar-SA')}`);
    console.log('='.repeat(60) + '\n');
    
    // فحص الاتصال بقاعدة البيانات
    setTimeout(async () => {
        try {
            const dbState = mongoose.connection.readyState;
            if (dbState === 1) {
                const studentCount = await Student.countDocuments();
                const professorCount = await Professor.countDocuments();
                console.log(`📈 البيانات الحالية: ${studentCount} طالب، ${professorCount} عضو هيئة تدريسية`);
            }
        } catch (error) {
            console.log('⚠️ لا يمكن قراءة عدد السجلات حالياً');
        }
    }, 2000);
});

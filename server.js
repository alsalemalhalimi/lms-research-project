const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Keep Alive System ====================
const KEEP_ALIVE_INTERVAL = 300000; // كل 5 دقائق

// وظيفة إبقاء الخدمة نشطة
function startKeepAlive() {
    setInterval(() => {
        const now = new Date();
        const memory = process.memoryUsage();
        console.log(`
        🔄 Keep-Alive System Active
        ⏰ الوقت: ${now.toLocaleString('ar-SA')}
        📊 الذاكرة: ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
        🌐 الخدمة نشطة وجاهزة
        ✅ Last Ping: ${now.toISOString()}
        `);
    }, KEEP_ALIVE_INTERVAL);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// مسارات الملفات
const dataDir = path.join(__dirname, 'data');
const studentsFile = path.join(dataDir, 'student-results.json');
const professorsFile = path.join(dataDir, 'professor-results.json');
const analysisFile = path.join(dataDir, 'combined-analysis.json');

// تأكد من وجود المجلدات والملفات
const initializeFiles = () => {
    try {
        // إنشاء مجلد data إذا لم يكن موجوداً
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log('✅ تم إنشاء مجلد data');
        }

        // تهيئة ملفات JSON إذا كانت فارغة
        const files = [
            { path: studentsFile, data: [] },
            { path: professorsFile, data: [] },
            { path: analysisFile, data: { summary: {}, charts: {}, insights: [], lastUpdated: new Date().toISOString() } }
        ];

        files.forEach(({ path: filePath, data }) => {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                console.log(`✅ تم إنشاء ${path.basename(filePath)}`);
            } else {
                // تأكد أن الملف يحتوي على بيانات صالحة
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf8');
                    if (!fileContent.trim()) {
                        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                        console.log(`✅ تم إصلاح ${path.basename(filePath)} (كان فارغاً)`);
                    } else {
                        JSON.parse(fileContent); // اختبار صحة JSON
                    }
                } catch (error) {
                    // إذا كان الملف تالفاً، أعده
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
                    console.log(`✅ تم إصلاح ${path.basename(filePath)} (كان تالفاً)`);
                }
            }
        });

        return true;
    } catch (error) {
        console.error('❌ خطأ في تهيئة الملفات:', error);
        return false;
    }
};

// تهيئة الملفات عند بدء التشغيل
initializeFiles();

// ==================== Routes ====================

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// صفحات الاستبيان
app.get('/student-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-survey.html'));
});

app.get('/professor-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'professor-survey.html'));
});

// صفحة النتائج
app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

// صفحة الداشبورد
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// صفحة التقرير
app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'research-report.html'));
});

// ==================== Keep Alive Endpoints ====================

// نقطة نهاية Keep-Alive
app.get('/keep-alive', (req, res) => {
    try {
        const memory = process.memoryUsage();
        const health = {
            status: 'active',
            serverTime: new Date().toLocaleString('ar-SA'),
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                pid: process.pid
            },
            database: {
                students: 0,
                professors: 0,
                total: 0
            }
        };

        // قراءة بيانات الطلاب
        try {
            if (fs.existsSync(studentsFile)) {
                const studentsData = fs.readFileSync(studentsFile, 'utf8');
                if (studentsData.trim()) {
                    const students = JSON.parse(studentsData);
                    health.database.students = students.length;
                }
            }
        } catch (error) {
            console.log('⚠️  خطأ في قراءة ملف الطلاب:', error.message);
        }

        // قراءة بيانات الهيئة التدريسية
        try {
            if (fs.existsSync(professorsFile)) {
                const professorsData = fs.readFileSync(professorsFile, 'utf8');
                if (professorsData.trim()) {
                    const professors = JSON.parse(professorsData);
                    health.database.professors = professors.length;
                }
            }
        } catch (error) {
            console.log('⚠️  خطأ في قراءة ملف الهيئة التدريسية:', error.message);
        }

        health.database.total = health.database.students + health.database.professors;
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطأ في الخادم',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// صفحة حالة النظام
app.get('/system-status', (req, res) => {
    try {
        const status = {
            system: 'LMS Research Survey System',
            version: '3.0.0',
            status: 'operational',
            serverTime: new Date().toLocaleString('ar-SA'),
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(process.uptime() / 60)} دقائق`,
            memory: {
                used: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                total: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`
            },
            keepAlive: {
                enabled: true,
                interval: '5 دقائق',
                nextPing: new Date(Date.now() + KEEP_ALIVE_INTERVAL).toLocaleString('ar-SA')
            },
            dataStats: {
                students: 0,
                professors: 0,
                totalParticipants: 0
            },
            endpoints: [
                { path: '/', method: 'GET', description: 'الصفحة الرئيسية' },
                { path: '/student-survey', method: 'GET', description: 'استبيان الطلاب' },
                { path: '/professor-survey', method: 'GET', description: 'استبيان الهيئة التدريسية' },
                { path: '/dashboard', method: 'GET', description: 'لوحة التحكم' },
                { path: '/results', method: 'GET', description: 'النتائج' },
                { path: '/report', method: 'GET', description: 'التقرير' },
                { path: '/keep-alive', method: 'GET', description: 'نقطة Keep-Alive' },
                { path: '/system-status', method: 'GET', description: 'حالة النظام' },
                { path: '/api/data/all', method: 'GET', description: 'جميع البيانات' },
                { path: '/api/analysis', method: 'GET', description: 'التحليل الإحصائي' }
            ]
        };

        // حساب الإحصائيات
        try {
            let students = [];
            let professors = [];

            if (fs.existsSync(studentsFile)) {
                const studentsData = fs.readFileSync(studentsFile, 'utf8');
                if (studentsData.trim()) {
                    students = JSON.parse(studentsData);
                }
            }

            if (fs.existsSync(professorsFile)) {
                const professorsData = fs.readFileSync(professorsFile, 'utf8');
                if (professorsData.trim()) {
                    professors = JSON.parse(professorsData);
                }
            }

            status.dataStats.students = students.length;
            status.dataStats.professors = professors.length;
            status.dataStats.totalParticipants = students.length + professors.length;

        } catch (error) {
            status.dataStats.error = error.message;
        }

        res.json(status);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'خطأ في حالة النظام',
            error: error.message
        });
    }
});

// ==================== APIs ====================

// API 1: حفظ استبيان الطالب
app.post('/api/survey/student', (req, res) => {
    try {
        let students = [];
        
        // قراءة البيانات الحالية
        if (fs.existsSync(studentsFile)) {
            const fileData = fs.readFileSync(studentsFile, 'utf8');
            if (fileData.trim()) {
                students = JSON.parse(fileData);
            }
        }

        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            completionTime: req.body.completionTime || 'غير محدد',
            submitted: true
        };

        students.push(surveyData);
        
        // حفظ البيانات
        fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2), 'utf8');
        
        // تحديث التحليل
        updateAnalysis();
        
        res.json({
            success: true,
            message: 'تم حفظ استبيان الطالب بنجاح',
            id: surveyData.id,
            timestamp: surveyData.timestamp,
            totalStudents: students.length
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

// API 2: حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', (req, res) => {
    try {
        let professors = [];
        
        // قراءة البيانات الحالية
        if (fs.existsSync(professorsFile)) {
            const fileData = fs.readFileSync(professorsFile, 'utf8');
            if (fileData.trim()) {
                professors = JSON.parse(fileData);
            }
        }

        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            completionTime: req.body.completionTime || 'غير محدد',
            submitted: true
        };

        professors.push(surveyData);
        
        // حفظ البيانات
        fs.writeFileSync(professorsFile, JSON.stringify(professors, null, 2), 'utf8');
        
        // تحديث التحليل
        updateAnalysis();
        
        res.json({
            success: true,
            message: 'تم حفظ استبيان الهيئة التدريسية بنجاح',
            id: surveyData.id,
            timestamp: surveyData.timestamp,
            totalProfessors: professors.length
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

// API 3: الحصول على جميع البيانات
app.get('/api/data/all', (req, res) => {
    try {
        let students = [];
        let professors = [];

        // قراءة بيانات الطلاب
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                students = JSON.parse(studentsData);
            }
        }

        // قراءة بيانات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                professors = JSON.parse(professorsData);
            }
        }

        res.json({
            success: true,
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            },
            lastUpdated: new Date().toLocaleString('ar-SA')
        });

    } catch (error) {
        console.error('❌ خطأ في قراءة البيانات:', error);
        res.status(500).json({
            success: false,
            error: 'خطأ في قراءة البيانات',
            message: error.message
        });
    }
});

// API 4: التحليل الإحصائي
app.get('/api/analysis', (req, res) => {
    try {
        let analysis = {
            summary: {
                totalParticipants: 0,
                studentCount: 0,
                professorCount: 0,
                completionRate: '0%',
                averageTime: '0 دقيقة',
                lastUpdate: new Date().toLocaleString('ar-SA')
            },
            charts: {
                satisfactionLevels: {},
                featureRankings: {},
                byMajor: {},
                byExperience: {}
            },
            insights: [],
            lastUpdated: new Date().toISOString()
        };

        // محاولة قراءة ملف التحليل
        if (fs.existsSync(analysisFile)) {
            const analysisData = fs.readFileSync(analysisFile, 'utf8');
            if (analysisData.trim()) {
                analysis = JSON.parse(analysisData);
            }
        }

        // إذا كان التحليل فارغاً، قم بتحديثه
        if (analysis.summary.totalParticipants === 0) {
            updateAnalysis();
            const updatedAnalysis = fs.readFileSync(analysisFile, 'utf8');
            analysis = JSON.parse(updatedAnalysis);
        }

        res.json({
            success: true,
            ...analysis
        });

    } catch (error) {
        console.error('❌ خطأ في التحليل:', error);
        res.status(500).json({
            success: false,
            error: 'خطأ في التحليل الإحصائي',
            message: error.message
        });
    }
});

// API 5: الحصول على النتائج (توافق مع dashboard.html)
app.get('/api/results', (req, res) => {
    try {
        const response = {
            students: [],
            professors: [],
            totals: {
                students: 0,
                professors: 0,
                total: 0
            }
        };

        // قراءة بيانات الطلاب
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                response.students = JSON.parse(studentsData);
            }
        }

        // قراءة بيانات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                response.professors = JSON.parse(professorsData);
            }
        }

        response.totals.students = response.students.length;
        response.totals.professors = response.professors.length;
        response.totals.total = response.totals.students + response.totals.professors;

        res.json(response);

    } catch (error) {
        console.error('❌ خطأ في /api/results:', error);
        res.status(500).json({
            error: 'خطأ في قراءة النتائج',
            message: error.message
        });
    }
});

// API 6: تصدير البيانات
app.get('/api/export/json', (req, res) => {
    try {
        let students = [];
        let professors = [];

        // قراءة البيانات
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                students = JSON.parse(studentsData);
            }
        }

        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                professors = JSON.parse(professorsData);
            }
        }

        const exportData = {
            exportDate: new Date().toISOString(),
            project: "LMS Research Survey",
            university: "الجامعة النجاح - كلية العلوم التطبيقية والتربوية",
            team: ["سالم الحالمي", "عمران عازب", "محمد المريسي", "أحمد زيدان", "بدر الدين عقبة", "طارق الشامي", "سليمان الشامي"],
            supervisor: "د. أحمد قاسم",
            students,
            professors,
            summary: {
                totalStudents: students.length,
                totalProfessors: professors.length,
                totalParticipants: students.length + professors.length
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="lms-research-data.json"');
        res.send(JSON.stringify(exportData, null, 2));

    } catch (error) {
        console.error('❌ خطأ في التصدير:', error);
        res.status(500).json({
            error: 'خطأ في التصدير',
            message: error.message
        });
    }
});

// API 7: تصحيح الأخطاء
app.get('/api/debug/files', (req, res) => {
    try {
        const debugInfo = {
            files: {},
            data: {
                students: [],
                professors: []
            },
            server: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version
            }
        };

        // معلومات الملفات
        const files = [
            { name: 'studentsFile', path: studentsFile },
            { name: 'professorsFile', path: professorsFile },
            { name: 'analysisFile', path: analysisFile }
        ];

        files.forEach(file => {
            if (fs.existsSync(file.path)) {
                const stats = fs.statSync(file.path);
                debugInfo.files[file.name] = {
                    exists: true,
                    size: `${(stats.size / 1024).toFixed(2)} KB`,
                    lastModified: stats.mtime,
                    path: file.path
                };

                // قراءة أول 3 سجلات
                try {
                    const content = fs.readFileSync(file.path, 'utf8');
                    if (content.trim()) {
                        const data = JSON.parse(content);
                        if (Array.isArray(data)) {
                            debugInfo.data[file.name.replace('File', '')] = data.slice(0, 3);
                        } else {
                            debugInfo.data[file.name.replace('File', '')] = data;
                        }
                    }
                } catch (parseError) {
                    debugInfo.files[file.name].parseError = parseError.message;
                }
            } else {
                debugInfo.files[file.name] = {
                    exists: false,
                    error: 'الملف غير موجود'
                };
            }
        });

        res.json(debugInfo);

    } catch (error) {
        res.status(500).json({
            error: 'خطأ في تصحيح الأخطاء',
            message: error.message,
            stack: error.stack
        });
    }
});

// ==================== Helper Functions ====================

// تحديث التحليل الإحصائي
function updateAnalysis() {
    try {
        let students = [];
        let professors = [];

        // قراءة بيانات الطلاب
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                students = JSON.parse(studentsData);
            }
        }

        // قراءة بيانات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                professors = JSON.parse(professorsData);
            }
        }

        const allResponses = [...students, ...professors];

        // حساب الإحصائيات
        const summary = {
            totalParticipants: allResponses.length,
            studentCount: students.length,
            professorCount: professors.length,
            completionRate: calculateCompletionRate(allResponses) + '%',
            averageTime: calculateAverageTime(allResponses) + ' دقيقة',
            lastUpdate: new Date().toLocaleString('ar-SA')
        };

        // تحضير الرسوم البيانية
        const charts = {
            satisfactionLevels: calculateSatisfaction(allResponses),
            featureRankings: rankFeatures(allResponses),
            byMajor: groupBy(allResponses, 'major'),
            byExperience: groupBy(allResponses, 'teachingExperience')
        };

        // توليد insights
        const insights = generateInsights(students, professors);

        const analysis = {
            summary,
            charts,
            insights,
            lastUpdated: new Date().toISOString()
        };

        // حفظ التحليل
        fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2), 'utf8');
        
        console.log(`✅ تم تحديث التحليل: ${students.length} طالب, ${professors.length} هيئة تدريسية`);
        
        return analysis;

    } catch (error) {
        console.error('❌ خطأ في تحديث التحليل:', error);
        return null;
    }
}

// تجميع البيانات حسب المفتاح
function groupBy(array, key) {
    const result = {};
    array.forEach(item => {
        const value = item[key] || 'غير محدد';
        result[value] = (result[value] || 0) + 1;
    });
    return result;
}

// حساب معدل الإكمال
function calculateCompletionRate(responses) {
    const completed = responses.filter(r => r.completed === true || r.submitted === true).length;
    return responses.length ? ((completed / responses.length) * 100).toFixed(1) : 0;
}

// حساب متوسط الوقت
function calculateAverageTime(responses) {
    const times = responses.map(r => {
        const time = parseInt(r.completionTime) || 0;
        return time > 0 ? time : 0;
    }).filter(t => t > 0);
    
    return times.length ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : 0;
}

// ترتيب الميزات حسب الأهمية
function rankFeatures(responses) {
    const featureScores = {};
    
    responses.forEach(response => {
        // البحث عن تقييمات الميزات في أي مكان في response
        Object.entries(response).forEach(([key, value]) => {
            if (key.includes('feature') || key.includes('Feature') || key.includes('ميزة')) {
                const rating = parseInt(value) || 0;
                if (rating > 0) {
                    featureScores[key] = featureScores[key] || { total: 0, count: 0 };
                    featureScores[key].total += rating;
                    featureScores[key].count += 1;
                }
            }
        });
    });
    
    const averages = {};
    Object.entries(featureScores).forEach(([feature, data]) => {
        averages[feature] = data.count ? (data.total / data.count).toFixed(2) : 0;
    });
    
    return Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // أول 10 ميزات فقط
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
}

// حساب مستويات الرضا
function calculateSatisfaction(responses) {
    const levels = { 
        'مرتفع جداً': 0, 
        'مرتفع': 0, 
        'متوسط': 0, 
        'منخفض': 0, 
        'منخفض جداً': 0,
        'ممتاز': 0,
        'جيد جداً': 0,
        'جيد': 0,
        'مقبول': 0,
        'ضعيف': 0
    };
    
    responses.forEach(response => {
        // البحث عن تقييم الرضا في أي مكان في response
        Object.entries(response).forEach(([key, value]) => {
            if (typeof value === 'string' && levels.hasOwnProperty(value)) {
                levels[value]++;
            }
        });
    });
    
    // إزالة المستويات ذات القيمة صفر
    Object.keys(levels).forEach(key => {
        if (levels[key] === 0) {
            delete levels[key];
        }
    });
    
    return levels;
}

// توليد insights
function generateInsights(students, professors) {
    const insights = [];
    
    if (students.length > 0) {
        insights.push(`عدد الطلاب المشاركين: ${students.length}`);
        
        // العثور على التخصص الأكثر شيوعاً
        const majors = groupBy(students, 'major');
        const topMajor = Object.entries(majors).sort(([,a], [,b]) => b - a)[0];
        if (topMajor) {
            insights.push(`التخصص الأكثر مشاركة: ${topMajor[0]} (${topMajor[1]} طالب)`);
        }
    }
    
    if (professors.length > 0) {
        insights.push(`عدد أعضاء الهيئة التدريسية المشاركين: ${professors.length}`);
        
        // العثور على القسم الأكثر شيوعاً
        const departments = groupBy(professors, 'department');
        const topDepartment = Object.entries(departments).sort(([,a], [,b]) => b - a)[0];
        if (topDepartment) {
            insights.push(`القسم الأكثر مشاركة: ${topDepartment[0]} (${topDepartment[1]} عضو)`);
        }
    }
    
    if (students.length === 0 && professors.length === 0) {
        insights.push('جاري انتظار المشاركات الأولى...');
    }
    
    return insights.length > 0 ? insights : ['لا توجد insights متاحة حالياً'];
}

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 سيرفر البحث العلمي يعمل بنجاح!
    🌐 الرابط: http://localhost:${PORT}
    📊 النظام جاهز لجمع بيانات البحث
    📅 ${new Date().toLocaleString('ar-SA')}
    `);
    
    // بدء نظام Keep-Alive
    startKeepAlive();
    console.log('✅ نظام Keep-Alive مفعل');
    
    // تحديث التحليل الأولي
    updateAnalysis();
    
    console.log(`
    ========================================
    ✅ النظام يعمل بكامل طاقته!
    
    🔗 الروابط المتاحة:
    
    الصفحات الرئيسية:
    - الرئيسية: http://localhost:${PORT}
    - استبيان الطلاب: http://localhost:${PORT}/student-survey
    - استبيان الهيئة التدريسية: http://localhost:${PORT}/professor-survey
    - لوحة التحكم: http://localhost:${PORT}/dashboard
    - النتائج: http://localhost:${PORT}/results
    - التقرير: http://localhost:${PORT}/report
    
    APIs:
    - Keep-Alive: http://localhost:${PORT}/keep-alive
    - حالة النظام: http://localhost:${PORT}/system-status
    - جميع البيانات: http://localhost:${PORT}/api/data/all
    - التحليل: http://localhost:${PORT}/api/analysis
    - النتائج: http://localhost:${PORT}/api/results
    - تصحيح: http://localhost:${PORT}/api/debug/files
    
    🕒 Keep-Alive يعمل كل 5 دقائق
    📈 البيانات تحفظ تلقائياً
    🔄 الخدمة ستبقى نشطة 24/7
    ========================================
    `);
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير متوقع:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ وعد مرفوض:', reason);
});

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Keep Alive System ====================
const KEEP_ALIVE_INTERVAL = 300000; // كل 5 دقائق (300000 مللي ثانية)

// وظيفة إبقاء الخدمة نشطة
function startKeepAlive() {
    setInterval(() => {
        const now = new Date();
        const memoryUsage = process.memoryUsage();
        console.log(`
        🔄 Keep-Alive System Active
        ⏰ الوقت: ${now.toLocaleString('ar-SA')}
        📊 الذاكرة المستخدمة: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
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

// تأكد من وجود المجلدات
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// تهيئة الملفات إذا لم تكن موجودة
const initFile = (filePath, initialData) => {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
    }
};

initFile(studentsFile, []);
initFile(professorsFile, []);
initFile(analysisFile, {
    summary: {},
    charts: {},
    lastUpdated: new Date().toISOString()
});

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

// نقطة نهاية Keep-Alive للخدمات الخارجية
app.get('/keep-alive', (req, res) => {
    const health = {
        status: 'active',
        serverTime: new Date().toLocaleString('ar-SA'),
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
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
    
    try {
        // قراءة بيانات الطلاب
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                health.database.students = JSON.parse(studentsData).length;
            }
        }
        
        // قراءة بيانات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                health.database.professors = JSON.parse(professorsData).length;
            }
        }
        
        health.database.total = health.database.students + health.database.professors;
        
    } catch (error) {
        health.database.error = 'Error reading data files';
    }
    
    res.json(health);
});

// صفحة حالة النظام
// نقطة نهاية Keep-Alive للخدمات الخارجية
app.get('/keep-alive', (req, res) => {
    try {
        const health = {
            status: 'active',
            serverTime: new Date().toLocaleString('ar-SA'),
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)} MB`,
                rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`
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
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                const students = JSON.parse(studentsData);
                health.database.students = students.length;
            }
        }
        
        // قراءة بيانات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                const professors = JSON.parse(professorsData);
                health.database.professors = professors.length;
            }
        }
        
        health.database.total = health.database.students + health.database.professors;
        
        res.json(health);
    } catch (error) {
        res.json({
            status: 'error',
            message: 'خطأ في قراءة البيانات',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', (req, res) => {
    try {
        let data = [];
        if (fs.existsSync(professorsFile)) {
            const fileData = fs.readFileSync(professorsFile, 'utf8');
            if (fileData.trim()) {
                data = JSON.parse(fileData);
            }
        }
        
        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            completionTime: req.body.completionTime || 'غير محدد'
        };
        
        data.push(surveyData);
        fs.writeFileSync(professorsFile, JSON.stringify(data, null, 2), 'utf8');
        
        // تحديث التحليل
        updateAnalysis();
        
        res.json({ 
            success: true, 
            message: 'تم حفظ استبيان الهيئة التدريسية بنجاح',
            id: surveyData.id,
            timestamp: surveyData.timestamp
        });
    } catch (error) {
        console.error('Error saving professor survey:', error);
        res.status(500).json({ success: false, message: 'خطأ في حفظ البيانات', error: error.message });
    }
});

// الحصول على جميع البيانات
app.get('/api/data/all', (req, res) => {
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
        
        res.json({
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            },
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'خطأ في قراءة البيانات', details: error.message });
    }
});

// الحصول على التحليلات
app.get('/api/analysis', (req, res) => {
    try {
        if (fs.existsSync(analysisFile)) {
            const analysisData = fs.readFileSync(analysisFile, 'utf8');
            if (analysisData.trim()) {
                const analysis = JSON.parse(analysisData);
                res.json(analysis);
            } else {
                res.json({ summary: {}, charts: {}, lastUpdated: new Date().toISOString() });
            }
        } else {
            res.json({ summary: {}, charts: {}, lastUpdated: new Date().toISOString() });
        }
    } catch (error) {
        console.error('Error reading analysis:', error);
        res.status(500).json({ error: 'خطأ في قراءة التحليلات', details: error.message });
    }
});

// تصدير البيانات كـ JSON
app.get('/api/export/json', (req, res) => {
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
        console.error('Error exporting data:', error);
        res.status(500).json({ error: 'خطأ في التصدير', details: error.message });
    }
});

// صفحة تصحيح الأخطاء
app.get('/api/debug/files', (req, res) => {
    try {
        let students = [];
        let professors = [];
        let analysis = {};
        
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
        
        if (fs.existsSync(analysisFile)) {
            const analysisData = fs.readFileSync(analysisFile, 'utf8');
            if (analysisData.trim()) {
                analysis = JSON.parse(analysisData);
            }
        }
        
        res.json({
            files: {
                studentsFile: {
                    exists: fs.existsSync(studentsFile),
                    size: fs.existsSync(studentsFile) ? `${(fs.statSync(studentsFile).size / 1024).toFixed(2)} KB` : 'غير موجود',
                    lastModified: fs.existsSync(studentsFile) ? fs.statSync(studentsFile).mtime : null,
                    records: students.length
                },
                professorsFile: {
                    exists: fs.existsSync(professorsFile),
                    size: fs.existsSync(professorsFile) ? `${(fs.statSync(professorsFile).size / 1024).toFixed(2)} KB` : 'غير موجود',
                    lastModified: fs.existsSync(professorsFile) ? fs.statSync(professorsFile).mtime : null,
                    records: professors.length
                },
                analysisFile: {
                    exists: fs.existsSync(analysisFile),
                    size: fs.existsSync(analysisFile) ? `${(fs.statSync(analysisFile).size / 1024).toFixed(2)} KB` : 'غير موجود',
                    lastModified: fs.existsSync(analysisFile) ? fs.statSync(analysisFile).mtime : null
                }
            },
            data: {
                students: students.slice(0, 3), // أول 3 سجلات فقط
                professors: professors.slice(0, 3),
                analysis: analysis
            },
            server: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            }
        });
    } catch (error) {
        res.json({ error: error.message, stack: error.stack });
    }
});

// ==================== Helper Functions ====================

function updateAnalysis() {
    try {
        let students = [];
        let professors = [];
        
        // قراءة ملفات الطلاب
        if (fs.existsSync(studentsFile)) {
            const studentsData = fs.readFileSync(studentsFile, 'utf8');
            if (studentsData.trim()) {
                students = JSON.parse(studentsData);
            }
        }
        
        // قراءة ملفات الهيئة التدريسية
        if (fs.existsSync(professorsFile)) {
            const professorsData = fs.readFileSync(professorsFile, 'utf8');
            if (professorsData.trim()) {
                professors = JSON.parse(professorsData);
            }
        }
        
        const allResponses = [...students, ...professors];
        
        const analysis = {
            summary: {
                totalParticipants: allResponses.length,
                studentCount: students.length,
                professorCount: professors.length,
                completionRate: calculateCompletionRate(allResponses),
                averageTime: calculateAverageTime(allResponses),
                lastUpdate: new Date().toLocaleString('ar-SA')
            },
            charts: {
                byGender: groupBy(allResponses, 'gender'),
                byAge: groupBy(allResponses, 'age'),
                byEducation: groupBy(allResponses, 'educationLevel'),
                byExperience: groupBy(allResponses, 'experience'),
                featureRankings: rankFeatures(allResponses),
                satisfactionLevels: calculateSatisfaction(allResponses)
            },
            insights: generateInsights(students, professors),
            lastUpdated: new Date().toISOString()
        };
        
        fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2), 'utf8');
        
        console.log(`✅ تم تحديث التحليل: ${students.length} طالب, ${professors.length} عضو هيئة تدريس`);
    } catch (error) {
        console.error('Error updating analysis:', error);
    }
}

function groupBy(array, key) {
    const result = {};
    array.forEach(item => {
        const value = item[key] || 'غير محدد';
        result[value] = (result[value] || 0) + 1;
    });
    return result;
}

function calculateCompletionRate(responses) {
    const completed = responses.filter(r => r.completed === true).length;
    return responses.length ? ((completed / responses.length) * 100).toFixed(1) : 0;
}

function calculateAverageTime(responses) {
    const times = responses.map(r => parseInt(r.completionTime) || 0);
    const validTimes = times.filter(t => t > 0);
    return validTimes.length ? 
        (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(1) : 0;
}

function rankFeatures(responses) {
    const featureScores = {};
    
    responses.forEach(response => {
        if (response.featureRatings) {
            Object.entries(response.featureRatings).forEach(([feature, rating]) => {
                if (!featureScores[feature]) {
                    featureScores[feature] = { total: 0, count: 0 };
                }
                featureScores[feature].total += parseInt(rating) || 0;
                featureScores[feature].count += 1;
            });
        }
    });
    
    const averages = {};
    Object.entries(featureScores).forEach(([feature, data]) => {
        averages[feature] = data.count ? (data.total / data.count).toFixed(2) : 0;
    });
    
    return Object.entries(averages)
        .sort(([, a], [, b]) => b - a)
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
}

function calculateSatisfaction(responses) {
    const levels = { 'مرتفع جداً': 0, 'مرتفع': 0, 'متوسط': 0, 'منخفض': 0, 'منخفض جداً': 0 };
    
    responses.forEach(response => {
        const satisfaction = response.overallSatisfaction || response.systemUsefulness;
        if (satisfaction && levels.hasOwnProperty(satisfaction)) {
            levels[satisfaction]++;
        }
    });
    
    return levels;
}

function generateInsights(students, professors) {
    const insights = [];
    
    if (students.length > 0) {
        const topStudentNeed = findTopNeed(students, 'needs');
        if (topStudentNeed) {
            insights.push(`الطلاب يفضلون: ${topStudentNeed}`);
        }
    }
    
    if (professors.length > 0) {
        const topProfessorNeed = findTopNeed(professors, 'requirements');
        if (topProfessorNeed) {
            insights.push(`الهيئة التدريسية تحتاج: ${topProfessorNeed}`);
        }
    }
    
    const studentSatisfaction = calculateAverageSatisfaction(students);
    const professorSatisfaction = calculateAverageSatisfaction(professors);
    
    if (studentSatisfaction > professorSatisfaction) {
        insights.push('الطلاب أكثر رضا عن النظام الحالي من الهيئة التدريسية');
    } else if (professorSatisfaction > studentSatisfaction) {
        insights.push('الهيئة التدريسية أكثر رضا عن النظام الحالي من الطلاب');
    }
    
    if (students.length + professors.length > 10) {
        insights.push(`تم جمع ${students.length + professors.length} استجابة حتى الآن`);
    }
    
    return insights.length > 0 ? insights : ['جاري جمع البيانات...'];
}

function findTopNeed(responses, field) {
    const needs = {};
    responses.forEach(response => {
        if (response[field]) {
            const needList = Array.isArray(response[field]) ? response[field] : [response[field]];
            needList.forEach(need => {
                needs[need] = (needs[need] || 0) + 1;
            });
        }
    });
    
    const sorted = Object.entries(needs).sort(([, a], [, b]) => b - a);
    return sorted.length > 0 ? sorted[0][0] : null;
}

function calculateAverageSatisfaction(responses) {
    const satisfactionMap = {
        'مرتفع جداً': 5, 'مرتفع': 4, 'متوسط': 3, 'منخفض': 2, 'منخفض جداً': 1
    };
    
    const scores = responses
        .map(r => satisfactionMap[r.overallSatisfaction || r.systemUsefulness] || 0)
        .filter(s => s > 0);
    
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}

// ==================== Start Server ====================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 سيرفر البحث العلمي يعمل بنجاح!
    🌐 الرابط المحلي: http://localhost:${PORT}
    📊 النظام جاهز لجمع بيانات البحث
    📅 ${new Date().toLocaleString('ar-SA')}
    `);
    
    // بدء نظام Keep-Alive
    startKeepAlive();
    console.log('✅ نظام Keep-Alive مفعل - الخدمة ستبقى نشطة');
    
    // تحديث التحليل الأولي
    updateAnalysis();
    
    console.log(`
    ========================================
    ✅ النظام يعمل بكامل طاقته!
    
    روابط الاختبار:
    - الصفحة الرئيسية: http://localhost:${PORT}
    - Keep-Alive: http://localhost:${PORT}/keep-alive
    - حالة النظام: http://localhost:${PORT}/system-status
    - تصحيح الأخطاء: http://localhost:${PORT}/api/debug/files
    
    🕒 Keep-Alive يعمل كل 5 دقائق
    📈 البيانات تحفظ تلقائياً
    🔄 الخدمة ستبقى نشطة 24/7
    ========================================
    `);
});

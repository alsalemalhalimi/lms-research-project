const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== Middleware ====================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// ==================== Keep Alive System ====================
const KEEP_ALIVE_INTERVAL = 300000; // كل 5 دقائق

function startKeepAlive() {
    setInterval(() => {
        const now = new Date();
        console.log(`
        🔄 Keep-Alive Ping
        ⏰ الوقت: ${now.toLocaleString('ar-SA')}
        📊 الذاكرة: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
        ✅ الخدمة نشطة
        `);
    }, KEEP_ALIVE_INTERVAL);
}

// ==================== File Paths ====================
const dataDir = path.join(__dirname, 'data');
const studentsFile = path.join(dataDir, 'students.json');
const professorsFile = path.join(dataDir, 'professors.json');

// Create data directory if not exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize files if not exist
if (!fs.existsSync(studentsFile)) {
    fs.writeFileSync(studentsFile, JSON.stringify([]), 'utf8');
}

if (!fs.existsSync(professorsFile)) {
    fs.writeFileSync(professorsFile, JSON.stringify([]), 'utf8');
}

// ==================== HTML Routes ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/student-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'student-survey.html'));
});

app.get('/professor-survey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'professor-survey.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'research-report.html'));
});

// ==================== API Routes ====================

// ✅ 1. حفظ استبيان الطالب
app.post('/api/survey/student', (req, res) => {
    console.log('📝 استلام استبيان طالب:', req.body);
    
    try {
        // قراءة البيانات الحالية
        let students = [];
        if (fs.existsSync(studentsFile)) {
            const data = fs.readFileSync(studentsFile, 'utf8');
            if (data.trim()) {
                students = JSON.parse(data);
            }
        }
        
        // إضافة البيانات الجديدة
        const newStudent = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'unknown'
        };
        
        students.push(newStudent);
        
        // حفظ البيانات
        fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2), 'utf8');
        
        console.log(`✅ تم حفظ استبيان طالب #${newStudent.id}`);
        
        res.json({
            success: true,
            message: 'تم حفظ استبيان الطالب بنجاح',
            id: newStudent.id,
            timestamp: newStudent.timestamp,
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

// ✅ 2. حفظ استبيان الهيئة التدريسية
app.post('/api/survey/professor', (req, res) => {
    console.log('📝 استلام استبيان هيئة تدريسية:', req.body);
    
    try {
        // قراءة البيانات الحالية
        let professors = [];
        if (fs.existsSync(professorsFile)) {
            const data = fs.readFileSync(professorsFile, 'utf8');
            if (data.trim()) {
                professors = JSON.parse(data);
            }
        }
        
        // إضافة البيانات الجديدة
        const newProfessor = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'unknown'
        };
        
        professors.push(newProfessor);
        
        // حفظ البيانات
        fs.writeFileSync(professorsFile, JSON.stringify(professors, null, 2), 'utf8');
        
        console.log(`✅ تم حفظ استبيان هيئة تدريسية #${newProfessor.id}`);
        
        res.json({
            success: true,
            message: 'تم حفظ استبيان الهيئة التدريسية بنجاح',
            id: newProfessor.id,
            timestamp: newProfessor.timestamp,
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

// ✅ 3. جلب جميع البيانات
app.get('/api/data/all', (req, res) => {
    try {
        let students = [];
        let professors = [];
        
        if (fs.existsSync(studentsFile)) {
            const data = fs.readFileSync(studentsFile, 'utf8');
            if (data.trim()) {
                students = JSON.parse(data);
            }
        }
        
        if (fs.existsSync(professorsFile)) {
            const data = fs.readFileSync(professorsFile, 'utf8');
            if (data.trim()) {
                professors = JSON.parse(data);
            }
        }
        
        res.json({
            success: true,
            students: students,
            professors: professors,
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
            message: 'خطأ في قراءة البيانات',
            error: error.message
        });
    }
});

// ✅ 4. Keep-Alive Endpoint
app.get('/keep-alive', (req, res) => {
    try {
        let students = [];
        let professors = [];
        
        if (fs.existsSync(studentsFile)) {
            const data = fs.readFileSync(studentsFile, 'utf8');
            if (data.trim()) {
                students = JSON.parse(data);
            }
        }
        
        if (fs.existsSync(professorsFile)) {
            const data = fs.readFileSync(professorsFile, 'utf8');
            if (data.trim()) {
                professors = JSON.parse(data);
            }
        }
        
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
            database: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            }
        };
        
        res.json(health);
        
    } catch (error) {
        res.json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ✅ 5. Test API Endpoint
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API يعمل بشكل صحيح',
        timestamp: new Date().toLocaleString('ar-SA'),
        availableEndpoints: [
            { method: 'POST', path: '/api/survey/student', description: 'حفظ استبيان الطالب' },
            { method: 'POST', path: '/api/survey/professor', description: 'حفظ استبيان الهيئة التدريسية' },
            { method: 'GET', path: '/api/data/all', description: 'جلب جميع البيانات' },
            { method: 'GET', path: '/keep-alive', description: 'حالة الخدمة' },
            { method: 'GET', path: '/api/test', description: 'اختبار API' }
        ],
        system: {
            nodeVersion: process.version,
            platform: process.platform,
            uptime: `${Math.floor(process.uptime() / 60)} دقائق`
        }
    });
});

// ✅ 6. Debug Endpoint
app.get('/api/debug', (req, res) => {
    const debugInfo = {
        timestamp: new Date().toISOString(),
        files: {
            studentsFile: {
                exists: fs.existsSync(studentsFile),
                size: fs.existsSync(studentsFile) ? `${(fs.statSync(studentsFile).size / 1024).toFixed(2)} KB` : 'غير موجود',
                records: 0
            },
            professorsFile: {
                exists: fs.existsSync(professorsFile),
                size: fs.existsSync(professorsFile) ? `${(fs.statSync(professorsFile).size / 1024).toFixed(2)} KB` : 'غير موجود',
                records: 0
            }
        },
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV || 'development'
        }
    };
    
    // حساب عدد السجلات
    try {
        if (fs.existsSync(studentsFile)) {
            const data = fs.readFileSync(studentsFile, 'utf8');
            if (data.trim()) {
                debugInfo.files.studentsFile.records = JSON.parse(data).length;
            }
        }
        
        if (fs.existsSync(professorsFile)) {
            const data = fs.readFileSync(professorsFile, 'utf8');
            if (data.trim()) {
                debugInfo.files.professorsFile.records = JSON.parse(data).length;
            }
        }
    } catch (error) {
        debugInfo.error = error.message;
    }
    
    res.json(debugInfo);
});

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
    
    console.log(`
    ========================================
    ✅ النظام يعمل بكامل طاقته!
    
    روابط الاختبار:
    - الصفحة الرئيسية: http://localhost:${PORT}
    - Keep-Alive: http://localhost:${PORT}/keep-alive
    - اختبار API: http://localhost:${PORT}/api/test
    - تصحيح الأخطاء: http://localhost:${PORT}/api/debug
    
    🕒 Keep-Alive يعمل كل 5 دقائق
    📈 البيانات تحفظ تلقائياً
    🔄 الخدمة ستبقى نشطة 24/7
    ========================================
    `);
});

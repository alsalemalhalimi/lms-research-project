const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// إعداد مسارات الملفات لتعمل على Render
const dataDir = path.join(__dirname, 'data');

// التأكد من وجود مجلد data
if (!fs.existsSync(dataDir)) {
    console.log('📁 إنشاء مجلد data...');
    fs.mkdirSync(dataDir, { recursive: true });
}

const studentsFile = path.join(dataDir, 'student-results.json');
const professorsFile = path.join(dataDir, 'professor-results.json');
const analysisFile = path.join(dataDir, 'combined-analysis.json');

// تهيئة الملفات إذا لم تكن موجودة
const initFile = (filePath, initialData) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`📄 إنشاء ملف ${path.basename(filePath)}...`);
            fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2), 'utf8');
        }
    } catch (error) {
        console.error(`❌ خطأ في إنشاء ${filePath}:`, error);
    }
};

// تهيئة الملفات
initFile(studentsFile, []);
initFile(professorsFile, []);
initFile(analysisFile, {
    summary: {},
    charts: {},
    insights: [],
    lastUpdated: new Date().toISOString()
});

// دالة محسنة لقراءة الملفات
const readJSONFile = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ خطأ في قراءة ${filePath}:`, error);
        return [];
    }
};

// دالة محسنة لكتابة الملفات
const writeJSONFile = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error(`❌ خطأ في كتابة ${filePath}:`, error);
        return false;
    }
};

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
app.post('/api/survey/student', (req, res) => {
    try {
        console.log('📝 استلام استبيان طالب...');
        
        const data = readJSONFile(studentsFile);
        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'غير معروف',
            completionTime: req.body.completionTime || 'غير محدد'
        };
        
        console.log(`✅ حفظ طالب: ${surveyData.name || 'مجهول'}`);
        
        data.push(surveyData);
        
        if (writeJSONFile(studentsFile, data)) {
            res.json({ 
                success: true, 
                message: 'تم حفظ استبيان الطالب بنجاح',
                id: surveyData.id
            });
        } else {
            throw new Error('فشل في حفظ الملف');
        }
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
app.post('/api/survey/professor', (req, res) => {
    try {
        console.log('📝 استلام استبيان هيئة تدريسية...');
        
        const data = readJSONFile(professorsFile);
        const surveyData = {
            id: Date.now(),
            ...req.body,
            timestamp: new Date().toLocaleString('ar-SA'),
            ip: req.ip || 'غير معروف',
            completionTime: req.body.completionTime || 'غير محدد'
        };
        
        console.log(`✅ حفظ أستاذ: ${surveyData.name || 'مجهول'}`);
        
        data.push(surveyData);
        
        if (writeJSONFile(professorsFile, data)) {
            res.json({ 
                success: true, 
                message: 'تم حفظ استبيان الهيئة التدريسية بنجاح',
                id: surveyData.id
            });
        } else {
            throw new Error('فشل في حفظ الملف');
        }
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
app.get('/api/data/all', (req, res) => {
    try {
        const students = readJSONFile(studentsFile);
        const professors = readJSONFile(professorsFile);
        
        res.json({
            students,
            professors,
            totals: {
                students: students.length,
                professors: professors.length,
                total: students.length + professors.length
            },
            serverTime: new Date().toLocaleString('ar-SA')
        });
    } catch (error) {
        console.error('❌ خطأ في قراءة البيانات:', error);
        res.status(500).json({ 
            error: 'خطأ في قراءة البيانات',
            details: error.message 
        });
    }
});

// الحصول على التحليلات
app.get('/api/analysis', (req, res) => {
    try {
        const analysis = readJSONFile(analysisFile);
        res.json(analysis);
    } catch (error) {
        console.error('❌ خطأ في قراءة التحليلات:', error);
        res.status(500).json({ 
            error: 'خطأ في قراءة التحليلات',
            details: error.message 
        });
    }
});

// API لفحص صحة السيرفر
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'LMS Research Survey',
        version: '2.0.0',
        endpoints: {
            studentSurvey: '/api/survey/student',
            professorSurvey: '/api/survey/professor',
            getAllData: '/api/data/all',
            getAnalysis: '/api/analysis'
        }
    });
});

// تشغيل السيرفر
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 سيرفر البحث العلمي يعمل بنجاح!
    🌐 الرابط: http://localhost:${PORT}
    📅 ${new Date().toLocaleString('ar-SA')}
    `);
    
    // التحقق من الملفات
    console.log('🔍 حالة الملفات:');
    console.log(`   📄 students.json: ${fs.existsSync(studentsFile) ? '✅' : '❌'}`);
    console.log(`   📄 professors.json: ${fs.existsSync(professorsFile) ? '✅' : '❌'}`);
    console.log(`   📄 analysis.json: ${fs.existsSync(analysisFile) ? '✅' : '❌'}`);
});

import type {
  AcademySettings,
  Announcement,
  Course,
  Instructor,
  LearningTrack,
  Lesson,
  Testimonial,
} from '../types';

export const HERO_IMAGE_PATH = '/src/assets/images/hero_syntax_academy_1794849466626.jpg';

export const INITIAL_INSTRUCTORS: Omit<Instructor, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'omar-ashraf',
    nameEn: 'Omar Ashraf',
    nameAr: 'عمر أشرف',
    specializationEn: 'Frontend Engineering & UI Architecture',
    specializationAr: 'هندسة الواجهات الأمامية ومعمارية تجربة المستخدم',
    bioEn:
      'Senior frontend architect specializing in React, TypeScript, design systems, and accessible production web applications. Mentors aspiring engineers from foundational HTML/CSS to scalable enterprise interfaces.',
    bioAr:
      'مهندس معماري أول للواجهات الأمامية متخصص في React و TypeScript وأنظمة التصميم وتطبيقات الويب الاحترافية. يوجّه المتدربين من أساسيات بناء الويب حتى بناء واجهات مؤسسية قابلة للتوسع.',
    avatarUrl: '/src/assets/images/instructor_omar_ashraf_1794849469424.jpg',
    isActive: true,
  },
  {
    id: 'mohamed-ashraf',
    nameEn: 'Mohamed Ashraf',
    nameAr: 'محمد أشرف',
    specializationEn: 'Backend Systems, APIs & Full Stack Architecture',
    specializationAr: 'الأنظمة الخلفية وواجهات البرمجة وهندسة Full Stack',
    bioEn:
      'Backend and distributed systems engineer focused on Node.js, TypeScript, relational and NoSQL databases, cloud security, and clean API engineering for production software.',
    bioAr:
      'مهندس أنظمة خلفية وموزعة يركز على Node.js و TypeScript وقواعد البيانات وأمن السحابة وتصميم واجهات برمجة التطبيقات عالية الاعتمادية.',
    avatarUrl: '/src/assets/images/instructor_mohamed_ashraf_1794849468332.jpg',
    isActive: true,
  },
  {
    id: 'malak-wael',
    nameEn: 'Malak Wael',
    nameAr: 'ملك وائل',
    specializationEn: 'Productivity Suites, Data Analysis & Career Readiness',
    specializationAr: 'حزم الإنتاجية المكتبية وتحليل البيانات والجاهزية المهنية',
    bioEn:
      'Technology educator and business productivity specialist guiding learners through Microsoft Office mastery, executive Excel modeling, structured documentation, and workplace automation.',
    bioAr:
      'مدربة تقنية ومتخصصة في أدوات الإنتاجية المؤسسية، تقود المتدربين لإتقان حزمة Microsoft Office والنمذجة المالية المتقدمة في Excel وإعداد التقارير الاحترافية.',
    avatarUrl: '/src/assets/images/instructor_malak_wael_1794849469283.jpg',
    isActive: true,
  },
];

export const INITIAL_TRACKS: Omit<LearningTrack, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'frontend-development',
    slug: 'frontend-development',
    category: 'programming',
    titleEn: 'Frontend Development',
    titleAr: 'تطوير الواجهات الأمامية (Frontend)',
    descriptionEn:
      'Master modern web interface engineering with HTML5, CSS3, Tailwind, JavaScript ES2024, TypeScript, and React. Build production-grade responsive applications with clean architecture and real API integrations.',
    descriptionAr:
      'أتقن هندسة واجهات الويب الحديثة باستخدام HTML5 و CSS3 و Tailwind و JavaScript و TypeScript و React. ابنِ تطبيقات متجاوبة بمستوى إنتاجي وهيكلة نظيفة متصلة بواجهات برمجة حقيقية.',
    thumbnailUrl: '/src/assets/images/track_frontend_dev_1794849467820.jpg',
    originalPrice: 3000,
    discountedPrice: 2500,
    durationEn: '12 Weeks · Practical Labs',
    durationAr: '12 أسبوعًا · تطبيقات عملية',
    instructorId: 'omar-ashraf',
    skills: ['HTML5 & Semantic Web', 'Modern CSS & Tailwind', 'JavaScript ES2024', 'TypeScript', 'React & State Management', 'REST APIs & Git'],
    objectivesEn: [
      'Architect responsive, accessible user interfaces across mobile and desktop viewports.',
      'Write strongly typed application logic using TypeScript and modern React hooks.',
      'Integrate real backend APIs, authentication flows, and state synchronization.',
      'Deploy production web applications with optimized performance budgets.',
    ],
    objectivesAr: [
      'تصميم وبناء واجهات مستخدم متجاوبة وسهلة الوصول عبر جميع الشاشات.',
      'كتابة منطق برمجي محكم الأنواع باستخدام TypeScript و React Hooks الحديثة.',
      'ربط التطبيقات بواجهات برمجة حقيقية وأنظمة مصادقة وإدارة حالة متقدمة.',
      'نشر تطبيقات الويب الإنتاجية مع تحسين الأداء وجودة الكود.',
    ],
    curriculum: [
      {
        titleEn: 'Module 01: Web Foundations & Layout Systems',
        titleAr: 'الوحدة 01: أساسيات الويب وأنظمة التخطيط',
        topicsEn: ['Semantic HTML5', 'CSS Grid & Flexbox', 'Responsive Breakpoints', 'Tailwind CSS Architecture'],
        topicsAr: ['هيكلة HTML5 الدلالية', 'أنظمة CSS Grid و Flexbox', 'التصميم المتجاوب', 'معمارية Tailwind CSS'],
      },
      {
        titleEn: 'Module 02: JavaScript & TypeScript Mastery',
        titleAr: 'الوحدة 02: إتقان JavaScript و TypeScript',
        topicsEn: ['Async/Await & Fetch', 'DOM Architecture', 'TypeScript Interfaces & Generics', 'Clean Code Patterns'],
        topicsAr: ['البرمجة غير المتزامنة', 'التعامل مع DOM', 'الأنواع والواجهات في TypeScript', 'أنماط الكود النظيف'],
      },
      {
        titleEn: 'Module 03: Production React Engineering',
        titleAr: 'الوحدة 03: هندسة تطبيقات React الإنتاجية',
        topicsEn: ['Component Composition', 'Custom Hooks & Context', 'React Router & Protected Routes', 'Capstone Portfolio Project'],
        topicsAr: ['بناء المكونات القابلة لإعادة الاستخدام', 'الخطافات المخصصة وإدارة الحالة', 'التوجيه وحماية المسارات', 'مشروع التخرج التطبيقي'],
      },
    ],
    technologies: ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'TypeScript', 'React', 'Git'],
    faqs: [
      {
        questionEn: 'Do I need prior coding experience to join?',
        questionAr: 'هل أحتاج إلى خبرة برمجية مسبقة للانضمام؟',
        answerEn: 'No prior coding experience is required. We start from structured foundations and progress to production React engineering.',
        answerAr: 'لا يلزم وجود خبرة مسبقة؛ نبدأ من الأساسيات المنظمة ونتدرج حتى بناء تطبيقات React متكاملة.',
      },
      {
        questionEn: 'Will I receive a verified certificate upon completion?',
        questionAr: 'هل سأحصل على شهادة موثقة عند إتمام المسار؟',
        answerEn: 'Yes, graduates who complete the capstone project receive an official Syntax Academy certificate with a unique verification QR code.',
        answerAr: 'نعم، يحصل الخريجون بعد إتمام المشروع النهائي على شهادة رسمية من Syntax Academy برمز تحقق فريد.',
      },
    ],
    googleFormUrl: '',
    isPublished: true,
    applicationsOpen: true,
    isArchived: false,
  },
  {
    id: 'backend-development',
    slug: 'backend-development',
    category: 'programming',
    titleEn: 'Backend Development',
    titleAr: 'تطوير الأنظمة الخلفية (Backend)',
    descriptionEn:
      'Design scalable server architectures, RESTful APIs, authentication systems, and high-integrity databases with Node.js, Express, TypeScript, SQL/NoSQL modeling, and cloud security practices.',
    descriptionAr:
      'صمّم معمارية الخوادم القابلة للتوسع وواجهات برمجة التطبيقات وأنظمة المصادقة وقواعد البيانات الموثوقة باستخدام Node.js و Express و TypeScript ومعايير الأمان السحابي.',
    thumbnailUrl: '/src/assets/images/track_backend_dev_1794849467297.jpg',
    originalPrice: 4500,
    discountedPrice: 3500,
    durationEn: '14 Weeks · Server & Cloud Labs',
    durationAr: '14 أسبوعًا · مختبرات الخوادم والسحابة',
    instructorId: 'mohamed-ashraf',
    skills: ['Node.js & Express', 'TypeScript APIs', 'Database Modeling', 'Authentication & RBAC', 'Security Hardening', 'Cloud Deployment'],
    objectivesEn: [
      'Build modular, validated REST APIs using Node.js, Express, and TypeScript.',
      'Model relational and document databases with strict integrity constraints.',
      'Implement secure authentication, role-based access control, and rate limiting.',
      'Deploy and monitor backend services reliably in cloud environments.',
    ],
    objectivesAr: [
      'بناء واجهات برمجة تطبيقات معيارية ومحمية باستخدام Node.js و Express و TypeScript.',
      'تصميم قواعد البيانات العلائقية والمستندية مع ضمان تكامل البيانات.',
      'تطبيق أنظمة المصادقة الآمنة وصلاحيات الوصول وتحديد معدل الطلبات.',
      'نشر خدمات الخلفية ومراقبة أدائها في البيئات السحابية.',
    ],
    curriculum: [
      {
        titleEn: 'Module 01: Server Runtime & API Engineering',
        titleAr: 'الوحدة 01: بيئة الخادم وهندسة واجهات البرمجة',
        topicsEn: ['Node.js Internals', 'Express Middleware', 'Input Validation with Zod', 'Error Handling Architecture'],
        topicsAr: ['أساسيات Node.js', 'البرمجيات الوسيطة في Express', 'التحقق من المدخلات عبر Zod', 'معالجة الأخطاء المنهجية'],
      },
      {
        titleEn: 'Module 02: Databases & Security Engineering',
        titleAr: 'الوحدة 02: قواعد البيانات والهندسة الأمنية',
        topicsEn: ['PostgreSQL & Firestore', 'JWT & Session Cookies', 'RBAC & Security Rules', 'Rate Limiting & Audit Logs'],
        topicsAr: ['قواعد بيانات PostgreSQL و Firestore', 'الجلسات والرموز الآمنة', 'صلاحيات الأدوار وقواعد الحماية', 'تحديد المعدل وسجلات التدقيق'],
      },
    ],
    technologies: ['Node.js', 'Express', 'TypeScript', 'PostgreSQL', 'Firestore', 'Docker', 'REST'],
    faqs: [
      {
        questionEn: 'What projects will we build in Backend Development?',
        questionAr: 'ما المشاريع التي سنبنيها في مسار Backend؟',
        answerEn: 'You will build an authenticated multi-role API platform with database persistence, payment tracking hooks, and automated validation.',
        answerAr: 'ستبني منصة واجهات برمجية متعددة الصلاحيات مع قاعدة بيانات متكاملة وتحقق آلي وسجلات تدقيق.',
      },
    ],
    googleFormUrl: '',
    isPublished: true,
    applicationsOpen: true,
    isArchived: false,
  },
  {
    id: 'full-stack-development',
    slug: 'full-stack-development',
    category: 'programming',
    titleEn: 'Full Stack Development',
    titleAr: 'تطوير الويب المتكامل (Full Stack)',
    descriptionEn:
      'Complete end-to-end software engineering program uniting Frontend React/TypeScript mastery with Backend Node.js APIs, real-time databases, security architecture, and full cloud deployment.',
    descriptionAr:
      'برنامج هندسة برمجيات شامل يجمع بين إتقان الواجهات الأمامية باستخدام React و TypeScript وبناء الأنظمة الخلفية بـ Node.js وقواعد البيانات الفورية والأمان والنشر السحابي الكامل.',
    thumbnailUrl: '/src/assets/images/track_fullstack_dev_1794849468466.jpg',
    originalPrice: 6000,
    discountedPrice: 5000,
    durationEn: '24 Weeks · End-to-End Capstone',
    durationAr: '24 أسبوعًا · مشروع تخرج متكامل',
    instructorId: 'mohamed-ashraf',
    skills: ['Frontend React & TypeScript', 'Backend Node.js & APIs', 'Database Architecture', 'Firebase & Cloud', 'Security & Testing', 'Production Deployment'],
    objectivesEn: [
      'Architect complete full-stack web products from database schema to polished UI.',
      'Bridge frontend state seamlessly with secure backend endpoints and real-time listeners.',
      'Enforce zero-trust authorization, input sanitization, and automated testing workflows.',
      'Graduate with a production-deployed multi-user capstone platform.',
    ],
    objectivesAr: [
      'تصميم وبناء منتجات ويب متكاملة من مخطط قاعدة البيانات حتى واجهة المستخدم.',
      'ربط حالة الواجهة الأمامية بسلاسة مع نقاط النهاية الآمنة والتحديثات الفورية.',
      'تطبيق مبادئ الأمان الصارمة والتحقق من البيانات والاختبارات البرمجية.',
      'التخرج بمشروع تطبيقي متكامل ومنشور على السحابة.',
    ],
    curriculum: [
      {
        titleEn: 'Phase 01: Frontend Engineering & Design Systems',
        titleAr: 'المرحلة 01: هندسة الواجهات الأمامية وأنظمة التصميم',
        topicsEn: ['TypeScript & React 19', 'Tailwind CSS Architecture', 'Accessible UI Engineering'],
        topicsAr: ['TypeScript و React 19', 'معمارية Tailwind CSS', 'واجهات متجاوبة وسهلة الوصول'],
      },
      {
        titleEn: 'Phase 02: Backend APIs, Databases & Auth',
        titleAr: 'المرحلة 02: الخوادم وقواعد البيانات والمصادقة',
        topicsEn: ['Express & REST Architecture', 'Firestore & SQL Modeling', 'Security Rules & RBAC'],
        topicsAr: ['واجهات Express و REST', 'نمذجة Firestore و SQL', 'قواعد الأمان والصلاحيات'],
      },
      {
        titleEn: 'Phase 03: Real-World Capstone & Deployment',
        titleAr: 'المرحلة 03: المشروع النهائي والنشر الإنتاجي',
        topicsEn: ['Performance Profiling', 'End-to-End QA Testing', 'Cloud Production Release'],
        topicsAr: ['قياس وتحسين الأداء', 'اختبارات الجودة الشاملة', 'النشر الإنتاجي على السحابة'],
      },
    ],
    technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express', 'Firebase', 'PostgreSQL'],
    faqs: [
      {
        questionEn: 'Is Full Stack Development suitable for career switchers?',
        questionAr: 'هل مسار Full Stack مناسب للراغبين في التحول المهني؟',
        answerEn: 'Yes. The 24-week structured roadmap takes you step-by-step from fundamentals to shipping complete full-stack applications.',
        answerAr: 'نعم، تم تصميم المسار خلال 24 أسبوعًا ليأخذك خطوة بخطوة من الأساسيات حتى إطلاق تطبيقات متكاملة.',
      },
    ],
    googleFormUrl: '',
    isPublished: true,
    applicationsOpen: true,
    isArchived: false,
  },
  {
    id: 'microsoft-office',
    slug: 'microsoft-office',
    category: 'office',
    titleEn: 'Microsoft Office',
    titleAr: 'احتراف حزمة Microsoft Office',
    descriptionEn:
      'Practical executive mastery of Microsoft Word, Excel, PowerPoint, and Outlook. Learn dynamic formulas, PivotTables, automated reporting, polished presentations, and professional business documentation.',
    descriptionAr:
      'إتقان عملي واحترافي لبرامج Microsoft Word و Excel و PowerPoint و Outlook. تعلّم الدوال الديناميكية والجداول المحورية والتقارير الآلية والعروض التقديمية والمستندات المؤسسية.',
    thumbnailUrl: '/src/assets/images/track_microsoft_office_1794849467358.jpg',
    originalPrice: 1200,
    discountedPrice: 900,
    durationEn: '6 Weeks · Hands-On Business Labs',
    durationAr: '6 أسابيع · تطبيقات أعمال عملية',
    instructorId: 'malak-wael',
    skills: ['Microsoft Word', 'Advanced Excel & Formulas', 'PivotTables & Dashboards', 'PowerPoint Storytelling', 'Business Correspondence'],
    objectivesEn: [
      'Format structured corporate reports, contracts, and mail-merge workflows in Word.',
      'Build analytical workbooks using XLOOKUP, IF logic, PivotTables, and Excel charts.',
      'Design clear executive slide decks with visual hierarchy in PowerPoint.',
    ],
    objectivesAr: [
      'تنسيق التقارير المؤسسية والعقود ودمج المراسلات باحترافية في Word.',
      'بناء ملفات تحليل بيانات متقدمة باستخدام الدوال والجداول المحورية والرسوم البيانية في Excel.',
      'تصميم عروض تقديمية واضحة ومقنعة في PowerPoint.',
    ],
    curriculum: [
      {
        titleEn: 'Module 01: Professional Documentation (Word)',
        titleAr: 'الوحدة 01: المستندات الاحترافية (Word)',
        topicsEn: ['Styles & Templates', 'Tables & Table of Contents', 'Mail Merge & Review'],
        topicsAr: ['الأنماط والقوالب', 'الجداول والفهارس التلقائية', 'دمج المراسلات والمراجعة'],
      },
      {
        titleEn: 'Module 02: Data & Financial Modeling (Excel)',
        titleAr: 'الوحدة 02: تحليل البيانات والنمذجة (Excel)',
        topicsEn: ['Core & Lookup Functions', 'Conditional Formatting', 'PivotTables & Charts'],
        topicsAr: ['الدوال الأساسية والبحث', 'التنسيق الشرطي', 'الجداول المحورية ولوحات المؤشرات'],
      },
      {
        titleEn: 'Module 03: Executive Presentations (PowerPoint)',
        titleAr: 'الوحدة 03: العروض التنفيذية (PowerPoint)',
        topicsEn: ['Slide Master Architecture', 'Data Visualization Slides', 'Delivery Best Practices'],
        topicsAr: ['إعداد الشريحة الرئيسية', 'عرض البيانات بصريًا', 'أساسيات الإلقاء والعرض'],
      },
    ],
    technologies: ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Microsoft Outlook'],
    faqs: [
      {
        questionEn: 'Does this track include practical Excel templates?',
        questionAr: 'هل يشمل المسار قوالب عملية في Excel؟',
        answerEn: 'Yes, you will build real accounting sheets, KPI trackers, and business reports during live exercises.',
        answerAr: 'نعم، ستبني جداول محاسبية ولوحات متابعة أداء وتقارير عمل فعلية خلال التدريب.',
      },
    ],
    googleFormUrl: '',
    isPublished: true,
    applicationsOpen: true,
    isArchived: false,
  },
];

export const INITIAL_COURSES: Omit<Course, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'course-modern-react-ts',
    trackId: 'frontend-development',
    instructorId: 'omar-ashraf',
    titleEn: 'Modern React & TypeScript Architecture',
    titleAr: 'معمارية React الحديثة و TypeScript',
    descriptionEn:
      'Learn how to structure scalable React applications with strict TypeScript, reusable hooks, and responsive Tailwind CSS layouts.',
    descriptionAr:
      'تعلّم كيفية هيكلة تطبيقات React القابلة للتوسع باستخدام TypeScript الصارم والخطافات المخصصة وتخطيطات Tailwind CSS.',
    thumbnailUrl: '/src/assets/images/track_frontend_dev_1794849467820.jpg',
    previewVideoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    isPublished: true,
    isPublicPreview: true,
    isArchived: false,
  },
  {
    id: 'course-nodejs-api-security',
    trackId: 'backend-development',
    instructorId: 'mohamed-ashraf',
    titleEn: 'Production REST APIs & Auth Security',
    titleAr: 'واجهات برمجة التطبيقات الإنتاجية وأمان المصادقة',
    descriptionEn:
      'Step-by-step engineering of Express APIs with schema validation, role-based security, and database modeling.',
    descriptionAr:
      'بناء واجهات برمجية متكاملة باستخدام Express مع التحقق من المخططات وصلاحيات الوصول ونمذجة قواعد البيانات.',
    thumbnailUrl: '/src/assets/images/track_backend_dev_1794849467297.jpg',
    previewVideoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
    isPublished: true,
    isPublicPreview: true,
    isArchived: false,
  },
  {
    id: 'course-excel-analytics',
    trackId: 'microsoft-office',
    instructorId: 'malak-wael',
    titleEn: 'Executive Excel Formulas & Pivot Dashboards',
    titleAr: 'دوال Excel المتقدمة ولوحات Pivot المحورية',
    descriptionEn:
      'Turn raw business spreadsheets into clean, interactive KPI reports using XLOOKUP, PivotTables, and structured modeling.',
    descriptionAr:
      'حوّل جداول البيانات الخام إلى تقارير مؤشرات أداء تفاعلية باستخدام XLOOKUP والجداول المحورية والنمذجة المنظمة.',
    thumbnailUrl: '/src/assets/images/track_microsoft_office_1794849467358.jpg',
    previewVideoUrl: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
    isPublished: true,
    isPublicPreview: true,
    isArchived: false,
  },
];

export const INITIAL_LESSONS: Omit<Lesson, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'lesson-react-01',
    courseId: 'course-modern-react-ts',
    sectionTitleEn: 'Section 1: Core Foundations',
    sectionTitleAr: 'القسم 1: الأساسيات الجوهرية',
    titleEn: 'Component Thinking & TypeScript Props',
    titleAr: 'التفكير بالمكونات وخصائص TypeScript',
    descriptionEn: 'Understand clean component boundaries, prop interfaces, and strict type safety in React 19.',
    descriptionAr: 'فهم تقسيم المكونات النظيف وواجهات الخصائص وسلامة الأنواع في React 19.',
    videoUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    durationMinutes: 28,
    orderIndex: 1,
    isFreePreview: true,
  },
  {
    id: 'lesson-react-02',
    courseId: 'course-modern-react-ts',
    sectionTitleEn: 'Section 1: Core Foundations',
    sectionTitleAr: 'القسم 1: الأساسيات الجوهرية',
    titleEn: 'State Management & Custom Hooks',
    titleAr: 'إدارة الحالة والخطافات المخصصة',
    descriptionEn: 'Extract reusable business logic into well-typed custom React hooks.',
    descriptionAr: 'استخلاص منطق الأعمال القابل لإعادة الاستخدام في خطافات React مخصصة.',
    videoUrl: 'https://www.youtube.com/watch?v=TNhaISOUy6Q',
    durationMinutes: 34,
    orderIndex: 2,
    isFreePreview: false,
  },
  {
    id: 'lesson-node-01',
    courseId: 'course-nodejs-api-security',
    sectionTitleEn: 'Section 1: Express Architecture',
    sectionTitleAr: 'القسم 1: معمارية Express',
    titleEn: 'Routing, Middleware & Schema Validation',
    titleAr: 'التوجيه والبرمجيات الوسيطة والتحقق من البيانات',
    descriptionEn: 'Structure modular Express routers with strict Zod request validation.',
    descriptionAr: 'هيكلة مسارات Express بشكل معياري مع التحقق الصارم عبر Zod.',
    videoUrl: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
    durationMinutes: 32,
    orderIndex: 1,
    isFreePreview: true,
  },
  {
    id: 'lesson-excel-01',
    courseId: 'course-excel-analytics',
    sectionTitleEn: 'Section 1: Analytical Workflows',
    sectionTitleAr: 'القسم 1: تدفقات التحليل',
    titleEn: 'Dynamic Lookups & PivotTable Reporting',
    titleAr: 'البحث الديناميكي وتقارير الجداول المحورية',
    descriptionEn: 'Connect multi-sheet datasets cleanly and summarize KPIs in minutes.',
    descriptionAr: 'ربط جداول البيانات المتعددة وتلخيص مؤشرات الأداء بدقة وسرعة.',
    videoUrl: 'https://www.youtube.com/watch?v=Vl0H-qTclOg',
    durationMinutes: 25,
    orderIndex: 1,
    isFreePreview: true,
  },
];

export const INITIAL_TESTIMONIALS: Omit<Testimonial, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'testi-youssef-khalil',
    studentName: 'Youssef Khalil',
    trackName: 'Full Stack Development',
    quoteEn:
      'Before Syntax Academy I struggled to connect frontend code to real databases. After 24 weeks of guided labs, I shipped my capstone platform and landed a junior full-stack role.',
    quoteAr:
      'قبل Syntax Academy كنت أواجه صعوبة في ربط الواجهة الأمامية بقواعد البيانات الحقيقية. بعد 24 أسبوعًا من التطبيق العملي أنجزت مشروع التخرج وحصلت على وظيفتي الأولى كمطور Full Stack.',
    isApproved: true,
  },
  {
    id: 'testi-salma-tarek',
    studentName: 'Salma Tarek',
    trackName: 'Frontend Development',
    quoteEn:
      'The curriculum focuses on clean TypeScript and real-world engineering standards rather than toy tutorials. Code reviews from Omar completely transformed my portfolio.',
    quoteAr:
      'يركز المنهج على TypeScript النظيف ومعايير الهندسة الواقعية بدل الشروحات النظرية. مراجعات الكود مع م. عمر طوّرت معرض أعمالي بالكامل.',
    isApproved: true,
  },
  {
    id: 'testi-karim-nabil',
    studentName: 'Karim Nabil',
    trackName: 'Microsoft Office',
    quoteEn:
      'Malak made advanced Excel modeling and executive reporting crystal clear. I now automate our weekly operations dashboard in under ten minutes.',
    quoteAr:
      'جعلت م. ملك النمذجة المتقدمة في Excel وإعداد التقارير واضحًا ومباشرًا. أصبحتُ أُعدّ لوحة التقارير الأسبوعية لشركتي في أقل من عشر دقائق.',
    isApproved: true,
  },
];

export const INITIAL_ANNOUNCEMENTS: Omit<Announcement, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'ann-fall-cohorts-2026',
    titleEn: 'New Technical Cohorts Open for Applications',
    titleAr: 'فتح باب التقديم للدفعات التقنية الجديدة',
    bodyEn:
      'Applications are now open for Frontend Development, Backend Development, Full Stack Development, and Microsoft Office. Submit your application from your track page and watch your notifications for review updates.',
    bodyAr:
      'باب التقديم مفتوح الآن لمسارات تطوير الواجهات الأمامية والأنظمة الخلفية وتطوير الويب المتكامل وحزمة Microsoft Office. قدّم طلبك وتابع الإشعارات لمتابعة حالة القبول.',
    priority: 'important',
    isPublished: true,
  },
];

export const INITIAL_SETTINGS: Omit<AcademySettings, 'updatedAt'> = {
  id: 'global',
  academyName: 'Syntax Academy',
  logoUrl: '',
  contactPhone: '01012329975',
  contactEmail: 'syntaxacademy02@gmail.com',
  defaultLanguage: 'en',
  applicationsOpen: true,
  heroHeadlineEn: 'Build Your Future With Technology.',
  heroHeadlineAr: 'اصنع مستقبلك بالتكنولوجيا.',
  heroSubtitleEn:
    'Learn programming, develop real-world skills, and build your future with Syntax Academy.',
  heroSubtitleAr:
    'تعلّم البرمجة، طوّر مهاراتك العملية، وابنِ مستقبلك المهني مع Syntax Academy.',
  aboutTitleEn: 'Structured Engineering Education Built for Real Careers',
  aboutTitleAr: 'تعليم تقني منهجي مصمم لسوق العمل الحقيقي',
  aboutBodyEn:
    'Syntax Academy bridges the gap between academic theory and production software engineering. Through mentor-led tracks, hands-on code reviews, recorded lessons, and verified certifications, students graduate with measurable skills employers trust.',
  aboutBodyAr:
    'تعمل Syntax Academy على سد الفجوة بين الدراسة النظرية وهندسة البرمجيات الاحترافية. من خلال مسارات تدريبية منظمة، ومراجعات عملية، ودروس مسجلة، وشهادات موثقة برمز تحقق، يتخرج المتدرب بمهارات حقيقية يثق بها سوق العمل.',
  socialLinks: {
    facebook: 'https://www.facebook.com/share/p/19zaP2jGjx/',
    github: 'https://github.com/omarashra5',
    whatsapp: 'https://wa.me/201012329975',
  },
};

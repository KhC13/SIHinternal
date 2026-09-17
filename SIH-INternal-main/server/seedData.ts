import { query } from './db.js';
import { passwordService } from './passwordService.js';

export async function clearAllData() {
  try {
    await query(`
      TRUNCATE departments, startups, users, problem_statements, applications, pilots, procurements, contracts, scale_assessments, notifications, audit_logs CASCADE
    `);
    console.log('All tables truncated successfully.');
  } catch (err: any) {
    console.warn('TRUNCATE CASCADE fallback to DELETE:', err.message);
    const tables = [
      'audit_logs',
      'notifications',
      'scale_assessments',
      'contracts',
      'procurement_events',
      'procurements',
      'pilot_risks',
      'pilot_kpis',
      'pilot_milestones',
      'pilots',
      'evaluations',
      'evaluation_weights',
      'ai_matches',
      'application_documents',
      'applications',
      'problem_requirements',
      'problem_technologies',
      'problem_statements',
      'users',
      'startup_certifications',
      'startup_projects',
      'startup_sectors',
      'startup_technologies',
      'startups',
      'departments',
    ];

    for (const table of tables) {
      try {
        await query(`DELETE FROM ${table}`);
      } catch (e: any) {
        // ignore
      }
    }
  }
}

export async function seedDatabase(force = false) {
  try {
    const startupsCountRes = await query('SELECT COUNT(*) as count FROM startups');
    const problemsCountRes = await query('SELECT COUNT(*) as count FROM problem_statements');
    const sCount = parseInt(startupsCountRes.rows[0]?.count || '0', 10);
    const pCount = parseInt(problemsCountRes.rows[0]?.count || '0', 10);

    // If force is requested or we do not have our 4 demo startups and 3 demo problems, clear and reseed
    if (!force && sCount === 4 && pCount === 3) {
      console.log('Database already has clean demo dataset (4 startups, 3 problems). Skipping re-seed.');
      return;
    }

    console.log('Clearing database and populating concise, realistic InnovProcure demo dataset...');
    await clearAllData();

    const passwordHash = await passwordService.hash('InnovProcure@123');

    // 1. Core Departments (3 demo ministries)
    const departments = [
      {
        id: 'dept-01',
        name: 'Ministry of Housing & Urban Affairs - Smart Cities Mission',
        code: 'MOHUA-SCM',
        ministry: 'Ministry of Housing & Urban Affairs',
        description: 'Drives urban renewal, smart mobility, water conservation, and automated municipal infrastructure across 100 Smart Cities.',
        location: 'Nirman Bhawan, New Delhi',
        contact_email: 'smartcities@mohua.gov.in',
        contact_phone: '+91-11-23061200',
        active_problems_count: 2,
        pilots_count: 2,
        total_procurement_value: 44000000,
      },
      {
        id: 'dept-02',
        name: 'Ministry of Health & Family Welfare - National Digital Health Mission',
        code: 'MOHFW-NDHM',
        ministry: 'Ministry of Health & Family Welfare',
        description: 'Accelerates primary healthcare access, tele-diagnostics, and Ayushman Bharat Digital Mission (ABDM) integration in rural clinics.',
        location: 'Chanakyapuri, New Delhi',
        contact_email: 'ndhm-procure@mohfw.gov.in',
        contact_phone: '+91-11-23063513',
        active_problems_count: 1,
        pilots_count: 1,
        total_procurement_value: 30000000,
      },
      {
        id: 'dept-03',
        name: 'Ministry of Road Transport & Highways - National Highways Authority',
        code: 'MORTH-NHAI',
        ministry: 'Ministry of Road Transport & Highways',
        description: 'Spearheads high-speed electronic tolling, automated highway incident detection, and road safety vision systems.',
        location: 'Transport Bhawan, New Delhi',
        contact_email: 'innovation@morth.gov.in',
        contact_phone: '+91-11-23714938',
        active_problems_count: 0,
        pilots_count: 0,
        total_procurement_value: 18000000,
      },
    ];

    for (const d of departments) {
      await query(
        `INSERT INTO departments (id, name, code, ministry, description, location, contact_email, contact_phone, active_problems_count, pilots_count, total_procurement_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [d.id, d.name, d.code, d.ministry, d.description, d.location, d.contact_email, d.contact_phone, d.active_problems_count, d.pilots_count, d.total_procurement_value]
      );
    }

    // 2. Demo Startups (4 focused high-impact startups)
    const startupsData = [
      {
        id: 'startup-01',
        name: 'AetherAI Vision Systems',
        reg: 'U72900KA2021PTC145201',
        year: 2021,
        stage: 'Growth (Series A)',
        team: 38,
        funding: 42000000,
        loc: 'Bengaluru, Karnataka',
        web: 'https://aetherai.in',
        email: 'contact@aetherai.in',
        phone: '+91-80-49281100',
        desc: 'Edge-AI computer vision platform for real-time municipal traffic optimization, dynamic green corridors for ambulances, and incident detection.',
        pitch: 'Reduces peak traffic congestion by 28% and emergency response transit time from 18 minutes to under 7 minutes using existing CCTV feeds.',
        govExp: true,
        tech: ['Edge AI', 'Computer Vision', 'TensorRT', 'NVIDIA Jetson', 'Python', 'Kafka'],
        sectors: ['Smart Cities', 'Mobility', 'Public Safety'],
        projects: [
          { title: 'Bengaluru Smart Signal Pilot', client: 'Bengaluru Traffic Police', year: 2023, desc: 'Automated adaptive signal cycling across 16 major junctions.' },
        ],
        certs: [
          { name: 'ISO/IEC 27001:2013', body: 'TUV SUD', year: 2022 },
          { name: 'STQC Software Certification', body: 'MeitY India', year: 2023 },
        ],
      },
      {
        id: 'startup-02',
        name: 'JalDrishti Telemetry Labs',
        reg: 'U74999MH2020PTC338192',
        year: 2020,
        stage: 'Seed Funded',
        team: 24,
        funding: 18000000,
        loc: 'Pune, Maharashtra',
        web: 'https://jaldrishti.tech',
        email: 'info@jaldrishti.tech',
        phone: '+91-20-67192233',
        desc: 'Non-invasive acoustic IoT and ultrasonic pressure sensors detecting hidden pipeline leaks down to 0.5 liters/min in municipal potable water trunk lines.',
        pitch: 'Eliminated 1.25 million liters of daily non-revenue water loss across municipal pipelines through underground acoustic transient loggers.',
        govExp: true,
        tech: ['IoT Sensors', 'Acoustic Signal Processing', 'LoRaWAN', 'Time-Series ML', 'PostGIS'],
        sectors: ['Smart Cities', 'Clean Energy'],
        projects: [
          { title: 'Municipal NRW Reduction Trial', client: 'Pune Municipal Corporation', year: 2023, desc: 'Acoustic monitoring across 45 km potable water trunk lines.' },
        ],
        certs: [
          { name: 'C-DAC Evaluated IoT Core', body: 'C-DAC India', year: 2022 },
        ],
      },
      {
        id: 'startup-03',
        name: 'SwasthyaBandhu AI',
        reg: 'U85100DL2022PTC395114',
        year: 2022,
        stage: 'Seed Funded',
        team: 19,
        funding: 12500000,
        loc: 'New Delhi',
        web: 'https://swasthyabandhu.org',
        email: 'support@swasthyabandhu.org',
        phone: '+91-11-41098877',
        desc: 'Offline-first tablet tele-ophthalmology & vital triage system for rural ASHA workers and Ayushman Bharat Health & Wellness Centres.',
        pitch: 'Allows rural frontline healthcare workers to perform multi-point vital and retinal triage without active internet, syncing securely via ABDM FHIR.',
        govExp: true,
        tech: ['ABDM M2/M3 FHIR', 'Mobile Edge ML', 'Flutter', 'Offline Sync', 'WebRTC'],
        sectors: ['Healthcare', 'Digital Governance'],
        projects: [
          { title: 'Rural Tele-Triage in 30 HWCs', client: 'National Health Mission', year: 2024, desc: 'Screened 12,000 rural citizens for non-communicable diseases.' },
        ],
        certs: [
          { name: 'ABDM Sandbox Milestone 3 Certified', body: 'National Health Authority', year: 2023 },
        ],
      },
      {
        id: 'startup-04',
        name: 'KrishiDoot Geospatial',
        reg: 'U01409TG2021PTC151829',
        year: 2021,
        stage: 'Pre-Series A',
        team: 31,
        funding: 26000000,
        loc: 'Hyderabad, Telangana',
        web: 'https://krishidoot.io',
        email: 'partners@krishidoot.io',
        phone: '+91-40-23881900',
        desc: 'Hyper-local satellite SAR and multispectral imagery platform computing village-level soil moisture, pest indexes, and crop yield forecasting.',
        pitch: 'Delivers high-resolution agricultural analytics and micro-climate advisories in regional languages to over 250,000 smallholder farmers.',
        govExp: true,
        tech: ['Sentinel-2 SAR', 'GIS Mapping', 'Bhashini AI Speech', 'PostgreSQL', 'Python Geospatial'],
        sectors: ['Agriculture', 'Clean Energy', 'Digital Governance'],
        projects: [
          { title: 'District Soil Moisture Telemetry', client: 'Department of Agriculture Telangana', year: 2023, desc: 'Yield estimation and crop distress telemetry across 8 districts.' },
        ],
        certs: [
          { name: 'ISRO Geo-Intelligence Partner', body: 'NRSC ISRO', year: 2022 },
        ],
      },
    ];

    for (const st of startupsData) {
      await query(
        `INSERT INTO startups (id, company_name, registration_number, founded_year, stage, team_size, funding_total, location, website, contact_email, contact_phone, description, pitch_summary, previous_gov_experience)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [st.id, st.name, st.reg, st.year, st.stage, st.team, st.funding, st.loc, st.web, st.email, st.phone, st.desc, st.pitch, st.govExp]
      );

      for (const t of st.tech) {
        await query('INSERT INTO startup_technologies (id, startup_id, name) VALUES ($1, $2, $3)', [`tech-${st.id}-${t.replace(/[^a-zA-Z0-9]/g, '')}`, st.id, t]);
      }
      for (const s of st.sectors) {
        await query('INSERT INTO startup_sectors (id, startup_id, name) VALUES ($1, $2, $3)', [`sec-${st.id}-${s.replace(/[^a-zA-Z0-9]/g, '')}`, st.id, s]);
      }
      for (const p of st.projects) {
        await query('INSERT INTO startup_projects (id, startup_id, title, client, description, year) VALUES ($1, $2, $3, $4, $5, $6)',
          [`proj-${st.id}-${Math.random().toString(36).substr(2, 6)}`, st.id, p.title, p.client, p.desc, p.year]);
      }
      for (const c of st.certs) {
        await query('INSERT INTO startup_certifications (id, startup_id, name, issuing_body, year, valid_until) VALUES ($1, $2, $3, $4, $5, $6)',
          [`cert-${st.id}-${Math.random().toString(36).substr(2, 6)}`, st.id, c.name, c.body, c.year, '2027']);
      }
    }

    // 3. Demo Role-Based Users
    const usersData = [
      {
        id: 'user-admin',
        email: 'admin@innovprocure.gov.in',
        name: 'Dr. Rajeshwar Sharma, IAS',
        role: 'SUPER_ADMIN',
        deptId: 'dept-01',
        startupId: null,
        designation: 'Mission Director & Super Admin',
        phone: '+91-11-23061100',
      },
      {
        id: 'user-officer',
        email: 'officer@innovprocure.gov.in',
        name: 'Priyanka Verma',
        role: 'GOVERNMENT_OFFICER',
        deptId: 'dept-01',
        startupId: null,
        designation: 'Senior Innovation Lead, Smart Mobility',
        phone: '+91-11-23061144',
      },
      {
        id: 'user-evaluator',
        email: 'evaluator@innovprocure.gov.in',
        name: 'Prof. Anirudh Sen',
        role: 'EVALUATOR',
        deptId: 'dept-02',
        startupId: null,
        designation: 'Chair, Technical Evaluation Committee',
        phone: '+91-9811223344',
      },
      {
        id: 'user-startup',
        email: 'startup@innovprocure.com',
        name: 'Vikram Malhotra',
        role: 'STARTUP',
        deptId: null,
        startupId: 'startup-01',
        designation: 'Founder & Chief Product Officer',
        phone: '+91-9845012345',
      },
      {
        id: 'user-procurement',
        email: 'procurement@innovprocure.gov.in',
        name: 'Sunita Krishnan',
        role: 'PROCUREMENT_OFFICER',
        deptId: 'dept-03',
        startupId: null,
        designation: 'Chief Procurement Controller, GFR Compliance',
        phone: '+91-11-23714999',
      },
    ];

    for (const u of usersData) {
      await query(
        `INSERT INTO users (id, email, password_hash, name, role, department_id, startup_id, designation, phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [u.id, u.email, passwordHash, u.name, u.role, u.deptId, u.startupId, u.designation, u.phone]
      );
    }

    // 4. Demo Problem Statements (3 challenges)
    const problemsData = [
      {
        id: 'prob-01',
        code: 'MOHUA-2026-001',
        title: 'AI-Powered Adaptive Traffic Management & Emergency Green Corridor',
        desc: 'Arterial municipal corridors suffer acute congestion and ambulance transit delays. Seeking an edge-AI computer vision solution capable of real-time multi-camera vehicle classification, queue length estimation, and automatic dynamic traffic signal cycle adjustments with prioritized emergency green waves.',
        deptId: 'dept-01',
        sector: 'Smart Cities',
        loc: 'Bengaluru & Pune Metro Corridors',
        budget: 45000000,
        months: 6,
        impact: '30% reduction in peak wait times and emergency vehicle response delay reduced by 60%.',
        target: '3.5 million daily municipal commuters and emergency response ambulances.',
        status: 'ACTIVE',
        pubDate: '2026-01-10T00:00:00Z',
        tech: ['Edge AI', 'Computer Vision', 'TensorRT', 'Kafka', 'NVIDIA Jetson'],
        reqs: [
          { title: 'Low-Latency Video Inference', desc: '<150ms processing latency per CCTV camera feed.', mandatory: true },
          { title: 'Emergency Vehicle Acoustic/Optical Detection', desc: 'Auto-clear signal sequence upon emergency siren or optical beacon detection.', mandatory: true },
          { title: 'Offline Fail-Safe Resilience', desc: 'Fall back to standardized time-of-day signal sequencing if cloud/network is lost.', mandatory: true },
        ],
      },
      {
        id: 'prob-02',
        code: 'MOHFW-2026-002',
        title: 'Offline-First Diagnostic Tele-Triage in Rural Health Sub-Centres',
        desc: 'Rural primary health centres face intermittent broadband connectivity and lack specialist doctors for early non-communicable disease detection. Seeking an offline-first tablet diagnostic solution supporting multi-vital triage and tele-ophthalmology syncing securely via ABDM standards.',
        deptId: 'dept-02',
        sector: 'Healthcare',
        loc: 'National Rural Primary Care Sub-Centres',
        budget: 32000000,
        months: 6,
        impact: 'Enables screening of 25,000+ rural villagers per district without relying on uninterrupted broadband.',
        target: 'Frontline ASHA workers, ANMs, and rural population across aspirational districts.',
        status: 'ACTIVE',
        pubDate: '2026-01-15T00:00:00Z',
        tech: ['ABDM M2/M3 FHIR', 'Mobile Edge ML', 'Offline Sync', 'Flutter'],
        reqs: [
          { title: 'ABDM FHIR Compliance', desc: 'Seamless integration with Ayushman Bharat Health Account (ABHA) and FHIR standards.', mandatory: true },
          { title: 'Full Offline Operation', desc: 'Allow full diagnostic workflow without active 4G/internet connection.', mandatory: true },
          { title: 'Lightweight Hardware', desc: 'Operational on standard ruggedized government-issued Android tablets.', mandatory: true },
        ],
      },
      {
        id: 'prob-03',
        code: 'MOHUA-2026-003',
        title: 'Acoustic Ultrasonic Water Trunk Pipeline Leakage Telemetry',
        desc: 'Unaccounted non-revenue water loss in municipal supply lines exceeds 30% due to aging underground trunk infrastructure. Seeking non-invasive acoustic or pressure-transient sensors that detect and pinpoint micro-leaks without trench excavation.',
        deptId: 'dept-01',
        sector: 'Smart Cities',
        loc: 'Municipal Potable Trunk Distribution Lines',
        budget: 28000000,
        months: 4,
        impact: 'Pinpoint underground leakage down to 0.5L/min and eliminate 12+ million litres of potable water loss annually.',
        target: 'Urban Local Bodies and municipal water supply boards.',
        status: 'CLOSED',
        pubDate: '2025-10-01T00:00:00Z',
        tech: ['IoT Sensors', 'Acoustic Signal Processing', 'LoRaWAN', 'Time-Series ML'],
        reqs: [
          { title: 'Leak Detection Precision', desc: 'Triangulate underground leakage location within 2 meters accuracy.', mandatory: true },
          { title: 'Low Power Battery Life', desc: '5+ year autonomous battery operation for subterranean sensor loggers.', mandatory: true },
        ],
      },
    ];

    for (const p of problemsData) {
      await query(
        `INSERT INTO problem_statements (id, problem_code, title, description, department_id, sector, location, budget, timeline_months, expected_impact, target_beneficiaries, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [p.id, p.code, p.title, p.desc, p.deptId, p.sector, p.loc, p.budget, p.months, p.impact, p.target, p.status, p.pubDate]
      );

      for (const t of p.tech) {
        await query('INSERT INTO problem_technologies (id, problem_id, name) VALUES ($1, $2, $3)', [`ptech-${p.id}-${t.replace(/[^a-zA-Z0-9]/g, '')}`, p.id, t]);
      }
      for (const r of p.reqs) {
        await query('INSERT INTO problem_requirements (id, problem_id, title, description, is_mandatory) VALUES ($1, $2, $3, $4, $5)',
          [`preq-${p.id}-${Math.random().toString(36).substr(2, 6)}`, p.id, r.title, r.desc, r.mandatory]);
      }

      await query(
        `INSERT INTO evaluation_weights (id, problem_id, technical, innovation, feasibility, financial, scalability, impact, security, compliance)
         VALUES ($1, $2, 25, 15, 15, 10, 10, 15, 5, 5)`,
        [`ew-${p.id}`, p.id]
      );
    }

    // 5. Applications (3 demo submissions)
    const applicationsData = [
      {
        id: 'app-01',
        problemId: 'prob-01',
        startupId: 'startup-01',
        title: 'Edge-AI Adaptive Traffic Signal & Emergency Green Corridor Engine',
        techApproach: 'Deploys GPU-accelerated edge inference appliances at 16 key junctions. Processes 64 camera streams with TensorRT models, estimating vehicle queue lengths in real-time and communicating via MQTT to the central traffic controller.',
        implPlan: 'Month 1-2: Sensor mounting & calibration; Month 3-4: Local model fine-tuning and green wave protocol; Month 5-6: Live closed-loop pilot evaluation.',
        months: 6,
        budget: 42000000,
        impact: 'Measurable 28% reduction in corridor transit latency and immediate clear path routing for ambulances.',
        teamDetails: '12 dedicated computer vision and embedded systems engineers with prior deployment experience with state traffic authorities.',
        status: 'APPROVED',
        submittedAt: '2026-01-20T00:00:00Z',
        shortlistedAt: '2026-01-28T00:00:00Z',
      },
      {
        id: 'app-02',
        problemId: 'prob-02',
        startupId: 'startup-03',
        title: 'SwasthyaBandhu Offline ABDM-Certified Health Triage Tablet System',
        techApproach: 'Mobile Flutter architecture utilizing on-device lightweight TensorFlow Lite models for retinal diabetic retinopathy screening and vital risk triage. Stores FHIR bundles locally and synchronizes automatically whenever cellular connectivity is detected.',
        implPlan: 'Phase 1: ABDM sandbox credentialing; Phase 2: ASHA worker tablet training in 30 sub-centres; Phase 3: Longitudinal patient screening & validation.',
        months: 6,
        budget: 30000000,
        impact: 'Direct screening of over 20,000 rural citizens and 90% faster tele-consultation referral to district civil hospital.',
        teamDetails: '8 biomedical engineers, mobile developers, and certified clinical AI specialists.',
        status: 'UNDER_EVALUATION',
        submittedAt: '2026-02-05T00:00:00Z',
        shortlistedAt: '2026-02-14T00:00:00Z',
      },
      {
        id: 'app-03',
        problemId: 'prob-03',
        startupId: 'startup-02',
        title: 'JalDrishti Underground Acoustic Ultrasonic Leakage Monitoring',
        techApproach: 'Magnetic-mount acoustic transient loggers installed on valve points every 300 meters. Edge FFT signal processing distinguishes micro-fracture acoustic signatures from ambient vehicle rumble, transmitting alerts over LoRaWAN.',
        implPlan: '4-month deployment across 45km trunk lines, baseline sound print mapping, and pinpoint validation with ground-truth excavation.',
        months: 4,
        budget: 26000000,
        impact: 'Reduces non-revenue water loss by 18%, saving over 1.2 million liters daily.',
        teamDetails: '10 IoT hardware and acoustic signal engineers with C-DAC validated IP.',
        status: 'APPROVED',
        submittedAt: '2025-10-15T00:00:00Z',
        shortlistedAt: '2025-10-25T00:00:00Z',
      },
    ];

    for (const app of applicationsData) {
      await query(
        `INSERT INTO applications (id, problem_id, startup_id, proposal_title, technical_approach, implementation_plan, timeline_months, proposed_budget, expected_impact, team_details, status, submitted_at, shortlisted_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [app.id, app.problemId, app.startupId, app.title, app.techApproach, app.implPlan, app.months, app.budget, app.impact, app.teamDetails, app.status, app.submittedAt, app.shortlistedAt]
      );
    }

    // 6. Evaluations
    const evaluationsData = [
      {
        id: 'eval-01',
        appId: 'app-01',
        evalId: 'user-evaluator',
        techScore: 94,
        innovScore: 92,
        feasScore: 90,
        finScore: 88,
        scaleScore: 92,
        impactScore: 95,
        secScore: 90,
        compScore: 94,
        total: 92.5,
        comments: 'Strong edge architecture with robust on-device inference. Low latency meets high municipal safety standards. Recommended for pilot grant without reservations.',
      },
      {
        id: 'eval-02',
        appId: 'app-02',
        evalId: 'user-evaluator',
        techScore: 90,
        innovScore: 88,
        feasScore: 85,
        finScore: 86,
        scaleScore: 88,
        impactScore: 92,
        secScore: 88,
        compScore: 90,
        total: 88.5,
        comments: 'Well-designed offline-first FHIR bundle synchronization. Excellent fit for rural Primary Health Centres with limited telecom connectivity.',
      },
    ];

    for (const ev of evaluationsData) {
      await query(
        `INSERT INTO evaluations (id, application_id, evaluator_id, technical_score, innovation_score, feasibility_score, financial_score, scalability_score, impact_score, security_score, compliance_score, total_weighted_score, comments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [ev.id, ev.appId, ev.evalId, ev.techScore, ev.innovScore, ev.feasScore, ev.finScore, ev.scaleScore, ev.impactScore, ev.secScore, ev.compScore, ev.total, ev.comments]
      );
    }

    // 7. AI Matches
    const matchesData = [
      {
        id: 'match-01',
        probId: 'prob-01',
        startId: 'startup-01',
        score: 94.5,
        tScore: 96,
        sScore: 95,
        rScore: 94,
        eScore: 92,
        bScore: 93,
        lScore: 95,
        iScore: 96,
        expl: 'AetherAI matches all core criteria: Edge AI inference, CCTV stream processing, and proven experience with urban traffic management authorities.',
        strengths: ['Edge-AI TensorRT stack', 'Prior police pilot experience', 'STQC certified'],
        risks: ['Monsoon rain camera occlusion mitigation needed'],
        step: 'Fast-track pilot milestone authorization',
      },
      {
        id: 'match-02',
        probId: 'prob-02',
        startId: 'startup-03',
        score: 92.0,
        tScore: 93,
        sScore: 94,
        rScore: 91,
        eScore: 89,
        bScore: 92,
        lScore: 90,
        iScore: 94,
        expl: 'SwasthyaBandhu matches rural digital health criteria with certified ABDM FHIR integration and offline mobile ML models.',
        strengths: ['ABDM Sandbox certified', 'Offline ML capability', 'Frontline ASHA UI design'],
        risks: ['Requires ruggedized tablet battery testing in high ambient heat'],
        step: 'Advance to formal committee review',
      },
      {
        id: 'match-03',
        probId: 'prob-03',
        startId: 'startup-02',
        score: 96.0,
        tScore: 97,
        sScore: 96,
        rScore: 96,
        eScore: 95,
        bScore: 95,
        lScore: 94,
        iScore: 98,
        expl: 'JalDrishti has specialized acoustic IoT hardware specifically designed for municipal non-revenue water trunk leakage detection.',
        strengths: ['Underground acoustic sensing', 'C-DAC verified core', 'Demonstrated water loss reduction'],
        risks: ['Requires LoRaWAN gateway coverage validation in underground manholes'],
        step: 'Direct transition to scale commercialization',
      },
      {
        id: 'match-04',
        probId: 'prob-01',
        startId: 'startup-04',
        score: 76.5,
        tScore: 78,
        sScore: 75,
        rScore: 74,
        eScore: 76,
        bScore: 78,
        lScore: 80,
        iScore: 78,
        expl: 'KrishiDoot has strong GIS spatial mapping capabilities that could assist in macro urban road geometry, but lacks real-time edge CCTV computer vision.',
        strengths: ['Geospatial analytics', 'High-accuracy satellite SAR'],
        risks: ['Lacks edge video inferencing for signal cycle sequencing'],
        step: 'Secondary match for macro urban planning',
      },
    ];

    for (const m of matchesData) {
      await query(
        `INSERT INTO ai_matches (id, problem_id, startup_id, overall_score, technology_score, sector_score, requirement_score, experience_score, budget_fit_score, location_fit_score, impact_potential_score, match_explanation, strengths, potential_risks, recommended_next_step)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [m.id, m.probId, m.startId, m.score, m.tScore, m.sScore, m.rScore, m.eScore, m.bScore, m.lScore, m.iScore, m.expl, JSON.stringify(m.strengths), JSON.stringify(m.risks), m.step]
      );
    }

    // 8. Pilots (2 demo pilots: 1 Active, 1 Completed & Scale-Ready)
    const pilotsData = [
      {
        id: 'pilot-01',
        appId: 'app-01',
        probId: 'prob-01',
        startId: 'startup-01',
        deptId: 'dept-01',
        title: 'Bengaluru Corridor Real-Time Adaptive Traffic Vision Pilot',
        objectives: 'Validate edge-AI computer vision across 16 high-density junctions to reduce peak transit delays and establish automated emergency green waves.',
        outcomes: 'Demonstrated 28% wait time reduction, emergency response corridor activation under 10 seconds, and zero signal controller crashes over 90 days.',
        budget: 42000000,
        start: '2026-02-01T00:00:00Z',
        end: '2026-07-31T00:00:00Z',
        status: 'ACTIVE',
        comp: 65,
        readinessScore: 88.5,
        milestones: [
          { title: 'Edge Hardware & CCTV Camera Calibration', desc: 'Mount 64 edge cameras and configure local GPU units across 16 junctions.', due: '2026-02-28T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'AetherAI Hardware Ops' },
          { title: 'Model Optimization & Local Traffic Fine-Tuning', desc: 'Train local queue detection models to recognize mixed traffic (two-wheelers, autos, buses).', due: '2026-04-15T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'AetherAI ML Team' },
          { title: 'Emergency Vehicle Green Wave Integration', desc: 'Interface with ambulance GPS dispatcher to automatically trigger dynamic green corridors.', due: '2026-05-31T00:00:00Z', status: 'IN_PROGRESS', comp: 60, owner: 'Joint MoHUA & Startup Team' },
          { title: 'Corridor-Wide Synchronized Validation', desc: 'Continuous 30-day autonomous live evaluation and independent traffic police audit.', due: '2026-07-15T00:00:00Z', status: 'PENDING', comp: 0, owner: 'Traffic Police & Evaluation Board' },
        ],
        kpis: [
          { name: 'Junction Wait Time', unit: 'minutes', base: 18.0, target: 8.0, current: 9.5, status: 'ON_TRACK', trend: 'DOWN' },
          { name: 'Ambulance Transit Delay', unit: 'minutes', base: 22.0, target: 6.0, current: 7.2, status: 'ON_TRACK', trend: 'DOWN' },
          { name: 'Vehicle Classification Accuracy', unit: '%', base: 70.0, target: 95.0, current: 93.8, status: 'ON_TRACK', trend: 'UP' },
        ],
        risks: [
          { title: 'Monsoon heavy downpour lens occlusion', severity: 'MEDIUM', prob: 'LOW', mitigation: 'Hydrophobic coating applied to all camera housing lenses; optical alert triggered if wiper is required.', owner: 'AetherAI Field Team', status: 'MITIGATED' },
        ],
      },
      {
        id: 'pilot-02',
        appId: 'app-03',
        probId: 'prob-03',
        startId: 'startup-02',
        deptId: 'dept-01',
        title: 'Municipal Potable Water Acoustic Leak Detection & NRW Reduction',
        objectives: 'Detect and triangulate subterranean water trunk pipeline leakages using non-invasive acoustic sensors, verifying water conservation and operational feasibility.',
        outcomes: 'Successfully surveyed 45 km of pipeline, discovered 34 hidden subsurface micro-leaks, and reduced non-revenue water loss by 17.5% saving 1.25M liters daily.',
        budget: 26000000,
        start: '2025-11-01T00:00:00Z',
        end: '2026-03-01T00:00:00Z',
        status: 'COMPLETED',
        comp: 100,
        readinessScore: 94.2,
        milestones: [
          { title: 'Acoustic Logger Installation across 45km trunk lines', desc: 'Installed 150 magnetic ultrasonic sensors at valve access points.', due: '2025-11-30T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'JalDrishti Ops' },
          { title: 'Baseline Hydro-Acoustic Profiling', desc: 'Calibrate normal flow acoustic signatures against ambient road vibration.', due: '2025-12-31T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'JalDrishti Data Team' },
          { title: 'Live Leakage Pinpointing & Excavation Verification', desc: 'Target 30 suspected points and verify ground truth with municipal repair squads.', due: '2026-01-31T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'Joint Municipal Water Wing' },
          { title: 'Final NRW Audit & Water Balance Assessment', desc: 'Conduct independent hydraulic flow verification and financial savings report.', due: '2026-02-28T00:00:00Z', status: 'COMPLETED', comp: 100, owner: 'Third-Party Water Auditor' },
        ],
        kpis: [
          { name: 'Leak Triangulation Accuracy', unit: 'meters', base: 50.0, target: 2.0, current: 1.8, status: 'ACHIEVED', trend: 'DOWN' },
          { name: 'Non-Revenue Water Loss', unit: '%', base: 34.0, target: 18.0, current: 16.5, status: 'ACHIEVED', trend: 'DOWN' },
          { name: 'Daily Water Conserved', unit: 'Liters', base: 0, target: 1000000, current: 1250000, status: 'ACHIEVED', trend: 'UP' },
        ],
        risks: [
          { title: 'Sensor battery exhaustion in high vibration nodes', severity: 'LOW', prob: 'LOW', mitigation: 'Power optimization firmware installed; battery cycle extended to 6+ years.', owner: 'JalDrishti Engineering', status: 'RESOLVED' },
        ],
      },
    ];

    for (const p of pilotsData) {
      await query(
        `INSERT INTO pilots (id, application_id, problem_id, startup_id, department_id, title, objectives, expected_outcomes, budget, start_date, end_date, status, completion_percentage, scale_readiness_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [p.id, p.appId, p.probId, p.startId, p.deptId, p.title, p.objectives, p.outcomes, p.budget, p.start, p.end, p.status, p.comp, p.readinessScore]
      );

      for (const m of p.milestones) {
        await query(
          `INSERT INTO pilot_milestones (id, pilot_id, title, description, due_date, status, completion_percentage, owner)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [`pm-${p.id}-${Math.random().toString(36).substr(2, 6)}`, p.id, m.title, m.desc, m.due, m.status, m.comp, m.owner]
        );
      }

      for (const k of p.kpis) {
        await query(
          `INSERT INTO pilot_kpis (id, pilot_id, name, metric_unit, baseline_value, target_value, current_value, status, trend)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [`pkpi-${p.id}-${Math.random().toString(36).substr(2, 6)}`, p.id, k.name, k.unit, k.base, k.target, k.current, k.status, k.trend]
        );
      }

      for (const r of p.risks) {
        await query(
          `INSERT INTO pilot_risks (id, pilot_id, title, severity, probability, mitigation, owner, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [`prisk-${p.id}-${Math.random().toString(36).substr(2, 6)}`, p.id, r.title, r.severity, r.prob, r.mitigation, r.owner, r.status]
        );
      }
    }

    // 9. Scale Assessment (1 detailed evaluation for pilot-02)
    const scaleRecommendations = {
      procurement_method: 'GFR Rule 194 (Single-Source Innovation Commercialization)',
      estimated_budget: 18000000,
      implementation_timeline_months: 12,
      risk_mitigation_plan: 'Phase deployments in 50km tranches with milestone-based payment holdback.',
      capacity_building: 'Training 20 municipal water engineers on cloud telemetry analytics.',
    };

    await query(
      `INSERT INTO scale_assessments (id, pilot_id, impact_score, technical_readiness_score, operational_readiness_score, financial_sustainability_score, user_adoption_score, security_score, compliance_score, scalability_score, overall_score, readiness_level, summary, recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        'scale-01',
        'pilot-02',
        96.0,
        95.0,
        92.0,
        94.0,
        91.0,
        98.0,
        95.0,
        93.0,
        94.25,
        'SCALE_READY',
        'The pilot successfully achieved all hydraulic benchmarks across 45km municipal pipeline, saving 1.25M liters of water daily. Technical readiness validated at TRL-9 with C-DAC verification. Recommended for single-source transition under GFR 194.',
        JSON.stringify(scaleRecommendations),
      ]
    );

    // 10. Procurement Pipeline (2 demo items: 1 Awarded Contract, 1 in Commercial RFP)
    const procurementsData = [
      {
        id: 'proc-01',
        pilotId: 'pilot-02',
        probId: 'prob-03',
        startId: 'startup-02',
        deptId: 'dept-01',
        title: 'City-Wide Municipal Potable Water Acoustic Telemetry Rollout',
        estVal: 18000000,
        apprVal: 18000000,
        stage: 'CONTRACT_AWARDED',
        officerId: 'user-procurement',
        targetDate: '2026-04-30T00:00:00Z',
        status: 'ACTIVE',
        events: [
          { from: 'PILOT_SUCCESS', to: 'GFR_JUSTIFICATION', notes: 'Pilot achieved 94.2% scale score; GFR Rule 194 single-source justification filed.', actor: 'user-officer' },
          { from: 'GFR_JUSTIFICATION', to: 'COMMERCIAL_RFP', notes: 'Procurement Committee approved commercial terms and SLA schedule.', actor: 'user-procurement' },
          { from: 'COMMERCIAL_RFP', to: 'CONTRACT_AWARDED', notes: 'Master service contract awarded to JalDrishti Telemetry Labs.', actor: 'user-admin' },
        ],
      },
      {
        id: 'proc-02',
        pilotId: 'pilot-01',
        probId: 'prob-01',
        startId: 'startup-01',
        deptId: 'dept-01',
        title: 'Municipal Smart Corridors Edge-AI Adaptive Traffic Expansion',
        estVal: 42000000,
        apprVal: 42000000,
        stage: 'COMMERCIAL_RFP',
        officerId: 'user-procurement',
        targetDate: '2026-08-31T00:00:00Z',
        status: 'ACTIVE',
        events: [
          { from: 'PILOT_SUCCESS', to: 'GFR_JUSTIFICATION', notes: 'Mid-term pilot validation verified 28% delay reduction; commercial scale preparation initiated.', actor: 'user-officer' },
          { from: 'GFR_JUSTIFICATION', to: 'COMMERCIAL_RFP', notes: 'Draft RFP specifications prepared for 40-junction corridor expansion.', actor: 'user-procurement' },
        ],
      },
    ];

    for (const pr of procurementsData) {
      await query(
        `INSERT INTO procurements (id, pilot_id, problem_id, startup_id, department_id, title, estimated_value, approved_budget, current_stage, procurement_officer_id, target_completion_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [pr.id, pr.pilotId, pr.probId, pr.startId, pr.deptId, pr.title, pr.estVal, pr.apprVal, pr.stage, pr.officerId, pr.targetDate, pr.status]
      );

      for (const ev of pr.events) {
        await query(
          `INSERT INTO procurement_events (id, procurement_id, from_stage, to_stage, notes, actor_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [`pevt-${pr.id}-${Math.random().toString(36).substr(2, 6)}`, pr.id, ev.from, ev.to, ev.notes, ev.actor]
        );
      }
    }

    // 11. Contracts (1 awarded contract for proc-01)
    await query(
      `INSERT INTO contracts (id, procurement_id, contract_number, startup_id, department_id, start_date, end_date, contract_value, terms, status, document_url, signed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        'contract-01',
        'proc-01',
        'INP-CON-2026-001',
        'startup-02',
        'dept-01',
        '2026-04-01T00:00:00Z',
        '2027-03-31T00:00:00Z',
        18000000,
        'Full city-wide municipal potable water acoustic monitoring across 150 km distribution pipelines with 98% telemetry SLA uptime guarantee and quarterly NRW audits.',
        'ACTIVE',
        '/uploads/contract-INP-CON-2026-001.pdf',
        '2026-04-02T10:30:00Z',
      ]
    );

    // 12. Clean Notifications
    const notificationsData = [
      {
        id: 'notif-01',
        userId: 'user-admin',
        role: 'SUPER_ADMIN',
        title: 'Scale Commercialization Approved',
        msg: 'Contract INP-CON-2026-001 for JalDrishti Telemetry Labs successfully signed under GFR 194.',
        link: '/procurement',
      },
      {
        id: 'notif-02',
        userId: 'user-officer',
        role: 'GOVERNMENT_OFFICER',
        title: 'Pilot Milestone Progress: 65%',
        msg: 'AetherAI Vision Systems completed milestone 2 for Bengaluru adaptive traffic corridor.',
        link: '/pilots',
      },
      {
        id: 'notif-03',
        userId: 'user-startup',
        role: 'STARTUP',
        title: 'Proposal Status: Approved',
        msg: 'Your proposal for Adaptive Traffic Management has advanced to the pilot phase.',
        link: '/pilots',
      },
    ];

    for (const n of notificationsData) {
      await query(
        `INSERT INTO notifications (id, user_id, role, title, message, link, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, false)`,
        [n.id, n.userId, n.role, n.title, n.msg, n.link]
      );
    }

    // 13. Clean Initial Audit Logs
    const auditLogs = [
      { action: 'CONTRACT_AWARDED', entity: 'Contract', entityId: 'contract-01', email: 'admin@innovprocure.gov.in', meta: { value: 18000000, rule: 'GFR 194' } },
      { action: 'SCALE_ASSESSMENT_COMPLETED', entity: 'ScaleAssessment', entityId: 'scale-01', email: 'officer@innovprocure.gov.in', meta: { score: 94.25, level: 'SCALE_READY' } },
      { action: 'PILOT_MILESTONE_UPDATED', entity: 'Pilot', entityId: 'pilot-01', email: 'officer@innovprocure.gov.in', meta: { progress: 65 } },
      { action: 'APPLICATION_APPROVED', entity: 'Application', entityId: 'app-01', email: 'evaluator@innovprocure.gov.in', meta: { score: 92.5 } },
      { action: 'PROBLEM_PUBLISHED', entity: 'ProblemStatement', entityId: 'prob-01', email: 'officer@innovprocure.gov.in', meta: { budget: 45000000 } },
    ];

    for (const l of auditLogs) {
      await query(
        `INSERT INTO audit_logs (id, user_email, action, entity, entity_id, metadata, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, '127.0.0.1')`,
        [`audit-${Math.random().toString(36).substr(2, 9)}`, l.email, l.action, l.entity, l.entityId, JSON.stringify(l.meta)]
      );
    }

    console.log('Concise InnovProcure demo dataset populated successfully.');
  } catch (err: any) {
    console.error('Error seeding demo data:', err);
    throw err;
  }
}

// Backward compatibility alias
export async function seedDatabaseIfEmpty() {
  await seedDatabase(false);
}

export async function resetDatabaseToDemo() {
  await seedDatabase(true);
}

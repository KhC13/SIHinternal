import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query, withTransaction } from './db.js';
import { passwordService } from './passwordService.js';
import {
  AuthRequest,
  authMiddleware,
  optionalAuthMiddleware,
  requireRoles,
  generateToken,
  logAudit,
  createNotification,
} from './middleware.js';
import { matchProblemAndStartup } from './aiMatcher.js';
import { resetDatabaseToDemo } from './seedData.js';

export const router = Router();

// Configure local uploads folder
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

/* =========================================================================
   1. AUTHENTICATION & DEMO USERS
   ========================================================================= */

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = userRes.rows[0];
    const isMatch = await passwordService.verify(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const tokenUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.department_id,
      startupId: user.startup_id,
    };
    const token = generateToken(tokenUser);

    await logAudit(tokenUser, 'USER_LOGIN', 'User', user.id, { email: user.email }, req.ip);

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.department_id,
        startupId: user.startup_id,
        designation: user.designation,
        phone: user.phone,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login: ' + err.message });
  }
});

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, role, departmentId, startupId, designation, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await passwordService.hash(password);
    const userId = `user-${Date.now()}`;
    const userRole = role || 'STARTUP';

    await query(
      `INSERT INTO users (id, email, password_hash, name, role, department_id, startup_id, designation, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, email.trim().toLowerCase(), passwordHash, name.trim(), userRole, departmentId || null, startupId || null, designation || '', phone || '']
    );

    const tokenUser = {
      id: userId,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: userRole,
      departmentId: departmentId || null,
      startupId: startupId || null,
    };
    const token = generateToken(tokenUser);

    await logAudit(tokenUser, 'USER_REGISTER', 'User', userId, { email, role: userRole }, req.ip);

    return res.status(201).json({
      token,
      user: tokenUser,
    });
  } catch (err: any) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.post('/auth/logout', (_req, res) => {
  return res.json({ message: 'Logged out successfully.' });
});

router.get('/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userRes = await query('SELECT id, email, name, role, department_id, startup_id, designation, phone, avatar_url FROM users WHERE id = $1', [req.user!.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = userRes.rows[0];
    return res.json({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      departmentId: u.department_id,
      startupId: u.startup_id,
      designation: u.designation,
      phone: u.phone,
      avatarUrl: u.avatar_url,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/auth/rbac-matrix', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  const currentRole = req.user?.role || 'GUEST';

  const matrix = {
    currentRole,
    roles: [
      {
        role: 'SUPER_ADMIN',
        title: 'Mission Director / Super Administrator',
        description: 'Complete operational and statutory oversight across all ministries, challenges, pilots, and GFR 194 procurement approvals.',
        gfrAuthority: 'Full Statutory & Delegated Constitutional Authority',
        color: 'indigo',
        canPostProblems: true,
        canSubmitApplications: true,
        canEvaluate: true,
        canShortlist: true,
        canCreatePilots: true,
        canUpdateKPIs: true,
        canApproveScale: true,
        canManageProcurement: true,
        canAwardContracts: true,
        canViewAuditLogs: true,
        canResetSystem: true,
      },
      {
        role: 'GOVERNMENT_OFFICER',
        title: 'Government Innovation Officer',
        description: 'Drafts departmental challenges, initiates AI compatibility matching, shortlists qualified startup proposals, and commissions pilots.',
        gfrAuthority: 'Sanctioning Officer (GFR Rules 130 / 149 / 194)',
        color: 'emerald',
        canPostProblems: true,
        canSubmitApplications: false,
        canEvaluate: false,
        canShortlist: true,
        canCreatePilots: true,
        canUpdateKPIs: true,
        canApproveScale: true,
        canManageProcurement: false,
        canAwardContracts: false,
        canViewAuditLogs: false,
        canResetSystem: false,
      },
      {
        role: 'EVALUATOR',
        title: 'Technical Evaluation Panel Chair',
        description: 'Independent domain specialist evaluating blind proposals against 8 weighted criteria (technology, scalability, security, impact).',
        gfrAuthority: 'Independent Technical Vetting Chair (GFR Rule 173)',
        color: 'purple',
        canPostProblems: false,
        canSubmitApplications: false,
        canEvaluate: true,
        canShortlist: false,
        canCreatePilots: false,
        canUpdateKPIs: false,
        canApproveScale: false,
        canManageProcurement: false,
        canAwardContracts: false,
        canViewAuditLogs: false,
        canResetSystem: false,
      },
      {
        role: 'STARTUP',
        title: 'Startup Founder / Innovation Vendor',
        description: 'Explores public challenges, submits detailed technical proposals, and logs real-time milestone deliverables and KPI telemetry.',
        gfrAuthority: 'Empaneled DPIIT-Recognized Innovation Vendor',
        color: 'amber',
        canPostProblems: false,
        canSubmitApplications: true,
        canEvaluate: false,
        canShortlist: false,
        canCreatePilots: false,
        canUpdateKPIs: true,
        canApproveScale: false,
        canManageProcurement: false,
        canAwardContracts: false,
        canViewAuditLogs: false,
        canResetSystem: false,
      },
      {
        role: 'PROCUREMENT_OFFICER',
        title: 'Chief Procurement Controller',
        description: 'Directs GFR Rule 194 scale commercialization, non-competitive innovation exemption files, negotiations, and formal contract awards.',
        gfrAuthority: 'Competent Financial Authority / Procurement Head',
        color: 'blue',
        canPostProblems: false,
        canSubmitApplications: false,
        canEvaluate: false,
        canShortlist: false,
        canCreatePilots: false,
        canUpdateKPIs: true,
        canApproveScale: true,
        canManageProcurement: true,
        canAwardContracts: true,
        canViewAuditLogs: false,
        canResetSystem: false,
      },
    ],
  };

  return res.json(matrix);
});

router.get('/auth/demo-users', async (_req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.name, u.role, u.department_id, u.startup_id, u.designation,
             d.name as department_name, s.company_name as startup_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN startups s ON u.startup_id = s.id
      ORDER BY u.role, u.name
    `);
    return res.json({ users: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   2. PROBLEM STATEMENTS
   ========================================================================= */

router.get('/problems', async (req, res) => {
  try {
    const { search, sector, departmentId, status, sortBy = 'created_at', order = 'DESC' } = req.query;

    let sql = `
      SELECT p.*, d.name as department_name, d.code as department_code,
        (SELECT COUNT(*) FROM applications a WHERE a.problem_id = p.id) as applications_count,
        (SELECT COUNT(*) FROM ai_matches m WHERE m.problem_id = p.id) as matches_count
      FROM problem_statements p
      LEFT JOIN departments d ON p.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (LOWER(p.title) LIKE LOWER($${params.length}) OR LOWER(p.description) LIKE LOWER($${params.length}) OR LOWER(p.problem_code) LIKE LOWER($${params.length}))`;
    }
    if (sector) {
      params.push(sector);
      sql += ` AND p.sector = $${params.length}`;
    }
    if (departmentId) {
      params.push(departmentId);
      sql += ` AND p.department_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }

    const safeSort = ['created_at', 'budget', 'title', 'status'].includes(sortBy as string) ? sortBy : 'created_at';
    const safeOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY p.${safeSort} ${safeOrder}`;

    const result = await query(sql, params);

    // Fetch technologies for each problem
    const problemsWithMeta = await Promise.all(
      result.rows.map(async (prob) => {
        const techRes = await query('SELECT name FROM problem_technologies WHERE problem_id = $1', [prob.id]);
        return {
          ...prob,
          technologies: techRes.rows.map((t) => t.name),
        };
      })
    );

    return res.json({ problems: problemsWithMeta, total: problemsWithMeta.length });
  } catch (err: any) {
    console.error('Error fetching problems:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.get('/problems/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const probRes = await query(
      `SELECT p.*, d.name as department_name, d.code as department_code, d.ministry as department_ministry, d.location as department_location
       FROM problem_statements p
       LEFT JOIN departments d ON p.department_id = d.id
       WHERE p.id = $1`,
      [id]
    );

    if (probRes.rows.length === 0) {
      return res.status(404).json({ error: 'Problem statement not found' });
    }

    const problem = probRes.rows[0];

    const [techRes, reqRes, weightRes, appsRes, matchesRes] = await Promise.all([
      query('SELECT id, name FROM problem_technologies WHERE problem_id = $1', [id]),
      query('SELECT id, title, description, is_mandatory FROM problem_requirements WHERE problem_id = $1', [id]),
      query('SELECT * FROM evaluation_weights WHERE problem_id = $1', [id]),
      query(
        `SELECT a.*, s.company_name, s.stage as startup_stage, s.location as startup_location, s.funding_total,
          (SELECT total_weighted_score FROM evaluations e WHERE e.application_id = a.id LIMIT 1) as evaluation_score
         FROM applications a
         LEFT JOIN startups s ON a.startup_id = s.id
         WHERE a.problem_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      ),
      query(
        `SELECT m.*, s.company_name, s.stage, s.location, s.funding_total, s.team_size
         FROM ai_matches m
         LEFT JOIN startups s ON m.startup_id = s.id
         WHERE m.problem_id = $1
         ORDER BY m.overall_score DESC`,
        [id]
      ),
    ]);

    return res.json({
      problem: {
        ...problem,
        technologies: techRes.rows.map((t) => t.name),
        requirements: reqRes.rows,
        weights: weightRes.rows[0] || null,
        applications: appsRes.rows,
        matches: matchesRes.rows,
      },
    });
  } catch (err: any) {
    console.error('Error getting problem detail:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/problems', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      departmentId,
      sector,
      location,
      budget,
      timelineMonths,
      expectedImpact,
      targetBeneficiaries,
      requirements = [],
      technologies = [],
      weights = {},
      status = 'DRAFT',
    } = req.body;

    if (!title || !description || !departmentId || !sector || !budget) {
      return res.status(400).json({ error: 'Title, description, department, sector, and budget are required.' });
    }

    const probId = `prob-${Date.now()}`;
    const code = `GOV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    await withTransaction(async ({ query }) => {
      await query(
        `INSERT INTO problem_statements (id, problem_code, title, description, department_id, sector, location, budget, timeline_months, expected_impact, target_beneficiaries, status, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          probId,
          code,
          title,
          description,
          departmentId,
          sector,
          location || 'Pan-India',
          parseFloat(budget),
          parseInt(timelineMonths || '6', 10),
          expectedImpact || '',
          targetBeneficiaries || '',
          status,
          status === 'PUBLISHED' ? new Date().toISOString() : null,
        ]
      );

      // Add technologies
      for (const t of technologies) {
        if (t.trim()) {
          await query('INSERT INTO problem_technologies (id, problem_id, name) VALUES ($1, $2, $3)', [
            `ptech-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            probId,
            t.trim(),
          ]);
        }
      }

      // Add requirements
      for (const r of requirements) {
        if (r.title) {
          await query(
            'INSERT INTO problem_requirements (id, problem_id, title, description, is_mandatory) VALUES ($1, $2, $3, $4, $5)',
            [
              `preq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              probId,
              r.title,
              r.description || '',
              r.isMandatory !== false,
            ]
          );
        }
      }

      // Add evaluation weights
      await query(
        `INSERT INTO evaluation_weights (id, problem_id, technical, innovation, feasibility, financial, scalability, impact, security, compliance)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          `weight-${probId}`,
          probId,
          weights.technical || 20,
          weights.innovation || 15,
          weights.feasibility || 15,
          weights.financial || 10,
          weights.scalability || 10,
          weights.impact || 15,
          weights.security || 5,
          weights.compliance || 10,
        ]
      );

      // Update department active problems count
      await query('UPDATE departments SET active_problems_count = active_problems_count + 1 WHERE id = $1', [departmentId]);
    });

    await logAudit(req.user, 'CREATE_PROBLEM', 'ProblemStatement', probId, { title, code, status }, req.ip);
    await createNotification(null, 'GOVERNMENT_ADMIN', 'New Problem Statement Created', `Problem ${code} (${title}) was created.`, `/problems/${probId}`);

    return res.status(201).json({ id: probId, problemCode: code, message: 'Problem created successfully' });
  } catch (err: any) {
    console.error('Error creating problem:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.put('/problems/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, sector, location, budget, timelineMonths, expectedImpact, targetBeneficiaries, status } = req.body;

    await query(
      `UPDATE problem_statements
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           sector = COALESCE($3, sector),
           location = COALESCE($4, location),
           budget = COALESCE($5, budget),
           timeline_months = COALESCE($6, timeline_months),
           expected_impact = COALESCE($7, expected_impact),
           target_beneficiaries = COALESCE($8, target_beneficiaries),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $10`,
      [title, description, sector, location, budget ? parseFloat(budget) : null, timelineMonths ? parseInt(timelineMonths) : null, expectedImpact, targetBeneficiaries, status, id]
    );

    await logAudit(req.user, 'UPDATE_PROBLEM', 'ProblemStatement', id, { title, status }, req.ip);
    return res.json({ message: 'Problem updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/problems/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query(
      `UPDATE problem_statements SET status = 'PUBLISHED', published_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );

    const prob = await query('SELECT title, problem_code FROM problem_statements WHERE id = $1', [id]);
    const title = prob.rows[0]?.title || 'Government Problem';

    await logAudit(req.user, 'PUBLISH_PROBLEM', 'ProblemStatement', id, { status: 'PUBLISHED' }, req.ip);
    await createNotification(null, 'STARTUP', 'New Government Challenge Published', `${title} is now open for startup proposals.`, `/problems/${id}`);

    return res.json({ message: 'Problem published successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/problems/:id/close', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query(`UPDATE problem_statements SET status = 'CLOSED', updated_at = NOW() WHERE id = $1`, [id]);
    await logAudit(req.user, 'CLOSE_PROBLEM', 'ProblemStatement', id, {}, req.ip);
    return res.json({ message: 'Problem closed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   3. STARTUPS DIRECTORY & PROFILES
   ========================================================================= */

router.get('/startups', async (req, res) => {
  try {
    const { search, sector, technology, location, stage, certification } = req.query;

    let sql = `
      SELECT s.*,
        (SELECT json_agg(t.name) FROM startup_technologies t WHERE t.startup_id = s.id) as technologies,
        (SELECT json_agg(sec.name) FROM startup_sectors sec WHERE sec.startup_id = s.id) as sectors,
        (SELECT COUNT(*) FROM applications a WHERE a.startup_id = s.id) as applications_count,
        (SELECT COUNT(*) FROM pilots p WHERE p.startup_id = s.id) as pilots_count
      FROM startups s
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (LOWER(s.company_name) LIKE LOWER($${params.length}) OR LOWER(s.description) LIKE LOWER($${params.length}))`;
    }
    if (stage) {
      params.push(stage);
      sql += ` AND s.stage = $${params.length}`;
    }
    if (location) {
      params.push(`%${location}%`);
      sql += ` AND LOWER(s.location) LIKE LOWER($${params.length})`;
    }

    sql += ' ORDER BY s.company_name ASC';
    const result = await query(sql, params);

    let rows = result.rows;
    if (sector) {
      rows = rows.filter((r) => r.sectors && r.sectors.some((s: string) => s.toLowerCase().includes((sector as string).toLowerCase())));
    }
    if (technology) {
      rows = rows.filter((r) => r.technologies && r.technologies.some((t: string) => t.toLowerCase().includes((technology as string).toLowerCase())));
    }

    return res.json({ startups: rows, total: rows.length });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/startups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sRes = await query('SELECT * FROM startups WHERE id = $1', [id]);
    if (sRes.rows.length === 0) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const startup = sRes.rows[0];
    const [techRes, secRes, projRes, certRes, docsRes, appsRes, pilotsRes] = await Promise.all([
      query('SELECT name FROM startup_technologies WHERE startup_id = $1', [id]),
      query('SELECT name FROM startup_sectors WHERE startup_id = $1', [id]),
      query('SELECT * FROM startup_projects WHERE startup_id = $1 ORDER BY year DESC', [id]),
      query('SELECT * FROM startup_certifications WHERE startup_id = $1', [id]),
      query('SELECT * FROM startup_documents WHERE startup_id = $1 ORDER BY created_at DESC', [id]),
      query(
        `SELECT a.*, p.title as problem_title, p.problem_code, p.sector, p.budget as problem_budget
         FROM applications a
         JOIN problem_statements p ON a.problem_id = p.id
         WHERE a.startup_id = $1
         ORDER BY a.created_at DESC`,
        [id]
      ),
      query(
        `SELECT pi.*, p.title as problem_title
         FROM pilots pi
         JOIN problem_statements p ON pi.problem_id = p.id
         WHERE pi.startup_id = $1`,
        [id]
      ),
    ]);

    return res.json({
      startup: {
        ...startup,
        technologies: techRes.rows.map((t) => t.name),
        sectors: secRes.rows.map((s) => s.name),
        projects: projRes.rows,
        certifications: certRes.rows,
        documents: docsRes.rows,
        applications: appsRes.rows,
        pilots: pilotsRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/startups/:id/documents', authMiddleware, upload.array('documents', 5), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const startupRes = await query('SELECT id FROM startups WHERE id = $1', [id]);
    if (startupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const files = Array.isArray((req as any).files) ? (req as any).files : [];
    if (!files.length) {
      return res.status(400).json({ error: 'At least one document file is required.' });
    }

    const savedDocs = [] as any[];
    for (const file of files) {
      const fileUrl = `/uploads/${path.basename(file.path)}`;
      const docId = `startup-doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

      await query(
        `INSERT INTO startup_documents (id, startup_id, title, file_type, file_url, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [docId, id, file.originalname || 'Startup Document', file.mimetype || 'application/octet-stream', fileUrl, file.size || 0, req.user?.id || null]
      );

      savedDocs.push({
        id: docId,
        startup_id: id,
        title: file.originalname || 'Startup Document',
        file_type: file.mimetype || 'application/octet-stream',
        file_url: fileUrl,
        file_size: file.size || 0,
      });
    }

    await logAudit(req.user, 'UPLOAD_STARTUP_DOCUMENT', 'StartupDocument', id, { count: savedDocs.length }, req.ip);
    return res.status(201).json({ message: 'Startup documents uploaded successfully.', documents: savedDocs });
  } catch (err: any) {
    console.error('Upload startup documents error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   4. APPLICATIONS WORKFLOW & SCREENING
   ========================================================================= */

router.get('/applications', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { problemId, startupId, status } = req.query;

    let sql = `
      SELECT a.*,
        p.title as problem_title, p.problem_code, p.sector, p.budget as problem_budget, p.department_id,
        d.name as department_name,
        s.company_name, s.stage as startup_stage, s.location as startup_location, s.funding_total,
        (SELECT total_weighted_score FROM evaluations e WHERE e.application_id = a.id LIMIT 1) as evaluation_score
      FROM applications a
      JOIN problem_statements p ON a.problem_id = p.id
      JOIN departments d ON p.department_id = d.id
      JOIN startups s ON a.startup_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (problemId) {
      params.push(problemId);
      sql += ` AND a.problem_id = $${params.length}`;
    }
    if (startupId) {
      params.push(startupId);
      sql += ` AND a.startup_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      sql += ` AND a.status = $${params.length}`;
    }

    // Role filtering: Startup can only see their applications
    if (req.user?.role === 'STARTUP' && req.user?.startupId) {
      params.push(req.user.startupId);
      sql += ` AND a.startup_id = $${params.length}`;
    }

    sql += ' ORDER BY a.created_at DESC';
    const result = await query(sql, params);
    return res.json({ applications: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/applications/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const appRes = await query(
      `SELECT a.*,
        p.title as problem_title, p.problem_code, p.sector, p.budget as problem_budget, p.timeline_months as problem_timeline, p.expected_impact as problem_impact,
        d.name as department_name, d.code as department_code,
        s.company_name, s.stage as startup_stage, s.location as startup_location, s.website, s.contact_email, s.contact_phone, s.funding_total, s.team_size
       FROM applications a
       JOIN problem_statements p ON a.problem_id = p.id
       JOIN departments d ON p.department_id = d.id
       JOIN startups s ON a.startup_id = s.id
       WHERE a.id = $1`,
      [id]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appRes.rows[0];
    const [docsRes, evalsRes, matchRes] = await Promise.all([
      query('SELECT * FROM application_documents WHERE application_id = $1', [id]),
      query(
        `SELECT e.*, u.name as evaluator_name, u.designation as evaluator_designation
         FROM evaluations e
         JOIN users u ON e.evaluator_id = u.id
         WHERE e.application_id = $1`,
        [id]
      ),
      query('SELECT * FROM ai_matches WHERE problem_id = $1 AND startup_id = $2', [application.problem_id, application.startup_id]),
    ]);

    return res.json({
      application: {
        ...application,
        documents: docsRes.rows,
        evaluations: evalsRes.rows,
        aiMatch: matchRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/applications', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      problemId,
      startupId,
      proposalTitle,
      technicalApproach,
      implementationPlan,
      timelineMonths,
      proposedBudget,
      expectedImpact,
      teamDetails,
      documents = [],
    } = req.body;

    const actualStartupId = startupId || req.user?.startupId;
    if (!problemId || !actualStartupId || !proposalTitle || !technicalApproach) {
      return res.status(400).json({ error: 'Problem, startup, title, and technical approach are required.' });
    }

    // Check duplicate
    const existing = await query('SELECT id FROM applications WHERE problem_id = $1 AND startup_id = $2', [problemId, actualStartupId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An application for this startup and problem statement already exists.' });
    }

    const appId = `app-${Date.now()}`;
    await withTransaction(async ({ query }) => {
      await query(
        `INSERT INTO applications (id, problem_id, startup_id, proposal_title, technical_approach, implementation_plan, timeline_months, proposed_budget, expected_impact, team_details, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SUBMITTED')`,
        [
          appId,
          problemId,
          actualStartupId,
          proposalTitle,
          technicalApproach,
          implementationPlan || '',
          parseInt(timelineMonths || '6', 10),
          parseFloat(proposedBudget || '0'),
          expectedImpact || '',
          teamDetails || '',
        ]
      );

      for (const d of documents) {
        await query(
          `INSERT INTO application_documents (id, application_id, title, file_type, file_url, file_size)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [`doc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, appId, d.title || 'Attachment', d.fileType || 'application/pdf', d.fileUrl || '/uploads/sample.pdf', d.fileSize || 1024000]
        );
      }
    });

    const probRes = await query('SELECT title, problem_code FROM problem_statements WHERE id = $1', [problemId]);
    const pTitle = probRes.rows[0]?.title || 'Government Challenge';

    await logAudit(req.user, 'APPLY_TO_PROBLEM', 'Application', appId, { problemId, actualStartupId, proposalTitle }, req.ip);
    await createNotification(null, 'GOVERNMENT_ADMIN', 'New Application Submitted', `A new proposal was submitted for ${pTitle}.`, `/applications/${appId}`);

    return res.status(201).json({ id: appId, message: 'Application submitted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/applications/:id/shortlist', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const appRes = await query('SELECT * FROM applications WHERE id = $1', [id]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const app = appRes.rows[0];

    await withTransaction(async ({ query }) => {
      // 1. Update Application status
      await query(
        `UPDATE applications SET status = 'SHORTLISTED', shortlisted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [id]
      );

      // 2. Update Problem Statement status if currently UNDER_REVIEW or PUBLISHED
      await query(
        `UPDATE problem_statements SET status = 'SHORTLISTED', updated_at = NOW() WHERE id = $1 AND status IN ('PUBLISHED', 'UNDER_REVIEW')`,
        [app.problem_id]
      );
    });

    const startupUser = await query('SELECT id, email FROM users WHERE startup_id = $1 LIMIT 1', [app.startup_id]);
    const probRes = await query('SELECT title, problem_code FROM problem_statements WHERE id = $1', [app.problem_id]);

    await logAudit(req.user, 'SHORTLIST_STARTUP', 'Application', id, { startupId: app.startup_id, problemId: app.problem_id }, req.ip);

    if (startupUser.rows[0]) {
      await createNotification(
        startupUser.rows[0].id,
        'STARTUP',
        'Congratulations! Application Shortlisted',
        `Your proposal for ${probRes.rows[0]?.title} has been officially shortlisted by the evaluation committee.`,
        `/applications/${id}`
      );
    }

    return res.json({ message: 'Application successfully shortlisted' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/applications/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await query(`UPDATE applications SET status = 'REJECTED', updated_at = NOW() WHERE id = $1`, [id]);
    await logAudit(req.user, 'REJECT_APPLICATION', 'Application', id, { reason }, req.ip);
    return res.json({ message: 'Application rejected' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   5. AI MATCHING ENGINE REST APIS
   ========================================================================= */

router.get('/matches/problem/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const matchesRes = await query(
      `SELECT m.*, s.company_name, s.stage, s.location, s.funding_total, s.team_size, s.previous_gov_experience,
        (SELECT json_agg(t.name) FROM startup_technologies t WHERE t.startup_id = s.id) as technologies,
        (SELECT json_agg(sec.name) FROM startup_sectors sec WHERE sec.startup_id = s.id) as sectors,
        (SELECT id FROM applications a WHERE a.problem_id = m.problem_id AND a.startup_id = m.startup_id) as application_id,
        (SELECT status FROM applications a WHERE a.problem_id = m.problem_id AND a.startup_id = m.startup_id) as application_status
       FROM ai_matches m
       JOIN startups s ON m.startup_id = s.id
       WHERE m.problem_id = $1
       ORDER BY m.overall_score DESC`,
      [problemId]
    );

    return res.json({ matches: matchesRes.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/matches/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { problemId, limit = 8 } = req.body;
    if (!problemId) {
      return res.status(400).json({ error: 'problemId is required' });
    }

    // 1. Fetch Problem statement with technologies & requirements
    const probRes = await query('SELECT * FROM problem_statements WHERE id = $1', [problemId]);
    if (probRes.rows.length === 0) {
      return res.status(404).json({ error: 'Problem statement not found' });
    }
    const problem = probRes.rows[0];
    const techRes = await query('SELECT name FROM problem_technologies WHERE problem_id = $1', [problemId]);
    const reqRes = await query('SELECT title, description, is_mandatory FROM problem_requirements WHERE problem_id = $1', [problemId]);

    const problemInput = {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      sector: problem.sector,
      location: problem.location,
      budget: problem.budget,
      timeline_months: problem.timeline_months,
      expected_impact: problem.expected_impact,
      technologies: techRes.rows.map((t) => t.name),
      requirements: reqRes.rows,
    };

    // 2. Fetch all startups with related data
    const startupsRes = await query('SELECT * FROM startups LIMIT 30');
    const startups = startupsRes.rows;

    const matchResults = [];

    for (const startup of startups.slice(0, parseInt(limit.toString(), 10))) {
      const [sTechs, sSectors, sProjects, sCerts] = await Promise.all([
        query('SELECT name FROM startup_technologies WHERE startup_id = $1', [startup.id]),
        query('SELECT name FROM startup_sectors WHERE startup_id = $1', [startup.id]),
        query('SELECT title, client, description, year FROM startup_projects WHERE startup_id = $1', [startup.id]),
        query('SELECT name, issuing_body, year FROM startup_certifications WHERE startup_id = $1', [startup.id]),
      ]);

      const startupInput = {
        id: startup.id,
        company_name: startup.company_name,
        stage: startup.stage,
        team_size: startup.team_size,
        funding_total: startup.funding_total,
        location: startup.location,
        description: startup.description,
        pitch_summary: startup.pitch_summary,
        previous_gov_experience: startup.previous_gov_experience,
        technologies: sTechs.rows.map((t) => t.name),
        sectors: sSectors.rows.map((s) => s.name),
        projects: sProjects.rows,
        certifications: sCerts.rows,
      };

      const match = await matchProblemAndStartup(problemInput, startupInput);

      // Upsert into ai_matches
      const matchId = `match-${problemId}-${startup.id}`;
      await query(
        `INSERT INTO ai_matches (id, problem_id, startup_id, overall_score, technology_score, sector_score, requirement_score, experience_score, budget_fit_score, location_fit_score, impact_potential_score, match_explanation, strengths, potential_risks, recommended_next_step, is_fallback, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
         ON CONFLICT (problem_id, startup_id) DO UPDATE
         SET overall_score = EXCLUDED.overall_score,
             technology_score = EXCLUDED.technology_score,
             sector_score = EXCLUDED.sector_score,
             requirement_score = EXCLUDED.requirement_score,
             experience_score = EXCLUDED.experience_score,
             budget_fit_score = EXCLUDED.budget_fit_score,
             location_fit_score = EXCLUDED.location_fit_score,
             impact_potential_score = EXCLUDED.impact_potential_score,
             match_explanation = EXCLUDED.match_explanation,
             strengths = EXCLUDED.strengths,
             potential_risks = EXCLUDED.potential_risks,
             recommended_next_step = EXCLUDED.recommended_next_step,
             is_fallback = EXCLUDED.is_fallback,
             updated_at = NOW()`,
        [
          matchId,
          problemId,
          startup.id,
          match.overall_score,
          match.technology_score,
          match.sector_score,
          match.requirement_score,
          match.experience_score,
          match.budget_fit_score,
          match.location_fit_score,
          match.impact_potential_score,
          match.match_explanation,
          JSON.stringify(match.strengths),
          JSON.stringify(match.potential_risks),
          match.recommended_next_step,
          match.is_fallback,
        ]
      );

      matchResults.push({
        ...match,
        startup_id: startup.id,
        company_name: startup.company_name,
        stage: startup.stage,
        location: startup.location,
        funding_total: startup.funding_total,
      });
    }

    matchResults.sort((a, b) => b.overall_score - a.overall_score);

    await logAudit(req.user, 'GENERATE_AI_MATCHES', 'ProblemStatement', problemId, { matchesCount: matchResults.length }, req.ip);

    return res.json({ matches: matchResults, message: 'AI matches generated successfully' });
  } catch (err: any) {
    console.error('Error generating AI matches:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   6. EVALUATIONS SYSTEM
   ========================================================================= */

router.get('/evaluations', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.query;
    let sql = `
      SELECT e.*, u.name as evaluator_name, u.designation as evaluator_designation,
        a.proposal_title, a.status as application_status,
        s.company_name,
        p.title as problem_title, p.problem_code
      FROM evaluations e
      JOIN users u ON e.evaluator_id = u.id
      JOIN applications a ON e.application_id = a.id
      JOIN startups s ON a.startup_id = s.id
      JOIN problem_statements p ON a.problem_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (applicationId) {
      params.push(applicationId);
      sql += ` AND e.application_id = $${params.length}`;
    }

    // Evaluator role restriction
    if (req.user?.role === 'EVALUATOR') {
      params.push(req.user.id);
      sql += ` AND e.evaluator_id = $${params.length}`;
    }

    sql += ' ORDER BY e.created_at DESC';
    const result = await query(sql, params);
    return res.json({ evaluations: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/evaluations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      applicationId,
      technicalScore = 0,
      innovationScore = 0,
      feasibilityScore = 0,
      financialScore = 0,
      scalabilityScore = 0,
      impactScore = 0,
      securityScore = 0,
      complianceScore = 0,
      comments = '',
    } = req.body;

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId is required' });
    }

    // Fetch problem weights
    const appRes = await query('SELECT problem_id FROM applications WHERE id = $1', [applicationId]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const problemId = appRes.rows[0].problem_id;
    const weightsRes = await query('SELECT * FROM evaluation_weights WHERE problem_id = $1', [problemId]);
    const w = weightsRes.rows[0] || {
      technical: 20,
      innovation: 15,
      feasibility: 15,
      financial: 10,
      scalability: 10,
      impact: 15,
      security: 5,
      compliance: 10,
    };

    // Calculate weighted score out of 100
    // Each subscore is out of its weight category or out of 100
    const totalWeightedScore =
      (parseFloat(technicalScore) * (w.technical / 20)) +
      (parseFloat(innovationScore) * (w.innovation / 15)) +
      (parseFloat(feasibilityScore) * (w.feasibility / 15)) +
      (parseFloat(financialScore) * (w.financial / 10)) +
      (parseFloat(scalabilityScore) * (w.scalability / 10)) +
      (parseFloat(impactScore) * (w.impact / 15)) +
      (parseFloat(securityScore) * (w.security / 5)) +
      (parseFloat(complianceScore) * (w.compliance / 10));

    const finalWeightedScore = Math.min(100, Math.max(0, Math.round(totalWeightedScore * 10) / 10));

    const evalId = `eval-${Date.now()}`;
    await query(
      `INSERT INTO evaluations (id, application_id, evaluator_id, technical_score, innovation_score, feasibility_score, financial_score, scalability_score, impact_score, security_score, compliance_score, total_weighted_score, comments, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'SUBMITTED')`,
      [
        evalId,
        applicationId,
        req.user!.id,
        parseFloat(technicalScore),
        parseFloat(innovationScore),
        parseFloat(feasibilityScore),
        parseFloat(financialScore),
        parseFloat(scalabilityScore),
        parseFloat(impactScore),
        parseFloat(securityScore),
        parseFloat(complianceScore),
        finalWeightedScore,
        comments,
      ]
    );

    // Update application status to EVALUATION if in SCREENING/SUBMITTED
    await query(`UPDATE applications SET status = 'EVALUATION', updated_at = NOW() WHERE id = $1 AND status IN ('SUBMITTED', 'SCREENING')`, [applicationId]);

    await logAudit(req.user, 'SUBMIT_EVALUATION', 'Evaluation', evalId, { applicationId, totalWeightedScore: finalWeightedScore }, req.ip);

    return res.status(201).json({ id: evalId, totalWeightedScore: finalWeightedScore, message: 'Evaluation submitted successfully' });
  } catch (err: any) {
    console.error('Evaluation submit error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   7. PILOTS & KPI MANAGEMENT
   ========================================================================= */

router.get('/pilots', async (req, res) => {
  try {
    const { status, departmentId } = req.query;
    let sql = `
      SELECT pi.*,
        p.title as problem_title, p.problem_code, p.sector,
        d.name as department_name, d.code as department_code,
        s.company_name, s.location as startup_location,
        (SELECT COUNT(*) FROM pilot_milestones m WHERE m.pilot_id = pi.id) as milestones_count,
        (SELECT COUNT(*) FROM pilot_kpis k WHERE k.pilot_id = pi.id) as kpis_count
      FROM pilots pi
      JOIN problem_statements p ON pi.problem_id = p.id
      JOIN departments d ON pi.department_id = d.id
      JOIN startups s ON pi.startup_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status) {
      params.push(status);
      sql += ` AND pi.status = $${params.length}`;
    }
    if (departmentId) {
      params.push(departmentId);
      sql += ` AND pi.department_id = $${params.length}`;
    }

    sql += ' ORDER BY pi.created_at DESC';
    const result = await query(sql, params);
    return res.json({ pilots: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/pilots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pRes = await query(
      `SELECT pi.*,
        p.title as problem_title, p.problem_code, p.sector, p.budget as problem_budget,
        d.name as department_name, d.code as department_code,
        s.company_name, s.stage as startup_stage, s.location as startup_location, s.contact_email, s.contact_phone,
        a.proposal_title, a.technical_approach
       FROM pilots pi
       JOIN problem_statements p ON pi.problem_id = p.id
       JOIN departments d ON pi.department_id = d.id
       JOIN startups s ON pi.startup_id = s.id
       JOIN applications a ON pi.application_id = a.id
       WHERE pi.id = $1`,
      [id]
    );

    if (pRes.rows.length === 0) {
      return res.status(404).json({ error: 'Pilot not found' });
    }

    const pilot = pRes.rows[0];
    const [milestonesRes, kpisRes, risksRes, scaleRes] = await Promise.all([
      query('SELECT * FROM pilot_milestones WHERE pilot_id = $1 ORDER BY due_date ASC', [id]),
      query('SELECT * FROM pilot_kpis WHERE pilot_id = $1 ORDER BY created_at ASC', [id]),
      query('SELECT * FROM pilot_risks WHERE pilot_id = $1 ORDER BY severity DESC', [id]),
      query('SELECT * FROM scale_assessments WHERE pilot_id = $1', [id]),
    ]);

    return res.json({
      pilot: {
        ...pilot,
        milestones: milestonesRes.rows,
        kpis: kpisRes.rows,
        risks: risksRes.rows,
        scaleAssessment: scaleRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/pilots', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      applicationId,
      title,
      objectives,
      expectedOutcomes,
      budget,
      startDate,
      endDate,
      milestones = [],
      kpis = [],
    } = req.body;

    if (!applicationId || !title || !budget || !startDate || !endDate) {
      return res.status(400).json({ error: 'applicationId, title, budget, startDate, and endDate are required' });
    }

    const appRes = await query('SELECT * FROM applications WHERE id = $1', [applicationId]);
    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    const app = appRes.rows[0];
    const probRes = await query('SELECT department_id FROM problem_statements WHERE id = $1', [app.problem_id]);
    const departmentId = probRes.rows[0]?.department_id;

    const pilotId = `pilot-${Date.now()}`;

    await withTransaction(async ({ query }) => {
      // 1. Create pilot
      await query(
        `INSERT INTO pilots (id, application_id, problem_id, startup_id, department_id, title, objectives, expected_outcomes, budget, start_date, end_date, status, completion_percentage)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE', 10)`,
        [
          pilotId,
          applicationId,
          app.problem_id,
          app.startup_id,
          departmentId,
          title,
          objectives || '',
          expectedOutcomes || '',
          parseFloat(budget),
          startDate,
          endDate,
        ]
      );

      // 2. Synchronize Application & Problem statuses
      await query(`UPDATE applications SET status = 'PILOT', updated_at = NOW() WHERE id = $1`, [applicationId]);
      await query(`UPDATE problem_statements SET status = 'PILOT', updated_at = NOW() WHERE id = $1`, [app.problem_id]);
      await query(`UPDATE departments SET pilots_count = pilots_count + 1 WHERE id = $1`, [departmentId]);

      // 3. Insert initial milestones
      for (const m of milestones) {
        await query(
          `INSERT INTO pilot_milestones (id, pilot_id, title, description, due_date, status, completion_percentage, owner)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [`ms-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, pilotId, m.title, m.description || '', m.dueDate || endDate, m.status || 'PENDING', m.completionPercentage || 0, m.owner || 'Project Lead']
        );
      }

      // 4. Insert initial KPIs
      for (const k of kpis) {
        await query(
          `INSERT INTO pilot_kpis (id, pilot_id, name, metric_unit, baseline_value, target_value, current_value, status, trend)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [`kpi-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, pilotId, k.name, k.unit || '%', parseFloat(k.baseline || '0'), parseFloat(k.target || '100'), parseFloat(k.current || k.baseline || '0'), 'ON_TRACK', 'UP']
        );
      }
    });

    await logAudit(req.user, 'CREATE_PILOT', 'Pilot', pilotId, { title, budget, applicationId }, req.ip);
    await createNotification(null, 'GOVERNMENT_ADMIN', 'Pilot Initiated', `New pilot "${title}" is now active.`, `/pilots/${pilotId}`);

    return res.status(201).json({ id: pilotId, message: 'Pilot created and activated successfully' });
  } catch (err: any) {
    console.error('Error creating pilot:', err);
    return res.status(500).json({ error: err.message });
  }
});

router.post('/pilots/:id/kpis', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, metricUnit, baselineValue, targetValue, currentValue } = req.body;

    const kpiId = `kpi-${Date.now()}`;
    const status = parseFloat(currentValue) < parseFloat(targetValue) * 0.7 ? 'AT_RISK' : 'ON_TRACK';

    await query(
      `INSERT INTO pilot_kpis (id, pilot_id, name, metric_unit, baseline_value, target_value, current_value, status, trend)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'UP')`,
      [kpiId, id, name, metricUnit || '%', parseFloat(baselineValue || '0'), parseFloat(targetValue || '100'), parseFloat(currentValue || '0'), status]
    );

    return res.status(201).json({ id: kpiId, message: 'KPI added successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/kpis/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentValue, targetValue } = req.body;

    const curr = parseFloat(currentValue);
    const target = parseFloat(targetValue);
    const status = curr < target * 0.7 ? 'AT_RISK' : 'ON_TRACK';

    await query(
      `UPDATE pilot_kpis
       SET current_value = $1, target_value = COALESCE($2, target_value), status = $3, updated_at = NOW()
       WHERE id = $4`,
      [curr, isNaN(target) ? null : target, status, id]
    );

    return res.json({ message: 'KPI updated successfully', status });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   8. SCALE READINESS ASSESSMENT
   ========================================================================= */

router.get('/scale/:pilotId', async (req, res) => {
  try {
    const { pilotId } = req.params;
    const assessmentRes = await query(
      `SELECT sa.*, pi.title as pilot_title, pi.status as pilot_status, s.company_name, p.title as problem_title
       FROM scale_assessments sa
       JOIN pilots pi ON sa.pilot_id = pi.id
       JOIN startups s ON pi.startup_id = s.id
       JOIN problem_statements p ON pi.problem_id = p.id
       WHERE sa.pilot_id = $1`,
      [pilotId]
    );

    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Scale assessment not found for this pilot' });
    }
    return res.json({ assessment: assessmentRes.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/scale', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      pilotId,
      impactScore = 90,
      technicalReadinessScore = 90,
      operationalReadinessScore = 85,
      financialSustainabilityScore = 88,
      userAdoptionScore = 87,
      securityScore = 95,
      complianceScore = 95,
      scalabilityScore = 90,
      summary = '',
      recommendations = [],
    } = req.body;

    if (!pilotId) {
      return res.status(400).json({ error: 'pilotId is required' });
    }

    const overallScore = Math.round(
      (parseFloat(impactScore) * 0.2 +
        parseFloat(technicalReadinessScore) * 0.15 +
        parseFloat(operationalReadinessScore) * 0.15 +
        parseFloat(financialSustainabilityScore) * 0.1 +
        parseFloat(userAdoptionScore) * 0.1 +
        parseFloat(securityScore) * 0.1 +
        parseFloat(complianceScore) * 0.1 +
        parseFloat(scalabilityScore) * 0.1) *
        10
    ) / 10;

    let readinessLevel = 'READY';
    if (overallScore >= 92) readinessLevel = 'HIGHLY_READY';
    else if (overallScore >= 80) readinessLevel = 'READY';
    else if (overallScore >= 65) readinessLevel = 'CONDITIONALLY_READY';
    else readinessLevel = 'NOT_READY';

    const saId = `scale-${Date.now()}`;
    await withTransaction(async ({ query }) => {
      await query(
        `INSERT INTO scale_assessments (id, pilot_id, impact_score, technical_readiness_score, operational_readiness_score, financial_sustainability_score, user_adoption_score, security_score, compliance_score, scalability_score, overall_score, readiness_level, summary, recommendations, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
         ON CONFLICT (pilot_id) DO UPDATE
         SET impact_score = EXCLUDED.impact_score,
             technical_readiness_score = EXCLUDED.technical_readiness_score,
             operational_readiness_score = EXCLUDED.operational_readiness_score,
             financial_sustainability_score = EXCLUDED.financial_sustainability_score,
             user_adoption_score = EXCLUDED.user_adoption_score,
             security_score = EXCLUDED.security_score,
             compliance_score = EXCLUDED.compliance_score,
             scalability_score = EXCLUDED.scalability_score,
             overall_score = EXCLUDED.overall_score,
             readiness_level = EXCLUDED.readiness_level,
             summary = EXCLUDED.summary,
             recommendations = EXCLUDED.recommendations,
             updated_at = NOW()`,
        [
          saId,
          pilotId,
          parseFloat(impactScore),
          parseFloat(technicalReadinessScore),
          parseFloat(operationalReadinessScore),
          parseFloat(financialSustainabilityScore),
          parseFloat(userAdoptionScore),
          parseFloat(securityScore),
          parseFloat(complianceScore),
          parseFloat(scalabilityScore),
          overallScore,
          readinessLevel,
          summary || `Pilot scored ${overallScore}/100 and is classified as ${readinessLevel}.`,
          JSON.stringify(recommendations),
        ]
      );

      // Update pilot scale score and status if highly ready
      await query(
        `UPDATE pilots SET scale_readiness_score = $1, status = CASE WHEN $2 IN ('READY', 'HIGHLY_READY') THEN 'APPROVED_FOR_SCALE' ELSE status END, updated_at = NOW() WHERE id = $3`,
        [overallScore, readinessLevel, pilotId]
      );
    });

    await logAudit(req.user, 'APPROVE_SCALE', 'ScaleAssessment', saId, { pilotId, overallScore, readinessLevel }, req.ip);

    return res.status(201).json({ id: saId, overallScore, readinessLevel, message: 'Scale assessment computed successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   9. PROCUREMENT PIPELINE & KANBAN
   ========================================================================= */

router.get('/procurement', async (req, res) => {
  try {
    const { stage, departmentId } = req.query;
    let sql = `
      SELECT pr.*,
        p.title as problem_title, p.problem_code, p.sector,
        d.name as department_name, d.code as department_code,
        s.company_name, s.location as startup_location,
        u.name as procurement_officer_name,
        c.contract_number, c.status as contract_status, c.contract_value
      FROM procurements pr
      JOIN problem_statements p ON pr.problem_id = p.id
      JOIN departments d ON pr.department_id = d.id
      JOIN startups s ON pr.startup_id = s.id
      LEFT JOIN users u ON pr.procurement_officer_id = u.id
      LEFT JOIN contracts c ON c.procurement_id = pr.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (stage) {
      params.push(stage);
      sql += ` AND pr.current_stage = $${params.length}`;
    }
    if (departmentId) {
      params.push(departmentId);
      sql += ` AND pr.department_id = $${params.length}`;
    }

    sql += ' ORDER BY pr.created_at DESC';
    const result = await query(sql, params);
    return res.json({ procurements: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/procurement/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prRes = await query(
      `SELECT pr.*,
        p.title as problem_title, p.problem_code, p.sector,
        d.name as department_name, d.code as department_code, d.ministry,
        s.company_name, s.registration_number, s.location as startup_location, s.contact_email, s.contact_phone,
        u.name as procurement_officer_name,
        pi.title as pilot_title, pi.scale_readiness_score
       FROM procurements pr
       JOIN problem_statements p ON pr.problem_id = p.id
       JOIN departments d ON pr.department_id = d.id
       JOIN startups s ON pr.startup_id = s.id
       LEFT JOIN users u ON pr.procurement_officer_id = u.id
       LEFT JOIN pilots pi ON pr.pilot_id = pi.id
       WHERE pr.id = $1`,
      [id]
    );

    if (prRes.rows.length === 0) {
      return res.status(404).json({ error: 'Procurement record not found' });
    }

    const procurement = prRes.rows[0];
    const [eventsRes, contractsRes] = await Promise.all([
      query(
        `SELECT e.*, u.name as actor_name
         FROM procurement_events e
         LEFT JOIN users u ON e.actor_id = u.id
         WHERE e.procurement_id = $1
         ORDER BY e.created_at ASC`,
        [id]
      ),
      query('SELECT * FROM contracts WHERE procurement_id = $1', [id]),
    ]);

    return res.json({
      procurement: {
        ...procurement,
        events: eventsRes.rows,
        contract: contractsRes.rows[0] || null,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/procurement', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      pilotId,
      problemId,
      startupId,
      departmentId,
      title,
      estimatedValue,
      approvedBudget,
      currentStage = 'RECOMMENDATION',
      targetCompletionDate,
    } = req.body;

    if (!problemId || !startupId || !title || !estimatedValue) {
      return res.status(400).json({ error: 'problemId, startupId, title, and estimatedValue are required' });
    }

    const deptId = departmentId || (await query('SELECT department_id FROM problem_statements WHERE id = $1', [problemId])).rows[0]?.department_id;
    const procId = `proc-${Date.now()}`;
    const targetDate = targetCompletionDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    await withTransaction(async ({ query }) => {
      await query(
        `INSERT INTO procurements (id, pilot_id, problem_id, startup_id, department_id, title, estimated_value, approved_budget, current_stage, procurement_officer_id, target_completion_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')`,
        [
          procId,
          pilotId || null,
          problemId,
          startupId,
          deptId,
          title,
          parseFloat(estimatedValue),
          parseFloat(approvedBudget || estimatedValue),
          currentStage,
          req.user!.id,
          targetDate,
        ]
      );

      // Create initial event
      await query(
        `INSERT INTO procurement_events (id, procurement_id, from_stage, to_stage, notes, actor_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`pevent-${Date.now()}`, procId, 'PILOT_COMPLETED', currentStage, 'Procurement initiative created in pipeline.', req.user!.id]
      );

      // Update problem & application status to PROCUREMENT
      await query(`UPDATE problem_statements SET status = 'PROCUREMENT', updated_at = NOW() WHERE id = $1`, [problemId]);
      await query(`UPDATE applications SET status = 'PROCUREMENT', updated_at = NOW() WHERE problem_id = $1 AND startup_id = $2`, [problemId, startupId]);
      await query(`UPDATE departments SET total_procurement_value = total_procurement_value + $1 WHERE id = $2`, [parseFloat(estimatedValue), deptId]);
    });

    await logAudit(req.user, 'START_PROCUREMENT', 'Procurement', procId, { title, estimatedValue }, req.ip);
    await createNotification(null, 'PROCUREMENT_OFFICER', 'New Procurement File Initiated', `Procurement for "${title}" has been created.`, `/procurement/${procId}`);

    return res.status(201).json({ id: procId, message: 'Procurement initialized successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/procurement/:id/stage', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { toStage, notes = '' } = req.body;

    if (!toStage) {
      return res.status(400).json({ error: 'toStage is required' });
    }

    const prRes = await query('SELECT current_stage, title FROM procurements WHERE id = $1', [id]);
    if (prRes.rows.length === 0) {
      return res.status(404).json({ error: 'Procurement not found' });
    }
    const fromStage = prRes.rows[0].current_stage;
    const title = prRes.rows[0].title;

    await withTransaction(async ({ query }) => {
      await query(
        `UPDATE procurements SET current_stage = $1, status = CASE WHEN $1 = 'COMPLETED' THEN 'COMPLETED' ELSE status END, updated_at = NOW() WHERE id = $2`,
        [toStage, id]
      );

      await query(
        `INSERT INTO procurement_events (id, procurement_id, from_stage, to_stage, notes, actor_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [`pevent-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, id, fromStage, toStage, notes || `Stage progressed from ${fromStage} to ${toStage}`, req.user!.id]
      );
    });

    await logAudit(req.user, 'UPDATE_PROCUREMENT', 'Procurement', id, { fromStage, toStage, notes }, req.ip);
    await createNotification(null, 'PROCUREMENT_OFFICER', 'Procurement Stage Updated', `Procurement for "${title}" is now at ${toStage}.`, `/procurement/${id}`);

    return res.json({ message: `Procurement stage moved to ${toStage}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   10. CONTRACT MANAGEMENT
   ========================================================================= */

router.get('/contracts', async (_req, res) => {
  try {
    const result = await query(
      `SELECT c.*,
        pr.title as procurement_title,
        s.company_name,
        d.name as department_name, d.code as department_code
       FROM contracts c
       JOIN procurements pr ON c.procurement_id = pr.id
       JOIN startups s ON c.startup_id = s.id
       JOIN departments d ON c.department_id = d.id
       ORDER BY c.created_at DESC`
    );
    return res.json({ contracts: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/contracts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { procurementId, startupId, departmentId, contractNumber, startDate, endDate, contractValue, terms, documentUrl } = req.body;

    if (!procurementId || !contractValue || !terms) {
      return res.status(400).json({ error: 'procurementId, contractValue, and terms are required' });
    }

    const prRes = await query('SELECT startup_id, department_id, title FROM procurements WHERE id = $1', [procurementId]);
    const sId = startupId || prRes.rows[0]?.startup_id;
    const dId = departmentId || prRes.rows[0]?.department_id;
    const cNum = contractNumber || `GOV/CT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;

    const contractId = `contract-${Date.now()}`;
    await query(
      `INSERT INTO contracts (id, procurement_id, contract_number, startup_id, department_id, start_date, end_date, contract_value, terms, status, document_url, signed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'EXECUTED', $10, NOW())`,
      [
        contractId,
        procurementId,
        cNum,
        sId,
        dId,
        startDate || new Date().toISOString(),
        endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        parseFloat(contractValue),
        terms,
        documentUrl || '/uploads/contract_executed.pdf',
      ]
    );

    // Update procurement stage to CONTRACT
    await query(`UPDATE procurements SET current_stage = 'CONTRACT', updated_at = NOW() WHERE id = $1`, [procurementId]);

    await logAudit(req.user, 'CREATE_CONTRACT', 'Contract', contractId, { contractNumber: cNum, contractValue }, req.ip);

    return res.status(201).json({ id: contractId, contractNumber: cNum, message: 'Contract created successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   11. DEPARTMENTS
   ========================================================================= */

router.get('/departments', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY name ASC');
    return res.json({ departments: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deptRes = await query('SELECT * FROM departments WHERE id = $1', [id]);
    if (deptRes.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const dept = deptRes.rows[0];
    const [probsRes, pilotsRes, procsRes] = await Promise.all([
      query('SELECT * FROM problem_statements WHERE department_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT * FROM pilots WHERE department_id = $1 ORDER BY created_at DESC', [id]),
      query('SELECT * FROM procurements WHERE department_id = $1 ORDER BY created_at DESC', [id]),
    ]);

    return res.json({
      department: {
        ...dept,
        problems: probsRes.rows,
        pilots: pilotsRes.rows,
        procurements: procsRes.rows,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   12. NOTIFICATIONS & AUDIT LOGS
   ========================================================================= */

router.get('/notifications', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let result;
    if (!req.user) {
      result = await query(
        `SELECT * FROM notifications
         WHERE user_id IS NULL AND role IS NULL
         ORDER BY created_at DESC
         LIMIT 50`
      );
    } else {
      result = await query(
        `SELECT * FROM notifications
         WHERE user_id = $1 OR role = $2 OR (user_id IS NULL AND role IS NULL)
         ORDER BY created_at DESC
         LIMIT 50`,
        [req.user.id, req.user.role]
      );
    }
    const unreadCount = result.rows.filter((n) => !n.is_read).length;
    return res.json({ notifications: result.rows, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    return res.json({ message: 'Marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await query(
      `UPDATE notifications SET is_read = true WHERE user_id = $1 OR role = $2`,
      [req.user!.id, req.user!.role]
    );
    return res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/audit-logs', authMiddleware, requireRoles('SUPER_ADMIN'), async (_req, res) => {
  try {
    const result = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100');
    return res.json({ logs: result.rows });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   13. ANALYTICS & DASHBOARD METRICS (Backed strictly by PostgreSQL aggregations)
   ========================================================================= */

router.get('/analytics/dashboard', async (req, res) => {
  try {
    const { departmentId, sector, status } = req.query;

    let filterSql = '';
    const params: any[] = [];
    if (departmentId) {
      params.push(departmentId);
      filterSql += ` AND department_id = $${params.length}`;
    }
    if (sector) {
      params.push(sector);
      filterSql += ` AND sector = $${params.length}`;
    }

    // 1. Core KPIs
    const [
      totalProblemsRes,
      activeProblemsRes,
      startupsCountRes,
      matchesCountRes,
      shortlistedCountRes,
      pilotsCountRes,
      procurementValRes,
      successfulInnovationsRes,
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM problem_statements WHERE 1=1 ${filterSql}`, params),
      query(`SELECT COUNT(*) as count FROM problem_statements WHERE status NOT IN ('DRAFT', 'CLOSED') ${filterSql}`, params),
      query('SELECT COUNT(*) as count FROM startups'),
      query('SELECT COUNT(*) as count FROM ai_matches'),
      query('SELECT COUNT(*) as count FROM applications WHERE status = $1', ['SHORTLISTED']),
      query("SELECT COUNT(*) as count FROM pilots WHERE status IN ('ACTIVE', 'APPROVED_FOR_SCALE')"),
      query('SELECT COALESCE(SUM(approved_budget), 0) as total FROM procurements'),
      query("SELECT COUNT(*) as count FROM procurements WHERE current_stage IN ('CONTRACT', 'PURCHASE_ORDER', 'IMPLEMENTATION', 'COMPLETED')"),
    ]);

    // 2. Problems by Sector
    const problemsBySectorRes = await query(
      `SELECT sector, COUNT(*) as count FROM problem_statements GROUP BY sector ORDER BY count DESC LIMIT 8`
    );

    // 3. Pipeline Funnel
    const funnelRes = await query(`
      SELECT
        (SELECT COUNT(*) FROM problem_statements) as problems,
        (SELECT COUNT(*) FROM applications) as applications,
        (SELECT COUNT(*) FROM ai_matches) as ai_matches,
        (SELECT COUNT(*) FROM applications WHERE status IN ('SHORTLISTED', 'EVALUATION', 'PILOT', 'PROCUREMENT', 'COMPLETED')) as shortlisted,
        (SELECT COUNT(*) FROM pilots) as pilots,
        (SELECT COUNT(*) FROM pilots WHERE status = 'APPROVED_FOR_SCALE') as scale_ready,
        (SELECT COUNT(*) FROM procurements) as procurement,
        (SELECT COUNT(*) FROM contracts) as contracts
    `);

    // 4. Pilot Success Rate
    const pilotStatusRes = await query(
      `SELECT status, COUNT(*) as count FROM pilots GROUP BY status`
    );

    // 5. Procurement Value by Department
    const procurementByDeptRes = await query(
      `SELECT d.name as department_name, d.code as department_code, COALESCE(SUM(pr.approved_budget), 0) as total_value
       FROM departments d
       LEFT JOIN procurements pr ON pr.department_id = d.id
       GROUP BY d.id, d.name, d.code
       ORDER BY total_value DESC`
    );

    // 6. Applications by Status
    const applicationsByStatusRes = await query(
      `SELECT status, COUNT(*) as count FROM applications GROUP BY status`
    );

    // 7. Problems by Status
    const problemsByStatusRes = await query(
      `SELECT status, COUNT(*) as count FROM problem_statements GROUP BY status`
    );

    return res.json({
      kpis: {
        totalProblems: parseInt(totalProblemsRes.rows[0]?.count || '0', 10),
        activeProblems: parseInt(activeProblemsRes.rows[0]?.count || '0', 10),
        registeredStartups: parseInt(startupsCountRes.rows[0]?.count || '0', 10),
        aiMatches: parseInt(matchesCountRes.rows[0]?.count || '0', 10),
        shortlistedStartups: parseInt(shortlistedCountRes.rows[0]?.count || '0', 10),
        activePilots: parseInt(pilotsCountRes.rows[0]?.count || '0', 10),
        procurementValue: parseFloat(procurementValRes.rows[0]?.total || '0'),
        successfulInnovations: parseInt(successfulInnovationsRes.rows[0]?.count || '0', 10),
      },
      charts: {
        problemsBySector: problemsBySectorRes.rows,
        pipelineFunnel: funnelRes.rows[0] || {},
        pilotStatus: pilotStatusRes.rows,
        procurementByDepartment: procurementByDeptRes.rows,
        applicationsByStatus: applicationsByStatusRes.rows,
        problemsByStatus: problemsByStatusRes.rows,
      },
    });
  } catch (err: any) {
    console.error('Analytics dashboard error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   14. FILE MANAGEMENT
   ========================================================================= */

router.post('/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = `file-${Date.now()}`;
    const fileUrl = `/uploads/${req.file.filename}`;

    await query(
      `INSERT INTO files (id, filename, original_name, mime_type, size, path)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [fileId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.file.path]
    );

    return res.json({
      id: fileId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* =========================================================================
   15. SYSTEM & DEMO DATA MANAGEMENT
   ========================================================================= */

router.post('/system/reset-demo', async (_req, res) => {
  try {
    await resetDatabaseToDemo();
    return res.json({ success: true, message: 'Database successfully reset to curated demo dataset.' });
  } catch (err: any) {
    console.error('System reset error:', err);
    return res.status(500).json({ error: err.message });
  }
});


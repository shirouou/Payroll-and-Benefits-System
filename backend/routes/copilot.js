const express = require('express');
const OpenAI = require('openai');
const router = express.Router();
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const Claim = require('../models/Claim');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { logDataAccess } = require('../utils/logger');

const CHAT_HISTORY_LIMIT = 20;

const scopedPayrollFilter = user => user.role === 'employee' ? { employeeId: user.employeeId } : {};
const scopedClaimFilter = user => user.role === 'employee' ? { employeeId: user.employeeId } : {};

const getChatHistory = async user => {
  const { copilotHistory = [] } = user.toObject ? user.toObject() : user;
  return Array.isArray(copilotHistory) ? copilotHistory.slice(-CHAT_HISTORY_LIMIT) : [];
};

const saveChatHistory = async (user, entry) => {
  const history = await getChatHistory(user);
  const next = [...history, entry].slice(-CHAT_HISTORY_LIMIT);
  user.copilotHistory = next;
  await user.save();
  return next;
};

const getComplianceFindings = async user => {
  const [draftPayroll, invalidAttendance, unlinkedUsers] = await Promise.all([
    Payroll.find({ ...scopedPayrollFilter(user), status: 'Draft' }).populate('employeeId', 'name'),
    Payroll.find(scopedPayrollFilter(user)).populate('employeeId', 'name'),
    user.role === 'admin' || user.role === 'hr' ? User.find({ role: 'employee', $or: [{ employeeId: { $exists: false } }, { employeeId: null }] }).select('name email') : [],
  ]);

  const findings = [];
  draftPayroll.forEach(record => findings.push({
    severity: 'warning',
    rule: 'PAYROLL_APPROVAL',
    message: `${record.employeeId?.name || 'Employee'} has payroll for ${record.paymentPeriod} still in Draft status.`,
  }));
  invalidAttendance.filter(record => record.daysWorked > record.workingDays).forEach(record => findings.push({
    severity: 'critical',
    rule: 'ATTENDANCE_RANGE',
    message: `${record.employeeId?.name || 'Employee'} has days worked greater than working days for ${record.paymentPeriod}.`,
  }));
  unlinkedUsers.forEach(account => findings.push({
    severity: 'warning',
    rule: 'EMPLOYEE_LINK',
    message: `${account.email} is an employee account without a linked employee record.`,
  }));

  return findings;
};

const inferIntent = normalizedQuestion => {
  if (normalizedQuestion.includes('draft') || normalizedQuestion.includes('approve')) return 'payroll_approval';
  if (normalizedQuestion.includes('payroll') || normalizedQuestion.includes('payslip') || normalizedQuestion.includes('net pay')) return 'payroll_summary';
  if (normalizedQuestion.includes('employee') || normalizedQuestion.includes('department') || normalizedQuestion.includes('headcount')) return 'employee_lookup';
  if (normalizedQuestion.includes('compliance') || normalizedQuestion.includes('audit') || normalizedQuestion.includes('violation')) return 'compliance_check';
  return 'unsupported';
};

const generateRuleBasedResponse = async ({ question, payroll, employees, user }) => {
  const normalized = question.toLowerCase();
  const intent = inferIntent(normalized);
  let answer;

  if (intent === 'payroll_approval') {
    const drafts = payroll.filter(record => record.status === 'Draft');
    answer = drafts.length ? `${drafts.length} payroll record(s) are still in Draft status.` : 'There are no Draft payroll records.';
  } else if (intent === 'payroll_summary') {
    const total = payroll.reduce((sum, record) => sum + (record.netPay || 0), 0);
    answer = `I found ${payroll.length} payroll record(s) with a combined net pay of PHP ${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}.`;
  } else if (intent === 'employee_lookup') {
    answer = `There are ${employees.length} employee record(s) in the system.`;
  } else if (intent === 'compliance_check') {
    const findings = await getComplianceFindings(user);
    answer = findings.length ? `${findings.length} compliance finding(s) require attention.` : 'No compliance findings were detected.';
    return { success: true, intent, answer, findings, source: 'rule-based' };
  } else {
    answer = 'I can answer questions about employees, payroll, payslips, approvals, and compliance checks.';
  }

  return { success: true, intent, answer, source: 'rule-based' };
};

const buildRoleAwareSnapshot = async user => {
  const payroll = await Payroll.find(scopedPayrollFilter(user)).populate('employeeId', 'name department position');
  const employees = user.role === 'employee' ? [] : await Employee.find().select('name department status basicSalary');
  const claims = await Claim.find(scopedClaimFilter(user)).populate('employeeId', 'name');
  const history = await getChatHistory(user);

  return {
    payroll,
    employees,
    claims,
    history,
    user: {
      role: user.role,
      name: user.name,
      email: user.email,
    },
  };
};

const generateRolePrompt = user => {
  const roleMap = {
    admin: 'You are supporting senior HR leadership. Focus on headcount, payroll totals, approval pipelines, and compliance risks.',
    hr: 'You are supporting HR operations. Focus on employee status, department summaries, policy issues, and workforce trends.',
    payroll: 'You are supporting payroll processing. Focus on payroll totals, draft records, payment status, and payroll exceptions.',
    employee: 'You are helping an employee understand their own payroll and claims context without exposing other employees\' data.',
  };

  return roleMap[user.role] || 'You are a payroll and HR assistant.';
};

const generateLlmResponse = async ({ question, payroll, employees, claims, user, history }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });
  const assistantPrompt = [
    'You are a payroll and HR copilot for a payroll and benefits system.',
    generateRolePrompt(user),
    'Use the structured data below as the source of truth.',
    'Answer only from the provided employee, payroll, claims, and compliance data.',
    'If the question is about compliance, include an explicit summary of what needs attention.',
    'Return valid JSON with keys: intent, answer.',
    'Keep answers brief, precise, and business-appropriate.',
  ].join(' ');

  const content = JSON.stringify({
    question,
    role: user.role,
    recentHistory: history.slice(-6),
    employeeCount: employees.length,
    payrollCount: payroll.length,
    claimsCount: claims.length,
    employees: employees.slice(0, 25),
    payroll: payroll.slice(0, 25),
    claims: claims.slice(0, 25),
  }, null, 2);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 300,
    messages: [
      { role: 'system', content: assistantPrompt },
      { role: 'user', content },
    ],
  });

  const text = completion.choices?.[0]?.message?.content || '';
  const parsed = safeJsonParse(text);

  if (!parsed || typeof parsed.answer !== 'string') {
    return null;
  }

  const intent = parsed.intent || inferIntent(question.toLowerCase());
  return {
    success: true,
    intent,
    answer: parsed.answer,
    source: 'llm',
  };
};

const safeJsonParse = value => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

router.post('/query', async (req, res, next) => {
  try {
    const question = String(req.body.question || '').trim();
    if (!question) throw new AppError('Question is required', 400);

    const snapshot = await buildRoleAwareSnapshot(req.user);
    const ruleBased = await generateRuleBasedResponse({
      question,
      payroll: snapshot.payroll,
      employees: snapshot.employees,
      user: req.user,
    });

    const llmPayload = await generateLlmResponse({
      question,
      payroll: snapshot.payroll,
      employees: snapshot.employees,
      claims: snapshot.claims,
      user: req.user,
      history: snapshot.history,
    });

    const response = llmPayload || ruleBased;
    const intent = response.intent || ruleBased.intent;
    const findings = response.findings || (intent === 'compliance_check' ? await getComplianceFindings(req.user) : undefined);

    await saveChatHistory(req.user, { role: 'user', text: question, createdAt: new Date().toISOString() });
    await saveChatHistory(req.user, { role: 'assistant', text: response.answer, source: response.source || 'rule-based', createdAt: new Date().toISOString() });

    logDataAccess(req.user._id, `copilot_query:${intent}`, 'copilot', req.ip);
    res.json({ success: true, intent, answer: response.answer, source: response.source || 'rule-based', ...(findings ? { findings } : {}) });
  } catch (error) {
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const history = await getChatHistory(req.user);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

router.delete('/history', async (req, res, next) => {
  try {
    req.user.copilotHistory = [];
    await req.user.save();
    res.json({ success: true, data: [] });
  } catch (error) {
    next(error);
  }
});

router.get('/compliance', async (req, res, next) => {
  try {
    const findings = await getComplianceFindings(req.user);
    logDataAccess(req.user._id, 'view_compliance', 'copilot', req.ip);
    res.json({ success: true, data: findings });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

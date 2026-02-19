import { PrismaClient, Priority, IssueCategory, StoreTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create default Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Plexo Demo',
      slug: 'demo',
      domain: 'demo.plexoapp.com',
      logoUrl: '/logo.png',
      primaryColor: '#4F46E5',
      timezone: 'America/Santo_Domingo',
      locale: 'es',
      plan: 'pro',
    },
  });

  console.log(`Organization: ${org.name} (${org.id})`);

  // 2. Seed Roles
  const roleData = [
    { key: 'OPERATIONS_MANAGER', label: 'Operations Manager', description: 'Full access to all system features', color: 'blue', level: 100, sortOrder: 1 },
    { key: 'HQ_TEAM', label: 'HQ Team', description: 'Central headquarters team', color: 'purple', level: 80, sortOrder: 2 },
    { key: 'REGIONAL_SUPERVISOR', label: 'Regional Supervisor', description: 'Supervises stores by region', color: 'green', level: 60, sortOrder: 3 },
    { key: 'STORE_MANAGER', label: 'Store Manager', description: 'Full management of a single store', color: 'orange', level: 40, sortOrder: 4 },
    { key: 'DEPT_SUPERVISOR', label: 'Department Supervisor', description: 'Supervises a department within a store', color: 'gray', level: 20, sortOrder: 5 },
  ];

  for (const role of roleData) {
    await prisma.role.upsert({
      where: { organizationId_key: { organizationId: org.id, key: role.key } },
      update: { label: role.label, description: role.description, color: role.color, level: role.level, sortOrder: role.sortOrder },
      create: { ...role, organizationId: org.id },
    });
  }

  console.log(`Seeded ${roleData.length} roles`);

  // 3. Create Departments
  const deptData = [
    { name: 'Electronics', code: 'ELEC' },
    { name: 'Grocery', code: 'GROC' },
    { name: 'Furniture', code: 'FURN' },
    { name: 'Home & Living', code: 'HOME' },
    { name: 'Fashion', code: 'FASH' },
    { name: 'Hardware', code: 'HDWR' },
    { name: 'General', code: 'GEN' },
  ];

  const departments = await Promise.all(
    deptData.map((dept) =>
      prisma.department.upsert({
        where: { organizationId_code: { organizationId: org.id, code: dept.code } },
        update: {},
        create: { ...dept, organizationId: org.id },
      })
    )
  );

  console.log(`Created ${departments.length} departments`);

  // 4. Create Regions
  const regions: Record<string, any> = {};
  const regionNames = ['North', 'South', 'East', 'West', 'Central'];

  for (const name of regionNames) {
    const id = `region-${name.toLowerCase().replace(/ /g, '-')}`;
    regions[name] = await prisma.region.upsert({
      where: { id },
      update: {},
      create: { id, name, organizationId: org.id },
    });
  }

  console.log(`Created ${regionNames.length} regions`);

  // 5. Create sample stores
  const storeData = [
    { code: 'DC-001', name: 'Distribution Center', region: 'Central', address: '100 Warehouse Blvd' },
    { code: 'STR-001', name: 'Downtown Flagship', region: 'Central', address: '1 Main Street' },
    { code: 'STR-002', name: 'North Mall', region: 'North', address: '200 Commerce Ave' },
    { code: 'STR-003', name: 'South Plaza', region: 'South', address: '300 Market Road' },
    { code: 'STR-004', name: 'East Side', region: 'East', address: '400 Retail Lane' },
    { code: 'STR-005', name: 'West End', region: 'West', address: '500 Shopping Drive' },
  ];

  const stores = await Promise.all(
    storeData.map((store) =>
      prisma.store.upsert({
        where: { organizationId_code: { organizationId: org.id, code: store.code } },
        update: {},
        create: {
          name: store.name,
          code: store.code,
          address: store.address,
          regionId: regions[store.region].id,
          organizationId: org.id,
        },
      })
    )
  );

  console.log(`Created ${stores.length} stores`);

  // 6. Create sample users
  const passwordHash = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@demo.plexoapp.com' } },
    update: { isSuperAdmin: true },
    create: {
      email: 'admin@demo.plexoapp.com',
      passwordHash,
      name: 'Admin User',
      role: 'OPERATIONS_MANAGER',
      isSuperAdmin: true,
      organizationId: org.id,
    },
  });

  const hqUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'hq@demo.plexoapp.com' } },
    update: {},
    create: {
      email: 'hq@demo.plexoapp.com',
      passwordHash,
      name: 'HQ Team Member',
      role: 'HQ_TEAM',
      organizationId: org.id,
    },
  });

  const regionalSupervisor = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'regional@demo.plexoapp.com' } },
    update: {},
    create: {
      email: 'regional@demo.plexoapp.com',
      passwordHash,
      name: 'Regional Supervisor',
      role: 'REGIONAL_SUPERVISOR',
      organizationId: org.id,
    },
  });

  await prisma.region.update({
    where: { id: regions['Central'].id },
    data: { supervisorId: regionalSupervisor.id },
  });

  const flagshipStore = stores.find((s) => s.code === 'STR-001');

  const storeManager = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'manager@demo.plexoapp.com' } },
    update: {
      issueCategories: [IssueCategory.MAINTENANCE, IssueCategory.CLEANING, IssueCategory.PERSONNEL, IssueCategory.INVENTORY],
    },
    create: {
      email: 'manager@demo.plexoapp.com',
      passwordHash,
      name: 'Store Manager',
      role: 'STORE_MANAGER',
      storeId: flagshipStore?.id,
      issueCategories: [IssueCategory.MAINTENANCE, IssueCategory.CLEANING, IssueCategory.PERSONNEL, IssueCategory.INVENTORY],
      organizationId: org.id,
    },
  });

  const deptSupervisor = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'supervisor@demo.plexoapp.com' } },
    update: {
      issueCategories: [IssueCategory.IT_SYSTEMS, IssueCategory.SECURITY],
    },
    create: {
      email: 'supervisor@demo.plexoapp.com',
      passwordHash,
      name: 'Department Supervisor',
      role: 'DEPT_SUPERVISOR',
      storeId: flagshipStore?.id,
      departmentId: departments[0].id,
      issueCategories: [IssueCategory.IT_SYSTEMS, IssueCategory.SECURITY],
      organizationId: org.id,
    },
  });

  console.log('Created 5 sample users');

  // 7. Seed RoleModuleAccess
  const modules = [
    'tasks', 'receiving', 'issues', 'verification', 'checklists',
    'audits', 'corrective_actions', 'planograms', 'campaigns',
    'communications', 'gamification', 'reports', 'stores', 'users',
    'training',
  ];

  const defaultAccess: Record<string, Record<string, boolean>> = {
    OPERATIONS_MANAGER:  { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: true, users: true, training: true },
    HQ_TEAM:             { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: true, gamification: true, reports: true, stores: false, users: false, training: true },
    REGIONAL_SUPERVISOR: { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: true, stores: false, users: false, training: true },
    STORE_MANAGER:       { tasks: true, receiving: true, issues: true, verification: true, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: true },
    DEPT_SUPERVISOR:     { tasks: true, receiving: true, issues: true, verification: false, checklists: true, audits: true, corrective_actions: true, planograms: true, campaigns: true, communications: false, gamification: true, reports: false, stores: false, users: false, training: false },
  };

  let accessCount = 0;
  for (const [role, moduleMap] of Object.entries(defaultAccess)) {
    for (const [mod, hasAccess] of Object.entries(moduleMap)) {
      await prisma.roleModuleAccess.upsert({
        where: { organizationId_role_module: { organizationId: org.id, role, module: mod } },
        update: { hasAccess },
        create: { role, module: mod, hasAccess, organizationId: org.id },
      });
      accessCount++;
    }
  }

  console.log(`Seeded ${accessCount} role-module access rows`);

  // 8. Assign store tiers
  for (const store of stores) {
    const userCount = await prisma.user.count({
      where: { storeId: store.id, isActive: true },
    });
    const tier: StoreTier = userCount <= 15 ? 'SMALL' : userCount <= 40 ? 'MEDIUM' : 'LARGE';
    await prisma.store.update({
      where: { id: store.id },
      data: { tier },
    });
  }
  console.log(`Assigned tiers to ${stores.length} stores`);

  // 9. Create StoreDepartment rows
  let sdCount = 0;
  for (const store of stores) {
    for (const dept of departments) {
      await prisma.storeDepartment.upsert({
        where: { storeId_departmentId: { storeId: store.id, departmentId: dept.id } },
        update: { isActive: true },
        create: { storeId: store.id, departmentId: dept.id, isActive: true },
      });
      sdCount++;
    }
  }
  console.log(`Created ${sdCount} store-department mappings`);

  // 10. Initialize StorePoints
  for (const store of stores) {
    const userCount = await prisma.user.count({
      where: { storeId: store.id, isActive: true },
    });
    await prisma.storePoints.upsert({
      where: { storeId: store.id },
      update: { activeEmployeeCount: userCount },
      create: { storeId: store.id, activeEmployeeCount: userCount, organizationId: org.id },
    });
  }
  console.log(`Initialized StorePoints for ${stores.length} stores`);

  // 11. Seed gamification config
  const pointConfigs = [
    { actionType: 'TASK_COMPLETED', points: 10, description: 'Complete a task' },
    { actionType: 'ON_TIME_COMPLETION', points: 5, description: 'Complete a task before deadline' },
    { actionType: 'ISSUE_REPORTED', points: 5, description: 'Report an issue' },
    { actionType: 'ISSUE_RESOLVED', points: 15, description: 'Resolve an issue' },
    { actionType: 'CHECKLIST_COMPLETED', points: 10, description: 'Complete a checklist' },
    { actionType: 'AUDIT_COMPLETED', points: 20, description: 'Complete an audit' },
    { actionType: 'TRAINING_COMPLETED', points: 25, description: 'Complete a training course' },
    { actionType: 'CAMPAIGN_SUBMITTED', points: 10, description: 'Submit a campaign' },
    { actionType: 'PERFECT_DAY', points: 50, description: 'Complete all tasks in a day' },
  ];

  for (const config of pointConfigs) {
    await prisma.pointConfig.upsert({
      where: { organizationId_actionType: { organizationId: org.id, actionType: config.actionType } },
      update: { points: config.points, description: config.description },
      create: { ...config, actionType: config.actionType, organizationId: org.id },
    });
  }
  console.log(`Seeded ${pointConfigs.length} gamification point configs`);

  // 12. Seed badges
  const badges = [
    { name: 'First Steps', description: 'Complete your first task', iconUrl: '/badges/first-steps.png', criteria: { type: 'count', actionType: 'TASK_COMPLETED', threshold: 1 } },
    { name: 'Task Master', description: 'Complete 100 tasks', iconUrl: '/badges/task-master.png', criteria: { type: 'count', actionType: 'TASK_COMPLETED', threshold: 100 } },
    { name: 'Quick Responder', description: 'Resolve 10 issues', iconUrl: '/badges/quick-responder.png', criteria: { type: 'count', actionType: 'ISSUE_RESOLVED', threshold: 10 } },
    { name: 'Audit Pro', description: 'Complete 10 store audits', iconUrl: '/badges/audit-pro.png', criteria: { type: 'count', actionType: 'AUDIT_COMPLETED', threshold: 10 } },
    { name: 'Scholar', description: 'Complete 5 training courses', iconUrl: '/badges/scholar.png', criteria: { type: 'count', actionType: 'TRAINING_COMPLETED', threshold: 5 } },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { organizationId_name: { organizationId: org.id, name: badge.name } },
      update: {},
      create: { ...badge, organizationId: org.id },
    });
  }
  console.log(`Seeded ${badges.length} badges`);

  // 13. Create platform admin user (cross-org, manages all organizations)
  const platformAdminHash = await bcrypt.hash('admin123', 10);
  const platformAdmin = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'platform@plexoapp.com' } },
    update: { isPlatformAdmin: true, isSuperAdmin: true },
    create: {
      email: 'platform@plexoapp.com',
      passwordHash: platformAdminHash,
      name: 'Platform Admin',
      role: 'OPERATIONS_MANAGER',
      isSuperAdmin: true,
      isPlatformAdmin: true,
      organizationId: org.id,
    },
  });
  console.log(`Platform admin: ${platformAdmin.email}`);

  console.log('');
  console.log('Sample login credentials (password: admin123):');
  console.log('   - Platform Admin:      platform@plexoapp.com');
  console.log('   - Operations Manager:  admin@demo.plexoapp.com');
  console.log('   - HQ Team:             hq@demo.plexoapp.com');
  console.log('   - Regional Supervisor: regional@demo.plexoapp.com');
  console.log('   - Store Manager:       manager@demo.plexoapp.com');
  console.log('   - Dept Supervisor:     supervisor@demo.plexoapp.com');
  console.log('');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

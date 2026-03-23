'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader, ErrorBanner, DataTablePagination } from '@/components/ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api/admin';
import type {
  AdminAuditLog,
  AdminPermission,
  AdminRole,
  AdminSetting,
  AdminUser,
  PermissionAction,
  PermissionSubject,
  RoleCode,
} from '@/lib/api/admin/types';
import { RequireAuth } from '@/components/auth';
import { Shield, Users, FileText, Settings, BookOpen, RefreshCw, Save, Plus } from 'lucide-react';

type TabName = 'users' | 'roles' | 'audit' | 'settings' | 'references';

const roleLabels: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGER: 'Руководитель',
  DISPATCHER: 'Диспетчер',
  SALES: 'Продажи',
  OPERATOR: 'Оператор',
  DRIVER: 'Водитель',
  CLIENT: 'Клиент',
};

export default function AdminPage() {
  return (
    <RequireAuth roles={['ADMIN']}>
      <AdminPageContent />
    </RequireAuth>
  );
}

function AdminPageContent() {
  const [tab, setTab] = useState<TabName>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [references, setReferences] = useState<Array<{ key: string; title: string; path: string }>>(
    []
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRoleCode, setSelectedRoleCode] = useState<RoleCode | null>(null);
  const [selectedSettingKey, setSelectedSettingKey] = useState<string | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditTake, setAuditTake] = useState(20);
  const [creatingUser, setCreatingUser] = useState(false);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const selectedRole = roles.find((role) => role.code === selectedRoleCode) || null;
  const selectedSetting = settings.find((item) => item.key === selectedSettingKey) || null;

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedUserId && users[0] && !creatingUser) setSelectedUserId(users[0].id);
    if (!selectedRoleCode && roles[0]) setSelectedRoleCode(roles[0].code);
    if (!selectedSettingKey && settings[0]) setSelectedSettingKey(settings[0].key);
  }, [users, roles, settings, selectedUserId, selectedRoleCode, selectedSettingKey, creatingUser]);

  useEffect(() => {
    if (tab === 'audit') {
      void loadAudit(auditPage, auditTake);
    }
  }, [tab, auditPage, auditTake]);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes, settingsRes, refsRes, auditRes] = await Promise.all([
        adminApi.getUsers({ page: 1, take: 200 }),
        adminApi.getRoles(),
        adminApi.getSettings(),
        adminApi.getReferenceCatalog(),
        adminApi.getAuditLogs({ page: 1, take: auditTake }),
      ]);
      setUsers(usersRes.users);
      setRoles(rolesRes.roles);
      setPermissions(rolesRes.permissions);
      setSettings(settingsRes.settings);
      setReferences(refsRes.sections);
      setAuditLogs(auditRes.logs);
      setAuditTotal(auditRes.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить администрирование');
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit(page: number, take: number) {
    try {
      const res = await adminApi.getAuditLogs({ page, take });
      setAuditLogs(res.logs);
      setAuditTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить аудит');
    }
  }

  async function refresh() {
    setCreatingUser(false);
    await loadAll();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Администрирование"
        description="Пользователи, роли, права, аудит и параметры системы"
        actions={[{ label: 'Обновить', onClick: refresh, icon: RefreshCw }]}
      />

      {error && <ErrorBanner message={error} />}

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabName)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="roles">Роли</TabsTrigger>
          <TabsTrigger value="audit">Аудит</TabsTrigger>
          <TabsTrigger value="settings">Параметры</TabsTrigger>
          <TabsTrigger value="references">Справочники</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UsersPanel
            users={users}
            roles={roles}
            selectedUser={selectedUser}
            onCreateNew={() => setCreatingUser(true)}
            onSelectUser={setSelectedUserId}
            onSaved={refresh}
          />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RolesPanel
            roles={roles}
            permissions={permissions}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRoleCode}
            onSaved={refresh}
          />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditPanel
            logs={auditLogs}
            total={auditTotal}
            page={auditPage}
            take={auditTake}
            onPageChange={setAuditPage}
            onTakeChange={(next) => {
              setAuditPage(1);
              setAuditTake(next);
            }}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsPanel
            settings={settings}
            selectedSetting={selectedSetting}
            onSelectSetting={setSelectedSettingKey}
            onSaved={refresh}
          />
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          <ReferencesPanel sections={references} />
        </TabsContent>
      </Tabs>

      {loading && <p className="text-sm text-muted-foreground">Загрузка...</p>}
    </div>
  );
}

function UsersPanel({
  users,
  roles,
  selectedUser,
  onCreateNew,
  onSelectUser,
  onSaved,
}: {
  users: AdminUser[];
  roles: AdminRole[];
  selectedUser: AdminUser | null;
  onCreateNew: () => void;
  onSelectUser: (id: string | null) => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    filialId: '',
    roleCodes: [] as RoleCode[],
  });

  useEffect(() => {
    if (selectedUser) {
      setMode('edit');
      setForm({
        email: selectedUser.email,
        password: '',
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        middleName: selectedUser.middleName || '',
        phone: selectedUser.phone || '',
        filialId: selectedUser.filialId || '',
        roleCodes: selectedUser.roles.map((role) => role.code),
      });
    } else {
      setMode('create');
      setForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        filialId: '',
        roleCodes: [],
      });
    }
  }, [selectedUser]);

  const roleOptions = roles.map((role) => role.code);

  async function save() {
    if (mode === 'create') {
      await adminApi.createUser({
        ...form,
        roleCodes: form.roleCodes,
        filialId: form.filialId || undefined,
      });
    } else if (selectedUser) {
      await adminApi.updateUser(selectedUser.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        phone: form.phone || undefined,
        filialId: form.filialId || undefined,
      });
      await adminApi.assignUserRoles(selectedUser.id, {
        roleCodes: form.roleCodes,
        filialId: form.filialId || undefined,
      });
      if (form.password) await adminApi.updateUserPassword(selectedUser.id, form.password);
    }
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Пользователи
          </CardTitle>
          <CardDescription>Создание и управление пользователями</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Роли</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  className="cursor-pointer"
                >
                  <TableCell>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.code} variant="secondary">
                          {roleLabels[role.code] || role.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{user.isActive ? 'Активен' : 'Отключён'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Новый пользователь' : 'Редактирование пользователя'}
          </CardTitle>
          <CardDescription>
            {selectedUser ? selectedUser.email : 'Заполните данные для создания'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Имя"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
            <Input
              placeholder="Фамилия"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={mode === 'edit'}
            />
            <Input
              placeholder="Телефон"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              placeholder="Филиал ID"
              value={form.filialId}
              onChange={(e) => setForm({ ...form, filialId: e.target.value })}
            />
            <Input
              placeholder={mode === 'create' ? 'Пароль' : 'Новый пароль'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Отчество"
            value={form.middleName}
            onChange={(e) => setForm({ ...form, middleName: e.target.value })}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Роли</p>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((code) => (
                <label key={code} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <Checkbox
                    checked={form.roleCodes.includes(code)}
                    onCheckedChange={(checked) => {
                      setForm({
                        ...form,
                        roleCodes: checked
                          ? [...form.roleCodes, code]
                          : form.roleCodes.filter((value) => value !== code),
                      });
                    }}
                  />
                  {roleLabels[code] || code}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onCreateNew();
                setMode('create');
                onSelectUser(null);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Новый
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RolesPanel({
  roles,
  permissions,
  selectedRole,
  onSelectRole,
  onSaved,
}: {
  roles: AdminRole[];
  permissions: AdminPermission[];
  selectedRole: AdminRole | null;
  onSelectRole: (code: RoleCode) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    isActive: true,
    permissions: new Set<string>() as Set<string>,
  });

  useEffect(() => {
    if (selectedRole) {
      setForm({
        name: selectedRole.name,
        description: selectedRole.description || '',
        isActive: selectedRole.isActive,
        permissions: new Set(
          selectedRole.permissions.map((permission) => `${permission.subject}:${permission.action}`)
        ),
      });
    }
  }, [selectedRole]);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, AdminPermission[]>>((acc, permission) => {
      acc[permission.subject] = acc[permission.subject] || [];
      acc[permission.subject].push(permission);
      return acc;
    }, {});
  }, [permissions]);

  async function save() {
    if (!selectedRole) return;
    await adminApi.updateRole(selectedRole.code, {
      name: form.name,
      description: form.description,
      isActive: form.isActive,
      permissions: Array.from(form.permissions).map((pair) => {
        const [subject, action] = pair.split(':') as [PermissionSubject, PermissionAction];
        return { subject, action };
      }),
    });
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Роли
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {roles.map((role) => (
            <button
              key={role.code}
              className={`w-full rounded-md border p-3 text-left ${selectedRole?.code === role.code ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => onSelectRole(role.code)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{role.name}</span>
                <Badge variant="secondary">{role.usersCount}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">{role.code}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Права роли</CardTitle>
          <CardDescription>{selectedRole?.code || 'Выберите роль'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Название"
            />
            <Input value={selectedRole?.code || ''} disabled />
          </div>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание"
          />
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([subject, list]) => (
              <div key={subject} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{subject}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const next = new Set(form.permissions);
                      const selected = list.every((item) =>
                        next.has(`${item.subject}:${item.action}`)
                      );
                      list.forEach((item) => {
                        const key = `${item.subject}:${item.action}`;
                        selected ? next.delete(key) : next.add(key);
                      });
                      setForm({ ...form, permissions: next });
                    }}
                  >
                    {list.every((item) => form.permissions.has(`${item.subject}:${item.action}`))
                      ? 'Снять все'
                      : 'Выбрать все'}
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {list.map((permission) => {
                    const key = `${permission.subject}:${permission.action}`;
                    return (
                      <label key={key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.permissions.has(key)}
                          onCheckedChange={(checked) => {
                            const next = new Set(form.permissions);
                            checked ? next.add(key) : next.delete(key);
                            setForm({ ...form, permissions: next });
                          }}
                        />
                        {permission.action}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <Button onClick={save} disabled={!selectedRole}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить права
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditPanel({
  logs,
  total,
  page,
  take,
  onPageChange,
  onTakeChange,
}: {
  logs: AdminAuditLog[];
  total: number;
  page: number;
  take: number;
  onPageChange: (page: number) => void;
  onTakeChange: (take: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Журнал аудита
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Событие</TableHead>
              <TableHead>Сущность</TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.entityType || '—'}</TableCell>
                <TableCell>
                  {log.user ? `${log.user.firstName} ${log.user.lastName}` : '—'}
                </TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString('ru-RU')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-4">
          <DataTablePagination
            totalItems={total}
            pageSize={take}
            currentPage={page}
            onPageChange={onPageChange}
          />
          <div className="mt-3 flex gap-2">
            {[20, 50, 100].map((size) => (
              <Button key={size} variant="outline" size="sm" onClick={() => onTakeChange(size)}>
                {size}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsPanel({
  settings,
  selectedSetting,
  onSelectSetting,
  onSaved,
}: {
  settings: AdminSetting[];
  selectedSetting: AdminSetting | null;
  onSelectSetting: (key: string) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    section: '',
    description: '',
    isActive: true,
    isSystem: false,
    value: '{}',
  });

  useEffect(() => {
    if (selectedSetting) {
      setForm({
        title: selectedSetting.title,
        section: selectedSetting.section,
        description: selectedSetting.description || '',
        isActive: selectedSetting.isActive,
        isSystem: selectedSetting.isSystem,
        value: JSON.stringify(selectedSetting.value, null, 2),
      });
    }
  }, [selectedSetting]);

  async function save() {
    if (!selectedSetting) return;
    await adminApi.updateSetting(selectedSetting.key, {
      title: form.title,
      section: form.section,
      description: form.description,
      isActive: form.isActive,
      isSystem: form.isSystem,
      value: JSON.parse(form.value || '{}'),
    });
    await onSaved();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Параметры
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {settings.map((setting) => (
            <button
              key={setting.key}
              onClick={() => onSelectSetting(setting.key)}
              className={`w-full rounded-md border p-3 text-left ${selectedSetting?.key === setting.key ? 'border-primary bg-primary/5' : ''}`}
            >
              <div className="font-medium">{setting.title}</div>
              <div className="text-xs text-muted-foreground">{setting.key}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Редактирование параметра</CardTitle>
          <CardDescription>{selectedSetting?.key || 'Выберите параметр'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Заголовок"
            />
            <Input
              value={form.section}
              onChange={(e) => setForm({ ...form, section: e.target.value })}
              placeholder="Раздел"
            />
          </div>
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Описание"
          />
          <Textarea
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            className="font-mono text-xs"
          />
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
              />
              Активен
            </label>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={form.isSystem}
                onCheckedChange={(checked) => setForm({ ...form, isSystem: !!checked })}
              />
              Системный
            </label>
          </div>
          <Button onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ReferencesPanel({
  sections,
}: {
  sections: Array<{ key: string; title: string; path: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sections.map((section) => (
        <Card key={section.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={section.path} className="text-primary hover:underline">
              Открыть справочник
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

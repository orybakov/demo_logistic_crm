'use client';

import { useState } from 'react';
import {
  PageHeader,
  StatCard,
  DataTable,
  DataTableFilters,
  DataTablePagination,
  DataTableRow,
  DataTableCell,
} from '@/components/ui';
import { NoResults } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Building2, Phone, Mail, FileText, Edit, Trash2, Eye, Users } from 'lucide-react';

const mockClients = [
  {
    id: '1',
    name: 'ООО ТрансЛогистик',
    inn: '7712345678',
    kpp: '771201001',
    address: 'г. Москва, ул. Промышленная, д. 15',
    phone: '+7 (495) 123-45-67',
    email: 'info@translog.ru',
    contactPerson: 'Иванов Иван Иванович',
    contractsCount: 3,
    ordersCount: 45,
    isActive: true,
  },
  {
    id: '2',
    name: 'ИП Сидоров А.В.',
    inn: '5032045678',
    kpp: '',
    address: 'г. Краснодар, ул. Красная, д. 100',
    phone: '+7 (861) 234-56-78',
    email: 'sidorov@email.ru',
    contactPerson: 'Сидоров А.В.',
    contractsCount: 1,
    ordersCount: 12,
    isActive: true,
  },
  {
    id: '3',
    name: 'ООО МирЛогистики',
    inn: '6655432109',
    kpp: '665501001',
    address: 'г. Екатеринбург, пр. Ленина, д. 50',
    phone: '+7 (343) 345-67-89',
    email: 'info@mirlog.ru',
    contactPerson: 'Петрова Мария Сергеевна',
    contractsCount: 2,
    ordersCount: 28,
    isActive: true,
  },
  {
    id: '4',
    name: 'ЗАО Рога и Копыта',
    inn: '7701020304',
    kpp: '770101001',
    address: 'г. Москва, ул. Центральная, д. 1',
    phone: '+7 (495) 987-65-43',
    email: 'contact@rk.ru',
    contactPerson: 'Смирнова Ольга Петровна',
    contractsCount: 5,
    ordersCount: 67,
    isActive: false,
  },
  {
    id: '5',
    name: 'ООО АльфаТранс',
    inn: '7725012345',
    kpp: '772501001',
    address: 'г. Москва, ш. Энтузиастов, д. 30',
    phone: '+7 (495) 111-22-33',
    email: 'info@alfatrans.ru',
    contactPerson: 'Козлов Дмитрий Николаевич',
    contractsCount: 2,
    ordersCount: 34,
    isActive: true,
  },
];

const statusOptions = [
  { label: 'Все', value: 'all' },
  { label: 'Активные', value: 'true' },
  { label: 'Неактивные', value: 'false' },
];

type ClientRecord = (typeof mockClients)[number];

const emptyClientForm = {
  name: '',
  inn: '',
  kpp: '',
  address: '',
  phone: '',
  email: '',
  contactPerson: '',
};

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [editForm, setEditForm] = useState(emptyClientForm);
  const [createForm, setCreateForm] = useState(emptyClientForm);
  const safeClients = Array.isArray(clients) ? clients : [];

  const filteredClients = safeClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.inn.includes(searchQuery);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'true' && client.isActive) ||
      (statusFilter === 'false' && !client.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleViewClient = (client: ClientRecord) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleEditClient = (client: ClientRecord) => {
    setSelectedClient(client);
    setEditForm({
      name: client.name,
      inn: client.inn,
      kpp: client.kpp,
      address: client.address,
      phone: client.phone,
      email: client.email,
      contactPerson: client.contactPerson,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveClient = () => {
    if (!selectedClient) return;

    setClients((current) =>
      current.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              name: editForm.name,
              inn: editForm.inn,
              kpp: editForm.kpp,
              address: editForm.address,
              phone: editForm.phone,
              email: editForm.email,
              contactPerson: editForm.contactPerson,
            }
          : client
      )
    );
    setIsEditDialogOpen(false);
    setIsViewDialogOpen(false);
  };

  const handleCreateClient = () => {
    if (!createForm.name.trim() || !createForm.inn.trim()) return;

    const nextClient: ClientRecord = {
      id: String(Date.now()),
      name: createForm.name.trim(),
      inn: createForm.inn.trim(),
      kpp: createForm.kpp.trim(),
      address: createForm.address.trim(),
      phone: createForm.phone.trim(),
      email: createForm.email.trim(),
      contactPerson: createForm.contactPerson.trim(),
      contractsCount: 0,
      ordersCount: 0,
      isActive: true,
    };

    setClients((current) => [nextClient, ...current]);
    setCreateForm(emptyClientForm);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteClient = (clientId: string) => {
    setClients(safeClients.filter((c) => c.id !== clientId));
  };

  const activeClients = safeClients.filter((c) => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Всего клиентов" value={safeClients.length} icon={Building2} />
        <StatCard label="Активных" value={activeClients} icon={Users} />
        <StatCard
          label="Договоров"
          value={safeClients.reduce((sum, c) => sum + c.contractsCount, 0)}
          icon={FileText}
        />
        <StatCard
          label="Заказов"
          value={safeClients.reduce((sum, c) => sum + c.ordersCount, 0)}
          icon={FileText}
        />
      </div>

      <div>
        <PageHeader
          title="Клиенты"
          description="Справочник клиентов и контрагентов"
          actions={[
            {
              label: 'Новый клиент',
              icon: Plus,
              onClick: () => setIsCreateDialogOpen(true),
            },
          ]}
        />

        <DataTableFilters
          searchPlaceholder="Поиск по названию или ИНН..."
          onSearch={setSearchQuery}
          filters={[
            {
              key: 'status',
              label: 'Статус',
              options: statusOptions,
              value: statusFilter,
              onChange: setStatusFilter,
            },
          ]}
        />

        {filteredClients.length === 0 ? (
          <NoResults searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
        ) : (
          <DataTable>
            <div className="divide-y divide-border">
              {filteredClients.map((client) => (
                <DataTableRow key={client.id}>
                  <DataTableCell className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">ИНН: {client.inn}</p>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="hidden md:flex">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                    </div>
                  </DataTableCell>
                  <DataTableCell className="w-24">
                    <StatusBadge status={client.isActive ? 'Активен' : 'Неактивен'} />
                  </DataTableCell>
                  <DataTableCell className="w-32 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditClient(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClient(client.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </div>
            <DataTablePagination
              totalItems={filteredClients.length}
              pageSize={10}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </DataTable>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Новый клиент</DialogTitle>
            <DialogDescription>Добавление нового клиента в справочник</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Название организации *</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="ООО Название компании"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inn">ИНН *</Label>
                <Input
                  id="inn"
                  value={createForm.inn}
                  onChange={(e) => setCreateForm({ ...createForm, inn: e.target.value })}
                  placeholder="7712345678"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kpp">КПП</Label>
                <Input
                  id="kpp"
                  value={createForm.kpp}
                  onChange={(e) => setCreateForm({ ...createForm, kpp: e.target.value })}
                  placeholder="771201001"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                placeholder="г. Москва, ул. ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+7 (495) 123-45-67"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="email@company.ru"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact">Контактное лицо</Label>
              <Input
                id="contact"
                value={createForm.contactPerson}
                onChange={(e) => setCreateForm({ ...createForm, contactPerson: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateClient}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedClient?.name}</DialogTitle>
            <DialogDescription>
              {selectedClient && (
                <StatusBadge status={selectedClient.isActive ? 'Активен' : 'Неактивен'} />
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Реквизиты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ИНН:</span>
                      <span>{selectedClient.inn}</span>
                    </div>
                    {selectedClient.kpp && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">КПП:</span>
                        <span>{selectedClient.kpp}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Контакты</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Адрес</p>
                <p>{selectedClient.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Контактное лицо</p>
                <p>{selectedClient.contactPerson}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{selectedClient.contractsCount}</p>
                  <p className="text-sm text-muted-foreground">Договоров</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedClient.ordersCount}</p>
                  <p className="text-sm text-muted-foreground">Заказов</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={() => selectedClient && handleEditClient(selectedClient)}>
              Редактировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактирование клиента</DialogTitle>
            <DialogDescription>Измените данные клиента и сохраните их</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Название организации *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-inn">ИНН *</Label>
                <Input
                  id="edit-inn"
                  value={editForm.inn}
                  onChange={(e) => setEditForm({ ...editForm, inn: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-kpp">КПП</Label>
                <Input
                  id="edit-kpp"
                  value={editForm.kpp}
                  onChange={(e) => setEditForm({ ...editForm, kpp: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Адрес</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Телефон</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-contact">Контактное лицо</Label>
              <Input
                id="edit-contact"
                value={editForm.contactPerson}
                onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveClient}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

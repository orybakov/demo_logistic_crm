import type { OnModuleInit } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { RoleCode, PermissionSubject, PermissionAction } from "@prisma/client";
import * as bcrypt from "bcrypt";

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const isSeeded = await this.prisma.role.findFirst();
    if (isSeeded) {
      return;
    }

    console.log("🌱 Seeding database...");

    await this.seedPermissions();
    await this.seedRoles();
    await this.seedFilials();
    await this.seedUsers();
    await this.seedCargoTypes();
    await this.seedLocations();
    await this.seedWarehouses();
    await this.seedTariffs();
    await this.seedClients();
    await this.seedVehicles();
    await this.seedDrivers();
    await this.seedVehicleTypes();
    await this.seedFuelTypes();
    await this.seedStatuses();
    await this.seedFlags();
    await this.seedClassifiers();
    await this.seedProblemReasons();
    await this.seedRecipients();
    await this.seedSystemSettings();

    console.log("✅ Seeding completed!");
  }

  private async seedFilials() {
    const filials = [
      {
        code: "MOSCOW",
        name: "Московский филиал",
        shortName: "МСК",
        address: "г. Москва, ул. Транспортная, д. 1",
        phone: "+7 (495) 123-45-67",
        email: "moscow@logistics.local",
        isHead: true,
      },
      {
        code: "SPB",
        name: "Санкт-Петербургский филиал",
        shortName: "СПБ",
        address: "г. Санкт-Петербург, Невский пр., д. 100",
        phone: "+7 (812) 987-65-43",
        email: "spb@logistics.local",
        isHead: false,
      },
      {
        code: "KAZAN",
        name: "Казанский филиал",
        shortName: "КЗН",
        address: "г. Казань, ул. Гвардейская, д. 15",
        phone: "+7 (843) 555-12-34",
        email: "kazan@logistics.local",
        isHead: false,
      },
    ];

    for (const filial of filials) {
      await this.prisma.filial.upsert({
        where: { code: filial.code },
        update: {},
        create: filial,
      });
    }

    console.log(`   ✓ Created ${filials.length} filials`);
  }

  private async seedCargoTypes() {
    const cargoTypes = [
      {
        code: "GENERAL",
        name: "Генеральный груз",
        category: "general",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "FRAGILE",
        name: "Хрупкий груз",
        category: "special",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "REFRIGERATED",
        name: "Рефрижераторный груз",
        category: "temperature",
        isHazardous: false,
        requiresTemp: true,
        minTemp: -25,
        maxTemp: 5,
      },
      {
        code: "FROZEN",
        name: "Замороженный груз",
        category: "temperature",
        isHazardous: false,
        requiresTemp: true,
        minTemp: -30,
        maxTemp: -18,
      },
      {
        code: "HAZMAT",
        name: "Опасный груз (ADR)",
        category: "hazardous",
        isHazardous: true,
        requiresTemp: false,
      },
      {
        code: "LIQUID",
        name: "Жидкий груз",
        category: "special",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "LIVESTOCK",
        name: "Живой скот",
        category: "special",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "VEHICLES",
        name: "Автомобили",
        category: "oversized",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "CONSTRUCTION",
        name: "Строительные материалы",
        category: "bulk",
        isHazardous: false,
        requiresTemp: false,
      },
      {
        code: "ELECTRONICS",
        name: "Электроника",
        category: "valuable",
        isHazardous: false,
        requiresTemp: false,
      },
    ];

    for (const cargo of cargoTypes) {
      await this.prisma.cargoType.upsert({
        where: { code: cargo.code },
        update: {},
        create: cargo,
      });
    }

    console.log(`   ✓ Created ${cargoTypes.length} cargo types`);
  }

  private async seedLocations() {
    const locations = [
      {
        name: "Склад Москва Север",
        type: "warehouse",
        address: "г. Москва, ул. Дмитровское шоссе, д. 100",
        city: "Москва",
        region: "Москва",
        postalCode: "127238",
        latitude: 55.8637,
        longitude: 37.5423,
        workingHours: "Пн-Пт: 09:00-18:00",
      },
      {
        name: "Склад Москва Юг",
        type: "warehouse",
        address: "г. Москва, ул. Каширское шоссе, д. 67",
        city: "Москва",
        region: "Москва",
        postalCode: "115393",
        latitude: 55.6426,
        longitude: 37.6386,
        workingHours: "Пн-Пт: 09:00-18:00",
      },
      {
        name: "Склад СПб Центр",
        type: "warehouse",
        address: "г. Санкт-Петербург, ул. Обводного канала, д. 14",
        city: "Санкт-Петербург",
        region: "Санкт-Петербург",
        postalCode: "191119",
        latitude: 59.9167,
        longitude: 30.3347,
        workingHours: "Пн-Пт: 08:00-17:00",
      },
      {
        name: "Склад Казань",
        type: "warehouse",
        address: "г. Казань, ул. Горьковское шоссе, д. 26",
        city: "Казань",
        region: "Татарстан",
        postalCode: "420095",
        latitude: 55.8231,
        longitude: 49.1337,
        workingHours: "Пн-Пт: 08:00-17:00",
      },
      {
        name: "Терминал Внуково",
        type: "terminal",
        address: "г. Москва, аэропорт Внуково",
        city: "Москва",
        region: "Москва",
        postalCode: "119027",
        latitude: 55.5917,
        longitude: 37.2415,
        workingHours: "Круглосуточно",
      },
      {
        name: "Терминал Шереметьево",
        type: "terminal",
        address: "г. Москва, аэропорт Шереметьево",
        city: "Москва",
        region: "Москва",
        postalCode: "141411",
        latitude: 55.9733,
        longitude: 37.415,
        workingHours: "Круглосуточно",
      },
      {
        name: "Порт Новороссийск",
        type: "port",
        address: "г. Новороссийск, Морской район, д. 1",
        city: "Новороссийск",
        region: "Краснодарский край",
        postalCode: "353900",
        latitude: 44.7714,
        longitude: 37.7886,
        workingHours: "Круглосуточно",
      },
      {
        name: "Таможенный пост Москва",
        type: "customs",
        address: "г. Москва, ул. Молодогвардейская, д. 57",
        city: "Москва",
        region: "Москва",
        postalCode: "121351",
        latitude: 55.737,
        longitude: 37.409,
        workingHours: "Пн-Пт: 09:00-17:00",
      },
    ];

    for (const location of locations) {
      await this.prisma.location.create({
        data: location,
      });
    }

    console.log(`   ✓ Created ${locations.length} locations`);
  }

  private async seedWarehouses() {
    const warehouses = [
      {
        code: "WH-MSK-001",
        name: "Складской комплекс Москва-1",
        address: "г. Москва, Дмитровское шоссе, д. 100",
        city: "Москва",
        region: "Москва",
        postalCode: "127238",
        latitude: 55.8637,
        longitude: 37.5423,
        capacity: 50000,
        workingHours: "Пн-Пт: 09:00-18:00, Сб: 10:00-15:00",
      },
      {
        code: "WH-MSK-002",
        name: "Логистический центр Калужский",
        address: "г. Москва, Калужское шоссе, д. 67",
        city: "Москва",
        region: "Москва",
        postalCode: "115393",
        latitude: 55.6426,
        longitude: 37.6386,
        capacity: 35000,
        workingHours: "Пн-Пт: 08:00-20:00",
      },
      {
        code: "WH-SPB-001",
        name: "Складской комплекс Петербург",
        address: "г. Санкт-Петербург, Обводного канала, д. 14",
        city: "Санкт-Петербург",
        region: "Санкт-Петербург",
        postalCode: "191119",
        latitude: 59.9167,
        longitude: 30.3347,
        capacity: 25000,
        workingHours: "Пн-Пт: 08:00-17:00",
      },
      {
        code: "WH-KZN-001",
        name: "Логистический центр Казань",
        address: "г. Казань, Горьковское шоссе, д. 26",
        city: "Казань",
        region: "Татарстан",
        postalCode: "420095",
        latitude: 55.8231,
        longitude: 49.1337,
        capacity: 20000,
        workingHours: "Пн-Пт: 08:00-17:00",
      },
      {
        code: "WH-NVR-001",
        name: "Порт Новороссийск",
        address: "г. Новороссийск, Морской район, д. 1",
        city: "Новороссийск",
        region: "Краснодарский край",
        postalCode: "353900",
        latitude: 44.7714,
        longitude: 37.7886,
        capacity: 100000,
        workingHours: "Круглосуточно",
      },
    ];

    for (const warehouse of warehouses) {
      await this.prisma.warehouse.upsert({
        where: { code: warehouse.code },
        update: {},
        create: warehouse,
      });
    }

    console.log(`   ✓ Created ${warehouses.length} warehouses`);
  }

  private async seedTariffs() {
    const tariffs = [
      {
        code: "MOS-KAZ-GEN",
        name: "Москва - Казань (Генеральный)",
        routeFrom: "Москва",
        routeTo: "Казань",
        vehicleType: "truck",
        pricePerKm: 45,
        pricePerTon: 3.5,
        minimumPrice: 15000,
        distanceKm: 820,
        estimatedHours: 11,
      },
      {
        code: "MOS-SPB-GEN",
        name: "Москва - Санкт-Петербург (Генеральный)",
        routeFrom: "Москва",
        routeTo: "Санкт-Петербург",
        vehicleType: "truck",
        pricePerKm: 42,
        pricePerTon: 3.2,
        minimumPrice: 12000,
        distanceKm: 700,
        estimatedHours: 9,
      },
      {
        code: "MOS-KAZ-REF",
        name: "Москва - Казань (Рефрижератор)",
        routeFrom: "Москва",
        routeTo: "Казань",
        vehicleType: "refrigerated",
        pricePerKm: 58,
        pricePerTon: 5.0,
        minimumPrice: 22000,
        distanceKm: 820,
        estimatedHours: 11,
      },
      {
        code: "MOS-SPB-REF",
        name: "Москва - Санкт-Петербург (Рефрижератор)",
        routeFrom: "Москва",
        routeTo: "Санкт-Петербург",
        vehicleType: "refrigerated",
        pricePerKm: 55,
        pricePerTon: 4.8,
        minimumPrice: 18000,
        distanceKm: 700,
        estimatedHours: 9,
      },
      {
        code: "SPB-KAZ-GEN",
        name: "Санкт-Петербург - Казань (Генеральный)",
        routeFrom: "Санкт-Петербург",
        routeTo: "Казань",
        vehicleType: "truck",
        pricePerKm: 48,
        pricePerTon: 3.8,
        minimumPrice: 18000,
        distanceKm: 1500,
        estimatedHours: 18,
      },
      {
        code: "MOS-NVR-GEN",
        name: "Москва - Новороссийск (Генеральный)",
        routeFrom: "Москва",
        routeTo: "Новороссийск",
        vehicleType: "truck",
        pricePerKm: 40,
        pricePerTon: 3.0,
        minimumPrice: 25000,
        distanceKm: 1500,
        estimatedHours: 18,
      },
      {
        code: "MOS-KAZ-EX",
        name: "Москва - Казань (Экспресс)",
        routeFrom: "Москва",
        routeTo: "Казань",
        vehicleType: "express",
        pricePerKm: 65,
        pricePerTon: 5.5,
        minimumPrice: 25000,
        distanceKm: 820,
        estimatedHours: 7,
      },
      {
        code: "MOS-SPB-EX",
        name: "Москва - Санкт-Петербург (Экспресс)",
        routeFrom: "Москва",
        routeTo: "Санкт-Петербург",
        vehicleType: "express",
        pricePerKm: 60,
        pricePerTon: 5.0,
        minimumPrice: 20000,
        distanceKm: 700,
        estimatedHours: 6,
      },
    ];

    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);

    for (const tariff of tariffs) {
      await this.prisma.tariff.upsert({
        where: { code: tariff.code },
        update: {},
        create: { ...tariff, validFrom, validTo },
      });
    }

    console.log(`   ✓ Created ${tariffs.length} tariffs`);
  }

  private async seedClients() {
    const mscFilial = await this.prisma.filial.findUnique({
      where: { code: "MOSCOW" },
    });
    const adminUser = await this.prisma.user.findUnique({
      where: { email: "admin@logistics.local" },
    });

    if (!mscFilial || !adminUser) return;

    const clients = [
      {
        type: "legal",
        name: "ООО «ТрансЛогистик»",
        inn: "7714567890",
        kpp: "771401001",
        ogrn: "1057748000001",
        legalAddress: "г. Москва, ул. Промышленная, д. 10",
        phone: "+7 (495) 111-22-33",
        email: "info@translog.ru",
        contactName: "Иванов Сергей",
        contactPhone: "+7 (916) 123-45-67",
        paymentDays: 30,
      },
      {
        type: "legal",
        name: "ЗАО «СтройИнвест»",
        inn: "7728567890",
        kpp: "772801001",
        ogrn: "1027748000001",
        legalAddress: "г. Москва, ул. Строителей, д. 25",
        phone: "+7 (495) 222-33-44",
        email: "info@stroiinvest.ru",
        contactName: "Петрова Анна",
        contactPhone: "+7 (903) 234-56-78",
        paymentDays: 14,
      },
      {
        type: "legal",
        name: "ООО «ПродСнаб»",
        inn: "7734567890",
        kpp: "773401001",
        ogrn: "1037748000001",
        legalAddress: "г. Москва, ул. Продовольственная, д. 5",
        phone: "+7 (495) 333-44-55",
        email: "info@prodsnab.ru",
        contactName: "Сидоров Алексей",
        contactPhone: "+7 (905) 345-67-89",
        paymentDays: 45,
      },
      {
        type: "legal",
        name: "ИП Козлов Н.И.",
        inn: "7744567891",
        ogrn: "3047744000001",
        legalAddress: "г. Москва, ул. Центральная, д. 15",
        phone: "+7 (495) 444-55-66",
        email: "kozlov@email.ru",
        contactName: "Козлов Николай",
        contactPhone: "+7 (926) 456-78-90",
        paymentDays: 0,
      },
      {
        type: "legal",
        name: "АО «МегаСтрой»",
        inn: "7755567890",
        kpp: "775501001",
        ogrn: "1047758000001",
        legalAddress: "г. Санкт-Петербург, Невский пр., д. 50",
        phone: "+7 (812) 555-66-77",
        email: "info@megastroy.spb.ru",
        contactName: "Белов Дмитрий",
        contactPhone: "+7 (921) 567-89-01",
        paymentDays: 30,
      },
    ];

    for (const client of clients) {
      const existing = await this.prisma.client.findUnique({
        where: { inn: client.inn },
      });
      if (!existing) {
        await this.prisma.client.create({
          data: {
            ...client,
            filialId: mscFilial.id,
            createdById: adminUser.id,
          },
        });
      }
    }

    console.log(`   ✓ Created ${clients.length} clients`);
  }

  private async seedVehicles() {
    const mscFilial = await this.prisma.filial.findUnique({
      where: { code: "MOSCOW" },
    });
    if (!mscFilial) return;

    const vehicles = [
      {
        plateNumber: "А001АА777",
        brand: "Mercedes-Benz",
        model: "Actros 1841",
        bodyType: "тент",
        capacityKg: 20,
        capacityM3: 86,
        year: 2022,
        fuelType: "Дизель",
        status: "available",
      },
      {
        plateNumber: "А002АА777",
        brand: "Volvo",
        model: "FH16 540",
        bodyType: "тент",
        capacityKg: 25,
        capacityM3: 92,
        year: 2021,
        fuelType: "Дизель",
        status: "available",
      },
      {
        plateNumber: "А003АА777",
        brand: "MAN",
        model: "TGX 18.440",
        bodyType: "рефрижератор",
        capacityKg: 18,
        capacityM3: 80,
        year: 2023,
        fuelType: "Дизель",
        temperatureControl: true,
        temperatureFrom: -25,
        temperatureTo: 5,
        status: "available",
      },
      {
        plateNumber: "А004АА777",
        brand: "Scania",
        model: "R500",
        bodyType: "фургон",
        capacityKg: 22,
        capacityM3: 88,
        year: 2022,
        fuelType: "Дизель",
        status: "available",
      },
      {
        plateNumber: "А005АА777",
        brand: "DAF",
        model: "XF 480",
        bodyType: "тент",
        capacityKg: 24,
        capacityM3: 90,
        year: 2021,
        fuelType: "Дизель",
        status: "maintenance",
      },
    ];

    for (const vehicle of vehicles) {
      const existing = await this.prisma.vehicle.findUnique({
        where: { plateNumber: vehicle.plateNumber },
      });
      if (!existing) {
        await this.prisma.vehicle.create({
          data: { ...vehicle, filialId: mscFilial.id },
        });
      }
    }

    console.log(`   ✓ Created ${vehicles.length} vehicles`);
  }

  private async seedDrivers() {
    const mscFilial = await this.prisma.filial.findUnique({
      where: { code: "MOSCOW" },
    });
    if (!mscFilial) return;

    const drivers = [
      {
        employeeId: "EMP-001",
        firstName: "Михаил",
        lastName: "Волков",
        phone: "+7 (916) 111-22-33",
        email: "volkov@logistics.local",
        licenseNumber: "МСК 001234",
        licenseCategory: "CE",
        licenseExpires: new Date("2026-12-31"),
        status: "available",
      },
      {
        employeeId: "EMP-002",
        firstName: "Алексей",
        lastName: "Новиков",
        phone: "+7 (916) 222-33-44",
        email: "novikov@logistics.local",
        licenseNumber: "МСК 002345",
        licenseCategory: "CE",
        licenseExpires: new Date("2026-06-30"),
        status: "available",
      },
      {
        employeeId: "EMP-003",
        firstName: "Дмитрий",
        lastName: "Кузнецов",
        phone: "+7 (916) 333-44-55",
        email: "kuznetsov@logistics.local",
        licenseNumber: "МСК 003456",
        licenseCategory: "CE",
        licenseExpires: new Date("2027-03-15"),
        status: "available",
      },
      {
        employeeId: "EMP-004",
        firstName: "Сергей",
        lastName: "Соколов",
        phone: "+7 (916) 444-55-66",
        email: "sokolov@logistics.local",
        licenseNumber: "МСК 004567",
        licenseCategory: "C",
        licenseExpires: new Date("2025-09-30"),
        status: "on_trip",
      },
      {
        employeeId: "EMP-005",
        firstName: "Андрей",
        lastName: "Лебедев",
        phone: "+7 (916) 555-66-77",
        email: "lebedev@logistics.local",
        licenseNumber: "МСК 005678",
        licenseCategory: "CE",
        licenseExpires: new Date("2026-11-20"),
        status: "available",
      },
    ];

    for (const driver of drivers) {
      const existing = await this.prisma.driver.findUnique({
        where: { employeeId: driver.employeeId },
      });
      if (!existing) {
        await this.prisma.driver.create({
          data: { ...driver, filialId: mscFilial.id },
        });
      }
    }

    console.log(`   ✓ Created ${drivers.length} drivers`);
  }

  private async seedPermissions() {
    const permissions: Array<{
      subject: PermissionSubject;
      action: PermissionAction;
      name: string;
    }> = [];

    const subjects = Object.values(PermissionSubject);
    const actions = Object.values(PermissionAction);

    for (const subject of subjects) {
      for (const action of actions) {
        permissions.push({
          subject,
          action,
          name: `${subject}:${action}`,
        });
      }
    }

    for (const perm of permissions) {
      await this.prisma.permission.upsert({
        where: {
          subject_action: { subject: perm.subject, action: perm.action },
        },
        update: {},
        create: perm,
      });
    }

    console.log(`   ✓ Created ${permissions.length} permissions`);
  }

  private async seedRoles() {
    const subjects = Object.values(PermissionSubject);
    const actions = Object.values(PermissionAction);

    const rolesConfig: Array<{
      code: RoleCode;
      name: string;
      description: string;
      permissions: Array<{
        subject: PermissionSubject;
        actions: PermissionAction[];
      }>;
    }> = [
      {
        code: RoleCode.ADMIN,
        name: "Администратор",
        description: "Полный доступ к системе",
        permissions: subjects.flatMap((subject) =>
          actions.map((action) => ({
            subject,
            actions: [action] as PermissionAction[],
          })),
        ),
      },
      {
        code: RoleCode.MANAGER,
        name: "Руководитель",
        description: "Управление персоналом и просмотр аналитики",
        permissions: [
          {
            subject: PermissionSubject.requests,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.orders,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.trips,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.clients,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.vehicles,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.drivers,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.reports,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.users,
            actions: [PermissionAction.read],
          },
        ],
      },
      {
        code: RoleCode.DISPATCHER,
        name: "Диспетчер",
        description: "Планирование и отслеживание рейсов",
        permissions: [
          {
            subject: PermissionSubject.requests,
            actions: [
              PermissionAction.create,
              PermissionAction.read,
              PermissionAction.update,
            ],
          },
          {
            subject: PermissionSubject.trips,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.vehicles,
            actions: [PermissionAction.read],
          },
          {
            subject: PermissionSubject.drivers,
            actions: [PermissionAction.read, PermissionAction.update],
          },
        ],
      },
      {
        code: RoleCode.SALES,
        name: "Менеджер по продажам",
        description: "Работа с клиентами и заявками",
        permissions: [
          {
            subject: PermissionSubject.requests,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.orders,
            actions: [PermissionAction.manage],
          },
          {
            subject: PermissionSubject.clients,
            actions: [PermissionAction.manage],
          },
        ],
      },
      {
        code: RoleCode.OPERATOR,
        name: "Оператор",
        description: "Ввод и обработка заявок",
        permissions: [
          {
            subject: PermissionSubject.requests,
            actions: [PermissionAction.create, PermissionAction.read],
          },
          {
            subject: PermissionSubject.clients,
            actions: [PermissionAction.read],
          },
        ],
      },
      {
        code: RoleCode.DRIVER,
        name: "Водитель",
        description: "Доступ к своим рейсам",
        permissions: [
          {
            subject: PermissionSubject.trips,
            actions: [PermissionAction.read, PermissionAction.update],
          },
        ],
      },
      {
        code: RoleCode.CLIENT,
        name: "Клиент",
        description: "Доступ к своим заявкам",
        permissions: [
          {
            subject: PermissionSubject.requests,
            actions: [PermissionAction.read],
          },
        ],
      },
    ];

    for (const roleConfig of rolesConfig) {
      const role = await this.prisma.role.upsert({
        where: { code: roleConfig.code },
        update: {},
        create: {
          code: roleConfig.code,
          name: roleConfig.name,
          description: roleConfig.description,
          isSystem: true,
        },
      });

      for (const perm of roleConfig.permissions) {
        for (const action of perm.actions) {
          const permission = await this.prisma.permission.findUnique({
            where: {
              subject_action: { subject: perm.subject, action },
            },
          });

          if (permission) {
            await this.prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      }

      console.log(`   ✓ Created role: ${roleConfig.name}`);
    }
  }

  private async seedUsers() {
    const passwordHash = await bcrypt.hash("password123", 10);

    const users = [
      {
        email: "admin@logistics.local",
        firstName: "Администратор",
        lastName: "Системы",
        passwordHash,
        isSuperadmin: true,
        roles: [RoleCode.ADMIN],
      },
      {
        email: "manager@logistics.local",
        firstName: "Иван",
        lastName: "Иванов",
        passwordHash,
        roles: [RoleCode.MANAGER],
      },
      {
        email: "dispatcher@logistics.local",
        firstName: "Пётр",
        lastName: "Петров",
        passwordHash,
        roles: [RoleCode.DISPATCHER],
      },
      {
        email: "sales@logistics.local",
        firstName: "Алексей",
        lastName: "Сидоров",
        passwordHash,
        roles: [RoleCode.SALES],
      },
      {
        email: "operator@logistics.local",
        firstName: "Мария",
        lastName: "Смирнова",
        passwordHash,
        roles: [RoleCode.OPERATOR],
      },
    ];

    for (const userData of users) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) continue;

      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: userData.passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isSuperadmin: userData.isSuperadmin || false,
        },
      });

      for (const roleCode of userData.roles) {
        const role = await this.prisma.role.findUnique({
          where: { code: roleCode },
        });

        if (role) {
          await this.prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
            },
          });
        }
      }

      console.log(`   ✓ Created user: ${userData.email}`);
    }
  }

  private async seedVehicleTypes() {
    const vehicleTypes = [
      {
        code: "TENT",
        name: "Тентованный",
        description: "Универсальный тентованный полуприцеп",
        category: "general",
        capacityKg: 20,
        capacityM3: 86,
        hasTrailer: false,
        sortOrder: 1,
      },
      {
        code: "FRIDGE",
        name: "Рефрижератор",
        description: "Изотермический фургон с охлаждением",
        category: "temperature",
        capacityKg: 18,
        capacityM3: 80,
        hasTrailer: false,
        sortOrder: 2,
      },
      {
        code: "CONTAINER",
        name: "Контейнеровоз",
        description: "Для перевозки контейнеров",
        category: "special",
        capacityKg: 25,
        capacityM3: 0,
        hasTrailer: true,
        sortOrder: 3,
      },
      {
        code: "LOWBED",
        name: "Низкорамный трал",
        description: "Для негабаритных грузов",
        category: "oversized",
        capacityKg: 40,
        capacityM3: 0,
        hasTrailer: true,
        sortOrder: 4,
      },
      {
        code: "BULK",
        name: "Бортовой",
        description: "Открытый бортовой полуприцеп",
        category: "open",
        capacityKg: 22,
        capacityM3: 90,
        hasTrailer: false,
        sortOrder: 5,
      },
      {
        code: "TANK",
        name: "Цистерна",
        description: "Для жидких и сыпучих грузов",
        category: "liquid",
        capacityKg: 24,
        capacityM3: 0,
        hasTrailer: false,
        sortOrder: 6,
      },
      {
        code: "EXPRESS",
        name: "Экспресс",
        description: "Быстрая доставка малотоннажным транспортом",
        category: "light",
        capacityKg: 3,
        capacityM3: 15,
        hasTrailer: false,
        sortOrder: 7,
      },
    ];

    for (const vt of vehicleTypes) {
      await this.prisma.vehicleType.upsert({
        where: { code: vt.code },
        update: {},
        create: vt,
      });
    }

    console.log(`   ✓ Created ${vehicleTypes.length} vehicle types`);
  }

  private async seedFuelTypes() {
    const fuelTypes = [
      {
        code: "DIESEL",
        name: "Дизельное топливо",
        description: "Дизель (ДТ, солярка)",
      },
      { code: "GASOLINE", name: "Бензин", description: "Автомобильный бензин" },
      {
        code: "GAS",
        name: "Газ (метан)",
        description: "Природный газ (КПГ/СПГ)",
      },
      {
        code: "LPG",
        name: "Сжиженный газ (пропан)",
        description: "Пропан-бутан (автогаз)",
      },
      { code: "HYBRID", name: "Гибрид", description: "Бензин + электро" },
      { code: "ELECTRIC", name: "Электро", description: "Электромобиль" },
    ];

    for (const ft of fuelTypes) {
      await this.prisma.fuelType.upsert({
        where: { code: ft.code },
        update: {},
        create: ft,
      });
    }

    console.log(`   ✓ Created ${fuelTypes.length} fuel types`);
  }

  private async seedStatuses() {
    const statuses = [
      {
        entityType: "request",
        code: "new",
        name: "Новая",
        description: "Новая заявка",
        color: "#3B82F6",
        icon: "file-plus",
        sortOrder: 1,
      },
      {
        entityType: "request",
        code: "confirmed",
        name: "Подтверждена",
        description: "Заявка подтверждена",
        color: "#10B981",
        icon: "check-circle",
        sortOrder: 2,
      },
      {
        entityType: "request",
        code: "in_progress",
        name: "В работе",
        description: "Заявка в обработке",
        color: "#F59E0B",
        icon: "loader",
        sortOrder: 3,
      },
      {
        entityType: "request",
        code: "completed",
        name: "Выполнена",
        description: "Заявка выполнена",
        color: "#22C55E",
        icon: "check",
        sortOrder: 4,
      },
      {
        entityType: "request",
        code: "cancelled",
        name: "Отменена",
        description: "Заявка отменена",
        color: "#EF4444",
        icon: "x-circle",
        sortOrder: 5,
      },
      {
        entityType: "request",
        code: "on_hold",
        name: "На удержании",
        description: "Заявка на паузе",
        color: "#6B7280",
        icon: "pause",
        sortOrder: 6,
      },
      {
        entityType: "trip",
        code: "scheduled",
        name: "Запланирован",
        description: "Рейс запланирован",
        color: "#3B82F6",
        icon: "calendar",
        sortOrder: 1,
      },
      {
        entityType: "trip",
        code: "assigned",
        name: "Назначен",
        description: "Водитель назначен",
        color: "#8B5CF6",
        icon: "user-check",
        sortOrder: 2,
      },
      {
        entityType: "trip",
        code: "in_transit",
        name: "В пути",
        description: "Рейс в процессе",
        color: "#F59E0B",
        icon: "truck",
        sortOrder: 3,
      },
      {
        entityType: "trip",
        code: "arrived",
        name: "Прибыл",
        description: "Водитель прибыл",
        color: "#06B6D4",
        icon: "map-pin",
        sortOrder: 4,
      },
      {
        entityType: "trip",
        code: "loading",
        name: "Погрузка",
        description: "Идет погрузка",
        color: "#EAB308",
        icon: "package",
        sortOrder: 5,
      },
      {
        entityType: "trip",
        code: "unloading",
        name: "Выгрузка",
        description: "Идет выгрузка",
        color: "#84CC16",
        icon: "package-open",
        sortOrder: 6,
      },
      {
        entityType: "trip",
        code: "completed",
        name: "Завершен",
        description: "Рейс завершен",
        color: "#22C55E",
        icon: "check-circle",
        sortOrder: 7,
      },
      {
        entityType: "trip",
        code: "cancelled",
        name: "Отменен",
        description: "Рейс отменен",
        color: "#EF4444",
        icon: "x-circle",
        sortOrder: 8,
      },
      {
        entityType: "trip",
        code: "delayed",
        name: "Задержка",
        description: "Рейс задерживается",
        color: "#F97316",
        icon: "alert-triangle",
        sortOrder: 9,
      },
      {
        entityType: "order",
        code: "draft",
        name: "Черновик",
        description: "Заказ в черновике",
        color: "#6B7280",
        icon: "file-edit",
        sortOrder: 1,
      },
      {
        entityType: "order",
        code: "confirmed",
        name: "Подтвержден",
        description: "Заказ подтвержден",
        color: "#3B82F6",
        icon: "check",
        sortOrder: 2,
      },
      {
        entityType: "order",
        code: "invoiced",
        name: "Выставлен счет",
        description: "Счет выставлен",
        color: "#8B5CF6",
        icon: "file-text",
        sortOrder: 3,
      },
      {
        entityType: "order",
        code: "partially_paid",
        name: "Частично оплачен",
        description: "Частичная оплата",
        color: "#F59E0B",
        icon: "credit-card",
        sortOrder: 4,
      },
      {
        entityType: "order",
        code: "paid",
        name: "Оплачен",
        description: "Полная оплата",
        color: "#10B981",
        icon: "check-circle",
        sortOrder: 5,
      },
      {
        entityType: "order",
        code: "cancelled",
        name: "Отменен",
        description: "Заказ отменен",
        color: "#EF4444",
        icon: "x-circle",
        sortOrder: 6,
      },
    ];

    for (const status of statuses) {
      await this.prisma.status.upsert({
        where: {
          entityType_code: { entityType: status.entityType, code: status.code },
        },
        update: {},
        create: { ...status, isSystem: true },
      });
    }

    console.log(`   ✓ Created ${statuses.length} statuses`);
  }

  private async seedFlags() {
    const flags = [
      {
        code: "URGENT",
        name: "Срочный",
        description: "Срочная заявка",
        color: "#EF4444",
        icon: "flame",
        entityType: "request",
      },
      {
        code: "HAZMAT",
        name: "Опасный груз",
        description: "Требуется ADR",
        color: "#F97316",
        icon: "alert-triangle",
        entityType: "request",
      },
      {
        code: "FRAGILE",
        name: "Хрупкий",
        description: "Требует бережного обращения",
        color: "#EAB308",
        icon: "alert-circle",
        entityType: "request",
      },
      {
        code: "TEMP_CONTROL",
        name: "Температурный контроль",
        description: "Рефрижератор",
        color: "#06B6D4",
        icon: "thermometer",
        entityType: "request",
      },
      {
        code: "OVERSIZED",
        name: "Негабарит",
        description: "Негабаритный груз",
        color: "#8B5CF6",
        icon: "maximize",
        entityType: "request",
      },
      {
        code: "VIP",
        name: "VIP клиент",
        description: "Приоритетное обслуживание",
        color: "#EC4899",
        icon: "star",
        entityType: "request",
      },
      {
        code: "RETURN_LOAD",
        name: "Обратная загрузка",
        description: "Требуется обратная загрузка",
        color: "#14B8A6",
        icon: "repeat",
        entityType: "request",
      },
      {
        code: "OVERNIGHT",
        name: "Ночная доставка",
        description: "Доставка в ночное время",
        color: "#3B82F6",
        icon: "moon",
        entityType: "request",
      },
    ];

    for (const flag of flags) {
      await this.prisma.flag.upsert({
        where: { code: flag.code },
        update: {},
        create: { ...flag, isSystem: true },
      });
    }

    console.log(`   ✓ Created ${flags.length} flags`);
  }

  private async seedClassifiers() {
    const classifiers = [
      {
        type: "delay_reason",
        code: "traffic",
        name: "Пробки",
        description: "Дорожная пробка",
        sortOrder: 1,
      },
      {
        type: "delay_reason",
        code: "weather",
        name: "Погодные условия",
        description: "Непогода",
        sortOrder: 2,
      },
      {
        type: "delay_reason",
        code: "customs",
        name: "Таможенное оформление",
        description: "Задержка на таможне",
        sortOrder: 3,
      },
      {
        type: "delay_reason",
        code: "loading",
        name: "Долгая погрузка",
        description: "Задержка при погрузке",
        sortOrder: 4,
      },
      {
        type: "delay_reason",
        code: "unloading",
        name: "Долгая выгрузка",
        description: "Задержка при выгрузке",
        sortOrder: 5,
      },
      {
        type: "delay_reason",
        code: "vehicle_breakdown",
        name: "Поломка ТС",
        description: "Техническая неисправность",
        sortOrder: 6,
      },
      {
        type: "delay_reason",
        code: "driver_rest",
        name: "Отдых водителя",
        description: "Регламентированный отдых",
        sortOrder: 7,
      },
      {
        type: "delay_reason",
        code: "documentation",
        name: "Документы",
        description: "Проблемы с документами",
        sortOrder: 8,
      },
      {
        type: "delay_reason",
        code: "other",
        name: "Другое",
        description: "Иная причина",
        sortOrder: 9,
      },
      {
        type: "cancellation_category",
        code: "client_request",
        name: "По просьбе клиента",
        description: "Клиент отменил заявку",
        sortOrder: 1,
      },
      {
        type: "cancellation_category",
        code: "price_change",
        name: "Изменение цены",
        description: "Не устроила стоимость",
        sortOrder: 2,
      },
      {
        type: "cancellation_category",
        code: "no_capacity",
        name: "Нет свободного ТС",
        description: "Не можем обеспечить",
        sortOrder: 3,
      },
      {
        type: "cancellation_category",
        code: "route_impossible",
        name: "Невозможен маршрут",
        description: "Не можем доехать",
        sortOrder: 4,
      },
      {
        type: "cancellation_category",
        code: "client_no_response",
        name: "Клиент не отвечает",
        description: "Нет связи с клиентом",
        sortOrder: 5,
      },
      {
        type: "cargo_type_category",
        code: "general",
        name: "Генеральный",
        description: "Генеральные грузы",
        sortOrder: 1,
      },
      {
        type: "cargo_type_category",
        code: "temperature",
        name: "Температурный",
        description: "Требует температурного режима",
        sortOrder: 2,
      },
      {
        type: "cargo_type_category",
        code: "hazardous",
        name: "Опасный",
        description: "Класс опасности ADR",
        sortOrder: 3,
      },
      {
        type: "cargo_type_category",
        code: "oversized",
        name: "Негабаритный",
        description: "Крупногабаритный груз",
        sortOrder: 4,
      },
      {
        type: "cargo_type_category",
        code: "valuable",
        name: "Ценный",
        description: "Дорогостоящий груз",
        sortOrder: 5,
      },
    ];

    for (const c of classifiers) {
      await this.prisma.classifier.upsert({
        where: { type_code: { type: c.type, code: c.code } },
        update: {},
        create: { ...c, isSystem: true },
      });
    }

    console.log(`   ✓ Created ${classifiers.length} classifiers`);
  }

  private async seedProblemReasons() {
    const problemReasons = [
      {
        code: "DAMAGE",
        name: "Повреждение груза",
        description: "Груз поврежден при перевозке",
        category: "cargo",
        severity: "high",
        requiresApproval: true,
      },
      {
        code: "MISSING",
        name: "Недостача",
        description: "Часть груза не доставлена",
        category: "cargo",
        severity: "high",
        requiresApproval: true,
      },
      {
        code: "DELAY",
        name: "Опоздание",
        description: "Доставка с задержкой",
        category: "service",
        severity: "medium",
        requiresApproval: false,
      },
      {
        code: "WRONG_DELIVERY",
        name: "Неверный адрес",
        description: "Доставлен не тому клиенту",
        category: "service",
        severity: "high",
        requiresApproval: true,
      },
      {
        code: "NO_CONTACT",
        name: "Нет связи с получателем",
        description: "Получатель не отвечает",
        category: "delivery",
        severity: "medium",
        requiresApproval: false,
      },
      {
        code: "REFUSAL",
        name: "Отказ от получения",
        description: "Получатель отказался",
        category: "delivery",
        severity: "medium",
        requiresApproval: true,
      },
      {
        code: "DOCUMENT_ERROR",
        name: "Ошибка в документах",
        description: "Неверные или отсутствующие документы",
        category: "documentation",
        severity: "low",
        requiresApproval: false,
      },
      {
        code: "CUSTOMS_ISSUE",
        name: "Таможенные проблемы",
        description: "Задержка на таможне",
        category: "customs",
        severity: "high",
        requiresApproval: true,
      },
      {
        code: "VEHICLE_ISSUE",
        name: "Проблема с ТС",
        description: "Техническая неисправность",
        category: "vehicle",
        severity: "medium",
        requiresApproval: false,
      },
      {
        code: "WEATHER_ISSUE",
        name: "Погодные условия",
        description: "Невозможность проезда",
        category: "external",
        severity: "medium",
        requiresApproval: false,
      },
    ];

    for (const pr of problemReasons) {
      await this.prisma.problemReason.upsert({
        where: { code: pr.code },
        update: {},
        create: pr,
      });
    }

    console.log(`   ✓ Created ${problemReasons.length} problem reasons`);
  }

  private async seedRecipients() {
    const mscFilial = await this.prisma.filial.findUnique({
      where: { code: "MOSCOW" },
    });
    if (!mscFilial) return;

    const recipients = [
      {
        code: "REC-001",
        name: "Склад «Восток»",
        inn: "7712111111",
        address: "г. Москва, ул. Промышленная, д. 50",
        city: "Москва",
        contactName: "Смирнов Алексей",
        contactPhone: "+7 (916) 111-11-11",
      },
      {
        code: "REC-002",
        name: "Торговый центр «Центральный»",
        inn: "7712222222",
        address: "г. Москва, ул. Садовая, д. 15",
        city: "Москва",
        contactName: "Кузнецова Мария",
        contactPhone: "+7 (916) 222-22-22",
      },
      {
        code: "REC-003",
        name: "Завод «Металлург»",
        inn: "7722333333",
        address: "г. Москва, ул. Заводская, д. 10",
        city: "Москва",
        contactName: "Петров Игорь",
        contactPhone: "+7 (916) 333-33-33",
      },
      {
        code: "REC-004",
        name: "Складской комплекс «Северный»",
        inn: "7801444444",
        address: "г. Санкт-Петербург, ул. Портовая, д. 25",
        city: "Санкт-Петербург",
        contactName: "Новиков Дмитрий",
        contactPhone: "+7 (921) 444-44-44",
      },
      {
        code: "REC-005",
        name: "Логистический центр «Казань»",
        inn: "1601455555",
        address: "г. Казань, ул. Промышленная, д. 8",
        city: "Казань",
        contactName: "Гарипов Тимур",
        contactPhone: "+7 (843) 555-55-55",
      },
    ];

    for (const recipient of recipients) {
      const existing = await this.prisma.recipient.findUnique({
        where: { code: recipient.code },
      });
      if (!existing) {
        await this.prisma.recipient.create({
          data: { ...recipient, filialId: mscFilial.id },
        });
      }
    }

    console.log(`   ✓ Created ${recipients.length} recipients`);
  }

  private async seedSystemSettings() {
    const settings = [
      {
        key: "company.name",
        title: "Название компании",
        section: "general",
        value: { value: "Logistics CRM" },
        description: "Отображаемое название компании",
        isSystem: true,
      },
      {
        key: "orders.defaultVatRate",
        title: "Ставка НДС по умолчанию",
        section: "finance",
        value: { value: 20 },
        description: "Используется при создании новых заказов",
        isSystem: true,
      },
      {
        key: "requests.defaultPriority",
        title: "Приоритет заявок по умолчанию",
        section: "operations",
        value: { value: "normal" },
        description: "Базовый приоритет для новых заявок",
        isSystem: true,
      },
      {
        key: "notifications.emailEnabled",
        title: "Email уведомления",
        section: "notifications",
        value: { value: true },
        description: "Включает отправку email-уведомлений",
        isSystem: true,
      },
    ];

    for (const setting of settings) {
      await this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: {},
        create: setting,
      });
    }

    console.log(`   ✓ Created ${settings.length} system settings`);
  }
}

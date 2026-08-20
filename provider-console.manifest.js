(function (global) {
  "use strict";

  if (!global.AuroraAdminDemoState && typeof require === "function") require("./admin-demo-state.js");
  if (!global.AuroraAdminDemoState) throw new Error("Aurora admin demo state dependency is missing");

  const manifest = {
  locale: "ru",
  brand: "Aurora",
  surface: "provider",
  surfaceLabel: "Консоль провайдера",
  startRoute: "PROV-TENANTS-001",
  actor: { name: "Елена Морозова", initials: "ЕМ", role: "Суперадминистратор провайдера" },
  scope: {
    provider: "Contoso Cloud Services",
    value: "provider:contoso",
    options: [
      { value: "installation:local", type: "installation", label: "Установка · этот сервер", breadcrumb: ["Установка"] },
      { value: "provider:contoso", type: "provider", label: "Провайдер · Contoso Cloud Services", breadcrumb: ["Contoso Cloud Services"] },
      { value: "reseller:emea", type: "reseller", label: "Реселлер · EMEA Partners", name: "EMEA Partners", breadcrumb: ["Contoso Cloud Services", "EMEA Partners"] },
      { value: "tenant:default", type: "organization", label: "Организация · Contoso Cloud Services (по умолчанию)", name: "Contoso Cloud Services", isDefault: true, breadcrumb: ["Contoso Cloud Services", "Дефолтная организация"] },
      { value: "tenant:northwind", type: "organization", label: "Организация · Northwind Example", name: "Northwind Example", breadcrumb: ["Contoso Cloud Services", "EMEA Partners", "Northwind Example"] },
      { value: "tenant:adatum", type: "organization", label: "Организация · Adatum Corporation", name: "Adatum Corporation", breadcrumb: ["Contoso Cloud Services", "Adatum Corporation"] }
    ]
  },
  groups: [
    { title: "Портфель", items: [
      { id: "PROV-TENANTS-001", mark: "ОР", title: "Организации", kind: "table", operation: "provisioning.tenants.list", scope: "Провайдер",
        purpose: "Реестр организаций: жизненный цикл, назначенный реселлер, тариф, ёмкость и эксплуатационное состояние.", creationType: "organization",
        notice: { tone: "info", text: "Делегированный доступ — отдельное назначение со сроком действия и аудитом. Выбор организации в таблице не расширяет полномочия оператора." },
        columns: [{ key: "tenant", label: "Организация" }, { key: "reseller", label: "Обслуживание" }, { key: "plan", label: "Тариф Aurora" }, { key: "users", label: "Пользователи" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "t-default", tenant: "Contoso Cloud Services", subtitle: "Организация провайдера", badge: "По умолчанию", isDefault: true, reseller: "Прямое обслуживание", resellerId: "прямое", plan: "Бизнес Плюс · версия 7", pendingPlan: "Нет", assignmentSource: "Биллинг · подтверждено", reconciliation: "Согласовано", users: "486 / 520", status: "Активен", detailActions: [{ command: "open-organization-card", label: "Открыть карточку" }, { command: "open-managed-scope", label: "Открыть администрирование организации" }] },
          { id: "t-northwind", tenant: "Northwind Example", subtitle: "northwind.example", reseller: "EMEA Partners", resellerId: "EMEA", plan: "Бизнес Плюс · версия 7", pendingPlan: "Нет", assignmentSource: "Биллинг · заказ NW-8841", reconciliation: "Согласовано", users: "486 / 520", status: "Активен" },
          { id: "t-adatum", tenant: "Adatum Corporation", subtitle: "adatum.example", reseller: "Прямое обслуживание", resellerId: "прямое", plan: "Корпоративный · версия 12", pendingPlan: "Корпоративный · версия 13", assignmentSource: "Биллинг · заказ AD-4430", reconciliation: "Ожидает подтверждения", users: "2 804 / 3 000", status: "Требует внимания" },
          { id: "t-tailspin", tenant: "Tailspin Toys", subtitle: "tailspin.example", reseller: "SMB Channel", resellerId: "SMB", plan: "Бизнес · версия 4", pendingPlan: "Нет", assignmentSource: "Ручное исправление · CS-9012", reconciliation: "Требуется сверка с биллингом", users: "188 / 200", status: "Приостановлен" }
        ],
        resellerOptions: [{ value: "прямое", label: "Прямое обслуживание провайдером" }, { value: "EMEA", label: "EMEA Partners" }, { value: "SMB", label: "SMB Channel" }],
        choiceFilter: { key: "resellerId", label: "Реселлер", allValue: "все", defaultValue: "все", options: [{ value: "все", label: "Все организации" }, { value: "прямое", label: "Прямое обслуживание" }, { value: "EMEA", label: "EMEA Partners" }, { value: "SMB", label: "SMB Channel" }] },
        tariffOptions: [{ value: "basic-v5", label: "Базовый · версия 5" }, { value: "business-v4", label: "Бизнес · версия 4" }, { value: "business-plus-v7", label: "Бизнес Плюс · версия 7" }, { value: "corporate-v12", label: "Корпоративный · версия 12" }],
        detailFields: [{ key: "reseller", label: "Обслуживание" }, { key: "plan", label: "Действующий тариф Aurora" }, { key: "pendingPlan", label: "Ожидающее назначение" }, { key: "users", label: "Пользователи" }, { key: "status", label: "Состояние", status: true }],
        tableActions: [{ command: "create", label: "Создать организацию", variant: "primary" }],
        detailActions: [{ command: "open-organization-card", label: "Открыть карточку" }, { command: "open-managed-scope", label: "Открыть администрирование организации" }, { command: "reassign-reseller", label: "Изменить обслуживание" }, { command: "suspend", label: "Приостановить", variant: "danger" }], total: "4 из 185 организаций" },
      { id: "PROV-RESELLERS-001", mark: "РС", title: "Реселлеры", kind: "table", operation: "provisioning.resellers.list", scope: "Провайдер", creationType: "reseller",
        purpose: "Отдельный реестр реселлеров и числа обслуживаемых ими организаций.",
        columns: [{ key: "reseller", label: "Реселлер" }, { key: "organizations", label: "Организации" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "r-emea", reseller: "EMEA Partners", subtitle: "admin@emea.example", organizations: "74", status: "Активен" },
          { id: "r-smb", reseller: "SMB Channel", subtitle: "admin@smb.example", organizations: "39", status: "Активен" }
        ],
        detailFields: [{ key: "organizations", label: "Организации" }, { key: "status", label: "Состояние", status: true }],
        tableActions: [{ command: "create", label: "Создать реселлера", variant: "primary" }],
        detailActions: [{ command: "open-object-detail", label: "Открыть карточку" }, { command: "suspend", label: "Приостановить", variant: "danger" }], total: "2 реселлера" },
      { id: "PROV-TARIFFS-001", mark: "ТР", title: "Тарифы", kind: "table", operation: "admin.featuresets.list", scope: "Провайдер", creationType: "tariff", allowedAccessProfiles: ["superadmin", "provider-admin"],
        purpose: "Каталог наборов возможностей и ограничений Aurora. Цены, счета и платежи принадлежат внешней биллинговой системе.",
        columns: [{ key: "tariff", label: "Тариф Aurora" }, { key: "version", label: "Активная версия" }, { key: "features", label: "Возможности" }, { key: "limits", label: "Ограничения" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "tariff-basic", tariff: "Базовый", version: "5", features: "Почта, календарь, контакты", limits: "До 100 пользователей", organizations: "68", status: "Активен" },
          { id: "tariff-business", tariff: "Бизнес", version: "4", features: "Базовый + файлы", limits: "До 500 пользователей", organizations: "79", status: "Активен" },
          { id: "tariff-business-plus", tariff: "Бизнес Плюс", version: "7", features: "Бизнес + мобильные приложения", limits: "До 3 000 пользователей", organizations: "31", status: "Активен" },
          { id: "tariff-corporate", tariff: "Корпоративный", version: "12", features: "Все модули + расширенная безопасность", limits: "До 20 000 пользователей", organizations: "7", status: "Активен" }
        ],
        detailFields: [{ key: "version", label: "Активная версия" }, { key: "draftVersion", label: "Черновик новой версии" }, { key: "features", label: "Возможности" }, { key: "limits", label: "Ограничения" }, { key: "organizations", label: "Организации" }, { key: "status", label: "Состояние", status: true }],
        tableActions: [{ command: "create-tariff", label: "Создать тариф", variant: "primary" }],
        detailActions: [{ command: "open-tariff-card", label: "Открыть карточку" }, { command: "create-tariff-version", label: "Создать новую версию", variant: "primary" }], total: "4 тарифа" },
      { id: "ADM-SUPPORT-001", mark: "СП", title: "Доступ поддержки", kind: "support", operation: "provider.support.grant", scope: "Провайдер",
        purpose: "Провайдер создаёт запрос на временный доступ, а администратор организации принимает решение. Запрос, разрешение и активный сеанс не смешиваются.",
        actions: [{ command: "create", label: "Запросить доступ", variant: "primary" }],
        emptyText: "Запросов и сеансов поддержки в выбранной области нет.",
        impacts: [
          { title: "Организация", meta: "Northwind Example", status: "Проверена" },
          { title: "Доступ", meta: "Только выбранные действия диагностики", status: "Ограничен" },
          { title: "Срок", meta: "Завершится автоматически", status: "Ограничен" }
        ],
        supportRecords: [
          { id: "ss-8041", scenario: "ожидает", requester: "Елена Кузнецова · служба поддержки Contoso", reason: "Разобраться с ошибкой синхронизации по обращению CS-8041", scope: "Диагностика и чтение безопасных полей пользователя", period: "45 минут после начала", status: "Ожидает решения организации", tone: "warning", explanation: "Запрос отправлен администратору Northwind Example. До его согласия доступ отсутствует.", operationCode: "sup-53de", actions: [] },
          { id: "ss-8025", scenario: "одобрен", requester: "Илья Орлов · служба поддержки Contoso", reason: "Проверить доставку по обращению CS-8025", scope: "Только диагностика доставки", period: "30 минут после начала", status: "Организация одобрила", tone: "info", explanation: "Доступ разрешён, но специалист ещё не начал работу.", operationCode: "sup-48ab", actions: [{ command: "support-revoke", label: "Отменить запрос", variant: "danger" }] },
          { id: "ss-7998", scenario: "активен", requester: "Илья Орлов · служба поддержки Contoso", reason: "Проверить задержку отправки по обращению CS-7998", scope: "Только диагностика", period: "Осталось 12 минут", status: "Доступ активен", tone: "success", explanation: "Специалист работает в пределах согласованной области.", operationCode: "sup-41c2", actions: [{ command: "support-revoke", label: "Завершить доступ", variant: "danger" }] },
          { id: "ss-7812", scenario: "завершён", requester: "Елена Кузнецова · служба поддержки Contoso", reason: "Диагностика календаря по обращению CS-7812", scope: "Только диагностика календаря", period: "Завершён 3 августа в 16:42", status: "Завершён", tone: "info", explanation: "Доступ больше не действует.", operationCode: "sup-4a11", actions: [] }
        ] }
    ]},
    { title: "Подготовка ресурсов", items: [
      { id: "PROV-CLIENTS-001", mark: "СК", title: "Сервисные клиенты", kind: "table", operation: "provisioning.clients.list", scope: "Провайдер", selectable: true,
        purpose: "Интеграционные учётные записи с ограниченными разрешениями, сроком действия и секретами только для записи вместо общих бессрочных учётных данных.",
        columns: [{ key: "client", label: "Клиент" }, { key: "scope", label: "Область" }, { key: "used", label: "Последнее использование" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "cl-11", client: "hr-provisioner", subtitle: "клиент cl-11 · секрет сменён 8 дней назад", scope: "Northwind Example · управление пользователями", used: "3 мин назад", status: "Активен" },
          { id: "cl-18", client: "reseller-import", subtitle: "учётные данные клиента mTLS и OAuth", scope: "EMEA Partners · создание организаций", used: "2 ч назад", status: "Активен" },
          { id: "cl-27", client: "legacy-sync", subtitle: "смена секрета просрочена", scope: "Adatum Corporation · просмотр пользователей", used: "41 день назад", status: "Истёк" }
        ], tableActions: [{ command: "revoke", label: "Отозвать выбранные", requiresSelection: true }, { command: "create-secret", label: "Создать клиента", variant: "primary" }],
        detailActions: [{ command: "create-secret", label: "Сменить секрет" }, { command: "revoke", label: "Отозвать", variant: "danger" }], total: "3 из 42 клиентов" },
      { id: "PROV-SCIM-001", mark: "СМ", title: "Подключения SCIM", kind: "detail", operation: "provisioning.scim.update", scope: "Выбранная организация", revision: "14",
        purpose: "Стандартизированная конечная точка подготовки ресурсов, сопоставления и политика сверки с секретом доступа только для записи.", authority: "Клиент SCIM владеет профилем учётной записи; Aurora владеет жизненным циклом почтового ящика",
        tabs: ["Конечная точка", "Сопоставления", "Сверка"], fields: [
          { label: "Основной URL", value: "https://aurora.example/scim/v2/northwind", readonly: true, dir: "ltr" },
          { label: "Токен доступа", value: "только для записи · сменён 2026-07-24", readonly: true, help: "Повторное чтение невозможно; смена создаёт новый секрет." },
          { label: "Сопоставление внешнего ID", value: "employeeId", type: "select", options: ["employeeId", "objectGuid", "настраиваемый устойчивый ID"] },
          { label: "Поведение при отключении", value: "Приостановить и создать дело об удалении", type: "select", options: ["Только приостановить", "Приостановить и создать дело об удалении"] },
          { label: "Политика конфликтов", value: "Изолировать неопределённые записи", type: "select", options: ["Изолировать неопределённые записи", "Отклонить пакет"] },
          { label: "Плановая сверка", value: "Каждые 6 часов", type: "select", options: ["Каждый час", "Каждые 6 часов", "Ежедневно"] }
        ], securityRows: [
          { title: "Проверка конечной точки", meta: "TLS и авторизация проверены · 10:48", status: "Исправно" },
          { title: "Последняя сверка", meta: "486 совпадений · 2 неопределённо · без автоматического объединения", status: "Частичный результат" },
          { title: "Состояние токена", meta: "Истекает через 82 дня · владелец hr-platform@…", status: "Активен" }
        ], actions: [{ command: "test", label: "Проверить конечную точку" }, { command: "create-secret", label: "Сменить токен" }] },
      { id: "PROV-DIRECTORY-001", mark: "КТ", title: "Коннекторы служб каталогов", kind: "table", operation: "provisioning.directory.list", scope: "Провайдер",
        purpose: "Коннекторы служб каталогов с явным владельцем, безопасным состоянием и редакцией сопоставления; пароли и исходные данные коннектора не возвращаются.",
        columns: [{ key: "connector", label: "Коннектор" }, { key: "authority", label: "Источник полномочий" }, { key: "last", label: "Последняя сверка" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "dir-hr", connector: "Northwind HR", subtitle: "SCIM · редакция сопоставления 14", authority: "Профиль и жизненный цикл", last: "10:41", status: "Частичный результат" },
          { id: "dir-ad", connector: "Adatum Entra ID", subtitle: "Адаптер azure-directory v3", authority: "Профиль", last: "10:54", status: "Исправно" },
          { id: "dir-ldap", connector: "Tailspin LDAP", subtitle: "Устаревший адаптер · учётные данные только для записи", authority: "Профиль", last: "31 июля", status: "Ошибка" }
        ], tableActions: [{ command: "create", label: "Добавить коннектор", variant: "primary" }], detailActions: [{ command: "test", label: "Безопасная проверка" }, { command: "open-object-detail", label: "Сопоставления" }], fieldLabels: { connector: "Коннектор", authority: "Управляемые данные", last: "Последняя сверка", status: "Состояние" }, total: "3 из 18 коннекторов" },
      { id: "PROV-JOBS-001", mark: "ЗД", title: "Задания подготовки ресурсов", kind: "table", operation: "provisioning.jobs.list", scope: "Провайдер",
        purpose: "Запуски импорта и сверки с результатом каждого элемента, контрольной точкой и идемпотентным повтором.",
        columns: [{ key: "job", label: "Задание" }, { key: "scope", label: "Область" }, { key: "result", label: "Результат" }, { key: "status", label: "Итог", status: true }],
        rows: [
          { id: "job-8001", job: "Сверка Northwind Example", subtitle: "версия сопоставления 14 · контрольная точка 486", scope: "Northwind Example", result: "486 успешно · 2 неопределённо", status: "Частичный результат" },
          { id: "job-7998", job: "Разностный импорт Adatum", subtitle: "идемпотентность …dd31", scope: "Adatum Corporation", result: "37 обновлено", status: "Успешно" },
          { id: "job-7982", job: "Полный импорт Tailspin", subtitle: "ошибка проверки личности коннектора", scope: "Tailspin Toys", result: "0 применено", status: "Ошибка" }
        ], detailActions: [{ command: "retry", label: "Повторить с контрольной точки" }, { command: "copy", label: "Копировать код операции" }], total: "3 из 4 812 заданий" },
      { id: "PROV-ADAPTER-001", mark: "ПИ", title: "Подключения инфраструктуры", kind: "table", operation: "provisioning.adapters.list", scope: "Провайдер",
        purpose: "Поддерживаемые подключения к службам провайдера, их назначения организациям, совместимость и состояние.",
        columns: [{ key: "adapter", label: "Подключение" }, { key: "purpose", label: "Назначение" }, { key: "usage", label: "Организации" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "ad-mail", adapter: "Основной почтовый кластер", subtitle: "Встроенное подключение · версия 10.0.3", purpose: "Почта", usage: "185", status: "Исправно" },
          { id: "ad-storage", adapter: "Объектное хранилище EU", subtitle: "Подписанное подключение провайдера", purpose: "Файлы", usage: "146", status: "Исправно" },
          { id: "ad-entra", adapter: "Microsoft Entra ID", subtitle: "Подписанный коннектор · версия 3.4.1", purpose: "Служба каталогов", usage: "4", status: "Исправно" }
        ], detailFields: [{ key: "purpose", label: "Назначение" }, { key: "usage", label: "Организации" }, { key: "status", label: "Состояние", status: true }], detailActions: [{ command: "open-object-detail", label: "Открыть подключение" }], total: "3 подключения" },
      { id: "PROV-MAIL-001", mark: "ПС", title: "Основная почта", kind: "table", operation: "provider.mail_infrastructure.list", scope: "Провайдер", allowedAccessProfiles: ["superadmin", "provider-admin"],
        purpose: "Основные почтовые подключения, их маршрутизация, два набора адресов и объявленные возможности.",
        notice: { tone: "info", text: "Точный домен выбирается раньше единственного подключения для остальных доменов. В организациях с мультитенантностью сервер назначается организации целиком." },
        columns: [{ key: "name", label: "Подключение" }, { key: "routing", label: "Маршрутизация" }, { key: "assignments", label: "Организации" }, { key: "capabilities", label: "Возможности" }],
        rows: [
          { id: "backend-default", name: "Основной сервер провайдера", subtitle: "Внутренние и публичные адреса различаются", routing: "Остальные домены", assignments: "Дефолтная + 184", capabilities: "IMAP · SMTP · квоты · управление ящиками", domains: "", defaultForUnmatched: true, internalImapHost: "mail-primary.internal", internalImapPort: "143", internalImapSecurity: "Без шифрования (защищённая сеть)", internalSmtpHost: "mail-primary.internal", internalSmtpPort: "25", internalSmtpSecurity: "Без шифрования (защищённая сеть)", publicImapHost: "imap.contoso-mail.example", publicImapPort: "993", publicImapSecurity: "TLS", publicSmtpHost: "smtp.contoso-mail.example", publicSmtpPort: "587", publicSmtpSecurity: "STARTTLS", usernameFormat: "Полный адрес", detailActions: [{ command: "edit-mail-backend", label: "Изменить подключение", variant: "primary" }] },
          { id: "backend-special", name: "Сервер особых доменов", subtitle: "Отдельная инфраструктура", routing: "northwind.example · tailspin.example", assignments: "2", capabilities: "IMAP · SMTP", domains: "northwind.example\ntailspin.example", defaultForUnmatched: false, internalImapHost: "mail-special.internal", internalImapPort: "143", internalImapSecurity: "Без шифрования (защищённая сеть)", internalSmtpHost: "mail-special.internal", internalSmtpPort: "25", internalSmtpSecurity: "Без шифрования (защищённая сеть)", publicImapHost: "imap.special-mail.example", publicImapPort: "993", publicImapSecurity: "TLS", publicSmtpHost: "smtp.special-mail.example", publicSmtpPort: "587", publicSmtpSecurity: "STARTTLS", usernameFormat: "Полный адрес", detailActions: [{ command: "edit-mail-backend", label: "Изменить подключение", variant: "primary" }] }
        ],
        tableActions: [{ command: "create-mail-backend", label: "Добавить почтовое подключение", variant: "primary" }], total: "2 основных подключения · один сервер для остальных доменов" },
      { id: "PROV-MAIL-PROFILES-001", mark: "ВП", title: "Внешние почтовые профили", kind: "table", operation: "provider.mail_profiles.list", scope: "Провайдер", allowedAccessProfiles: ["superadmin", "provider-admin"],
        purpose: "Глобальные профили внешних пользовательских ящиков и явный просмотр частных профилей организаций.",
        notice: { tone: "info", text: "Внешние профили не участвуют в маршрутизации основной почты. Gmail OAuth настраивается в разделе «Интеграции»." },
        choiceFilter: { type: "checkbox", label: "Показать профили организаций", key: "visibility", defaultValue: "Провайдер", allValue: "all", defaultTotalNoun: "глобальных профиля", allTotalNoun: "профиля с владельцами" },
        columns: [{ key: "name", label: "Профиль" }, { key: "owner", label: "Владелец" }, { key: "authentication", label: "Вход" }, { key: "availability", label: "Доступность", status: true }],
        rows: [
          { id: "global-gmail", name: "Gmail", subtitle: "imap.gmail.com · smtp.gmail.com", owner: "Провайдер", authentication: "Пароль приложения", availability: "Доступен организациям", visibility: "Провайдер", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", scopeType: "provider_global", detailActions: [{ command: "edit-mail-profile", label: "Изменить профиль", variant: "primary" }] },
          { id: "global-gmail-oauth", name: "Gmail (OAuth2)", subtitle: "imap.gmail.com · smtp.gmail.com", owner: "Провайдер", authentication: "OAuth 2.0", availability: "Доступен организациям", visibility: "Провайдер", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", scopeType: "provider_global", detailActions: [{ command: "open-route", targetRouteId: "PROV-INT-001", label: "Открыть интеграцию Google" }] },
          { id: "tenant-fastmail", name: "Почта команды", subtitle: "imap.fastmail.com · smtp.fastmail.com", owner: "Northwind Example", authentication: "Пароль приложения", availability: "Частный профиль", visibility: "Организация", imapHost: "imap.fastmail.com", smtpHost: "smtp.fastmail.com", scopeType: "tenant_private", detailActions: [{ command: "open-managed-scope", label: "Открыть в организации" }] },
          { id: "tenant-legacy", name: "Архивная почта", subtitle: "imap.archive.example · smtp.archive.example", owner: "Adatum Corporation", authentication: "Пароль", availability: "Частный профиль", visibility: "Организация", imapHost: "imap.archive.example", smtpHost: "smtp.archive.example", scopeType: "tenant_private", detailActions: [{ command: "open-managed-scope", label: "Открыть в организации" }] }
        ],
        tableActions: [{ command: "create-mail-profile", label: "Добавить глобальный профиль", variant: "primary" }], total: "2 глобальных профиля" }
    ]},
    { title: "Люди и домены", items: [
      { id: "ADM-USERS-001", mark: "ЛЮ", title: "Пользователи", kind: "table", operation: "admin.users.list", scope: "Выбранная организация",
        purpose: "Пользователи выбранной организации, их состояние и использование хранилища.",
        featureOverrides: { "directory-records": { purpose: "Пользователи выбранной организации, их состояние и использование хранилища. Внешний способ управления отмечается только там, где он действительно есть.", total: "4 из 486 пользователей" } },
        columns: [{ key: "name", label: "Пользователь" }, { key: "quota", label: "Хранилище" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "u-1001", name: "Анна Волкова", subtitle: "anna@northwind.example", email: "anna@northwind.example", role: "Администратор организации", quotaProfile: "Расширенный 25 ГБ", quota: "6,8 / 25 ГБ", status: "Активен", management: "В Aurora", workflowImpacts: [{ title: "Анна Волкова", meta: "Пользователь управляется в Aurora", status: "Проверено" }, { title: "Сеансы и устройства", meta: "4 сеанса · 2 устройства", status: "Требует внимания" }, { title: "Почтовый сервер", meta: "не изменяется без возможности адаптера", status: "Не изменяется" }] },
          { id: "u-1042", name: "Алексей Смирнов", subtitle: "alexey@northwind.example", email: "alexey@northwind.example", role: "Пользователь", quotaProfile: "Расширенный 25 ГБ", quota: "18,4 / 25 ГБ", status: "Активен", management: "В Aurora", workflowImpacts: [{ title: "Алексей Смирнов", meta: "Пользователь управляется в Aurora", status: "Проверено" }, { title: "Сеансы и устройства", meta: "4 сеанса · 2 устройства", status: "Требует внимания" }, { title: "Почтовый сервер", meta: "не изменяется без возможности адаптера", status: "Не изменяется" }] },
          { featureKey: "directory-records", id: "u-1077", name: "Мария Соколова", subtitle: "maria@northwind.example", email: "maria@northwind.example", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", quota: "4,2 / 10 ГБ", status: "Приостановлен", management: "В корпоративном каталоге", sourceBadge: "Корпоративный каталог", workflowImpacts: [{ title: "Мария Соколова", meta: "Корпоративный каталог остаётся источником профиля", status: "Проверено" }, { title: "Сеансы и устройства", meta: "4 сеанса · 2 устройства", status: "Требует внимания" }, { title: "Почтовый сервер", meta: "не изменяется без возможности адаптера", status: "Не изменяется" }] },
          { featureKey: "directory-records", id: "u-1188", name: "Олег Власов", subtitle: "oleg@northwind.example", email: "oleg@northwind.example", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", quota: "9,1 / 10 ГБ", status: "Требует внимания", management: "Через SCIM", sourceBadge: "SCIM", workflowImpacts: [{ title: "Олег Власов", meta: "SCIM остаётся источником профиля", status: "Проверено" }, { title: "Сеансы и устройства", meta: "4 сеанса · 2 устройства", status: "Требует внимания" }, { title: "Почтовый сервер", meta: "не изменяется без возможности адаптера", status: "Не изменяется" }] }
        ], tableActions: [{ command: "create", label: "Добавить пользователя", variant: "primary" }, { command: "download-view", label: "Скачать список пользователей" }],
        downloadFilename: "northwind-example-users.csv",
        detailActions: [{ command: "open-route", targetRouteId: "ADM-USER-001", label: "Открыть карточку" }], total: "2 из 484 пользователей" },
      { id: "ADM-USER-001", mark: "КР", title: "Карточка пользователя", hiddenInNavigation: true, requiresContext: true, sourceRouteId: "ADM-USERS-001", kind: "detail", operation: "admin.users.update", scope: "Выбранная организация", revision: "18",
        purpose: "Профиль, доступ и состояние безопасности выбранного пользователя.",
        tabs: ["Профиль", "Доступ", "Безопасность", "Устройства"], fields: [
          { tab: "Профиль", label: "Организация", value: "Northwind Example", readonly: true },
          { tab: "Профиль", key: "email", label: "Основной адрес", readonly: true }, { tab: "Профиль", key: "name", label: "Отображаемое имя" },
          { tab: "Профиль", featureKey: "directory-records", key: "management", label: "Где управляется пользователь", readonly: true },
          { tab: "Доступ", key: "role", label: "Роль", type: "select", options: ["Пользователь", "Администратор организации"] },
          { tab: "Доступ", key: "quotaProfile", label: "Профиль квоты", type: "select", options: ["Стандартный 10 ГБ", "Расширенный 25 ГБ"] }
        ], securityRows: [
          { title: "MFA", meta: "2 ключа доступа · восстановление готово", status: "Исправно" },
          { title: "Сеансы", meta: "4 активных · усиленная проверка 17 мин назад", status: "Активны" },
          { featureKey: "directory-records", title: "Жизненный цикл службы каталогов", meta: "Источник приостановлен; ожидается сверка", status: "Ожидает" }
        ], deviceRows: [
          { title: "Устройства пользователя", meta: "Подробный список устройств для этой записи недоступен; активные сеансы показаны на вкладке «Безопасность»", status: "Нет сведений" }
        ], tabSectionTitles: { "Безопасность": "Состояние безопасности", "Устройства": "Устройства пользователя" },
        tabActions: {
          "Профиль": [{ command: "discard", label: "Отменить", variant: "ghost" }, { command: "save", label: "Сохранить изменения", variant: "primary" }],
          "Доступ": [{ command: "discard", label: "Отменить", variant: "ghost" }, { command: "save", label: "Сохранить изменения", variant: "primary" }, { command: "open-route", targetRouteId: "ADM-DEPROVISION-001", label: "Доступ и удаление", variant: "danger" }],
          "Безопасность": [{ command: "revoke", label: "Отозвать сеансы" }],
          "Устройства": []
        } },
      { id: "ADM-DEPROVISION-001", mark: "УХ", title: "Доступ и удаление", hiddenInNavigation: true, requiresContext: true, sourceRouteId: "ADM-USERS-001", kind: "deprovision", operation: "admin.users.deprovision", scope: "Выбранная организация",
        purpose: "Деактивация обратима и не меняет почтовый сервер. Удаление — отдельное подтверждаемое действие с оценкой последствий.",
        deleteImpacts: [{ title: "Данные Aurora", meta: "Файлы, календари, контакты и общие доступы обрабатываются по политике удаления", status: "Требует решения" }, { title: "Владение", meta: "Ресурсы можно передать другому пользователю", status: "Доступна передача" }, { title: "Почтовый сервер", meta: "Удаление и пересылка недоступны без объявленной возможности адаптера", status: "Не изменяется" }],
        featureOverrides: {
          "protected-user-session": { allowImpersonation: true },
          "mail-user-lifecycle-hooks": {
            mailServerHook: { action: "delete-mail-account", label: "Удалить учётную запись на почтовом сервере", help: "Команда будет передана подключённому почтовому адаптеру; результат записывается отдельно." },
            deleteImpacts: [{ title: "Данные Aurora", meta: "Файлы, календари, контакты и общие доступы обрабатываются по политике удаления", status: "Требует решения" }, { title: "Владение", meta: "Ресурсы можно передать другому пользователю", status: "Доступна передача" }, { title: "Почтовый сервер", meta: "Подключённый адаптер принимает команду удаления учётной записи; пересылка и автоответ не включаются автоматически", status: "Доступно отдельно" }]
          }
        } },
      { id: "ADM-GROUPS-001", mark: "ГР", title: "Группы", kind: "table", operation: "admin.groups.list", scope: "Выбранная организация",
        purpose: "Группы, владельцы и состав с явным источником полномочий.",
        columns: [{ key: "name", label: "Группа" }, { key: "members", label: "Участники" }, { key: "owner", label: "Владелец" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "g-sales", name: "sales@northwind.example", subtitle: "Рассылка и общая учётная запись", members: "84", owner: "Отдел продаж", status: "Активна" },
          { id: "g-support", name: "support@northwind.example", subtitle: "Поддерживает очередь", members: "36", owner: "Служба поддержки клиентов", status: "Активна" },
          { id: "g-project", name: "phoenix-project@northwind.example", subtitle: "12 внешних участников", members: "48", owner: "Нина Петрова", status: "Требует проверки" }
        ], tableActions: [{ command: "create", label: "Создать группу", variant: "primary" }, { command: "download-view", label: "Скачать список групп" }], downloadFilename: "northwind-example-groups.csv", total: "3 из 57 групп" },
      { id: "ADM-DOMAINS-001", mark: "ДМ", title: "Домены", kind: "table", operation: "admin.domains.read", scope: "Выбранная организация", details: false,
        purpose: "Домены выбранной организации без DNS-диагностики и дублирования параметров почтового сервера.",
        notice: { tone: "info", text: "Aurora не настраивает и не диагностирует DNS. Параметры почтовых клиентов находятся в разделе «Основная почта»." },
        columns: [{ key: "domain", label: "Домен" }, { key: "mailService", label: "Основная почта" }],
        rows: [
          { id: "domain-northwind", domain: "northwind.example", mailService: "Почта Contoso" },
          { id: "domain-sales", domain: "sales.northwind.example", mailService: "Почта Contoso" },
          { id: "domain-hosted", domain: "northwind.mail.contoso.example", mailService: "Почта Contoso" }
        ], total: "3 домена · один основной почтовый сервис" },
      { id: "ADM-MAIL-001", mark: "ПС", title: "Основная почта", kind: "detail", operation: "admin.primary_mail.get", scope: "Выбранная организация",
        purpose: "Публичные настройки назначенной почтовой услуги без внутренних адресов, секретов и альтернативного пула.",
        notice: { tone: "info", text: "Подключение назначено и управляется провайдером. Эти параметры предназначены для настройки внешних почтовых клиентов." },
        tabs: ["Публичные настройки"], fields: [
          { label: "Почтовая услуга", value: "Почта Contoso", readonly: true },
          { label: "IMAP-сервер", value: "imap.contoso-mail.example", readonly: true, dir: "ltr" },
          { label: "IMAP-порт и защита", value: "993 · TLS", readonly: true },
          { label: "SMTP-сервер", value: "smtp.contoso-mail.example", readonly: true, dir: "ltr" },
          { label: "SMTP-порт и защита", value: "587 · STARTTLS", readonly: true },
          { label: "Способ входа", value: "Пароль", readonly: true },
          { label: "Формат имени пользователя", value: "Полный адрес электронной почты", readonly: true },
          { label: "Доступные возможности", value: "Чтение, отправка и квота", readonly: true }
        ] },
      { id: "ADM-MAIL-PROFILES-001", mark: "ВП", title: "Внешние почтовые профили", kind: "table", operation: "admin.mail_profiles.list", scope: "Выбранная организация",
        purpose: "Опубликованные провайдером и частные профили добавляемых пользователями внешних ящиков.",
        notice: { tone: "info", text: "Gmail OAuth принадлежит роли Google в разделе «Интеграции». Внешние профили не участвуют в маршрутизации основной почты организации." },
        columns: [{ key: "name", label: "Профиль" }, { key: "origin", label: "Источник" }, { key: "authentication", label: "Вход" }, { key: "access", label: "Доступ всем пользователям", toggle: true }],
        rows: [
          { id: "mail-gmail", name: "Gmail", subtitle: "imap.gmail.com · smtp.gmail.com", origin: "Провайдер", authentication: "Пароль приложения", access: "Запрещён", enabled: false, toggleKind: "mail-profile", scopeType: "provider_global", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", driver: "generic-imap-smtp" },
          { id: "mail-gmail-oauth", name: "Gmail (OAuth2)", subtitle: "imap.gmail.com · smtp.gmail.com", origin: "Провайдер", authentication: "OAuth 2.0", access: "В интеграциях", scopeType: "provider_global", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", driver: "google.gmail", detailActions: [{ command: "open-route", targetRouteId: "ADM-INT-001", label: "Открыть интеграцию Google" }] }
        ],
        detailFields: [{ key: "origin", label: "Источник" }, { key: "authentication", label: "Способ входа" }, { key: "imapHost", label: "IMAP-сервер" }, { key: "smtpHost", label: "SMTP-сервер" }],
        tableActions: [{ command: "create-mail-profile", label: "Добавить профиль почтового сервера", variant: "primary" }], total: "2 внешних профиля · обычный Gmail запрещён" },
      { id: "ADM-INT-001", mark: "ИН", title: "Интеграции", kind: "table", operation: "admin.integration_roles.list", scope: "Выбранная организация",
        purpose: "Опубликованные провайдером роли внешних сервисов и только сужающие разрешения выбранной организации без секретов и пользовательских токенов.",
        notice: { tone: "info", text: "Пользователь связывает с Aurora только один Google-аккаунт. Вход, Gmail и Диск Google подтверждают одну и ту же Google-личность, но запрашивают отдельные согласия; другой аккаунт потребует явной замены." },
        toggleSummaryNoun: "Ролей",
        columns: [{ key: "role", label: "Роль" }, { key: "purpose", label: "Назначение" }, { key: "availability", label: "Доступность", toggle: true }],
        rows: [],
        total: "3 роли · Google-вход и Gmail исходно запрещены · Диск Google запрещён провайдером" }
    ]},
    { title: "Управление", items: [
      { id: "ADM-POLICY-001", mark: "ПЛ", title: "Политики безопасности", kind: "policy", operation: "admin.policy.publish", scope: "Выбранная организация", revision: "42",
        purpose: "Итоговая политика по цепочке «глобальная политика провайдера → тариф и набор возможностей → политика организации» с разрешением только на ужесточение и безопасной публикацией редакции.",
        policyRows: [
          { name: "Минимальная длина пароля", origin: "Базовое значение провайдера", effective: "14 символов", draft: "16 символов" },
          { name: "Автоматическая внешняя пересылка", origin: "Минимум безопасности провайдера", effective: "Запрещено", locked: true },
          { name: "Срок действия сеанса", origin: "Переопределение организации", effective: "12 часов", draft: "8 часов", options: ["4 часа", "8 часов", "12 часов"] },
          { name: "Доступ по устаревшим протоколам", origin: "Минимум безопасности провайдера", effective: "Запрещено", locked: true }
        ] },
      { id: "ADM-FEATURES-001", mark: "ФЛ", title: "Доступность функций", kind: "matrix", operation: "admin.features.assign", scope: "Выбранная организация", revision: "11",
        purpose: "Реализованные возможности, коммерческое тарифное право и назначение политики показаны раздельно с объяснимым итоговым состоянием.",
        tenantCapabilities: [
          { key: "directory-services", name: "Коннектор службы каталогов", description: "Недоступен организации; пользователи и группы управляются в Aurora", status: "Запрещён", tone: "warning", action: { command: "enable-directory-services", label: "Разрешить" } }
        ],
        featureOverrides: { "directory-services": { tenantCapabilities: [
          { key: "directory-services", name: "Коннектор службы каталогов", description: "Разрешён для организации; настройка и синхронизация выполняются отдельно", status: "Разрешён", tone: "success", action: { command: "disable-directory-services", label: "Запретить", variant: "danger" } }
        ] } },
        matrixLabel: "Возможность", matrixColumns: ["Все сотрудники", "Поддержка", "Руководители"],
        matrixRows: [
          { name: "Календарь", meta: "Лицензировано", values: { "Все сотрудники": "Включено", "Поддержка": "Включено", "Руководители": "Включено" } },
          { name: "Внешние ссылки на файлы", meta: "возможность v1.0 · политика организации", values: { "Все сотрудники": "Включено · 30 дней", "Поддержка": "Включено · 7 дней", "Руководители": "Включено · 30 дней" } },
          { name: "Внешние приглашения календаря", meta: "возможность v1.0 · политика организации", values: { "Все сотрудники": "Включено", "Поддержка": "Включено", "Руководители": "Включено" } },
          { name: "Помощник ИИ", meta: "Дополнение на 120 мест", values: { "Все сотрудники": "Выключено", "Поддержка": "Пилот", "Руководители": "Включено" } },
          { name: "Внешняя пересылка", meta: "Заблокировано провайдером", values: { "Все сотрудники": "Заблокировано", "Поддержка": "Заблокировано", "Руководители": "Заблокировано" } }
        ] },
      { id: "ADM-QUOTAS-001", mark: "КВ", title: "Квоты и лимиты", kind: "policy", operation: "admin.quotas.publish", scope: "Выбранная организация", revision: "27",
        purpose: "Коммерческий предел, распределение провайдера и значения организации по умолчанию показаны как разные уровни.", policyRows: [
          { name: "Почтовый ящик по умолчанию", origin: "Распределение организации", effective: "10 ГБ", draft: "12 ГБ", options: ["5 ГБ", "10 ГБ", "12 ГБ", "25 ГБ"] },
          { name: "Максимум почтового ящика", origin: "Тариф провайдера", effective: "25 ГБ", locked: true },
          { name: "Максимум вложения", origin: "Базовое ограничение безопасности", effective: "35 МБ", locked: true },
          { name: "Хранилище организации", origin: "Подписка", effective: "12 ТБ", locked: true }
        ] },
      { id: "ADM-SSO-001", mark: "ЕВ", title: "SSO и аутентификация", kind: "detail", operation: "admin.sso.update", scope: "Выбранная организация", revision: "8",
        purpose: "Корпоративный вход через OIDC или SAML. Вход через Google разрешается отдельно в разделе «Интеграции» и не настраивается на этом экране.", authority: "Организация задаёт корпоративного поставщика удостоверений; Aurora проверяет утверждение и сохраняет безопасный резервный вход администраторов.",
        editableSettings: true,
        tabs: ["Настройка"], fields: [
          { key: "state", label: "Доступность", value: "Выключен", type: "select", options: ["Выключен", "Разрешён всем пользователям"] },
          { key: "protocol", label: "Протокол", value: "OpenID Connect", type: "select", options: ["OpenID Connect", "SAML 2.0"] },
          { key: "displayName", label: "Название на экране входа", value: "Корпоративный вход", required: true },
          { key: "issuer", label: "Издатель или адрес метаданных", value: "https://id.northwind.example", dir: "ltr", required: true },
          { key: "clientId", label: "Идентификатор клиента", value: "aurora-corporate", dir: "ltr", required: true },
          { key: "clientSecret", label: "Новый секрет клиента", value: "", dir: "ltr", secret: true, help: "Оставьте пустым, чтобы сохранить действующий секрет. Существующее значение никогда не возвращается." },
          { key: "subjectClaim", label: "Утверждение идентификатора пользователя", value: "email", dir: "ltr", required: true },
          { key: "nameClaim", label: "Утверждение отображаемого имени", value: "name", dir: "ltr" },
          { key: "recovery", label: "Резервный вход", value: "Локальный вход администраторов сохранён", readonly: true }
        ], actions: [{ command: "test", label: "Проверить соединение" }, { command: "save-detail-settings", label: "Сохранить настройки", variant: "primary" }] },
      { id: "ADM-MOBILE-001", mark: "МБ", title: "Мобильная безопасность", kind: "mobile", operation: "admin.mobile_policy.get", scope: "Выбранная организация", revision: "редакция мобильной политики 12",
        purpose: "Провайдер видит базовую мобильную политику выбранной организации; инвентаризация и действия над устройствами появляются только при наличии итоговой возможности управления устройствами.",
        policyRows: [
          { name: "Минимальная версия Aurora Mobile", origin: "Минимум провайдера", effective: "10.0", draft: "10.0", locked: true },
          { name: "Блокировка приложения", origin: "Политика организации", effective: "Через 5 минут", draft: "Через 5 минут", options: ["Сразу", "Через 1 минуту", "Через 5 минут"] },
          { name: "Автономная работа", origin: "Максимум провайдера", effective: "До 24 часов", draft: "До 12 часов", options: ["Запрещена", "До 4 часов", "До 12 часов", "До 24 часов"] },
          { name: "Обмен корпоративными данными", origin: "Политика организации", effective: "Только управляемые приложения", draft: "Только управляемые приложения", options: ["Запрещён", "Только управляемые приложения"] }
        ],
        managedDevices: {
          featureKey: "mobile-device-management",
          title: "Управляемые устройства и соответствие требованиям",
          operation: "admin.mobile_devices.list",
          columns: [{ key: "device", label: "Устройство" }, { key: "user", label: "Пользователь" }, { key: "seen", label: "Последняя связь" }, { key: "status", label: "Статус", status: true }],
          rows: [
            { id: "d-44", device: "iPhone 17 Pro", subtitle: "Aurora Mobile 10.0", user: "alexey@…", seen: "2 мин", status: "Соответствует" },
            { id: "d-52", device: "Pixel 11", subtitle: "Aurora Mobile 10.0", user: "maria@…", seen: "21 день", status: "Требует проверки" },
            { id: "d-61", device: "iPad Air", subtitle: "Aurora Mobile 9.8", user: "oleg@…", seen: "7 часов", status: "Активно" }
          ],
          tableActions: [],
          detailActions: [{ command: "wipe", operation: "admin.mobile_devices.wipe", label: "Выборочно удалить данные", variant: "danger" }], total: "3 из 214 устройств"
        } },
      { id: "AI-POLICY-001", mark: "ИИ", title: "Политика ИИ", kind: "policy", operation: "ai.policy.publish", scope: "Выбранная организация", revision: "6",
        purpose: "Тарифное право ИИ, согласие, хранение и аудит без просмотра запросов и содержимого сообщений.",
        notice: { tone: "warning", text: "Провайдер видит состояние политики и агрегированные результаты, но не запросы, тела сообщений или созданное содержимое." },
        policyRows: [
          { name: "Помощник ИИ", origin: "Тарифное право провайдера", effective: "Пилотные группы", draft: "Пилотные группы", options: ["Выключено", "Пилотные группы", "Все лицензированные пользователи"] },
          { name: "Направление во внешнюю модель", origin: "Граница данных провайдера", effective: "Запрещено", locked: true },
          { name: "Хранение запросов", origin: "Конфиденциальность организации", effective: "0 дней", draft: "0 дней", options: ["0 дней", "7 дней"] },
          { name: "Обратная связь человека", origin: "Согласие организации", effective: "Выключено", draft: "Выключено", options: ["Выключено", "По согласию"] }
        ] }
    ]},
    { title: "Операции", items: [
      { id: "ADM-AUDIT-001", mark: "АУ", title: "Административная активность", kind: "activity", operation: "admin.audit.list", scope: "Явная область",
        purpose: "Сквозной аудит приложения с фильтрацией по текущей разрешённой области и скрытием чувствительных целей.",
        downloadLabel: "Скачать текущую выборку",
        downloadFilename: "northwind-example-admin-activity.csv",
        downloadColumns: [{ key: "time", label: "Время" }, { key: "actor", label: "Исполнитель" }, { key: "action", label: "Действие" }, { key: "target", label: "Объект" }, { key: "outcome", label: "Результат" }],
        events: [
          { time: "Сегодня, 11:12", ageHours: 1, actor: "anna@northwind.example", action: "Публикация политики", target: "Northwind Example · версия 42", outcome: "Успешно", correlation: "aud-7f3a" },
          { time: "Сегодня, 10:58", ageHours: 2, actor: "elena@contoso.example", action: "Использование доступа поддержки", target: "Northwind Example · CS-8041", outcome: "Успешно", correlation: "aud-53de" },
          { featureKey: "directory-records", time: "3 дня назад, 10:41", ageHours: 72, actor: "Служба синхронизации", action: "Сверка службы каталогов", target: "Коннектор HR", outcome: "Частичный результат", correlation: "aud-b100" },
          { time: "Сегодня, 09:14", ageHours: 3, actor: "Неизвестный сеанс", action: "Скачивание административной активности", target: "Northwind Example", outcome: "Отказ", correlation: "aud-c812" }
        ], total: "4 из 94 830 событий в области" },
      { id: "ADM-STATS-001", mark: "СТ", title: "Использование и статистика", kind: "overview", operation: "admin.statistics.query", scope: "Явная область",
        purpose: "Сводка использования управляемых организаций, качества полученных данных и показателей, разрешённых для расчётов с клиентами.",
        notice: { tone: "info", text: "Для расчётов с клиентами используйте только показатели, прямо отмеченные как расчётные." },
        metrics: [
          { label: "Активные организации", value: "181 из 184", meta: "Обновлено сегодня в 11:10" },
          { label: "Назначенные лицензии", value: "42 806", meta: "По всем управляемым организациям" },
          { label: "Учтённое хранилище", value: "612 ТБ", meta: "По 2 организациям получены неполные данные" },
          { label: "Неуспешные попытки входа", value: "2 418", meta: "По всем организациям за последние 24 часа" }
        ],
        attentionTitle: "Требует внимания", hideFreshness: true,
        attention: [
          { title: "Неполные сведения о хранилище", meta: "По 2 организациям не удалось получить все данные; они не включены в итог", status: "Требует проверки", tone: "warning" }
        ],
        activityTitle: "Использование для расчётов", activityAction: false,
        activity: [
          { title: "Назначенные лицензии", meta: "Можно использовать для расчётов с клиентами", status: "Расчётный показатель", tone: "success" },
          { title: "Остальные показатели", meta: "Предназначены только для ежедневного контроля", status: "Не для расчётов", tone: "info" }
        ] },
      { id: "ADM-DIAG-001", mark: "ДГ", title: "Диагностика", kind: "checks", operation: "admin.diagnostics.run", scope: "Явная область",
        purpose: "Безопасная диагностика со скрытием чувствительных данных, актуальностью и идентификатором связи; исходные журналы, командная оболочка и произвольное управление узлом или паролем отсутствуют.",
        metrics: [{ label: "Основные API", value: "Исправны", meta: "7 / 7" }, { featureKey: "directory-services", label: "Коннектор службы каталогов", value: "Ухудшено", meta: "1 / 4" }, { label: "Очередь p95", value: "28 сек", meta: "окно 15 минут" }],
        checks: [
          { title: "Отправка почты", meta: "синтетическая операция · без содержимого клиента · 11:08", status: "Исправно", correlation: "diag-01aa" },
          { featureKey: "directory-services", title: "Коннектор службы каталогов", meta: "2 неопределённые учётные записи · 10:55", status: "Ухудшено", correlation: "diag-b100" },
          { title: "Доступность календаря", meta: "безопасная проверка · 11:04", status: "Исправно", correlation: "diag-7d2e" }
        ] },
      { id: "ADM-OPS-001", mark: "ИО", title: "История операций", kind: "table", operation: "admin.operations.list", scope: "Явная область",
        purpose: "Уже запущенные долгие и составные действия выбранной области, их происхождение, ход выполнения и итог. Новые действия запускаются на соответствующих предметных экранах.",
        featureOverrides: { "directory-services": { total: "2 операции" } },
        columns: [{ key: "operation", label: "Операция" }, { key: "started", label: "Запущена" }, { key: "progress", label: "Результат" }, { key: "status", label: "Итог", status: true }],
        rows: [
          { featureKey: "directory-services", id: "op-7738", operation: "Сверка службы каталогов", subtitle: "Запущена по расписанию", source: "Служба синхронизации · по расписанию", started: "10:41", progress: "486 успешно · 2 требуют проверки", status: "Частичный результат", detailActions: [{ command: "retry", label: "Повторить неуспешные шаги" }] },
          { id: "op-7720", operation: "Отключение и удаление пользователя", subtitle: "Запустила Анна Волкова", source: "Анна Волкова · вручную", started: "09:14", progress: "доступ закрыт · данные сохранены", status: "Успешно", detailActions: [] }
        ],
        detailFields: [{ key: "source", label: "Кем или как запущена" }, { key: "started", label: "Начало" }, { key: "progress", label: "Результат" }, { key: "status", label: "Итог", status: true }],
        total: "1 операция" },
      { id: "PROV-EVIDENCE-001", mark: "ДТ", title: "Доставка аудита и телеметрии", kind: "detail", operation: "provider.audit_sinks.update", scope: "Провайдер", revision: "19",
        purpose: "Подключение Aurora к средствам наблюдения и SIEM провайдера: ограниченная доставка, контрольная точка, повтор и безопасная схема вместо встроенной универсальной консоли SIEM.",
        authority: "Назначения принадлежат провайдеру · свидетельства приложения и контрольная точка доставки принадлежат Aurora",
        tabs: ["Приёмники аудита", "Телеметрия", "Схемы и инструкции"],
        fields: [
          { label: "Приёмник аудита приложения", value: "HTTPS JSON Lines · активен", readonly: true },
          { label: "Назначение", value: "Сборщик безопасности EU · учётные данные только для записи", readonly: true, help: "Подробности URL и учётных данных доступны только в редакторе черновика и никогда не читаются обратно." },
          { label: "Схема", value: "audit-record v1", type: "select", options: ["audit-record v1"] },
          { label: "Категории", value: "учётные записи + администрирование + общий доступ + агенты", readonly: true },
          { label: "Профиль телеметрии", value: "опрос Prometheus + журналы JSON", type: "select", options: ["опрос Prometheus + журналы JSON", "Prometheus + JSON + OTLP"] },
          { label: "Предел повтора", value: "24 часа", readonly: true, help: "Точный диапазон, источник полномочий и аудит обязательны." }
        ],
        securityRows: [
          { title: "Доставка аудита", meta: "контрольная точка …9af1 · задержка 18 сек · не менее одного раза", status: "Исправно" },
          { title: "Ограниченная очередь", meta: "142 / 50 000 записей · зашифрованный буфер", status: "Исправно" },
          { title: "Сборщик телеметрии", meta: "необязательный OTLP не включён; основные показатели и журналы активны", status: "Поддерживается" },
          { title: "Последняя синтетическая проверка", meta: "схема принята · без данных клиента · 10:52", status: "Проверено" }
        ], actions: [{ command: "test", label: "Синтетическая проверка" }, { command: "retry", label: "Ограниченный повтор" }] },
      { id: "PROV-AGENT-001", mark: "АГ", title: "Доступ агентов", kind: "table", operation: "agent_access.profiles.list", scope: "Провайдер", selectable: true,
        purpose: "Необязательные профили MCP/API только для чтения для внешних аналитических агентов: точные область, инструменты, классы данных, совокупные пределы и полный аудит.",
        notice: { tone: "warning", text: "v1.0 не предоставляет изменение данных, экспорт, повтор, запуск диагностики и произвольные инструменты HTTP, SQL, командной оболочки или файлов. Метаданные клиента никогда не расширяют вычисленные сервером полномочия." },
        columns: [{ key: "profile", label: "Профиль и субъект доступа" }, { key: "scope", label: "Иерархия и инструменты" }, { key: "budget", label: "Пределы" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "agt-soc", profile: "soc-investigator", subtitle: "служебный субъект sp-204 · истекает 2026-09-01", scope: "провайдер · audit.search + statistics.query", budget: "60 запросов/мин · 50 тыс. строк/день", status: "Активен" },
          { id: "agt-nw", profile: "northwind-ops", subtitle: "Northwind Example · аудитория MCP", scope: "организация · operations.get + diagnostics.get", budget: "20 запросов/мин · 5 МБ/день", status: "Активен" },
          { id: "agt-old", profile: "legacy-report-agent", subtitle: "учётные данные отозваны · обнаружение выключено", scope: "reseller:emea · итоговых полномочий нет", budget: "0", status: "Отозван" }
        ],
        tableActions: [{ command: "revoke", label: "Отозвать выбранные", requiresSelection: true }, { command: "create-secret", label: "Создать профиль только для чтения", variant: "primary" }],
        detailActions: [{ command: "create-secret", label: "Сменить учётные данные" }, { command: "revoke", label: "Отозвать", variant: "danger" }], total: "3 из 11 профилей" },
      { id: "ADM-BACKUP-001", mark: "БК", title: "Состояние резервного копирования", kind: "checks", operation: "provider.backup.read", scope: "Явная область",
        purpose: "Готовность восстановления, хранение и свидетельства проверки; разрушительное восстановление создаётся отдельным подтверждаемым запросом.",
        metrics: [{ label: "Последний снимок", value: "38 мин", meta: "регион eu-2" }, { label: "Проверка восстановления", value: "Пройдена", meta: "2026-07-12 · RTO 47 мин" }, { label: "Хранение", value: "35 дней", meta: "договор" }],
        checks: [
          { title: "Цепочка снимков", meta: "цепочка приращений проверена", status: "Исправно", correlation: "bkp-711a" },
          { title: "Реплика календаря", meta: "ожидается удалённая проверка", status: "Ожидает", correlation: "bkp-18e2" },
          { title: "Депонирование KMS", meta: "доступность проверена; ключевой материал скрыт", status: "Проверено", correlation: "bkp-f400" }
        ], actions: [{ command: "restore", label: "Запросить восстановление", variant: "danger" }] }
    ]},
    { title: "Система", items: [
      { id: "PROV-LICENSING-001", mark: "ЛЦ", title: "Лицензия Aurora", kind: "license", operation: "admin.license.get", scope: "Установка", requiredAccessProfile: "superadmin", licenseStatus: "Действует",
        purpose: "Лицензия установленного продукта Aurora: редакция, срок, общий лимит пользователей и разрешение нескольких организаций. Тарифы клиентов управляются отдельно.",
        impacts: [
          { title: "Установка Aurora", meta: "Contoso Cloud Services", status: "Проверена" },
          { title: "Новый ключ", meta: "Проверен непосредственно перед заменой", status: "Действителен" },
          { title: "Аудит", meta: "Исполнитель, установка, действие и результат будут записаны", status: "Включён" }
        ],
        metrics: [
          { label: "Редакция", value: "Aurora Corporate", meta: "Самостоятельная установка" },
          { label: "Срок", value: "До 31 декабря 2026", meta: "Поддержка включена" },
          { label: "Пользователи", value: "3 478 / 5 000", meta: "1 522 места свободно" },
          { label: "Несколько организаций", value: "Разрешено", meta: "Дефолтная организация существует всегда" }
        ] },
      { id: "PROV-DATABASE-001", mark: "БД", title: "База данных", kind: "database", operation: "provider.database.get", scope: "Установка", requiredAccessProfile: "superadmin", exampleState: "outdated",
        purpose: "Установочные параметры и действия базы данных доступны суперадминистратору до подключения к БД; пароль хранится только для записи, а создание и обновление структуры выполняются явно.",
        values: { host: "127.0.0.1:3306", name: "aurora", login: "aurora_app" } },
      { id: "PROV-LOGS-001", mark: "ЖР", title: "Журналы", kind: "logs", operation: "provider.logs.query", scope: "Установка", requiredAccessProfile: "superadmin", enabled: true, detail: "Предупреждения и ошибки",
        purpose: "Базовый встроенный просмотр журналов Aurora работает без внешних систем; чувствительные поля исключаются до записи, а внешняя доставка остаётся дополнительной возможностью.",
        categories: ["Вход", "База данных", "Почта", "Фоновые задачи"],
        columns: [{ key: "time", label: "Время" }, { key: "level", label: "Уровень" }, { key: "category", label: "Подсистема" }, { key: "message", label: "Сообщение" }, { key: "code", label: "Код" }],
        downloadColumns: [{ key: "time", label: "Время" }, { key: "level", label: "Уровень" }, { key: "category", label: "Подсистема" }, { key: "message", label: "Сообщение" }, { key: "code", label: "Код" }],
        downloadFilename: "aurora-logs.csv",
        entries: [
          { time: "Сегодня, 11:12:08", level: "Ошибка", category: "База данных", message: "Не удалось выполнить проверку готовности подключения", code: "DB-CONNECTION-04" },
          { time: "Сегодня, 11:09:42", level: "Предупреждение", category: "Фоновые задачи", message: "Задание будет повторено после временной ошибки", code: "JOB-RETRY-02" },
          { time: "Сегодня, 11:04:17", level: "Сведения", category: "Вход", message: "Вход суперадминистратора выполнен", code: "AUTH-SUCCESS" },
          { time: "Сегодня, 10:58:31", level: "Сведения", category: "Почта", message: "Проверка доступности почтового сервера завершена", code: "MAIL-CHECK-OK" }
        ] }
    ]},
    { title: "Настройки провайдера", items: [
      { id: "PROV-SYSTEM-001", mark: "СН", title: "Системные настройки", kind: "system-settings", operation: "provider.system_settings.update", scope: "Провайдер", requiredAccessProfile: "superadmin",
        purpose: "Системные названия и значения по умолчанию провайдера. Брендирование конкретной организации настраивается в её рабочей области.",
        fields: [
          { key: "productName", label: "Название продукта", value: "Aurora" },
          { key: "mobileAppName", label: "Название мобильного приложения", value: "Aurora Mobile", help: "Это название используется в интерфейсе и сообщениях. Для имени в магазине приложений нужна отдельная подписанная сборка." },
          { key: "providerName", label: "Название провайдера", value: "Contoso Cloud Services" },
          { key: "supportUrl", label: "Адрес службы поддержки", value: "https://help.contoso.example" },
          { key: "defaultLogo", label: "Логотип по умолчанию", value: "contoso-logo.svg", help: "Используется для новых организаций до их собственного брендирования." },
          { key: "primaryColor", label: "Основной цвет по умолчанию", value: "#315FCA" },
          { key: "defaultBrandName", label: "Брендирование новых организаций", value: "Пространство Contoso" },
          { key: "mailDomain", label: "Базовый почтовый домен провайдера", value: "mail.contoso.example" },
          { key: "accessHostnamePattern", label: "Шаблон адреса входа", value: "{организация}.contoso-mail.example" }
        ] }
    ]},
    { title: "Брендирование и расширения", items: [
      { id: "PROV-INT-001", mark: "ИН", title: "Интеграции", kind: "table", operation: "provider.integration_families.list", scope: "Установка", allowedAccessProfiles: ["superadmin", "provider-admin"],
        purpose: "Установленные семейства внешних пользовательских сервисов независимо от применяемого способа подключения.",
        notice: { tone: "info", text: "Один пользователь Aurora связывает один Google-аккаунт. Каждая роль подтверждает того же Google-субъекта, но получает собственный токен и только необходимые полномочия." },
        tableGroupTitle: "Google",
        tableGroupMeta: "Вход, почта и файлы используют отдельные регистрации и согласия",
        columns: [{ key: "purpose", label: "Назначение" }, { key: "connection", label: "Способ подключения" }, { key: "state", label: "Состояние", status: true }],
        rows: [],
        total: "3 назначения семейства Google" },
      { id: "BRAND-EDITOR-001", embeddedScreenIds: ["BRAND-PREVIEW-001"], mark: "БР", title: "Брендирование", kind: "editor", operation: "branding.draft.update", scope: "Выбранная организация", revision: "7", draftVersion: 7, publishedVersion: 6,
        purpose: "Настройки корпоративного стиля, живой предварительный просмотр и публикация находятся на одном экране.", editorTitle: "Черновик брендирования организации · один профиль", fields: [
          { key: "name", label: "Название", value: "Northwind Collaboration" }, { key: "color", label: "Основной цвет", value: "#2457D6", help: "Контраст проверяется перед публикацией." },
          { key: "logo", label: "Файл логотипа", value: "northwind-logo.svg", help: "Активное содержимое файла запрещено." }, { key: "supportUrl", label: "Адрес службы поддержки", value: "https://help.northwind.example" },
          { key: "surface", label: "Пример экрана", value: "Вход", type: "select", options: ["Вход", "Почта", "Мобильное приложение"] },
          { key: "theme", label: "Тема примера", value: "Светлая", type: "select", options: ["Светлая", "Тёмная", "Системная"] },
          { key: "language", label: "Язык примера", value: "Русский", type: "select", options: ["Русский", "Английский", "Турецкий", "Арабский"] }
        ], previewName: "Northwind Collaboration", previewInitial: "N", previewHeading: "Почта Northwind Collaboration", previewText: "Обязательные элементы безопасности остаются видимыми.", previewColor: "#e8efff" },
      { id: "BRAND-DOMAIN-001", mark: "НД", title: "Адреса входа", kind: "table", operation: "branding.hostnames.list", scope: "Провайдер", selectable: true,
        purpose: "Выданное провайдером имя узла однозначно направляется в организацию и её единственный профиль брендирования; Aurora не создаёт DNS или собственные домены организации.",
        columns: [{ key: "domain", label: "Выданное провайдером имя узла" }, { key: "brand", label: "Брендирование организации" }, { key: "origin", label: "Источник полномочий DNS / TLS" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "bd-1", domain: "northwind.contoso-mail.example", subtitle: "Northwind Example · один профиль брендирования", brand: "Northwind Collaboration · версия 7", origin: "Управляет провайдер", status: "Активно" },
          { id: "bd-2", domain: "adatum.contoso-mail.example", subtitle: "Adatum Corporation · один профиль брендирования", brand: "Adatum · версия 4", origin: "Управляет провайдер", status: "Активно" },
          { id: "bd-3", domain: "tailspin.contoso-mail.example", subtitle: "Tailspin Toys · организация приостановлена", brand: "Tailspin · версия 2", origin: "Управляет провайдер", status: "Приостановлено" }
        ], tableActions: [{ command: "preview", label: "Проверить маршрут", requiresSelection: true }, { command: "publish", label: "Активировать маршрут провайдера", variant: "primary" }], details: false },
      { id: "EXT-REGISTRY-001", mark: "РА", title: "Реестр расширений", kind: "table", operation: "extensions.registry.list", scope: "Провайдер",
        purpose: "Подписанные расширения, договор возможностей и состояние включения; установка по произвольному URL или сценарию отсутствует.",
        columns: [{ key: "extension", label: "Расширение" }, { key: "capabilities", label: "Возможности" }, { key: "rollout", label: "Включение" }, { key: "status", label: "Доверие", status: true }],
        rows: [
          { id: "ext-crm", extension: "Contoso CRM", subtitle: "подписано · издатель Contoso · v4.2", capabilities: "message.read:selected · compose.action", rollout: "42 организации", status: "Проверено" },
          { id: "ext-archive", extension: "Архивный соединитель", subtitle: "подписано · издатель Fabrikam · v2.8", capabilities: "event.metadata · export.write", rollout: "6 организаций", status: "Проверено" },
          { id: "ext-legacy", extension: "Устаревшее встроенное окно", subtitle: "неподписанный пакет заблокирован", capabilities: "неизвестно", rollout: "0 организаций", status: "Заблокировано" }
        ], detailActions: [{ command: "revoke", label: "Отключить включение", variant: "danger" }], total: "3 из 17 расширений" },
      { id: "EXT-EMBED-001", mark: "ВСТ", title: "Политика встраивания", kind: "policy", operation: "extensions.embed.publish", scope: "Провайдер", revision: "23",
        purpose: "Разрешённые источники, возможности песочницы и назначения организациям для встраиваемых элементов; полномочия общего источника не выдаются неявно.",
        policyRows: [
          { name: "Разрешённый источник", origin: "Реестр доверия провайдера", effective: "https://crm.contoso.example", draft: "https://crm.contoso.example" },
          { name: "Песочница встроенного окна", origin: "Минимум безопасности платформы", effective: "allow-scripts allow-forms", locked: true },
          { name: "Доступ к содержимому ящика", origin: "Договор возможностей", effective: "Только выбранное сообщение", draft: "Только выбранное сообщение", options: ["Нет", "Только выбранное сообщение"] },
          { name: "Запуск между организациями", origin: "Минимум безопасности платформы", effective: "Заблокирован", locked: true }
        ] }
    ]}
  ]
  };

  const additionalOrganizationPattern = /Adatum|Tailspin|EMEA Partners|SMB Channel/i;

  function materializeSingleOrganization(value) {
    if (Array.isArray(value)) {
      return value
        .filter((item) => {
          if (typeof item === "string") return !additionalOrganizationPattern.test(item);
          if (!item || typeof item !== "object") return true;
          const ownText = Object.values(item).filter((field) => typeof field === "string").join(" ");
          return !additionalOrganizationPattern.test(ownText);
        })
        .map(materializeSingleOrganization);
    }
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, materializeSingleOrganization(field)]));
    }
    if (typeof value !== "string") return value;
    return value
      .replaceAll("Northwind Collaboration", "Пространство Contoso")
      .replaceAll("Northwind Example", "Contoso Cloud Services")
      .replaceAll("northwind", "contoso")
      .replaceAll("Northwind", "Contoso");
  }

  const contextRouteIds = Object.freeze({
    installation: new Set(["PROV-LICENSING-001", "PROV-DATABASE-001", "PROV-LOGS-001", "PROV-INT-001"]),
    provider: new Set(["PROV-TENANTS-001", "PROV-RESELLERS-001", "PROV-TARIFFS-001", "ADM-SUPPORT-001", "PROV-CLIENTS-001", "PROV-DIRECTORY-001", "PROV-JOBS-001", "PROV-ADAPTER-001", "PROV-MAIL-001", "PROV-MAIL-PROFILES-001", "PROV-INT-001", "ADM-DIAG-001", "PROV-EVIDENCE-001", "PROV-AGENT-001", "ADM-BACKUP-001", "PROV-SYSTEM-001", "BRAND-DOMAIN-001", "EXT-REGISTRY-001", "EXT-EMBED-001"]),
    reseller: new Set(["PROV-TENANTS-001", "ADM-STATS-001", "ADM-AUDIT-001", "ADM-OPS-001"]),
    organization: new Set(["ADM-USERS-001", "ADM-USER-001", "ADM-DEPROVISION-001", "ADM-GROUPS-001", "ADM-DOMAINS-001", "ADM-MAIL-001", "ADM-MAIL-PROFILES-001", "ADM-INT-001", "ADM-POLICY-001", "ADM-FEATURES-001", "ADM-QUOTAS-001", "ADM-SSO-001", "ADM-MOBILE-001", "AI-POLICY-001", "ADM-AUDIT-001", "ADM-STATS-001", "ADM-OPS-001", "PROV-SCIM-001", "BRAND-EDITOR-001", "ADM-SUPPORT-001"]),
  });

  const contextDefinitions = Object.freeze({
    "installation:local": { type: "installation", startRoute: "PROV-LICENSING-001", label: "Установка" },
    "provider:contoso": { type: "provider", startRoute: "PROV-TENANTS-001", label: "Contoso Cloud Services" },
    "reseller:emea": { type: "reseller", startRoute: "PROV-TENANTS-001", label: "EMEA Partners", resellerId: "EMEA" },
    "tenant:default": { type: "organization", startRoute: "ADM-USERS-001", label: "Contoso Cloud Services", replacements: [
      ["Northwind Collaboration", "Пространство Contoso"], ["Northwind Example", "Contoso Cloud Services"],
      ["Анна Волкова", "Ксения Ларионова"], ["anna@northwind.example", "kseniya@contoso.example"],
      ["Алексей Смирнов", "Роман Жуков"], ["alexey@northwind.example", "roman@contoso.example"],
      ["Мария Соколова", "Алиса Фомина"], ["maria@northwind.example", "alisa@contoso.example"],
      ["Олег Власов", "Илья Макаров"], ["oleg@northwind.example", "ilya@contoso.example"],
      ["sales@northwind.example", "all@contoso.example"], ["Отдел продаж", "Административный отдел"],
      ["support@northwind.example", "service-desk@contoso.example"], ["Служба поддержки клиентов", "Внутренняя поддержка"],
      ["phoenix-project@northwind.example", "orion-project@contoso.example"], ["Нина Петрова", "Светлана Егорова"],
      ["northwind", "contoso"], ["Northwind", "Contoso"]
    ] },
    "tenant:northwind": { type: "organization", startRoute: "ADM-USERS-001", label: "Northwind Example", replacements: [] },
    "tenant:adatum": { type: "organization", startRoute: "ADM-USERS-001", label: "Adatum Corporation", replacements: [
      ["Northwind Collaboration", "Пространство Adatum"], ["Northwind Example", "Adatum Corporation"],
      ["Анна Волкова", "Ирина Котова"], ["anna@northwind.example", "irina@adatum.example"],
      ["Алексей Смирнов", "Дмитрий Попов"], ["alexey@northwind.example", "dmitry@adatum.example"],
      ["Мария Соколова", "Елена Сорокина"], ["maria@northwind.example", "elena@adatum.example"],
      ["Олег Власов", "Максим Егоров"], ["oleg@northwind.example", "maksim@adatum.example"],
      ["sales@northwind.example", "finance@adatum.example"], ["Отдел продаж", "Финансовый отдел"],
      ["support@northwind.example", "operations@adatum.example"], ["Служба поддержки клиентов", "Операционный центр"],
      ["phoenix-project@northwind.example", "atlas-project@adatum.example"], ["Нина Петрова", "Ольга Миронова"],
      ["northwind", "adatum"], ["Northwind", "Adatum"]
    ] },
  });

  function replaceVisibleStrings(value, replacements) {
    if (Array.isArray(value)) return value.map((item) => replaceVisibleStrings(item, replacements));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceVisibleStrings(item, replacements)]));
    if (typeof value !== "string") return value;
    return replacements.reduce((result, [source, target]) => result.replaceAll(source, target), value);
  }

  function applySystemIdentity(value, identity) {
    return replaceVisibleStrings(value, [["Aurora Mobile", identity.mobileAppName], ["Aurora", identity.productName], ["Contoso Cloud Services", identity.providerName]]);
  }

  function organizationRoute(route, identity, contextId, googleDriveEnabled) {
    if (route.id === "ADM-USERS-001") return { ...route, creationType: "user", mailDomains: ["northwind.example", "sales.northwind.example", "northwind.mail.contoso.example"], detailActions: [{ command: "open-route", targetRouteId: "ADM-USER-001", label: "Открыть карточку" }] };
    if (route.id === "ADM-DEPROVISION-001") return { ...route, title: "Доступ и удаление", kind: "deprovision", purpose: "Деактивация обратима и не меняет почтовый сервер. Удаление — отдельное подтверждаемое действие с оценкой последствий.", deleteImpacts: route.mailServerHook ? [{ title: "Данные продукта", meta: `Файлы, календари, контакты и общие доступы ${identity.productName} обрабатываются по политике удаления`, status: "Требует решения" }, { title: "Владение", meta: "Ресурсы можно передать другому пользователю", status: "Доступна передача" }, { title: "Почтовый сервер", meta: "Подключённый адаптер принимает команду удаления учётной записи; пересылка и автоответ не включаются автоматически", status: "Доступно отдельно" }] : [{ title: "Данные продукта", meta: `Файлы, календари, контакты и общие доступы ${identity.productName} обрабатываются по политике удаления`, status: "Требует решения" }, { title: "Владение", meta: "Ресурсы можно передать другому пользователю", status: "Доступна передача" }, { title: "Почтовый сервер", meta: "Удаление и пересылка недоступны без объявленной возможности адаптера", status: "Не изменяется" }] };
    if (route.id === "ADM-DOMAINS-001") return { ...route, purpose: "Домены выбранной организации без DNS-диагностики и дублирования параметров почтового сервера." };
    if (route.id === "ADM-MOBILE-001") return { ...route, policyRows: [{ name: `Поддерживаемые версии ${identity.mobileAppName}`, origin: "Минимальное требование провайдера", effective: "Версия 10.0 и новее", draft: "Версия 10.0 и новее", locked: true, explanation: "Более старые версии не смогут подключиться." }, { name: "Повторная разблокировка", origin: "Политика организации", effective: "После 5 минут бездействия", draft: "После 5 минут бездействия", options: ["При каждом открытии", "После 1 минуты бездействия", "После 5 минут бездействия"], explanation: "После паузы приложение снова попросит код или биометрию." }, { name: "Доступ без связи с сервером", origin: "Не более 24 часов по правилу провайдера", effective: "До 12 часов", draft: "До 12 часов", options: ["Запрещён", "До 4 часов", "До 12 часов", "До 24 часов"], explanation: "После этого срока нужна связь с сервером для повторной проверки политики и сеанса." }], managedDevices: route.managedDevices ? { ...route.managedDevices, title: "Управление устройствами (MDM)" } : undefined };
    if (route.id === "ADM-INT-001") return {
      ...route,
      purpose: "Провайдер задаёт верхнюю доступность ролей для выбранной организации и видит её собственное решение только для чтения.",
      columns: [{ key: "role", label: "Роль" }, { key: "purpose", label: "Назначение" }, { key: "availability", label: "Итог для организации", status: true }],
      rows: global.AuroraAdminDemoState.organizationRows(contextId, { viewer: "provider" }).filter((row) => googleDriveEnabled || row.id !== "google-drive"),
      alternativeRows: global.AuroraAdminDemoState.organizationRows(contextId, { viewer: "provider", alternative: true }).filter((row) => googleDriveEnabled || row.id !== "google-drive"),
      total: "3 роли · верхняя политика и решение организации показаны совместно",
    };
    return route;
  }

  function singleOrganizationPrimaryMailRoute(route) {
    return {
      ...route,
      kind: "table",
      details: true,
      clearSelectionOnLeave: true,
      purpose: "Публичные настройки основных почтовых подключений дефолтной организации с маршрутизацией по адресу пользователя.",
      notice: { tone: "info", text: "В режиме одной дефолтной организации точный домен выбирает подключение раньше сервера для остальных доменов. Внутренние адреса доступны только в области провайдера." },
      columns: [{ key: "name", label: "Почтовая услуга" }, { key: "routing", label: "Маршрутизация" }, { key: "imap", label: "IMAP для клиентов" }, { key: "smtp", label: "SMTP для клиентов" }],
      detailAriaLabel: "Публичные параметры выбранного подключения",
      detailEmptyTitle: "Публичные параметры",
      detailEmptyText: "Выберите подключение, чтобы увидеть его публичные параметры.",
      selectedSupplementalFields: [
        { key: "authentication", label: "Способ входа" },
        { key: "usernameFormat", label: "Формат имени пользователя" },
        { key: "capabilities", label: "Доступные возможности" }
      ],
      rows: [
        { id: "public-default", name: "Основной сервер провайдера", routing: "Остальные домены", imap: "imap.contoso-mail.example · 993 TLS", smtp: "smtp.contoso-mail.example · 587 STARTTLS", imapHost: "imap.contoso-mail.example", imapPortSecurity: "993 · TLS", smtpHost: "smtp.contoso-mail.example", smtpPortSecurity: "587 · STARTTLS", authentication: "Пароль", usernameFormat: "Полный адрес электронной почты", capabilities: "Чтение, отправка и квота" },
        { id: "public-special", name: "Сервер особых доменов", routing: "legacy.contoso.example · vip.example", imap: "imap.special-mail.example · 993 TLS", smtp: "smtp.special-mail.example · 587 STARTTLS", imapHost: "imap.special-mail.example", imapPortSecurity: "993 · TLS", smtpHost: "smtp.special-mail.example", smtpPortSecurity: "587 · STARTTLS", authentication: "Пароль", usernameFormat: "Полный адрес электронной почты", capabilities: "Чтение, отправка и квота" }
      ],
      total: "2 набора публичных настроек · один сервер для остальных доменов",
    };
  }

  function createEffectiveConfig(options = {}) {
    const requestedAccessProfile = options.accessProfile;
    const accessProfile = requestedAccessProfile === undefined
      ? "superadmin"
      : (["superadmin", "provider-admin", "support"].includes(requestedAccessProfile) ? requestedAccessProfile : "restricted");
    const roleLabels = {
      "superadmin": "Суперадминистратор провайдера",
      "provider-admin": "Администратор провайдера",
      "support": "Специалист поддержки",
      "restricted": "Ограниченный доступ"
    };
    const multiOrganizationEnabled = options.multiOrganizationEnabled !== false;
    const identity = {
      productName: options.productName || "Aurora",
      mobileAppName: options.mobileAppName || "Aurora Mobile",
      providerName: options.providerName || "Contoso Cloud Services",
      supportUrl: options.supportUrl || "https://help.contoso.example",
      defaultLogo: options.defaultLogo || "contoso-logo.svg",
      primaryColor: options.primaryColor || "#315FCA",
      defaultBrandName: options.defaultBrandName || "Пространство Contoso",
      mailDomain: options.mailDomain || "mail.contoso.example",
      accessHostnamePattern: options.accessHostnamePattern || "{организация}.contoso-mail.example",
    };
    const allowedContextIds = multiOrganizationEnabled ? Object.keys(contextDefinitions) : ["installation:local", "provider:contoso", "tenant:default"];
    const requestedContextId = allowedContextIds.includes(options.contextId)
      ? options.contextId
      : "provider:contoso";
    const context = contextDefinitions[requestedContextId];
    const enabledFeatureKeys = options.mobileDeviceManagementEnabled === true ? ["mobile-device-management"] : [];
    if (options.googleDriveEnabled !== false) enabledFeatureKeys.push("google-drive");
    if (multiOrganizationEnabled) enabledFeatureKeys.push("multi-organization");
    if (options.directoryServicesEnabled) enabledFeatureKeys.push("directory-services");
    if (options.protectedUserSessionEnabled) enabledFeatureKeys.push("protected-user-session");
    if (options.mailUserLifecycleHooksEnabled) enabledFeatureKeys.push("mail-user-lifecycle-hooks");
    const materializationFeatureKeys = [...enabledFeatureKeys];
    if (options.directoryServicesEnabled || options.directoryServicesRetained) materializationFeatureKeys.push("directory-records");
    const materializedConfig = applySystemIdentity(global.AuroraAdminCapabilities.materializeConfig(manifest, materializationFeatureKeys), identity);
    const config = {
      ...materializedConfig,
      actor: { ...materializedConfig.actor, role: roleLabels[accessProfile] },
      brand: identity.productName,
      systemIdentity: identity,
      startRoute: context.startRoute,
      surfaceLabel: context.type === "installation" ? "Управление установкой" : context.type === "provider" ? "Управление провайдером" : context.type === "reseller" ? "Управление реселлером" : "Управление организацией",
      workspaceKind: context.type === "installation" ? "установка" : context.type === "provider" ? "провайдер" : context.type === "reseller" ? "реселлер" : "организация",
      scope: { ...materializedConfig.scope, provider: identity.providerName, value: requestedContextId, contextLabel: context.label, options: (materializedConfig.scope.options || []).filter((option) => allowedContextIds.includes(option.value)) },
      groups: materializedConfig.groups
        .map((group) => ({
          ...group,
          items: group.items
            .filter((route) => (!route.requiredAccessProfile || route.requiredAccessProfile === accessProfile)
              && (!route.allowedAccessProfiles || route.allowedAccessProfiles.includes(accessProfile)))
            .filter((route) => contextRouteIds[context.type].has(route.id))
            .filter((route) => multiOrganizationEnabled || route.id !== "PROV-RESELLERS-001")
            .map(({ requiredAccessProfile, allowedAccessProfiles, ...route }) => {
              const canReadTariffAssignment = ["superadmin", "provider-admin"].includes(accessProfile);
              let permissionedRoute = route.id === "PROV-TENANTS-001" ? {
                ...route,
                allowTariffRead: canReadTariffAssignment,
                allowTariffRequest: canReadTariffAssignment,
                allowTariffCorrection: accessProfile === "superadmin",
              } : route;
              if (permissionedRoute.id === "PROV-SYSTEM-001") {
                permissionedRoute = {
                  ...permissionedRoute,
                  fields: (permissionedRoute.fields || []).map((field) => ({ ...field, value: identity[field.key] ?? field.value })),
                };
              }
              if (permissionedRoute.id === "PROV-INT-001") {
                const keepInstalledRoles = (rows) => options.googleDriveEnabled === false ? rows.filter((row) => row.id !== "google-drive") : rows;
                const keepAvailableActions = (rows) => keepInstalledRoles(rows).map((row) => ({
                  ...row,
                  detailActions: (row.detailActions || []).filter((action) => !action.targetRouteId || contextRouteIds[context.type].has(action.targetRouteId)),
                }));
                permissionedRoute = {
                  ...permissionedRoute,
                  rows: keepAvailableActions(global.AuroraAdminDemoState.providerRows()),
                  alternativeRows: keepAvailableActions(global.AuroraAdminDemoState.providerRows({ alternative: true })),
                };
              }
              if (permissionedRoute.id === "PROV-TENANTS-001" && !canReadTariffAssignment) {
                const tariffKeys = new Set(["plan", "pendingPlan", "assignmentSource", "reconciliation"]);
                permissionedRoute = {
                  ...permissionedRoute,
                  columns: (permissionedRoute.columns || []).filter((column) => !tariffKeys.has(column.key)),
                  detailFields: (permissionedRoute.detailFields || []).filter((field) => !tariffKeys.has(field.key)),
                  detailActions: (permissionedRoute.detailActions || []).filter((action) => action.command !== "open-organization-card"),
                  tariffOptions: [],
                  rows: (permissionedRoute.rows || []).map((row) => {
                    const { plan, pendingPlan, assignmentSource, reconciliation, ...safeRow } = row;
                    return { ...safeRow, detailActions: (safeRow.detailActions || []).filter((action) => action.command !== "open-organization-card") };
                  }),
                };
              }
              if (context.type === "reseller" && permissionedRoute.id === "PROV-TENANTS-001") {
                permissionedRoute = { ...permissionedRoute, scope: "Реселлер · EMEA Partners", rows: (permissionedRoute.rows || []).filter((row) => row.resellerId === context.resellerId), tableActions: [], choiceFilter: null, total: "1 организация" };
              }
              if (context.type === "organization") permissionedRoute = organizationRoute(permissionedRoute, identity, requestedContextId, options.googleDriveEnabled !== false);
              if (!multiOrganizationEnabled && context.type === "organization" && permissionedRoute.id === "ADM-MAIL-001") permissionedRoute = singleOrganizationPrimaryMailRoute(permissionedRoute);
              if (multiOrganizationEnabled) return permissionedRoute;
              if (permissionedRoute.id === "PROV-TENANTS-001") {
                return {
                  ...permissionedRoute,
                  title: "Организация провайдера",
                  purpose: "Единственная дефолтная организация самостоятельной установки. Мультитенантность и реселлеры выключены.",
                  rows: (permissionedRoute.rows || []).filter((row) => row.isDefault),
                  tableActions: [],
                  choiceFilter: null,
                  total: "1 организация",
                };
              }
              if (permissionedRoute.id === "PROV-LICENSING-001") {
                return {
                  ...permissionedRoute,
                  metrics: (permissionedRoute.metrics || []).map((metric) => metric.label === "Несколько организаций"
                    ? { ...metric, value: "Не разрешено", meta: "Доступна только дефолтная организация" }
                    : metric),
                };
              }
              return permissionedRoute;
            })
        }))
        .filter((group) => group.items.length)
    };
    const replacedContextConfig = context.replacements?.length ? replaceVisibleStrings(config, context.replacements) : config;
    const contextConfig = context.replacements?.length
      ? { ...replacedContextConfig, scope: { ...replacedContextConfig.scope, options: config.scope.options } }
      : config;
    const organizationModeConfig = multiOrganizationEnabled ? contextConfig : materializeSingleOrganization(contextConfig);
    const effectiveConfig = applySystemIdentity(organizationModeConfig, identity);
    const routeIds = effectiveConfig.groups.flatMap((group) => group.items.map((route) => route.id));
    return {
      ...effectiveConfig,
      contextId: requestedContextId,
      capabilitySnapshot: {
        profileId: "provider-managed-tenant",
        label: "Назначение возможностей выбранной организации",
        revision: "cap-provider-61",
        routeIds,
        enabledFeatureKeys,
        expiresAt: "2026-08-14T18:00:00Z",
      },
    };
  }

  function preservedRouteForContextChange(currentConfig, nextConfig, currentRouteId) {
    if (currentConfig?.workspaceKind !== "организация" || nextConfig?.workspaceKind !== "организация") return undefined;
    const nextRouteIds = new Set((nextConfig.groups || []).flatMap((group) => (group.items || []).map((route) => route.id)));
    return nextRouteIds.has(currentRouteId) ? currentRouteId : undefined;
  }

  global.AuroraProviderConsoleManifest = Object.freeze({ createEffectiveConfig, preservedRouteForContextChange });
})(window);

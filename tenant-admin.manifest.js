(function (global) {
  "use strict";

  if (!global.AuroraAdminDemoState && typeof require === "function") require("./admin-demo-state.js");
  if (!global.AuroraAdminDemoState) throw new Error("Aurora admin demo state dependency is missing");

  const manifest = {
  locale: "ru",
  brand: "Aurora",
  surface: "tenant",
  surfaceLabel: "Настройки организации",
  startRoute: "ADM-ORG-001",
  actor: { name: "Анна Волкова", initials: "АВ", role: "Администратор организации", userId: "u-1001", detailRouteId: "ADM-USER-001" },
  scope: { value: "Northwind Example", domain: "northwind.example" },
  groups: [
    { title: "Организация", items: [
      { id: "ADM-ORG-001", mark: "ОБ", title: "Обзор", kind: "overview", scope: "Организация",
        purpose: "Единая стартовая точка: состояние организации, риски и изменения без раскрытия данных других организаций.",
        metrics: [
          { label: "Активные пользователи", value: "486", meta: "из 520 лицензированных мест" },
          { label: "Хранилище", value: "7,8 ТБ", meta: "65% квоты организации" },
          { label: "Домены", value: "3", meta: "один основной почтовый сервис" },
          { label: "Состояние сервисов", value: "Норма", meta: "проверено 4 мин назад" }
        ],
        attention: [
          { title: "12 внешних участников в группах", meta: "проверка владельцем до 15 августа", status: "Требует проверки" },
          { featureKey: "directory-services", title: "2 пользователя требуют проверки", meta: "одна приостановленная учётная запись и одна почти заполненная квота", status: "Внимание" }
        ],
        activity: [
          { title: "Опубликована версия политики 42", meta: "Анна Волкова · 10:42", status: "Успешно" },
          { featureKey: "directory-services", title: "Пользователь maria@… приостановлен", meta: "Илья Орлов · 09:18 · дело об удалении HR-281", status: "Успешно" },
          { featureKey: "directory-services", title: "Синхронизация службы каталогов требует сверки", meta: "Система · 08:55 · 2 неопределённые записи", status: "Частичный результат" }
        ] },
      { id: "ADM-DOMAINS-001", mark: "ДМ", title: "Домены", kind: "table", operation: "admin.domains.read", scope: "Организация", details: false,
        purpose: "Домены определяют адресное пространство организации, но не дублируют маршрутизацию и параметры почтового сервера.",
        notice: { tone: "info", text: "Aurora не настраивает и не диагностирует DNS. Параметры почтовых клиентов находятся в разделе «Основная почта»." },
        columns: [{ key: "domain", label: "Домен" }, { key: "mailService", label: "Основная почта" }],
        rows: [
          { id: "domain-northwind", domain: "northwind.example", mailService: "Почта Contoso" },
          { id: "domain-sales", domain: "sales.northwind.example", mailService: "Почта Contoso" },
          { id: "domain-hosted", domain: "northwind.mail.contoso.example", mailService: "Почта Contoso" }
        ], total: "3 домена · один основной почтовый сервис" },
      { id: "ADM-MAIL-001", mark: "ПС", title: "Основная почта", kind: "detail", operation: "admin.primary_mail.get", scope: "Организация",
        purpose: "Публичные настройки назначенной организации почтовой услуги без внутренних адресов, секретов и альтернативного пула.",
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
      { id: "ADM-MAIL-PROFILES-001", mark: "ВП", title: "Внешние почтовые профили", kind: "table", operation: "admin.mail_profiles.list", scope: "Организация",
        purpose: "Опубликованные провайдером и частные профили для добавляемых пользователями внешних ящиков.",
        notice: { tone: "info", text: "Gmail OAuth принадлежит роли Google в разделе «Интеграции». Внешние профили не участвуют в маршрутизации основной почты организации." },
        columns: [{ key: "name", label: "Профиль" }, { key: "origin", label: "Источник" }, { key: "authentication", label: "Вход" }, { key: "access", label: "Доступ всем пользователям", toggle: true }],
        rows: [
          { id: "mail-gmail", name: "Gmail", subtitle: "imap.gmail.com · smtp.gmail.com", origin: "Провайдер", authentication: "Пароль приложения", access: "Запрещён", enabled: false, toggleKind: "mail-profile", scopeType: "provider_global", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", driver: "generic-imap-smtp" },
          { id: "mail-gmail-oauth", name: "Gmail (OAuth2)", subtitle: "imap.gmail.com · smtp.gmail.com", origin: "Провайдер", authentication: "OAuth 2.0", access: "В интеграциях", scopeType: "provider_global", imapHost: "imap.gmail.com", smtpHost: "smtp.gmail.com", driver: "google.gmail", detailActions: [{ command: "open-route", targetRouteId: "ADM-INT-001", label: "Открыть интеграцию Google" }] }
        ],
        detailFields: [{ key: "origin", label: "Источник" }, { key: "authentication", label: "Способ входа" }, { key: "imapHost", label: "IMAP-сервер" }, { key: "smtpHost", label: "SMTP-сервер" }],
        tableActions: [{ command: "create-mail-profile", label: "Добавить профиль почтового сервера", variant: "primary" }], total: "2 внешних профиля · обычный Gmail запрещён" },
      { id: "ADM-GROUPS-001", mark: "ГР", title: "Группы", kind: "table", operation: "admin.groups.list", scope: "Организация",
        purpose: "Управление группами, владельцами и составом с серверной фильтрацией и явными частичными результатами.",
        columns: [{ key: "name", label: "Группа" }, { key: "members", label: "Участники" }, { key: "owner", label: "Владелец" }, { key: "status", label: "Статус", status: true }],
        rows: [
          { id: "g-sales", name: "sales@northwind.example", subtitle: "Рассылка и общая учётная запись", members: "84", owner: "Отдел продаж", status: "Активна" },
          { id: "g-support", name: "support@northwind.example", subtitle: "Группа с очередью", members: "36", owner: "Служба поддержки клиентов", status: "Активна" },
          { id: "g-project", name: "phoenix-project@northwind.example", subtitle: "12 внешних участников", members: "48", owner: "Нина Петрова", status: "Требует проверки" }
        ],
        detailFields: [{ key: "members", label: "Участники" }, { key: "owner", label: "Ответственный" }, { key: "status", label: "Состояние", status: true }],
        tableActions: [{ command: "create", label: "Создать группу", variant: "primary" }, { command: "download-view", label: "Скачать список групп" }],
        downloadFilename: "northwind-example-groups.csv",
        detailActions: [{ command: "open-object-detail", label: "Открыть состав" }], fieldLabels: { name: "Группа", members: "Участники", owner: "Владелец", status: "Состояние" }, total: "3 из 57 групп" }
    ]},
    { title: "Люди и доступ", items: [
      { id: "ADM-USERS-001", mark: "ЛЮ", title: "Пользователи", kind: "table", operation: "admin.users.list", scope: "Организация",
        purpose: "Пользователи организации, их состояние и использование хранилища.",
        featureOverrides: { "directory-records": { purpose: "Пользователи организации, их состояние и использование хранилища. Внешний способ управления отмечается только там, где он действительно есть.", total: "4 из 486 пользователей" } },
        columns: [{ key: "name", label: "Пользователь" }, { key: "quota", label: "Хранилище" }, { key: "status", label: "Состояние", status: true }],
        rows: [
          { id: "u-1001", name: "Анна Волкова", subtitle: "anna@northwind.example", email: "anna@northwind.example", role: "Администратор организации", quotaProfile: "Расширенный 25 ГБ", quota: "6,8 / 25 ГБ", status: "Активен", management: "В Aurora", isCurrentActor: true, workflowImpacts: [{ title: "Анна Волкова", meta: "Пользователь управляется в Aurora", status: "Проверено" }, { title: "4 активных сеанса", meta: "Отзыв требует недавней усиленной проверки личности", status: "Требует внимания" }, { title: "Почтовый ящик 6,8 ГБ", meta: "хранение 90 дней; делегировать менеджеру", status: "Ожидает" }] },
          { id: "u-1042", name: "Алексей Смирнов", subtitle: "alexey@northwind.example", email: "alexey@northwind.example", role: "Пользователь", quotaProfile: "Расширенный 25 ГБ", quota: "18,4 / 25 ГБ", status: "Активен", management: "В Aurora", workflowImpacts: [{ title: "Алексей Смирнов", meta: "Пользователь управляется в Aurora", status: "Проверено" }, { title: "4 активных сеанса", meta: "Отзыв требует недавней усиленной проверки личности", status: "Требует внимания" }, { title: "Почтовый ящик 18,4 ГБ", meta: "хранение 90 дней; делегировать менеджеру", status: "Ожидает" }] },
          { featureKey: "directory-records", id: "u-1077", name: "Мария Соколова", subtitle: "maria@northwind.example", email: "maria@northwind.example", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", quota: "4,2 / 10 ГБ", status: "Приостановлен", management: "В корпоративном каталоге", sourceBadge: "Корпоративный каталог", workflowImpacts: [{ title: "Мария Соколова", meta: "Корпоративный каталог остаётся источником профиля", status: "Проверено" }, { title: "4 активных сеанса", meta: "Отзыв требует недавней усиленной проверки личности", status: "Требует внимания" }, { title: "Почтовый ящик 4,2 ГБ", meta: "хранение 90 дней; делегировать менеджеру", status: "Ожидает" }] },
          { featureKey: "directory-records", id: "u-1188", name: "Олег Власов", subtitle: "oleg@northwind.example", email: "oleg@northwind.example", role: "Пользователь", quotaProfile: "Стандартный 10 ГБ", quota: "9,1 / 10 ГБ", status: "Требует внимания", management: "Через SCIM", sourceBadge: "SCIM", workflowImpacts: [{ title: "Олег Власов", meta: "SCIM остаётся источником профиля", status: "Проверено" }, { title: "4 активных сеанса", meta: "Отзыв требует недавней усиленной проверки личности", status: "Требует внимания" }, { title: "Почтовый ящик 9,1 ГБ", meta: "хранение 90 дней; делегировать менеджеру", status: "Ожидает" }] }
        ],
        detailFields: [{ key: "quota", label: "Использование" }, { key: "status", label: "Состояние", status: true }],
        creationType: "user", mailDomains: ["northwind.example", "sales.northwind.example", "northwind.mail.contoso.example"],
        tableActions: [{ command: "create", label: "Добавить пользователя", variant: "primary" }, { command: "download-view", label: "Скачать список пользователей" }],
        downloadFilename: "northwind-example-users.csv",
        detailActions: [{ command: "open-route", targetRouteId: "ADM-USER-001", label: "Открыть карточку" }], total: "2 из 484 пользователей" },
      { id: "ADM-USER-001", mark: "КР", title: "Карточка пользователя", hiddenInNavigation: true, requiresContext: true, sourceRouteId: "ADM-USERS-001", kind: "detail", operation: "admin.users.update", scope: "Организация", revision: "18",
        purpose: "Профиль, доступ и состояние безопасности выбранного пользователя.",
        tabs: ["Профиль", "Доступ", "Безопасность", "Устройства"],
        fields: [
          { tab: "Профиль", key: "email", label: "Основной адрес", readonly: true },
          { tab: "Профиль", key: "name", label: "Отображаемое имя" },
          { tab: "Профиль", featureKey: "directory-records", key: "management", label: "Где управляется пользователь", readonly: true },
          { tab: "Доступ", key: "role", label: "Роль", type: "select", options: ["Пользователь", "Администратор организации"] },
          { tab: "Доступ", key: "quotaProfile", label: "Профиль квоты", type: "select", options: ["Стандартный 10 ГБ", "Расширенный 25 ГБ"] },
          { tab: "Профиль", label: "Язык", value: "Русский", type: "select", options: ["Русский", "Английский"] }
        ],
        securityRows: [
          { title: "MFA", meta: "2 ключа доступа · коды восстановления обновлены 2026-06-18", status: "Исправно" },
          { title: "Сеансы", meta: "4 активных · последняя усиленная проверка 17 мин назад", status: "Активны" },
          { featureKey: "directory-records", title: "Состояние службы каталогов", meta: "Учётная запись источника приостановлена; ожидается сверка", status: "Ожидает" }
        ], deviceRows: [
          { title: "Устройства пользователя", meta: "Подробный список устройств для этой записи недоступен; активные сеансы показаны на вкладке «Безопасность»", status: "Нет сведений" }
        ], tabSectionTitles: { "Безопасность": "Состояние безопасности", "Устройства": "Устройства пользователя" },
        tabActions: {
          "Профиль": [{ command: "discard", label: "Отменить", variant: "ghost" }, { command: "save", label: "Сохранить изменения", variant: "primary" }],
          "Доступ": [{ command: "discard", label: "Отменить", variant: "ghost" }, { command: "save", label: "Сохранить изменения", variant: "primary" }, { command: "open-route", targetRouteId: "ADM-DEPROVISION-001", label: "Доступ и удаление", variant: "danger" }],
          "Безопасность": [{ command: "revoke", label: "Отозвать сеансы" }],
          "Устройства": []
        } },
      { id: "ADM-DEPROVISION-001", mark: "УХ", title: "Доступ и удаление", hiddenInNavigation: true, requiresContext: true, sourceRouteId: "ADM-USERS-001", kind: "deprovision", operation: "admin.users.deprovision", scope: "Организация",
        purpose: "Деактивация обратима и не меняет почтовый сервер. Удаление — отдельное подтверждаемое действие с оценкой последствий.",
        deleteImpacts: [
          { title: "Данные Aurora", meta: "Файлы, календари, контакты, задачи и общие доступы будут обработаны по политике удаления", status: "Требует решения" },
          { title: "Владение", meta: "Принадлежащие Aurora ресурсы можно передать другому пользователю", status: "Доступна передача" },
          { title: "Почтовый сервер", meta: "Автоматическое удаление и пересылка недоступны: почтовый адаптер не объявил эти возможности", status: "Не изменяется" }
        ],
        featureOverrides: {
          "protected-user-session": { allowImpersonation: true },
          "mail-user-lifecycle-hooks": {
            mailServerHook: { action: "delete-mail-account", label: "Удалить учётную запись на почтовом сервере", help: "Команда будет передана подключённому почтовому адаптеру; результат записывается отдельно." },
            deleteImpacts: [
              { title: "Данные Aurora", meta: "Файлы, календари, контакты, задачи и общие доступы будут обработаны по политике удаления", status: "Требует решения" },
              { title: "Владение", meta: "Принадлежащие Aurora ресурсы можно передать другому пользователю", status: "Доступна передача" },
              { title: "Почтовый сервер", meta: "Подключённый адаптер принимает команду удаления учётной записи; пересылка и автоответ не включаются автоматически", status: "Доступно отдельно" }
            ]
          }
        } },
      { id: "ADM-MOBILE-001", mark: "МБ", title: "Мобильная безопасность", kind: "mobile", operation: "admin.mobile_policy.get", scope: "Организация", revision: "редакция мобильной политики 12",
        purpose: "Базовая политика безопасности мобильного клиента доступна всем организациям; инвентаризация, MDM и действия над устройствами подключаются отдельной возможностью.",
        policyRows: [
          { name: "Поддерживаемые версии {{mobileAppName}}", origin: "Минимальное требование провайдера", effective: "Версия 10.0 и новее", draft: "Версия 10.0 и новее", locked: true, explanation: "Более старые версии не смогут подключиться." },
          { name: "Повторная разблокировка", origin: "Политика организации", effective: "После 5 минут бездействия", draft: "После 5 минут бездействия", options: ["При каждом открытии", "После 1 минуты бездействия", "После 5 минут бездействия"], explanation: "После паузы приложение снова попросит код или биометрию." },
          { name: "Доступ без связи с сервером", origin: "Не более 24 часов по правилу провайдера", effective: "До 12 часов", draft: "До 12 часов", options: ["Запрещён", "До 4 часов", "До 12 часов", "До 24 часов"], explanation: "После этого срока нужна связь с сервером для повторной проверки политики и сеанса." }
        ],
        managedDevices: {
          featureKey: "mobile-device-management",
          title: "Управление устройствами (MDM)",
          operation: "admin.mobile_devices.list",
          columns: [{ key: "device", label: "Устройство" }, { key: "user", label: "Пользователь" }, { key: "seen", label: "Последняя связь" }, { key: "status", label: "Статус", status: true }],
          rows: [
            { id: "d-44", device: "iPhone 17 Pro", subtitle: "{{mobileAppName}} 10.0", user: "alexey@…", seen: "2 мин назад", status: "Соответствует" },
            { id: "d-52", device: "Pixel 11", subtitle: "{{mobileAppName}} 10.0", user: "maria@…", seen: "21 день назад", status: "Устарело" },
            { id: "d-61", device: "iPad Air", subtitle: "{{mobileAppName}} 9.8", user: "oleg@…", seen: "7 ч назад", status: "Активно" }
          ],
          tableActions: [],
          detailActions: [{ command: "wipe", operation: "admin.mobile_devices.wipe", label: "Выборочно удалить данные", variant: "danger" }], total: "3 из 214 устройств"
        } }
    ]},
    { title: "Политики", items: [
      { id: "ADM-POLICY-001", mark: "ПЛ", title: "Политики безопасности", kind: "policy", operation: "admin.policy.publish", scope: "Организация", revision: "42",
        purpose: "Показывает итоговое, унаследованное и черновое значения отдельно; публикация проходит предварительную оценку, проверку редакции и аудит.",
        policyRows: [
          { name: "Минимальная длина пароля", origin: "Базовое значение провайдера", effective: "14 символов", draft: "16 символов" },
          { name: "Автоматическая внешняя пересылка", origin: "Минимум безопасности провайдера", effective: "Запрещено", draft: "Запрещено", locked: true },
          { name: "Срок действия сеанса", origin: "Переопределение организации", effective: "12 часов", draft: "8 часов", options: ["4 часа", "8 часов", "12 часов"] },
          { name: "Доступ по устаревшим протоколам", origin: "Минимум безопасности провайдера", effective: "Запрещено", locked: true }
        ] },
      { id: "ADM-FEATURES-001", mark: "ФЛ", title: "Доступность функций", kind: "matrix", operation: "admin.features.assign", scope: "Организация", revision: "11",
        purpose: "Реализованные возможности, тарифное право и политика организации показаны раздельно: выключенная возможность не выдаётся за скрытую настройку.",
        matrixLabel: "Возможность", matrixColumns: ["Все сотрудники", "Поддержка", "Руководители"],
        matrixRows: [
          { name: "Календарь", meta: "Лицензировано и включено", values: { "Все сотрудники": "Включено", "Поддержка": "Включено", "Руководители": "Включено" } },
          { name: "Внешние ссылки на файлы", meta: "возможность v1.0 · политика организации", values: { "Все сотрудники": "Разрешены · 30 дней", "Поддержка": "Разрешены · 7 дней", "Руководители": "Разрешены · 30 дней" } },
          { name: "Внешние приглашения календаря", meta: "возможность v1.0 · политика организации", values: { "Все сотрудники": "Разрешены", "Поддержка": "Разрешены", "Руководители": "Разрешены" } },
          { name: "Помощник ИИ", meta: "Требуются согласие и политика хранения", values: { "Все сотрудники": "Выключено", "Поддержка": "Пилот", "Руководители": "Включено" } },
          { name: "Внешняя пересылка", meta: "Заблокировано провайдером", values: { "Все сотрудники": "Заблокировано", "Поддержка": "Заблокировано", "Руководители": "Заблокировано" } }
        ] },
      { id: "ADM-QUOTAS-001", mark: "КВ", title: "Квоты и лимиты", kind: "policy", operation: "admin.quotas.publish", scope: "Организация", revision: "27",
        purpose: "Разделяет приобретённое тарифное право, предел провайдера и распределение организации; превышение не превращается в скрытое перераспределение.",
        policyRows: [
          { name: "Почтовый ящик по умолчанию", origin: "Распределение организации", effective: "10 ГБ", draft: "12 ГБ", options: ["5 ГБ", "10 ГБ", "12 ГБ", "25 ГБ"] },
          { name: "Максимум почтового ящика", origin: "Тариф провайдера", effective: "25 ГБ", draft: "25 ГБ", locked: true },
          { name: "Максимум вложения", origin: "Базовое ограничение безопасности", effective: "35 МБ", draft: "35 МБ", locked: true },
          { name: "Хранилище организации", origin: "Подписка", effective: "12 ТБ", draft: "12 ТБ", locked: true }
        ] },
      { id: "ADM-SSO-001", mark: "ЕВ", title: "SSO и аутентификация", kind: "detail", operation: "admin.sso.update", scope: "Организация", revision: "8",
        purpose: "Корпоративный вход через OIDC или SAML. Вход через Google разрешается отдельно в разделе «Интеграции» и не настраивается на этом экране.",
        authority: "Организация задаёт корпоративного поставщика удостоверений; Aurora проверяет утверждение и сохраняет безопасный резервный вход администраторов.",
        editableSettings: true,
        tabs: ["Настройка"],
        fields: [
          { key: "state", label: "Доступность", value: "Выключен", type: "select", options: ["Выключен", "Разрешён всем пользователям"] },
          { key: "protocol", label: "Протокол", value: "OpenID Connect", type: "select", options: ["OpenID Connect", "SAML 2.0"] },
          { key: "displayName", label: "Название на экране входа", value: "Корпоративный вход", required: true },
          { key: "issuer", label: "Издатель или адрес метаданных", value: "https://id.northwind.example", dir: "ltr", required: true },
          { key: "clientId", label: "Идентификатор клиента", value: "aurora-corporate", dir: "ltr", required: true },
          { key: "clientSecret", label: "Новый секрет клиента", value: "", dir: "ltr", secret: true, help: "Оставьте пустым, чтобы сохранить действующий секрет. Существующее значение никогда не возвращается." },
          { key: "subjectClaim", label: "Утверждение идентификатора пользователя", value: "email", dir: "ltr", required: true },
          { key: "nameClaim", label: "Утверждение отображаемого имени", value: "name", dir: "ltr" },
          { key: "recovery", label: "Резервный вход", value: "Локальный вход администраторов сохранён", readonly: true }
        ],
        actions: [{ command: "test", label: "Проверить соединение" }, { command: "save-detail-settings", label: "Сохранить настройки", variant: "primary" }] },
      { id: "AI-POLICY-001", mark: "ИИ", title: "Политика ИИ", kind: "policy", operation: "ai.policy.publish", scope: "Организация", revision: "6",
        purpose: "Управление доступностью ИИ, согласием, хранением и аудитом без раскрытия содержимого сообщений администратору.",
        notice: { tone: "warning", text: "Администратор видит политику и агрегированные результаты, но не запросы, тела сообщений или созданное содержимое." },
        policyRows: [
          { name: "Помощник ИИ", origin: "Тарифное право провайдера", effective: "Пилотные группы", draft: "Пилотные группы", options: ["Выключено", "Пилотные группы", "Все лицензированные пользователи"] },
          { name: "Направление во внешнюю модель", origin: "Граница данных провайдера", effective: "Запрещено", locked: true },
          { name: "Хранение запросов", origin: "Конфиденциальность организации", effective: "0 дней", draft: "0 дней", options: ["0 дней", "7 дней"] },
          { name: "Выборка обратной связи", origin: "Согласие организации", effective: "Выключено", draft: "Выключено", options: ["Выключено", "По согласию"] }
        ] }
    ]},
    { title: "Наблюдаемость", items: [
      { id: "ADM-AUDIT-001", mark: "АУ", title: "Административная активность", kind: "activity", operation: "admin.audit.list", scope: "Организация",
        purpose: "Пригодный для расследований аудит приложения: исполнитель, область, действие, цель, результат и идентификатор связи без чувствительных исходных данных.",
        downloadLabel: "Скачать текущую выборку",
        downloadFilename: "northwind-example-admin-activity.csv",
        downloadColumns: [{ key: "time", label: "Время" }, { key: "actor", label: "Исполнитель" }, { key: "action", label: "Действие" }, { key: "target", label: "Объект" }, { key: "outcome", label: "Результат" }],
        events: [
          { time: "Сегодня, 11:12", ageHours: 1, actor: "anna@northwind.example", action: "Публикация политики", target: "Northwind Example · версия 42", outcome: "Успешно", correlation: "aud-7f3a" },
          { time: "Сегодня, 10:58", ageHours: 2, actor: "ilya@northwind.example", action: "Приостановка пользователя", target: "Мария Соколова", outcome: "Успешно", correlation: "aud-53de" },
          { featureKey: "directory-records", time: "3 дня назад, 10:41", ageHours: 72, actor: "Служба синхронизации", action: "Сверка службы каталогов", target: "Коннектор HR", outcome: "Частичный результат", correlation: "aud-b100" },
          { time: "Сегодня, 09:14", ageHours: 3, actor: "Неизвестный сеанс", action: "Скачивание административной активности", target: "Northwind Example", outcome: "Отказ", correlation: "aud-c812" }
        ] },
      { id: "ADM-STATS-001", mark: "ИС", title: "Использование организации", kind: "overview", operation: "admin.statistics.query", scope: "Организация",
        purpose: "Понятная сводка использования организации и состояний, которые требуют решения администратора.",
        metrics: [
          { label: "Активные пользователи", value: "486", meta: "Обновлено сегодня в 11:10" },
          { label: "Лицензии", value: "486 из 520", meta: "Осталось 34" },
          { label: "Неуспешные попытки входа", value: "31", meta: "За последние 24 часа", action: { command: "open-route", label: "Посмотреть события", targetRouteId: "ADM-AUDIT-001" } },
          { label: "Общедоступные ссылки", value: "74", meta: "У 8 закончится срок действия в течение 7 дней" }
        ],
        attentionTitle: "Требует внимания", hideFreshness: true,
        attention: [
          { featureKey: "directory-services", title: "Синхронизация службы каталогов", meta: "486 пользователей синхронизировано, 2 требуют внимания · обновлено сегодня в 10:55", status: "Требует внимания", tone: "warning", action: { command: "open-route", label: "Посмотреть события", targetRouteId: "ADM-AUDIT-001" } }
        ] },
      { id: "TEN-SUPPORT-001", mark: "ПД", title: "Доступ поддержки", kind: "support", operation: "admin.support_sessions.consent", scope: "Организация", revision: "ss-8041",
        purpose: "Запросы провайдера на временный доступ, решения администратора организации и уже начатые или завершённые сеансы показываются как отдельные объекты и состояния.",
        notice: { tone: "warning", text: "Поддержка не получает пароль или обычный сеанс пользователя. Повышение полномочий, изменение учётных данных безопасности, пакетный экспорт и изменение аудита запрещены всегда." },
        emptyText: "Когда провайдер запросит временный доступ для решения обращения, запрос появится здесь. Без запроса предоставлять доступ не требуется.",
        supportRecords: [
          { id: "ss-8041", scenario: "ожидает", requester: "Елена Кузнецова · служба поддержки Contoso", reason: "Разобраться с ошибкой синхронизации по обращению CS-8041", scope: "Диагностика и чтение безопасных полей пользователя", period: "45 минут после начала", status: "Ожидает вашего решения", tone: "warning", explanation: "Провайдер запросил доступ. Он начнётся только после вашего подтверждения.", operationCode: "sup-53de", actions: [{ command: "support-deny", label: "Отклонить" }, { command: "support-consent", label: "Предоставить доступ", variant: "primary" }] },
          { id: "ss-8025", scenario: "одобрен", requester: "Илья Орлов · служба поддержки Contoso", reason: "Проверить доставку по обращению CS-8025", scope: "Только диагностика доставки", period: "30 минут после начала", status: "Одобрен, ещё не начат", tone: "info", explanation: "Решение уже принято, но специалист поддержки ещё не начал работу.", operationCode: "sup-48ab", actions: [{ command: "support-revoke", label: "Отменить разрешение", variant: "danger" }] },
          { id: "ss-7998", scenario: "активен", requester: "Илья Орлов · служба поддержки Contoso", reason: "Проверить задержку отправки по обращению CS-7998", scope: "Только диагностика", period: "Осталось 12 минут", status: "Доступ активен", tone: "success", explanation: "Специалист сейчас работает в разрешённой области. Доступ завершится автоматически или может быть отозван досрочно.", operationCode: "sup-41c2", actions: [{ command: "support-revoke", label: "Отозвать доступ", variant: "danger" }] },
          { id: "ss-7812", scenario: "завершён", requester: "Елена Кузнецова · служба поддержки Contoso", reason: "Диагностика календаря по обращению CS-7812", scope: "Только диагностика календаря", period: "Завершён 3 августа в 16:42", status: "Завершён", tone: "info", explanation: "Доступ больше не действует. Решение и действия сохранены в истории.", operationCode: "sup-4a11", actions: [] }
        ],
        impacts: [
          { title: "Запрос", meta: "Northwind Example · обращение CS-8041 · 45 минут", status: "Ожидает" },
          { title: "Доступ", meta: "Диагностика и чтение безопасных полей пользователя", status: "2 действия" },
          { title: "Всегда запрещено", meta: "Пароли и способы входа, повышение роли, массовый экспорт и изменение истории", status: "Заблокировано" }
        ],
        confirmText: "Проверьте специалиста, заявку, представляемого участника, точные действия и срок. Решение будет записано как неизменяемое свидетельство согласия." },
      { id: "ADM-OPS-001", mark: "ИО", title: "История операций", kind: "table", operation: "admin.operations.list", scope: "Организация",
        purpose: "Уже запущенные долгие и составные действия, их происхождение, ход выполнения и итог. Новые действия запускаются на соответствующих предметных экранах.",
        featureOverrides: { "directory-services": { total: "2 операции" } },
        columns: [{ key: "operation", label: "Операция" }, { key: "started", label: "Запущена" }, { key: "progress", label: "Результат" }, { key: "status", label: "Итог", status: true }],
        rows: [
          { featureKey: "directory-services", id: "op-7738", operation: "Сверка службы каталогов", subtitle: "Запущена по расписанию", source: "Служба синхронизации · по расписанию", started: "10:41", progress: "486 успешно · 2 требуют проверки", status: "Частичный результат", detailActions: [{ command: "retry", label: "Повторить неуспешные шаги" }] },
          { id: "op-7720", operation: "Отключение и удаление пользователя", subtitle: "Запустила Анна Волкова", source: "Анна Волкова · вручную", started: "09:14", progress: "доступ закрыт · данные сохранены", status: "Успешно", detailActions: [] }
        ],
        detailFields: [{ key: "source", label: "Кем или как запущена" }, { key: "started", label: "Начало" }, { key: "progress", label: "Результат" }, { key: "status", label: "Итог", status: true }],
        total: "1 операция" },
    ]},
    { title: "Интеграции", items: [
      { id: "ADM-INT-001", mark: "ИН", title: "Интеграции", kind: "table", operation: "admin.integration_roles.list", scope: "Организация",
        purpose: "Опубликованные провайдером роли внешних сервисов и только сужающие разрешения этой организации без секретов и пользовательских токенов.",
        notice: { tone: "info", text: "Пользователь связывает с Aurora только один Google-аккаунт. Вход, Gmail и Диск Google подтверждают одну и ту же Google-личность, но запрашивают отдельные согласия; другой аккаунт потребует явной замены." },
        toggleSummaryNoun: "Ролей",
        columns: [{ key: "role", label: "Роль" }, { key: "purpose", label: "Назначение" }, { key: "availability", label: "Доступность", toggle: true }],
        rows: [],
        total: "3 роли · Google-вход и Gmail исходно запрещены · Диск Google запрещён провайдером" }
    ]},
    { title: "Брендирование", items: [
      { id: "BRAND-EDITOR-001", embeddedScreenIds: ["BRAND-PREVIEW-001"], mark: "БР", title: "Брендирование", kind: "editor", operation: "branding.draft.update", scope: "Организация", revision: "7", draftVersion: 7, publishedVersion: 6,
        purpose: "Настройки корпоративного стиля, живой предварительный просмотр и публикация находятся на одном экране.",
        editorTitle: "Черновик брендирования организации · один профиль", fields: [
          { key: "name", label: "Название", value: "Northwind Collaboration" },
          { key: "color", label: "Основной цвет", value: "#2457D6", help: "Контраст будет проверен перед публикацией." },
          { key: "logo", label: "Файл логотипа", value: "northwind-logo.svg", help: "Активное содержимое файла запрещено." },
          { key: "supportUrl", label: "Адрес службы поддержки", value: "https://help.northwind.example" },
          { key: "surface", label: "Пример экрана", value: "Вход", type: "select", options: ["Вход", "Почта", "Мобильное приложение"] },
          { key: "theme", label: "Тема примера", value: "Светлая", type: "select", options: ["Светлая", "Тёмная", "Системная"] },
          { key: "language", label: "Язык примера", value: "Русский", type: "select", options: ["Русский", "Английский", "Турецкий", "Арабский"] }
        ], previewName: "Northwind Collaboration", previewInitial: "N", previewHeading: "Почта Northwind Collaboration", previewText: "Обязательные ссылки безопасности и восстановления остаются видимыми.", previewColor: "#e8efff" }
    ]}
  ]
  };

  const profiles = Object.freeze({
    business: Object.freeze({
      id: "business",
      label: "Бизнес · базовое администрирование",
      revision: "cap-42",
      excludedRouteIds: Object.freeze(["AI-POLICY-001", "TEN-SUPPORT-001"]),
      enabledFeatureKeys: Object.freeze(["google-drive"]),
    }),
    managed: Object.freeze({
      id: "managed",
      label: "Управляемый бизнес · расширенное администрирование",
      revision: "cap-43",
      excludedRouteIds: Object.freeze([]),
      enabledFeatureKeys: Object.freeze(["mobile-device-management", "google-drive"]),
    }),
  });

  function materializeSystemNames(value, systemIdentity) {
    if (Array.isArray(value)) return value.map((item) => materializeSystemNames(item, systemIdentity));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, materializeSystemNames(item, systemIdentity)]));
    if (typeof value !== "string") return value;
    return value.replaceAll("{{productName}}", systemIdentity.productName).replaceAll("{{mobileAppName}}", systemIdentity.mobileAppName);
  }

  function createEffectiveConfig(profileId = "managed", options = {}) {
    const profile = profiles[profileId] || profiles.business;
    const systemIdentity = { productName: options.productName || "Aurora", mobileAppName: options.mobileAppName || "Aurora Mobile" };
    const excluded = new Set(profile.excludedRouteIds);
    const enabledFeatures = new Set(profile.enabledFeatureKeys);
    if (options.googleDriveEnabled === false) enabledFeatures.delete("google-drive");
    if (options.directoryServicesEnabled) enabledFeatures.add("directory-services");
    if (options.protectedUserSessionEnabled) enabledFeatures.add("protected-user-session");
    if (options.mailUserLifecycleHooksEnabled) enabledFeatures.add("mail-user-lifecycle-hooks");
    const materializationFeatures = new Set(enabledFeatures);
    if (options.directoryServicesEnabled || options.directoryServicesRetained) materializationFeatures.add("directory-records");
    const materialized = materializeSystemNames(global.AuroraAdminCapabilities.materializeConfig(manifest, materializationFeatures), systemIdentity);
    const groups = materialized.groups
      .map((group) => ({ ...group, items: group.items.filter((route) => !excluded.has(route.id)).map((route) => route.id === "ADM-INT-001" ? {
        ...route,
        rows: global.AuroraAdminDemoState.organizationRows("tenant:northwind", { viewer: "tenant" }).filter((row) => enabledFeatures.has("google-drive") || row.id !== "google-drive"),
        alternativeRows: global.AuroraAdminDemoState.organizationRows("tenant:northwind", { viewer: "tenant", alternative: true }).filter((row) => enabledFeatures.has("google-drive") || row.id !== "google-drive"),
      } : route) }))
      .filter((group) => group.items.length > 0);
    const routeIds = groups.flatMap((group) => group.items.map((route) => route.id));
    return {
      ...materialized,
      brand: systemIdentity.productName,
      systemIdentity,
      groups,
      capabilitySnapshot: {
        profileId: profile.id,
        label: profile.label,
        revision: profile.revision,
        routeIds,
        enabledFeatureKeys: [...enabledFeatures],
        expiresAt: "2026-08-07T12:15:00Z",
      },
    };
  }

  global.AuroraTenantAdminManifest = Object.freeze({
    defaultProfile: "business",
    reviewProfiles: Object.freeze(Object.keys(profiles)),
    createEffectiveConfig,
  });
})(window);

export const DEFAULT_SUBPAGE_CONFIG_NAME = 'Default';
export const DEFAULT_SUBPAGE_CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

export const DEFAULT_SUBPAGE_CONFIG = {
    version: '1',
    additionalLocales: ['ru', 'zh', 'fa', 'fr'],
    brandingSettings: {
        title: 'Remnawave',
        logoUrl: 'https://docs.rw/img/logo.svg',
        supportUrl: 'https://t.me/remnawave',
    },
    uiConfig: {
        subscriptionInfo: {
            block: 'expanded',
        },
        installationGuides: {
            headerText: {
                en: 'Installation',
                ru: 'Установка',
                fa: 'نصب',
                fr: 'Installation',
                zh: '安装',
            },
        },
        connectionKeys: {
            headerText: {
                en: 'Connection Keys',
                ru: 'Ключи подключения',
                fa: 'کلیدهای اتصال',
                fr: 'Clés de connexion',
                zh: '连接密钥',
            },
        },
    },
    platforms: {
        ios: {
            displayName: {
                en: 'iOS',
                ru: 'iOS',
                fa: 'iOS',
                fr: 'iOS',
                zh: 'iOS',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-apple"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.286 7.008c-3.216 0 -4.286 3.23 -4.286 5.92c0 3.229 2.143 8.072 4.286 8.072c1.165 -.05 1.799 -.538 3.214 -.538c1.406 0 1.607 .538 3.214 .538s4.286 -3.229 4.286 -5.381c-.03 -.011 -2.649 -.434 -2.679 -3.23c-.02 -2.335 2.589 -3.179 2.679 -3.228c-1.096 -1.606 -3.162 -2.113 -3.75 -2.153c-1.535 -.12 -3.032 1.077 -3.75 1.077c-.729 0 -2.036 -1.077 -3.214 -1.077z" /><path d="M12 4a2 2 0 0 0 2 -2a2 2 0 0 0 -2 2" /></svg>',
            apps: [
                {
                    name: 'Happ',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.',
                                fa: 'صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.',
                                zh: '在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。',
                                fr: 'Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
                                    type: 'external',
                                    text: {
                                        en: 'App Store (RU)',
                                        fa: 'اپ استور (RU)',
                                        ru: 'App Store (RU)',
                                        zh: 'App Store (RU)',
                                        fr: 'App Store (RU)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
                                    type: 'external',
                                    text: {
                                        en: 'App Store (Global)',
                                        fa: 'اپ استور (جهانی)',
                                        ru: 'App Store (Global)',
                                        zh: 'App Store (Global)',
                                        fr: 'App Store (Global)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Stash',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the App Store page and install the app.',
                                fa: 'صفحه App Store را باز کرده و برنامه را نصب کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение.',
                                zh: '打开 App Store 页面并安装应用。',
                                fr: 'Ouvre la page de l’App Store et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Tap the button below — Stash will open and the configuration will be added automatically.',
                                fa: 'روی دکمه زیر ضربه بزنید — برنامه Stash باز می‌شود و پیکربندی به‌صورت خودکار اضافه خواهد شد.',
                                ru: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.',
                                zh: '点击下方按钮，Stash 将会打开并自动添加配置。',
                                fr: 'Appuie sur le bouton ci-dessous — Stash s’ouvrira et la configuration sera ajoutée automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'stash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'On the main screen, tap the Start button. When prompted, allow adding VPN configurations. After the profile is activated, open the Policy section and select the country you want to connect through.',
                                fa: 'در صفحه اصلی روی دکمه Start بزنید. در صورت نمایش درخواست، مجوز افزودن پیکربندی VPN را تأیید کنید. پس از فعال شدن پروفایل، وارد بخش Policy شوید و کشور موردنظر برای اتصال را انتخاب کنید.',
                                ru: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.',
                                zh: '在主界面点击「Start」按钮。在提示时允许添加 VPN 配置。配置启用后，进入「Policy（策略）」部分并选择要连接的国家。',
                                fr: 'Sur l’écran principal, appuie sur le bouton « Start ». Autorise ensuite l’ajout de la configuration VPN. Une fois le profil activé, ouvre la section « Policy » et choisis le pays de connexion.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Streisand',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.',
                                fa: 'صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.',
                                zh: '在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。',
                                fr: 'Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/ru/app/streisand/id6450534064',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'streisand://import/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add routing rules',
                                fa: 'قوانین مسیریابی را اضافه کنید',
                                ru: 'Добавить правила маршрутизации',
                                zh: '添加路由规则',
                                fr: 'Ajouter des règles de routage',
                            },
                            description: {
                                en: 'By adding routing, internal websites and applications are not passed through the VPN',
                                fa: 'با اضافه کردن مسیریابی, وب سایت ها و برنامه های داخلی از VPN عبور داده نمیشود',
                                ru: 'При добавлении роутинга, сайты внутри страны будут открываться без VPN',
                                zh: '添加路由后，国内网站和应用将不会通过 VPN 访问',
                                fr: 'En ajoutant un routage, les sites et apps internes ne passent pas par le VPN.',
                            },
                            buttons: [
                                {
                                    link: 'streisand://aW1wb3J0L3JvdXRlOi8vWW5Cc2FYTjBNRERWQVFJREJBVUdEQlVXRjFWeWRXeGxjMTFrYjIxaGFXNU5ZWFJqYUdWeVZHNWhiV1ZlWkc5dFlXbHVVM1J5WVhSbFozbFVkWFZwWktJSEVkUUlDUW9MREEwT0VGMWtiMjFoYVc1TllYUmphR1Z5Vm1SdmJXRnBibEpwY0Z0dmRYUmliM1Z1WkZSaFoxWnNhVzVsWVhLZ29ROVlaMlZ2YVhBNmNuVldaR2x5WldOMDBoSUpFQk5iYjNWMFltOTFibVJVWVdlaEZGNXlaV2RsZUhBNkxpcGNMbkoxSkcwQVVnQlZBQzBBUkFCcEFISUFaUUJqQUhUWVBOMzMyRHpkK2xwSlVFOXVSR1Z0WVc1a1h4QWtOVU5CUmpGRU5rWXRPRVV3TWkwME5EUTFMVUkxTWpjdE5rVkVRVGN3TVRZNE1UVkRDQk1aSnl3N1FFTk1XbUZrY0hkNGVvT0tqNXVkck1mU0FBQUFBQUFBQVFFQUFBQUFBQUFBR0FBQUFBQUFBQUFBQUFBQUFBQUFBBUGs9',
                                    type: 'external',
                                    text: {
                                        en: 'Add rules for Russia',
                                        fa: 'قوانین روسیه را اضافه کنید',
                                        ru: 'Добавить правила для России',
                                        zh: '添加俄罗斯规则',
                                        fr: 'Ajouter des règles pour la Russie',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'streisand://aW1wb3J0L3JvdXRlOi8vWW5Cc2FYTjBNRERWQVFJREJBVUdEaU1rSlZWeWRXeGxjMTFrYjIxaGFXNU5ZWFJqYUdWeVZHNWhiV1ZlWkc5dFlXbHVVM1J5WVhSbFozbFVkWFZwWktJSEZ0VUlDUW9MREEwT0R4SVZXMjkxZEdKdmRXNWtWR0ZuWFdSdmJXRnBiazFoZEdOb1pYSldaRzl0WVdsdVVtbHdWMjVsZEhkdmNtdFdaR2x5WldOMFZtaDVZbkpwWktJUUVWOFFFMmRsYjNOcGRHVTZZMkYwWldkdmNua3RhWEpmRUE5eVpXZGxlSEE2TGlwY1hDNXBjaVNpRXhSWVoyVnZhWEE2YVhKZFoyVnZhWEE2Y0hKcGRtRjBaVjhRUkZSRFVDd2dWVVJRTENCSVZGUlFMQ0JJVkZSUVV5d2dVMU5JTENCVFRWUlFMQ0JUVGsxUUxDQk9WRkFzSUVaVVVDd2dVRTlRTXl3Z1NVMUJVQ3dnVkdWc2JtVjAxQmNZQ2d3WkRob1ZXMjkxZEdKdmRXNWtWR0ZuWFdSdmJXRnBiazFoZEdOb1pYSlZZbXh2WTJ1b0d4d2RIaDhnSVNKZkVCaG5aVzl6YVhSbE9tTmhkR1ZuYjNKNUxXRmtjeTFoYkd4ZkVCUm5aVzl6YVhSbE9tTmhkR1ZuYjNKNUxXRmtjMThRRVdkbGIzTnBkR1U2ZVdGb2IyOHRZV1J6WHhBVFoyVnZjMmwwWlRwemNHOTBhV1o1TFdGa2MxOFFFbWRsYjNOcGRHVTZaMjl2WjJ4bExXRmtjMThRRVdkbGIzTnBkR1U2WVhCd2JHVXRZV1J6WHhBU1oyVnZjMmwwWlRwaGJXRjZiMjR0WVdSelh4QVJaMlZ2YzJsMFpUcGhaRzlpWlMxaFpITnVBRWtBVWdBdEFFUUFhUUJ5QUdVQVl3QjBBQ0RZUE4zdTJEemQ5MXhKVUVsbVRtOXVUV0YwWTJoZkVDUTNNamt5T1RCRlJDMUdSVFpCTFRReE9VVXRPVE15TmkxRE1rVkJOREl3UmpWQk0wTUFDQUFUQUJrQUp3QXNBRHNBUUFCREFFNEFXZ0JvQUc4QWNnQjZBSUVBaUFDTEFLRUFzd0MyQUw4QXpRRVVBUjBCS1FFM0FUMEJSZ0ZoQVhnQmpBR2lBYmNCeXdIZ0FmUUNFUUllQUFBQUFBQUFBZ0VBQUFBQUFBQUFKZ0FBQUFBQUFBQUFBQUFBQUFBQUFrVT0=',
                                    type: 'external',
                                    text: {
                                        en: 'Add rules for Iran',
                                        fa: 'قوانین ایران را اضافه کنید',
                                        ru: 'Добавить правила для Ирана',
                                        zh: '添加伊朗规则',
                                        fr: 'Ajouter des règles pour l’Iran',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Shadowrocket',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.',
                                fa: 'صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.',
                                zh: '在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。',
                                fr: 'Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/ru/app/shadowrocket/id932747118',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'shadowrocket://add/{{SUBSCRIPTION_LINK}}#{{USERNAME}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add routing rules',
                                fa: 'قوانین مسیریابی را اضافه کنید',
                                ru: 'Добавить правила маршрутизации',
                                zh: '添加路由规则',
                                fr: 'Ajouter des règles de routage',
                            },
                            description: {
                                en: 'By adding routing, internal websites and applications are not passed through the VPN',
                                fa: 'با اضافه کردن مسیریابی, وب سایت ها و برنامه های داخلی از VPN عبور داده نمیشود',
                                ru: 'При добавлении роутинга, сайты внутри страны будут открываться без VPN',
                                zh: '添加路由后，国内网站和应用将不会通过 VPN 访问',
                                fr: 'En ajoutant un routage, les sites et apps internes ne passent pas par le VPN.',
                            },
                            buttons: [
                                {
                                    link: 'https://cdn.sm1ky.pl/s/eB4eYAxSNGk8gja/download',
                                    type: 'external',
                                    text: {
                                        en: 'Add rules for Russia',
                                        fa: 'قوانین روسیه را اضافه کنید',
                                        ru: 'Добавить правила для России',
                                        zh: '添加俄罗斯规则',
                                        fr: 'Ajouter des règles pour la Russie',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Clash Mi',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the App Store page and install the app.',
                                fa: 'صفحه App Store را باز کرده و برنامه را نصب کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение.',
                                zh: '打开 App Store 页面并安装应用。',
                                fr: 'Ouvre la page de l’App Store et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/us/app/clash-mi/id6744321968',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Tap the button below — the app will open and the subscription will be added automatically.',
                                fa: 'روی دکمه زیر ضربه بزنید — برنامه باز می‌شود و اشتراک به‌صورت خودکار اضافه می‌گردد.',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅。',
                                fr: 'Appuie sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'clash://install-config?overwrite=no&name=Remnawave&url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'On the main screen, tap the Disconnected button, then in the VPN configuration prompt tap Allow and enter your password to connect.',
                                fa: 'در صفحه اصلی روی دکمه Disconnected بزنید، سپس در پنجره مجوز پیکربندی VPN روی Allow ضربه بزنید و برای اتصال، رمز عبور خود را وارد کنید.',
                                ru: 'На главной странице нажми кнопку Disconnected,  в появившемся окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль для подключения к VPN.',
                                zh: '在主屏幕点击 Disconnected 按钮，然后在 VPN 配置提示中点击允许并输入您的密码以连接。',
                                fr: 'Sur l’écran principal, appuie sur « Disconnected », puis, dans la demande de configuration VPN, appuie sur « Allow » et entre ton mot de passe pour te connecter.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        android: {
            displayName: {
                en: 'Android',
                ru: 'Android',
                fa: 'Android',
                fr: 'Android',
                zh: 'Android',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-android"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 10l0 6" /><path d="M20 10l0 6" /><path d="M7 9h10v8a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-8a5 5 0 0 1 10 0" /><path d="M8 3l1 2" /><path d="M16 3l-1 2" /><path d="M9 18l0 3" /><path d="M15 18l0 3" /></svg>',
            apps: [
                {
                    name: 'FlClashX',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download and install FlClash APK',
                                fa: 'دانلود و نصب FlClash APK',
                                ru: 'Скачайте и установите FlClash APK',
                                zh: '下载并安装 FlClash APK',
                                fr: 'Télécharge et installe l’APK FlClash.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-android-arm64-v8a.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://legiz-ru.github.io/Orion/redirect-page/?redirect_to=obtainium://app/%7B%22id%22%3A%22com.follow.clashx%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Fpluralplay%2FFlClashX%22%2C%22author%22%3A%22pluralplay%22%2C%22name%22%3A%22FlClashX%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22filterReleaseNotesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22verifyLatestTag%5C%22%3Afalse%2C%5C%22sortMethodChoice%5C%22%3A%5C%22date%5C%22%2C%5C%22useLatestAssetDateAsReleaseDate%5C%22%3Afalse%2C%5C%22releaseTitleAsVersion%5C%22%3Afalse%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22releaseDateAsVersion%5C%22%3Afalse%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22android-arm64-v8a%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22FlClashX%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22pluralplay%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22A%20fork%20of%20the%20multi-platform%20proxy%20client%20FlClash%20based%20on%20ClashMeta%2C%20simple%20and%20easy%20to%20use%2C%20open%20source%20and%20ad-free.%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3A%22GitHub%22%7D',
                                    type: 'external',
                                    text: {
                                        en: 'Add to Obtainium',
                                        fa: 'افزودن به Obtainium',
                                        ru: 'Добавить в Obtainium',
                                        zh: '添加到 Obtainium',
                                        fr: 'Ajoute à Obtainium',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'flclashx://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send',
                                fa: 'اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClash به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClash перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在本页右上角点击获取链接按钮，复制链接。在 FlClash 的 Profiles 部分点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。',
                                fr: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "Select the added profile in the Profiles section. In the Control Panel, click the Enable button in the bottom right corner. Once it's running, you can change the server you're connected to in the Proxy section.",
                                fa: 'پروفایل افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. در پنل کنترل، روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید. پس از اجرا، می‌توانید در بخش پروکسی، سروری را که به آن متصل می‌شوید تغییر دهید.',
                                ru: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит. ',
                                zh: '在 Profiles 部分选择已添加的配置文件。在控制面板右下角点击启用按钮。启动后，你可以在 Proxy 部分更换连接的服务器。',
                                fr: "Select the added profile in the « Profiles » section. In the Control Panel, click the « Enable » button in the bottom right corner. Once it's running, you can change the server you're connected to in the « Proxy » section.",
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Clash Meta',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download and install Clash Meta APK',
                                fa: 'دانلود و نصب Clash Meta APK',
                                ru: 'Скачайте и установите Clash Meta APK',
                                zh: '下载并安装 Clash Meta APK',
                                fr: 'Télécharge et installe l’APK Clash Meta.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases/download/v2.11.20/cmfa-2.11.20-meta-universal-release.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://f-droid.org/packages/com.github.metacubex.clash.meta/',
                                    type: 'external',
                                    text: {
                                        en: 'Open in F-Droid',
                                        fa: 'در F-Droid باز کنید',
                                        ru: 'Открыть в F-Droid',
                                        zh: '在 F-Droid 打开',
                                        fr: 'Ouvre dans F‑Droid',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://legiz-ru.github.io/Orion/redirect-page/?redirect_to=obtainium://app/%7B%22id%22%3A%22com.github.metacubex.clash.meta%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2FMetaCubeX%2FClashMetaForAndroid%22%2C%22author%22%3A%22MetaCubeX%22%2C%22name%22%3A%22Clash%20Meta%20for%20Android%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22filterReleaseNotesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22verifyLatestTag%5C%22%3Afalse%2C%5C%22sortMethodChoice%5C%22%3A%5C%22date%5C%22%2C%5C%22useLatestAssetDateAsReleaseDate%5C%22%3Afalse%2C%5C%22releaseTitleAsVersion%5C%22%3Afalse%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%5C%22%2C%5C%22versionDetection%5C%22%3Afalse%2C%5C%22releaseDateAsVersion%5C%22%3Afalse%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22universal%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%2C%5C%22dontSortReleasesList%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D',
                                    type: 'external',
                                    text: {
                                        en: 'Add to Obtainium',
                                        fa: 'افزودن به Obtainium',
                                        ru: 'Добавить в Obtainium',
                                        zh: '添加到 Obtainium',
                                        fr: 'Ajoute à Obtainium',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to open the profile creation window. You will need to specify the auto-update period, for example, 720 minutes. Click the Save button in the top right corner.',
                                fa: 'دکمه زیر را بزنید تا پنجره ایجاد پروفایل باز شود. شما باید دوره به‌روزرسانی خودکار را مشخص کنید، مثلاً ۷۲۰ دقیقه. دکمه ذخیره را در بالا سمت راست بزنید.',
                                ru: 'Нажми кнопку ниже — откроется окно создания профиля. Тебе потребуется указать период автообновления, например, 720 минут. Справа вверху нажми на кнопку Сохранить.',
                                zh: '点击下方按钮打开配置文件创建窗口。你需要指定自动更新周期，例如 720 分钟。点击右上角的保存按钮。',
                                fr: 'Clique sur le bouton ci‑dessous pour ouvrir la fenêtre de création de profil. Indique la période d’actualisation automatique, par exemple 720 minutes. Appuie sur « « Save » » en haut à droite.',
                            },
                            buttons: [
                                {
                                    link: 'clashmeta://install-config?name=Remnawave&url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Go to the Profiles section and select the created profile, then return to the main page. Now you can connect by clicking the Stopped button.',
                                fa: 'به بخش پروفایل‌ها بروید و پروفایل ایجاد شده را انتخاب کنید، سپس به صفحه اصلی بازگردید. اکنون می‌توانید با زدن دکمه «متوقف شده» متصل شوید.',
                                ru: 'Перейди в пункт Профили и выбери созданный профиль, затем вернись на главную страницу. Теперь ты можешь подключиться, нажав на кнопку Остановлен',
                                zh: '进入“配置文件”部分并选择已创建的配置文件，然后返回主页面。现在你可以点击“已停止”按钮连接。',
                                fr: 'Va dans « Profiles » et sélectionne le profil créé, puis reviens à la page principale. Tu peux maintenant te connecter en appuyant sur « Stopped ».',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Happ',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in Google Play and install the app. Or install the app directly from the APK file if Google Play is not working.',
                                fa: 'صفحه را در Google Play باز کنید و برنامه را نصب کنید. یا برنامه را مستقیماً از فایل APK نصب کنید، اگر Google Play کار نمی کند.',
                                ru: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.',
                                zh: '在 Google Play 打开页面并安装应用。如果 Google Play 无法使用，也可以直接通过 APK 文件安装此应用。',
                                fr: 'Ouvre la page dans Google Play et installe l’app. Si Google Play ne fonctionne pas, installe‑la directement via l’APK.',
                            },
                            buttons: [
                                {
                                    link: 'https://play.google.com/store/apps/details?id=com.happproxy',
                                    type: 'external',
                                    text: {
                                        en: 'Open in Google Play',
                                        fa: 'باز کردن در Google Play',
                                        ru: 'Открыть в Google Play',
                                        zh: '在 Google Play 打开',
                                        fr: 'Ouvre dans Google Play',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Open the app and connect to the server',
                                fa: 'برنامه را باز کنید و به سرور متصل شوید',
                                ru: 'Откройте приложение и подключитесь к серверу',
                                zh: '打开应用并连接到服务器',
                                fr: 'Ouvre l’app et connecte‑toi au serveur.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'v2rayNG',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download and install v2rayNG APK',
                                fa: 'دانلود و نصب v2rayNG APK',
                                ru: 'Скачайте и установите v2rayNG APK',
                                zh: '下载并安装 v2rayNG APK',
                                fr: 'Télécharge et installe l’APK v2rayNG.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/2dust/v2rayNG/releases/download/1.10.31/v2rayNG_1.10.31_universal.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://legiz-ru.github.io/Orion/redirect-page/?redirect_to=obtainium://app/%7B%22id%22%3A%22com.v2ray.ang%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2F2dust%2Fv2rayNG%22%2C%22author%22%3A%222dust%22%2C%22name%22%3A%22v2rayNG%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22filterReleaseNotesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22verifyLatestTag%5C%22%3Afalse%2C%5C%22sortMethodChoice%5C%22%3A%5C%22date%5C%22%2C%5C%22useLatestAssetDateAsReleaseDate%5C%22%3Afalse%2C%5C%22releaseTitleAsVersion%5C%22%3Afalse%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22releaseDateAsVersion%5C%22%3Afalse%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22universal%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22v2rayNG%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%222dust%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22A%20V2Ray%20client%20for%20Android%2C%20support%20Xray%20core%20and%20v2fly%20core%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D',
                                    type: 'external',
                                    text: {
                                        en: 'Add to Obtainium',
                                        fa: 'افزودن به Obtainium',
                                        ru: 'Добавить в Obtainium',
                                        zh: '添加到 Obtainium',
                                        fr: 'Ajoute à Obtainium',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'v2rayng://install-config?name=Remnawave&url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Update subscriptions',
                                fa: 'به‌روزرسانی اشتراک‌ها',
                                ru: 'Обновление подписки',
                                zh: '更新订阅',
                                fr: 'Mettre à jour les abonnements',
                            },
                            description: {
                                en: 'Tap the three dots in the top-right corner and select Update subscription. After that, the available servers will appear in the list.',
                                fa: 'روی سه نقطه در گوشه بالا سمت راست کلیک کنید و گزینه به‌روزرسانی اشتراک را انتخاب کنید. سپس سرورهای موجود در لیست ظاهر می‌شوند.',
                                ru: 'Нажмите на три точечки справа сверху и выберите Обновить подписку. После этого в списке появятся доступные серверы',
                                zh: '点击右上角的三个点，选择“更新订阅”。之后，列表中会显示可用服务器。',
                                fr: 'Appuie sur les trois points en haut à droite et sélectionne « Update subscription ». Les serveurs disponibles apparaîtront alors dans la liste.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the required server and click the Enable button in the bottom right corner.',
                                fa: 'سرور موردنظر را انتخاب کنید و روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید.',
                                ru: 'Выберите требуемый сервер и нажмите кнопку Включить в правом нижнем углу',
                                zh: '选择所需服务器并点击右下角的启用按钮。',
                                fr: 'Sélectionne le serveur souhaité puis appuie sur « Enable » en bas à droite.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Exclave',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download and install Exclave APK',
                                fa: 'دانلود و نصب Exclave APK',
                                ru: 'Скачайте и установите Exclave APK',
                                zh: '下载并安装 Exclave APK',
                                fr: 'Télécharge et installe l’APK Exclave.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/dyhkwong/Exclave/releases/download/0.17.4/Exclave-0.17.4-arm64-v8a.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://f-droid.org/packages/com.github.dyhkwong.sagernet',
                                    type: 'external',
                                    text: {
                                        en: 'Open in F-Droid',
                                        fa: 'در F-Droid باز کنید',
                                        ru: 'Открыть в F-Droid',
                                        zh: '在 F-Droid 打开',
                                        fr: 'Ouvre dans F‑Droid',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://legiz-ru.github.io/Orion/redirect-page/?redirect_to=obtainium://app/%7B%22id%22%3A%22com.github.dyhkwong.sagernet%22%2C%22url%22%3A%22https%3A%2F%2Fgithub.com%2Fdyhkwong%2FExclave%22%2C%22author%22%3A%22dyhkwong%22%2C%22name%22%3A%22Exclave%22%2C%22preferredApkIndex%22%3A0%2C%22additionalSettings%22%3A%22%7B%5C%22includePrereleases%5C%22%3Afalse%2C%5C%22fallbackToOlderReleases%5C%22%3Atrue%2C%5C%22filterReleaseTitlesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22filterReleaseNotesByRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22verifyLatestTag%5C%22%3Atrue%2C%5C%22sortMethodChoice%5C%22%3A%5C%22date%5C%22%2C%5C%22useLatestAssetDateAsReleaseDate%5C%22%3Afalse%2C%5C%22releaseTitleAsVersion%5C%22%3Afalse%2C%5C%22trackOnly%5C%22%3Afalse%2C%5C%22versionExtractionRegEx%5C%22%3A%5C%22%5C%22%2C%5C%22matchGroupToUse%5C%22%3A%5C%22%5C%22%2C%5C%22versionDetection%5C%22%3Atrue%2C%5C%22releaseDateAsVersion%5C%22%3Afalse%2C%5C%22useVersionCodeAsOSVersion%5C%22%3Afalse%2C%5C%22apkFilterRegEx%5C%22%3A%5C%22arm64%5C%22%2C%5C%22invertAPKFilter%5C%22%3Afalse%2C%5C%22autoApkFilterByArch%5C%22%3Atrue%2C%5C%22appName%5C%22%3A%5C%22%5C%22%2C%5C%22appAuthor%5C%22%3A%5C%22%5C%22%2C%5C%22shizukuPretendToBeGooglePlay%5C%22%3Afalse%2C%5C%22allowInsecure%5C%22%3Afalse%2C%5C%22exemptFromBackgroundUpdates%5C%22%3Afalse%2C%5C%22skipUpdateNotifications%5C%22%3Afalse%2C%5C%22about%5C%22%3A%5C%22%5C%22%2C%5C%22refreshBeforeDownload%5C%22%3Afalse%2C%5C%22dontSortReleasesList%5C%22%3Afalse%7D%22%2C%22overrideSource%22%3Anull%7D',
                                    type: 'external',
                                    text: {
                                        en: 'Add to Obtainium',
                                        fa: 'افزودن به Obtainium',
                                        ru: 'Добавить в Obtainium',
                                        zh: '添加到 Obtainium',
                                        fr: 'Ajoute à Obtainium',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'exclave://subscription?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Enable subscription auto-renewal',
                                fa: 'تمدید خودکار اشتراک را فعال کنید',
                                ru: 'Включите автообновление подписки',
                                zh: '启用订阅自动续期',
                                fr: 'Activer le renouvellement automatique de l’abonnement',
                            },
                            description: {
                                en: 'In the Groups section, go to the editing mode of the added subscription and enable the toggle next to Auto-Renewal. You can also rename the subscription if needed.',
                                fa: 'در بخش گروه‌ها، وارد حالت ویرایش اشتراک اضافه‌شده شوید و گزینه تمدید خودکار را فعال کنید. همچنین در صورت نیاز می‌توانید نام اشتراک را تغییر دهید.',
                                ru: 'В разделе Группы перейдите в режим редактирования добавленной подписки, включите переключатель у пункта Автоматическое обновление. Так же вы можете переименовать подписку, если требуется.',
                                zh: '在 Groups 部分进入已添加订阅的编辑模式，启用“自动续期”开关。如果需要，你还可以重命名订阅。',
                                fr: 'Dans la section « Groups », passe en mode édition de l’abonnement ajouté et active l’option « Auto‑Renewal ». Tu peux aussi renommer l’abonnement si nécessaire.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the desired server in the Configuration section and click the Enable button in the bottom right corner.',
                                fa: 'در بخش پیکربندی، سرور مورد نظر را انتخاب کرده و روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید.',
                                ru: 'Выберите требуемый сервер в разделе Конфигурация и нажмите кнопку Включить в правом нижнем углу',
                                zh: '在配置部分选择所需服务器并点击右下角的启用按钮。',
                                fr: 'Dans la section « Configuration », choisis le serveur souhaité puis appuie sur « Enable » en bas à droite.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        linux: {
            displayName: {
                en: 'Linux',
                ru: 'Linux',
                fa: 'Linux',
                fr: 'Linux',
                zh: 'Linux',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-ubuntu"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M6.5 15.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M17.5 15.5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" /><path d="M6.5 15.5l5.5 -3.5" /><path d="M12 5v7" /><path d="M17.5 15.5l-5.5 -3.5" /></svg>',
            apps: [
                {
                    name: 'FlClashX',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.deb)',
                                        fa: 'amd64 (.deb)',
                                        ru: 'amd64 (.deb)',
                                        zh: 'amd64 (.deb)',
                                        fr: 'amd64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.AppImage',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (AppImage)',
                                        fa: 'amd64 (AppImage)',
                                        ru: 'amd64 (AppImage)',
                                        zh: 'amd64 (AppImage)',
                                        fr: 'amd64 (AppImage)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-amd64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.rpm)',
                                        fa: 'amd64 (.rpm)',
                                        ru: 'amd64 (.rpm)',
                                        zh: 'amd64 (.rpm)',
                                        fr: 'amd64 (.rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-linux-arm64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'arm64 (.deb)',
                                        fa: 'arm64 (.deb)',
                                        ru: 'arm64 (.deb)',
                                        zh: 'arm64 (.deb)',
                                        fr: 'arm64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'flclashx://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send',
                                fa: 'اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClash به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClash перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClash 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。',
                                fr: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.',
                                fa: 'نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.',
                                ru: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит. ',
                                zh: '在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。',
                                fr: 'Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Koala Clash',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_amd64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.deb)',
                                        fa: 'amd64 (.deb)',
                                        ru: 'amd64 (.deb)',
                                        zh: 'amd64 (.deb)',
                                        fr: 'amd64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash.x86_64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.rpm)',
                                        fa: 'amd64 (.rpm)',
                                        ru: 'amd64 (.rpm)',
                                        zh: 'amd64 (.rpm)',
                                        fr: 'amd64 (.rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_arm64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'arm64 (.deb)',
                                        fa: 'arm64 (.deb)',
                                        ru: 'arm64 (.deb)',
                                        zh: 'arm64 (.deb)',
                                        fr: 'arm64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash.aarch64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'arm64 (.rpm)',
                                        fa: 'arm64 (.rpm)',
                                        ru: 'arm64 (.rpm)',
                                        zh: 'arm64 (.rpm)',
                                        fr: 'arm64 (.rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Warning',
                                fa: 'هشدار',
                                ru: 'Предупреждение',
                                zh: '警告',
                                fr: 'Avertissement',
                            },
                            description: {
                                en: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.',
                                fa: 'اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید.',
                                ru: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.',
                                zh: '如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。',
                                fr: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'koala-clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک اضافه نشد',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                                fa: 'می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.',
                                ru: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.',
                                zh: '您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。',
                                fr: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Prizrak-Box',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the package matching your architecture and install Prizrak-Box.',
                                fa: 'بسته مناسب معماری خود را انتخاب کرده و Prizrak-Box را نصب کنید.',
                                ru: 'Выберите пакет под вашу архитектуру и установите Prizrak-Box.',
                                zh: '选择适合您架构的安装包并安装 Prizrak-Box。',
                                fr: 'Choose the package matching your architecture and install Prizrak-Box.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-amd64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.deb)',
                                        fa: 'amd64 (.deb)',
                                        ru: 'amd64 (.deb)',
                                        zh: 'amd64 (.deb)',
                                        fr: 'amd64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-amd64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'amd64 (.rpm)',
                                        fa: 'amd64 (.rpm)',
                                        ru: 'amd64 (.rpm)',
                                        zh: 'amd64 (.rpm)',
                                        fr: 'amd64 (.rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-arm64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'arm64 (.deb)',
                                        fa: 'arm64 (.deb)',
                                        ru: 'arm64 (.deb)',
                                        zh: 'arm64 (.deb)',
                                        fr: 'arm64 (.deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/linux-arm64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'arm64 (.rpm)',
                                        fa: 'arm64 (.rpm)',
                                        ru: 'arm64 (.rpm)',
                                        zh: 'arm64 (.rpm)',
                                        fr: 'arm64 (.rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Warning',
                                fa: 'هشدار',
                                ru: 'Предупреждение',
                                zh: '警告',
                                fr: 'Avertissement',
                            },
                            description: {
                                en: 'Run the program.',
                                fa: 'برنامه را اجرا کنید.',
                                ru: 'Запустите программу.',
                                zh: '运行程序。',
                                fr: 'Run the program.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add the subscription automatically.',
                                fa: 'روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.',
                                ru: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.',
                                zh: '点击下方按钮即可自动添加订阅。',
                                fr: 'Click the button below to add the subscription automatically.',
                            },
                            buttons: [
                                {
                                    link: 'prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.',
                                fa: 'اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».',
                                zh: '如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.',
                                fa: 'اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.',
                                ru: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.',
                                zh: '在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。',
                                fr: 'Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Clash Verge',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_amd64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'Linux (amd64 .deb)',
                                        fa: 'لینوکس (amd64 .deb)',
                                        ru: 'Linux (amd64 .deb)',
                                        zh: 'Linux（amd64 .deb）',
                                        fr: 'Linux (amd64 .deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge-2.4.4-rc-1.x86_64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'Linux (x86_64 .rpm)',
                                        fa: 'لینوکس (x86_64 .rpm)',
                                        ru: 'Linux (x86_64 .rpm)',
                                        zh: 'Linux（x86_64 .rpm）',
                                        fr: 'Linux (x86_64 .rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_arm64.deb',
                                    type: 'external',
                                    text: {
                                        en: 'Linux (ARM64 .deb)',
                                        fa: 'لینوکس (ARM64 .deb)',
                                        ru: 'Linux (ARM64 .deb)',
                                        zh: 'Linux（ARM64 .deb）',
                                        fr: 'Linux (ARM64 .deb)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge-2.4.4-rc-1.aarch64.rpm',
                                    type: 'external',
                                    text: {
                                        en: 'Linux (aarch64 .rpm)',
                                        fa: 'لینوکس (aarch64 .rpm)',
                                        ru: 'Linux (aarch64 .rpm)',
                                        zh: 'Linux（aarch64 .rpm）',
                                        fr: 'Linux (aarch64 .rpm)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Change language',
                                fa: 'تغییر زبان',
                                ru: 'Смена языка',
                                zh: '更改语言',
                                fr: 'Change language',
                            },
                            description: {
                                en: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                                fa: 'پس از راه‌اندازی برنامه، می‌توانید زبان را در تنظیمات تغییر دهید. در پنل سمت چپ، نماد چرخ دنده را پیدا کنید، سپس به Verge 设置 بروید و 语言设置 را انتخاب کنید.',
                                ru: 'После запуска приложения вы можете сменить язык в настройках. В левой панели найдите иконку шестеренки, далее ориентируйтесь на Verge 设置 и выберите пункт 语言设置.',
                                zh: '启动应用后，可以在设置中更改语言。在左侧面板找到齿轮图标，进入 Verge 设置，然后选择 语言设置。',
                                fr: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Clash Verge, go to the Profiles section and paste the link in the text field, then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در گوشه بالا سمت راست این صفحه روی دکمه دریافت لینک کلیک کنید، لینک را کپی کنید. در Clash Verge به بخش پروفایل‌ها بروید و لینک را در فیلد متنی وارد کنید، سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Clash Verge перейдите в раздел Профили и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在本页右上角点击获取链接按钮，复制链接。在 Clash Verge 的 Profiles 部分粘贴链接到文本框，然后点击导入按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Clash Verge, go to the « Profiles » section and paste the link in the text field, then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server in the Proxy section, and enable VPN in the Settings section. Set the TUN Mode switch to ON.',
                                fa: 'می‌توانید در بخش پروکسی سرور را انتخاب کنید و در بخش تنظیمات VPN را فعال کنید. کلید TUN Mode را در حالت روشن قرار دهید.',
                                ru: 'Выбрать сервер можно в разделе Прокси, включить VPN можно в разделе Настройки. Установите переключатель TUN Mode в положение ВКЛ.',
                                zh: '您可以在代理部分选择服务器，在设置中启用 VPN。将 TUN 模式开关设置为开启。',
                                fr: 'You can select a server in the « Proxy » section, and enable VPN in the Settings section. Set the « TUN » Mode switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        macos: {
            displayName: {
                en: 'macOS',
                ru: 'macOS',
                fa: 'macOS',
                fr: 'macOS',
                zh: 'macOS',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-finder"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 4m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" /><path d="M7 8v1" /><path d="M17 8v1" /><path d="M12.5 4c-.654 1.486 -1.26 3.443 -1.5 9h2.5c-.19 2.867 .094 5.024 .5 7" /><path d="M7 15.5c3.667 2 6.333 2 10 0" /></svg>',
            apps: [
                {
                    name: 'Happ',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/ru/app/happ-proxy-utility-plus/id6746188973',
                                    type: 'external',
                                    text: {
                                        en: 'App Store (RU)',
                                        fa: 'اپ استور (RU)',
                                        ru: 'App Store (RU)',
                                        zh: 'App Store (RU)',
                                        fr: 'App Store (RU)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://apps.apple.com/us/app/happ-proxy-utility/id6504287215',
                                    type: 'external',
                                    text: {
                                        en: 'App Store (Global)',
                                        fa: 'اپ استور (جهانی)',
                                        ru: 'App Store (Global)',
                                        zh: 'App Store (Global)',
                                        fr: 'App Store (Global)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮——应用将会打开，订阅会自动添加。',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Koala Clash',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_aarch64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Apple Silicon)',
                                        fa: 'مک (Apple Silicon)',
                                        ru: 'macOS (Apple Silicon)',
                                        zh: 'macOS（Apple Silicon）',
                                        fr: 'macOS (Apple Silicon)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_x64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Intel)',
                                        fa: 'مک (اینتل)',
                                        ru: 'macOS (Intel)',
                                        zh: 'macOS（Intel）',
                                        fr: 'macOS (Intel)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Warning',
                                fa: 'هشدار',
                                ru: 'Предупреждение',
                                zh: '警告',
                                fr: 'Avertissement',
                            },
                            description: {
                                en: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash. ⚠️ Warning: If you get a notification that the application is corrupted when you run it on macOS, run this command in Terminal: sudo xattr -r -c /Applications/Koala\\ Clash.app',
                                fa: 'اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید. ⚠️ هشدار: اگر هنگام اجرای برنامه در macOS پیامی مبنی بر خراب بودن برنامه دریافت کردید، این دستور را در ترمینال اجرا کنید: sudo xattr -r -c /Applications/Koala\\ Clash.app',
                                ru: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash. ⚠️ Предупреждение: Если при запуске приложения на macOS появляется уведомление, что приложение повреждено, выполните эту команду в терминале: sudo xattr -r -c /Applications/Koala\\ Clash.app',
                                zh: '如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。⚠️ 警告：如果在 macOS 上运行应用时收到应用已损坏的提示，请在终端运行以下命令：sudo xattr -r -c /Applications/Koala\\ Clash.app',
                                fr: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash. ⚠️ Warning : If you get a notification that the application is corrupted when you run it on macOS, run this command in Terminal : sudo xattr -r -c /Applications/Koala\\ Clash.app.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'koala-clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک اضافه نشد',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                                fa: 'می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.',
                                ru: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.',
                                zh: '您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。',
                                fr: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'FlClashX',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-macos-arm64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Apple Silicon)',
                                        fa: 'مک (Apple Silicon)',
                                        ru: 'macOS (Apple Silicon)',
                                        zh: 'macOS（Apple Silicon）',
                                        fr: 'macOS (Apple Silicon)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-macos-amd64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Intel)',
                                        fa: 'مک (اینتل)',
                                        ru: 'macOS (Intel)',
                                        zh: 'macOS（Intel）',
                                        fr: 'macOS (Intel)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'flclashx://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send',
                                fa: 'اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClash به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClash перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClash 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。',
                                fr: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.',
                                fa: 'نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.',
                                ru: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит. ',
                                zh: '在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。',
                                fr: 'Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Prizrak-Box',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download the archive for your chip (Apple Silicon or Intel), unzip and move Prizrak-Box.app to Applications.',
                                fa: 'فایل مناسب (Apple Silicon یا Intel) را دانلود کرده، از حالت فشرده خارج و برنامه را به Applications منتقل کنید.',
                                ru: 'Скачайте архив под ваш чип (Apple Silicon или Intel), распакуйте и переместите Prizrak-Box.app в Applications.',
                                zh: '下载适合您芯片（Apple Silicon 或 Intel）的压缩包，解压后将 Prizrak-Box.app 移入 Applications。',
                                fr: 'Download the archive for your chip (Apple Silicon or Intel), unzip and move Prizrak-Box.app to Applications.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/macos-arm64-dmg.zip',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Apple Silicon)',
                                        fa: 'macOS (Apple Silicon)',
                                        ru: 'macOS (Apple Silicon)',
                                        zh: 'macOS（Apple Silicon）',
                                        fr: 'macOS (Apple Silicon)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/macos-amd64-dmg.zip',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Intel)',
                                        fa: 'macOS (Intel)',
                                        ru: 'macOS (Intel)',
                                        zh: 'macOS（Intel）',
                                        fr: 'macOS (Intel)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Read before first launch',
                                fa: 'قبل از اولین اجرا بخوانید',
                                ru: 'Прочти перед первым запуском',
                                zh: '首次启动前阅读',
                                fr: 'Read before first launch',
                            },
                            description: {
                                en: 'If macOS shows security warnings, follow this guide.',
                                fa: 'اگر macOS هشدار امنیتی نشان داد، این راهنما را دنبال کنید.',
                                ru: 'Если macOS показывает предупреждения безопасности — следуйте инструкции.',
                                zh: '若 macOS 显示安全警告，请按指南操作。',
                                fr: 'If macOS shows security warnings, follow this guide.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/blob/v3/doc/mac/mac.md',
                                    type: 'external',
                                    text: {
                                        en: 'Mac Guide',
                                        fa: 'راهنمای مک',
                                        ru: 'Инструкция для Mac',
                                        zh: 'Mac 使用指南',
                                        fr: 'Mac Guide',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add the subscription automatically.',
                                fa: 'روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.',
                                ru: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.',
                                zh: '点击下方按钮即可自动添加订阅。',
                                fr: 'Click the button below to add the subscription automatically.',
                            },
                            buttons: [
                                {
                                    link: 'prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.',
                                fa: 'اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку «Получить ссылку» в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел «Профили», нажмите кнопку «+», вставьте скопированную ссылку и нажмите «Подтвердить».',
                                zh: '如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.',
                                fa: 'اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.',
                                ru: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.',
                                zh: '在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。',
                                fr: 'Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Clash Verge',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_x64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Intel)',
                                        fa: 'مک (اینتل)',
                                        ru: 'macOS (Intel)',
                                        zh: 'macOS（Intel）',
                                        fr: 'macOS (Intel)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_aarch64.dmg',
                                    type: 'external',
                                    text: {
                                        en: 'macOS (Apple Silicon)',
                                        fa: 'مک (Apple Silicon)',
                                        ru: 'macOS (Apple Silicon)',
                                        zh: 'macOS（Apple Silicon）',
                                        fr: 'macOS (Apple Silicon)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Change language',
                                fa: 'تغییر زبان',
                                ru: 'Смена языка',
                                zh: '更改语言',
                                fr: 'Change language',
                            },
                            description: {
                                en: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                                fa: 'پس از راه‌اندازی برنامه، می‌توانید زبان را در تنظیمات تغییر دهید. در پنل سمت چپ، نماد چرخ دنده را پیدا کنید، سپس به Verge 设置 بروید و 语言设置 را انتخاب کنید.',
                                ru: 'После запуска приложения вы можете сменить язык в настройках. В левой панели найдите иконку шестеренки, далее ориентируйтесь на Verge 设置 и выберите пункт 语言设置.',
                                zh: '启动应用后，可以在设置中更改语言。在左侧面板找到齿轮图标，进入 Verge 设置，然后选择 语言设置。',
                                fr: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Clash Verge, go to the Profiles section and paste the link in the text field, then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در گوشه بالا سمت راست این صفحه روی دکمه دریافت لینک کلیک کنید، لینک را کپی کنید. در Clash Verge به بخش پروفایل‌ها بروید و لینک را در فیلد متنی وارد کنید، سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Clash Verge перейдите в раздел Профили и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在本页右上角点击获取链接按钮，复制链接。在 Clash Verge 的 Profiles 部分粘贴链接到文本框，然后点击导入按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Clash Verge, go to the « Profiles » section and paste the link in the text field, then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server in the Proxy section, and enable VPN in the Settings section. Set the TUN Mode switch to ON.',
                                fa: 'می‌توانید در بخش پروکسی سرور را انتخاب کنید و در بخش تنظیمات VPN را فعال کنید. کلید TUN Mode را در حالت روشن قرار دهید.',
                                ru: 'Выбрать сервер можно в разделе Прокси, включить VPN можно в разделе Настройки. Установите переключатель TUN Mode в положение ВКЛ.',
                                zh: '您可以在代理部分选择服务器，在设置中启用 VPN。将 TUN 模式开关设置为开启。',
                                fr: 'You can select a server in the « Proxy » section, and enable VPN in the Settings section. Set the « TUN » Mode switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        windows: {
            displayName: {
                en: 'Windows',
                ru: 'Windows',
                fa: 'Windows',
                fr: 'Windows',
                zh: 'Windows',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-brand-windows"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17.8 20l-12 -1.5c-1 -.1 -1.8 -.9 -1.8 -1.9v-9.2c0 -1 .8 -1.8 1.8 -1.9l12 -1.5c1.2 -.1 2.2 .8 2.2 1.9v12.1c0 1.2 -1.1 2.1 -2.2 1.9z" /><path d="M12 5l0 14" /><path d="M4 12l16 0" /></svg>',
            apps: [
                {
                    name: 'FlClashX',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-amd64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Setup)',
                                        fa: 'ویندوز (نصب)',
                                        ru: 'Windows (Установщик)',
                                        zh: 'Windows（安装程序）',
                                        fr: 'Windows (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-amd64.zip',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Portable)',
                                        fa: 'ویندوز (قابل حمل)',
                                        ru: 'Windows (Портативная)',
                                        zh: 'Windows（便携版）',
                                        fr: 'Windows (Portable)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-arm64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Setup)',
                                        fa: 'ویندوز ARM (نصب)',
                                        ru: 'Windows на ARM (Установщик)',
                                        zh: 'Windows on ARM（安装程序）',
                                        fr: 'Windows on ARM (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-windows-arm64.zip',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Portable)',
                                        fa: 'ویندوز ARM (قابل حمل)',
                                        ru: 'Windows на ARM (Портативная)',
                                        zh: 'Windows on ARM（便携版）',
                                        fr: 'Windows on ARM (Portable)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'flclashx://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send',
                                fa: 'اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClash به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClash перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClash 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。',
                                fr: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added profile in the Profiles section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the TUN item. After launching, in the Proxy section, you can change the choice of the server to which you will be connected.',
                                fa: 'نمایه اضافه شده را در قسمت پروفایل ها انتخاب کنید. در داشبورد، روی دکمه فعال کردن در گوشه پایین سمت راست کلیک کنید و سپس سوئیچ کنار مورد TUN را روشن کنید. پس از راه اندازی در قسمت Proxy می توانید انتخاب سروری که به آن متصل خواهید شد را تغییر دهید.',
                                ru: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу, а затем включите переключатель у пункта TUN. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит. ',
                                zh: '在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮，然后打开 TUN 项旁边的开关。启动后，在代理部分可以更改所连接的服务器。',
                                fr: 'Select the added profile in the « Profiles » section. In the Dashboard, click the enable button in the lower right corner, and then turn on the switch next to the « TUN » item. After launching, in the « Proxy » section, you can change the choice of the server to which you will be connected.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Koala Clash',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_x64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Setup)',
                                        fa: 'ویندوز (نصب)',
                                        ru: 'Windows (Установщик)',
                                        zh: 'Windows（安装程序）',
                                        fr: 'Windows (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/coolcoala/clash-verge-rev-lite/releases/latest/download/Koala.Clash_arm64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Setup)',
                                        fa: 'ویندوز ARM (نصب)',
                                        ru: 'Windows на ARM (Установщик)',
                                        zh: 'Windows on ARM（安装程序）',
                                        fr: 'Windows on ARM (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Warning',
                                fa: 'هشدار',
                                ru: 'Предупреждение',
                                zh: '警告',
                                fr: 'Avertissement',
                            },
                            description: {
                                en: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.',
                                fa: 'اگر قبلاً از Clash Verge Rev استفاده کرده‌اید، باید قبل از نصب Koala Clash آن را حذف کنید.',
                                ru: 'Если вы ранее использовали Clash Verge Rev, то его требуется удалить перед установкой Koala Clash.',
                                zh: '如果您之前用过 Clash Verge Rev，请在安装 Koala Clash 前先卸载它。',
                                fr: 'If you have previously used Clash Verge Rev, you need to uninstall it before installing Koala Clash.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'koala-clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک اضافه نشد',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the Add Profile button, paste the link into the text field, and then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در گوشه بالا سمت راست این صفحه کلیک کنید و لینک را کپی کنید. در برنامه Koala Clash به صفحه اصلی بروید، روی دکمه افزودن پروفایل کلیک کنید، لینک را در فیلد متنی قرار دهید و سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой странице кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Koala Clash перейдите на главную страницу, нажмите кнопку Добавить профиль и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 Koala Clash 主页面点击“添加配置文件”按钮，将链接粘贴到文本框中，然后点击“导入”按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Koala Clash, go to the main page, click the « Add Profile » button, paste the link into the text field, and then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                                fa: 'می‌توانید سرور را در پایین صفحه اصلی انتخاب کنید و با کلیک روی دکمه بزرگ در مرکز صفحه اصلی، VPN را فعال کنید.',
                                ru: 'Выбрать сервер можно внизу на главной странице, включить VPN можно нажав на главной странице на большую кнопку по центру.',
                                zh: '您可以在主页面底部选择服务器，并通过点击主页面中央的大按钮来启用 VPN。',
                                fr: 'You can select a server at the bottom of the main page, and enable VPN by clicking on the large button in the center of the main page.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Prizrak-Box',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose your architecture (installer preferred for automatic integration) and install or unzip Prizrak-Box.',
                                fa: 'معماری مناسب را انتخاب کنید (نصب‌کننده ترجیح دارد) و Prizrak-Box را نصب یا از حالت فشرده خارج کنید.',
                                ru: 'Выберите архитектуру (предпочтительно установщик) и установите или распакуйте Prizrak-Box.',
                                zh: '选择适合的架构（建议使用安装程序）并安装或解压 Prizrak-Box。',
                                fr: 'Choose your architecture (installer preferred for automatic integration) and install or unzip Prizrak-Box.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-amd64.msi',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Setup)',
                                        fa: 'ویندوز (نصب)',
                                        ru: 'Windows (Установщик)',
                                        zh: 'Windows（安装程序）',
                                        fr: 'Windows (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-amd64.zip',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Portable)',
                                        fa: 'ویندوز (قابل حمل)',
                                        ru: 'Windows (Портативная)',
                                        zh: 'Windows（便携版）',
                                        fr: 'Windows (Portable)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-arm64.msi',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Setup)',
                                        fa: 'ویندوز ARM (نصب)',
                                        ru: 'Windows на ARM (Установщик)',
                                        zh: 'Windows on ARM（安装程序）',
                                        fr: 'Windows on ARM (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/legiz-ru/Prizrak-Box/releases/latest/download/windows-arm64.zip',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Portable)',
                                        fa: 'ویندوز ARM (قابل حمل)',
                                        ru: 'Windows на ARM (Портативная)',
                                        zh: 'Windows on ARM（便携版）',
                                        fr: 'Windows on ARM (Portable)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Warning',
                                fa: 'هشدار',
                                ru: 'Предупреждение',
                                zh: '警告',
                                fr: 'Avertissement',
                            },
                            description: {
                                en: 'Run the program as an administrator.',
                                fa: 'برنامه را به عنوان مدیر اجرا کنید.',
                                ru: 'Запустите программу от имени администратора.',
                                zh: '以管理员身份运行程序。',
                                fr: 'Run the program as an administrator.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add the subscription automatically.',
                                fa: 'روی دکمه زیر کلیک کنید تا اشتراک به صورت خودکار افزوده شود.',
                                ru: 'Нажмите кнопку ниже, чтобы автоматически добавить подписку.',
                                zh: '点击下方按钮即可自动添加订阅。',
                                fr: 'Click the button below to add the subscription automatically.',
                            },
                            buttons: [
                                {
                                    link: 'prizrak-box://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the Get Link button in the upper right corner, copy the link. In Prizrak-Box, go to the Profiles section, click the + button, paste your copied link, and click Confirm.',
                                fa: 'اگر پس از کلیک بر روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در این صفحه، روی دکمه «دریافت پیوند» در گوشه بالا سمت راست کلیک کنید، پیوند را کپی کنید. در Prizrak-Box، به بخش «پروفایل‌ها» بروید، روی دکمه + کلیک کنید، پیوند کپی شده خود را جای‌گذاری کنید و روی «تأیید» کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Prizrak-Box перейдите в раздел Профили, нажмите кнопку +, вставьте вашу скопированную ссылку и нажмите Потдвердить.',
                                zh: '如果点击按钮后没有任何反应，请手动添加订阅。在此页面上，点击右上角的“获取链接”按钮，复制链接。在 Prizrak-Box 中，转到“配置文件”部分，点击 + 按钮，粘贴您复制的链接，然后点击“确认”。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. On this page, click the « Get Link » button in the upper right corner, copy the link. In Prizrak-Box, go to the « Profiles » section, click the + button, paste your copied link, and click « Confirm ».',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Select the added subscription in the Profiles section. You can choose the server country in the Proxy (🚀) section. Set the TUN switch to ON.',
                                fa: 'اشتراک افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. می‌توانید کشور سرور را در بخش Proxy (🚀) انتخاب کنید. سوئیچ TUN را روی حالت روشن قرار دهید.',
                                ru: 'Выберите добавленную подписку в разделе Профили. Выбрать страну сервера можно в разделе Прокси (🚀). Установите переключатель TUN в положение ВКЛ.',
                                zh: '在“配置文件”部分选择已添加的订阅。可在“代理 (🚀)”部分选择服务器国家。将 TUN 开关切换到开启。',
                                fr: 'Select the added subscription in the « Profiles » section. You can choose the server country in the « Proxy » (🚀) section. Set the « TUN » switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Happ',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/Happ-proxy/happ-desktop/releases/latest/download/setup-Happ.x64.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows',
                                        fa: 'ویندوز',
                                        ru: 'Windows',
                                        zh: 'Windows',
                                        fr: 'Windows',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮——应用将会打开，订阅会自动添加。',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Clash Verge',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Choose the version for your device, click the button below and install the app.',
                                fa: 'نسخه مناسب برای دستگاه خود را انتخاب کنید، دکمه زیر را فشار دهید و برنامه را نصب کنید',
                                ru: 'Выберите подходящую версию для вашего устройства, нажмите на кнопку ниже и установите приложение.',
                                zh: '选择适合您设备的版本，点击下方按钮并安装应用程序。',
                                fr: 'Choisis la version pour ton appareil, clique sur le bouton ci‑dessous et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_x64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows (Setup)',
                                        fa: 'ویندوز (نصب)',
                                        ru: 'Windows (Установщик)',
                                        zh: 'Windows（安装程序）',
                                        fr: 'Windows (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/clash-verge-rev/clash-verge-rev/releases/download/v2.4.4-rc/Clash.Verge_2.4.4-rc_arm64-setup.exe',
                                    type: 'external',
                                    text: {
                                        en: 'Windows on ARM (Setup)',
                                        fa: 'ویندوز ARM (نصب)',
                                        ru: 'Windows на ARM (Установщик)',
                                        zh: 'Windows on ARM（安装包）',
                                        fr: 'Windows on ARM (Setup)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Change language',
                                fa: 'تغییر زبان',
                                ru: 'Смена языка',
                                zh: '更改语言',
                                fr: 'Change language',
                            },
                            description: {
                                en: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                                fa: 'پس از راه‌اندازی برنامه، می‌توانید زبان را در تنظیمات تغییر دهید. در پنل سمت چپ، نماد چرخ دنده را پیدا کنید، سپس به Verge 设置 بروید و 语言设置 را انتخاب کنید.',
                                ru: 'После запуска приложения вы можете сменить язык в настройках. В левой панели найдите иконку шестеренки, далее ориентируйтесь на Verge 设置 и выберите пункт 语言设置.',
                                zh: '启动应用后，可以在设置中更改语言。在左侧面板找到齿轮图标，进入 Verge 设置，然后选择 语言设置。',
                                fr: 'After launching the app, you can change the language in settings. In the left panel, find the gear icon, then navigate to Verge 设置 and select 语言设置.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку',
                                zh: '点击下方按钮以添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous pour ajouter l’abonnement.',
                            },
                            buttons: [
                                {
                                    link: 'clash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add the subscription manually. Click the Get Link button in the top right corner of this page, copy the link. In Clash Verge, go to the Profiles section and paste the link in the text field, then click the Import button.',
                                fa: 'اگر پس از کلیک روی دکمه اتفاقی نیفتاد، اشتراک را به صورت دستی اضافه کنید. در گوشه بالا سمت راست این صفحه روی دکمه دریافت لینک کلیک کنید، لینک را کپی کنید. در Clash Verge به بخش پروفایل‌ها بروید و لینک را در فیلد متنی وارد کنید، سپس روی دکمه وارد کردن کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В Clash Verge перейдите в раздел Профили и вставьте ссылку в текстовое поле, затем нажмите на кнопку Импорт.',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在本页右上角点击获取链接按钮，复制链接。在 Clash Verge 的 Profiles 部分粘贴链接到文本框，然后点击导入按钮。',
                                fr: 'If nothing happens after clicking the button, add the subscription manually. Click the « Get Link » button in the top right corner of this page, copy the link. In Clash Verge, go to the « Profiles » section and paste the link in the text field, then click the « Import » button.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'You can select a server in the Proxy section, and enable VPN in the Settings section. Set the TUN Mode switch to ON.',
                                fa: 'می‌توانید در بخش پروکسی سرور را انتخاب کنید و در بخش تنظیمات VPN را فعال کنید. کلید TUN Mode را در حالت روشن قرار دهید.',
                                ru: 'Выбрать сервер можно в разделе Прокси, включить VPN можно в разделе Настройки. Установите переключатель TUN Mode в положение ВКЛ.',
                                zh: '您可以在代理部分选择服务器，在设置中启用 VPN。将 TUN 模式开关设置为开启。',
                                fr: 'You can select a server in the « Proxy » section, and enable VPN in the Settings section. Set the « TUN » Mode switch to ON.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        androidTV: {
            displayName: {
                en: 'Android TV',
                ru: 'Android TV',
                fa: 'Android TV',
                fr: 'Android TV',
                zh: 'Android TV',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-device-tv"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M16 3l-4 4l-4 -4" /></svg>',
            apps: [
                {
                    name: 'Happ',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in Google Play and install the app. Or install the app directly from the APK file if Google Play is not working.',
                                fa: 'صفحه را در Google Play باز کنید و برنامه را نصب کنید. یا برنامه را مستقیماً از فایل APK نصب کنید، اگر Google Play کار نمی کند.',
                                ru: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.',
                                zh: '在 Google Play 打开页面并安装应用。如果 Google Play 无法使用，可直接通过 APK 文件安装应用。',
                                fr: 'Ouvre la page dans Google Play et installe l’app. Si Google Play ne fonctionne pas, installe‑la directement via l’APK.',
                            },
                            buttons: [
                                {
                                    link: 'https://play.google.com/store/apps/details?id=com.happproxy',
                                    type: 'external',
                                    text: {
                                        en: 'Open in Google Play',
                                        fa: 'باز کردن در Google Play',
                                        ru: 'Открыть в Google Play',
                                        zh: '在 Google Play 打开',
                                        fr: 'Ouvre dans Google Play',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/Happ-proxy/happ-android/releases/latest/download/Happ.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Installation instructions',
                                fa: 'دستورالعمل نصب',
                                ru: 'Инструкции по установке',
                                zh: '安装说明',
                                fr: 'Installation instructions',
                            },
                            description: {
                                en: 'Detailed instructions to help you set up Happ on your device.',
                                fa: 'راهنمای دقیق برای کمک به تنظیم Happ روی دستگاه شما.',
                                ru: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.',
                                zh: '详细说明，帮助您在设备上设置 Happ。',
                                fr: 'Detailed instructions to help you set up Happ on your device.',
                            },
                            buttons: [
                                {
                                    link: 'https://www.happ.su/main/ru/faq/android-tv',
                                    type: 'external',
                                    text: {
                                        en: 'In Russian',
                                        fa: 'به زبان روسی',
                                        ru: 'На русском',
                                        zh: '俄语',
                                        fr: 'In Russian',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://www.happ.su/main/faq/android-tv',
                                    type: 'external',
                                    text: {
                                        en: 'In English',
                                        fa: 'به زبان انگلیسی',
                                        ru: 'На английском',
                                        zh: '英语',
                                        fr: 'In English',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription, if you opened the subscription page on your TV',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید، اگر صفحه اشتراک را روی تلویزیون باز کرده‌اید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре',
                                zh: '如果你已在电视上打开订阅页面，点击下方按钮以添加订阅',
                                fr: 'Click the button below to add subscription, if you opened the subscription page on your TV.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Open the app and connect to the server',
                                fa: 'برنامه را باز کنید و به سرور متصل شوید',
                                ru: 'Откройте приложение и подключитесь к серверу',
                                zh: '打开应用并连接到服务器',
                                fr: 'Ouvre l’app et connecte‑toi au serveur.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'FlClashX',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Download and install FlClash APK on your TV. Most modern TVs use ARMv8 (64-bit). If installation fails, try ARMv7 (32-bit). x86_64 is for TVs or boxes with Intel or AMD processors (rare).',
                                fa: 'دانلود و نصب FlClash APK روی تلویزیون شما. اکثر تلویزیون‌های جدید از ARMv8 (64 بیتی) استفاده می‌کنند. اگر نصب انجام نشد، ARMv7 (32 بیتی) را امتحان کنید. نسخه x86_64 مخصوص تلویزیون‌ها یا باکس‌هایی با پردازنده‌های اینتل یا AMD است (نادر).',
                                ru: 'Скачайте и установите FlClash APK на ваш телевизор. Большинство современных телевизоров используют ARMv8 (64-бит). Если установка не удалась, попробуйте ARMv7 (32-бит). x86_64 предназначен для ТВ или приставок с процессорами Intel или AMD (редко).',
                                zh: '在电视上下载并安装 FlClash APK。大多数现代电视使用 ARMv8（64 位）。如果安装失败，请尝试 ARMv7（32 位）。x86_64 适用于带有 Intel 或 AMD 处理器的电视或盒子（较少见）。',
                                fr: 'Download and install FlClash APK on your TV. Most modern TVs use ARMv8 (64-bit). If installation fails, try ARMv7 (32-bit). x86_64 is for TVs or boxes with Intel or AMD processors (rare).',
                            },
                            buttons: [
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-android-arm64-v8a.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK (ARMv8)',
                                        fa: 'دانلود APK (ARMv8)',
                                        ru: 'Скачать APK (ARMv8)',
                                        zh: '下载 APK (ARMv8)',
                                        fr: 'Download APK (ARMv8)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-android-armeabi-v7a.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK (ARMv7)',
                                        fa: 'دانلود APK (ARMv7)',
                                        ru: 'Скачать APK (ARMv7)',
                                        zh: '下载 APK (ARMv7)',
                                        fr: 'Download APK (ARMv7)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://github.com/pluralplay/FlClashX/releases/download/v0.2.1/FlClashX-0.2.1-android-x86_64.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK (x86_64)',
                                        fa: 'دانلود APK (x86_64)',
                                        ru: 'Скачать APK (x86_64)',
                                        zh: '下载 APK (x86_64)',
                                        fr: 'Download APK (x86_64)',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://club.dns-shop.ru/blog/t-132-televizoryi/43999-failyi-apk-dlya-umnyih-televizorov-na-android/?utm_referrer=https%3A%2F%2Fwww.google.com%2F',
                                    type: 'external',
                                    text: {
                                        en: 'How to install APK on TV',
                                        fa: 'نحوه نصب APK روی تلویزیون',
                                        ru: 'Как установить APK на телевизор',
                                        zh: '如何在电视上安装 APK',
                                        fr: 'How to install APK on TV',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'How to add a subscription on TV',
                                fa: 'نحوه افزودن اشتراک در تلویزیون',
                                ru: 'Как добавить подписку на телевизоре',
                                zh: '如何在电视上添加订阅',
                                fr: 'How to add a subscription on TV',
                            },
                            description: {
                                en: 'In the TV app, click the Add Profile button in the Profiles section, select Add from phone. On your phone, in the Profiles section, tap the three-dot menu and choose Send to TV.',
                                fa: 'در برنامه تلویزیون، روی دکمه افزودن پروفایل در بخش پروفایل‌ها کلیک کنید، گزینه افزودن از تلفن را انتخاب کنید. در تلفن، در بخش پروفایل‌ها روی منوی سه نقطه بزنید و گزینه ارسال به تلویزیون را انتخاب کنید.',
                                ru: 'В приложении на телевизоре нажмите кнопку Добавить профиль в разделе Профили, выберите пункт Добавить с телефона. На телефоне в разделе Профили нажмите кнопку с тремя точками и выберите пункт Отправить на ТВ.',
                                zh: '在电视应用中，在“配置文件”部分点击“添加配置文件”按钮，选择“从手机添加”。在手机的“配置文件”部分，点击三点菜单并选择“发送到电视”。',
                                fr: 'In the TV app, click the « Add Profile » button in the « Profiles » section, select « Add from phone ». On your phone, in the « Profiles » section, tap the three-dot menu and choose « Send to TV ».',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription, if you opened the subscription page on your TV',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید، اگر صفحه اشتراک را روی تلویزیون باز کرده‌اید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре',
                                zh: '如果你已在电视上打开订阅页面，点击下方按钮以添加订阅',
                                fr: 'Click the button below to add subscription, if you opened the subscription page on your TV.',
                            },
                            buttons: [
                                {
                                    link: 'flclashx://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'If the subscription is not added',
                                fa: 'اگر اشتراک در برنامه نصب نشده است',
                                ru: 'Если подписка не добавилась',
                                zh: '如果未添加订阅',
                                fr: 'Si l’abonnement ne s’ajoute pas',
                            },
                            description: {
                                en: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the Profiles section, click the + button, select the URL, paste your copied link and click Send',
                                fa: 'اگر بعد از کلیک روی دکمه هیچ اتفاقی نیفتاد، اشتراکی را به صورت دستی اضافه کنید. روی دکمه دریافت لینک در این صفحه در گوشه سمت راست بالا کلیک کنید، لینک را کپی کنید. در FlClash به بخش Profiles بروید، دکمه + را کلیک کنید، URL را انتخاب کنید، پیوند کپی شده خود را جایگذاری کنید و روی ارسال کلیک کنید.',
                                ru: 'Если после нажатия на кнопку ничего не произошло, добавьте подписку вручную. Нажмите на этой страницу кнопку Получить ссылку в правом верхнем углу, скопируйте ссылку. В FlClash перейдите в раздел Профили, нажмите кнопку +, выберите URL, вставьте вашу скопированную ссылку и нажмите Отправить',
                                zh: '如果点击按钮后没有反应，请手动添加订阅。在此页面右上角点击“获取链接”按钮，复制链接。在 FlClash 的“配置文件”部分，点击 + 按钮，选择 URL，粘贴你复制的链接并点击发送。',
                                fr: 'If nothing happens after clicking the button, add a subscription manually. Click the Get link button on this page in the upper right corner, copy the link. In FlClash, go to the « Profiles » section, click the + button, select the « URL », paste your copied link and click Send.',
                            },
                            buttons: [],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "Select the added profile in the Profiles section. In the Control Panel, click the Enable button in the bottom right corner. Once it's running, you can change the server you're connected to in the Proxy section.",
                                fa: 'پروفایل افزوده‌شده را در بخش پروفایل‌ها انتخاب کنید. در پنل کنترل، روی دکمه فعال‌سازی در گوشه پایین سمت راست کلیک کنید. پس از اجرا، می‌توانید در بخش پروکسی، سروری را که به آن متصل می‌شوید تغییر دهید.',
                                ru: 'Выберите добавленный профиль в разделе Профили. В Панели управления нажмите кнопку включить в правом нижнем углу. После запуска в разделе Прокси вы можете изменить выбор сервера к которому вас подключит. ',
                                zh: '在“配置文件”部分选择已添加的配置文件。在控制面板右下角点击启用按钮。运行后，你可以在“代理”部分更改所连接的服务器。',
                                fr: "Select the added profile in the « Profiles » section. In the Control Panel, click the « Enable » button in the bottom right corner. Once it's running, you can change the server you're connected to in the « Proxy » section.",
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'vpn4tv',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in Google Play and install the app. Or install the app directly from the APK file if Google Play is not working.',
                                fa: 'صفحه را در Google Play باز کنید و برنامه را نصب کنید. یا برنامه را مستقیماً از فایل APK نصب کنید، اگر Google Play کار نمی کند.',
                                ru: 'Откройте страницу в Google Play и установите приложение. Или установите приложение из APK файла напрямую, если Google Play не работает.',
                                zh: '在 Google Play 打开页面并安装应用。如果 Google Play 无法使用，也可以直接通过 APK 文件安装此应用。',
                                fr: 'Ouvre la page dans Google Play et installe l’app. Si Google Play ne fonctionne pas, installe‑la directement via l’APK.',
                            },
                            buttons: [
                                {
                                    link: 'https://play.google.com/store/apps/details?id=com.vpn4tv.hiddify',
                                    type: 'external',
                                    text: {
                                        en: 'Open in Google Play',
                                        fa: 'باز کردن در Google Play',
                                        ru: 'Открыть в Google Play',
                                        zh: '在 Google Play 打开',
                                        fr: 'Ouvre dans Google Play',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://vpn4tv.com/download/vpn4tv.apk',
                                    type: 'external',
                                    text: {
                                        en: 'Download APK',
                                        fa: 'دانلود APK',
                                        ru: 'Скачать APK',
                                        zh: '下载 APK',
                                        fr: 'Télécharge l’APK',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Installation instructions',
                                fa: 'دستورالعمل نصب',
                                ru: 'Инструкции по установке',
                                zh: '安装说明',
                                fr: 'Installation instructions',
                            },
                            description: {
                                en: 'Detailed instructions to help you set up VPN4TV on your device.',
                                fa: 'راهنمای دقیق برای کمک به تنظیم VPN4TV روی دستگاه شما.',
                                ru: 'Подробные инструкции, чтобы помочь вам настроить VPN4TV на вашем устройстве.',
                                zh: '详细说明，帮助您在设备上设置 VPN4TV。',
                                fr: 'Detailed instructions to help you set up VPN4TV on your device.',
                            },
                            buttons: [
                                {
                                    link: 'https://vpn4tv.com/quick-guide.html',
                                    type: 'external',
                                    text: {
                                        en: 'Quick Guide',
                                        fa: 'راهنمای سریع',
                                        ru: 'Краткое руководство',
                                        zh: '快速指南',
                                        fr: 'Quick Guide',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://vpn4tv.com/sber.html',
                                    type: 'external',
                                    text: {
                                        en: 'Sber Box Guide',
                                        fa: 'راهنمای Sber Box',
                                        ru: 'Инструкция для Sber Box',
                                        zh: 'Sber Box 指南',
                                        fr: 'Sber Box Guide',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription, if you opened the subscription page on your TV',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید، اگر صفحه اشتراک را روی تلویزیون باز کرده‌اید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре',
                                zh: '如果你已在电视上打开订阅页面，点击下方按钮以添加订阅',
                                fr: 'Click the button below to add subscription, if you opened the subscription page on your TV.',
                            },
                            buttons: [
                                {
                                    link: 'hiddify://import/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Open the app and connect to the server',
                                fa: 'برنامه را باز کنید و به سرور متصل شوید',
                                ru: 'Откройте приложение и подключитесь к серверу',
                                zh: '打开应用并连接到服务器',
                                fr: 'Ouvre l’app et connecte‑toi au serveur.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
        appleTV: {
            displayName: {
                en: 'Apple TV',
                ru: 'Apple TV',
                fa: 'Apple TV',
                fr: 'Apple TV',
                zh: 'Apple TV',
            },
            svgIcon:
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-device-tv"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M16 3l-4 4l-4 -4" /></svg>',
            apps: [
                {
                    name: 'Happ',
                    featured: true,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in the App Store on your Apple TV and install the app. Launch it, allow VPN configuration if prompted, and enter your passcode if required.',
                                fa: 'صفحه را در App Store بر روی Apple TV باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در صورت درخواست مجوز پیکربندی VPN را بدهید و در صورت نیاز رمز عبور خود را وارد کنید.',
                                ru: 'Откройте страницу в App Store на Apple TV и установите приложение. Запустите его, предоставьте разрешение на VPN-конфигурацию, если потребуется, и введите свой пароль.',
                                zh: '在 Apple TV 的 App Store 打开页面并安装应用。启动后，如有提示请允许 VPN 配置，并在需要时输入您的密码。',
                                fr: 'Open the page in the App Store on your Apple TV and install the app. Launch it, allow VPN configuration if prompted, and enter your passcode if required.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/us/app/happ-proxy-utility-for-tv/id6748297274',
                                    type: 'external',
                                    text: {
                                        en: 'App Store',
                                        fa: 'App Store',
                                        ru: 'App Store',
                                        zh: 'App Store',
                                        fr: 'App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Installation instructions',
                                fa: 'دستورالعمل نصب',
                                ru: 'Инструкции по установке',
                                zh: '安装说明',
                                fr: 'Installation instructions',
                            },
                            description: {
                                en: 'Detailed instructions to help you set up Happ on your device.',
                                fa: 'راهنمای دقیق برای کمک به تنظیم Happ روی دستگاه شما.',
                                ru: 'Подробные инструкции, чтобы помочь вам настроить Happ на вашем устройстве.',
                                zh: '详细说明，帮助您在设备上设置 Happ。',
                                fr: 'Detailed instructions to help you set up Happ on your device.',
                            },
                            buttons: [
                                {
                                    link: 'https://www.happ.su/main/ru/faq/android-tv',
                                    type: 'external',
                                    text: {
                                        en: 'In Russian',
                                        fa: 'به زبان روسی',
                                        ru: 'На русском',
                                        zh: '俄语',
                                        fr: 'In Russian',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                                {
                                    link: 'https://www.happ.su/main/faq/android-tv',
                                    type: 'external',
                                    text: {
                                        en: 'In English',
                                        fa: 'به زبان انگلیسی',
                                        ru: 'На английском',
                                        zh: '英语',
                                        fr: 'In English',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below to add subscription, if you opened the subscription page on your TV',
                                fa: 'برای افزودن اشتراک روی دکمه زیر کلیک کنید، اگر صفحه اشتراک را روی تلویزیون باز کرده‌اید',
                                ru: 'Нажмите кнопку ниже, чтобы добавить подписку, если вы открыли страницу подписки на телевизоре',
                                zh: '如果你已在电视上打开订阅页面，点击下方按钮以添加订阅',
                                fr: 'Click the button below to add subscription, if you opened the subscription page on your TV.',
                            },
                            buttons: [
                                {
                                    link: 'happ://add/{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'Open the app and connect to the server',
                                fa: 'برنامه را باز کنید و به سرور متصل شوید',
                                ru: 'Откройте приложение и подключитесь к серверу',
                                zh: '打开应用并连接到服务器',
                                fr: 'Ouvre l’app et connecte‑toi au serveur.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Shadowrocket',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the page in App Store and install the app. Launch it, in the VPN configuration permission window click Allow and enter your passcode.',
                                fa: 'صفحه را در App Store باز کنید و برنامه را نصب کنید. آن را اجرا کنید، در پنجره مجوز پیکربندی VPN روی Allow کلیک کنید و رمز عبور خود را وارد کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение. Запустите его, в окне разрешения VPN-конфигурации нажмите Allow и введите свой пароль.',
                                zh: '在 App Store 打开页面并安装应用。启动应用后，在 VPN 配置权限窗口点击“允许”，并输入您的密码。',
                                fr: 'Ouvre la page de l’App Store et installe l’app. Lance-la ; dans la fenêtre d’autorisation de configuration VPN, appuie sur « Allow » puis entre ton code.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/ru/app/shadowrocket/id932747118',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Click the button below — the app will open and the subscription will be added automatically',
                                fa: 'برای افزودن خودکار اشتراک روی دکمه زیر کلیک کنید - برنامه باز خواهد شد',
                                ru: 'Нажмите кнопку ниже — приложение откроется, и подписка добавится автоматически.',
                                zh: '点击下方按钮，应用将会打开，并自动添加订阅',
                                fr: 'Clique sur le bouton ci‑dessous — l’app s’ouvrira et l’abonnement sera ajouté automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'sub://{{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-settings"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add routing rules',
                                fa: 'قوانین مسیریابی را اضافه کنید',
                                ru: 'Добавить правила маршрутизации',
                                zh: '添加路由规则',
                                fr: 'Ajouter des règles de routage',
                            },
                            description: {
                                en: 'By adding routing, internal websites and applications are not passed through the VPN',
                                fa: 'با اضافه کردن مسیریابی, وب سایت ها و برنامه های داخلی از VPN عبور داده نمیشود',
                                ru: 'При добавлении роутинга, сайты внутри страны будут открываться без VPN',
                                zh: '添加路由后，国内网站和应用将不会通过 VPN 访问',
                                fr: 'En ajoutant un routage, les sites et apps internes ne passent pas par le VPN.',
                            },
                            buttons: [
                                {
                                    link: 'https://cdn.sm1ky.pl/s/eB4eYAxSNGk8gja/download',
                                    type: 'external',
                                    text: {
                                        en: 'Add rules for Russia',
                                        fa: 'قوانین روسیه را اضافه کنید',
                                        ru: 'Добавить правила для России',
                                        zh: '添加俄罗斯规则',
                                        fr: 'Ajouter des règles pour la Russie',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: "In the main section, click the large power button in the center to connect to VPN. Don't forget to select a server from the server list. If needed, choose another server from the server list.",
                                fa: 'در بخش اصلی، دکمه بزرگ روشن/خاموش در مرکز را برای اتصال به VPN کلیک کنید. فراموش نکنید که یک سرور را از لیست سرورها انتخاب کنید. در صورت نیاز، سرور دیگری را از لیست سرورها انتخاب کنید.',
                                ru: 'В главном разделе нажмите большую кнопку включения в центре для подключения к VPN. Не забудьте выбрать сервер в списке серверов. При необходимости выберите другой сервер из списка серверов.',
                                zh: '在主界面，点击中央的大电源按钮以连接 VPN。不要忘记从服务器列表中选择服务器。如有需要，可选择其它服务器。',
                                fr: 'Dans la section principale, appuie sur le grand bouton central pour te connecter au VPN. N’oublie pas de choisir un serveur dans la liste ; si besoin, choisis‑en un autre.',
                            },
                            buttons: [],
                        },
                    ],
                },
                {
                    name: 'Stash',
                    featured: false,
                    blocks: [
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" /><path d="M7 11l5 5l5 -5" /><path d="M12 4l0 12" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'App Installation',
                                ru: 'Установка приложения',
                                fa: 'نصب برنامه',
                                fr: "Installation de l'application",
                                zh: '应用安装',
                            },
                            description: {
                                en: 'Open the App Store page and install the app.',
                                fa: 'صفحه App Store را باز کرده و برنامه را نصب کنید.',
                                ru: 'Откройте страницу в App Store и установите приложение.',
                                zh: '打开 App Store 页面并安装应用。',
                                fr: 'Ouvre la page de l’App Store et installe l’app.',
                            },
                            buttons: [
                                {
                                    link: 'https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349',
                                    type: 'external',
                                    text: {
                                        en: 'Open in App Store',
                                        fa: 'باز کردن در App Store',
                                        ru: 'Открыть в App Store',
                                        zh: '在 App Store 打开',
                                        fr: 'Ouvre dans l’App Store',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-external-link"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" /><path d="M11 13l9 -9" /><path d="M15 4h5v5" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-cloud-download"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 18a3.5 3.5 0 0 0 0 -7h-1a5 4.5 0 0 0 -11 -2a4.6 4.4 0 0 0 -2.1 8.4" /><path d="M12 13l0 9" /><path d="M9 19l3 3l3 -3" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Add Subscription',
                                ru: 'Добавление подписки',
                                fa: 'اضافه کردن اشتراک',
                                fr: 'Ajouter une souscription',
                                zh: '添加订阅',
                            },
                            description: {
                                en: 'Tap the button below — Stash will open and the configuration will be added automatically.',
                                fa: 'روی دکمه زیر ضربه بزنید — برنامه Stash باز می‌شود و پیکربندی به‌صورت خودکار اضافه خواهد شد.',
                                ru: 'Нажмите кнопку ниже — приложение Stash откроется, и конфигурация будет добавлена автоматически.',
                                zh: '点击下方按钮，Stash 将会打开并自动添加配置。',
                                fr: 'Appuie sur le bouton ci-dessous — Stash s’ouvrira et la configuration sera ajoutée automatiquement.',
                            },
                            buttons: [
                                {
                                    link: 'stash://install-config?url={{SUBSCRIPTION_LINK}}',
                                    type: 'subscriptionLink',
                                    text: {
                                        en: 'Add Subscription',
                                        fa: 'اضافه کردن اشتراک',
                                        ru: 'Добавить подписку',
                                        zh: '添加订阅',
                                        fr: 'Ajouter une souscription',
                                    },
                                    svgIcon:
                                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plus"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 5v14" /><path d="M5 12h14" /></svg>',
                                },
                            ],
                        },
                        {
                            svgIcon:
                                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
                            svgIconColor: 'cyan',
                            title: {
                                en: 'Connect and use',
                                ru: 'Подключение и использование',
                                fa: 'متصل شوید و استفاده کنید',
                                fr: 'Se connecter et utiliser',
                                zh: '连接并使用',
                            },
                            description: {
                                en: 'On the main screen, tap the Start button. When prompted, allow adding VPN configurations. After the profile is activated, open the Policy section and select the country you want to connect through.',
                                fa: 'در صفحه اصلی روی دکمه Start بزنید. در صورت نمایش درخواست، مجوز افزودن پیکربندی VPN را تأیید کنید. پس از فعال شدن پروفایل، وارد بخش Policy شوید و کشور موردنظر برای اتصال را انتخاب کنید.',
                                ru: 'На главном экране нажмите кнопку «Запуск». В появившемся окне разрешите добавление конфигураций VPN. После активации профиля перейдите в раздел «Политика» и выберите страну подключения.',
                                zh: '在主界面点击「Start」按钮。在提示时允许添加 VPN 配置。配置启用后，进入「Policy（策略）」部分并选择要连接的国家。',
                                fr: 'Sur l’écran principal, appuie sur le bouton « Start ». Autorise ensuite l’ajout de la configuration VPN. Une fois le profil activé, ouvre la section « Policy » et choisis le pays de connexion.',
                            },
                            buttons: [],
                        },
                    ],
                },
            ],
        },
    },
};

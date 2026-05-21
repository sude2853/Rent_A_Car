export interface NavigationModel {
    title: string;
    url?: string;
    icon?: string;
    haveSubNav?: boolean;
    subNavs?: NavigationModel[],
    permission: string;
}

export const navigations: NavigationModel[] = [
    {
        title: 'Dashboard',
        url: '/',
        icon: 'bi-speedometer2',
        permission: 'dashboard:view'
    },
    {
        title: 'Rezervasyonlar',
        url: '/reservations',
        icon: 'bi-calendar-check',
        permission: 'reservation:view'
    },
    {
        title: '\u015eubeler',
        url: '/branches',
        icon: 'bi-buildings',
        permission: 'branch:view'
    },
    {
        title: 'Roller',
        url: '/roles',
        icon: 'bi-clipboard2-check',
        permission: 'role:view'
    },
    {
        title: 'Kullan\u0131c\u0131lar',
        url: '/users',
        icon: 'bi-people',
        permission: 'user:view'
    },
    {
        title: 'M\u00fc\u015fteriler',
        url: '/customers',
        icon: 'bi-person-vcard',
        permission: 'customer:view'
    },
    {
        title: 'Kategoriler',
        url: '/categories',
        icon: 'bi-tags',
        permission: 'category:view'
    },
    {
        title: 'Ara\u00e7lar',
        url: '/vehicles',
        icon: 'bi-car-front',
        permission: 'vehicle:view'
    },
    {
        title: 'G\u00fcvence Paketleri',
        url: '/protection-packages',
        icon: 'bi-shield-check',
        permission: 'protection_package:view'
    },
    {
        title: 'Ekstralar',
        url: '/extra',
        icon: 'bi-plus-square',
        permission: 'extra:view'
    }
];

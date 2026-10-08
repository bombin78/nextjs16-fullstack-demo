export type ComponentCategory = {
    id: string;
    name: string;
    icon: string;
}

export type Component = {
    id: string;
    name: string;
    price: number;
    type: ComponentType;
    socket: string | null
}

export type ComponentType = 'cpu' | 'gpu' | 'ram' | 'ssd' | 'motherboard' | 'psu' | 'case' | 'cooler'

// Маппинг категорий: перевод id категории в тип компонента в базе
export const categoryIdToDbType: Record<string, ComponentType> = {
    cpu: 'cpu',
    gpu: 'gpu',
    ram: 'ram',
    storage: 'ssd',
    motherboard: 'motherboard',
    psu: 'psu',
    case: 'case',
    cooling: 'cooler'
}

// Маппинг категорий: перевод типа компонента в базе в id категории
export const dbTypeToCategoryId: Record<ComponentType, string> = {
    cpu: 'cpu',
    gpu: 'gpu',
    ram: 'ram',
    ssd: 'storage',
    motherboard: 'motherboard',
    psu: 'psu',
    case: 'case',
    cooler: 'cooling'
}
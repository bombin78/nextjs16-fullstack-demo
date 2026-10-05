// 3:19:27
'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogTrigger
} from '@/components/ui/dialog';

import { Component, ComponentCategory } from "@/lib/types";
// Иконки из библиотеки lucide-react. Каждая иконка — компонент React, который рисует SVG-картинку.
import { Box, Cpu, Fan, HardDrive, MemoryStick, Monitor, Plus, Server, Zap } from "lucide-react";
import { memo, useState } from "react";
import { Button } from '@/components/ui/button';
import { AddComponentDialogContent } from './add-component-dialog';
import { InfoTooltip } from '@/components/info-tooltip';

// Маппинг иконок: перевод названия иконки из componentCategories в компонент иконки из lucide-react
// Пример: iconMap['Cpu'] → компонент Cpu
const iconMap: Record<ComponentCategory['icon'], React.ElementType> = {
    Cpu,
    Monitor,
    Server,
    MemoryStick,
    HardDrive,
    Zap,
    Box,
    Fan
};

type CategoryRow = {
    id: string;
    name: string;
    icon: string;
}

type Props = {
    components: CategoryRow[];
    selectedByCategory: Record<string, Component | null>;
    onSelectedComponent: (categoryId: string, component: Component | null) => void
}

// REVIEW: [Tutorial]
export const TableParts = memo(function TableParts({
// export function TableParts({
    components,
    selectedByCategory,
    onSelectedComponent
}: Props){
    const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

    // Пример: selectedByCategory = {
    //      cpu: { id: '...', name: 'Intel Core i5-13600K', price: 25990, type: 'cpu', socket: 'LGA1700' },
    //      gpu: { id: '...', name: 'NVIDIA RTX 4070 Ti', price: 85990, type: 'gpu', socket: null }
    // }
    // Object.values берёт только значения свойств объекта, без ключей, и возвращает их массивом:
    // [{ name: 'Intel Core i5-13600K', price: 25990, ... }, { name: 'NVIDIA RTX 4070 Ti', price: 85990, ... }]
    // reduce складывает price всех элементов: 25990 + 85990 = 111980
    const totalPrice = Object.values(selectedByCategory).reduce(
        (sum, component) => sum + (component?.price ?? 0),
        0
    );

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className='w-[100px]'>Компонент</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Модель</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead className='text-right'>Действия</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    // components — это componentCategories из lib/constants.ts, его передаёт CurrentBuild:
                    // components: [
                    //      { id: 'cpu', name: 'CPU', icon: 'Cpu' },
                    //      { id: 'gpu', name: 'Видеокарта', icon: 'Monitor' },
                    //      { id: 'motherboard', name: 'Материнская плата', icon: 'Server' },
                    //      ... всего 8 категорий
                    // ]
                    components.map(category => {
                        // Пример: category.icon = 'Cpu' → Icon = компонент Cpu
                        const Icon = iconMap[category.icon];
                        // Пример: category.id = 'cpu'
                        // процессор выбран: selected = { 
                        //      id: '...', 
                        //      name: 'Intel Core i5-13600K', 
                        //      price: 25990, 
                        //      type: 'cpu', 
                        //      socket: 'LGA1700' 
                        // }
                        // процессор не выбран: selected = undefined
                        const selected = selectedByCategory[category.id];

                        return (
                            <TableRow key={category.id} className='my-2'>
                                <TableCell>
                                    <div className="flex items-center">
                                        <Icon className="h-5 w-5 mr-1"/>
                                    </div>
                                </TableCell>
                                <TableCell className='font-bold'>
                                    {category.name}
                                        <InfoTooltip>
                                            {category.id}
                                        </InfoTooltip>  
                                    </TableCell>
                                <TableCell>{selected?.name ?? '-'}</TableCell>
                                <TableCell>{selected?.price ?? '-'}</TableCell>
                                <TableCell className='text-right'>
                                    {/* Модальное окно "Добавить компонент - ..." */}
                                    <Dialog
                                        open={openCategoryId === category.id}
                                        onOpenChange={(open) => setOpenCategoryId(open ? category.id : null)}
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                <Plus className='h-4 w-4 mr-1'/>
                                                { selected ? 'Изменить' : 'Добавить'}
                                            </Button>
                                        </DialogTrigger>
                                        <AddComponentDialogContent
                                            categoryId={category.id}
                                            categoryName={category.name}
                                            onSelect={
                                                (component) => {
                                                    onSelectedComponent(category.id, component);
                                                    setOpenCategoryId(null)
                                                }
                                            }
                                        />
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        )
                    })
                }
            </TableBody>
            <TableFooter>
                <TableRow>
                    {/* ячейку растягиваем на 5 столбцов (colSpan={5}), потому что выше их 5ть */}
                    <TableCell colSpan={5}>
                        <p className="font-medium">Цена сборки:</p>
                        <p className="font-large text-gray500">
                            {/* Форматирует число по русским правилам: разряды через пробел, дробная часть через запятую.
                                Пример: 111980 → '111 980', 1234.5 → '1 234,5' */}
                            {new Intl.NumberFormat('ru-Ru').format(totalPrice)}
                        </p>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
});
// };

import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { CreateRuleDto, UpdateRuleDto } from './dto/return-rule.dto';

const DEFAULT_RULES = [
  { codigo: 'SIZE_SMALL',    label: 'Demasiado pequeño',                       grupo: 'Talla y expectativa',  plazosDias: 5,  requiereEvidencia: false, orden: 1 },
  { codigo: 'SIZE_LARGE',    label: 'Demasiado grande',                        grupo: 'Talla y expectativa',  plazosDias: 5,  requiereEvidencia: false, orden: 2 },
  { codigo: 'NOT_EXPECTED',  label: 'No es lo que esperaba',                   grupo: 'Talla y expectativa',  plazosDias: 5,  requiereEvidencia: false, orden: 3 },
  { codigo: 'LATE_DELIVERY', label: 'Retraso en la entrega — ya no lo quiero', grupo: 'Entrega y despacho',   plazosDias: 5,  requiereEvidencia: false, orden: 4 },
  { codigo: 'WRONG_ITEM',    label: 'Se entregó artículo errado',              grupo: 'Entrega y despacho',   plazosDias: 5,  requiereEvidencia: true,  orden: 5 },
  { codigo: 'SEAM_DEFECT',   label: 'Defecto de costura',                      grupo: 'Calidad del producto', plazosDias: 30, requiereEvidencia: true,  orden: 6 },
  { codigo: 'SHRUNK',        label: 'Se encogió',                              grupo: 'Calidad del producto', plazosDias: 30, requiereEvidencia: true,  orden: 7 },
  { codigo: 'COLOR_LOSS',    label: 'Perdió el color',                         grupo: 'Calidad del producto', plazosDias: 30, requiereEvidencia: true,  orden: 8 },
];

@Injectable()
export class ReturnRulesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.causalDevolucion.count();
    if (count === 0) {
      await this.prisma.causalDevolucion.createMany({ data: DEFAULT_RULES });
    }
  }

  async getActiveRules() {
    return this.prisma.causalDevolucion.findMany({
      where: { activo: true },
      select: { codigo: true, label: true, grupo: true, plazosDias: true, requiereEvidencia: true },
      orderBy: [{ orden: 'asc' }, { grupo: 'asc' }],
    });
  }

  async listAll() {
    return this.prisma.causalDevolucion.findMany({
      orderBy: [{ orden: 'asc' }, { grupo: 'asc' }],
    });
  }

  async create(dto: CreateRuleDto) {
    const exists = await this.prisma.causalDevolucion.findUnique({ where: { codigo: dto.codigo } });
    if (exists) throw new ConflictException(`Ya existe una causal con el código ${dto.codigo}`);
    return this.prisma.causalDevolucion.create({ data: dto });
  }

  async update(id: string, dto: UpdateRuleDto) {
    const rule = await this.prisma.causalDevolucion.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Causal no encontrada');
    return this.prisma.causalDevolucion.update({ where: { id }, data: dto });
  }
}

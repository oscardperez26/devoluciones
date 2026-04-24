import { Injectable, NotFoundException } from '@nestjs/common';
import { ReturnRulesService } from '../return-rules/return-rules.service';
import { OrdersRepository } from './orders.repository';
import { ReturnEligibilityService } from './return-eligibility/return-eligibility.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly eligibilityService: ReturnEligibilityService,
    private readonly returnRulesService: ReturnRulesService,
  ) {}

  async getOrderWithEligibility(orderId: string, today: Date = new Date()) {
    const [pedido, activeRules] = await Promise.all([
      this.ordersRepository.findWithItemsAndReturns(orderId),
      this.returnRulesService.getActiveRules(),
    ]);

    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const orderContext = {
      fechaEntrega: pedido.fechaEntrega,
      fechaCompra: pedido.fechaCompra,
    };

    const items = pedido.items.map((item) => {
      const eligibility = this.eligibilityService.getItemEligibility(
        item,
        orderContext,
        today,
        activeRules,
      );

      return {
        id: item.id,
        sku: item.sku,
        productName: item.nombreProducto,
        size: item.talla,
        color: item.color,
        unitPrice: Number(item.precioUnitario),
        imageUrl: item.urlImagen,
        ...eligibility,
      };
    });

    return {
      order: {
        id: pedido.id,
        orderNumber: pedido.numeroPedido,
        deliveredAt: pedido.fechaEntrega?.toISOString() ?? null,
      },
      items,
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './infrastructure/database/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    pedido: {
      count: jest.fn().mockResolvedValue(1),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return backend status and total pedidos', async () => {
      await expect(appController.getHello()).resolves.toEqual({
        message: 'Backend funcionando con NestJS + Prisma',
        totalPedidos: 1,
      });
    });
  });
});
